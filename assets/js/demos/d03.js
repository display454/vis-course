// ============================================================
// d03.js — 第 3 章《色彩专题》交互演示（8 个，全部重新设计）
//   d03-1 颜色空间几何实验室（RGB 立方体 / HSL 圆柱 / Lab 切片 联动）
//   d03-2 colormap 配色诊断工作台（亮度单调性 / 梯度 / CVD 可分性）
//   d03-3 三色域边界叠加 + clamp 轨迹（sRGB / AdobeRGB / Rec.2020）
//   d03-4 交互 HSL 色轮和谐器（5 种几何关系）
//   d03-5 经典配色真实图 A/B 量化对比（色差 + CVD + 灰度）
//   d03-6 配色找茬闯关（热点判定 + 一键修复）
//   d03-7 多面板仪表板上色 + WCAG 对比度检测
//   d03-8 实时 CVD/灰度滤镜 + 冗余编码修复
// 函数签名：(mount, { d3, data, lang, accent }) => {}
// ============================================================
import { shell, svg, makeCtx, button, segmented, slider, select, toggle, tooltip, C } from './_ui.js';

const D = {};
const ACC = '#db2777';

// 统一载入新生数据
async function loadStudents(d3, data) {
  return d3.csv(data + 'newstudent.csv', d => {
    const cls = (d['班级'] || '').trim();
    const m = cls.match(/^(.+?)(\d+班)$/);
    return {
      id: +d['序号'], name: d['姓名'].trim(), gender: d['性别'].trim(),
      age: +d['年龄'], cls, major: m ? m[1] : cls
    };
  });
}
// 载入各州犯罪率（50 州）
async function loadCrime(d3, data) {
  return d3.csv(data + 'crime.csv', d => d);
}

