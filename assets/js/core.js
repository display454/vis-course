// ============================================================
// core.js — 章节渲染引擎：数据驱动生成 讲解 / 代码 / 演示 三视图
// 用法：chapter.html?c=01
// ============================================================
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { initLocale, setLocale, onLocale, getLocale, t, L, mountLangSwitch } from './i18n.js';
import { CHAPTERS, chapterById } from '../data/content/meta.js';
import { isDone, toggleDone, chapterDoneCount, chapterPct, clearAll } from './store.js';

// ---------- 图标（内联 SVG，风格统一） ----------
const I = {
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm0 14a2 2 0 0 0 2 2h13v-2"/>',
  code: '<path d="m8 6-6 6 6 6M16 6l6 6-6 6"/>',
  play: '<path d="M6 4l14 8-14 8V4z"/>',
  theory: '<path d="M22 10 12 5 2 10l10 5 10-5ZM6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5"/>',
  star: '<path d="M12 2l3 6.5 7 .9-5 4.8 1.3 7L12 18l-6.3 3.2L7 14.2 2 9.4l7-.9L12 2z"/>',
  warn: '<path d="M12 3 2 20h20L12 3Zm0 7v5m0 3h.01"/>',
  tip: '<path d="M9 18h6m-3-3v3m5-9a5 5 0 1 0-9 3c.7 1 1 2 1 3h8c0-1 .3-2 1-3a5 5 0 0 0-1-3Z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  logo: '<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M6 17l4-5 3 3 4-6 2 3v5H6z"/>'
};
function svg(name, cls = 'ic') {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name]}</svg>`;
}

// ---------- 工具 ----------
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
/** 章节序号本地化（meta 中 num / numEn 两个字段） */
function numL(ch) { return L({ zh: ch.num, en: ch.numEn }); }

// 轻量 JS 语法高亮（先转义，再单趟分词，注释/字符串优先，避免误伤）
function highlight(code) {
  const safe = esc(code);
  const TOKEN = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\\\])*"|'(?:\\.|[^'\\])*')|\b(const|let|var|function|return|if|else|for|while|new|await|async|import|from|export|default|typeof|instanceof|of|in|true|false|null)\b|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)(?=\s*\()/g;
  return safe.replace(TOKEN, (m, com, str, kw, num, fn) => {
    if (com) return `<span class="tok-com">${m}</span>`;
    if (str) return `<span class="tok-str">${m}</span>`;
    if (kw) return `<span class="tok-key">${m}</span>`;
    if (num) return `<span class="tok-num">${m}</span>`;
    if (fn) return `<span class="tok-fn">${fn}</span>`;
    return m;
  });
}

// 把可能含 HTML 的双语文本安全渲染（HTML 来自我们自己的内容，可信任）
function h(b) { return L(b); }

// ============================================================
// 块渲染
// ============================================================
function renderBlocks(blocks, mode) {
  return blocks.map((b, i) => renderBlock(b, mode, i)).join('');
}

// 三视图过滤：讲解视图只放散文/要点与跳转芯片；代码视图只放代码；演示视图只放演示
const VIEW_ALLOW = {
  explain: new Set(['p', 'h', 'list', 'table', 'theory', 'key', 'pit', 'tip', 'code', 'demo']),
  code: new Set(['code']),
  demo: new Set(['demo'])
};

function renderBlock(b, mode, i) {
  if (mode && VIEW_ALLOW[mode] && !VIEW_ALLOW[mode].has(b.t)) return '';
  switch (b.t) {
    case 'p': return `<p>${h(b.x)}</p>`;
    case 'h': return `<h4 class="block-h">${h(b.x)}</h4>`;
    case 'list':
      return (b.ordered ? '<ol>' : '<ul>') + b.x.map(it => `<li>${h(it)}</li>`).join('') + (b.ordered ? '</ol>' : '</ul>');
    case 'table':
      return `<div class="tbl-scroll"><table class="tbl"><thead><tr>${b.head.map(c => `<th>${h(c)}</th>`).join('')}</tr></thead>
        <tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${h(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    case 'theory':
      return `<div class="callout theory"><div class="callout-title">${svg('theory')}${h(b.title) || t('theory')}</div>${renderBlocks(b.body, mode)}</div>`;
    case 'key':
      return `<div class="callout key"><div class="callout-title">${svg('star')}${h(b.title) || t('keypoint')}</div>${renderBlocks(b.body, mode)}</div>`;
    case 'pit':
      return `<div class="callout pit"><div class="callout-title">${svg('warn')}${t('pitfall')}</div><p style="margin:0">${h(b.x)}</p></div>`;
    case 'tip':
      return `<div class="callout tip"><div class="callout-title">${svg('tip')}${t('tip')}</div><p style="margin:0">${h(b.x)}</p></div>`;
    case 'code':
      // 讲解视图里不显示代码本体，只给一个跳转到代码视图的小芯片；代码视图渲染本体
      if (mode === 'explain')
        return `<div class="jump-tabs" data-jump-tab="code"><button type="button">${svg('code')}${t('tabCode')}：${h(b.title)}</button></div>`;
      return renderCode(b, i);
    case 'demo':
      // 讲解视图给一个跳转到演示视图的小芯片；演示视图渲染可交互演示
      if (mode === 'explain')
        return `<div class="jump-tabs" data-jump-tab="demo"><button type="button">${svg('play')}${t('tabDemo')}：${h(b.title)}</button></div>`;
      return renderDemo(b, i);
    default: return '';
  }
}

