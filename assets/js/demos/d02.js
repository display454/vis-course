// ============================================================
// d02.js — 第 2 章《数据可视化流程》交互演示（4 个，全部重新设计）
//   d02-1 端到端联动沙盘（5 阶段管线 + 刷选反向高亮）
//   d02-2 rollup 聚合：点聚簇 + 矩形树图 / 马赛克 / 打包圆
//   d02-3 树布局算法分步构建 + 水平 / 垂直 / 放射对比
//   d02-4 事件冒泡路径动画 + 单绑 / 委托监听计数
// 函数签名：(mount, { d3, data, lang, accent }) => {}
// ============================================================
import { shell, svg, makeCtx, button, segmented, slider, select, toggle, tooltip, player, C } from './_ui.js';

const D = {};
const ACC = '#0e7fa8';

// 统一载入新生数据并派生 major / gender
async function loadStudents(d3, data) {
  return d3.csv(data + 'newstudent.csv', d => {
    const cls = (d['班级'] || '').trim();
    const m = cls.match(/^(.+?)(\d+班)$/);
    return {
      id: +d['序号'], name: d['姓名'].trim(), gender: d['性别'].trim(),
      age: +d['年龄'], cls,
      major: m ? m[1] : cls
    };
  });
}

// ============================================================
// d02-1 端到端联动沙盘
// ============================================================
D['d02-1'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('一条真实数据流经 5 个阶段。改筛选、选映射、缩放，再在最末「用户交互」阶段拖动鼠标刷选——被选中的点会反向高亮回前序所有阶段。',
           'One real dataset flows through five stages. Filter, remap, zoom, then drag a brush in the final stage — the selected points highlight back through every earlier stage.'),
    lang, accent
  });
  ui.showControls();

  const students = await loadStudents(d3, data);
  students.forEach((d, i) => { d.i = i; });

  const W = 1080, LANES = 5, LANEH = 96, TOP = 46;
  const H = TOP + LANES * LANEH + 12;
  const PX0 = 172, PX1 = 1058;
  const L = svg(d3, ui.stage, W, H);

  // 控制器
  const row1 = document.createElement('div');
  const row2 = document.createElement('div');
  row1.className = 'vx-chiprow'; row2.className = 'vx-chiprow';
  ui.controls.append(row1, row2);

  const STAGES = [
    { zh: '原始数据', en: 'Raw Data', model: 'Card' },
    { zh: '数据变换', en: 'Transform', model: 'Card' },
    { zh: '视觉映射', en: 'Visual Mapping', model: 'Mackinlay' },
    { zh: '视图渲染', en: 'View (render)', model: 'Card' },
    { zh: '用户交互', en: 'Interaction', model: 'van Wijk' }
  ];
  const state = { filter: 'all', field: 'id', zoom: 1, brush: null, lens: 'none' };
  const GCOL = { 男: '#4a46c9', 女: '#b43b7e' };
  const jitter = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return (x - Math.floor(x) - 0.5) * 26; };

  // 每个阶段的横坐标（plot cx）；返回 { cx }
  function xFor(d, lane) {
    if (lane <= 1) { // 原始 / 变换：按输入顺序铺
      return PX0 + (d.i / (students.length - 1)) * (PX1 - PX0);
    }
    let s;
    if (state.field === 'id') {
      s = d3.scaleLinear().domain([1, students.length]).range([PX0, PX1]);
      return s(d.id);
    }
    if (state.field === 'age') {
      s = d3.scalePoint().domain([17, 18]).range([PX0 + 90, PX1 - 90]);
      return s(d.age) + jitter(d.i) * 1.4;
    }
    // gender
    s = d3.scalePoint().domain(['男', '女']).range([PX0 + 130, PX1 - 130]);
    return s(d.gender) + jitter(d.i) * 2.4;
  }
  function laneY(lane) { return TOP + lane * LANEH + LANEH / 2 - 6; }

  // 分组容器
  const gLanes = L.append('g');
  const gPts = L.append('g');
  const gBrush = L.append('g');
  const gAnn = L.append('g');

  // 画 lane 背景与标题
  STAGES.forEach((st, k) => {
    const y = TOP + k * LANEH;
    gLanes.append('rect')
      .attr('class', 'lane-box')
      .attr('data-lane', k)
      .attr('x', 8).attr('y', y + 4).attr('width', W - 16).attr('height', LANEH - 8)
      .attr('rx', 10).attr('fill', '#f5f7fa').attr('stroke', '#e7ebf1').attr('stroke-width', 1.5);
    gLanes.append('text').attr('x', 18).attr('y', y + 30)
      .attr('class', 'vtitle').attr('font-size', 13).attr('font-weight', 700).attr('fill', '#14171c')
      .text(`${k + 1}. ${en ? st.en : st.zh}`);
    gLanes.append('text').attr('x', 18).attr('y', y + 50)
      .attr('class', 'small').attr('font-size', 10).attr('fill', '#94a0b3')
      .text(st.model);
    if (k < LANES - 1) {
      gLanes.append('path').attr('d', `M${W - 26},${y + LANEH - 4} l0,10 m-5,-5 l5,5 l5,-5`)
        .attr('fill', 'none').attr('stroke', '#c3cad6').attr('stroke-width', 1.6);
    }
  });

  function survivors() {
    return state.filter === 'all' ? students : students.filter(d => d.gender === state.filter);
  }
  const survSet = () => new Set(survivors().map(d => d.i));

  function draw() {
    const alive = survSet();
    const hi = state.brush;
    const zoom = state.zoom;
    // 每阶段点
    const rows = [];
    for (let k = 0; k < LANES; k++) {
      students.forEach(d => {
        const cy = laneY(k);
        // 第 0 阶段「原始数据」：无论筛选与否都完整显示（筛选尚未发生）
        if (k === 0) {
          let st = 'on';
          if (hi) st = hi.has(d.i) ? 'hi' : 'faint';
          rows.push({ d, k, cx: xFor(d, k), cy, state: st });
          return;
        }
        if (!alive.has(d.i)) {
          // 第 1 阶段「变换」：被筛掉的点变淡以示剔除；之后阶段不再出现
          if (k === 1) rows.push({ d, k, cx: xFor(d, k), cy, state: 'dim' });
          return;
        }
        let cx = xFor(d, k);
        if (k === 3) { // 渲染阶段：以中心为锚缩放
          const mid = (PX0 + PX1) / 2;
          cx = mid + (cx - mid) * zoom;
        }
        let st = 'on';
        if (hi) st = hi.has(d.i) ? 'hi' : 'faint';
        rows.push({ d, k, cx, cy, state: st });
      });
    }
    // 渲染阶段裁剪超界
    const sel = gPts.selectAll('circle').data(rows, d => d.k + '-' + d.d.i);
    sel.join(
      e => e.append('circle').attr('r', 4.2)
        .attr('cx', d => d.cx).attr('cy', d => d.cy)
        .attr('fill', d => GCOL[d.d.gender]).attr('opacity', 0),
      up => up,
      ex => ex.remove()
    )
      .transition().duration(dur)
      .attr('cx', d => d.cx).attr('cy', d => d.cy)
      .attr('r', d => d.state === 'hi' ? 6 : 4.2)
      .attr('fill', d => {
        if (d.state === 'hi') return '#f59e0b';
        return GCOL[d.d.gender];
      })
      .attr('opacity', d => {
        if (d.state === 'gone') return 0.05;
        if (d.state === 'dim') return 0.1;
        if (d.state === 'faint') return 0.12;
        if (d.state === 'hi') return 1;
        return 0.9;
      })
      .attr('stroke', d => d.state === 'hi' ? '#b45309' : 'none')
      .attr('stroke-width', d => d.state === 'hi' ? 1.5 : 0);

    // 理论透镜：高亮对应 lane
    gLanes.selectAll('.lane-box').transition().duration(dur)
      .attr('stroke', (d, i, nodes) => (isLensLane(i) ? accent : '#e7ebf1'))
      .attr('stroke-width', (d, i) => (isLensLane(i) ? 2.5 : 1.5))
      .attr('fill', (d, i) => (isLensLane(i) ? '#e5f2f7' : '#f5f7fa'));
    drawLens();
  }

  function isLensLane(k) {
    if (state.lens === 'Card') return k <= 3;
    if (state.lens === 'Mackinlay') return k === 2;
    if (state.lens === 'van Wijk') return k === 4;
    return false;
  }
  function drawLens() {
    gAnn.selectAll('*').remove();
    if (state.lens === 'none') return;
    let msg = '';
    if (state.lens === 'Card') msg = T('Card 管道：原始数据 → 数据表 → 视觉结构 → 视图，逐阶段变换（前 4 格）。',
      'Card pipeline: raw → tables → visual structure → views (first four lanes).');
    if (state.lens === 'Mackinlay') msg = T('Mackinlay 准则：为每个数据类型自动选量化最准的通道（落在视觉映射格）。',
      'Mackinlay: auto-pick the most accurate channel for each data type (mapping lane).');
    if (state.lens === 'van Wijk') msg = T('van Wijk 反馈环：刷选不仅改最后一格，还沿箭头反向影响前序视图（这正是连线的意义）。',
      'van Wijk loop: the brush changes the last view and feeds back to every earlier view.');
    gAnn.append('rect').attr('x', 8).attr('y', H - 11).attr('width', W - 16).attr('height', 0)
      .attr('fill', 'none');
    const txt = gAnn.append('text').attr('x', 16).attr('y', H - 1)
      .attr('font-size', 11).attr('fill', accent).attr('font-weight', 700).text(msg);
  }

  // 刷选（最后一阶段）
  const brush = d3.brushX()
    .extent([[PX0, TOP + 4 * LANEH + 6], [PX1, TOP + 5 * LANEH - 12]])
    .on('brush end', (ev) => {
      const sel = ev.selection;
      if (!sel) { state.brush = null; draw(); return; }
      const zoom = state.zoom;
      const mid = (PX0 + PX1) / 2;
      const idx = new Set();
      survivors().forEach(d => {
        let cx = xFor(d, 4);
        cx = mid + (cx - mid) * zoom;
        if (cx >= sel[0] && cx <= sel[1]) idx.add(d.i);
      });
      state.brush = idx.size ? idx : null;
      draw();
    });
  gBrush.call(brush).select('.selection').attr('fill', accent).attr('fill-opacity', 0.12)
    .attr('stroke', accent);

  // 控件
  segmented(row1,
    [T('全部', 'All'), { label: T('仅男', 'Male'), value: '男' }, { label: T('仅女', 'Female'), value: '女' }]
      .map(x => typeof x === 'string' ? { label: x, value: 'all' } : x),
    v => { state.filter = v; state.brush = null; gBrush.call(brush.move, null); draw(); }, 0);
  const mapSeg = segmented(row1,
    [
      { label: T('x=序号', 'x=id'), value: 'id' },
      { label: T('x=年龄', 'x=age'), value: 'age' },
      { label: T('x=性别', 'x=gender'), value: 'gender' }
    ],
    v => { state.field = v; state.brush = null; gBrush.call(brush.move, null); draw(); }, 0);

  slider(row2, T('渲染缩放', 'Render zoom'), { min: 1, max: 2.4, step: 0.1, value: 1, fmt: v => v.toFixed(1) + '×' },
    v => { state.zoom = v; draw(); });
  const clearBtn = button(T('清除刷选', 'Clear brush'), '');
  clearBtn.addEventListener('click', () => { state.brush = null; gBrush.call(brush.move, null); draw(); });
  row2.append(clearBtn);

  segmented(row2,
    [
      { label: T('理论透镜：无', 'Lens: none'), value: 'none' },
      { label: 'Card', value: 'Card' },
      { label: 'Mackinlay', value: 'Mackinlay' },
      { label: 'van Wijk', value: 'van Wijk' }
    ],
    v => { state.lens = v; draw(); }, 0);

  draw();
  ui.setConcl(T(
    `<b>结论：</b>三个模型不是要背的名词：<b>Card</b> 是这条逐阶段的管道、<b>Mackinlay</b> 决定第三格怎么编码、<b>van Wijk</b> 是末格刷选反向影响前序的回路。在最后一格拖出一段选区即见反馈环。`,
    `<b>Takeaway:</b> the models are a pipeline you drive: Card is the stages, Mackinlay picks the encoding, van Wijk is the brush feeding back. Drag a selection in the last lane.`));
};

