// ============================================================
// d04.js — 第 4 章《低维数据可视化》交互演示（5 个，全部重新设计）
//   d04-1 宽/长格式 → 数据单元飞行 morph（tidy data，单元守恒）
//   d04-2 三层坐标变换（数据域 → 归一化 → 屏幕像素，网格变形）
//   d04-3 曲线拟合 10 小倍数 + 过冲检测（拖拽控制点联动）
//   d04-4 倾角感知心理物理实验（自产误差曲线，45° 最准）
//   d04-5 Marching Squares 逐格算法动画 + 鼠标塑形 + 插值对比
// 函数签名：(mount, { d3, data, lang, accent }) => {}
// ============================================================
import { shell, svg, makeCtx, button, segmented, slider, select, toggle, tooltip, C } from './_ui.js';

const D = {};

// 载入各州犯罪率（50 州，列名小写）
async function loadCrime(d3, data) {
  return d3.csv(data + 'crime.csv', d => ({
    state: d.state,
    population: +d.population,
    robbery: +d.robbery,
    aggravated_assault: +d.aggravated_assault,
    burglary: +d.burglary,
    larceny_theft: +d.larceny_theft,
    motor_vehicle_theft: +d.motor_vehicle_theft,
    murder: +d.murder,
    arson: +d.arson
  }));
}

// ============================================================
// d04-1 宽/长格式 morph
// ============================================================
D['d04-1'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('宽表（州 × 指标）里位置同时编码了州和指标；点「重塑为长表」，每个数据单元飞到一行三元组（州, 指标, 值）——单元数量守恒，只是重排。这就是 tidy data 的 melt/cast。',
           'In the wide table position encodes both state and metric; reshape to long and each cell flies into a (state, metric, value) triple — the count is conserved, only rearranged. That is melt/cast.'),
    lang, accent
  });
  ui.showControls();
  const rows = (await loadCrime(d3, data))
    .sort((a, b) => b.population - a.population).slice(0, 6);
  const METRICS = [
    { k: 'murder', zh: '谋杀', en: 'Murder' },
    { k: 'robbery', zh: '抢劫', en: 'Robbery' },
    { k: 'burglary', zh: '入室盗窃', en: 'Burglary' },
    { k: 'arson', zh: '纵火', en: 'Arson' }
  ];
  // 每个数据单元：{state, metric, value}
  const cells = [];
  rows.forEach((r, i) => METRICS.forEach((mm, j) =>
    cells.push({ state: r.state, m: mm.k, mzh: mm.zh, men: mm.en, v: r[mm.k], i, j })));

  // ---- 布局舞台（HTML 绝对定位）----
  const stage = document.createElement('div');
  stage.style.cssText = 'position:relative;width:100%;height:430px;margin-top:6px;';
  ui.stage.append(stage);
  // 表头层
  const heads = document.createElement('div');
  heads.style.cssText = 'position:relative;height:26px;margin-bottom:4px;';
  stage.before(heads);

  const W = 760, labelW = 120;
  const gridW = W - labelW, cw = gridW / METRICS.length;
  const rowH = 44, longH = 360 / cells.length;
  let mode = 'wide';

  // 州标签（宽表左侧，纵向位置随宽表）
  const stateLabels = rows.map((r, i) => {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;left:0;top:${30 + i * rowH}px;width:${labelW - 8}px;height:${rowH}px;display:flex;align-items:center;font-size:12px;color:#454e5e;font-weight:600;`;
    el.textContent = r.state;
    stage.append(el);
    return el;
  });

  const cellEls = cells.map((c, k) => {
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;display:flex;align-items:center;justify-content:center;border:1px solid #c3cad6;border-radius:6px;background:#fff;font-size:13px;box-sizing:border-box;transition:transform .65s cubic-bezier(.5,-0.2,.3,1.2),width .65s,background .3s;overflow:hidden;white-space:nowrap;';
    el.textContent = c.v;
    stage.append(el);
    return el;
  });
  const headEls = METRICS.map((mm, j) => {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;top:0;left:${labelW + j * cw}px;width:${cw}px;text-align:center;font-size:12px;color:#0f766e;font-weight:700;transition:opacity .3s;`;
    el.textContent = T(mm.zh, mm.en);
    heads.append(el);
    return el;
  });

  const trackSel = select(ui.controls, T('跟踪某州', 'Track a state'),
    rows.map((r, i) => ({ label: r.state, value: i })), () => render(), 0);

  function layout() {
    const track = +trackSel.select.value;
    heads.style.opacity = mode === 'wide' ? '1' : '0';
    stateLabels.forEach((el, i) => {
      el.style.transition = 'opacity .3s';
      el.style.opacity = mode === 'wide' ? '1' : '0';
    });
    cellEls.forEach((el, k) => {
      const c = cells[k];
      const hi = c.i === track;
      el.style.background = hi ? '#bfe3ee' : '#fff';
      el.style.borderColor = hi ? '#176c6b' : '#c3cad6';
      if (mode === 'wide') {
        const x = labelW + c.j * cw, y = 30 + c.i * rowH;
        el.style.width = cw - 6 + 'px';
        el.style.height = rowH - 6 + 'px';
        el.style.transform = `translate(${x + 3}px,${y + 3}px)`;
        el.textContent = c.v;
      } else {
        const x = labelW;
        const y = 6 + k * longH;
        el.style.width = gridW + 'px';
        el.style.height = longH - 3 + 'px';
        el.style.justifyContent = 'flex-start';
        el.style.paddingLeft = '10px';
        el.style.transform = `translate(${x}px,${y}px)`;
        el.textContent = `${c.state}  ·  ${T(c.mzh, c.men)}  ·  ${c.v}`;
      }
      if (mode === 'wide') { el.style.justifyContent = 'center'; el.style.paddingLeft = '0'; }
    });
  }

  const btn = button(T('⇄ 重塑为长表 (melt)', '⇄ Reshape to long (melt)'), 'vx-btn');
  btn.addEventListener('click', () => {
    mode = mode === 'wide' ? 'long' : 'wide';
    btn.textContent = mode === 'wide'
      ? T('⇄ 重塑为长表 (melt)', '⇄ Reshape to long (melt)')
      : T('⇄ 还原为宽表 (cast)', '⇄ Back to wide (cast)');
    layout();
  });
  ui.controls.prepend(btn);
  layout();

  ui.setConcl(T(
    `<b>结论：</b>宽表每个单元的位置隐含了「州」和「指标」两个变量；melt 把它们变成显式列，得到 (州, 指标, 值) 三元组。<b>共 ${cells.length} 个单元，重塑前后数量不变</b>，只是把「位置编码」改成「列编码」——长表才是 d3/group/聚合想要的 tidy 形状。`,
    `<b>Takeaway:</b> in a wide table position hides two variables; melt turns them into explicit columns. <b>${cells.length} cells before and after</b> — reshape only converts positional encoding into column encoding, the tidy form that grouping expects.`));
};