function renderCode(b, i) {
  const notes = (b.notes || []).map(n =>
    `<div class="code-note ${n.type === 'warn' ? 'warn' : 'why'}">
       <h6>${n.type === 'warn' ? '⚠ ' + t('pitfall') : '✓ ' + t('keypoint')} · ${h(n.h)}</h6>
       <p style="margin:0">${h(n.x)}</p>
     </div>`).join('');
  return `<div class="code-seg">
    <div class="seg-title"><span class="star">${svg('star')}</span>${h(b.title)}</div>
    <div class="codeblock">
      <div class="codeblock-head"><span class="dots"><i></i><i></i><i></i></span>
        <button class="copy-btn" type="button" data-copy>${t('copy')}</button></div>
      <pre><code data-raw>${highlight(b.code)}</code></pre>
    </div>
    ${notes}
  </div>`;
}

function renderDemo(b, i) {
  return `<div class="demo-seg">
    <div class="seg-title"><span class="dno">▶</span>${h(b.title)}</div>
    <div class="demo-card">
      <div class="demo-cap"><span class="live"></span>${t('live')} · ${h(b.x)}</div>
      <div class="demo-mount" data-demo="${b.id}"></div>
    </div>
  </div>`;
}

// ============================================================
// 章节页构建
// ============================================================
let currentCh = null, demos = null;

async function main() {
  const locale = initLocale();
  const id = new URLSearchParams(location.search).get('c') || '01';
  const ch = chapterById(id);
  if (!ch) {
    buildNav();
    document.getElementById('lesson-root').innerHTML =
      `<div class="wrap" style="padding:96px 20px;text-align:center">
        <h1 style="margin-bottom:12px">404</h1>
        <p style="color:var(--ink-500);margin-bottom:24px">${L({zh:'没有找到这一章。', en:'Chapter not found.'})}</p>
        <a class="btn btn-primary" href="index.html">${L({zh:'返回首页', en:'Back home'})}</a></div>`;
    bindFooter();
    return;
  }
  buildNav(ch);
  bindFooter();
  document.body.dataset.chapter = ch.id;
  document.title = `${numL(ch)} ${L(ch.title)} · ${L({zh:'可视化导论',en:'Introduction to Visualization'})}`;

  let data = null, demoMod = null;
  try {
    const mod = await import(`../data/content/ch${ch.id}.js`);
    data = mod.default;
    demoMod = await import(`./demos/d${ch.id}.js`);
    demos = demoMod.default;
  } catch (e) {
    // 该章内容/演示尚未迁移：渲染友好占位页，保证框架可整体浏览
    renderPlaceholder(ch);
    console.warn(`[placeholder] chapter ${ch.id} not yet migrated`, e);
    return;
  }

  currentCh = data;
  buildShell(data, ch, locale);
  bindInteractions(data, ch);
  if (location.hash) {
    const tgt = document.querySelector(`[data-sec-anchor="${location.hash.slice(1)}"]`);
    if (tgt) setTimeout(() => tgt.scrollIntoView(), 60);
  }
}

