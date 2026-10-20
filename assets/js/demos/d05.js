// ============================================================
// d05.js — 第 5 章《时序数据可视化》交互演示（5 个，全部重新设计）
//   d05-1 时间属性 → 场景拖拽分类（5 属性区，错放反例，解锁推荐图）
//   d05-2 人名折线 → 1900–2020 播放生长 + brush 缩放 + 归一化/面积
//   d05-3 日历热图 → 年历/12 月小倍数/星期×月 循环 三布局联动
//   d05-4 螺旋日历 → 螺旋/直线对照 + 每圈周期可调（同相位对齐）
//   d05-5 Storyline → 拖拽车道重排 + Storyline/Alluvial 对照
// 函数签名：(mount, { d3, data, lang, accent }) => {}
// ============================================================
import { shell, svg, makeCtx, button, segmented, slider, toggle, tooltip, C } from './_ui.js';

const D = {};

// ============================================================
// d05-1 时间属性 · 场景拖拽分类
// ============================================================
D['d05-1'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('把 8 个真实场景拖到它最依赖的时间属性上（手机/触屏可先点卡片、再点属性区）。放对会解锁该属性的推荐图表，放错会演示"据此选错属性会画出什么错误图"。',
           'Drag 8 real scenarios onto the time attribute they most depend on (tap a card then a zone on touch). Correct placements unlock the recommended chart; wrong ones show the misleading chart that results.'),
    lang, accent
  });
  ui.showControls();

  const ATTRS = [
    { key: 'ordered', zh: '有序性', en: 'Ordered', color: '#0e7fa8',
      recZh: '时间轴 / 甘特 / 折线：x 轴严格按先后，保留因果', recEn: 'Timeline / Gantt / line: ordered axis preserves causality',
      wrongZh: '画成单向时间轴只强调先后，会丢掉"重复"——周期信号不会在这条直线上回卷。', wrongEn: 'A one-way timeline stresses order and loses repetition — a periodic signal never loops back.' },
    { key: 'continuous', zh: '连续性', en: 'Continuous', color: '#1f7a4d',
      recZh: '连续折线 / 流式面积：任意两点间仍有取值', recEn: 'Continuous line / streaming area: values exist between any two points',
      wrongZh: '画成连续曲线/流式，把它当成不间断的量，会忽略离散班次/提交之间的空隙。', wrongEn: 'A continuous curve treats it as unbroken, hiding the gaps between discrete events.' },
    { key: 'periodic', zh: '周期性', en: 'Periodic', color: '#f59e0b',
      recZh: '螺旋 / 日历热图 / 极坐标：把同相位折叠到一起', recEn: 'Spiral / calendar heatmap / polar: fold same phases together',
      wrongZh: '强行回卷成螺旋/循环，会让有因果先后的事件顺序被抹平。', wrongEn: 'Forcing it into a loop/circle erases the causal before-after order.' },
    { key: 'spatial', zh: '独立于空间', en: 'Space-independent', color: '#6b55c7',
      recZh: 'x 只放时间、y 只放度量；多地点用小倍数分面', recEn: 'x=time, y=measure only; facet multiple places as small multiples',
      wrongZh: '若把空间混进时间轴（或反之），坐标语义会被污染，无法直接比较时序。', wrongEn: 'Mixing space into the time axis (or vice versa) pollutes the encoding and blocks time comparison.' },
    { key: 'structured', zh: '结构性', en: 'Structured', color: '#b43b7e',
      recZh: '日历/周历视图：按年-月-周-日格子与工作日聚合', recEn: 'Calendar/week layout: group by year-month-week-day cells and workdays',
      wrongZh: '按日历格子/工作日聚合，会掩盖原始先后或连续变化，只看到人为分割后的块。', wrongEn: 'Grouping by calendar cells/workdays hides raw order and continuity, leaving only man-made blocks.' }
  ];

  const CARDS = [
    { id: 'train', zh: '火车时刻表：每趟班次有固定到发时刻', en: 'Train timetable: fixed arrivals/departures', attr: 'ordered' },
    { id: 'git', zh: 'git commit 历史：提交先后决定代码演进', en: 'git commit history: order drives code evolution', attr: 'ordered' },
    { id: 'hr', zh: '智能手环逐秒心率流：任意两秒之间都有心率', en: 'Wrist heart-rate stream: a value between any two seconds', attr: 'continuous' },
    { id: 'temp12', zh: '12 个月气温年周期：每年同月份重复', en: '12-month temperature: repeats every year', attr: 'periodic' },
    { id: 'body24', zh: '24 小时体温昼夜节律：每小时回卷', en: '24h body-temperature circadian rhythm', attr: 'periodic' },
    { id: 'cities', zh: '对比多城市气温：各城市用小倍数，只在时间上比较', en: 'Compare cities: small multiples, compare only over time', attr: 'spatial' },
    { id: 'weekend', zh: '工作日 vs 周末出行量差异', en: 'Weekday vs weekend travel patterns', attr: 'structured' },
    { id: 'leap', zh: '闰年与日历安排：自然昼夜与人为 60 进制分割', en: 'Leap years and calendar conventions', attr: 'structured' }
  ];

  // ---- 控制条：重置 + 进度 ----
  const resetBtn = button(T('↺ 重置', '↺ Reset'), '');
  const scoreTag = document.createElement('span');
  scoreTag.className = 'vx-tag';
  ui.controls.append(resetBtn, scoreTag);

  // ---- 舞台：卡片托盘 + 5 个投放区 ----
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:14px;';

  const tray = document.createElement('div');
  tray.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;min-height:46px;padding:10px;border:1.5px dashed #c3cad6;border-radius:12px;background:#f5f7fa;';
  const trayCap = document.createElement('span');
  trayCap.className = 'vx-tag';
  trayCap.textContent = T('待分类场景', 'Scenarios to classify');
  tray.append(trayCap);

  const zones = document.createElement('div');
  zones.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;';
  const zoneMap = {};
  ATTRS.forEach(a => {
    const z = document.createElement('div');
    z.dataset.key = a.key;
    z.style.cssText = `border:2px solid ${a.color};border-radius:12px;padding:8px;min-height:120px;background:${a.color}0d;display:flex;flex-direction:column;gap:6px;`;
    const head = document.createElement('div');
    head.style.cssText = `font-weight:700;color:${a.color};font-size:13px;display:flex;align-items:center;gap:6px;`;
    head.innerHTML = `<span style="width:10px;height:10px;border-radius:50%;background:${a.color};display:inline-block"></span>${T(a.zh, a.en)}`;
    const rec = document.createElement('div');
    rec.style.cssText = 'font-size:11px;color:#454e5e;display:none;line-height:1.5;';
    rec.textContent = T(a.recZh, a.recEn);
    const box = document.createElement('div');
    box.style.cssText = 'display:flex;flex-direction:column;gap:5px;flex:1;';
    z.append(head, rec, box);
    zoneMap[a.key] = { z, box, rec };
    // 投放（拖放）
    z.addEventListener('dragover', e => { e.preventDefault(); z.style.background = a.color + '22'; });
    z.addEventListener('dragleave', () => { z.style.background = a.color + '0d'; });
    z.addEventListener('drop', e => { e.preventDefault(); z.style.background = a.color + '0d'; place(e.dataTransfer.getData('text/card'), a.key); });
    // 点击投放（触摸等价）
    z.addEventListener('click', () => { if (sel) { const id = sel; clearSel(); place(id, a.key); } });
    zones.append(z);
  });

  const fb = document.createElement('div');
  fb.style.cssText = 'min-height:34px;border-radius:10px;padding:8px 12px;font-size:12.5px;line-height:1.5;display:none;';
  wrap.append(tray, zones, fb);
  ui.stage.append(wrap);

  let sel = null;
  const done = new Set();
  function clearSel() { sel = null; tray.querySelectorAll('.vx-dragcard').forEach(c => c.classList.remove('sel')); }
  function refresh() {
    scoreTag.textContent = T(`已正确分类 ${done.size}/8`, `Correct ${done.size}/8`);
  }
  function place(id, zoneKey) {
    const card = CARDS.find(c => c.id === id);
    if (!card || done.has(id)) return;
    const a = ATTRS.find(x => x.key === zoneKey);
    if (card.attr === zoneKey) {
      // 正确：锁定到该区
      const el = document.getElementById('card-' + id);
      if (el) { el.draggable = false; el.classList.add('locked'); el.style.borderColor = a.color; el.style.background = a.color + '14'; el.style.cursor = 'default'; box2(a).append(el); }
      zoneMap[zoneKey].rec.style.display = 'block';
      fb.style.display = 'block';
      fb.style.cssText = `min-height:34px;border-radius:10px;padding:8px 12px;font-size:12.5px;line-height:1.5;background:${C.good}14;color:#1f7a4d;border:1px solid ${C.good}55;`;
      fb.textContent = T(`✓ 放对了：「${card.zh}」主要体现${a.zh}，推荐 ${a.recZh}`, `✓ Correct: “${card.en}” is mainly ${a.en}. Use ${a.recEn}`);
      done.add(id); refresh();
      if (done.size === CARDS.length) {
        ui.setConcl(T('全部 8 个场景分类完成。同一个时间属性决定图表选型：<strong>先后</strong>用时间轴、<strong>连续</strong>用流式折线、<strong>周期</strong>用螺旋/日历、<strong>时间独立于空间</strong>用小倍数、<strong>结构</strong>用日历格子。属性不是用来背定义，而是用来判断该怎么画。',
          'All 8 classified. The attribute drives chart choice: order→timeline, continuity→streaming line, periodicity→spiral/calendar, space-independence→small multiples, structure→calendar cells.'));
      }
    } else {
      // 错误：给出反例
      fb.style.display = 'block';
      fb.style.cssText = `min-height:34px;border-radius:10px;padding:8px 12px;font-size:12.5px;line-height:1.5;background:${C.bad}12;color:#b3382c;border:1px solid ${C.bad}55;`;
      fb.textContent = T(`✗ 再想想：「${card.zh}」若按「${a.zh}」处理 —— ${a.wrongZh}`, `✗ Not quite: treating “${card.en}” as ${a.en} — ${a.wrongEn}`);
    }
  }
  function box2(a) { return zoneMap[a.key].box; }

  function buildCards() {
    done.clear(); sel = null; fb.style.display = 'none';
    tray.querySelectorAll('.vx-dragcard').forEach(c => c.remove());
    ATTRS.forEach(a => { zoneMap[a.key].box.innerHTML = ''; zoneMap[a.key].rec.style.display = 'none'; zoneMap[a.key].z.style.background = a.color + '0d'; });
    CARDS.forEach(c => {
      const el = document.createElement('div');
      el.id = 'card-' + c.id;
      el.className = 'vx-dragcard';
      el.draggable = true;
      el.textContent = T(c.zh, c.en);
      el.style.cssText = 'border:1.5px solid #c3cad6;background:#fff;border-radius:10px;padding:7px 10px;font-size:12.5px;max-width:230px;cursor:grab;box-shadow:0 1px 2px rgba(15,23,42,.06);';
      el.addEventListener('dragstart', e => { e.dataTransfer.setData('text/card', c.id); e.dataTransfer.effectAllowed = 'move'; });
      el.addEventListener('click', () => {
        if (done.has(c.id)) return;
        if (sel === c.id) { clearSel(); return; }
        clearSel(); sel = c.id; el.classList.add('sel');
      });
      tray.append(el);
    });
    refresh();
  }
  resetBtn.addEventListener('click', buildCards);
  buildCards();
  ui.setConcl(T('时间的 5 个属性不是互斥的标签，而是<strong>选图的依据</strong>：先判断场景里最关键的是"先后/连续/重复/结构/与空间的关系"，再决定用哪种时间表达。',
    'The five time attributes are not mere labels but chart-choice criteria: identify whether order, continuity, repetition, structure or the space relation dominates, then pick the time encoding.'));
};

