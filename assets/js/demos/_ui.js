// ============================================================
// _ui.js — 27 个交互演示共享工具
// 提供：双语上下文、统一骨架、响应式 SVG、按钮/分段控件/滑块/下拉/
//       tooltip、播放-单步控制器、过渡时长（reduced-motion 兜底）
// ============================================================

export const reduce = () =>
  !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

export const C = {
  enter: '#1f7a4d', update: '#0e7fa8', exit: '#b3382c',
  good: '#1f7a4d', warn: '#a85e12', bad: '#b3382c',
  grid: '#e7ebf1', ink: '#454e5e', dim: '#94a0b3',
  palette: ['#4a46c9', '#0e7fa8', '#176c6b', '#b5601a', '#b43b7e', '#6b55c7', '#4f8a1f', '#2c7a8c']
};

/** 构造一个双语上下文：T(zh, en)、dur（尊重 reduced-motion） */
export function makeCtx(lang, accent) {
  const en = lang === 'en-US';
  return {
    en,
    T: (zh, enx) => (en ? (enx != null ? enx : zh) : zh),
    acc: accent || '#4a46c9',
    dur: reduce() ? 0 : 420
  };
}

/**
 * 统一演示骨架：提示句 + 控制条 + 舞台 + 结论条
 * shell(mount, { hint, hintEn, lang, accent })
 */
export function shell(mount, { hint, hintEn, lang = 'zh-CN', accent = '#4a46c9' } = {}) {
  const en = lang === 'en-US';
  mount.innerHTML = '';
  mount.style.setProperty('--acc', accent);
  const root = document.createElement('div');
  root.className = 'vx';
  root.innerHTML = `
    <p class="vx-hint"></p>
    <div class="controls vx-controls" hidden></div>
    <div class="vx-stage"></div>
    <div class="vx-conclusion"></div>`;
  mount.append(root);
  const hintEl = root.querySelector('.vx-hint');
  if (hint) { hintEl.textContent = en ? (hintEn || hint) : hint; }
  else hintEl.remove();
  const controls = root.querySelector('.vx-controls');
  const stage = root.querySelector('.vx-stage');
  const concl = root.querySelector('.vx-conclusion');
  return {
    root, en,
    controls, stage, concl,
    showControls() { controls.hidden = false; },
    setConcl(html) { concl.innerHTML = html; }
  };
}

/**
 * 响应式 SVG：内部用固定设计坐标系，宽度跟随容器。
 * - 显式 scrollMin（如多列日历热力图）：加 .vx-scroll-always，桌面与移动都保留完整宽度。
 * - 隐式兜底：设计宽 W≥760 的固定多面板图（d02/d03/d04/d05），
 *   在窄屏（≤760）以可读保底宽度横向滚动，桌面仍铺满（见 demos.css 的 --floor）。
 */
export function svg(d3, stage, W, H, { scrollMin = 0 } = {}) {
  const s = d3.select(stage).append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('class', 'vx-svg');
  const explicit = scrollMin > 0;
  const autoFloor = !explicit && W >= 760 ? Math.min(W, W >= 1000 ? 920 : 760) : 0;
  const floor = explicit ? scrollMin : autoFloor;
  if (floor) {
    let wrap = stage.querySelector(':scope > .vx-scroll');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'vx-scroll';
      stage.append(wrap);
    }
    if (explicit) wrap.classList.add('vx-scroll-always');
    wrap.style.setProperty('--floor', floor + 'px');
    wrap.append(s.node());
  }
  return s;
}

/** 把 SVG 放进一个可横向滚动容器（窄屏兜底） */
export function scrollWrap(stage, d3sel) {
  const w = document.createElement('div');
  w.className = 'vx-scroll';
  w.append(d3sel.node());
  stage.append(w);
  return w;
}

export function button(label, cls = '') {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'vx-btn ' + cls;
  b.innerHTML = label;
  return b;
}