// ============================================================
// d04-2 三层坐标变换（数据域 → 归一化 → 屏幕像素）
// ============================================================
D['d04-2'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('同一批谋杀率（每 10 万人）在三层之间逐层转换：数据域→归一化坐标→屏幕像素。切 linear/log/sqrt，看网格被拉伸/压缩、右偏数据被「拉直」，并跟踪一个点穿过三层。',
           'The same murder rates (per 100k) pass through three layers: data domain → normalized → screen pixels. Switch linear/log/sqrt to see the grid warp and the right-skewed data straighten; track one point through all layers.'),
    lang, accent
  });
  ui.showControls();
  const rows = await loadCrime(d3, data);
  const vals = rows.map(r => r.murder / r.population * 100000).filter(v => v > 0)
    .sort((a, b) => a - b).filter((_, i, arr) => i % 4 === 0).slice(0, 14);
  const vmin = vals[0], vmax = vals[vals.length - 1];

  let scale = 'linear', pick = 7;
  const W = 760, pad = 60, top = 46, lh = 150;
  const root = svg(d3, ui.stage, W, 470);
  const scales = {
    linear: v => (v - vmin) / (vmax - vmin),
    log: v => (Math.log(v) - Math.log(vmin)) / (Math.log(vmax) - Math.log(vmin)),
    sqrt: v => (Math.sqrt(v) - Math.sqrt(vmin)) / (Math.sqrt(vmax) - Math.sqrt(vmin))
  };
  const layers = [
    { y: 0, name: T('① 数据域（原始值）', '① Data domain (raw)'), kind: 'domain' },
    { y: lh, name: T('② 归一化坐标 t ∈ [0,1]', '② Normalized t ∈ [0,1]'), kind: 'norm' },
    { y: 2 * lh, name: T('③ 屏幕像素（含 margin）', '③ Screen pixels (with margin)'), kind: 'pixel' }
  ];
  const xDom = v => pad + (v - vmin) / (vmax - vmin) * (W - 2 * pad);
  const xNorm = v => pad + scales[scale](v) * (W - 2 * pad);
  const xPix = v => pad + scales[scale](v) * (W - 2 * pad);

  // 三层轨道与标签
  layers.forEach(L => {
    root.append('rect').attr('x', 8).attr('y', L.y + 30).attr('width', W - 16).attr('height', 70)
      .attr('rx', 10).attr('fill', '#f5f7fa').attr('stroke', '#e7ebf1');
    root.append('text').attr('x', 14).attr('y', L.y + 22).attr('font-size', 14)
      .attr('font-weight', 700).attr('fill', '#0f766e').text(L.name);
    root.append('line').attr('x1', pad).attr('x2', W - pad).attr('y1', L.y + 65).attr('y2', L.y + 65)
      .attr('stroke', '#94a0b3').attr('stroke-width', 1.5);
  });
  // margin 阴影（第三层）
  root.append('rect').attr('x', 8).attr('y', 2 * lh + 30).attr('width', pad - 8).attr('height', 70).attr('fill', '#fee2e2').attr('opacity', 0.7);
  root.append('rect').attr('x', W - pad).attr('y', 2 * lh + 30).attr('width', pad - 8).attr('height', 70).attr('fill', '#fee2e2').attr('opacity', 0.7);
  root.append('text').attr('x', (8 + pad) / 2).attr('y', 2 * lh + 48).attr('text-anchor', 'middle').attr('font-size', 10).attr('fill', '#b3382c').text(T('margin', 'margin'));
  root.append('text').attr('x', (W - pad + W - 8) / 2).attr('y', 2 * lh + 48).attr('text-anchor', 'middle').attr('font-size', 10).attr('fill', '#b3382c').text(T('margin', 'margin'));

  // 跨层连线（高亮点）
  const connectors = root.append('g');
  // 网格
  const gridG = root.append('g');
  const dotsG = root.append('g');

  function tickVals() {
    const n = 6, arr = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      let v;
      if (scale === 'linear') v = vmin + t * (vmax - vmin);
      else if (scale === 'log') v = Math.exp(Math.log(vmin) + t * (Math.log(vmax) - Math.log(vmin)));
      else v = (Math.sqrt(vmin) + t * (Math.sqrt(vmax) - Math.sqrt(vmin))) ** 2;
      arr.push(v);
    }
    return arr;
  }
  function render() {
    // 网格
    gridG.selectAll('*').remove();
    tickVals().forEach(v => {
      const xa = xDom(v), xn = xNorm(v), xp = xPix(v);
      gridG.append('line').attr('x1', xn).attr('x2', xn).attr('y1', lh + 40).attr('y2', lh + 92)
        .attr('stroke', '#8fb5b3').attr('stroke-width', 1).attr('stroke-dasharray', '2 3');
      gridG.append('text').attr('x', xn).attr('y', lh + 108).attr('text-anchor', 'middle').attr('font-size', 9).attr('fill', '#176c6b').text(scales[scale](v).toFixed(2));
      gridG.append('text').attr('x', xp).attr('y', 2 * lh + 118).attr('text-anchor', 'middle').attr('font-size', 9).attr('fill', '#6f7c91').text(Math.round(xp) + 'px');
      gridG.append('text').attr('x', xa).attr('y', 12).attr('text-anchor', 'middle').attr('font-size', 9).attr('fill', '#6f7c91').text(v.toFixed(1));
    });
    // 三层各画一份点
    dotsG.selectAll('circle').remove();
    layers.forEach((L, li) => {
      const xfun = L.kind === 'domain' ? xDom : (L.kind === 'norm' ? xNorm : xPix);
      dotsG.selectAll('.d' + li).data(vals).join('circle').attr('class', 'd' + li)
        .attr('r', (d, i) => i === pick ? 7 : 4)
        .attr('fill', (d, i) => i === pick ? accent : '#176c6b')
        .attr('stroke', '#fff').attr('stroke-width', 1.5).attr('cursor', 'pointer')
        .on('click', (e, d) => { pick = vals.indexOf(d); render(); })
        .transition().duration(dur)
        .attr('cx', d => xfun(d)).attr('cy', L.y + 65);
    });
    // 连线
    connectors.selectAll('*').remove();
    const pv = vals[pick];
    [xDom, xNorm, xPix].forEach((xf, i) => {
      if (i < 2) connectors.append('line')
        .attr('x1', xf(pv)).attr('x2', (layers[i + 1].kind === 'domain' ? xDom : xNorm)(pv))
        .attr('y1', layers[i].y + 65).attr('y2', layers[i + 1].y + 65)
        .attr('stroke', accent).attr('stroke-width', 1.5).attr('stroke-dasharray', '3 3').attr('opacity', 0.5);
    });
  }
  segmented(ui.controls,
    [T('linear 线性', 'linear'), T('log 对数', 'log'), T('sqrt 开方', 'sqrt')]
      .map((label, i) => ({ label, value: ['linear', 'log', 'sqrt'][i] })),
    v => { scale = v; render(); }, 0);
  render();
  ui.setConcl(T(
    `<b>结论：</b>scale 是「数据值 → 像素」的纯函数：先归一化（domain→[0,1]），再线性映射到含 margin 的绘图区。谋杀率右偏，linear 下小点挤在一起；log/sqrt 把低值端<b>拉开</b>，让网格不再疏密不均。margin 是坐标系→屏幕的固定偏移。`,
    `<b>Takeaway:</b> a scale maps data value to pixel: normalize to [0,1], then map linearly into the margin-inset region. Murder rates are right-skewed so linear crowds the low end; log/sqrt spread it out. Margin is the fixed coordinate-to-screen offset.`));
};