// ---------------- 颜色工具 ----------------
const CVD_M = {
  protan:   [[0.567, 0.433, 0.000], [0.558, 0.442, 0.000], [0.000, 0.242, 0.758]],
  deutan:   [[0.625, 0.375, 0.000], [0.700, 0.300, 0.000], [0.000, 0.300, 0.700]],
  tritan:   [[0.950, 0.050, 0.000], [0.000, 0.433, 0.567], [0.000, 0.475, 0.525]]
};
const clip255 = v => Math.max(0, Math.min(255, Math.round(v)));
function cvdHex(d3, hex, type) {
  const c = d3.rgb(hex);
  if (type === 'gray') return grayHex(d3, hex);
  const m = CVD_M[type];
  return d3.rgb(
    clip255(c.r * m[0][0] + c.g * m[0][1] + c.b * m[0][2]),
    clip255(c.r * m[1][0] + c.g * m[1][1] + c.b * m[1][2]),
    clip255(c.r * m[2][0] + c.g * m[2][1] + c.b * m[2][2])
  ).formatHex();
}
function grayHex(d3, hex) {
  const c = d3.rgb(hex);
  const y = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  return d3.rgb(y, y, y).formatHex();
}
function relLum(d3, hex) {
  const c = d3.rgb(hex);
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}
function contrast(d3, a, b) {
  const l1 = relLum(d3, a), l2 = relLum(d3, b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
function dE(d3, a, b) {
  const A = d3.lab(a), B = d3.lab(b);
  return Math.sqrt((A.l - B.l) ** 2 + (A.a - B.a) ** 2 + (A.b - B.b) ** 2);
}
// 经典科研配色（去重、控制在 7 类以内）
const PALETTES = {
  'Wong / Okabe-Ito': ['#0072B2', '#E69F00', '#009E73', '#D55E00', '#CC79A7', '#56B4E9', '#F0E442'],
  'Paul Tol bright':  ['#4477AA', '#EE6677', '#228833', '#CCBB44', '#66CCEE', '#AA3377', '#BBBBBB'],
  'Tableau 10':       ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F', '#EDC948', '#B07AA1'],
  'Category 10 (d3)': ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2'],
  'Paired':           ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f'],
  '彩虹 jet (反面)':    ['#00007f', '#0000ff', '#00ffff', '#00ff00', '#ffff00', '#ff0000', '#7f0000']
};

// ============================================================
// d03-1 颜色空间几何实验室
// ============================================================
D['d03-1'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('拖动 R/G/B 改变同一个颜色，观察它在 RGB 立方体、HSL 圆柱、Lab 切片里的位置；点「生成 RGB 等距环」，看 RGB 里等距的点在 Lab 里如何变得疏密不均。',
           'Change one color with R/G/B and track it in RGB cube, HSL cylinder and Lab slice; generate an RGB-equidistant ring to see even RGB spacing become uneven in Lab.'),
    lang, accent
  });
  ui.showControls();
  const r1 = document.createElement('div'); r1.className = 'vx-chiprow';
  ui.controls.append(r1);

  const W = 1060, H = 400, PW = 340, PAD = 18;
  const L = svg(d3, ui.stage, W, H);
  // 三个面板
  const panels = [
    { x: 0, y: 0, title: T('RGB 立方体', 'RGB cube'), sub: 'RGB' },
    { x: PW + 10, y: 0, title: T('HSL 圆柱（展开成色轮）', 'HSL cylinder (hue wheel)'), sub: 'HSL' },
    { x: 2 * (PW + 10), y: 0, title: T('Lab a*b* 切片（L* 固定）', 'Lab a*b* slice (fixed L*)'), sub: 'Lab' }
  ];
  const pg = L.append('g');
  panels.forEach((p, i) => {
    pg.append('rect').attr('x', p.x).attr('y', 24).attr('width', PW - 24).attr('height', H - 40)
      .attr('rx', 10).attr('fill', '#f8fafc').attr('stroke', '#e2e8f0');
    pg.append('text').attr('x', p.x + 12).attr('y', 16).attr('font-size', 13)
      .attr('font-weight', 700).attr('fill', '#0f172a').text(p.title);
  });
  const gRGB = L.append('g');
  const gHSL = L.append('g');
  const gLab = L.append('g');

  let state = { r: 220, g: 90, b: 150, ring: false };
  const hex = () => d3.rgb(state.r, state.g, state.b).formatHex();

  // RGB 立方体等距投影
  const ox = 130, oy = 300, S = 150;
  function iso(r, g, b) {
    // 简单等距：x 轴=R（右下），y 轴=G（右上），z 轴=B（上）
    const x = ox + (r - b) * 0.86 * S + g * 0.5 * S;
    const y = oy - (r + b) * 0.5 * S - g * 0.86 * S;
    return { x: x + 10, y: y - 40 };
  }
  function drawRGBcube() {
    gRGB.selectAll('*').remove();
    const c = [0, 1];
    const edges = [];
    for (const i of c) for (const j of c) for (const k of c) {
      const p = iso(i, j, k);
      [[1, j, k], [i, 1, k], [i, j, 1]].forEach(q => {
        const p2 = iso(q[0], q[1], q[2]);
        edges.push([p, p2]);
      });
    }
    const seen = new Set();
    edges.forEach(([a, b]) => {
      const key = [a.x, a.y, b.x, b.y].map(v => v.toFixed(1)).sort().join('|');
      if (seen.has(key)) return; seen.add(key);
      gRGB.append('line').attr('x1', a.x).attr('y1', a.y).attr('x2', b.x).attr('y2', b.y)
        .attr('stroke', '#cbd5e1').attr('stroke-width', 1.2);
    });
    // 轴标签
    const o = iso(0, 0, 0), rr = iso(1, 0, 0), gg = iso(0, 1, 0), bb = iso(0, 0, 1);
    [['R', rr, '#dc2626'], ['G', gg, '#16a34a'], ['B', bb, '#2563eb']].forEach(([t, p, col]) => {
      gRGB.append('line').attr('x1', o.x).attr('y1', o.y).attr('x2', p.x).attr('y2', p.y)
        .attr('stroke', col).attr('stroke-width', 2.2);
      gRGB.append('text').attr('x', p.x).attr('y', p.y + 4).attr('font-size', 12)
        .attr('font-weight', 700).attr('fill', col).text(t);
    });
  }
  drawRGBcube();

  // HSL 色轮
  const hcx = panels[1].x + 158, hcy = 210, hR = 110;
  const gHueWheel = gHSL.append('g');
  function drawHSLwheel() {
    gHueWheel.selectAll('*').remove();
    for (let a = 0; a < 360; a += 2) {
      gHueWheel.append('line')
        .attr('x1', hcx).attr('y1', hcy)
        .attr('x2', hcx + hR * Math.cos(a * Math.PI / 180))
        .attr('y2', hcy + hR * Math.sin(a * Math.PI / 180))
        .attr('stroke', d3.hsl(a, 0.75, 0.55).formatHex()).attr('stroke-width', 2.4);
    }
    gHueWheel.append('circle').attr('cx', hcx).attr('cy', hcy).attr('r', 26).attr('fill', '#f8fafc');
  }
  drawHSLwheel();

  // Lab a*b* 切片：栅格背景
  const lcx = panels[2].x + 158, lcy = 210, lR = 120;
  const gLabBg = gLab.append('g');
  const gLabPts = gLab.append('g');
  function labPoint(L, a, b) {
    return { x: lcx + a * 1.1, y: lcy - b * 1.1 };
  }
  function drawLabBg() {
    gLabBg.selectAll('*').remove();
    const L = d3.lab(hex()).l;
    for (let a = -110; a <= 110; a += 7) {
      for (let b = -110; b <= 110; b += 7) {
        const col = d3.lab(L, a, b).formatHex();
        const cc = d3.rgb(col);
        const inG = Math.max(cc.r, cc.g, cc.b) < 254 || Math.min(cc.r, cc.g, cc.b) > 1;
        const p = labPoint(L, a, b);
        if ((p.x - lcx) ** 2 + (p.y - lcy) ** 2 <= lR * lR) {
          gLabBg.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 3.4)
            .attr('fill', inG ? col : '#eef2f7');
        }
      }
    }
    // 坐标轴
    gLabBg.append('line').attr('x1', lcx - lR).attr('y1', lcy).attr('x2', lcx + lR).attr('y2', lcy).attr('stroke', '#94a3b8');
    gLabBg.append('line').attr('x1', lcx).attr('y1', lcy - lR).attr('x2', lcx).attr('y2', lcy + lR).attr('stroke', '#94a3b8');
    gLabBg.append('text').attr('x', lcx + lR - 4).attr('y', lcy - 4).attr('font-size', 10).attr('fill', '#64748b').text('a*');
    gLabBg.append('text').attr('x', lcx + 6).attr('y', lcy - lR + 12).attr('font-size', 10).attr('fill', '#64748b').text('b*');
  }

  // 等距环：RGB 里沿 B 等距的 7 个点
  function ringPoints() {
    const pts = [];
    for (let b = 0; b <= 255; b += 42) pts.push({ r: state.r, g: state.g, b });
    return pts;
  }

  function draw() {
    const col = hex();
    const lab = d3.lab(col), hsl = d3.hsl(col);
    // 背景 Lab
    drawLabBg();
    gRGB.selectAll('.ring,.main').remove();
    gHueWheel.selectAll('.ring,.main').remove();
    gLabPts.selectAll('*').remove();

    const pts = state.ring ? ringPoints() : [];
    pts.forEach((p, i) => {
      const hx = d3.rgb(p.r, p.g, p.b).formatHex();
      // RGB
      const rp = iso(p.r / 255, p.g / 255, p.b / 255);
      gRGB.append('circle').attr('class', 'ring').attr('cx', rp.x).attr('cy', rp.y).attr('r', 5)
        .attr('fill', hx).attr('stroke', '#0f172a').attr('stroke-width', 1);
      // HSL
      const hh = d3.hsl(hx);
      if (!isNaN(hh.h)) {
        const hp = { x: hcx + hR * 0.7 * Math.cos(hh.h * Math.PI / 180), y: hcy + hR * 0.7 * Math.sin(hh.h * Math.PI / 180) };
        gHueWheel.append('circle').attr('class', 'ring').attr('cx', hp.x).attr('cy', hp.y).attr('r', 5)
          .attr('fill', hx).attr('stroke', '#0f172a').attr('stroke-width', 1);
      }
      // Lab
      const lp = d3.lab(hx), lpp = labPoint(lp.l, lp.a, lp.b);
      gLabPts.append('circle').attr('class', 'ring').attr('cx', lpp.x).attr('cy', lpp.y).attr('r', 5)
        .attr('fill', hx).attr('stroke', '#0f172a').attr('stroke-width', 1);
    });
    // 主点
    const mr = iso(state.r / 255, state.g / 255, state.b / 255);
    gRGB.append('circle').attr('class', 'main').attr('cx', mr.x).attr('cy', mr.y).attr('r', 7)
      .attr('fill', col).attr('stroke', '#0f172a').attr('stroke-width', 2);
    const hp = { x: hcx + hR * 0.7 * Math.cos((hsl.h || 0) * Math.PI / 180), y: hcy + hR * 0.7 * Math.sin((hsl.h || 0) * Math.PI / 180) };
    gHueWheel.append('circle').attr('class', 'main').attr('cx', hp.x).attr('cy', hp.y).attr('r', 7)
      .attr('fill', col).attr('stroke', '#0f172a').attr('stroke-width', 2);
    const lp = labPoint(lab.l, lab.a, lab.b);
    gLabPts.append('circle').attr('class', 'main').attr('cx', lp.x).attr('cy', lp.y).attr('r', 7)
      .attr('fill', col).attr('stroke', '#0f172a').attr('stroke-width', 2);
    // 读数
    const swatch = `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${col};border:1px solid #94a3b8;vertical-align:-2px;margin-right:4px"></span>`;
    info.innerHTML = T(
      `当前色 ${swatch}${col.toUpperCase()}　RGB(${state.r},${state.g},${state.b})　HSL(${Math.round(hsl.h || 0)},${Math.round((hsl.s || 0) * 100)}%,${Math.round(hsl.l * 100)}%)　Lab(${lab.l.toFixed(0)},${lab.a.toFixed(0)},${lab.b.toFixed(0)})`,
      `Color ${swatch}${col.toUpperCase()}　RGB(${state.r},${state.g},${state.b})　Lab(${lab.l.toFixed(0)},${lab.a.toFixed(0)},${lab.b.toFixed(0)})`);
  }
  const info = document.createElement('div');
  info.className = 'vx-tag'; info.style.cssText = 'display:block;margin:6px 2px;font-size:13px';
  ui.stage.append(info);

  // 三个滑块
  const sR = slider(r1, 'R', { min: 0, max: 255, value: state.r, fmt: v => v }, v => { state.r = v; draw(); });
  const sG = slider(r1, 'G', { min: 0, max: 255, value: state.g, fmt: v => v }, v => { state.g = v; draw(); });
  const sB = slider(r1, 'B', { min: 0, max: 255, value: state.b, fmt: v => v }, v => { state.b = v; draw(); });
  const rb = button(T('生成 RGB 等距环', 'RGB-equidistant ring'), 'primary');
  rb.addEventListener('click', () => { state.ring = !state.ring; rb.classList.toggle('active', state.ring); draw(); });
  r1.append(rb);

  draw();
  ui.setConcl(T(
    `<b>结论：</b>颜色只是颜色空间里的一个坐标。RGB / HSL 是设备导向、<b>不感知均匀</b>的——RGB 里等距的步长在人眼看来色差不等；Lab 以感知差为标尺，相邻点间距才近似均匀，因此是设计感知线性 colormap 的工作空间。`,
    `<b>Takeaway:</b> a color is just a coordinate. RGB/HSL are device-oriented and not perceptually uniform — equal RGB steps look unequal; Lab is scaled to perception, so equal Lab distances look equal, making it the workspace for perceptually linear colormaps.`));
};

