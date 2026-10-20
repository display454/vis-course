// ============================================================
// store.js — 学习进度（localStorage），首页与章节页共用
// 结构：{ "01": { "1.1": true, "1.2": true }, "02": {...} }
// ============================================================

const K = 'vis-progress';

function read() {
  try { return JSON.parse(localStorage.getItem(K)) || {}; }
  catch (e) { return {}; }
}
function write(d) {
  try { localStorage.setItem(K, JSON.stringify(d)); } catch (e) {}
}

export function isDone(ch, sec) {
  const d = read();
  return !!(d[ch] && d[ch][sec]);
}

export function toggleDone(ch, sec) {
  const d = read();
  d[ch] = d[ch] || {};
  if (d[ch][sec]) delete d[ch][sec]; else d[ch][sec] = true;
  write(d);
  return !!d[ch][sec];
}

export function chapterDoneCount(ch) {
  const d = read();
  return d[ch] ? Object.keys(d[ch]).length : 0;
}

export function chapterPct(ch, total) {
  if (!total) return 0;
  return Math.round((chapterDoneCount(ch) / total) * 100);
}

export function totalPct(chapters) {
  let done = 0, all = 0;
  chapters.forEach(c => {
    all += c.nSections;
    done += chapterDoneCount(c.id);;
  });
  return all ? Math.round((done / all) * 100) : 0;
}

export function clearAll() {
  try { localStorage.removeItem(K); } catch (e) {}
}