/** 分段选择：items 为字符串或 {label, value}，返回容器 */
export function segmented(container, items, onSelect, initial = 0) {
  const wrap = document.createElement('div');
  wrap.className = 'vx-chiprow';
  const valOf = (it) => (typeof it === 'string' ? it : it.value);
  const labelOf = (it) => (typeof it === 'string' ? it : it.label);
  items.forEach((it, i) => {
    const b = button(labelOf(it), '');
    if (i === initial) b.classList.add('active');
    b.addEventListener('click', () => {
      wrap.querySelectorAll('.vx-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      onSelect(valOf(it), i);
    });
    wrap.append(b);
  });
  container.append(wrap);
  if (initial !== -1) {
    wrap.querySelectorAll('.vx-btn')[initial].classList.add('active');
    onSelect(valOf(items[initial]), initial);
  }
  return wrap;
}

/** 滑块 + 数值读数 */
export function slider(container, label, spec, onInput) {
  const { min = 0, max = 100, step = 1, value = 50, fmt = (v) => v } = spec;
  const lab = document.createElement('label');
  lab.className = 'vx-toggle';
  lab.style.cursor = 'default';
  const name = document.createElement('span');
  name.textContent = label;
  const r = document.createElement('input');
  r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = value;
  r.style.cssText = 'width:120px';
  const out = document.createElement('span');
  out.className = 'vx-tag';
  out.textContent = fmt(value);
  r.addEventListener('input', () => { out.textContent = fmt(r.value); onInput(+r.value); });
  lab.append(name, r, out);
  container.append(lab);
  return {
    input: r, readout: out,
    set(v) { r.value = v; out.textContent = fmt(v); }
  };
}

/** 下拉 */
export function select(container, label, options, onSelect, initial = 0) {
  const lab = document.createElement('label');
  lab.className = 'vx-toggle';
  lab.style.cursor = 'default';
  if (label) { const n = document.createElement('span'); n.textContent = label; lab.append(n); }
  const sel = document.createElement('select');
  options.forEach((o, i) => {
    const opt = document.createElement('option');
    opt.value = typeof o === 'string' ? o : o.value;
    opt.textContent = typeof o === 'string' ? o : o.label;
    if (i === initial) opt.selected = true;
    sel.append(opt);
  });
  sel.addEventListener('change', () => {
    const o = options[sel.selectedIndex];
    onSelect(typeof o === 'string' ? o : o.value, sel.selectedIndex);
  });
  lab.append(sel);
  container.append(lab);
  return { select: sel,
    set(i) { sel.selectedIndex = i; }
  };
}

/** 复选/开关芯片 */
export function toggle(container, label, checked, onChange) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'vx-toggle' + (checked ? ' active' : '');
  b.textContent = label;
  b.addEventListener('click', () => {
    checked = !checked;
    b.classList.toggle('active', checked);
    onChange(checked);
  });
  container.append(b);
  return { el: b, set(v) { checked = v; b.classList.toggle('active', v); } };
}

/** 跟随鼠标的固定定位 tooltip */
export function tooltip() {
  let el = null;
  const ensure = () => {
    if (!el) { el = document.createElement('div'); el.className = 'vx-tip'; document.body.appendChild(el); }
    return el;
  };
  const place = (ev, pad = 12) => {
    const rect = el.getBoundingClientRect();
    let x = ev.clientX + pad, y = ev.clientY + pad;
    if (x + rect.width > window.innerWidth - 8) x = ev.clientX - rect.width - pad;
    if (y + rect.height > window.innerHeight - 8) y = ev.clientY - rect.height - pad;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  };
  return {
    show(ev, html) { const e = ensure(); e.innerHTML = html; e.classList.add('show'); place(ev); },
    text(ev, txt) { this.show(ev, String(txt)); },
    move(ev) { if (el && el.classList.contains('show')) place(ev); },
    hide() { if (el) el.classList.remove('show'); },
    destroy() { if (el) { el.remove(); el = null; } }
  };
}

/**
 * 播放/单步控制器：用于算法/流水线分步动画
 * opts: { en, total, render(frame, prev), loop, interval, autoplay, frameLabel }
 */