// ============================================================
// d05-2 人名折线：播放生长 + brush 缩放 + 归一化/面积
// ============================================================
D['d05-2'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('三个法国名字（Marie/Jean/Camille）1900–2020 的出生登记。播放看线条逐年生长，在下方条带里框选年代放大（可反复刷），切归一化比较"份额"、面积看累积。',
           'Three French given names 1900–2020. Play to grow the lines year by year, brush a span in the strip to zoom (re-brushable), toggle normalization to compare shares, and area to see stacking.'),
    lang, accent
  });
  ui.showControls();
  const raw = await d3.json(data + 'french_names.json');
  const y0 = raw.year_range[0], y1 = raw.year_range[1];
  const names = Object.keys(raw.names);
  const series = names.map(n => ({
    name: n,
    vals: raw.names[n].map(d => ({ year: +d.year, count: +d.count, name: n })),
    peak: d3.max(raw.names[n], d => +d.count)
  }));
  const colors = ['#4a46c9', '#0e7fa8', '#b43b7e'];

  // 峰值事件（用于标注）
  const events = {
    Marie: { year: 1954, zh: 'Marie 最流行', en: 'Marie peaks' },
    Jean: { year: 1979, zh: 'Jean 登顶', en: 'Jean peaks' },
    Camille: { year: 2003, zh: 'Camille 爆红', en: 'Camille surges' }
  };

  // 控制条
  const playBtn = button(T('▶ 播放 1900→2020', '▶ Play 1900→2020'), 'primary');
  const resetBtn = button(T('↺ 全程', '↺ Reset'), '');
  ui.controls.append(playBtn, resetBtn);
  let norm = false, area = false, upto = y1, timer = null;

  const legend = document.createElement('div');
  legend.style.cssText = 'display:flex;gap:18px;font-size:12.5px;font-weight:700;padding:0 2px;flex-wrap:wrap;';
  legend.innerHTML = names.map((n, i) => `<span style="color:${colors[i]}">● ${n}</span>`).join('');
  ui.stage.append(legend);

  const W = 780, H = 420, m = { l: 56, r: 18, t: 18, b: 78 }, ch = H - m.t - m.b;
  const s = svg(d3, ui.stage, W, H);
  const tip = tooltip();
  const gMain = s.append('g').attr('transform', `translate(${m.l},${m.t})`);
  const gBrush = s.append('g').attr('transform', `translate(${m.l},${m.t + ch + 34})`);
  const iw = W - m.l - m.r, bh = 30;

  const xFull = d3.scaleLinear().domain([y0, y1]).range([0, iw]);
  const yVal = d3.scaleLinear().range([ch, 0]);
  const line = d3.line().x(d => xFull(d.year)).y(d => yVal(valOf(d))).defined(d => d.year <= upto);
  const areaG = d3.area().x(d => xFull(d.year)).y0(ch).y1(d => yVal(valOf(d))).defined(d => d.year <= upto);
  const peakOf = nm => series.find(s => s.name === nm).peak;
  const valOf = d => (norm ? (d.count / peakOf(d.name) * 100) : d.count);

  const axisG = gMain.append('g').attr('class', 'axis');
  const xAxis = gMain.append('g').attr('transform', `translate(0,${ch})`);
  const yAxis = gMain.append('g');
  const gridG = gMain.append('g');
  const pathsG = gMain.append('g');
  const eventG = gMain.append('g');
  const labelsG = gMain.append('g');
  const cross = gMain.append('g').style('display', 'none');
  const crossLine = cross.append('line').attr('y1', 0).attr('y2', ch).attr('stroke', '#94a0b3').attr('stroke-dasharray', '3 3');
  const crossDots = cross.selectAll('circle');

  // 下方 brush 条带（迷你归一化线）
  const bx = d3.scaleLinear().domain([y0, y1]).range([0, iw]);
  const by = d3.scaleLinear().domain([0, 100]).range([bh, 0]);
  series.forEach((sr, i) => {
    gBrush.append('path').attr('fill', 'none').attr('stroke', colors[i]).attr('stroke-width', 1.2).attr('opacity', .55)
      .attr('d', d3.line().x(d => bx(d.year)).y(d => by(d.count / sr.peak * 100))(sr.vals));
  });
  gBrush.append('rect').attr('x', 0).attr('y', 0).attr('width', iw).attr('height', bh).attr('fill', 'none').attr('stroke', '#c3cad6');
  const brush = d3.brushX().extent([[0, 0], [iw, bh]]).on('brush end', ev => {
    if (ev.selection) {
      const [a, b] = ev.selection.map(bx.invert);
      xFull.domain([Math.round(a), Math.round(b)]);
      upto = Math.round(b);
    } else {
      xFull.domain([y0, y1]); upto = y1;
    }
    render();
  });
  const brushG = gBrush.append('g').call(brush);

  // 事件 + 网格
  function render() {
    const vis = v => v.year >= xFull.domain()[0] && v.year <= xFull.domain()[1];
    const max = norm ? 100 : d3.max(series, sr => d3.max(sr.vals.filter(vis), d => d.count));
    yVal.domain([0, max || 1]).nice();
    xAxis.transition().duration(dur).call(d3.axisBottom(xFull).tickFormat(d3.format('d')).ticks(10));
    yAxis.transition().duration(dur).call(d3.axisLeft(yVal).ticks(6).tickFormat(norm ? d => d + '%' : d3.format(',')));
    gridG.selectAll('*').data(yVal.ticks(6)).join('line')
      .attr('x1', 0).attr('x2', iw).attr('stroke', C.grid).attr('stroke-dasharray', '2 3')
      .attr('y1', d => yVal(d)).attr('y2', d => yVal(d));

    const paths = pathsG.selectAll('path').data(series);
    paths.join('path')
      .attr('fill', 'none')
      .attr('stroke', (d, i) => colors[i])
      .attr('stroke-width', 2.2)
      .merge(paths)
      .attr('d', d => area ? areaG(d.vals) : line(d.vals))
      .attr('fill', (d, i) => area ? colors[i] + '22' : 'none');
    paths.merge(paths).attr('d', d => area ? areaG(d.vals) : line(d.vals))
      .attr('fill', (d, i) => area ? colors[i] + '22' : 'none');

    // 图例已在顶部 HTML 给出，末端不再叠标签（2020 三条线都趋近 0 会重叠）
    labelsG.selectAll('text').remove();

    // 事件标记
    const evs = eventG.selectAll('g').data(series).join('g');
    evs.selectAll('line').data(d => [events[d.name]]).join('line')
      .attr('x1', e => xFull(e.year)).attr('x2', e => xFull(e.year)).attr('y1', 0).attr('y2', ch)
      .attr('stroke', '#94a0b3').attr('stroke-dasharray', '4 4').attr('opacity', .0)
      .merge(evs.selectAll('line'))
      .attr('opacity', e => (xFull(e.year) >= 0 && xFull(e.year) <= iw && e.year <= upto) ? .7 : 0);
    evs.selectAll('text').data(d => [events[d.name]]).join('text').attr('font-size', 10).attr('fill', '#454e5e')
      .attr('text-anchor', 'middle')
      .text(e => (en ? e.en : e.zh))
      .merge(evs.selectAll('text'))
      .attr('x', e => xFull(e.year)).attr('y', -4)
      .attr('opacity', e => (xFull(e.year) >= 0 && xFull(e.year) <= iw && e.year <= upto) ? 1 : 0);
  }

  // 悬停十字线
  gMain.append('rect').attr('x', 0).attr('y', 0).attr('width', iw).attr('height', ch).attr('fill', 'transparent')
    .on('mousemove', ev => {
      const [mx] = d3.pointer(ev);
      const yr = Math.round(xFull.invert(mx));
      if (yr < xFull.domain()[0] || yr > xFull.domain()[1]) { cross.style('display', 'none'); return; tip.hide(); }
      cross.style('display', null);
      crossLine.attr('x1', xFull(yr)).attr('x2', xFull(yr));
      const rows = series.map((sr, i) => {
        const p = sr.vals.find(v => v.year === yr);
        return { i, sr, p };
      }).filter(r => r.p);
      const dots = cross.selectAll('circle').data(rows);
      dots.join('circle').attr('r', 4).attr('fill', 'white').attr('stroke-width', 2)
        .merge(dots)
        .attr('cx', xFull(yr)).attr('cy', r => yVal(valOf({ name: r.sr.name, count: r.p.count }))).attr('stroke', r => colors[r.i]);
      dots.exit().remove();
      tip.show(ev, `<b>${yr}</b><br>` + rows.map(r => `<span style="color:${colors[r.i]}">●</span> ${r.sr.name}: ${d3.format(',')(r.p.count)}${norm ? '（' + Math.round(r.p.count / r.sr.peak * 100) + '%）' : ''}`).join('<br>'));
    })
    .on('mouseleave', () => { cross.style('display', 'none'); tip.hide(); });

  // 播放
  function stop() { if (timer) { clearInterval(timer); timer = null; } playBtn.innerHTML = T('▶ 播放 1900→2020', '▶ Play 1900→2020'); }
  playBtn.addEventListener('click', () => {
    if (timer) { stop(); return; }
    if (upto >= xFull.domain()[1]) { upto = xFull.domain()[0]; }
    playBtn.innerHTML = T('❚❚ 暂停', '❚❚ Pause');
    timer = setInterval(() => {
      upto += 2;
      if (upto >= xFull.domain()[1]) { upto = xFull.domain()[1]; render(); stop(); return; }
      render();
    }, 40);
  });
  resetBtn.addEventListener('click', () => {
    stop(); brushG.call(brush.move, null); xFull.domain([y0, y1]); upto = y1; render();
  });

  segmented(ui.controls, [
    { label: T('绝对人数', 'Absolute'), value: 'abs' },
    { label: T('归一化(占峰值%)', 'Normalized'), value: 'norm' }
  ], v => { norm = v === 'norm'; render(); }, 0);
  segmented(ui.controls, [
    { label: T('折线', 'Line'), value: 'line' },
    { label: T('面积', 'Area'), value: 'area' }
  ], v => { area = v === 'area'; render(); }, 0);

  render();
  ui.setConcl(T('<strong>scaleTime 按时间放 x 轴</strong>，播放让"流行度赛跑"可见；brush 框选放大用于精读某个年代。绝对人数比总量、归一化比"份额"（同一名字占自己峰值的百分比），后者消除了规模差异、便于比较形态。',
    '<strong>scaleTime positions time</strong>; play reveals the popularity race and brush zooms an era. Absolute counts compare volume, while normalization compares shape (share of each name’s own peak) by removing scale.'));
};