// ============================================================
// d02-2 rollup 聚合：点聚簇 + 面积布局
// ============================================================
D['d02-2'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('先看 80 个学生点随维度动态聚簇；再切换到矩形树图 / 马赛克 / 打包圆，用面积读聚合结果，悬停看组内明细。',
           'Watch 80 students cluster by a dimension, then switch to treemap / mosaic / circle-pack and read aggregates by area. Hover for details.'),
    lang, accent
  });
  ui.showControls();

  const students = await loadStudents(d3, data);
  const W = 1040, H = 470;
  const L = svg(d3, ui.stage, W, H);
  const tip = tooltip();
  const gBack = L.append('g');
  const gPts = L.append('g');
  const gArea = L.append('g');

  const r1 = document.createElement('div');
  const r2 = document.createElement('div');
  r1.className = 'vx-chiprow'; r2.className = 'vx-chiprow';
  ui.controls.append(r1, r2);

  const state = {
    dim: 'major', layout: 'cluster', metric: 'count'
  };
  const DIMS = [
    { value: 'major', zh: '专业', en: 'Major' },
    { value: 'cls', zh: '班级', en: 'Class' },
    { value: 'gender', zh: '性别', en: 'Gender' }
  ];
  const dimLabel = (k) => { const d = DIMS.find(x => x.value === k); return en ? d.en : d.zh; };
  const NOM = { 软件工程: '#4a46c9', 数据科学: '#0e7fa8', 男: '#4a46c9', 女: '#b43b7e' };
  const clsColors = ['#4a46c9', '#6e6ae0', '#0e7fa8'];
  function colorFor(k, i) {
    return NOM[k] || clsColors[i % clsColors.length];
  }

  // 散点聚簇布局
  const CX = 300, CY = 236, CR = 185;
  function clusterTargets() {
    const groups = d3.groups(students, d => d[state.dim]);
    const n = groups.length;
    const tgt = new Map();
    groups.forEach(([key, arr], gi) => {
      const ang = -Math.PI / 2 + (n === 1 ? 0 : gi * 2 * Math.PI / n);
      const gx = CX + Math.cos(ang) * (n === 1 ? 0 : 120);
      const gy = CY + Math.sin(ang) * (n === 1 ? 0 : 120);
      arr.forEach((d, k) => {
        const a = k * 2.399963 + gi;
        const rr = 9 + Math.sqrt(k / arr.length) * 46;
        tgt.set(d.id, { x: gx + Math.cos(a) * rr, y: gy + Math.sin(a) * rr, g: gi, key });
      });
    });
    return { groups, tgt };
  }

  function metricVal(arr) {
    if (state.metric === 'count') return arr.length;
    return d3.mean(arr, d => d.age);
  }

  // ---- 面积布局：treemap / pack / mosaic ----
  function hierarchyData() {
    const byDim = d3.rollup(students, v => v, d => d[state.dim]);
    const root = { key: 'root', children: [] };
    let i = 0;
    for (const [k, arr] of byDim) {
      // 二级：性别，便于 treemap/pack 呈现嵌套。
      // 面积必须可加：只在叶子上设 value（计数），内部节点不设，
      // 否则 hierarchy.sum 会把内部节点自身的值也累加导致翻倍。
      const byGender = d3.rollup(arr, v => v, d => d.gender);
      const children = [...byGender].map(([g, a]) => ({
        key: g,
        value: a.length,
        n: a.length,
        age: d3.mean(a, x => x.age)
      }));
      root.children.push({
        key: k,
        n: arr.length,
        age: d3.mean(arr, x => x.age),
        ci: i++,
        children
      });
    }
    return root;
  }

  function drawCluster() {
    gArea.selectAll('*').remove();
    gBack.selectAll('*').remove();
    const { groups, tgt } = clusterTargets();
    // 簇标签 + 轮廓
    groups.forEach(([key, arr], gi) => {
      const n = groups.length;
      const ang = -Math.PI / 2 + (n === 1 ? 0 : gi * 2 * Math.PI / n);
      const gx = CX + Math.cos(ang) * (n === 1 ? 0 : 120);
      const gy = CY + Math.sin(ang) * (n === 1 ? 0 : 120);
      gBack.append('circle').attr('cx', gx).attr('cy', gy).attr('r', 62)
        .attr('fill', colorFor(key, gi)).attr('opacity', 0.06);
      gBack.append('text').attr('x', gx).attr('y', gy - 72)
        .attr('text-anchor', 'middle').attr('font-size', 12).attr('font-weight', 700)
        .attr('fill', colorFor(key, gi))
        .text(state.metric === 'count'
          ? `${key} · ${arr.length}`
          : `${key} · ${T('平均年龄', 'mean age')} ${d3.mean(arr, x => x.age).toFixed(2)}`);
    });

    const pts = gPts.selectAll('circle').data(students, d => d.id);
    pts.join(
      e => e.append('circle').attr('r', 4.5)
        .attr('cx', () => 120 + Math.random() * 0)
        .attr('cx', CX).attr('cy', CY).attr('opacity', 0),
      u => u,
      x => x.remove()
    )
      .transition().duration(dur + 180)
      .attr('cx', d => tgt.get(d.id).x)
      .attr('cy', d => tgt.get(d.id).y)
      .attr('fill', d => colorFor(d[state.dim], tgt.get(d.id).g))
      .attr('opacity', 0.92);
  }

  function hover(ev, html) { tip.show(ev, html); }
  function attachTip(sel, key, arr, gi) {
    sel.on('mousemove', ev => tip.move(ev))
      .on('mouseover', ev => tip.show(ev,
        `<b>${key}</b><br>${T('计数', 'Count')}：${arr.length}<br>${T('平均年龄', 'Mean age')}：${d3.mean(arr, d => d.age).toFixed(2)}`))
      .on('mouseout', () => tip.hide());
  }

  function drawTreemap(pack) {
    gPts.selectAll('circle').transition().duration(160).attr('opacity', 0);
    gBack.selectAll('*').remove();
    gArea.selectAll('*').remove();
    const root = d3.hierarchy(hierarchyData()).sum(d => d.value);
    const X = 540, Y = 40, Wd = 470, Ht = 390;
    gArea.attr('transform', null);
    if (pack) d3.pack().size([Wd, Ht]).padding(5)(root);
    else d3.treemap().size([Wd, Ht]).padding(3).round(true)(root);
    const tops = root.descendants().filter(d => d.depth === 1);
    const leafs = root.descendants().filter(d => d.depth === 2);
    const leaf = gArea.selectAll('rect,circle').data(root.descendants().filter(d => d.depth >= 1), d => d.data.key + d.depth)
      .join(
        e => e.append(d => d.parent === root ? document.createElementNS('http://www.w3.org/2000/svg', pack ? 'circle' : 'rect')
          : document.createElementNS('http://www.w3.org/2000/svg', pack ? 'circle' : 'rect'))
          .attr('opacity', 0),
        u => u,
        x => x.remove()
      )
      .attr('fill', d => {
        if (d.depth === 1) return 'none';
        return d.data.key === '男' ? '#4a46c9' : '#b43b7e';
      })
      .attr('fill-opacity', 0.85)
      .attr('stroke', d => {
        if (d.depth === 1) { const t = d; return colorFor(t.data.key, t.data.ci); }
        return '#fff';
      })
      .attr('stroke-width', d => d.depth === 1 ? 2.5 : 1.2);
    if (pack) {
      leaf.attr('cx', d => d.x + X).attr('cy', d => d.y + Y).attr('r', d => d.r);
      leaf.transition().duration(dur).attr('opacity', 1);
    } else {
      leaf.attr('x', d => d.x0 + X).attr('y', d => d.y0 + Y)
        .attr('width', d => Math.max(0, d.x1 - d.x0)).attr('height', d => Math.max(0, d.y1 - d.y0)).attr('rx', 5);
      leaf.transition().duration(dur).attr('opacity', 1);
    }
    // 顶层标签
    gArea.selectAll('text').data(tops, d => d.data.key)
      .join('text')
      .attr('font-size', 11).attr('font-weight', 700)
      .attr('fill', d => colorFor(d.data.key, d.data.ci))
      .attr('text-anchor', pack ? 'middle' : 'start')
      .attr('x', d => pack ? d.x + X : d.x0 + X + 6)
      .attr('y', d => pack ? d.y + Y - d.r + 3 : d.y0 + Y + 14)
      .text(d => d.data.key + ' ' + d.data.n)
      .attr('pointer-events', 'none');
    leaf.filter(d => d.depth === 2).on('mousemove', ev => tip.move(ev))
      .on('mouseover', function (ev, d) {
        tip.show(ev, `<b>${d.parent.data.key} · ${d.data.key}</b><br>${T('计数', 'Count')}：${d.data.n}`);
      }).on('mouseout', () => tip.hide());
  }

  // 马赛克（marimekko）：每个维度值一列，宽度∝计数，按性别上下堆叠
  function drawMosaic() {
    gPts.selectAll('circle').transition().duration(160).attr('opacity', 0);
    gBack.selectAll('*').remove();
    gArea.selectAll('*').remove();
    gArea.attr('transform', null);
    const X = 540, Y = 56, Wd = 468, Ht = 360;
    const groups = d3.groups(students, d => d[state.dim]);
    const total = students.length;
    const genders = ['男', '女'];
    let x = X;
    groups.forEach(([key, arr], gi) => {
      const w = arr.length / total * Wd;
      let y = Y + Ht;
      genders.forEach((g, gi2) => {
        const n = arr.filter(d => d.gender === g).length;
        const h = n / arr.length * Ht;
        y -= h;
        const rect = gArea.append('rect').attr('x', x).attr('y', Y + Ht).attr('width', w)
          .attr('height', 0).attr('fill', g === '男' ? '#4a46c9' : '#b43b7e')
          .attr('stroke', '#fff').attr('stroke-width', 1.5);
        rect.transition().duration(dur).attr('y', y).attr('height', h);
        if (h > 18) {
          gArea.append('text').attr('x', x + w / 2).attr('y', y + h / 2 + 4)
            .attr('text-anchor', 'middle').attr('font-size', 10).attr('fill', '#fff')
            .attr('pointer-events', 'none').text(n);
        }
      });
      gArea.append('text').attr('x', x + w / 2).attr('y', Y + Ht + 18)
        .attr('text-anchor', 'middle').attr('font-size', 11).attr('font-weight', 700)
        .attr('fill', colorFor(key, gi)).attr('pointer-events', 'none')
        .text(`${key} ${arr.length}`);
      x += w;
    });
    // 轴
    gArea.append('line').attr('x1', X).attr('x2', X + Wd).attr('y1', Y + Ht).attr('y2', Y + Ht)
      .attr('stroke', '#94a0b3');
    gArea.append('text').attr('x', X).attr('y', Y - 18).attr('font-size', 11).attr('fill', '#6f7c91')
      .text(en ? 'Column width = group count; height = gender share' : '列宽 = 该组人数，高 = 男女占比');
    gArea.append('rect').attr('x', X + Wd - 150).attr('y', Y - 30).attr('width', 10).attr('height', 10).attr('fill', '#4a46c9');
    gArea.append('text').attr('x', X + Wd - 136).attr('y', Y - 21).attr('font-size', 10).attr('fill', '#454e5e').text(T('男', 'Male'));
    gArea.append('rect').attr('x', X + Wd - 90).attr('y', Y - 30).attr('width', 10).attr('height', 10).attr('fill', '#b43b7e');
    gArea.append('text').attr('x', X + Wd - 76).attr('y', Y - 21).attr('font-size', 10).attr('fill', '#454e5e').text(T('女', 'Female'));
  }

  function draw() {
    if (state.layout === 'cluster') drawCluster();
    else if (state.layout === 'treemap') drawTreemap(false);
    else if (state.layout === 'pack') drawTreemap(true);
    else drawMosaic();
  }

  select(r1, T('分组维度：', 'Dimension: '),
    DIMS.map(d => ({ value: d.value, label: en ? d.en : d.zh })),
    v => { state.dim = v; draw(); }, 0);
  segmented(r1,
    [
      { label: T('聚簇', 'Cluster'), value: 'cluster' },
      { label: T('矩形树图', 'Treemap'), value: 'treemap' },
      { label: T('马赛克', 'Mosaic'), value: 'mosaic' },
      { label: T('打包圆', 'Pack'), value: 'pack' }
    ],
    v => { state.layout = v; draw(); }, 0);
  segmented(r2,
    [
      { label: T('聚合：计数', 'Metric: count'), value: 'count' },
      { label: T('聚合：平均年龄', 'Mean age'), value: 'age' }
    ],
    v => { state.metric = v; draw(); }, 0);

  draw();
  ui.setConcl(T(
    `<b>结论：</b><code>d3.rollup</code> 的结果是「层次 + 数值」；聚簇让你看清分组归属，矩形树图/打包圆用面积比嵌套 Map 文本更易读，马赛克同时给出总量（列宽）与构成（男女占比）。`,
    `<b>Takeaway:</b> rollup yields a hierarchy + values; clusters show membership, treemap/pack use area, and mosaic adds totals (width) and composition (gender share).`));
};

