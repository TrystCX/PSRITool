const fs = require('fs');
const path = require('path');

const folder = __dirname;
const htmlPath = path.join(folder, 'index.html');
const tempPath = path.join(folder, 'index.html.sync-tmp');
const professions = { MEDIC: '医疗', WARRIOR: '近卫', SNIPER: '狙击', CASTER: '术师', SPECIAL: '特种', TANK: '重装', SUPPORT: '辅助', PIONEER: '先锋' };
const names = values => (values || []).map(value => value && value.name).filter(Boolean);

try {
  const raw = JSON.parse(fs.readFileSync(path.join(folder, 'all_guides.json'), 'utf8').replace(/^\uFEFF/, ''));
  if (!raw || !Array.isArray(raw.guides) || raw.guides.some(guide => !guide || guide.guideId == null)) throw new Error('all_guides.json 格式不正确：需要包含 guides 数组和每篇攻略的 guideId');
  const guides = raw.guides.map(guide => ({
    i: String(guide.guideId), t: guide.title || '', a: (guide.author && guide.author.nickname) || '',
    c: guide.collected || 0, l: guide.liked || 0, v: guide.viewed || 0, s: guide.applicableScope || '',
    b: names(guide.bonds),
    st: (guide.strategies || []).map(strategy => [strategy.name || '', strategy.initiatorName || '', strategy.hp || 0, strategy.effect || '']),
    fc: ((guide.formation && guide.formation.chars) || []).map(character => [character.name || '', character.mergeLevel || 0, professions[character.profession] || character.profession || '', character.skillName || '', character.moduleName || '']),
    ph: (guide.phases || []).map(phase => {
      const bonds = phase.bonds || {};
      return [phase.startRound, phase.endRound, (phase.chars || []).map(character => [character.name || '', character.mergeLevel || 0]), (phase.items || []).map(item => [item.name || '', item.shopLevel || 0, item.purchasePrice || 0, '']), {season: names(bonds.season), regular: names(bonds.regular)}, phase.operationIdea || ''];
    }),
    fbd: (() => { const bonds = (guide.formation && guide.formation.bonds) || {}; return {season: names(bonds.season), regular: names(bonds.regular)}; })(),
    it: (guide.recommendedItems || []).map(item => [item.name || '', item.shopLevel || 0, item.purchasePrice || 0, '']),
    oi: guide.operationIdea || '', d: (guide.publishAt || '').slice(0, 10), pd: (guide.latestEditAt || '').slice(0, 10), sea: (guide.season && guide.season.phaseName) || ''
  }));
  const html = fs.readFileSync(htmlPath, 'utf8');
  const start = '/* GUIDE_LIB:START */';
  const end = '/* GUIDE_LIB:END */';
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end);
  if (startIndex < 0 || endIndex <= startIndex || html.indexOf(start, startIndex + start.length) !== -1 || html.indexOf(end, endIndex + end.length) !== -1) throw new Error('网页中攻略数据标记缺失或重复，未修改网页');
  const data = JSON.stringify({meta: raw.meta || {}, guides}).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const block = `${start}\nconst GUIDE_LIB = ${data};\nconst GUIDE_LIB_BY_ID = {};\nGUIDE_LIB.guides.forEach((g, i) => { g.x = i; GUIDE_LIB_BY_ID[g.i] = g; });\n`;
  fs.writeFileSync(tempPath, html.slice(0, startIndex) + block + html.slice(endIndex), {encoding: 'utf8', flag: 'wx'});
  fs.renameSync(tempPath, htmlPath);
  console.log(`同步成功：${guides.length} 篇攻略已写入 index.html。`);
  console.log('如果网页已经打开，请刷新页面。');
} catch (error) {
  if (fs.existsSync(tempPath)) console.error('如存在未完成的 index.html.sync-tmp，请检查后删除再重试。');
  console.error('同步失败：' + error.message);
  process.exitCode = 1;
}
