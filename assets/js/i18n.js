// ============================================================
// i18n.js — 轻量双语（zh-CN / en-US）
// 内容采用 {zh, en} 单一数据源，由渲染函数按当前语言取值；
// 这里只负责：语言状态、持久化、UI 固定文案、语言切换通知。
// ============================================================

const KEY = 'vis-locale';
const DEFAULT = 'zh-CN';

export const UI = {
  'zh-CN': {
    navHome: '课程首页', navChapters: '章节', navMap: '知识地图', navAbout: '关于',
    search: '检索概念…', searchBtn: '检索',
    langLabel: '切换语言',
    tabExplain: '讲解', tabCode: '关键代码', tabDemo: '演示',
    toc: '本节内容', progress: '学习进度', done: '已完成',
    markDone: '标记本节已学', clearProgress: '清空进度',
    theory: '嵌入理论', theoryEn: 'Theory',
    keypoint: '关键点', pitfall: '常见坑', tip: '提示',
    objectives: '本章教学目标',
    summary: '本章小结', quickref: '关键点速查', quiz: '自测思考题',
    showAnswer: '查看参考答案', hideAnswer: '收起',
    prev: '上一章', next: '下一章', backHome: '返回首页',
    copy: '复制', copied: '已复制',
    live: '可交互',
    endKeypoints: '学完本章你应该能够',
    footer: '© 2026《可视化导论》课程 · 中国石油大学（华东）· 授课教师：李昕 · 主要参考教材：陈为《可视化导论》',
    footerMeta: '零构建 · 纯静态 · D3.js v7 (CDN) · 适配 GitHub Pages',
    openChapter: '进入章节',
    howToTitle: '怎么用这个网站',
    mapTitle: '可视化知识地图', mapLead: '五章是一条「从数据到图表」的主线，点击任一节点直达对应章节。',
    chaptersTitle: '课程章节', chaptersLead: '每章含「讲解 / 关键代码 / 演示」三视图，案例与理论交替，所有演示均可实时交互。',
    aboutTitle: '关于本课程',
    mapHint: '提示：把鼠标移到节点上查看本章关键词，点击进入章节。'
  },
  'en-US': {
    navHome: 'Home', navChapters: 'Chapters', navMap: 'Map', navAbout: 'About',
    search: 'Search concepts…', searchBtn: 'Search',
    langLabel: 'Switch language',
    tabExplain: 'Explain', tabCode: 'Key Code', tabDemo: 'Demo',
    toc: 'On this page', progress: 'Progress', done: 'done',
    markDone: 'Mark as learned', clearProgress: 'Reset progress',
    theory: 'Embedded Theory', theoryEn: 'Theory',
    keypoint: 'Key point', pitfall: 'Pitfall', tip: 'Tip',
    objectives: 'Learning objectives',
    summary: 'Summary', quickref: 'Key points at a glance', quiz: 'Self-check questions',
    showAnswer: 'Show answer', hideAnswer: 'Hide',
    prev: 'Previous', next: 'Next', backHome: 'Back home',
    copy: 'Copy', copied: 'Copied',
    live: 'Interactive',
    endKeypoints: 'After this chapter you should be able to',
    footer: '© 2026 Introduction to Visualization · China University of Petroleum (Huadong) · Instructor: Li Xin · Reference: Chen Wei, Introduction to Visualization',
    footerMeta: 'No build · Pure static · D3.js v7 (CDN) · GitHub Pages ready',
    openChapter: 'Open chapter',
    howToTitle: 'How to use this site',
    mapTitle: 'Visualization knowledge map', mapLead: 'The five chapters form one pipeline “from data to chart”. Click any node to open a chapter.',
    chaptersTitle: 'Course chapters', chaptersLead: 'Each chapter has Explain / Key Code / Demo views. Cases and theory alternate, and every demo is live and interactive.',
    aboutTitle: 'About this course',
    mapHint: 'Hover a node for keywords; click to open the chapter.'
  }
};

export function getLocale() {
  try {
    const sp = new URLSearchParams(location.search).get('lang');
    if (sp === 'en') return 'en-US';
    if (sp === 'zh') return 'zh-CN';
    const s = localStorage.getItem(KEY);
    if (s === 'en-US' || s === 'zh-CN') return s;
  } catch (e) {}
  return DEFAULT;
}

let locale = DEFAULT;
const listeners = new Set();

export function setLocale(next) {
  locale = (next === 'en-US' || next === 'zh') ? 'en-US' : 'zh-CN';
  try { localStorage.setItem(KEY, locale); } catch (e) {}
  document.documentElement.lang = locale === 'en-US' ? 'en' : 'zh-CN';
  listeners.forEach(fn => fn(locale));
  const sw = document.querySelectorAll('[data-lang-btn]');
  sw.forEach(b => b.classList.toggle('active', b.dataset.langBtn === locale));
}

export function onLocale(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function initLocale() {
  locale = getLocale();
  document.documentElement.lang = locale === 'en-US' ? 'en' : 'zh-CN';
  return locale;
}

/** 取 UI 固定文案 */
export function t(key) { return (UI[locale] && UI[locale][key]) || UI[DEFAULT][key] || key; }

/** 取双语对象在当前语言下的文本。兼容 {zh,en} 与 {'zh-CN','en-US'} 两种键名。 */
export function L(obj) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  const en = obj.en || obj['en-US'];
  const zh = obj.zh || obj['zh-CN'];
  return locale === 'en-US' ? (en || zh || '') : (zh || en || '');
}

/** 注入语言切换按钮组 */
export function mountLangSwitch(container) {
  const el = document.createElement('div');
  el.className = 'lang-switch';
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', UI[DEFAULT].langLabel);
  el.innerHTML = `<button type="button" data-lang-btn="zh-CN">中</button>
                  <button type="button" data-lang-btn="en-US">EN</button>`;
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-lang-btn]');
    if (b) setLocale(b.dataset.langBtn);
  });
  container.appendChild(el);
  // 初始化高亮
  el.querySelectorAll('[data-lang-btn]').forEach(b => b.classList.toggle('active', b.dataset.langBtn === locale));
}
