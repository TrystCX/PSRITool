const ENEMY_TEXT_NAMES = ['特异', '飞行', '频次', '元素', '持续', '隐匿', '折射', '复苏', '致命'];
let enemyTextTemplates;

function loadEnemyTextTemplates() {
  if (!enemyTextTemplates) enemyTextTemplates = Promise.all(ENEMY_TEXT_NAMES.map(name => new Promise(resolve => {
    if (!ENEMY_TEXT_IMAGES[name]) { resolve(null); return; }
    const image = new Image();
    image.onerror = () => resolve(null);
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let left = canvas.width, top = canvas.height, right = 0, bottom = 0;
      for (let y = 0; y < canvas.height; y++) for (let x = Math.floor(canvas.width * .3); x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        if (pixels[index] > 170 && pixels[index + 1] > 170 && pixels[index + 2] > 170) {
          left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
        }
      }
      if (right <= left || bottom <= top) { resolve(null); return; }
      const width = Math.round((right - left + 1) * 20 / (bottom - top + 1));
      const resized = document.createElement('canvas'); resized.width = width; resized.height = 20;
      const resizedContext = resized.getContext('2d', { willReadFrequently: true });
      resizedContext.drawImage(canvas, left, top, right - left + 1, bottom - top + 1, 0, 0, width, 20);
      const data = resizedContext.getImageData(0, 0, width, 20).data;
      const mask = Uint8Array.from({ length: width * 20 }, (_, index) => data[index * 4] > 150 ? 1 : 0);
      resolve({ name, width, mask });
    };
    image.src = 'data:image/png;base64,' + ENEMY_TEXT_IMAGES[name];
  })));
  return enemyTextTemplates;
}

async function detectEnemyText(image) {
  const templates = (await loadEnemyTextTemplates()).filter(Boolean);
  if (!templates.length) return { groups: [], complete: false };
  const reference = templates[0];
  const prefixWidth = Math.round(reference.width * .66);
  const points = [];
  for (let y = 1; y < 19; y++) for (let x = 0; x < prefixWidth; x++) if (reference.mask[y * reference.width + x]) points.push([x, y]);
  const samples = Array.from({ length: 40 }, (_, index) => points[Math.floor(index * points.length / 40)]);
  const matches = [];
  const anchors = [];
  const base = Math.min(1, 1600 / image.naturalWidth);
  for (const factor of [.5, .63, .8, .9, .94, 1, 1.1, 1.25, 1.6, 2]) {
    const scale = base * factor;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
    if (canvas.width < reference.width || canvas.height < 20) continue;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const width = canvas.width, height = canvas.height;
    const mask = Uint8Array.from({ length: width * height }, (_, index) => {
      const p = index * 4;
      return pixels[p] > 150 && pixels[p + 1] > 150 && pixels[p + 2] > 150 ? 1 : 0;
    });
    for (let y = 0; y <= height - 20; y += 2) for (let x = 0; x <= width - reference.width; x += 2) {
      let hits = 0;
      for (let index = 0; index < samples.length; index++) {
        const [dx, dy] = samples[index];
        hits += mask[(y + dy) * width + x + dx];
        if (hits + samples.length - index - 1 < 26) break;
      }
      if (hits < 26) continue;
      let prefixIntersection = 0, prefixUnion = 0;
      for (let ty = 0; ty < 20; ty++) for (let tx = 0; tx < prefixWidth; tx++) {
        const expected = reference.mask[ty * reference.width + tx], actual = mask[(y + ty) * width + x + tx];
        prefixIntersection += expected & actual; prefixUnion += expected | actual;
      }
      if (prefixIntersection / Math.max(1, prefixUnion) < .43) continue;
      const aligned = [];
      for (let shiftY = -2; shiftY <= 2; shiftY++) for (let shiftX = -2; shiftX <= 2; shiftX++) {
        if (x + shiftX < 0 || y + shiftY < 0 || y + shiftY + 20 > height) continue;
        let overlap = 0, combined = 0;
        for (let ty = 0; ty < 20; ty++) for (let tx = 0; tx < prefixWidth; tx++) {
          const expected = reference.mask[ty * reference.width + tx], actual = mask[(y + shiftY + ty) * width + x + shiftX + tx];
          overlap += expected & actual; combined += expected | actual;
        }
        aligned.push({ x: x + shiftX, y: y + shiftY, score: overlap / Math.max(1, combined) });
      }
      aligned.sort((a, b) => b.score - a.score);
      const origin = aligned[0];
      if (origin.score < .55) continue;
      anchors.push({ x: origin.x / scale, y: origin.y / scale, height: 20 / scale, score: origin.score });
      let best = null;
      let second = null;
      for (const template of templates) {
        let typeScore = 0;
        for (let offsetY = -2; offsetY <= 2; offsetY++) for (let offsetX = -3; offsetX <= 3; offsetX++) {
          if (origin.x + offsetX < 0 || origin.x + offsetX + template.width > width || origin.y + offsetY < 0 || origin.y + offsetY + 20 > height) continue;
          let intersection = 0, union = 0;
          for (let ty = 0; ty < 20; ty++) for (let tx = prefixWidth; tx < template.width; tx++) {
            const expected = template.mask[ty * template.width + tx], actual = mask[(origin.y + offsetY + ty) * width + origin.x + offsetX + tx];
            intersection += expected & actual; union += expected | actual;
          }
          const score = intersection / Math.max(1, union);
          typeScore = Math.max(typeScore, score);
        }
        if (!best || typeScore > best.score) { second = best; best = { name: template.name, score: typeScore }; }
        else if (!second || typeScore > second.score) second = { name: template.name, score: typeScore };
      }
      if (best && best.score >= .6 && best.score - (second?.score || 0) >= .06) matches.push({ ...best, x: origin.x / scale, y: origin.y / scale, height: 20 / scale });
    }
  }
  matches.sort((a, b) => b.score - a.score);
  const distinct = [];
  for (const match of matches) if (!distinct.some(other => Math.abs(other.y - match.y) < Math.max(other.height, match.height))) distinct.push(match);
  distinct.sort((a, b) => a.y - b.y);
  anchors.sort((a, b) => b.score - a.score);
  const distinctAnchors = [];
  for (const anchor of anchors) if (!distinctAnchors.some(other => Math.abs(other.y - anchor.y) < Math.max(other.height, anchor.height))) distinctAnchors.push(anchor);
  const groups = distinct.map(match => match.name);
  return { groups, complete: groups.length >= 2 && groups.length <= 3 && distinctAnchors.length === groups.length && new Set(groups).size === groups.length };
}