// ============================================================
// d03-2 colormap 配色诊断工作台
// ============================================================
D['d03-2'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('同一份真实数据一张图，换用不同 colormap；下方三条诊断曲线分别看：感知亮度是否单调、局部梯度有无假峰、CVD 后相邻色能否分开。',
           'One real dataset colored by different colormaps; the three diagnostic curves show perceptual-lightness monotonicity, local-gradient artifacts, and CVD separability.'),
    lang, accent
  });
  ui.showControls();
  const r1 = document.createElement('div'); r1.className = 'vx-chiprow';
  ui.controls.append(r1);

  const crime = await loadCrime(d3, data);
  // 每 10 万人谋杀率 = murder / population * 1e5，取最高 14 个州
  const rows = crime.map(d => {
    const pop = +d['population'] || 0, mur = +d['murder'] || 0;
    return { name: d['state'], v: pop ? mur / pop * 100000 : 0 };
  }).filter(d => d.name).sort((a, b) => b.v - a.v).slice(0, 14);

  const MAPS = {
    'Viridis（顺序，推荐）': { fn: t => d3.interpolateViridis(t), kind: 'seq' },
    'Cividis（顺序，CVD 友好）': { fn: t => d3.interpolateCividis(t), kind: 'seq' },
    'Blues（顺序单色系）': { fn: t => d3.interpolateBlues(t), kind: 'seq' },
    'RdBu（发散，错误示范）': { fn: t => d3.interpolateRdBu(t), kind: 'div' },
    '彩虹 jet（错误示范）': { fn: t => d3.interpolateRainbow(t), kind: 'jet' }
  };
  let state = { map: 'Viridis（顺序，推荐）' };

  const W = 1060, H = 470;
  const L = svg(d3, ui.stage, W, H);
  const gBar = L.append('g');
  const gDiag = L.append('g');

  const BW = 1010, BX = 30, BY = 36, BH = 180;
  const DX = 30, DY = 300, DW = 1010, DH = 120;
  const N = 40;
  const vmax = d3.max(rows, d => d.v), vmin = d3.min(rows, d => d.v);

  function metrics(fn) {
    const lum = [], grad = [], cvd = [];
    for (let i = 0; i <= N; i++) {
      const hx = fn(i / N);
      const Lv = d3.lab(hx).l;
      lum.push(Lv);
      if (i > 0) {
        const prev = fn((i - 1) / N);
        grad.push(dE(d3, prev, hx));
        cvd.push(dE(d3, cvdHex(d3, prev, 'deutan'), cvdHex(d3, hx, 'deutan')));
      }
    }
    return { lum, grad, cvd };
  }

  function draw() {
    const { fn } = MAPS[state.map];
    gBar.selectAll('*').remove();
    gDiag.selectAll('*').remove();
    // 柱状图
    const slot = BW / rows.length;
    const y = d3.scaleLinear().domain([0, vmax]).range([BY + BH, BY + 10]);
    rows.forEach((d, i) => {
      const t = (d.v - vmin) / (vmax - vmin);
      const hx = fn(t);
      gBar.append('rect')
        .attr('x', BX + i * slot + 2).attr('width', slot - 4)
        .attr('y', y(d.v)).attr('height', BY + BH - y(d.v))
        .attr('fill', hx).attr('rx', 2);
      gBar.append('text').attr('x', BX + i * slot + slot / 2).attr('y', BY + BH + 14)
        .attr('text-anchor', 'end').attr('font-size', 9).attr('fill', '#64748b')
        .attr('transform', `rotate(-55 ${BX + i * slot + slot / 2} ${BY + BH + 14})`).text(d.name);
    });
    gBar.append('text').attr('x', BX).attr('y', BY - 12).attr('font-size', 11).attr('fill', '#0f172a').attr('font-weight', 700)
      .text(T('各州谋杀率（每 10 万人）按 colormap 上色', 'Murder rate per 100k, colored by colormap'));

    // 三条诊断曲线
    const m = metrics(fn);
    const panels = [
      { arr: m.lum, color: '#0891b2', name: T('① 感知亮度 L*（顺序色应单调）', '① Lightness L* (should be monotone)'), key: 'lum' },
      { arr: m.grad, color: '#d97706', name: T('② 局部梯度（jet 出现假峰/假边界）', '② Local gradient (jet has fake peaks)'), key: 'grad' },
      { arr: m.cvd, color: '#db2777', name: T('③ 绿色盲后相邻色差（越大越可分）', '③ Deuteranopia adjacent ΔE (higher = separable)'), key: 'cvd' }
    ];
    // 三条共用一个面板，各自归一化纵向堆叠太挤，改为画在同一坐标系用不同缩放（透明小）
    gDiag.append('rect').attr('x', DX).attr('y', DY - 18).attr('width', DW).attr('height', DH + 26)
      .attr('fill', '#f8fafc').attr('stroke', '#e2e8f0').attr('rx', 8);
    const rows3 = [
      { y0: DY - 8, h: 36, arr: m.lum, range: [0, 100], col: '#0891b2' },
      { y0: DY + 38, h: 36, arr: m.grad, range: [0, Math.max(3, ...m.grad)], col: '#d97706' },
      { y0: DY + 84, h: 36, arr: m.cvd, range: [0, Math.max(3, ...m.cvd)], col: '#db2777' }
    ];
    panels.forEach((p, i) => {
      const rr = rows3[i];
      const line = d3.line().x((d, k) => DX + (k / (rr.arr.length - 1)) * DW)
        .y(d => rr.y0 + rr.h - (d / rr.range[1]) * rr.h);
      gDiag.append('path').attr('d', line(rr.arr)).attr('fill', 'none')
        .attr('stroke', rr.col).attr('stroke-width', 2);
      gDiag.append('text').attr('x', DX + 6).attr('y', rr.y0 + 12).attr('font-size', 10)
        .attr('font-weight', 700).attr('fill', rr.col).text(p.name);
    });
    // 判定
    const mono = m.lum.every((v, i) => i === 0 || v >= m.lum[i - 1] - 1.5) ||
                 m.lum.every((v, i) => i === 0 || v <= m.lum[i - 1] + 1.5);
    const jet = state.map.includes('jet');
    const div = state.map.includes('发散');
    verdict.innerHTML = T(
      `判定：${jet ? 'jet 亮度反复、梯度假峰，<b style="color:#dc2626">不适合有序数据</b>'
        : div ? 'RdBu 是发散色，<b>无意义中点时会误导</b>，这里是单向递增数据'
        : mono ? '亮度单调、无假边界，<b style="color:#059669">适合有序数据</b>'
        : '亮度非严格单调，存在轻微伪边界'}`,
      `Verdict: ${jet ? 'jet has non-monotone lightness and fake peaks — <b>bad for ordered data</b>' : div ? 'RdBu is diverging and misleads without a midpoint' : mono ? 'monotone lightness, no fake boundaries — <b>good</b>' : 'lightness not strictly monotone'}`);
  }
  const verdict = document.createElement('div');
  verdict.className = 'vx-tag'; verdict.style.cssText = 'display:block;margin:6px 2px;font-size:13px';
  ui.stage.append(verdict);

  select(r1, T('colormap：', 'colormap: '), Object.keys(MAPS).map(k => ({ value: k, label: k })), v => { state.map = v; draw(); }, 0);
  draw();
  ui.setConcl(T(
    `<b>结论：</b>有序数据要用<b>顺序色</b>（亮度单调，如 Viridis/Cividis），发散色必须锚定有意义的中点；jet/彩虹色亮度反复、局部梯度制造不存在的边界，且在 CVD 下相邻色糊在一起。`,
    `<b>Takeaway:</b> ordered data need a sequential map with monotone lightness; diverging maps need a meaningful midpoint; jet/rainbow create fake boundaries and collapse under CVD.`));
};

// ============================================================
// d03-3 三色域边界叠加 + clamp 轨迹
// ============================================================
const D65 = [0.95047, 1.0, 1.08883];
function labToXyz(L, a, b) {
  const y = (L + 16) / 116, x = y + a / 500, z = y - b / 200;
  const f = t => { const t3 = t * t * t; return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787; };
  return [f(x) * D65[0], f(y) * D65[1], f(z) * D65[2]];
}
// XYZ(D65) -> 各 RGB 工作空间（线性值）
const GAMUT_M = {
  srgb:    [[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.2040, 1.0570]],
  adobe:   [[2.041369, -0.5649464, -0.3446944], [-0.969266, 1.8760108, 0.041556], [0.0134474, -0.1183897, 1.0154096]],
  rec2020: [[1.7166512, -0.3556708, -0.2533663], [-0.6666844, 1.6164812, 0.0157685], [0.0176399, -0.0427706, 0.9425397]]
};
function xyzToGamut(x, g) {
  const m = GAMUT_M[g];
  return [
    m[0][0] * x[0] + m[0][1] * x[1] + m[0][2] * x[2],
    m[1][0] * x[0] + m[1][1] * x[1] + m[1][2] * x[2],
    m[2][0] * x[0] + m[2][1] * x[1] + m[2][2] * x[2]
  ];
}
function inGamut(L, a, b, g) {
  const q = xyzToGamut(labToXyz(L, a, b), g);
  return q.every(v => v >= -0.002 && v <= 1.002);
}
function gamutBoundary(L, g, steps = 72) {
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const ang = i / steps * 2 * Math.PI;
    let lo = 0, hi = 180;
    for (let k = 0; k < 22; k++) {
      const mid = (lo + hi) / 2;
      if (inGamut(L, mid * Math.cos(ang), mid * Math.sin(ang), g)) lo = mid; else hi = mid;
    }
    pts.push([lo * Math.cos(ang), lo * Math.sin(ang)]);
  }
  return pts;
}
// Lab -> sRGB hex（超色域被 clamp 到 [0,1]）
function labToHexClamped(d3, L, a, b) {
  const q = xyzToGamut(labToXyz(L, a, b), 'srgb');
  const enc = v => { v = Math.max(0, Math.min(1, v)); return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; };
  return d3.rgb(Math.round(enc(q[0]) * 255), Math.round(enc(q[1]) * 255), Math.round(enc(q[2]) * 255)).formatHex();
}