// ============================================================
// d02-3 树布局算法分步构建 + 三向对比
// ============================================================
D['d02-3'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('树布局不是自动魔法：单步播放，看节点从全部重叠 → 后序估算子树宽度 → 逐遍定位消除重叠。再一键对比水平、垂直、放射三种布局。',
           'Tree layout is an algorithm: step from overlapped nodes to post-order subtree widths, then position passes. Then compare horizontal, vertical and radial.'),
    lang, accent
  });
  ui.showControls();

  const students = await loadStudents(d3, data);
  // 层次：新生 → 专业 → 班级 → 性别
  const treeData = {
    name: T('新生', 'New'), children: []
  };
  const byMajor = d3.groups(students, d => d.major);
  byMajor.forEach(([major, arr]) => {
    const mNode = { name: major, children: [] };
    d3.groups(arr, d => d.cls).forEach(([cls, arr2]) => {
      const cNode = { name: (cls.match(/(\d+班)$/) || [cls])[1], full: cls, children: [] };
      ['男', '女'].forEach(g => {
        const n = arr2.filter(d => d.gender === g).length;
        if (n) cNode.children.push({ name: `${g} ${n}`, leaf: true, n });
      });
      mNode.children.push(cNode);
    });
    treeData.children.push(mNode);
  });

  const W = 1040, H = 480;
  const L = svg(d3, ui.stage, W, H);
  const gC = L.append('g');   // 轮廓
  const gL = L.append('g');   // 连线
  const gN = L.append('g');   // 节点
  const gT = L.append('g');   // 文字

  const row = document.createElement('div');
  row.className = 'vx-chiprow';
  ui.controls.append(row);

  const state = { orient: 'h', sep: 1.2, frame: 0 };
  const FRAMES = [
    T('① 全部重叠', '① overlapped'),
    T('② 后序：子树宽度', '② subtree widths'),
    T('③ 第一遍：叶子定位', '③ leaves placed'),
    T('④ 第二遍：父节点归位', '④ parents placed'),
    T('⑤ 完成（分离）', '⑤ done')
  ];

  // 计算给定朝向的最终坐标
  function computeLayout() {
    const root = d3.hierarchy(treeData);
    let nodes;
    if (state.orient === 'radial') {
      const R = Math.min(W, H) / 2 - 46;
      d3.tree().size([2 * Math.PI, R]).separation((a, b) => a.parent === b.parent ? state.sep : state.sep * 1.6)(root);
      const ox = W / 2 - 60, oy = H / 2;
      nodes = root.descendants().map(n => {
        const a = n.x - Math.PI / 2;
        return { node: n, px: ox + n.y * Math.cos(a), py: oy + n.y * Math.sin(a), ang: a };
      });
    } else if (state.orient === 'v') {
      d3.tree().size([W - 320, H - 90]).separation((a, b) => a.parent === b.parent ? state.sep : state.sep * 1.6)(root);
      const ox = 150, oy = 50;
      nodes = root.descendants().map(n => ({ node: n, px: ox + n.x, py: oy + n.y }));
    } else {
      d3.tree().size([H - 80, W - 320]).separation((a, b) => a.parent === b.parent ? state.sep : state.sep * 1.6)(root);
      const ox = 170, oy = 44;
      nodes = root.descendants().map(n => ({ node: n, px: ox + n.y, py: oy + n.x }));
    }
    const map = new Map(nodes.map(o => [o.node, o]));
    return { root, nodes, map };
  }

  // 每一帧已归位到最终位置的节点深度集合
  const PLACED = [
    [0],          // 0 全部重叠
    [0],          // 1 后序：只标子树宽度，节点仍重叠
    [0, 3],       // 2 第一遍：叶子定位
    [0, 2, 3],    // 3 第二遍：父节点归位
    [0, 1, 2, 3]  // 4 完成
  ];

  function draw() {
    const { nodes, map } = computeLayout();
    const rootNode = nodes[0];
    const f = state.frame;
    const isPlaced = (depth) => PLACED[f].includes(depth);
    const posOf = (n) => {
      const o = map.get(n);
      const placed = isPlaced(n.depth);
      return { x: placed ? o.px : rootNode.px, y: placed ? o.py : rootNode.py };
    };
    // 轮廓：第 1 帧起，画每个 class(depth2) 子树的叶子横向跨度
    gC.selectAll('*').remove();
    if (f >= 1 && f <= 3 && state.orient !== 'radial') {
      rootNode.node.descendants().filter(n => n.depth === 2).forEach(n => {
        const leaves = n.leaves().map(l => map.get(l));
        const xs = leaves.map(o => o.px), ys = leaves.map(o => o.py);
        const horiz = state.orient === 'h';
        const rx = Math.min(...xs), ry = Math.min(...ys);
        const rngX = Math.max(...xs) - rx, rngY = Math.max(...ys) - ry;
        // 水平树：叶子同 x、y 不同 → 窄高框；垂直树：叶子 x 不同、同 y → 宽矮框
        const w = horiz ? 20 : rngX + 24;
        const h = horiz ? rngY + 24 : 20;
        gC.append('rect')
          .attr('x', horiz ? rx - 10 : rx - 12)
          .attr('y', horiz ? ry - 12 : ry - 10)
          .attr('width', w).attr('height', h).attr('rx', 8)
          .attr('fill', accent).attr('fill-opacity', 0.05)
          .attr('stroke', accent).attr('stroke-dasharray', '4 3').attr('stroke-width', 1);
      });
    }

    // 连线：两端都已归位才显示
    const linkSel = gL.selectAll('path').data(rootNode.node.links(), d => d.source.data.name + '>' + d.target.data.name);
    const showLink = (lk) => isPlaced(lk.source.depth) && isPlaced(lk.target.depth);
    linkSel.join(
      e => e.append('path').attr('opacity', 0),
      u => u, x => x.remove()
    )
      .transition().duration(dur)
      .attr('opacity', d => showLink(d) ? 0.55 : 0)
      .attr('d', d => {
        const s = posOf(d.source), t = posOf(d.target);
        return `M${s.x},${s.y} C${(s.x + t.x) / 2},${s.y} ${(s.x + t.x) / 2},${t.y} ${t.x},${t.y}`;
      })
      .attr('fill', 'none').attr('stroke', '#94a0b3').attr('stroke-width', 1.3);

    // 节点
    const nodeSel = gN.selectAll('circle').data(nodes, d => d.node.data.name + d.node.depth + (d.node.parent ? d.node.parent.data.name : ''));
    nodeSel.join(
      e => e.append('circle').attr('r', d => d.node.data.leaf ? 5 : 7)
        .attr('cx', rootNode.px).attr('cy', rootNode.py).attr('opacity', 0),
      u => u, x => x.remove()
    )
      .transition().duration(dur)
      .attr('cx', d => posOf(d.node).x)
      .attr('cy', d => posOf(d.node).y)
      .attr('r', d => d.node.depth === 0 ? 8 : d.node.data.leaf ? 5 : 7)
      .attr('fill', d => d.node.depth === 0 ? '#14171c' : d.node.depth === 1 ? accent : d.node.data.leaf ? '#bfe3ee' : '#bfe3ee')
      .attr('stroke', d => d.node.depth === 1 ? accent : '#0e7490')
      .attr('stroke-width', 1.4)
      .attr('opacity', 1);

    // 文字：仅在完成帧显示
    gT.selectAll('text').remove();
    if (f >= 4) {
      gT.selectAll('text').data(nodes).join('text')
        .attr('x', d => d.px + (state.orient === 'h' ? 10 : 0))
        .attr('y', d => d.py + (state.orient === 'h' ? 3 : -10))
        .attr('text-anchor', state.orient === 'h' ? 'start' : 'middle')
        .attr('font-size', d => d.node.depth === 0 ? 12 : 10.5)
        .attr('font-weight', d => d.node.depth <= 1 ? 700 : 500)
        .attr('fill', d => d.node.depth === 1 ? accent : '#333a46')
        .attr('pointer-events', 'none')
        .text(d => d.node.data.name);
    }
    // 阶段角标
    gT.append('text').attr('x', 12).attr('y', 20).attr('font-size', 12).attr('font-weight', 700)
      .attr('fill', accent).text(FRAMES[f]);
  }

  // 控件：朝向 + 播放 + separation
  segmented(row,
    [
      { label: T('水平', 'Horizontal'), value: 'h' },
      { label: T('垂直', 'Vertical'), value: 'v' },
      { label: T('放射', 'Radial'), value: 'radial' }
    ],
    v => { state.orient = v; draw(); }, 0);
  const sep = slider(row, T('separation', 'separation'),
    { min: 0.6, max: 2.2, step: 0.1, value: 1.2, fmt: v => v.toFixed(1) },
    v => { state.sep = v; draw(); });
  player(row, {
    en, total: 5, interval: 850,
    frameLabel: n => `${n + 1}/5`,
    render: (f) => { state.frame = f; draw(); }
  });

  draw();
  ui.setConcl(T(
    `<b>结论：</b>Reingold–Tilford 用两遍遍历先估子树宽度、再分配 x 并消除重叠，O(n)；<b>水平/垂直/放射只是坐标换了映射</b>，放射布局把 x 映射成角度、y 映射成半径。separation 调的是兄弟节点间距。`,
    `<b>Takeaway:</b> Reingold–Tilford does two passes in O(n); horizontal/vertical/radial differ only by coordinate mapping (radial maps x→angle, y→radius); separation sets sibling spacing.`));
};