/** 尚未迁移章节的占位页（复用 meta，保证 5 个入口都可点开） */
function renderPlaceholder(ch) {
  const idx = CHAPTERS.findIndex(c => c.id === ch.id);
  const prev = CHAPTERS[idx - 1], next = CHAPTERS[idx + 1];
  const root = document.getElementById('lesson-root');
  root.innerHTML = `
  <div class="lesson-shell" style="display:block">
    <div class="lesson-main" style="max-width:760px;margin:0 auto">
      <header class="lesson-head">
        <span class="lesson-kicker"><span class="no">${numL(ch)}</span></span>
        <h1>${L(ch.title)}</h1>
        <p class="lesson-lede">${L(ch.desc)}</p>
      </header>
      <div class="callout theory" style="margin-bottom:24px">
        <div class="callout-title">${svg('tip')}${L({zh:'本章内容正在迁移中', en:'Content being migrated'})}</div>
        <p>${L({
          zh:`本章包含 <strong>${ch.nSections} 个小节、${ch.nDemos} 个交互演示</strong>，正在沿用统一的「讲解 / 关键代码 / 演示」三视图重构，稍后即可访问。你可以先查看完整的第 1 章作为样板。`,
          en:`This chapter has <strong>${ch.nSections} sections and ${ch.nDemos} live demos</strong>. It is being rebuilt into the Explain / Key Code / Demo views and will be available soon. Meanwhile, Chapter 1 is fully migrated as the reference.`
        })}</p>
      </div>
      <div class="chips tags" style="margin-bottom:28px">${L(ch.tags).map(tag => `<span class="chip">${tag}</span>`).join('')}</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <a class="btn btn-primary" href="chapter.html?c=01">${L({zh:'先看第 1 章样板', en:'View Chapter 1 sample'})}</a>
        <a class="btn btn-outline" href="index.html#map">${L({zh:'回到知识地图', en:'Back to map'})}</a>
      </div>
      <nav class="pager" style="margin-top:40px">
        ${prev ? `<a href="chapter.html?c=${prev.id}"><div class="dir">${t('prev')}</div><div class="ttl">${numL(prev)} · ${L(prev.title)}</div></a>` : '<a class="placeholder"></a>'}
        ${next ? `<a class="next" href="chapter.html?c=${next.id}"><div class="dir">${t('next')}</div><div class="ttl">${numL(next)} · ${L(next.title)}</div></a>` : '<a class="next placeholder"></a>'}
      </nav>
    </div>
  </div>`;
}

function buildNav(ch) {
  const nav = document.getElementById('topnav');
  nav.innerHTML = `
   <div class="topnav-inner">
    <a class="brand" href="index.html">
      <span class="logo" style="color:var(--brand-600)">${svg('logo')}</span>
      <span>${L({zh:'可视化导论',en:'Visualization'})}<small>${L({zh:'从数据到图表',en:'Data to Chart'})}</small></span>
    </a>
    <nav class="topnav-links">
      <a href="index.html">${t('navHome')}</a>
      <a href="index.html#map" class="keep">${t('navMap')}</a>
      <a href="index.html#chapters" class="keep">${t('navChapters')}</a>
    </nav>
    <div id="lang-slot"></div>
   </div>`;
  mountLangSwitch(document.getElementById('lang-slot'));
}