// ============================================================
// d05-3 日历热图：年历 / 12 月小倍数 / 星期×月 三布局
// ============================================================
D['d05-3'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('同一份 2024 气温/降雨，用三种日历布局看：年历（GitHub 式 53×7）、12 月小倍数、星期×月循环（聚合每月各星期）。不同布局暴露不同周期，切指标、配色，并可高亮周末。',
           'The same 2024 temperature/rain seen through three calendar layouts: year (53×7 GitHub style), 12 month small multiples, and weekday×month cycle. Switch metric/colormap and highlight weekends.'),
    lang, accent
  });
  ui.showControls();
  const raw = await d3.csv(data + 'weather_2024.csv', d => {
    const dt = new Date(d.date + 'T00:00:00');
    return { dt, temp: +d.temp_max, rain: +d.rain_mm };
  });

  let metric = 'temp', layout = 'year', cmapKey = 'rdbu', weekends = false;
  const extent = { temp: d3.extent(raw, d => d.temp), rain: [0, d3.max(raw, d => d.rain)] };
  const cmaps = {
    viridis: d3.interpolateViridis,
    rdbu: t => d3.interpolateRdBu(1 - t),
    blues: d3.interpolateBlues
  };
  const colorOf = d => {
    const [lo, hi] = extent[metric];
    const t = d3.scaleLinear().domain([lo, hi]).clamp(true)(d[metric]);
    return cmaps[cmapKey](t);
  };

  const DOW = en ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['日', '一', '二', '三', '四', '五', '六'];
  const MON = en ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    : ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const tip = tooltip();

  segmented(ui.controls, [
    { label: T('气温', 'Temp'), value: 'temp' },
    { label: T('降雨', 'Rain'), value: 'rain' }
  ], v => { metric = v; draw(); }, 0);
  segmented(ui.controls, [
    { label: T('年历', 'Year'), value: 'year' },
    { label: T('12 月', '12 months'), value: 'month' },
    { label: T('星期×月', 'Week×Month'), value: 'cycle' }
  ], v => { layout = v; draw(); }, 0);
  segmented(ui.controls, [
    { label: 'RdBu', value: 'rdbu' },
    { label: 'Viridis', value: 'viridis' },
    { label: 'Blues', value: 'blues' }
  ], v => { cmapKey = v; draw(); }, 0);
  toggle(ui.controls, T('高亮周末', 'Weekends'), false, v => { weekends = v; draw(); });

  const tipTxt = d => {
    const wd = d.dt.getDay() === 0 || d.dt.getDay() === 6;
    return `${d3.timeFormat('%Y-%m-%d')(d.dt)}<br>${T('最高气温', 'Temp max')}: ${d.temp}°C<br>${T('降雨', 'Rain')}: ${d.rain}mm${wd ? '<br>' + T('周末', 'weekend') : ''}`;
  };

  function draw() {
    ui.stage.innerHTML = '';
    const isWeekend = d => d.dt.getDay() === 0 || d.dt.getDay() === 6;
    if (layout === 'year') {
      const cell = 15, padL = 28, padT = 20;
      const weeks = d3.timeWeek.count(d3.timeYear(raw[0].dt), raw[raw.length - 1].dt) + 1;
      const W = padL + weeks * cell + 8, H = padT + 7 * cell + 26;
      const s = svg(d3, ui.stage, W, H, { scrollMin: W });
      const g = s.append('g').attr('transform', `translate(${padL},${padT})`);
      // 月份列标签
      for (let m = 0; m < 12; m++) {
        const first = new Date(2024, m, 1);
        const wk = d3.timeWeek.count(d3.timeYear(first), first);
        g.append('text').attr('x', wk * cell).attr('y', -8).attr('font-size', 10).attr('fill', '#6f7c91').text(MON[m]);
      }
      DOW.forEach((d, i) => g.append('text').attr('x', -8).attr('y', i * cell + cell - 4).attr('font-size', 9).attr('text-anchor', 'end').attr('fill', '#94a0b3').text(d));
      g.selectAll('rect').data(raw).join('rect')
        .attr('x', d => d3.timeWeek.count(d3.timeYear(d.dt), d.dt) * cell + 1)
        .attr('y', d => d.dt.getDay() * cell + 1)
        .attr('width', cell - 2).attr('height', cell - 2).attr('rx', 2)
        .attr('fill', colorOf)
        .attr('stroke', d => (weekends && isWeekend(d)) ? '#14171c' : 'none').attr('stroke-width', 1.4)
        .on('mousemove', (ev, d) => tip.show(ev, tipTxt(d))).on('mouseleave', () => tip.hide());
    }
    if (layout === 'month') {
      const cell = 16, padL = 20, cardW = 7 * cell + 30, cardH = 6 * cell + 34;
      const cols = 4, W = padL + cols * cardW, H = 3 * cardH + 16;
      const s = svg(d3, ui.stage, W, H, { scrollMin: W });
      for (let m = 0; m < 12; m++) {
        const cx0 = padL + (m % cols) * cardW, cy0 = Math.floor(m / cols) * cardH + 8;
        const mg = s.append('g').attr('transform', `translate(${cx0},${cy0})`);
        mg.append('text').attr('x', 0).attr('y', 0).attr('font-size', 12).attr('font-weight', 700).attr('fill', '#14171c').text(MON[m]);
        const first = new Date(2024, m, 1).getDay();
        const ndays = new Date(2024, m + 1, 0).getDate();
        for (let day = 1; day <= ndays; day++) {
          const dt = new Date(2024, m, day);
          const idx = first + day - 1;
          const col = idx % 7, row = Math.floor(idx / 7);
          const rec = raw.find(r => r.dt.getTime() === dt.getTime());
          mg.append('rect')
            .attr('x', col * cell + 2).attr('y', row * cell + 10).attr('width', cell - 2).attr('height', cell - 2).attr('rx', 2)
            .attr('fill', rec ? colorOf(rec) : '#eee')
            .attr('stroke', rec && weekends && (dt.getDay() === 0 || dt.getDay() === 6) ? '#14171c' : 'none')
            .on('mousemove', ev => rec && tip.show(ev, tipTxt(rec))).on('mouseleave', () => tip.hide());
          mg.append('text').attr('x', col * cell + 5).attr('y', row * cell + 21).attr('font-size', 7.5).attr('fill', '#333a46').attr('opacity', .8).text(day);
        }
      }
    }
    if (layout === 'cycle') {
      // 聚合：星期(7) × 月(12) 平均温度 / 总降雨
      const agg = Array.from({ length: 7 }, () => Array.from({ length: 12 }, () => []));
      raw.forEach(d => { agg[d.dt.getDay()][d.dt.getMonth()].push(d[metric]); });
      const cellW = 56, cellH = 34, padL = 40, padT = 26;
      const W = padL + 12 * cellW + 10, H = padT + 7 * cellH + 6;
      const s = svg(d3, ui.stage, W, H, { scrollMin: W });
      const g = s.append('g').attr('transform', `translate(${padL},${padT})`);
      MON.forEach((mm, m) => g.append('text').attr('x', m * cellW + cellW / 2).attr('y', -10).attr('text-anchor', 'middle').attr('font-size', 10).attr('fill', '#6f7c91').text(mm));
      DOW.forEach((w, dow) => g.append('text').attr('x', -8).attr('y', dow * cellH + cellH / 2 + 3).attr('text-anchor', 'end').attr('font-size', 10)
        .attr('fill', (weekends && (dow === 0 || dow === 6)) ? '#14171c' : '#94a0b3').attr('font-weight', (weekends && (dow === 0 || dow === 6)) ? 700 : 400).text(w));
      const cells = [];
      for (let dow = 0; dow < 7; dow++) for (let m = 0; m < 12; m++) {
        const arr = agg[dow][m];
        const val = metric === 'rain' ? d3.sum(arr) : d3.mean(arr);
        cells.push({ dow, m, val });
      }
      g.selectAll('rect').data(cells).join('rect')
        .attr('x', c => c.m * cellW + 1).attr('y', c => c.dow * cellH + 1)
        .attr('width', cellW - 2).attr('height', cellH - 2).attr('rx', 3)
        .attr('fill', c => {
          const t = d3.scaleLinear().domain(extent[metric]).clamp(true)(c.val);
          return cmaps[cmapKey](t);
        })
        .attr('stroke', c => (weekends && (c.dow === 0 || c.dow === 6)) ? '#14171c' : 'none').attr('stroke-width', 1.3)
        .on('mousemove', (ev, c) => tip.show(ev, `${MON[c.m]} · ${T('星期', 'weekday')}${DOW[c.dow]}<br>${metric === 'rain' ? T('总降雨', 'total rain') : T('平均最高气温', 'avg temp')}: ${c.val.toFixed(1)}${metric === 'rain' ? 'mm' : '°C'}`))
        .on('mouseleave', () => tip.hide());
    }
  }
  draw();
  ui.setConcl(T('<strong>同一份数据，换布局就是换问题</strong>：年历擅长发现全年异常与空窗，12 月小倍数便于逐月对比，星期×月循环把"日内/周末"与"季节"两类周期摊开。选对布局，规律才显现；周末高亮暴露工作日-周末的结构差异。',
    '<strong>Same data, different layout asks a different question</strong>: the year calendar exposes anomalies and gaps, month multiples compare months, and the weekday×month cycle unfolds weekly and seasonal patterns. Weekend highlighting reveals structural workday/weekend differences.'));
};