// ============================================================
// d04-3 曲线拟合 10 小倍数 + 过冲检测（拖拽控制点）
// ============================================================
D['d04-3'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('同一组控制点用 10 种 d3 curve 画成小倍数；插值曲线穿过数据点但易过冲，拟合曲线（basis/bundle）只走趋势。在上方拖动控制点，10 条曲线同步反应。',
           'Ten d3 curves on the same control points as small multiples; interpolating curves pass through points but can overshoot, while fitting curves (basis/bundle) follow only the trend. Drag a control point above and all ten react.'),
    lang, accent
  });
  ui.showControls();
  const W = 760, MW = 760, MH = 120, mp = 34;
  const CW = 146, CH = 132, cols = 5, gap = 8;
  const H = MH + 12 + 2 * CH + 26;
  const root = svg(d3, ui.stage, W, H);
  // 控制点（初始数据）
  let pts = [20, 46, 30, 70, 42, 78, 55].map((y, i) => ({ x: i, y }));
  const APPROX = new Set(['basis', 'bundle']);
  const curveDefs = [
    ['linear', d3.curveLinear, 'linear'],
    ['monotoneX', d3.curveMonotoneX, 'monotoneX'],
    ['natural', d3.curveNatural, 'natural'],
    ['basis', d3.curveBasis, 'basis'],
    ['cardinal', d3.curveCardinal, 'cardinal'],
    ['catmullRom', d3.curveCatmullRom, 'catmullRom'],
    ['step', d3.curveStep, 'step'],
    ['stepAfter', d3.curveStepAfter, 'stepAfter'],
    ['stepBefore', d3.curveStepBefore, 'stepBefore'],
    ['bundle', d3.curveBundle, 'bundle']
  ];
  let order = d3.range(curveDefs.length);
  let sortBy = false;

  const mx = d3.scaleLinear().domain([0, 6]).range([mp, MW - mp]);
  const my = d3.scaleLinear().domain([0, 100]).range([MH - 26, 18]);
  // 主面板
  root.append('rect').attr('x', 8).attr('y', 6).attr('width', MW - 16).attr('height', MH - 12).attr('rx', 10).attr('fill', '#e6f1f0').attr('stroke', '#c0dddb');
  root.append('text').attr('x', 16).attr('y', 24).attr('font-size', 12).attr('font-weight', 700).attr('fill', '#0f766e').text(T('控制点（可拖动）', 'Control points (drag)'));
  const masterLine = root.append('path').attr('fill', 'none').attr('stroke', accent).attr('stroke-width', 2.5);
  const pG = root.append('g');
  function drawMaster() {
    const line = d3.line().x(d => mx(d.x)).y(d => my(d.y)).curve(d3.curveLinear);
    masterLine.attr('d', line(pts));
    pG.selectAll('circle').data(pts).join('circle')
      .attr('cx', d => mx(d.x)).attr('cy', d => my(d.y)).attr('r', 7)
      .attr('fill', '#fff').attr('stroke', accent).attr('stroke-width', 2.5).attr('cursor', 'grab')
      .call(d3.drag().on('drag', (e, d) => {
        d.y = Math.max(0, Math.min(100, my.invert(e.y)));
        drawMaster(); drawTiles();
      }));
  }

  const tilesG = root.append('g');
  function drawTiles() {
    const yExt = d3.extent(pts, d => d.y);
    const pad = 4;
    const ranked = order.map(idx => {
      const [name, curve] = curveDefs[idx];
      return { idx, name, curve };
    });
    if (sortBy) {
      ranked.forEach(r => { r.over = measureOvershoot(r.curve); });
      ranked.sort((a, b) => b.over - a.over);
    }
    tilesG.selectAll('g').remove();
    ranked.forEach((r, cell) => {
      const col = cell % cols, row = Math.floor(cell / cols);
      const gx = 8 + col * (CW + gap), gy = MH + 8 + row * (CH + 6);
      const g = tilesG.append('g').attr('transform', `translate(${gx},${gy})`);
      g.append('rect').attr('width', CW).attr('height', CH).attr('rx', 8).attr('fill', '#f5f7fa').attr('stroke', '#e7ebf1');
      const tx = d3.scaleLinear().domain([0, 6]).range([16, CW - 12]);
      const ty = d3.scaleLinear().domain(yExt).range([CH - 20, 18]);
      const line = d3.line().x(d => tx(d.x)).y(d => ty(d.y)).curve(r.curve);
      const path = g.append('path').attr('d', line(pts)).attr('fill', 'none')
        .attr('stroke', APPROX.has(r.name) ? '#94a0b3' : '#176c6b').attr('stroke-width', 2);
      g.selectAll('circle').data(pts).join('circle')
        .attr('cx', d => tx(d.x)).attr('cy', d => ty(d.y)).attr('r', 2.2).attr('fill', '#454e5e');
      // 过冲检测
      let over = 0;
      try {
        const node = path.node(), len = node.getTotalLength();
        for (let i = 0; i <= 80; i++) {
          const p = node.getPointAtLength(i / 80 * len);
          const yv = ty.invert(p.y);
          over = Math.max(over, yExt[0] - yv, yv - yExt[1]);
        }
      } catch (e) { }
      g.append('text').attr('x', 10).attr('y', 14).attr('font-size', 10).attr('font-weight', 700).attr('fill', '#333a46').text(r.name);
      const tag = APPROX.has(r.name)
        ? (en ? 'fit' : '拟合·不穿点')
        : (over > 3 ? (en ? 'overshoot!' : '过冲!') : (en ? 'thru pts' : '穿过点'));
      const tagCol = over > 3 && !APPROX.has(r.name) ? '#b3382c' : (APPROX.has(r.name) ? '#94a0b3' : '#1f7a4d');
      g.append('text').attr('x', CW - 8).attr('y', 14).attr('text-anchor', 'end').attr('font-size', 9).attr('fill', tagCol).text(tag);
    });
  }
  function measureOvershoot(curve) {
    // 用离屏测量：直接在主面板坐标上重画 path 采样
    const yExt = d3.extent(pts, d => d.y);
    const tmp = root.append('path').attr('d', d3.line().x(d => mx(d.x)).y(d => my(d.y)).curve(curve)(pts)).style('display', 'none');
    let over = 0;
    try {
      const node = tmp.node(), len = node.getTotalLength();
      for (let i = 0; i <= 80; i++) {
        const p = node.getPointAtLength(i / 80 * len);
        const yv = my.invert(p.y);
        over = Math.max(over, yExt[0] - yv, yv - yExt[1]);
      }
    } catch (e) { }
    tmp.remove();
    return over;
  }
  segmented(ui.controls,
    [{ label: T('固定顺序', 'Fixed order'), value: false }, { label: T('按过冲排序', 'Sort by overshoot'), value: true }],
    v => { sortBy = v; drawTiles(); }, 0);
  drawMaster(); drawTiles();
  ui.setConcl(T(
    `<b>结论：</b>linear/monotone/natural/step 等是<b>插值</b>，必过每个控制点，但 cardinal/catmullRom 在点变化剧烈时会<b>过冲</b>（超出数据范围）；basis/bundle 是<b>拟合</b>，不穿过点、只画趋势。数据要保单调选 monotoneX，要看趋势用拟合。小倍数让差异一眼可比。`,
    `<b>Takeaway:</b> linear/monotone/natural/step interpolate through points, but cardinal/catmullRom can overshoot beyond the data; basis/bundle fit the trend without passing through points. Use monotoneX to preserve monotonicity and fitting curves for trend. Small multiples make the differences comparable at a glance.`));
};