export function player(controls, opts) {
  const {
    en = false, total = 1, render = () => {}, loop = false,
    interval = 700, autoplay = false, frameLabel = (n) => `${n + 1}/${total}`
  } = opts;
  let frame = -1, timer = null;
  const p = document.createElement('div');
  p.className = 'vx-chiprow';
  const bReset = button('⟲', '');
  const bPrev = button('⟨', '');
  const bPlay = button(en ? '▶ Play' : '▶ 播放', 'primary');
  const bNext = button('⟩', '');
  const readout = document.createElement('span');
  readout.className = 'vx-tag';
  readout.textContent = frameLabel(0);
  p.append(bReset, bPrev, bPlay, bNext, readout);
  controls.append(p);

  const stop = () => {
    if (timer) { clearInterval(timer); timer = null; }
    bPlay.innerHTML = en ? '▶ Play' : '▶ 播放';
  };
  const draw = (f) => {
    const prev = frame;
    frame = Math.max(0, Math.min(total - 1, f));
    readout.textContent = frameLabel(frame);
    render(frame, prev);
  };
  const next = () => {
    if (frame < total - 1) draw(frame + 1);
    else if (loop) draw(0);
    else stop();
  };
  const play = () => {
    if (timer) { stop(); return; }
    if (frame >= total - 1) draw(0);
    bPlay.innerHTML = en ? '❚❚ Pause' : '❚❚ 暂停';
    timer = setInterval(next, interval);
  };
  bReset.addEventListener('click', () => { stop(); draw(0); });
  bPrev.addEventListener('click', () => { stop(); draw(frame - 1); });
  bNext.addEventListener('click', () => { stop(); next(); });
  bPlay.addEventListener('click', play);
  draw(0);
  if (autoplay && !reduce()) { /* 不自动播放，避免干扰；由演示显式调用 */ }
  return {
    get frame() { return frame; },
    draw, next, play, stop,
    setTotal(n) { /* total fixed */ }
  };
}

/** 简单过渡（在 reduced-motion 下立即跳到终态） */
export function anim(selection, dur, ctx) {
  const d = ctx && ctx.dur != null ? ctx.dur : (reduce() ? 0 : 420);
  return selection.transition().duration(dur != null ? (reduce() ? 0 : dur) : d);
}

/** 评分环（0–100），返回带 set 的对象 */
export function scoreGauge(d3, parent, { size = 92, labelZh = '可读性', labelEn = 'Readability', en = false } = {}) {
  const svg = d3.select(parent).append('svg')
    .attr('viewBox', `0 0 ${size} ${size}`).attr('class', 'vx-svg').style('width', size + 'px');
  const g = svg.append('g').attr('transform', `translate(${size/2},${size/2})`);
  const r = size / 2 - 9;
  const start = -Math.PI / 2;
  const arc = d3.arc().innerRadius(r - 8).outerRadius(r).startAngle(start);
  const track = g.append('path').attr('d', arc({ endAngle: start + Math.PI * 2 })).attr('fill', '#e7ebf1').attr('opacity', 0.8);
  const fg = g.append('path').attr('fill', '#4a46c9');
  const num = g.append('text').attr('text-anchor','middle').attr('dy','-1').attr('font-size',22).attr('font-weight',800).attr('fill','#14171c');
  const cap = g.append('text').attr('text-anchor','middle').attr('dy',18).attr('font-size',10).attr('fill','#6f7c91').text(en ? labelEn : labelZh);
  let curr = 0, currNum = 0;
  function set(v, instant) {
    const val = v / 100;
    const col = v >= 75 ? '#1f7a4d' : v >= 45 ? '#a85e12' : '#b3382c';
    const dur = instant || reduce() ? 0 : 500;
    fg.transition().duration(dur).attrTween('d', () => {
      const i = d3.interpolate(curr, val);
      return tt => arc({ endAngle: start + i(tt) * Math.PI * 2 });
    }).attr('fill', col);
    num.transition().duration(dur).tween('n', () => {
      const i = d3.interpolateNumber(currNum, v);
      return tt => num.text(Math.round(i(tt)));
    });
    curr = val; currNum = v;
  }
  set(0, true);
  return { set, svg };
}