// ============================================================
// d05-4 螺旋日历：螺旋/直线对照 + 每圈周期可调
// ============================================================
D['d05-4'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('把同一时间序列卷成阿基米德螺旋：每圈代表的周期可调（7/30/91/365 天）。当"每圈周期"与数据真实周期对齐时，同相位点会沿半径排成几条放射线——周期被"拉直"。右侧是普通直线时间轴对照。',
           'Spiral the same series: choose days per revolution (7/30/91/365). When it matches the data’s true period, same-phase points line up into radial arms — the period is straightened. A linear timeline is shown on the right.'),
    lang, accent
  });
  ui.showControls();
  const weather = await d3.csv(data + 'weather_2024.csv', d => ({ dt: new Date(d.date + 'T00:00:00'), v: +d.temp_max }));
  // 理想正弦：3 年（1095 天），周期 365 天
  const sine = d3.range(0, 1096).map(i => ({ i, v: 15 + 12 * Math.sin(2 * Math.PI * i / 365 - Math.PI / 2) }));

  let dataset = 'weather', P = 365;
  const W = 820, H = 380;
  const tip = tooltip();

  segmented(ui.controls, [
    { label: T('真实气温(1 年)', 'Real temp (1 yr)'), value: 'weather' },
    { label: T('理想正弦(3 年)', 'Ideal sine (3 yr)'), value: 'sine' }
  ], v => { dataset = v; draw(); }, 0);
  segmented(ui.controls, [
    { label: T('周 7 天', '7 d'), value: 7 },
    { label: T('月 30 天', '30 d'), value: 30 },
    { label: T('季 91 天', '91 d'), value: 91 },
    { label: T('年 365 天', '365 d'), value: 365 }
  ], v => { P = +v; draw(); }, 3);

  function draw() {
    ui.stage.innerHTML = '';
    const s2 = svg(d3, ui.stage, W, H);
    const isSine = dataset === 'sine';
    const pts = isSine
      ? sine.map(d => ({ i: d.i, v: d.v }))
      : weather.map((d, i) => ({ i, v: d.v }));
    const N = pts.length;
    const ext = isSine ? [-4, 30] : d3.extent(weather, d => d.v);
    const col = d3.scaleSequential(d3.interpolateRdYlBu).domain([ext[1], ext[0]]); // 蓝冷→红热
    const lineCol = d3.scaleLinear().domain([ext[0], ext[1]]).range([0, 1]);
    // ---- 左：螺旋 ----
    const cxS = 200, cyS = H / 2 - 6, r0 = 14, rmax = 150;
    const k = (rmax - r0) / N;
    const pos = (idx) => {
      const r = r0 + k * idx;
      const th = (2 * Math.PI * idx / P) - Math.PI / 2;
      return { x: cxS + r * Math.cos(th), y: cyS + r * Math.sin(th), r, th };
    };
    const gS = s2.append('g');
    // 放射参考线
    for (let a = 0; a < 8; a++) {
      const th = -Math.PI / 2 + a * Math.PI / 4;
      gS.append('line').attr('x1', cxS + r0 * Math.cos(th)).attr('y1', cyS + r0 * Math.sin(th))
        .attr('x2', cxS + rmax * Math.cos(th)).attr('y2', cyS + rmax * Math.sin(th))
        .attr('stroke', '#e7ebf1');
    }
    gS.append('circle').attr('cx', cxS).attr('cy', cyS).attr('r', r0).attr('fill', 'none').attr('stroke', '#c3cad6');
    gS.append('circle').attr('cx', cxS).attr('cy', cyS).attr('r', rmax).attr('fill', 'none').attr('stroke', '#c3cad6');
    for (let i = 1; i < N; i++) {
      const a = pos(i - 1), b = pos(i);
      gS.append('line').attr('x1', a.x).attr('y1', a.y).attr('x2', b.x).attr('y2', b.y)
        .attr('stroke', col(pts[i].v)).attr('stroke-width', 1.7).attr('opacity', .9)
        .on('mousemove', ev => tip.show(ev, `${T('第', 'day')} ${i + 1}<br>${pts[i].v.toFixed(1)}°C`)).on('mouseleave', () => tip.hide());
    }
    gS.append('text').attr('x', cxS).attr('y', cyS - 2).attr('text-anchor', 'middle').attr('font-size', 11).attr('font-weight', 700).attr('fill', '#14171c').text(P + ' ' + T('天/圈', 'd/rev'));
    gS.append('text').attr('x', cxS).attr('y', H - 12).attr('text-anchor', 'middle').attr('font-size', 12).attr('font-weight', 700).attr('fill', '#14171c').text(T('阿基米德螺旋', 'Archimedean spiral'));

    // ---- 右：直线时间轴 ----
    const lx = 392, ly = 60, lw = 400, lh = 240;
    const gL = s2.append('g').attr('transform', `translate(${lx},${ly})`);
    const x = d3.scaleLinear().domain([0, N - 1]).range([0, lw]);
    const y = d3.scaleLinear().domain(ext).range([lh, 0]);
    gL.append('line').attr('x1', 0).attr('x2', lw).attr('y1', y(0)).attr('y2', y(0)).attr('stroke', '#e7ebf1');
    [0, .25, .5, .75, 1].forEach(t => gL.append('line').attr('x1', 0).attr('x2', lw).attr('y1', y(ext[0] + t * (ext[1] - ext[0]))).attr('y2', y(ext[0] + t * (ext[1] - ext[0]))).attr('stroke', '#eef2f7'));
    gL.append('path').attr('fill', 'none').attr('stroke', accent).attr('stroke-width', 1.8)
      .attr('d', d3.line().x(d => x(d.i)).y(d => y(d.v))(pts));
    // 周期边界（每 P 天竖线）
    for (let i = 0; i < N; i += P) {
      gL.append('line').attr('x1', x(i)).attr('x2', x(i)).attr('y1', 0).attr('y2', lh).attr('stroke', '#c3cad6').attr('stroke-dasharray', '2 3').attr('opacity', .8);
    }
    gL.append('g').attr('transform', `translate(0,${lh})`).call(d3.axisBottom(x).ticks(6).tickFormat(i => isSine ? T('第 ', 'day ') + i : d3.timeFormat('%m/%d')(weather[i].dt)));
    gL.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(v => v + '°'));
    gL.append('text').attr('x', lw / 2).attr('y', lh + 40).attr('text-anchor', 'middle').attr('font-size', 12).attr('font-weight', 700).attr('fill', '#14171c').text(T('普通直线时间轴', 'Linear timeline'));

    // 判读提示
    const aligned = (dataset === 'sine' && P === 365) || (dataset === 'weather' && P === 365);
    const msg = aligned
      ? T('✓ 每圈=真实周期：同季节落在同一角度，沿半径排成放射臂',
          '✓ 1 rev = true period: same seasons share an angle, forming radial arms')
      : T('⚠ 每圈周期与数据周期不对齐：同相位点在各圈漂移，看不到放射臂',
          '⚠ Period mismatch: same-phase points drift; no radial arms');
    s2.append('text').attr('x', lx).attr('y', H - 12).attr('font-size', 11.5).attr('fill', aligned ? '#1f7a4d' : '#92400e').text(msg);
    ui.setConcl(T('螺旋的本质是<strong>把同相位的周期折叠到同一角度</strong>：设每圈=数据周期，重复的季节就沿半径堆叠成放射臂，周期一眼可见；周期不对齐则是一团乱麻。直线时间轴擅长读趋势，螺旋擅长读重复。',
      'A spiral <strong>folds same-phase cycles to the same angle</strong>: set one revolution to the period and repeated seasons stack into radial arms. A linear timeline reads trend; a spiral reads repetition.'));
  }
  draw();
};