function buildShell(data, ch, locale) {
  const root = document.getElementById('lesson-root');
  const total = data.sections.length;

  const navItems = data.sections.map(s =>
    `<li><a href="#${s.id}" data-sec="${s.id}"><span class="sec-no">${s.id}</span><span class="sec-t">${L(s.title)}</span><span class="done">${isDone(ch.id, s.id) ? '✓' : ''}</span></a></li>`
  ).join('');

  const sections = data.sections.map((s, si) => {
    const explain = renderBlocks(s.blocks, 'explain');
    const code = renderBlocks(s.blocks, 'code');
    const demo = renderBlocks(s.blocks, 'demo');
    return `
    <section class="section" id="${s.id}" data-sec-anchor="${s.id}">
      <div class="section-head">
        <h2><span class="n">${s.id}</span> ${L(s.title)}</h2>
        <p class="sub">${L(s.sub)}</p>
      </div>
      <div class="tabs" role="tablist">
        <button class="tab-btn active" data-tab="explain">${svg('book')}<span class="label">${t('tabExplain')}</span></button>
        <button class="tab-btn" data-tab="code">${svg('code')}<span class="label">${t('tabCode')}</span></button>
        <button class="tab-btn" data-tab="demo">${svg('play')}<span class="label">${t('tabDemo')}</span></button>
      </div>
      <div class="tab-panel active lesson-content" data-panel="explain">${explain}</div>
      <div class="tab-panel lesson-content" data-panel="code">${code || `<p style="color:var(--ink-400)">—</p>`}</div>
      <div class="tab-panel" data-panel="demo">${demo || `<p style="color:var(--ink-400)">—</p>`}</div>
    </section>`;
  }).join('');

  const objectives = data.objectives
    ? `<div class="objectives"><h5>${t('objectives')}</h5><ol>${L(data.objectives).map(o => `<li>${o}</li>`).join('')}</ol></div>` : '';

  // 章末
  const summary = data.summary ? `<div class="callout tip"><div class="callout-title">${svg('star')}${t('summary')}</div><ul>${L(data.summary).map(s => `<li>${s}</li>`).join('')}</ul></div>` : '';
  const quickref = data.quickref ? `
    <h4 style="margin-bottom:12px">${t('quickref')}</h4>
    <div style="overflow-x:auto"><table class="tbl"><tbody>${data.quickref.map(q =>
      `<tr><td style="width:70px;color:var(--accent);font-weight:700;font-family:var(--font-mono)">${q.tag}</td><td>${L(q.x)}</td></tr>`).join('')}</tbody></table></div>` : '';
  const quiz = data.quiz ? `
    <h4 style="margin:24px 0 12px">${t('quiz')}</h4>
    ${data.quiz.map((q, qi) => `<div class="quiz-item">
        <div class="q">Q${qi + 1}. ${L(q.q)}</div>
        <button class="quiz-toggle" data-qi="${qi}">${t('showAnswer')}</button>
        <div class="a" data-qa="${qi}" hidden>${L(q.a)}</div>
      </div>`).join('')}` : '';

  // 上一章 / 下一章
  const idx = CHAPTERS.findIndex(c => c.id === ch.id);
  const prev = CHAPTERS[idx - 1], next = CHAPTERS[idx + 1];
  const pager = `<div class="pager">
    ${prev ? `<a href="chapter.html?c=${prev.id}"><div class="dir">${t('prev')}</div><div class="ttl">${numL(prev)} · ${L(prev.title)}</div></a>` : '<a class="placeholder"></a>'}
    ${next ? `<a class="next" href="chapter.html?c=${next.id}"><div class="dir">${t('next')}</div><div class="ttl">${numL(next)} · ${L(next.title)}</div></a>` : '<a class="next placeholder"></a>'}
  </div>`;

  root.innerHTML = `
  <div class="lesson-shell">
    <aside class="sidebar">
      <div class="progress-wrap" style="margin-bottom:18px">
        <h5>${t('progress')}</h5>
        <div class="progress-bar"><i id="prog-fill" style="width:${chapterPct(ch.id, total)}%"></i></div>
        <p class="progress-label" id="prog-label">${chapterDoneCount(ch.id)} / ${total} · ${chapterPct(ch.id, total)}%</p>
      </div>
      <h5>${t('toc')}</h5>
      <ul class="sec-nav">${navItems}</ul>
      <button class="btn btn-ghost" id="clear-prog" style="width:100%;font-size:12px">${t('clearProgress')}</button>
    </aside>
    <div class="lesson-main">
      <header class="lesson-head">
        <span class="lesson-kicker"><span class="no">${numL(ch)}</span></span>
        <h1>${L(data.title)}</h1>
        <p class="lede">${L(data.lede)}</p>
        ${objectives}
      </header>
      ${sections}
      <div class="chapter-end">
        ${summary}
        ${quickref}
        ${quiz}
      </div>
      ${pager}
    </div>
  </div>`;
}