// ============================================================
// d02-4 事件冒泡路径动画 + 单绑 / 委托
// ============================================================
D['d02-4'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en } = cx;
  const ui = shell(mount, {
    hint: T('点击一个学生（叶子），观察事件沿 DOM 树自底向上逐层冒泡；选择阻断层体会 stopPropagation；再切换「事件委托」看监听器从 N 个降到 1 个。',
           'Click a student leaf and watch the event bubble up the DOM tree. Set a blocking layer for stopPropagation, then switch to delegation to see N listeners become 1.'),
    lang, accent
  });
  ui.showControls();

  const students = await loadStudents(d3, data);
  // 跨班级分层取样（每个班取若干），让 DOM 树同时呈现专业→班级的多个分支
  const PER_CLS = [6, 5, 3];
  const sample = [];
  d3.groups(students, d => d.cls).forEach(([cls, arr], i) => {
    sample.push(...arr.slice(0, PER_CLS[i] || 3));
  });
  const tree = { name: T('新生列表 <ul>', '<ul> root'), type: 'root', children: [] };
  d3.groups(sample, d => d.major).forEach(([major, arr]) => {
    const m = { name: major + ' <li>', type: 'major', children: [] };
    d3.groups(arr, d => d.cls).forEach(([cls, arr2]) => {
      const short = (cls.match(/(\d+班)$/) || [cls])[1];
      const c = { name: short + ' <li>', type: 'class', children: [] };
      arr2.forEach(s => c.children.push({ name: s.name, type: 'leaf', obj: s }));
      m.children.push(c);
    });
    tree.children.push(m);
  });

  const controls1 = document.createElement('div');
  controls1.className = 'vx-chiprow';
  const controls2 = document.createElement('div');
  controls2.className = 'vx-chiprow';
  ui.controls.append(controls1, controls2);

  const counter = document.createElement('div');
  counter.className = 'evt-counter';
  ui.stage.append(counter);
  const stage = document.createElement('div');
  stage.className = 'evt-stage';
  ui.stage.append(stage);

  const state = { delegate: false, stopLayer: 'none' };
  let leafCount = sample.length;

  function renderCounter() {
    const n = state.delegate ? 1 : leafCount;
    counter.innerHTML = T(
      `<b>当前绑定的 click 监听器：</b><span class="evt-num">${n}</b> ${state.delegate ? '（根节点 1 个，事件委托）' : '（每个叶子各 1 个）'}`,
      `<b>click listeners bound:</b> <span class="evt-num">${n}</span> ${state.delegate ? '(one on root, delegated)' : '(one per leaf)'}`);
  }

  // 渲染 DOM 树
  function renderTree() {
    stage.innerHTML = '';
    const root = document.createElement('div');
    root.className = 'evt-root';
    root.dataset.type = 'root';
    build(tree, root, 0);
    stage.append(root);
    wire();
  }

  function build(node, parent, depth) {
    const wrap = document.createElement('div');
    wrap.className = 'evt-node evt-' + node.type;
    wrap.dataset.type = node.type;
    wrap.dataset.depth = depth;
    const label = document.createElement('span');
    label.className = 'evt-label';
    if (node.type === 'leaf') {
      label.classList.add('evt-leaf-label');
      label.textContent = '👤 ' + node.name;
    } else {
      const caret = document.createElement('span');
      caret.className = 'evt-caret';
      caret.textContent = '▾';
      const name = document.createElement('span');
      name.textContent = node.name;
      label.append(caret, name);
      caret.addEventListener('click', (e) => {
        e.stopPropagation();
        const kids = wrap.querySelector('.evt-children');
        if (kids) {
          const collapsed = kids.classList.toggle('evt-collapsed');
          caret.textContent = collapsed ? '▸' : '▾';
        }
      });
    }
    wrap.append(label);
    if (node.children && node.children.length) {
      const kids = document.createElement('div');
      kids.className = 'evt-children';
      node.children.forEach(ch => build(ch, kids, depth + 1));
      wrap.append(kids);
    }
    parent.append(wrap);
  }

  function clearHi() {
    stage.querySelectorAll('.evt-node').forEach(n => n.classList.remove('evt-cap', 'evt-tgt', 'evt-bubble', 'evt-blocked'));
  }

  function chainOf(target) {
    const arr = [];
    let n = target;
    while (n && n.classList && n.classList.contains('evt-node')) { arr.push(n); n = n.parentElement.closest('.evt-node'); }
    return arr; // [leaf, ..., root]
  }

  function handleClick(target) {
    clearHi();
    const chain = chainOf(target);
    // 捕获阶段：root → leaf（先标记，快速闪一下）
    chain.slice().reverse().forEach((n, i) => {
      setTimeout(() => n.classList.add('evt-cap'), i * 60);
    });
    const capTime = chain.length * 60;
    // 冒泡：leaf → root，遇到阻断层停止
    setTimeout(() => {
      chain.forEach((n) => n.classList.remove('evt-cap'));
      const tgt = chain[0];
      tgt.classList.add('evt-tgt');
      let stopped = false;
      chain.forEach((n, i) => {
        if (stopped) return;
        setTimeout(() => {
          if (state.stopLayer !== 'none' && n.dataset.type === state.stopLayer) {
            n.classList.add('evt-blocked');
            stopped = true;
            return;
          }
          n.classList.add('evt-bubble');
        }, i * 240);
      });
    }, capTime + 220);
  }

  function wire() {
    clearHi();
    if (state.delegate) {
      // 根节点委托：只绑 1 个
      const rootEl = stage.querySelector('.evt-root');
      rootEl.addEventListener('click', (ev) => {
        const leaf = ev.target.closest('.evt-leaf-label');
        if (!leaf) return;
        if (ev.target.classList.contains('evt-caret')) return;
        handleClick(leaf.parentElement);
      });
    } else {
      // 每个叶子单独绑
      stage.querySelectorAll('.evt-leaf-label').forEach(lab => {
        lab.addEventListener('click', (ev) => {
          if (ev.target.classList.contains('evt-caret')) return;
          handleClick(lab.parentElement);
        });
      });
    }
  }

  segmented(controls1,
    [
      { label: T('每个叶子单独监听', 'One listener per leaf'), value: false },
      { label: T('根节点事件委托', 'Delegated on root'), value: true }
    ],
    v => { state.delegate = v; renderCounter(); renderTree(); }, 0);
  select(controls2, T('stopPropagation 层：', 'stopPropagation at: '),
    [
      { label: T('不阻断', 'None'), value: 'none' },
      { label: T('班级 <li>', 'class <li>'), value: 'class' },
      { label: T('专业 <li>', 'major <li>'), value: 'major' }
    ],
    v => { state.stopLayer = v; clearHi(); }, 0);

  const resetBtn = button(T('重置高亮', 'Reset'), '');
  resetBtn.addEventListener('click', clearHi);
  controls2.append(resetBtn);

  renderCounter();
  renderTree();
  ui.setConcl(T(
    `<b>结论：</b>事件先<b>捕获</b>（根→叶）、命中目标、再<b>冒泡</b>（叶→根）。事件委托只在根上绑 <b>1</b> 个监听，用 <code>closest()</code> 找目标，对动态新增的叶子同样有效；<code>stopPropagation()</code> 能在任意一层截断冒泡。`,
    `<b>Takeaway:</b> events capture (root→target), then bubble (target→root). Delegation binds one listener on the root and uses closest() — it also covers future nodes; stopPropagation() can cut the path at any layer.`));
};

export default D;