// ============================================================
// d04-4 倾角感知心理物理实验（自产误差曲线，45° 最准）
// ============================================================
D['d04-4'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('屏幕出现一条线段，拖动滑块让另一条线「与它一样陡」，确认后进入下一轮。完成 8 轮后，用你自己的判断误差画出误差-倾角曲线，看是否在 45° 附近最准；再用纵横比滑块体会 banking。',
           'A line appears; drag the slider so another line matches its steepness, then confirm for 8 rounds. Your own error-versus-angle curve is plotted — is it most accurate near 45°? The aspect-ratio slider demonstrates banking.'),
    lang, accent
  });
  ui.showControls();
  const angles = d3.shuffle([15, 24, 34, 42, 48, 56, 66, 76]);
  let round = 0, records = [], ratio = 1, estDeg = 45;
  const W = 760, PW = 300, PH = 300;
  const root = svg(d3, ui.stage, W, 360);

  // 左侧：试验面板
  const box = root.append('g').attr('transform', 'translate(20,20)');
  box.append('rect').attr('width', PW).attr('height', PH).attr('rx', 10).attr('fill', '#f5f7fa').attr('stroke', '#c3cad6');
  // 右侧：结果面板
  const res = root.append('g').attr('transform', `translate(${PW + 50},20)`);
  res.append('rect').attr('width', W - PW - 70).attr('height', PH).attr('rx', 10).attr('fill', '#f5f7fa').attr('stroke', '#c3cad6');

  const stage = root.append('g').attr('transform', 'translate(20,20)');
  const msg = root.append('text').attr('x', 20).attr('y', 344).attr('font-size', 13).attr('font-weight', 700).attr('fill', '#176c6b');

  const estSl = slider(ui.controls, T('你的估计倾角', 'Your estimated angle'),
    { min: 0, max: 90, step: 1, value: 45, fmt: v => Math.round(v) + '°' },
    v => { estDeg = v; draw(); });
  const ratioSl = slider(ui.controls, T('纵横比（高/宽）', 'Aspect ratio (h/w)'),
    { min: 0.6, max: 1.4, step: 0.05, value: 1, fmt: v => v.toFixed(2) },
    v => { ratio = v; draw(); });
  const confirm = button(T('确认并下一轮 →', 'Confirm & next →'), 'vx-btn');
  const restart = button(T('↺ 重新开始', '↺ Restart'), 'vx-btn');
  ui.controls.append(confirm); ui.controls.append(restart);

  function lineEnd(deg, pw, ph) {
    const th = deg * Math.PI / 180;
    const L = Math.min(pw, ph) * 0.82;
    return { x: L * Math.cos(th), y: ph - L * Math.sin(th) };
  }
  let feedback = null;
  function draw() {
    stage.selectAll('*').remove();
    const pw = PW, ph = PH * ratio;
    const oy = PH - ph; // 顶对齐到下方
    stage.append('rect').attr('x', 0).attr('y', oy).attr('width', pw).attr('height', ph).attr('fill', '#ffffff').attr('stroke', '#e7ebf1').attr('rx', 8);
    if (round >= angles.length) {
      stage.append('text').attr('x', pw / 2).attr('y', PH / 2 - 10).attr('text-anchor', 'middle').attr('font-size', 18).attr('font-weight', 700).attr('fill', '#176c6b')
        .text(T('8 轮完成，请看右侧你的误差曲线', 'Done — see your error curve on the right'));
      msg.text(T('数据点：' + records.length, 'Points: ' + records.length));
      drawResult();
      return;
    }
    const trueDeg = angles[round];
    // 参考线（灰色，固定画在正方形坐标以便作为真值基准）
    const ref = lineEnd(trueDeg, PW, PH);
    stage.append('line').attr('x1', 0).attr('y1', PH).attr('x2', ref.x).attr('y2', ref.y)
      .attr('stroke', '#333a46').attr('stroke-width', 4).attr('stroke-linecap', 'round');
    // 估计线（teal，按当前纵横比画，体现视觉扭曲）
    const e = lineEnd(estDeg, PW, PH * ratio);
    stage.append('line').attr('x1', 0).attr('y1', PH).attr('x2', e.x).attr('y2', oy + e.y)
      .attr('stroke', accent).attr('stroke-width', 3).attr('stroke-linecap', 'round').attr('opacity', 0.85);
    // 45 度参考虚对角线
    if (ratio !== 1) {
      stage.append('line').attr('x1', 0).attr('y1', PH).attr('x2', PH * ratio).attr('y2', PH - PH * ratio)
        .attr('stroke', '#f59e0b').attr('stroke-width', 1.5).attr('stroke-dasharray', '5 4').attr('opacity', 0.8);
    }
    msg.text(`${T('第', 'Round')} ${round + 1}/${angles.length}　${feedback || ''}`);
    drawResult();
  }
  function drawResult() {
    res.selectAll('*').remove();
    const rx = W - PW - 70, ry = PH;
    res.append('text').attr('x', 14).attr('y', 22).attr('font-size', 13).attr('font-weight', 700).attr('fill', '#0f766e')
      .text(T('你的判断误差 |Δ角度| vs 真实倾角', 'Your |Δ angle| vs true angle'));
    const m = { l: 44, r: 14, t: 36, b: 32 };
    const x = d3.scaleLinear().domain([0, 90]).range([m.l, rx - m.r]);
    const y = d3.scaleLinear().domain([0, 30]).range([ry - m.b, m.t]);
    // 轴
    [0, 30, 45, 60, 90].forEach(a => {
      res.append('line').attr('x1', x(a)).attr('x2', x(a)).attr('y1', ry - m.b).attr('y2', ry - m.b + 5).attr('stroke', '#94a0b3');
      res.append('text').attr('x', x(a)).attr('y', ry - m.b + 17).attr('text-anchor', 'middle').attr('font-size', 9).attr('fill', '#6f7c91').text(a + '°');
    });
    res.append('text').attr('x', rx / 2).attr('y', ry - 4).attr('text-anchor', 'middle').attr('font-size', 10).attr('fill', '#6f7c91').text(T('真实倾角', 'True angle'));
    // 45 高亮带
    res.append('rect').attr('x', x(35)).attr('y', m.t).attr('width', x(55) - x(35)).attr('height', ry - m.t - m.b).attr('fill', '#c0dddb').attr('opacity', 0.6);
    res.append('text').attr('x', x(45)).attr('y', m.t + 12).attr('text-anchor', 'middle').attr('font-size', 9).attr('fill', '#0f766e').text(T('45° 最准区', 'best near 45°'));
    if (records.length >= 1) {
      const pts = records.slice().sort((a, b) => a.angle - b.angle);
      res.append('path').attr('fill', 'none').attr('stroke', accent).attr('stroke-width', 2)
        .attr('d', d3.line().x(d => x(d.angle)).y(d => y(d.err)).curve(d3.curveMonotoneX)(pts));
      res.selectAll('circle').data(pts).join('circle')
        .attr('cx', d => x(d.angle)).attr('cy', d => y(d.err)).attr('r', 4).attr('fill', accent);
    }
  }
  confirm.addEventListener('click', () => {
    if (round >= angles.length) return;
    const trueDeg = angles[round];
    const err = Math.abs(estDeg - trueDeg);
    records.push({ angle: trueDeg, err });
    feedback = `${T('真实', 'true')} ${trueDeg}°，${T('误差', 'err')} ${err.toFixed(0)}°`;
    round++;
    if (round < angles.length) { estSl.set(angles[round]); estDeg = angles[round]; }
    draw();
  });
  restart.addEventListener('click', () => {
    round = 0; records = []; feedback = null;
    d3.shuffle(angles); estSl.set(45); estDeg = 45; draw();
  });
  draw();
  ui.setConcl(T(
    `<b>结论：</b>人眼对斜率的判断不是线性的——在 45° 附近最准，越接近水平/垂直越难估（容易高估平缓斜率）。这就是 Cleveland 的 banking 原则：应调整纵横比，让关键斜率落在 30–60°；指数趋势用 log 轴把曲线斜率拉回 45°。`,
    `<b>Takeaway:</b> slope judgment is non-linear — most accurate near 45° and worst near horizontal/vertical (shallow slopes are overestimated). This is Cleveland’s banking: choose aspect ratio so key slopes lie around 30–60°, and use a log axis to bring an exponential trend back to 45°.`));
};