// ============================================================
// d05-5 Storyline：拖拽车道重排 + Storyline/Alluvial 对照
// ============================================================
function loadStoryline(data) {
  return new Promise((resolve, reject) => {
    if (window.STORYLINE_DATA) return resolve(window.STORYLINE_DATA);
    const sc = document.createElement('script');
    sc.src = data + 'storyline.js';
    sc.onload = () => resolve(window.STORYLINE_DATA);
    sc.onerror = reject;
    document.head.appendChild(sc);
  });
}

D['d05-5'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('《侏罗纪公园》角色故事线：上下拖动左侧角色标签重排车道，相遇聚拢、相离散开；点事件标记查看说明；切到 Alluvial 看角色随时间在各幕间的流转。线的靠近 = 关系靠近。',
           'Jurassic Park storyline: drag the character labels to reorder lanes; lines converge when characters meet and diverge when apart. Click an event for detail; switch to Alluvial for how characters flow across acts. Closer lines mean closer relationships.'),
    lang, accent
  });
  ui.showControls();
  const movie = await loadStoryline(data);
  const chars = movie.characters;
  let view = 'story', alpha = 0.5;
  const offsets = chars.map(() => 0);

  const fb = document.createElement('div');
  fb.style.cssText = 'min-height:30px;font-size:12.5px;line-height:1.5;color:#454e5e;padding:6px 10px;';
  ui.stage.append(fb);

  const W = 820, H = 460;
  const events = [];
  chars.forEach((c, ci) => (c.events || []).forEach(e => events.push({ ...e, ci })));

  segmented(ui.controls, [
    { label: 'Storyline', value: 'story' },
    { label: 'Alluvial', value: 'alluvial' }
  ], v => { view = v; draw(); }, 0);
  slider(ui.controls, T('张力', 'Tension'), { min: 0, max: 100, step: 5, value: 50, fmt: v => (v / 100).toFixed(2) }, v => { alpha = v / 100; draw(); });

  function draw() {
    [...ui.stage.querySelectorAll('svg')].forEach(n => n.remove());
    const s = svg(d3, ui.stage, W, H);
    if (view === 'story') drawStory(s);
    else drawAlluvial(s);
  }

  function drawStory(s) {
    const ml = 120, mr = 90, mt = 16, mb = 34;
    const iw = W - ml - mr, ch = H - mt - mb;
    const x = d3.scaleLinear().domain([0, movie.duration_min]).range([0, iw]);
    const y = d3.scaleLinear().domain([0, 400]).range([ch, 0]);
    // 标签车道：按（当前 offset 后的）平均 y 排序做最小间距防重叠，仅影响标签位置
    const meanPx = chars.map((c, ci) => y(d3.mean(c.points, p => p.y) + offsets[ci]));
    const order = d3.range(chars.length).sort((a, b) => meanPx[a] - meanPx[b]);
    const labelY = Array(chars.length);
    let prev = 14;
    order.forEach(ci => {
      const yy = Math.max(meanPx[ci], prev);
      labelY[ci] = Math.min(yy, ch - 14);
      prev = labelY[ci] + 28;
    });
    const g = s.append('g').attr('transform', `translate(${ml},${mt})`);
    // 网格 + 时间轴
    for (let t = 0; t <= 120; t += 20) {
      g.append('line').attr('x1', x(t)).attr('x2', x(t)).attr('y1', 0).attr('y2', ch).attr('stroke', '#eceff3');
      g.append('text').attr('x', x(t)).attr('y', ch + 18).attr('font-size', 9).attr('text-anchor', 'middle').attr('fill', '#94a0b3').text(t + T('分', 'm'));
    }
    const yOf = p => y(p.y + offsets[chars.findIndex(c => c.points.includes(p))]);
    // 事件竖线 + 点击点
    events.forEach(e => {
      const gg = g.append('g').style('cursor', 'pointer');
      gg.append('line').attr('x1', x(e.time)).attr('x2', x(e.time)).attr('y1', 0).attr('y2', ch).attr('stroke', '#f59e0b').attr('stroke-width', 1.2).attr('stroke-dasharray', '4 4').attr('opacity', .55);
      gg.append('circle').attr('cx', x(e.time)).attr('cy', 12).attr('r', 5).attr('fill', '#f59e0b');
      gg.append('rect').attr('x', x(e.time) - 8).attr('y', 0).attr('width', 16).attr('height', ch).attr('fill', 'transparent');
      gg.on('click', () => { fb.innerHTML = T(`<b style="color:#b5601a">${e.time} 分 · ${e.name}</b>：${e.desc}`, `<b style="color:#b5601a">${e.time}m · ${e.name}</b>: ${e.desc}`); });
    });
    // 角色线
    const line = d3.line().x(p => x(p.time)).y(p => y(p.y + offsets[p.ci])).curve(d3.curveCatmullRom.alpha(alpha));
    chars.forEach((c, ci) => {
      const pts = c.points.map(p => ({ ...p, ci }));
      g.append('path').attr('fill', 'none').attr('stroke', c.color).attr('stroke-width', c.width + 1).attr('stroke-linecap', 'round').attr('opacity', .9)
        .attr('d', line(pts));
      // 右侧名字
      const last = pts[pts.length - 1];
      g.append('text').attr('x', x(last.time) + 8).attr('y', y(last.y + offsets[ci]) + 3).attr('font-size', 11).attr('font-weight', 700).attr('fill', c.color).text(c.name);
    });
    // 左：可拖拽车道标签（位置做过防重叠，引线连到线条起点）
    const handles = g.selectAll('g.handle').data(chars).join('g').attr('class', 'handle').style('cursor', 'ns-resize');
    handles.each(function(c, ci) {
      const first = c.points[0];
      const firstY = y(first.y + offsets[ci]);
      const hy = labelY[ci];
      g.append('line').attr('x1', -8).attr('x2', x(first.time) - 4).attr('y1', hy).attr('y2', firstY)
        .attr('stroke', c.color).attr('stroke-width', 1).attr('opacity', .35).attr('stroke-dasharray', '2 3');
      const gg = d3.select(this).attr('transform', `translate(-10,${hy})`);
      gg.append('rect').attr('x', -ml + 12).attr('y', -13).attr('width', ml - 16).attr('height', 26).attr('rx', 7).attr('fill', c.color + '18').attr('stroke', c.color);
      gg.append('text').attr('x', -ml + 22).attr('y', 4).attr('font-size', 11).attr('font-weight', 700).attr('fill', c.color).text(T('⠿ ', '⠿ ') + c.name);
      gg.call(d3.drag().on('drag', (ev) => {
        const ty = +d3.select(this).attr('transform').match(/translate\([-\d.]+,([-\d.]+)\)/)[1];
        const ny = Math.max(14, Math.min(ch - 14, ty + ev.dy));
        const meanRaw = d3.mean(c.points, p => p.y);
        offsets[ci] = Math.max(-300, Math.min(300, y.invert(ny) - meanRaw));
        draw();
      }));
    });
    fb.innerHTML = T('提示：上下拖动左侧彩色标签可重排车道；点橙色事件点看剧情。线条在 T-REX 攻击（78 分）等处聚拢，表示角色同框。',
                     'Drag the colored labels to reorder lanes; click orange event dots. Lines converge at the T-REX attack (78m) where characters share a scene.');
  }

  function drawAlluvial(s) {
    const ml = 120, mr = 40, mt = 40, mb = 40;
    const iw = W - ml - mr, ch = H - mt - mb;
    const acts = [
      { a: 0, b: 40, zh: '第一幕·抵达', en: 'Act 1·Arrival' },
      { a: 40, b: 85, zh: '第二幕·T-REX', en: 'Act 2·T-REX' },
      { a: 85, b: 110, zh: '第三幕·追逐', en: 'Act 3·Chase' },
      { a: 110, b: 128, zh: '第四幕·结局', en: 'Act 4·Finale' }
    ];
    const sx = acts.map((_, i) => i * iw / (acts.length - 1));
    const active = chars.map((c, ci) => acts.map(ac => c.points.some(p => p.time >= ac.a && p.time < ac.b)));
    const laneH = ch / chars.length;
    const laneY = ci => laneH * ci + laneH / 2;
    const g = s.append('g').attr('transform', `translate(${ml},${mt})`);
    acts.forEach((ac, i) => g.append('text').attr('x', sx[i]).attr('y', -18).attr('text-anchor', 'middle').attr('font-size', 12).attr('font-weight', 700).attr('fill', '#14171c').text(T(ac.zh, ac.en)));
    // 左侧角色名
    chars.forEach((c, ci) => g.append('text').attr('x', -10).attr('y', laneY(ci) + 4).attr('text-anchor', 'end').attr('font-size', 11).attr('font-weight', 700).attr('fill', c.color).text(c.name));
    // 连接带（同角色跨幕）
    chars.forEach((c, ci) => {
      for (let i = 0; i < acts.length - 1; i++) {
        if (active[ci][i] && active[ci][i + 1]) {
          const yy = laneY(ci), hh = 16;
          g.append('path')
            .attr('d', `M${sx[i]},${yy - hh / 2} C${sx[i] + 40},${yy - hh / 2} ${sx[i + 1] - 40},${yy - hh / 2} ${sx[i + 1]},${yy - hh / 2} L${sx[i + 1]},${yy + hh / 2} C${sx[i + 1] - 40},${yy + hh / 2} ${sx[i] + 40},${yy + hh / 2} ${sx[i]},${yy + hh / 2} Z`)
            .attr('fill', c.color).attr('opacity', .28);
        }
      }
    });
    // 节点块
    acts.forEach((ac, i) => {
      chars.forEach((c, ci) => {
        if (!active[ci][i]) return;
        const hh = 20;
        g.append('rect').attr('x', sx[i] - 6).attr('y', laneY(ci) - hh / 2).attr('width', 12).attr('height', hh).attr('rx', 4).attr('fill', c.color);
      });
    });
    fb.innerHTML = T('Alluvial 用固定的角色车道与跨幕连接带，表达"角色在哪些幕在场"；它与 Storyline 的区别是：Storyline 用线的<strong>连续靠近</strong>表达关系，Alluvial 用<strong>离散阶段之间的流转</strong>表达成员构成。',
                     'Alluvial keeps fixed lanes and cross-act ribbons to show who is present when; Storyline expresses relationship by continuous proximity, while Alluvial shows membership flowing between discrete stages.');
  }
  draw();
  ui.setConcl(T('Storyline 三要素：<strong>时间映射到 x、样条曲线、事件层</strong>，用 y 距离编码关系亲疏（靠近=同框/相遇）。重排车道能减少交叉、突出主线；Alluvial/桑基则适合离散阶段间的角色流转。',
    'Storyline maps time to x, uses splines and an event layer, encoding relationship by y-distance (closer=together). Reorder lanes to cut crossings and emphasize the main thread; Alluvial/Sankey suits flow across discrete stages.'));
};

export default D;
