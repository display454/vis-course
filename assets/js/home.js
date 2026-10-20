// ============================================================
// home.js — 首页：动态 Hero / 交互知识地图 / 章节卡 / 检索 / 页脚
// ============================================================
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { initLocale, onLocale, t, L, mountLangSwitch } from './i18n.js';
import { CHAPTERS } from '../data/content/meta.js';
import { chapterPct, chapterDoneCount, totalPct } from './store.js';

/** 章节序号本地化（meta 中 num / numEn 为普通字符串字段） */
function numL(c) { return L({ zh: c.num, en: c.numEn }); }
/** 取标题在「另一语言」下的写法，作为卡片小字副标 */
function titleOther(c) { return document.documentElement.lang === 'en' ? c.title.zh : c.title.en; }

const I = {
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm0 14a2 2 0 0 0 2 2h13v-2"/>',
  code: '<path d="m8 6-6 6 6 6M16 6l6 6-6 6"/>',
  play: '<path d="M6 4l14 8-14 8V4z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  logo: '<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M6 17l4-5 3 3 4-6 2 3v5H6z"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  flow: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M9 6h6a3 3 0 0 1 3 3v6"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-4.4-4-7.6-9-7.6Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="12" cy="8" r="1"/><circle cx="16" cy="11" r="1"/>',
  chart: '<path d="M4 20V4m0 16h16M8 16v-5m4 5V8m4 8v-8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
};
const svg = (name, cls = 'ic') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name]}</svg>`;

let v = 0;          // 渲染版本，用于停掉旧动画
let heroTimer = null;

function main() {
  initLocale();
  bindSearch();       // 检索只绑定一次，内部按当前语言取文案
  renderAll();
}

function renderAll() {
  v++;
  if (heroTimer) { clearInterval(heroTimer); heroTimer = null; }
  buildNav();
  buildHome();
  bindFooter();
  drawHeroViz(v);
  drawKnowledgeMap(v);
}

// ---------- 导航 ----------
function buildNav() {
  const nav = document.getElementById('topnav');
  nav.innerHTML = `
   <div class="topnav-inner">
    <a class="brand" href="index.html">
      <span class="logo" style="color:var(--brand-600)">${svg('logo')}</span>
      <span>${L({zh:'可视化导论',en:'Visualization'})}<small>${L({zh:'从数据到图表',en:'Data to Chart'})}</small></span>
    </a>
    <nav class="topnav-links">
      <a href="#map" class="keep">${t('navMap')}</a>
      <a href="#chapters" class="keep">${t('navChapters')}</a>
      <a href="#about" class="keep">${t('navAbout')}</a>
      <button class="btn btn-ghost keep" id="open-search" style="padding:7px 12px">${svg('search')}<span>${t('searchBtn')}</span></button>
    </nav>
    <div id="lang-slot"></div>
   </div>`;
  mountLangSwitch(document.getElementById('lang-slot'));
}

// ---------- 首页主体 ----------
function buildHome() {
  const root = document.getElementById('home-root');

  const totalDemos = d3.sum(CHAPTERS, c => c.nDemos);
  const totalKeys = d3.sum(CHAPTERS, c => c.nKeys);
  const overall = totalPct(CHAPTERS);

  const cards = CHAPTERS.map(c => {
    const pct = chapterPct(c.id, c.nSections);
    return `
    <a class="ch-card" href="chapter.html?c=${c.id}" style="--c:${c.hex}">
      <div class="top">
        <span class="num">${numL(c)}</span>
        <span class="pct"><span class="mini"><i style="width:${pct}%"></i></span>${pct}%</span>
      </div>
      <h3>${L(c.title)}</h3>
      <div class="en">${titleOther(c)}</div>
      <p class="desc">${L(c.desc)}</p>
      <ul class="chips tags">${L(c.tags).slice(0,4).map(tag => `<li class="chip">${tag}</li>`).join('')}</ul>
      <span class="go">${t('openChapter')} →</span>
    </a>`;
  }).join('');

  const howto = [
    { ic: 'book', t: { zh: '课堂讲解', en: 'In class' }, d: { zh: '左侧选小节，顶部切 讲解/代码/演示，边讲边实时运行。', en: 'Pick a section, switch Explain/Code/Demo, run live while teaching.' } },
    { ic: 'play', t: { zh: '自己动手', en: 'Self-study' }, d: { zh: '按顺序过完每章，所有演示都可拖拽、点击、调参。', en: 'Go in order; every demo is clickable, draggable and tunable.' } },
    { ic: 'code', t: { zh: '看代码', en: 'Read code' }, d: { zh: '每个 ⭐ 关键代码含“为什么这么写”和“常见坑”。', en: 'Each ⭐ snippet explains why and the pitfalls.' } },
    { ic: 'search', t: { zh: '快速检索', en: 'Search' }, d: { zh: '按 Ctrl/⌘ + K 搜概念，直达对应章节。', en: 'Press Ctrl/⌘ + K to search concepts and jump.' } }
  ].map(h => `<div class="howto-card">
      <div class="ic">${svg(h.ic)}</div>
      <h3>${L(h.t)}</h3><p>${L(h.d)}</p></div>`).join('');

  const about = [
    { t: { zh: '理论来源', en: 'Theory sources' }, d: { zh: '陈为《可视化导论》、Mackinlay 1986、Stevens 1946、Cleveland 1984、Card 1999、Bostock D3 文档。', en: 'Chen Wei’s Introduction to Visualization, Mackinlay 1986, Stevens 1946, Cleveland 1984, Card 1999, D3 docs.' } },
    { t: { zh: '设计原则', en: 'Design principle' }, d: { zh: '案例为中心：每个知识点嵌入真实案例，配关键点解释与可运行演示。', en: 'Case-centered: every concept sits in a real case, with key-point notes and a live demo.' } },
    { t: { zh: '技术栈', en: 'Tech stack' }, d: { zh: '零构建：HTML + CSS + ES Modules + D3 v7 (CDN)。本地用 python -m http.server 即可。', en: 'No build: HTML + CSS + ES Modules + D3 v7 (CDN). Run locally with python -m http.server.' } },
    { t: { zh: '数据集', en: 'Datasets' }, d: { zh: '新生数据、Crime、天气、法国人名等已打包在 data/，离线可用。', en: 'Student, Crime, weather and French-names data are bundled in data/ for offline use.' } }
  ].map(a => `<div class="about-item"><h4>${L(a.t)}</h4><p>${L(a.d)}</p></div>`).join('');

  root.innerHTML = `
  <!-- HERO -->
  <section class="hero">
    <div class="hero-inner">
      <div class="hero-copy">
        <p class="hero-tag">VISUALIZATION · INTRODUCTION</p>
        <h1>${L({zh:'可视化导论',en:'Introduction to Visualization'})}</h1>
        <p class="hero-sub">${L({zh:'从数据到图表：JavaScript + D3.js 实战课程',en:'From Data to Charts: a Hands-on JavaScript + D3.js Course'})}</p>
        <p class="hero-meta">${L({zh:'中国石油大学（华东）· 授课教师：李昕 · 主要参考教材：陈为《可视化导论》',en:'China University of Petroleum (Huadong) · Instructor: Li Xin · Reference: Chen Wei'})}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="chapter.html?c=01">${L({zh:'开始学习',en:'Start learning'})}</a>
          <a class="btn btn-outline" href="#map">${L({zh:'查看知识地图',en:'See the knowledge map'})}</a>
        </div>
        <div class="hero-stats">
          <div><div class="n">${CHAPTERS.length}</div><div class="l">${L({zh:'章',en:'chapters'})}</div></div>
          <div><div class="n">${totalDemos}</div><div class="l">${L({zh:'交互演示',en:'live demos'})}</div></div>
          <div><div class="n">${totalKeys}</div><div class="l">${L({zh:'关键点',en:'key points'})}</div></div>
          <div><div class="n">${overall}%</div><div class="l">${L({zh:'学习进度',en:'progress'})}</div></div>
        </div>
      </div>
      <div class="hero-viz" id="hero-viz"></div>
    </div>
  </section>

  <!-- 知识地图 -->
  <section class="section" id="map">
    <div class="section-head2">
      <div>
        <h2>${t('mapTitle')}</h2>
        <p>${t('mapLead')}</p>
      </div>
      <span class="idx">01</span>
    </div>
    <div class="map-wrap">
      <div class="map-legend">
        ${CHAPTERS.map(c => `<span><i style="background:${c.hex}"></i>${L(c.title)}</span>`).join('')}
      </div>
      <svg id="knowledge-map" viewBox="0 0 1000 266" preserveAspectRatio="xMidYMid meet" role="img" aria-label="knowledge map"></svg>
      <p class="map-hint">${t('mapHint')}</p>
    </div>
  </section>

  <!-- 章节卡 -->
  <section class="section" id="chapters">
    <div class="section-head2">
      <div>
        <h2>${t('chaptersTitle')}</h2>
        <p>${t('chaptersLead')}</p>
      </div>
      <span class="idx">02</span>
    </div>
    <div class="ch-grid">${cards}</div>
  </section>

  <!-- 使用方式 -->
  <section class="section" id="howto">
    <div class="section-head2">
      <div><h2>${t('howToTitle')}</h2>
        <p>${L({zh:'无论是课堂投影还是课后自学，都围绕“讲解—代码—演示”三视图展开。', en:'Whether in class or self-study, everything revolves around the Explain–Code–Demo views.'})}</p>
      </div>
      <span class="idx">03</span>
    </div>
    <div class="howto-grid">${howto}</div>
  </section>

  <!-- 关于 -->
  <section class="section" id="about">
    <div class="section-head2">
      <div><h2>${t('aboutTitle')}</h2>
        <p>${L({zh:'课程的理论依据、设计取舍与技术栈，全部开放可离线运行。', en:'The theory basis, design trade-offs and tech stack — all open and runnable offline.'})}</p>
      </div>
      <span class="idx">04</span>
    </div>
    <div class="about-grid">${about}</div>
  </section>`;
}

// ---------- Hero 动态可视化：实时变化的条形图（D3 transition） ----------
function drawHeroViz(ver) {
  const W = 520, H = 340;
  const host = d3.select('#hero-viz');
  const svg = host.append('svg').attr('viewBox', `0 0 ${W} ${H}`);

  // 卡片底板
  svg.append('rect').attr('x', 8).attr('y', 8).attr('width', W - 16).attr('height', H - 16)
    .attr('rx', 18).attr('fill', 'rgba(255,255,255,.07)').attr('stroke', 'rgba(255,255,255,.18)');
  svg.append('circle').attr('cx', 40).attr('cy', 40).attr('r', 5).attr('fill', '#34d399');
  svg.append('text').attr('x', 54).attr('y', 45).attr('fill', '#c7d2fe').attr('font-size', 14)
    .text(L({zh:'实时 · 数据 → 图表', en:'live · data → chart'}));

  const n = 9, pad = 46, gap = 14;
  const bw = (W - pad * 2 - gap * (n - 1)) / n;
  const base = H - 80;
  const g = svg.append('g');

  const bar = g.selectAll('rect').data(d3.range(n)).join('rect')
    .attr('x', d => pad + d * (bw + gap)).attr('y', base).attr('width', bw).attr('height', 0)
    .attr('rx', 5).attr('fill', d => d3.interpolate('#a5b4fc', '#ffffff')(d / n));

  svg.append('line').attr('x1', pad).attr('x2', W - pad).attr('y1', base).attr('y2', base)
    .attr('stroke', 'rgba(255,255,255,.35)');

  const cap = svg.append('text').attr('x', pad).attr('y', H - 38).attr('fill', '#cdd2f2')
    .attr('font-family', 'monospace').attr('font-size', 13);
  const captions = {
    zh: ["selectAll('rect').data(values)", ".join(enter => enter.append('rect'))", ".attr('height', d => y(d))"],
    en: ["selectAll('rect').data(values)", ".join(enter => enter.append('rect'))", ".attr('height', d => y(d))"]
  };

  function tick() {
    const vals = d3.range(n).map(() => 30 + Math.random() * 160);
    bar.transition().duration(1100).ease(d3.easeCubicInOut)
      .attr('y', d => base - vals[d]).attr('height', d => vals[d]);
    const loc = document.documentElement.lang === 'en' ? 'en' : 'zh';
    cap.text(captions[loc][Math.floor(Math.random() * 3)]);
  }
  tick();
  heroTimer = setInterval(() => { if (ver === v) tick(); }, 2000);

  // 数据点从上方“落”到柱顶（一次性小装饰，增强“数据→图表”叙事）
  g.selectAll('circle.dp').data(d3.range(n)).join('circle').attr('class','dp')
    .attr('cx', d => pad + d * (bw + gap) + bw / 2).attr('cy', 70).attr('r', 4).attr('fill', '#c7d2fe')
    .transition().delay((d,i)=>120*i).duration(900).ease(d3.easeBounceOut)
    .attr('cy', d => base - 1).remove();
}

// ---------- 知识地图：五章管线（SVG） ----------
function drawKnowledgeMap(ver) {
  const svg = d3.select('#knowledge-map');
  const W = 1000;
  const n = CHAPTERS.length;
  const nodeW = 150, nodeH = 100;
  const startX = 70, gap = (W - startX * 2 - nodeW * n) / (n - 1);
  const y = 84;
  const X = i => startX + i * (nodeW + gap);

  // 箭头定义
  const defs = svg.append('defs');
  defs.append('marker').attr('id', 'arrow').attr('viewBox', '0 0 10 10').attr('refX', 9).attr('refY', 5)
    .attr('markerWidth', 7).attr('markerHeight', 7).attr('orient', 'auto')
    .append('path').attr('d', 'M0 0 L10 5 L0 10 z').attr('fill', '#94a3b8');

  // 连接线（带流动虚线）
  for (let i = 0; i < n - 1; i++) {
    const x1 = X(i) + nodeW, x2 = X(i + 1);
    const line = svg.append('line').attr('x1', x1).attr('y1', y + nodeH / 2).attr('x2', x2 - 8).attr('y2', y + nodeH / 2)
      .attr('stroke', '#94a3b8').attr('stroke-width', 2).attr('marker-end', 'url(#arrow)');
    // 流动小点
    const dot = svg.append('circle').attr('r', 3).attr('fill', '#64748b');
    function flow() {
      if (ver !== v) return;
      dot.attr('cx', x1 + 4).attr('cy', y + nodeH / 2)
        .transition().duration(1300).ease(d3.easeLinear)
        .attr('cx', x2 - 12).on('end', flow);
    }
    flow();
  }
  // 顶部主线标注
  svg.append('text').attr('x', W / 2).attr('y', 40).attr('text-anchor', 'middle').attr('class','flow-label')
    .attr('font-size', 14).attr('fill', '#64748b')
    .text(L({zh:'一条主线：原始数据 → 处理变换 → 视觉映射 → 图表呈现', en:'One pipeline: raw data → transforms → visual mapping → rendered chart'}));

  // 节点
  CHAPTERS.forEach((c, i) => {
    const x = X(i);
    const g = svg.append('g').attr('class', 'node').attr('transform', `translate(${x},${y})`)
      .style('color', c.hex)
      .on('click', () => location.href = `chapter.html?c=${c.id}`);
    g.append('rect').attr('width', nodeW).attr('height', nodeH).attr('rx', 14)
      .attr('fill', '#fff').attr('stroke', c.hex).attr('stroke-width', 2);
    g.append('rect').attr('width', nodeW).attr('height', 8).attr('rx', 4).attr('fill', c.hex);
    g.append('text').attr('x', 14).attr('y', 30).attr('font-size', 12).attr('font-weight', 700).attr('fill', c.hex)
      .text(numL(c));
    g.append('text').attr('x', nodeW / 2).attr('y', 48).attr('text-anchor', 'middle')
      .attr('font-size', 26).attr('fill', c.hex).attr('font-family', 'monospace')
      .text(String(i + 1).padStart(2, '0'));
    g.append('text').attr('x', nodeW / 2).attr('y', 76).attr('text-anchor', 'middle')
      .attr('font-size', 16).attr('font-weight', 700).attr('fill', '#1e293b')
      .text(L(c.title));
    g.append('text').attr('x', nodeW / 2).attr('y', 94).attr('text-anchor', 'middle')
      .attr('font-size', 10.5).attr('fill', '#94a3b8')
      .text(L({zh:`${c.nSections} 小节 · ${c.nDemos} 演示`, en:`${c.nSections} sec · ${c.nDemos} demos`}));

    // 关键概念（节点下方，最多 3 个，按当前语言取标签）
    L(c.tags).slice(0, 3).forEach((cc, k) => {
      svg.append('text').attr('x', x + nodeW / 2).attr('y', y + nodeH + 26 + k * 19).attr('text-anchor', 'middle')
        .attr('font-size', 12).attr('fill', '#475569').text('· ' + cc);
    });
  });
}

// ---------- 全站检索 ----------
function bindSearch() {
  const overlay = document.getElementById('search-overlay');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const hint = document.getElementById('search-hint');
  hint.textContent = L({zh:'↑↓ 选择 · Enter 跳转 · Esc 关闭', en:'↑↓ choose · Enter to go · Esc to close'});
  input.placeholder = t('search');

  // 构建检索索引（章 + 标签 + 概念）
  const INDEX = [];
  CHAPTERS.forEach(c => {
    INDEX.push({ ch: c.id, sec: '', zh: L(c.title), en: c.title.en, url: `chapter.html?c=${c.id}` });
    c.tags.zh.forEach((tag, k) => INDEX.push({ ch: c.id, sec: tag, zh: tag, en: c.tags.en[k] || '', url: `chapter.html?c=${c.id}` }));
    c.concepts.forEach(cc => INDEX.push({ ch: c.id, sec: cc, zh: cc, en: '', url: `chapter.html?c=${c.id}` }));
  });

  let sel = 0, current = [];
  function open() {
    input.placeholder = t('search');
    hint.textContent = L({zh:'↑↓ 选择 · Enter 跳转 · Esc 关闭', en:'↑↓ choose · Enter to go · Esc to close'});
    overlay.classList.add('open'); input.value = ''; render(''); setTimeout(() => input.focus(), 20);
  }
  function close() { overlay.classList.remove('open'); }
  document.addEventListener('click', e => { if (e.target.closest('#open-search')) open(); });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); }
    if (e.key === 'Escape') close();
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  function render(q) {
    const ql = q.trim().toLowerCase();
    current = ql ? INDEX.filter(it => (it.zh + it.en).toLowerCase().includes(ql)).slice(0, 12) : INDEX.slice(0, 7);
    sel = 0;
    if (!current.length) { results.innerHTML = `<div class="search-empty">${L({zh:'没有找到相关概念，换个关键词试试',en:'No matching concept; try another term'})}</div>`; return; }
    const cById = id => CHAPTERS.find(c => c.id === id);
    results.innerHTML = current.map((it, i) =>
      `<a href="${it.url}" data-i="${i}" class="${i === sel ? 'sel' : ''}">
        <div class="r-ch">${numL(cById(it.ch))} · ${L(cById(it.ch).title)}</div>
        <div class="r-sec">${it.sec || (document.documentElement.lang === 'en' ? it.en : it.zh)}</div>
      </a>`).join('');
  }
  input.addEventListener('input', e => render(e.target.value));
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, current.length - 1); updateSel(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); updateSel(); e.preventDefault(); }
    if (e.key === 'Enter' && current[sel]) location.href = current[sel].url;
  });
  function updateSel() { results.querySelectorAll('a').forEach((a, i) => a.classList.toggle('sel', i === sel)); }
}

// ---------- 页脚 ----------
function bindFooter() {
  const f = document.getElementById('site-footer');
  const draw = () => {
    f.innerHTML = `<div class="wrap">
      <div>${t('footer')}</div>
      <div class="meta">${t('footerMeta')}</div></div>`;
  };
  draw();
  // 首页语言切换：数据驱动整体重渲染（检索仅绑定一次）
  onLocale(() => renderAll());
}

main();