D['d03-3'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('拖动 L* 滑块，三个色域（sRGB / Adobe RGB / Rec.2020）在 a*b* 平面的边界实时缩放；点平面选一个色域外的颜色，看它被 clamp 回 sRGB 的轨迹与色差 ΔE。',
           'Drag L* and watch the three gamut boundaries (sRGB/Adobe RGB/Rec.2020) scale; click a point outside sRGB to see its clamp trajectory and ΔE.'),
    lang, accent
  });
  ui.showControls();
  const r1 = document.createElement('div'); r1.className = 'vx-chiprow';
  ui.controls.append(r1);

  const W = 760, H = 520, CX = 380, CY = 270, SC = 2.0;
  const X = a => CX + a * SC, Y = b => CY - b * SC;
  const L = svg(d3, ui.stage, W, H);
  const gBg = L.append('g'), gBound = L.append('g'), gPick = L.append('g');
  const state = { L: 56, pick: { a: -60, b: 30 } };
  const GAM = [
    { k: 'srgb', name: 'sRGB', fill: '#dbeafe', stroke: '#2563eb', labAng: 90 },
    { k: 'adobe', name: 'Adobe RGB', fill: 'none', stroke: '#d97706', labAng: 4 },
    { k: 'rec2020', name: 'Rec.2020', fill: 'none', stroke: '#dc2626', labAng: 176 }
  ];

  function draw() {
    gBound.selectAll('*').remove(); gPick.selectAll('*').remove();
    // 背景网格
    gBg.selectAll('*').remove();
    gBg.append('rect').attr('x', 40).attr('y', 30).attr('width', 680).attr('height', 440).attr('fill', '#f8fafc').attr('stroke', '#e2e8f0').attr('rx', 10);
    gBg.append('line').attr('x1', X(-150)).attr('y1', CY).attr('x2', X(150)).attr('y2', CY).attr('stroke', '#cbd5e1');
    gBg.append('line').attr('x1', CX).attr('y1', Y(-150)).attr('x2', CX).attr('y2', Y(150)).attr('stroke', '#cbd5e1');
    gBg.append('text').attr('x', X(148)).attr('y', CY - 6).attr('font-size', 11).attr('fill', '#64748b').text('a*');
    gBg.append('text').attr('x', CX + 6).attr('y', Y(148)).attr('font-size', 11).attr('fill', '#64748b').text('b*');

    // 三个色域边界
    GAM.forEach(gm => {
      const poly = gamutBoundary(state.L, gm.k);
      const line = d3.line().x(p => X(p[0])).y(p => Y(p[1])).curve(d3.curveLinearClosed);
      gBound.append('path').attr('d', line(poly))
        .attr('fill', gm.fill).attr('fill-opacity', gm.fill === 'none' ? 0 : 0.5)
        .attr('stroke', gm.stroke).attr('stroke-width', 2).attr('stroke-dasharray', gm.k === 'srgb' ? null : '6 4');
      const li = Math.round(gm.labAng / 360 * 72) % 72;
      const lp = poly[li];
      const lx = X(lp[0]), ly = Y(lp[1]);
      gBound.append('text').attr('x', lx).attr('y', ly - 6).attr('font-size', 11)
        .attr('font-weight', 700).attr('fill', gm.stroke)
        .attr('text-anchor', gm.labAng < 40 ? 'start' : gm.labAng > 140 ? 'end' : 'middle').text(gm.name);
    });

    // 选中点
    const { a, b } = state.pick;
    const inS = inGamut(state.L, a, b, 'srgb');
    const inA = inGamut(state.L, a, b, 'adobe');
    const rawHex = labToHexClamped(d3, state.L, a, b);
    const clampedLab = d3.lab(rawHex);
    // 直接在 Lab 数值空间比较目标点与 clamp 后位置（formatHex 会自动截断，不能用它做原始色）
    const de = Math.sqrt((state.L - clampedLab.l) ** 2 + (a - clampedLab.a) ** 2 + (b - clampedLab.b) ** 2);
    // clamp 轨迹
    gPick.append('line').attr('x1', X(a)).attr('y1', Y(b)).attr('x2', X(clampedLab.a)).attr('y2', Y(clampedLab.b))
      .attr('stroke', inS ? '#cbd5e1' : '#dc2626').attr('stroke-width', 2).attr('stroke-dasharray', '4 3');
    if (!inS) {
      gPick.append('circle').attr('cx', X(a)).attr('cy', Y(b)).attr('r', 8).attr('fill', 'none').attr('stroke', '#dc2626').attr('stroke-width', 2);
      gPick.append('text').attr('x', X(a) + 12).attr('y', Y(b) - 8).attr('font-size', 11).attr('fill', '#dc2626').text(T('超 sRGB', 'out of sRGB'));
    }
    gPick.append('circle').attr('cx', X(a)).attr('cy', Y(b)).attr('r', 6).attr('fill', rawHex).attr('stroke', '#0f172a').attr('stroke-width', 1.5);
    gPick.append('circle').attr('cx', X(clampedLab.a)).attr('cy', Y(clampedLab.b)).attr('r', 5).attr('fill', rawHex).attr('stroke', '#0f172a').attr('stroke-width', 1.5);

    info.innerHTML = T(
      `L*=${state.L.toFixed(0)}，选中 Lab(${state.L.toFixed(0)},${a.toFixed(0)},${b.toFixed(0)})　
      sRGB：<b style="color:${inS ? '#059669' : '#dc2626'}">${inS ? '在内' : '在外'}</b>　
      Adobe RGB：${inA ? '在内' : '在外'}　clamp 后 ${rawHex.toUpperCase()}　ΔE≈<b>${de.toFixed(1)}</b>`,
      `L*=${state.L.toFixed(0)} Lab(${state.L.toFixed(0)},${a.toFixed(0)},${b.toFixed(0)}) sRGB ${inS ? 'inside' : 'OUT'}, ΔE≈<b>${de.toFixed(1)}</b>`);
  }
  const info = document.createElement('div');
  info.className = 'vx-tag'; info.style.cssText = 'display:block;margin:6px 2px;font-size:13px';
  ui.stage.append(info);

  slider(r1, 'L*', { min: 10, max: 90, value: state.L, fmt: v => v }, v => { state.L = v; draw(); });
  // 点平面选色
  L.on('click', (ev) => {
    const [mx, my] = d3.pointer(ev);
    let a = (mx - CX) / SC, b = (CY - my) / SC;
    a = Math.max(-150, Math.min(150, a)); b = Math.max(-150, Math.min(150, b));
    state.pick = { a, b }; draw();
  });

  draw();
  ui.setConcl(T(
    `<b>结论：</b>不同设备能表达的颜色范围（色域）不同：Rec.2020 > Adobe RGB > sRGB。选一个超出 sRGB 的颜色，它会被<b>裁剪（clamp）</b>到边界、产生 ΔE 色差——这就是鲜艳设计在普通屏幕上「发灰发脏」的原因。Lab 是跨色域、感知线性的中转空间。`,
    `<b>Takeaway:</b> gamuts differ in size (Rec.2020 > Adobe RGB > sRGB). An out-of-sRGB color is clamped to the boundary, causing ΔE — why vivid designs look dull on ordinary screens. Lab is the perceptual, device-independent hub.`));
};