// ---------- 交互绑定 ----------
function bindInteractions(data, ch) {
  const total = data.sections.length;
  const rendered = new Set();

  // 每小节 tab
  document.querySelectorAll('.section').forEach(sec => {
    const btns = sec.querySelectorAll('.tab-btn');
    const panels = sec.querySelectorAll('.tab-panel');
    btns.forEach(btn => btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.toggle('active', b === btn));
      const tab = btn.dataset.tab;
      panels.forEach(p => p.classList.toggle('active', p.dataset.panel === tab));
      if (tab === 'demo') renderSectionDemos(sec);
    }));
    // 讲解视图里的“跳转芯片”
    sec.querySelectorAll('[data-jump-tab]').forEach(j => j.addEventListener('click', () => {
      const tab = j.dataset.jumpTab;
      sec.querySelector(`.tab-btn[data-tab="${tab}"]`)?.click();
      if (tab === 'demo') renderSectionDemos(sec);
    }));
  });

  function renderSectionDemos(sec) {
    sec.querySelectorAll('.demo-mount').forEach(m => {
      const id = m.dataset.demo;
      if (rendered.has(id)) return;
      const fn = demos && demos[id];
      if (fn) {
        Promise.resolve(fn(m, { d3, data: 'data/', lang: getLocale(), accent: ch.hex })).then(() => rendered.add(id)).catch(e => { m.innerHTML = `<p style="color:var(--err-fg)">演示加载失败：${esc(e.message)}</p>`; });
      }
    });
  }

  // 侧栏进度：点击小节标题 → 滚动 + 标记完成（右侧 ✓ 按钮）
  const nav = document.querySelector('.sec-nav');
  nav.querySelectorAll('a[data-sec]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const id = a.dataset.sec;
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
    });
  });

  function refreshProgress() {
    const n = chapterDoneCount(ch.id);
    document.getElementById('prog-fill').style.width = chapterPct(ch.id, total) + '%';
    document.getElementById('prog-label').textContent = `${n} / ${total} · ${chapterPct(ch.id, total)}%`;
    nav.querySelectorAll('a[data-sec]').forEach(a => {
      const mark = a.querySelector('.done');
      if (mark) mark.textContent = isDone(ch.id, a.dataset.sec) ? '✓' : '';
    });
  }

  // 滚动到某小节中段，自动标记完成
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        const sec = en.target.dataset.secAnchor;
        if (!isDone(ch.id, sec)) { toggleDone(ch.id, sec); refreshProgress(); }
        nav.querySelectorAll('a[data-sec]').forEach(a => a.classList.toggle('active', a.dataset.sec === sec));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('.section').forEach(s => observer.observe(s));

  document.getElementById('clear-prog').addEventListener('click', () => {
    clearAll(); refreshProgress();
  });

  // 自测答案折叠
  document.querySelectorAll('.quiz-toggle').forEach(btn => btn.addEventListener('click', () => {
    const qi = btn.dataset.qi;
    const a = document.querySelector(`[data-qa="${qi}"]`);
    const show = a.hidden;
    a.hidden = !show;
    btn.textContent = show ? t('hideAnswer') : t('showAnswer');
  }));

  // 复制代码
  document.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const code = btn.closest('.codeblock').querySelector('code').textContent;
    try { await navigator.clipboard.writeText(code); } catch (e) {}
    const old = btn.textContent;
    btn.textContent = t('copied');
    setTimeout(() => btn.textContent = old, 1400);
  }));
}

// ---------- 页脚（语言切换时重渲染动态文本） ----------
function bindFooter() {
  const f = document.getElementById('site-footer');
  const draw = () => {
    f.innerHTML = `<div class="wrap">
      <div>${t('footer')}</div>
      <div class="meta">${t('footerMeta')}</div></div>`;
  };
  draw();
  onLocale(() => { if (currentCh) { const ch = chapterById(currentCh.id); location.reload(); } });
}

main().catch(e => {
  document.getElementById('lesson-root').innerHTML =
    `<div class="wrap" style="padding:80px 20px"><h2>章节加载失败</h2><p>${esc(e.message)}</p><a class="btn btn-primary" href="index.html">返回首页</a></div>`;
  console.error(e);
});