// ============================================================
// d04-5 Marching Squares 逐格算法 + 鼠标塑形 + 插值对比
// ============================================================
D['d04-5'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('逐格追踪等值线：当前格高亮、四角按阈值二值化、得到 16 种 case 编号并画出对应线段；拖动滑块改阈值，切换最近邻/线性插值，在画布上按住鼠标可直接「塑形」标量场。',
           'Trace contours cell by cell: the current cell is highlighted, four corners binary-classified, a 0–15 case code is looked up and its segments drawn. Change the threshold, switch nearest-neighbor vs linear interpolation, and press-drag on the field to sculpt it.'),
    lang, accent
  });
  ui.showControls();
  // 角点网格：NX×NY 个格 → (NX+1)×(NY+1) 个角
  const NX = 24, NY = 16, PW = 540, PH = 372;
  const cw = PW / NX, ch = PH / NY;
  const W = 760;
  const root = svg(d3, ui.stage, W, 410);
  const field = root.append('g').attr('transform', 'translate(12,12)');
  // 16 种 case：边 0=底 1=右 2=顶 3=左
  const EDGE_TABLE = [
    [], [[3, 0]], [[0, 1]], [[3, 1]], [[1, 2]], [[3, 0], [1, 2]], [[0, 2]], [[3, 2]],
    [[2, 3]], [[2, 0]], [[0, 1], [2, 3]], [[2, 1]], [[1, 3]], [[1, 0]], [[0, 3]], []
  ];
  let th = 0.5, mode = 'linear', step = 0, timer = null;
  let V = [];
  function makeField() {
    V = [];
    for (let j = 0; j <= NY; j++) {
      V[j] = [];
      for (let i = 0; i <= NX; i++) {
        const dx = (i - NX * 0.62) / NX * 2, dy = (j - NY * 0.38) / NY * 2;
        const g1 = 0.72 * Math.exp(-(dx * dx + dy * dy) / 0.5);
        const dx2 = (i - NX * 0.25) / NX * 2, dy2 = (j - NY * 0.75) / NY * 2;
        const g2 = 0.5 * Math.exp(-(dx2 * dx2 + dy2 * dy2) / 0.3);
        V[j][i] = Math.max(0, Math.min(1, 0.18 + g1 + g2 + (Math.random() - 0.5) * 0.06));
      }
    }
  }
  makeField();

  // 角点像素
  function cpos(i, j) { return { x: i * cw, y: j * ch }; }
  function edgePoint(i, j, e) {
    const vtl = V[j][i], vtr = V[j][i + 1], vbr = V[j + 1][i + 1], vbl = V[j + 1][i];
    const lerp = (va, vb) => mode === 'nearest' ? 0.5 : (va === vb ? 0.5 : (th - va) / (vb - va));
    if (e === 0) { const t = lerp(vbl, vbr); return [cw * (i + t), ch * (j + 1)]; }
    if (e === 1) { const t = lerp(vbr, vtr); return [cw * (i + 1), ch * (j + 1 - t)]; }
    if (e === 2) { const t = lerp(vtr, vtl); return [cw * (i + 1 - t), ch * j]; }
    const t = lerp(vtl, vbl); return [cw * i, ch * (j + t)];
  }
  function caseOf(i, j) {
    let code = 0;
    if (V[j + 1][i] > th) code |= 1;      // bl
    if (V[j + 1][i + 1] > th) code |= 2;   // br
    if (V[j][i + 1] > th) code |= 4;       // tr
    if (V[j][i] > th) code |= 8;           // tl
    return code;
  }

  const cellG = field.append('g');
  const lineG = field.append('g');
  const cornerG = field.append('g');
  const curG = field.append('g');

  const cmap = d3.interpolateBlues;
  const panel = root.append('g').attr('transform', `translate(${12 + PW + 18},12)`);
  panel.append('rect').attr('width', W - 12 - PW - 30).attr('height', PH).attr('rx', 10).attr('fill', '#f5f7fa').attr('stroke', '#e7ebf1');

  function draw() {
    // 栅格底色
    cellG.selectAll('rect').data(d3.cross(d3.range(NY), d3.range(NX))).join('rect')
      .attr('x', d => d[1] * cw).attr('y', d => d[0] * ch).attr('width', cw).attr('height', ch)
      .attr('fill', d => {
        const [j, i] = d;
        const avg = (V[j][i] + V[j][i + 1] + V[j + 1][i] + V[j + 1][i + 1]) / 4;
        return cmap(0.08 + avg * 0.85);
      })
      .attr('stroke', 'rgba(255,255,255,0.35)').attr('stroke-width', 0.5);
    // 已扫描格的等值线（0..step-1）
    lineG.selectAll('*').remove();
    for (let k = 0; k < step; k++) {
      const i = k % NX, j = Math.floor(k / NX);
      const code = caseOf(i, j);
      EDGE_TABLE[code].forEach(pair => {
        const [x1, y1] = edgePoint(i, j, pair[0]);
        const [x2, y2] = edgePoint(i, j, pair[1]);
        lineG.append('line').attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2)
          .attr('stroke', '#111827').attr('stroke-width', 1.6);
      });
    }
    // 当前格
    curG.selectAll('*').remove();
    if (step < NX * NY) {
      const ci = step % NX, cj = Math.floor(step / NX);
      curG.append('rect').attr('x', ci * cw).attr('y', cj * ch).attr('width', cw).attr('height', ch)
        .attr('fill', 'none').attr('stroke', accent).attr('stroke-width', 2.5);
      const code = caseOf(ci, cj);
      [[ci, cj], [ci + 1, cj], [ci + 1, cj + 1], [ci, cj + 1]].forEach(([i, j]) => {
        const p = cpos(i, j);
        curG.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 3.5)
          .attr('fill', V[j][i] > th ? '#b3382c' : '#ffffff').attr('stroke', '#b3382c').attr('stroke-width', 1.2);
      });
      // 当前格线段用 accent 高亮
      EDGE_TABLE[code].forEach(pair => {
        const [x1, y1] = edgePoint(ci, cj, pair[0]);
        const [x2, y2] = edgePoint(ci, cj, pair[1]);
        curG.append('line').attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2)
          .attr('stroke', accent).attr('stroke-width', 3);
      });
      drawPanel(code);
    } else {
      drawPanel(null);
    }
  }
  function drawPanel(code) {
    panel.selectAll('*').remove();
    panel.append('rect').attr('width', W - 12 - PW - 30).attr('height', PH).attr('rx', 10).attr('fill', '#f5f7fa').attr('stroke', '#e7ebf1');
    panel.append('text').attr('x', 14).attr('y', 26).attr('font-size', 13).attr('font-weight', 700).attr('fill', '#0f766e')
      .text(T('16 种 case 查表', '16-case lookup'));
    if (code === null) {
      panel.append('text').attr('x', 14).attr('y', 56).attr('font-size', 12).attr('fill', '#6f7c91')
        .text(T('全部 ' + NX * NY + ' 格扫描完成。', 'All ' + NX * NY + ' cells traced.'));
    } else {
      panel.append('text').attr('x', 14).attr('y', 58).attr('font-size', 15).attr('font-weight', 800).attr('fill', accent)
        .text(T('当前 case = ', 'case = ') + code);
      panel.append('text').attr('x', 14).attr('y', 80).attr('font-size', 11).attr('fill', '#454e5e')
        .text(T(`格 ${step + 1}/${NX * NY}，${EDGE_TABLE[code].length} 条线段`, `cell ${step + 1}/${NX * NY}, ${EDGE_TABLE[code].length} segment(s)`));
    }
    // 4 角示意
    const qx = 40, qy = 104, qs = 70;
    const corners = [[qx, qy], [qx + qs, qy], [qx + qs, qy + qs], [qx, qy + qs]];
    let bits = code === null ? [0, 0, 0, 0] : [code & 8, code & 4, code & 2, code & 1];
    panel.append('rect').attr('x', qx).attr('y', qy).attr('width', qs).attr('height', qs).attr('fill', 'none').attr('stroke', '#94a0b3');
    corners.forEach((p, k) => {
      panel.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', 8)
        .attr('fill', bits[k] ? '#b3382c' : '#fff').attr('stroke', '#b3382c').attr('stroke-width', 1.5);
    });
    // 16 小格
    panel.append('text').attr('x', 14).attr('y', 208).attr('font-size', 11).attr('fill', '#6f7c91').text(T('角点：红=高于阈值（位=1）', 'Corner: red = above threshold (bit=1)'));
    for (let n = 0; n < 16; n++) {
      const x = 14 + (n % 8) * 22, y = 226 + Math.floor(n / 8) * 24;
      panel.append('rect').attr('x', x).attr('y', y).attr('width', 18).attr('height', 18).attr('rx', 3)
        .attr('fill', n === code ? accent : '#e7ebf1').attr('stroke', n === code ? accent : '#c3cad6');
      panel.append('text').attr('x', x + 9).attr('y', y + 13).attr('text-anchor', 'middle').attr('font-size', 9)
        .attr('fill', n === code ? '#fff' : '#454e5e').text(n);
    }
    panel.append('text').attr('x', 14).attr('y', 296).attr('font-size', 10).attr('fill', '#94a0b3')
      .text(T('线性插值让线段落在阈值真实穿过处，', 'Linear interpolation lands the segment'));
    panel.append('text').attr('x', 14).attr('y', 310).attr('font-size', 10).attr('fill', '#94a0b3')
      .text(T('比取中点的最近邻更准。', 'where the threshold truly crosses.'));
  }

  // 控件
  const prev = button(T('◂ 上一格', '◂ Prev'), 'vx-btn');
  const next = button(T('下一格 ▸', 'Next ▸'), 'vx-btn');
  const play = button(T('▶ 播放', '▶ Play'), 'vx-btn');
  const reset = button(T('↺ 重置场', '↺ Reset field'), 'vx-btn');
  ui.controls.append(prev); ui.controls.append(next); ui.controls.append(play); ui.controls.append(reset);
  const thSl = slider(ui.controls, T('阈值', 'Threshold'),
    { min: 0.1, max: 0.9, step: 0.02, value: 0.5, fmt: v => v.toFixed(2) },
    v => { th = v; draw(); });
  segmented(ui.controls,
    [{ label: T('线性插值', 'Linear'), value: 'linear' }, { label: T('最近邻（中点）', 'Nearest'), value: 'nearest' }],
    v => { mode = v; draw(); }, 0);

  function stopPlay() { if (timer) { clearInterval(timer); timer = null; play.textContent = T('▶ 播放', '▶ Play'); } }
  function advance() { if (step < NX * NY) { step++; draw(); } else stopPlay(); }
  prev.addEventListener('click', () => { stopPlay(); step = Math.max(0, step - 1); draw(); });
  next.addEventListener('click', () => { stopPlay(); advance(); });
  play.addEventListener('click', () => {
    if (timer) { stopPlay(); return; }
    if (step >= NX * NY) { step = 0; }
    play.textContent = T('⏸ 暂停', '⏸ Pause');
    timer = setInterval(advance, 260);
  });
  reset.addEventListener('click', () => {
    stopPlay(); makeField(); step = 0; draw();
  });

  // 鼠标塑形：在画布上按压拖动 → 抬高/降低标量场
  const brush = d3.drag().on('start', stopPlay).on('drag', (e) => {
    const [mx, my] = d3.pointer(e, field.node());
    const ci = Math.floor(mx / cw), cj = Math.floor(my / ch);
    const R = 2.2;
    for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
      const dd = Math.hypot(i - ci, j - cj);
      if (dd < R) V[j][i] = Math.max(0, Math.min(1, V[j][i] + (R - dd) / R * 0.55));
    }
    step = NX * NY;
    draw();
  });
  field.append('rect').attr('x', 0).attr('y', 0).attr('width', PW).attr('height', PH).attr('fill', 'transparent').style('cursor', 'crosshair').call(brush);
  draw();
  ui.setConcl(T(
    `<b>结论：</b>每个格只看 4 个角相对阈值的高低，组成 4 位二进制（0–15），查表决定画 0/1/2 条线段把「高于/低于」两片分开。<b>最近邻取中点</b>省事但线位置不准，<b>沿边线性插值</b>让线落在阈值真实穿过处。扩展到三维就是 Marching Cubes（8 个角点，共 256 种二值配置），用于等高线、密度图、MRI 重建。`,
    `<b>Takeaway:</b> each cell’s four corners make a 4-bit code (0–15) whose lookup draws 0/1/2 segments separating above/below regions. Nearest-neighbor uses midpoints; linear interpolation lands the segment where the threshold truly crosses. In 3D it becomes Marching Cubes (8 corners, 256 binary configurations), used for contours, density maps and MRI.`));
};

export default D;