// ============================================================
// d03-4 交互 HSL 色轮和谐器
// ============================================================
D['d03-4'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('旋转主色相，切换五种和谐规则，色轮上实时画出几何关系（互补=过圆心直径、类比=相邻扇形、三等分=内接等边三角形、分裂互补=Y 形），右侧多类图同步上色。',
           'Rotate the base hue and switch harmony rules; the wheel draws the geometry and the multi-class chart recolors live.'),
    lang, accent
  });
  ui.showControls();
  const r1 = document.createElement('div'); r1.className = 'vx-chiprow';
  ui.controls.append(r1);

  const students = await loadStudents(d3, data);
  const counts = d3.rollup(students, v => v.length, d => d.cls);
  const groups = [...counts].sort((a, b) => d3.ascending(a[0], b[0]));

  const W = 900, H = 470;
  const L = svg(d3, ui.stage, W, H);
  const wx = 230, wy = 230, R = 175;
  const gWheel = L.append('g');
  const gGeo = L.append('g');
  const gChart = L.append('g');

  const RULES = [
    { k: 'mono', zh: '单色', en: 'Mono', off: [0], kind: 'mono' },
    { k: 'analog', zh: '类比', en: 'Analogous', off: [-30, 0, 30] },
    { k: 'comp', zh: '互补', en: 'Complement', off: [0, 180] },
    { k: 'triad', zh: '三等分', en: 'Triadic', off: [0, 120, 240] },
    { k: 'split', zh: '分裂互补', en: 'Split-comp', off: [0, 150, 210] }
  ];
  const state = { h: 210, rule: 'analog' };

  function palette() {
    const rule = RULES.find(r => r.k === state.rule);
    return rule.off.map((o, i) => {
      if (rule.kind === 'mono') return d3.hsl(state.h, 0.55, 0.38 + i * 0.16).formatHex();
      return d3.hsl((state.h + o + 360) % 360, 0.62, 0.55).formatHex();
    });
  }

  function drawWheel() {
    gWheel.selectAll('*').remove();
    for (let a = 0; a < 360; a += 1.5) {
      gWheel.append('line').attr('x1', wx).attr('y1', wy)
        .attr('x2', wx + R * Math.cos(a * Math.PI / 180)).attr('y2', wy + R * Math.sin(a * Math.PI / 180))
        .attr('stroke', d3.hsl(a, 0.65, 0.55).formatHex()).attr('stroke-width', 2.4);
    }
    gWheel.append('circle').attr('cx', wx).attr('cy', wy).attr('r', 34).attr('fill', '#fff').attr('stroke', '#e2e8f0');
  }
  function hp(angle, rad = 120) {
    return { x: wx + rad * Math.cos(angle * Math.PI / 180), y: wy + rad * Math.sin(angle * Math.PI / 180) };
  }
  function draw() {
    drawWheel();
    gGeo.selectAll('*').remove();
    const pal = palette();
    const rule = RULES.find(r => r.k === state.rule);
    const pts = rule.off.map(o => hp((state.h + o) % 360));
    // 几何关系：连线
    if (rule.k === 'comp') {
      gGeo.append('line').attr('x1', pts[0].x).attr('y1', pts[0].y).attr('x2', pts[1].x).attr('y2', pts[1].y).attr('stroke', '#0f172a').attr('stroke-width', 2).attr('stroke-dasharray', '5 4');
    } else if (rule.k === 'triad' || rule.k === 'split') {
      gGeo.append('polygon').attr('points', pts.map(p => `${p.x},${p.y}`).join(' '))
        .attr('fill', 'none').attr('stroke', '#0f172a').attr('stroke-width', 2).attr('stroke-dasharray', '5 4');
    } else if (rule.k === 'analog') {
      const arc = d3.arc().innerRadius(96).outerRadius(96).startAngle((state.h - 30) * Math.PI / 180).endAngle((state.h + 30) * Math.PI / 180);
      gGeo.append('path').attr('d', arc()).attr('fill', 'none').attr('stroke', '#0f172a').attr('stroke-width', 2).attr('stroke-dasharray', '4 3');
    }
    pts.forEach((p, i) => {
      gGeo.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 11).attr('fill', pal[i]).attr('stroke', '#0f172a').attr('stroke-width', 2);
    });
    // 主色指示（外圈）
    const m = hp(state.h, R + 2);
    gGeo.append('circle').attr('cx', m.x).attr('cy', m.y).attr('r', 4).attr('fill', '#0f172a');

    // 右侧多类图（真实班级计数）
    gChart.selectAll('*').remove();
    const cx0 = 500, top = 70, bw = 320, bh = 300;
    gChart.append('text').attr('x', cx0).attr('y', 40).attr('font-size', 13).attr('font-weight', 700).attr('fill', '#0f172a')
      .text(T('各班级人数（和谐色板上色）', 'Students per class (harmony palette)'));
    const max = d3.max(groups, d => d[1]);
    const barH = 56, gap = 26;
    groups.forEach((g, i) => {
      const col = pal[i % pal.length];
      const y0 = top + i * (barH + gap);
      const w = g[1] / max * bw;
      gChart.append('rect').attr('x', cx0).attr('y', y0).attr('width', w).attr('height', barH).attr('fill', col).attr('rx', 5);
      gChart.append('text').attr('x', cx0 + 8).attr('y', y0 + 24).attr('font-size', 12).attr('fill', (d3.lab(col).l > 60 ? '#0f172a' : '#fff')).text(g[0]);
      gChart.append('text').attr('x', cx0 + w + 8).attr('y', y0 + 34).attr('font-size', 12).attr('font-weight', 700).attr('fill', '#334155').text(g[1]);
    });
    // 色板
    chips.innerHTML = pal.map(c => `<span class="vx-tag" style="background:${c};color:${d3.lab(c).l > 60 ? '#0f172a' : '#fff'};padding:4px 10px">${c.toUpperCase()}</span>`).join('');
  }
  const chips = document.createElement('div');
  chips.className = 'vx-chiprow';
  ui.stage.append(chips);

  slider(r1, T('主色相 H', 'Base hue H'), { min: 0, max: 359, value: state.h, fmt: v => v + '°' }, v => { state.h = v; draw(); });
  segmented(r1, RULES.map(r => ({ value: r.k, label: en ? r.en : r.zh })), v => { state.rule = v; draw(); }, 1);
  draw();
  ui.setConcl(T(
    `<b>结论：</b>和谐规则是色相环上的几何关系——互补对比最强（适合强调/背景），类比自然柔和（适合同类），三等分活泼平衡，分裂互补对比强烈但不刺眼；类别数一般 ≤7，别把连续色当离散色。`,
    `<b>Takeaway:</b> harmonies are geometry on the hue wheel: complements give strongest contrast, analogous are calm, triadic is balanced, split-complement is strong without clashing. Keep categories ≤7 and never use a continuous ramp as discrete categories.`));
};

// 学生「班级×性别」6 类（真实多类别数据）
function studentBands(students) {
  const cls = ['软件工程1班', '软件工程2班', '数据科学1班'];
  const out = [];
  cls.forEach(c => ['男', '女'].forEach(g => {
    out.push({ key: c.replace('软件工程', '软').replace('数据科学', '数') + g, cls, g, items: students.filter(s => s.cls === c && s.gender === g) });
  }));
  return out.filter(b => b.items.length);
}

// ============================================================
// d03-5 经典配色真实图 A/B 量化对比
// ============================================================
D['d03-5'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('同一张真实多类别散点图，切换经典配色并叠加 CVD/灰度滤镜；右侧条形给出各方案在当前滤镜下相邻类别的最小色差（越高越可分）。',
           'One real multi-class scatter: switch palettes and apply CVD/grayscale filters; the bars show each scheme’s minimum between-class ΔE under the current filter.'),
    lang, accent
  });
  ui.showControls();
  const r1 = document.createElement('div'); r1.className = 'vx-chiprow';
  ui.controls.append(r1);

  const bands = studentBands(await loadStudents(d3, data));
  const NC = bands.length;
  const FILTERS = [
    { k: 'normal', zh: '正常', en: 'Normal' },
    { k: 'protan', zh: '红色盲', en: 'Protan' },
    { k: 'deutan', zh: '绿色盲', en: 'Deutan' },
    { k: 'tritan', zh: '蓝色盲', en: 'Tritan' },
    { k: 'gray', zh: '灰度', en: 'Grayscale' }
  ];
  const state = { pal: 'Wong / Okabe-Ito', f: 'normal' };
  const seen = (hex) => state.f === 'normal' ? hex : cvdHex(d3, hex, state.f);

  const W = 1060, H = 480;
  const L = svg(d3, ui.stage, W, H);
  const gS = L.append('g'), gM = L.append('g');

  function score(pal) {
    const cs = pal.slice(0, NC).map(c => seen(c));
    let mn = 999;
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
      const dd = state.f === 'gray'
        ? Math.abs(relLum(d3, cs[i]) - relLum(d3, cs[j])) * 100
        : dE(d3, cs[i], cs[j]);
      mn = Math.min(mn, dd);
    }
    return mn;
  }
  function drawScatter() {
    gS.selectAll('*').remove();
    gS.append('rect').attr('x', 20).attr('y', 20).attr('width', 600).attr('height', 430).attr('fill', '#f8fafc').attr('stroke', '#e2e8f0').attr('rx', 10);
    const pal = PALETTES[state.pal].slice(0, NC);
    const bandH = 400 / NC;
    bands.forEach((b, i) => {
      const col = seen(pal[i]);
      const y = 40 + i * bandH + bandH / 2;
      gS.append('text').attr('x', 28).attr('y', y + 4).attr('font-size', 10).attr('fill', '#475569').text(b.key);
      b.items.forEach((s, k) => {
        const x = 150 + ((k * 37 + i * 13) % 440) + 12;
        gS.append('circle').attr('cx', x).attr('cy', y + ((k * 7) % 26) - 13).attr('r', 4.6)
          .attr('fill', col).attr('stroke', '#0f172a').attr('stroke-width', 0.5).attr('fill-opacity', 0.9);
      });
    });
    gS.append('text').attr('x', 28).attr('y', 455).attr('font-size', 11).attr('fill', '#64748b')
      .text(T('每个横条 = 一个班级×性别类别，点为该类学生', 'Each band = a class×gender group; dots are students'));
  }
  function drawMetrics() {
    gM.selectAll('*').remove();
    const scores = Object.keys(PALETTES).map(name => ({ name, v: score(PALETTES[name]) }));
    const mx = d3.max(scores, d => d.v);
    const x0 = 820, top = 56, rh = 38, bw = 200;
    gM.append('text').attr('x', 640).attr('y', 40).attr('font-size', 12).attr('font-weight', 700).attr('fill', '#0f172a')
      .text(T('最小相邻类色差（越高越可分）', 'Minimum between-class ΔE (higher = separable)'));
    scores.forEach((s, i) => {
      const y = top + i * rh;
      const sel = s.name === state.pal;
      gM.append('text').attr('x', 640).attr('y', y + 14).attr('font-size', 9.5).attr('fill', sel ? '#0f172a' : '#64748b').attr('font-weight', sel ? 700 : 400)
        .text(s.name.length > 16 ? s.name.slice(0, 15) + '…' : s.name);
      gM.append('rect').attr('x', x0).attr('y', y).attr('width', bw).attr('height', 22).attr('fill', '#eef2f7').attr('rx', 4);
      gM.append('rect').attr('x', x0).attr('y', y).attr('width', Math.max(2, s.v / mx * bw)).attr('height', 22)
        .attr('fill', s.name.includes('反面') ? '#94a3b8' : (sel ? accent : '#0891b2')).attr('rx', 4);
      gM.append('text').attr('x', x0 + bw + 6).attr('y', y + 16).attr('font-size', 10).attr('fill', '#334155').text(s.v.toFixed(1));
    });
  }
  drawScatter(); drawMetrics();
  select(r1, T('配色：', 'Palette: '), Object.keys(PALETTES).map(k => ({ value: k, label: k })), v => { state.pal = v; drawScatter(); drawMetrics(); }, 0);
  segmented(r1, FILTERS.map(f => ({ value: f.k, label: en ? f.en : f.zh })), v => { state.f = v; drawScatter(); drawMetrics(); }, 0);
  ui.setConcl(T(
    `<b>结论：</b>Wong / Okabe-Ito、Paul Tol 在正常与 CVD 下都保持较大最小色差，灰度下也有明暗差——成为科研黄金标准；彩虹 jet 的相邻色在绿色盲下几乎重合。类别数控制在 7 以内，连续色不能当离散色。`,
    `<b>Takeaway:</b> Wong/Okabe-Ito and Paul Tol keep large minimum ΔE even under CVD and grayscale, hence the golden standard; jet collapses under deuteranopia. Keep ≤7 categories and never use a continuous ramp discretely.`));
};

// ============================================================
// d03-6 配色找茬闯关
// ============================================================
D['d03-6'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('每张图都有一个配色错误。先点击图中可疑区域，再选择问题类型；答对后区域高亮、给出解释，可一键「修复」看前后对比，然后进入下一关。',
           'Each chart has a color flaw. Click the suspect region, then pick the issue type; correct answers highlight it and explain. Fix it to compare, then continue.'),
    lang, accent
  });
  ui.showControls();
  const r1 = document.createElement('div'); r1.className = 'vx-chiprow';
  ui.controls.append(r1);
  const W = 900, H = 420;
  const L = svg(d3, ui.stage, W, H);
  const g = L.append('g');

  const N = 14, vals = d3.range(N).map((_, i) => 18 + i * 5.4 + (i % 3) * 2);
  const ROUNDS = [
    {
      name: T('第 1 关：递增的连续数据', 'Round 1: increasing sequential data'),
      opts: [T('颜色太多超过 7 类', 'Too many colors'), T('彩虹/jet 色制造假边界', 'Rainbow/jet fake bands'), T('红绿难分', 'Red-green confusion'), T('文字对比不足', 'Low text contrast')],
      ans: 1,
      explain: T('有序数据用 jet/彩虹色，亮度反复、局部出现不存在的「边界」，还把注意力引向黄色。应换亮度单调的 Viridis。',
                 'Sequential data in jet/rainbow has non-monotone lightness and false boundaries, pulling the eye to yellow. Use monotone Viridis.'),
      problem: d3.range(N),
      bad: i => d3.interpolateRainbow(i / (N - 1)), fix: i => d3.interpolateViridis(i / (N - 1))
    },
    {
      name: T('第 2 关：两组状态（正常/异常）', 'Round 2: two groups'),
      opts: [T('颜色太多超过 7 类', 'Too many colors'), T('彩虹/jet 色制造假边界', 'Rainbow fake bands'), T('红绿难分（CVD 不可区分）', 'Red-green CVD confusion'), T('亮度倒挂', 'Inverted lightness')],
      ans: 2,
      explain: T('纯红配纯绿是最常见的色盲陷阱：约 8% 男性红绿色盲无法区分。改用蓝/橙并加形状/标签。',
                 'Pure red vs pure green is the classic CVD trap (≈8% of men). Use blue/orange plus shape or label.'),
      problem: d3.range(N),
      bad: i => i % 2 ? '#d62728' : '#2ca02c', fix: i => i % 2 ? '#d55e00' : '#0072b2'
    },
    {
      name: T('第 3 关：10 个无顺序类别', 'Round 3: ten unordered categories'),
      opts: [T('类别色过多（应 ≤7）', 'Too many categories (>7)'), T('发散色无中点', 'Diverging without midpoint'), T('红绿难分', 'Red-green confusion'), T('强调色太弱', 'Weak accent')],
      ans: 0,
      explain: T('人眼能可靠命名的色相有限，类别超过 7 个就难以区分和记忆。应合并小类，或改用 Wong 等 ≤7 色并加直接标签。',
                 'Few hues can be reliably named; beyond ~7 categories they become unmemorable. Merge small groups or use ≤7 colors plus labels.'),
      problem: d3.range(N),
      bad: i => d3.schemeCategory10[i % 10], fix: i => ['#0072b2', '#e69f00', '#009e73', '#cc79a7', '#56b4e9'][Math.min(4, Math.floor(i / 3))]
    },
    {
      name: T('第 4 关：需要突出的关键项', 'Round 4: highlight the key item'),
      opts: [T('颜色太多', 'Too many colors'), T('jet 假边界', 'jet fake bands'), T('红绿难分', 'Red-green confusion'), T('强调色对比不足、关键项埋没', 'Key item not emphasized')],
      ans: 3,
      explain: T('关键项用了和背景相近的灰色，对比不足、埋没在同类里。应让其他类别低饱和、关键项用唯一强调色。',
                 'The key item is gray like the background and buried. Make the others low-saturation and reserve a unique accent for the key item.'),
      problem: [6],
      bad: i => i === 6 ? '#cbd5e1' : '#6366f1', fix: i => i === 6 ? '#d97706' : '#c7d2fe'
    }
  ];

  let r = 0, score = 0, picked = false, chosen = null, fixed = false;
  const gx = 60, gy = 70, bw = 48, gap = 12, baseY = 360;
  function render() {
    g.selectAll('*').remove();
    const rd = ROUNDS[r];
    g.append('text').attr('x', 30).attr('y', 44).attr('font-size', 14).attr('font-weight', 700).attr('fill', '#0f172a').text(rd.name);
    g.append('text').attr('x', 740).attr('y', 44).attr('font-size', 12).attr('fill', '#64748b').text(T(`进度 ${r + 1}/${ROUNDS.length}　得分 ${score}`, `Round ${r + 1}/${ROUNDS.length}　Score ${score}`));
    const fn = fixed ? rd.fix : rd.bad;
    vals.forEach((v, i) => {
      const h = v / 80 * 250;
      const isProb = rd.problem.includes(i);
      const rect = g.append('rect').attr('x', gx + i * (bw + gap)).attr('y', baseY - h).attr('width', bw).attr('height', h)
        .attr('fill', fn(i)).attr('rx', 3).attr('stroke', '#fff').attr('stroke-width', 1)
        .style('cursor', isProb ? 'pointer' : 'default');
      if (picked && isProb) rect.attr('stroke', '#dc2626').attr('stroke-width', 3);
      rect.on('click', () => {
        if (isProb) { picked = true; feedback.textContent = T('已选中问题区域，现在请选择问题类型。', 'Region selected — now pick the issue type.'); render(); }
        else feedback.textContent = T('这里不是关键问题区域，再找找。', 'Not the problem region — try again.');
      });
    });
    // 第 2 关加形状/标签（修复态）体现冗余
    if (fixed && r === 1) {
      vals.forEach((v, i) => {
        const h = v / 80 * 250;
        g.append('text').attr('x', gx + i * (bw + gap) + bw / 2).attr('y', baseY - h / 2).attr('text-anchor', 'middle')
          .attr('font-size', 12).attr('font-weight', 700).attr('fill', '#fff').text(i % 2 ? '!' : '✓');
      });
    }
    // 控件状态
    r1.innerHTML = '';
    if (!fixed) {
      rd.opts.forEach((o, i) => {
        const b = button(o, '');
        b.addEventListener('click', () => {
          if (!picked) { feedback.textContent = T('请先点击图中可疑区域。', 'First click the suspect region.'); return; }
          if (i === rd.ans) {
            score++; chosen = true; feedback.innerHTML = `<b style="color:#059669">${T('回答正确：', 'Correct: ')}</b>${rd.explain}`;
            render(); const fb = button(T('一键修复 / 前后对比', 'Fix it / compare'), 'primary');
            fb.addEventListener('click', () => { fixed = true; render(); });
            r1.append(fb);
          } else { feedback.textContent = T('不太对，再想想该配色问题的类型。', 'Not quite — reconsider the issue type.'); }
        });
        r1.append(b);
      });
    } else {
      const nb = button(r < ROUNDS.length - 1 ? T('下一关 ⟩', 'Next ⟩') : T('完成 ⓪', 'Finish ⓪'), 'primary');
      nb.addEventListener('click', () => {
        if (r < ROUNDS.length - 1) { r++; picked = false; chosen = null; fixed = false; feedback.textContent = ''; render(); }
        else {
          feedback.innerHTML = T(`<b>闯关结束！</b>共 ${ROUNDS.length} 关，得分 ${score}。你已掌握：避免 jet、避免红绿、类别≤7、强调唯一。`,
            `<b>Done!</b> Score ${score}/${ROUNDS.length}. You can now avoid jet, red-green, >7 categories, and weak accents.`);
          g.selectAll('*').remove();
          g.append('text').attr('x', 450).attr('y', 210).attr('text-anchor', 'middle').attr('font-size', 24).attr('font-weight', 800).attr('fill', '#059669').text(T(`得分 ${score} / ${ROUNDS.length}`, `Score ${score} / ${ROUNDS.length}`));
        }
      });
      r1.append(nb);
    }
  }
  const feedback = document.createElement('div');
  feedback.className = 'vx-tag'; feedback.style.cssText = 'display:block;margin:6px 2px;font-size:13px;min-height:20px';
  ui.stage.append(feedback);
  render();
  ui.setConcl(T(
    `<b>结论：</b>主动识别比被动投票更有效：有序数据忌 jet、类别忌红绿、类别数忌超 7、强调色忌低对比。每个坑都能用「换色 + 冗余通道」一键修复。`,
    `<b>Takeaway:</b> spotting the flaw is a skill: no jet for ordered data, no red-green, ≤7 categories, and a single strong accent. Each is fixable by recoloring plus a redundant channel.`));
};

// ============================================================
// d03-7 多面板仪表板上色 + WCAG 对比度检测
// ============================================================
D['d03-7'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('调主色相与饱和度，给下方多面板仪表板（柱/线/区/标注）整体上色；下方实时检查 WCAG 文字对比、相邻块色差与饱和度分布。',
           'Tune base hue and saturation to color the multi-panel dashboard; live checks show WCAG text contrast, adjacent ΔE and saturation spread.'),
    lang, accent
  });
  ui.showControls();
  const r1 = document.createElement('div'); r1.className = 'vx-chiprow';
  ui.controls.append(r1);
  const W = 1000, H = 420;
  const L = svg(d3, ui.stage, W, H);
  const state = { h: 222, s: 70 };
  const g = L.append('g');

  function palette() {
    const s = state.s / 100;
    const main = d3.hsl(state.h, s, 0.45).formatHex();
    // 配套低饱和色（同一色相、降饱和）
    const support = d3.hsl(state.h, s * 0.32, 0.62).formatHex();
    const accent2 = d3.hsl((state.h + 180) % 360, Math.min(0.85, s * 0.9), 0.45).formatHex();
    const neutral = d3.hsl(state.h, s * 0.12, 0.78).formatHex();
    return { main, support, accent2, neutral };
  }
  function draw() {
    g.selectAll('*').remove();
    const p = palette();
    // 柱图
    g.append('rect').attr('x', 20).attr('y', 30).attr('width', 300).attr('height', 200).attr('fill', '#f8fafc').attr('stroke', '#e2e8f0').attr('rx', 8);
    g.append('text').attr('x', 32).attr('y', 52).attr('font-size', 11).attr('font-weight', 700).attr('fill', '#0f172a').text(T('柱状（主色）', 'Bars (main)'));
    const bv = [40, 70, 55, 90, 60];
    bv.forEach((v, i) => {
      const top = 210 - v * 1.6;
      g.append('rect').attr('x', 40 + i * 54).attr('y', top).attr('width', 40).attr('height', v * 1.6).attr('fill', p.main).attr('rx', 3);
      g.append('text').attr('x', 60 + i * 54).attr('y', top + 16).attr('text-anchor', 'middle').attr('font-size', 10).attr('font-weight', 700).attr('fill', '#fff').text(v);
    });
    // 线图（配套低饱和 + 强调点）
    g.append('rect').attr('x', 340).attr('y', 30).attr('width', 300).attr('height', 200).attr('fill', '#f8fafc').attr('stroke', '#e2e8f0').attr('rx', 8);
    g.append('text').attr('x', 352).attr('y', 52).attr('font-size', 11).attr('font-weight', 700).attr('fill', '#0f172a').text(T('趋势（配套低饱和 + 强调）', 'Trend (support + accent)'));
    const pts = [140, 120, 128, 96, 100, 70].map((y, i) => [360 + i * 45, y]);
    g.append('path').attr('d', d3.line()(pts)).attr('fill', 'none').attr('stroke', p.support).attr('stroke-width', 3);
    g.append('circle').attr('cx', pts[5][0]).attr('cy', pts[5][1]).attr('r', 6).attr('fill', p.accent2).attr('stroke', '#fff').attr('stroke-width', 2);
    // 区域图
    g.append('rect').attr('x', 660).attr('y', 30).attr('width', 320).attr('height', 200).attr('fill', '#f8fafc').attr('stroke', '#e2e8f0').attr('rx', 8);
    g.append('text').attr('x', 672).attr('y', 52).attr('font-size', 11).attr('font-weight', 700).attr('fill', '#0f172a').text(T('面积（中性）', 'Area (neutral)'));
    const ap = [180, 160, 170, 140, 150].map((y, i) => [680 + i * 58, y]);
    g.append('path').attr('d', d3.area().x(d => d[0]).y0(210).y1(d => d[1])(ap)).attr('fill', p.neutral).attr('fill-opacity', 0.9).attr('stroke', p.support).attr('stroke-width', 1.5);
    // 标注文字
    g.append('text').attr('x', 20).attr('y', 270).attr('font-size', 14).attr('fill', p.main).attr('font-weight', 700).text(T('关键指标（主色文字）', 'KPI (main-color text)'));
    g.append('text').attr('x', 20).attr('y', 296).attr('font-size', 12).attr('fill', '#64748b').text(T('辅助说明文字（中性灰）', 'Supporting note (neutral gray)'));

    // 检查
    const cWhite = contrast(d3, p.main, '#ffffff');
    const cText = contrast(d3, p.main, '#ffffff');
    const adj = dE(d3, p.main, p.support);
    const satMain = d3.hsl(p.main).s, setSup = d3.hsl(p.support).s;
    const rows = [
      { label: T('柱内白字 WCAG 对比 (≥4.5)', 'White-on-bar WCAG (≥4.5)'), v: cWhite, pass: cWhite >= 4.5, fmt: x => x.toFixed(2) },
      { label: T('主色↔配套色 色差 (ΔE≥15)', 'Main↔support ΔE (≥15)'), v: adj, pass: adj >= 15, fmt: x => x.toFixed(1) },
      { label: T('主色饱和度', 'Main saturation'), v: satMain * 100, pass: satMain >= 0.45, fmt: x => Math.round(x) + '%' },
      { label: T('配套色饱和度（应明显更低）', 'Support saturation (should be low)'), v: setSup * 100, pass: setSup <= 0.35, fmt: x => Math.round(x) + '%' }
    ];
    g.selectAll('.chk').remove();
    rows.forEach((row, i) => {
      const y = 320 + i * 24;
      g.append('text').attr('class', 'chk').attr('x', 20).attr('y', y).attr('font-size', 11).attr('fill', '#334155').text(row.label);
      g.append('text').attr('class', 'chk').attr('x', 360).attr('y', y).attr('font-size', 11).attr('font-weight', 700)
        .attr('fill', row.pass ? '#059669' : '#dc2626').text(`${row.fmt(row.v)}　${row.pass ? '✓ ' + T('达标', 'pass') : '✗ ' + T('不达标', 'fail')}`);
    });
  }
  slider(r1, T('主色相 H', 'Base hue H'), { min: 0, max: 359, value: state.h, fmt: v => v + '°' }, v => { state.h = v; draw(); });
  slider(r1, T('饱和度 S', 'Saturation S'), { min: 10, max: 100, value: state.s, fmt: v => v + '%' }, v => { state.s = v; draw(); });
  draw();
  ui.setConcl(T(
    `<b>结论：</b>耐看的仪表板遵循「主色鲜明、配套低饱和、强调色唯一」：主色承担识别与关键数据，配套色降饱和当背景，强调色只给一个重点；柱内白字对比要 ≥4.5。全饱和、大面积高彩会让人疲劳。`,
    `<b>Takeaway:</b> a durable dashboard uses a vivid main color, low-saturation supports and one accent; white text on bars needs contrast ≥4.5. Large areas of full saturation cause fatigue.`));
};

// ============================================================
// d03-8 实时 CVD/灰度滤镜 + 冗余编码修复
// ============================================================
D['d03-8'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('先在正常/红色盲/绿色盲/蓝色盲/灰度间切换，看红绿两类如何糊在一起；再逐项添加形状、文字标签、纹理、改用 Wong 色，观察它们如何在滤镜下重新可分。',
           'Switch vision filters to see red/green classes merge; then add shapes, labels, texture and the Wong palette one by one and watch them separate again.'),
    lang, accent
  });
  ui.showControls();
  const r1 = document.createElement('div'); r1.className = 'vx-chiprow';
  const r2 = document.createElement('div'); r2.className = 'vx-chiprow';
  ui.controls.append(r1, r2);

  const bands = studentBands(await loadStudents(d3, data));
  const FILTERS = [
    { k: 'normal', zh: '正常', en: 'Normal' },
    { k: 'protan', zh: '红色盲', en: 'Protan' },
    { k: 'deutan', zh: '绿色盲', en: 'Deutan' },
    { k: 'tritan', zh: '蓝色盲', en: 'Tritan' },
    { k: 'gray', zh: '灰度', en: 'Gray' }
  ];
  // 初始用「红绿陷阱」：颜色只编码性别，且红 #c0392b 与绿 #2d6528 在灰度下亮度相同（都≈85）
  const BAD = ['#c0392b', '#2d6528', '#c0392b', '#2d6528', '#c0392b', '#2d6528'];
  // Wong 按明暗交错重排，相邻（男/女）在灰度下也有明暗差
  const WONG = ['#0072b2', '#e69f00', '#d55e00', '#56b4e9', '#009e73', '#cc79a7'];
  const state = { f: 'normal', shape: false, label: false, tex: false, wong: false };

  // 纹理 pattern
  const defs = () => `
    <pattern id="d38p0" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="transparent"/><line x1="0" y1="0" x2="0" y2="6" stroke="#fff" stroke-width="1.4"/></pattern>
    <pattern id="d38p1" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.3" fill="#fff"/></pattern>
    <pattern id="d38p2" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#fff" stroke-width="1.4"/></pattern>
    <pattern id="d38p3" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="transparent"/><line x1="0" y1="3" x2="6" y2="3" stroke="#fff" stroke-width="1.3"/></pattern>
    <pattern id="d38p4" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="transparent"/><path d="M0,8 L4,0 L8,8" fill="none" stroke="#fff" stroke-width="1.2"/></pattern>
    <pattern id="d38p5" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="transparent"/><circle cx="3" cy="3" r="1.1" fill="#fff"/></pattern>`;

  const W = 760, H = 460;
  const L = svg(d3, ui.stage, W, H);
  L.append('defs').html(defs());
  const g = L.append('g');
  const SYM = [d3.symbolCircle, d3.symbolSquare, d3.symbolTriangle, d3.symbolDiamond, d3.symbolCross, d3.symbolStar];
  const NC = bands.length;

  function draw() {
    g.selectAll('*').remove();
    g.append('rect').attr('x', 20).attr('y', 20).attr('width', 720).attr('height', 420).attr('fill', '#f8fafc').attr('stroke', '#e2e8f0').attr('rx', 10);
    const base = state.wong ? WONG : BAD;
    const bandH = 400 / NC;
    bands.forEach((b, i) => {
      const col = state.f === 'normal' ? base[i] : cvdHex(d3, base[i], state.f);
      const y = 40 + i * bandH + bandH / 2;
      g.append('text').attr('x', 28).attr('y', y + 4).attr('font-size', 10).attr('fill', '#475569').text(b.key);
      b.items.forEach((s, k) => {
        const x = 150 + ((k * 37 + i * 13) % 520) + 16;
        const yy = y + ((k * 7) % 26) - 13;
        if (state.shape) {
          g.append('path').attr('d', d3.symbol().type(SYM[i]).size(85)()).attr('transform', `translate(${x},${yy})`)
            .attr('fill', col).attr('stroke', '#0f172a').attr('stroke-width', 0.6);
        } else {
          g.append('circle').attr('cx', x).attr('cy', yy).attr('r', 5.2)
            .attr('fill', state.tex ? `url(#d38p${i})` : col).attr('fill-opacity', 0.92)
            .attr('stroke', col).attr('stroke-width', 0.8);
        }
        if (state.label) {
          g.append('text').attr('x', x).attr('y', yy + 3).attr('text-anchor', 'middle').attr('font-size', 8)
            .attr('font-weight', 700).attr('fill', d3.lab(col).l > 65 ? '#0f172a' : '#fff').text(i + 1);
        }
      });
    });
    // 可分性读数：比较「男」组（偶数带）与「女」组（奇数带）两个颜色组的最小色差
    const seen = c => state.f === 'normal' ? c : cvdHex(d3, c, state.f);
    let mn = 999;
    const males = [0, 2, 4].filter(i => i < NC), females = [1, 3, 5].filter(i => i < NC);
    males.forEach(i => females.forEach(j => {
      const dd = dE(d3, seen(base[i]), seen(base[j]));
      mn = Math.min(mn, dd);
    }));
    // 冗余通道一旦加入，即使颜色相同也可分
    const redundant = state.shape || state.label || state.tex;
    const separable = redundant || mn > 10;
    const rlist = [state.shape ? (en ? 'shape' : '形状') : '', state.label ? (en ? 'label' : '标签') : '', state.tex ? (en ? 'texture' : '纹理') : '', state.wong ? 'Wong' : ''].filter(Boolean).join('、');
    readout.innerHTML = T(
      `当前滤镜下男/女两色最小色差 ΔE≈<b style="color:${separable ? '#059669' : '#dc2626'}">${mn.toFixed(1)}</b>　${separable ? '两类仍可区分' : '两类几乎无法区分（仅靠颜色）'}；冗余通道：${rlist || (en ? 'none' : '无')}`,
      `Min male/female color ΔE≈<b style="color:${separable ? '#059669' : '#dc2626'}">${mn.toFixed(1)}</b>　${separable ? 'groups separable' : 'groups indistinguishable by color alone'}; redundancy: ${rlist || 'none'}`);
  }
  const readout = document.createElement('div');
  readout.className = 'vx-tag'; readout.style.cssText = 'display:block;margin:6px 2px;font-size:13px';
  ui.stage.append(readout);

  segmented(r1, FILTERS.map(f => ({ value: f.k, label: en ? f.en : f.zh })), v => { state.f = v; draw(); }, 0);
  toggle(r2, T('形状标记', 'Shapes'), false, v => { state.shape = v; draw(); });
  toggle(r2, T('文字标签', 'Labels'), false, v => { state.label = v; draw(); });
  toggle(r2, T('纹理填充', 'Texture'), false, v => { state.tex = v; if (v) state.shape = false; draw(); });
  toggle(r2, T('改用 Wong 色', 'Use Wong'), false, v => { state.wong = v; draw(); });
  draw();
  ui.setConcl(T(
    `<b>结论：</b>颜色不是唯一的编码通道。红绿在绿色盲下 ΔE 骤降到难以区分；加入<b>形状、直接标签、纹理</b>等不依赖颜色的冗余通道，或直接采用 Wong 色，就能在各种视觉条件下重新可分——这是可访问性的正解。`,
    `<b>Takeaway:</b> color is not the only channel. Red-green ΔE collapses under deuteranopia; add shape, label or texture (redundant, non-color channels) or switch to Wong to stay separable — the accessibility solution.`));
};

export default D;
