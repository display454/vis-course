// ============================================================
// d01.js — 第 1 章《数据》交互演示（5 个，全部重新设计）
//   d01-1 数据流水线动画（解析→转型→重命名）
//   d01-2 DIKW 数据精炼（80 点 → 信息 → 知识 → 决策）
//   d01-3 视觉通道拖拽编码工作台 + 可读性评分
//   d01-4 数据变换算子流水线（图形化，不打印 JSON）
//   d01-5 数据 ↔ DOM 绑定配对连线（key 身份）
// 每个函数签名：(mount, { d3, data, lang, accent }) => {}
// ============================================================
import { shell, svg, makeCtx, button, segmented, slider, toggle, tooltip, player, scoreGauge, C } from './_ui.js';

const D = {};

// ============================================================
// d01-1 数据流水线动画
// ============================================================
D['d01-1'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en } = cx;
  const ui = shell(mount, {
    hint: T('点「单步」或「播放」，看一行 CSV 如何依次经过 解析 → 类型转换 → 字段重命名；可打开「注入脏数据」观察 NaN 与空白被发现。',
           'Step/play to follow a CSV row through parse → type cast → key rename. Toggle “dirty row” to see NaN and trailing spaces caught.'),
    lang, accent
  });
  ui.showControls();

  const text = await d3.text(data + 'newstudent.csv');
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0];
  const real = lines.slice(1, 6).map(l => l.trim());

  let includeDirty = false;
  const dirtyLine = '81,测试生,男,2007/1/1,abc,数据科学2班 ';

  const parse = (line) => d3.csvParse(header + '\n' + line)[0];
  const transform = (d) => ({
    id: +d['序号'], name: d['姓名'].trim(), gender: d['性别'].trim(),
    birthday: new Date(d['生日']), age: +d['年龄'], cls: d['班级'].trim()
  });

  const STAGES = [
    { zh: 'CSV 原文', en: 'Raw CSV' },
    { zh: '① 解析 parse', en: '① parse' },
    { zh: '② 行回调 cast', en: '② row() cast' },
    { zh: '③ 英文键 rename', en: '③ rename' }
  ];

  const buildRows = () => {
    const raw = includeDirty ? [...real, dirtyLine] : real;
    return raw.map((l) => {
      const p = parse(l);
      const tr = transform(p);
      const badAge = Number.isNaN(tr.age);
      const trailing = /\s$/.test(p['班级']);
      return { line: l, p, tr, badAge, trailing };
    });
  };

  // 卡片在不同阶段的形态
  const card = (kind, r) => {
    const p = r.p;
    const tr = r.tr;
    if (kind === 0) {
      return `<div class="pcard raw"><div class="pline">${r.line.replace(/\s$/, '␠')}</div></div>`;
    }
    if (kind === 1) {
      const vals = ['序号','姓名','性别','生日','年龄','班级'].map(k => `<span class="tok str">${p[k] === '' ? '∅' : p[k]}</span>`).join('');
      return `<div class="pcard"><div class="clabel">${T('全部是字符串','all strings')}</div><div class="tokgrid">${vals}</div></div>`;
    }
    if (kind === 2) {
      const cell = (v, type, cls) => `<span class="tok ${type} ${cls || ''}">${v}</span>`;
      const bday = d3.timeFormat('%Y-%m-%d')(tr.birthday);
      return `<div class="pcard"><div class="clabel">${T('类型已转换','types cast')}</div>
        <div class="tokgrid">
          ${cell(tr.id, 'num')}${cell(tr.name, 'str')}${cell(tr.gender, 'str')}
          ${cell(bday, 'date')}${cell(r.badAge ? 'NaN' : tr.age, r.badAge ? 'bad' : 'num')}
          ${cell(p['班级'], r.trailing ? 'warn' : 'ok', r.trailing ? 'strike' : '')}
        </div></div>`;
    }
    return `<div class="pcard obj"><div class="clabel">object</div><div class="objline">
      <span class="okey">id</span><span class="num">${tr.id}</span>
      <span class="okey">name</span><span class="str">"${tr.name}"</span>
      <span class="okey">age</span><span class="${r.badAge?'bad':'num'}">${r.badAge ? 'NaN' : tr.age}</span>
      <span class="okey">class</span><span class="str">"${tr.cls}"</span></div></div>`;
  };

  // 骨架：4 列机器
  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px;overflow-x:auto;';
  const cols = [];
  STAGES.forEach((s, i) => {
    const col = document.createElement('div');
    col.className = 'vx-machine';
    col.style.minWidth = '150px';
    col.innerHTML = `<div class="step">${i === 0 ? 'INPUT' : 'STAGE ' + i}</div>
      <div class="mname">${en ? s.en : s.zh}</div>
      <div class="mdesc">${[
        T('逗号分隔的文本行','comma-separated text'),
        T('d3.csvParse 拆成键值对（仍是字符串）','split to key/value, still strings'),
        T('row 回调：一元 +、new Date、trim()','+ cast, new Date, trim()'),
        T('中文列名 → 英文变量','Chinese columns → English keys')
      ][i]}</div>
      <div class="mstack" style="margin-top:8px;display:flex;flex-direction:column;gap:6px;min-height:120px"></div>`;
    grid.append(col);
    cols.push(col);
  });
  ui.stage.append(grid);

  // 箭头提示
  const rowState = (f, i) => {
    if (f <= i) return -1;
    return Math.max(0, Math.min(3, f - i));
  };

  const render = (f) => {
    const rows = buildRows();
    cols.forEach((col, k) => {
      col.classList.toggle('active', f >= k);
      const stack = col.querySelector('.mstack');
      stack.innerHTML = '';
      rows.forEach((r, i) => {
        const st = rowState(f, i);
        if (st === k) stack.insertAdjacentHTML('beforeend', card(k, r));
      });
    });
  };

  const pl = player(ui.controls, {
    en, interval: 650, total: real.length + 1 + 3 + 1,
    render,
    frameLabel: (n) => T(`第 ${n} 步`, `step ${n}`)
  });

  // 脏数据开关：6 行也能在 10 步内全部流完
  toggle(ui.controls, T('注入脏数据','Dirty row'), false, (v) => {
    includeDirty = v;
    pl.stop();
    pl.draw(0);
  });

  ui.setConcl(T(
    `<b>结论：</b> <code>d3.csv(url, row)</code> 的 <code>row</code> 回调在<b>每一行解析后立即</b>执行：一元 <code>+</code> 把字符串转成数字、<code>new Date()</code> 转日期、<code>trim()</code> 去掉尾部空白。不转换类型，字符串无法做算术；<code>NaN</code> 会在这一步暴露问题。`,
    `<b>Takeaway:</b> the <code>row</code> callback of <code>d3.csv(url, row)</code> runs per row: <code>+</code> casts numbers, <code>new Date()</code> dates, <code>trim()</code> removes spaces. Without casting, strings can’t be used in arithmetic; <code>NaN</code> surfaces bad data here.`));
};

// ============================================================
// d01-2 DIKW 数据精炼
// ============================================================
D['d01-2'] = async (mount, { d3, data, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const rows = await d3.csv(data + 'newstudent.csv', d3.autoType);

  const ui = shell(mount, {
    hint: T('点「播放」，看 80 条原始记录如何逐级被精炼：散点 → 按性别聚合成信息 → 按年龄聚成分布（知识）→ 凝练为一个决策（智慧）。也可点击右侧层级直接跳转。',
           'Play to watch 80 raw records get refined: scattered → grouped by gender (information) → age distribution (knowledge) → one decision (wisdom). Or click a layer on the right.'),
    lang, accent
  });
  ui.showControls();

  const W = 720, H = 430;
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:grid;grid-template-columns:1fr 200px;gap:14px;';
  const left = document.createElement('div');
  const right = document.createElement('div');
  wrap.append(left, right);
  ui.stage.append(wrap);

  const s = svg(d3, left, W, H);
  const labels = [
    { key: 'data', zh: '数据 Data', en: 'Data', color: '#6f7c91',
      capZh: '80 条离散记录，缺乏上下文', capEn: '80 discrete records, no context' },
    { key: 'info', zh: '信息 Information', en: 'Information', color: '#1f7a4d',
      capZh: '按性别分组、计数，得到“谁、多少”', capEn: 'grouped & counted → who / how many' },
    { key: 'know', zh: '知识 Knowledge', en: 'Knowledge', color: '#0e7fa8',
      capZh: '年龄分布揭示模式：18 岁是主体', capEn: 'age distribution reveals a pattern' },
    { key: 'wisdom', zh: '智慧 Wisdom', en: 'Wisdom', color: '#9333ea',
      capZh: '据模式做决策：分层选课与学业引导', capEn: 'act on it: tiered advising' }
  ];

  // 预先计算目标布局
  const genders = ['男', '女'];
  const ages = d3.range(16, 24);
  const cntGender = d3.rollup(rows, v => v.length, d => d['性别']);
  const cntAge = d3.rollup(rows, v => v.length, d => d['年龄']);
  const modeAge = d3.greatest(ages, a => cntAge.get(a) || 0);
  const modeN = cntAge.get(modeAge);

  // 稳定的随机散布
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const pts = rows.map((r, i) => ({
    i,
    gender: r['性别'], age: r['年龄'],
    x0: 40 + rnd() * (W - 200), y0: 40 + rnd() * (H - 120)
  }));

  // 各阶段目标坐标
  const cX = { '男': 200, '女': 440 };
  const xAge = d3.scaleLinear().domain([16, 23]).range([60, W - 60]);
  const yAge = d3.scaleLinear().domain([0, Math.max(...cntAge.values())]).range([H - 60, 120]);
  pts.forEach(p => {
    const gc = cntGender.get(p.gender) || 1;
    const gi = rows.filter(r => r['性别'] === p.gender).findIndex(r => r['序号'] === rows[p.i]['序号']);
    const same = rows.filter((r, idx) => r['性别'] === p.gender);
    const order = same.findIndex(r => r['序号'] === rows[p.i]['序号']);
    p.x1 = cX[p.gender] + (order % 8) * 26 - 90;
    p.y1 = 120 + Math.floor(order / 8) * 26 + (rnd() - 0.5) * 8;
    p.x2 = xAge(p.age);
    const stack = d3.range(0, (cntAge.get(p.age) || 0)).findIndex((k) => {
      return rows.filter(r => r['年龄'] === p.age).map(r => r['序号']).indexOf(rows[p.i]['序号']) === k;
    });
    p.y2 = yAge(stack);
  });

  // 层级按钮（右栏）
  const layerBtns = labels.map((l, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'vx-btn';
    b.style.cssText = 'width:100%;justify-content:flex-start;margin-bottom:8px;border-left-width:3px';
    b.style.borderLeftColor = l.color;
    b.innerHTML = (en ? l.en : l.zh);
    b.addEventListener('click', () => { pl.stop(); pl.draw(i); });
    right.append(b);
    return b;
  });
  const cap = document.createElement('div');
  cap.className = 'vx-panel';
  cap.style.marginTop = '8px';
  right.append(cap);

  const gPts = s.append('g');
  const gOverlay = s.append('g');

  const bar = (g) => g.append('rect').attr('rx', 4);
  const ptR = 4.5;
  const circles = gPts.selectAll('circle').data(pts).join('circle')
    .attr('r', ptR).attr('fill', '#94a0b3').attr('opacity', 0.75);

  const draw = (f) => {
    labels.forEach((l, i) => layerBtns[i].classList.toggle('active', i === f));
    cap.innerHTML = `<div style="color:${labels[f].color};font-weight:700;font-size:13px;margin-bottom:4px">${en ? labels[f].en : labels[f].zh}</div>
      <div style="font-size:12px;color:var(--ink-600);line-height:1.55">${en ? labels[f].capEn : labels[f].capZh}</div>`;

    const tr = d3.transition().duration(dur);
    let targetX, targetY, targetFill, targetR, targetOp;
    if (f === 0) {
      targetX = d => d.x0; targetY = d => d.y0; targetFill = '#94a0b3'; targetR = ptR; targetOp = 0.75;
    } else if (f === 1) {
      targetX = d => d.x1; targetY = d => d.y1;
      targetFill = d => d.gender === '男' ? '#4a46c9' : '#b43b7e'; targetR = ptR; targetOp = 0.8;
    } else if (f === 2) {
      targetX = d => d.x2; targetY = d => d.y2; targetFill = '#0e7fa8'; targetR = ptR; targetOp = 0.85;
    } else {
      targetX = d => W / 2 - 60; targetY = d => H / 2;
      targetFill = '#9333ea'; targetR = 1.5; targetOp = 0.12;
    }
    circles.transition(tr).attr('cx', targetX).attr('cy', targetY)
      .attr('fill', targetFill).attr('r', targetR).attr('opacity', targetOp);

    gOverlay.selectAll('*').remove();

    if (f === 1) {
      genders.forEach((gname, gi) => {
        const n = cntGender.get(gname) || 0;
        const col = gname === '男' ? '#4a46c9' : '#b43b7e';
        const g = gOverlay.append('g').attr('class', 'info');
        g.append('text').attr('x', cX[gname] - 90).attr('y', 230).attr('text-anchor', 'middle')
          .attr('font-size', 14).attr('font-weight', 700).attr('fill', col).text(`${gname} ${n}`);
      });
    }
    if (f === 2) {
      const ax = gOverlay.append('g').attr('class', 'know');
      ax.append('line').attr('x1', 50).attr('x2', W - 50).attr('y1', H - 60).attr('y2', H - 60).attr('stroke', '#c3cad6');
      ages.forEach(a => {
        ax.append('text').attr('x', xAge(a)).attr('y', H - 38).attr('text-anchor', 'middle')
          .attr('font-size', 11).attr('fill', '#6f7c91').text(a);
      });
      ax.append('text').attr('x', W/2).attr('y', H-14).attr('text-anchor','middle').attr('font-size',12).attr('fill','#454e5e')
        .text(T('年龄 →','age →'));
      gOverlay.append('text').attr('class','know').attr('x', 80).attr('y', 30).attr('font-size', 13).attr('font-weight', 700).attr('fill', '#0e7fa8')
        .text(T(`众数：${modeAge} 岁，${modeN} 人`, `Mode: age ${modeAge}, ${modeN} students`));
    }
    if (f === 3) {
      const g = gOverlay.append('g').attr('class', 'dec');
      g.append('rect').attr('x', W/2 - 200).attr('y', H/2 - 70).attr('width', 400).attr('height', 140).attr('rx', 12)
        .attr('fill', '#f5f3ff').attr('stroke', '#c4b5fd').attr('stroke-width', 1.5);
      g.append('text').attr('x', W/2).attr('y', H/2 - 28).attr('text-anchor', 'middle').attr('font-size', 16).attr('font-weight', 800).attr('fill', '#6d28d9')
        .text(T('决策：按年龄分层选课与学业引导', 'Decision: tiered advising by age'));
      g.append('text').attr('x', W/2).attr('y', H/2 + 4).attr('text-anchor', 'middle').attr('font-size', 12.5).attr('fill', '#6d28d9')
        .text(T(`多数新生集中在 ${modeAge} 岁，少数偏高/偏低`, `Most students cluster at ${modeAge}; few outliers`));
      g.append('text').attr('x', W/2).attr('y', H/2 + 32).attr('text-anchor', 'middle').attr('font-size', 12).attr('fill', '#6b55c7')
        .text(T('→ 为大龄/低龄学生设置差异化指导', '→ tailored guidance for outliers'));
    }
  };

  const pl = player(ui.controls, { en, interval: 1100, total: 4, render: draw,
    frameLabel: (n) => `${n + 1}/4` });

  ui.setConcl(T(
    `<b>结论：</b>可视化主要把 <b>Data</b> 提升到 <b>Information</b>（分组、聚合、定位），部分能到 <b>Knowledge</b>（揭示分布与规律）；<b>Wisdom</b> 是基于规律做出的判断与行动。越往上，元素越少、抽象度越高。`,
    `<b>Takeaway:</b> visualization mostly lifts <b>Data</b> into <b>Information</b> (grouping/aggregation), sometimes into <b>Knowledge</b> (patterns); <b>Wisdom</b> is acting on them. Higher levels have fewer marks and more abstraction.`));
};

// ============================================================
// d01-3 视觉通道拖拽编码工作台
// ============================================================
D['d01-3'] = (mount, { d3, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('把左下方字段拖到通道槽（x / y / 颜色 / 大小 / 形状），右侧图形实时重绘，右上角给出“可读性评分”。试试把「年龄」拖到颜色，再拖到 x 位置——感受通道有效性。',
           'Drag fields onto channels (x, y, color, size, shape); the chart redraws and scores readability. Try mapping age to color vs to position.'),
    lang, accent
  });
  ui.showControls();

  const DATA = [
    { name: '张三', major: '软件工程', cls: 1, age: 18, gender: '男' },
    { name: '李四', major: '软件工程', cls: 1, age: 19, gender: '男' },
    { name: '王五', major: '软件工程', cls: 2, age: 20, gender: '男' },
    { name: '赵六', major: '软件工程', cls: 2, age: 17, gender: '女' },
    { name: '孙七', major: '数据科学', cls: 1, age: 21, gender: '男' },
    { name: '周八', major: '数据科学', cls: 1, age: 22, gender: '女' },
    { name: '吴九', major: '数据科学', cls: 2, age: 19, gender: '女' },
    { name: '郑十', major: '数据科学', cls: 2, age: 18, gender: '男' }
  ];
  const FIELDS = [
    { key: 'gender', labelZh: '性别', labelEn: 'gender', type: 'nominal' },
    { key: 'major', labelZh: '专业', labelEn: 'major', type: 'nominal' },
    { key: 'cls', labelZh: '班级', labelEn: 'class', type: 'ordinal' },
    { key: 'age', labelZh: '年龄', labelEn: 'age', type: 'quantitative' }
  ];
  const CHANNELS = [
    { key: 'x', labelZh: 'x 位置', labelEn: 'x position', kind: 'position' },
    { key: 'y', labelZh: 'y 位置', labelEn: 'y position', kind: 'position' },
    { key: 'color', labelZh: '颜色', labelEn: 'color', kind: 'color' },
    { key: 'size', labelZh: '大小', labelEn: 'size', kind: 'area' },
    { key: 'shape', labelZh: '形状', labelEn: 'shape', kind: 'shape' }
  ];
  // Stevens / Mackinlay 有效性（百分制，越大越合适）
  const EFFECT = {
    quantitative: { position: 92, color: 18, area: 58, shape: 8 },
    ordinal:      { position: 80, color: 55, area: 50, shape: 18 },
    nominal:      { position: 55, color: 90, area: 20, shape: 85 }
  };
  const TYPE_NAME = {
    quantitative: { zh: '数值', en: 'quant' },
    ordinal: { zh: '序数', en: 'ordinal' },
    nominal: { zh: '类别', en: 'nominal' }
  };

  // 布局：上：字段+槽；下：图 + 评分
  const top = document.createElement('div');
  top.style.cssText = 'display:grid;grid-template-columns:1fr 1.4fr;gap:14px;';
  const fieldCol = document.createElement('div');
  const slotCol = document.createElement('div');
  fieldCol.innerHTML = `<div class="vx-title">${T('字段（变量）','Fields')}</div>`;
  slotCol.innerHTML = `<div class="vx-title">${T('视觉通道（拖到这里）','Visual channels')}</div>`;
  top.append(fieldCol, slotCol);

  const fieldBox = document.createElement('div');
  fieldBox.className = 'vx-fields';
  fieldBox.style.marginTop = '6px';
  const fieldEls = {};
  FIELDS.forEach(f => {
    const el = document.createElement('div');
    el.className = 'vx-field';
    el.draggable = true;
    el.dataset.field = f.key;
    el.innerHTML = `${en ? f.labelEn : f.labelZh} <span class="ftype">${T(TYPE_NAME[f.type].zh, TYPE_NAME[f.type].en)}</span>`;
    el.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/field', f.key));
    fieldBox.append(el);
    fieldEls[f.key] = el;
  });
  fieldCol.append(fieldBox);

  const slotBox = document.createElement('div');
  slotBox.className = 'vx-slots';
  slotBox.style.gridTemplateColumns = 'repeat(5,1fr)';
  slotBox.style.marginTop = '6px';
  const bind = { x: null, y: null, color: null, size: null, shape: null };
  const slotEls = {};
  CHANNELS.forEach(c => {
    const z = document.createElement('div');
    z.className = 'vx-slot';
    z.dataset.channel = c.key;
    z.innerHTML = `<div class="sname">${en ? c.labelEn : c.labelZh}</div>`;
    z.addEventListener('dragover', (e) => { e.preventDefault(); z.classList.add('over'); });
    z.addEventListener('dragleave', () => z.classList.remove('over'));
    z.addEventListener('drop', (e) => {
      e.preventDefault(); z.classList.remove('over');
      setBind(c.key, e.dataTransfer.getData('text/field'));
    });
    slotBox.append(z);
    slotEls[c.key] = z;
  });
  slotCol.append(slotBox);
  ui.stage.append(top);

  const bottom = document.createElement('div');
  bottom.style.cssText = 'display:grid;grid-template-columns:1fr 150px;gap:14px;margin-top:14px;';
  const chartHost = document.createElement('div');
  const scoreHost = document.createElement('div');
  bottom.append(chartHost, scoreHost);
  ui.stage.append(bottom);

  const W = 520, H = 330, M = { t: 24, r: 20, b: 40, l: 46 };
  const s = svg(d3, chartHost, W, H);
  const gauge = scoreGauge(d3, scoreHost, { en, size: 104,
    labelZh: '可读性评分', labelEn: 'Readability' });
  const scoreText = document.createElement('div');
  scoreText.style.cssText = 'font-size:11.5px;line-height:1.5;color:var(--ink-600);margin-top:6px';
  scoreHost.append(scoreText);

  const SYMBOL = d3.symbol().size(80);
  const SHAPES = [d3.symbolCircle, d3.symbolSquare, d3.symbolTriangle, d3.symbolDiamond];
  const NOM_COLORS = ['#4a46c9', '#b43b7e', '#176c6b', '#b5601a'];
  const ORD_COLORS = ['#e0e7ff', '#818cf8', '#4338ca', '#312e81'];

  function setBind(channel, field) {
    Object.keys(bind).forEach(k => { if (bind[k] === field) bind[k] = null; });
    bind[channel] = field;
    render();
  }
  function clearAll() { Object.keys(bind).forEach(k => bind[k] = null); render(); }

  const resetBtn = button(T('清空','Clear'), '');
  resetBtn.addEventListener('click', clearAll);
  ui.controls.append(resetBtn);

  const symbolFor = (d, field) => {
    if (!field) return SHAPES[0];
    const vals = [...new Set(DATA.map(x => x[field]))];
    return SHAPES[vals.indexOf(d[field]) % SHAPES.length];
  };

  function render() {
    // 字段使用状态
    FIELDS.forEach(f => fieldEls[f.key].classList.toggle('used', Object.values(bind).includes(f.key)));
    // 槽
    CHANNELS.forEach(c => {
      const z = slotEls[c.key];
      const f = bind[c.key];
      const fmeta = FIELDS.find(x => x.key === f);
      const body = z.querySelector('.sname');
      z.querySelectorAll('.sfield').forEach(n => n.remove());
      if (fmeta) {
        const chip = document.createElement('span');
        chip.className = 'sfield';
        chip.style.background = accent || '#4a46c9';
        chip.innerHTML = `${en ? fmeta.labelEn : fmeta.labelZh}<button type="button" data-clear="${c.key}">×</button>`;
        chip.querySelector('button').addEventListener('click', () => { bind[c.key] = null; render(); });
        z.append(chip);
      }
    });

    s.selectAll('*').remove();
    // 尺度
    const xField = bind.x, yField = bind.y;
    const gx = s.append('g').attr('transform', `translate(${M.l},${M.t})`);
    const iw = W - M.l - M.r, ih = H - M.t - M.b;

    const posScale = (f, range, isY) => {
      if (!f) return d3.scalePoint().domain([0]).range(isY ? [ih, 0] : [0, iw]);
      const meta = FIELDS.find(x => x.key === f);
      const vals = [...new Set(DATA.map(d => d[f]))];
      if (meta.type === 'quantitative') {
        const ex = d3.extent(DATA, d => d[f]);
        const pad = 0.6;
        return d3.scaleLinear().domain([ex[0]-pad, ex[1]+pad]).range(isY ? [ih, 0] : [0, iw]);
      }
      return d3.scalePoint().domain(vals).range(isY ? [ih*0.15, ih*0.85] : [iw*0.1, iw*0.9]).padding(0.4);
    };
    const sx = posScale(xField, [0, iw], false);
    const sy = posScale(yField, [ih, 0], true);

    // 网格 + 轴
    gx.append('rect').attr('width', iw).attr('height', ih).attr('fill', '#f5f7fa').attr('stroke', '#e7ebf1');
    if (xField) {
      const meta = FIELDS.find(x => x.key === xField);
      gx.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(sx).ticks(meta.type==='quantitative'?6:null));
      gx.append('text').attr('x', iw/2).attr('y', ih + 34).attr('text-anchor','middle').attr('font-size',12).attr('fill','#454e5e')
        .text(en ? meta.labelEn : meta.labelZh);
    }
    if (yField) {
      const meta = FIELDS.find(x => x.key === yField);
      gx.append('g').call(d3.axisLeft(sy).ticks(meta.type==='quantitative'?6:null));
      gx.append('text').attr('transform', `translate(-34,${ih/2}) rotate(-90)`).attr('text-anchor','middle').attr('font-size',12).attr('fill','#454e5e')
        .text(en ? meta.labelEn : meta.labelZh);
    }

    // 颜色
    const colorFor = (d) => {
      const f = bind.color;
      if (!f) return '#6f7c91';
      const meta = FIELDS.find(x => x.key === f);
      const vals = [...new Set(DATA.map(x => x[f]))];
      if (meta.type === 'quantitative') return d3.scaleSequential(d3.interpolateRainbow).domain(d3.extent(DATA, x => x[f]))(d[f]);
      if (meta.type === 'ordinal') return d3.scaleOrdinal(ORD_COLORS).domain(vals)(d[f]);
      return d3.scaleOrdinal(NOM_COLORS).domain(vals)(d[f]);
    };
    // 大小
    const sizeFor = (d) => {
      const f = bind.size;
      if (!f) return 7;
      const meta = FIELDS.find(x => x.key === f);
      if (meta.type === 'quantitative') {
        const ex = d3.extent(DATA, x => x[f]);
        return d3.scaleLinear().domain(ex).range([5, 13])(d[f]);
      }
      const vals = [...new Set(DATA.map(x => x[f]))];
      return d3.scalePoint().domain(vals).range([5, 11])(d[f]);
    };

    const hasBind = Object.values(bind).some(Boolean);
    gx.selectAll('path.mark').data(hasBind ? DATA : []).join('path')
      .attr('class', 'mark')
      .attr('transform', d => `translate(${xField ? sx(d[xField]) : iw/2},${yField ? sy(d[yField]) : ih/2})`)
      .attr('d', d => d3.symbol().type(symbolFor(d, bind.shape)).size(sizeFor(d)*sizeFor(d)*16)())
      .attr('fill', colorFor).attr('opacity', 0.82).attr('stroke', '#fff').attr('stroke-width', 1);

    // 空态提示
    if (!hasBind) {
      gx.append('text').attr('x', iw/2).attr('y', ih/2).attr('text-anchor','middle').attr('font-size',13).attr('fill','#94a0b3')
        .text(T('把字段拖到通道槽试试', 'Drag fields onto channels'));
    }

    // 评分
    const notes = [];
    let total = 0, used = 0;
    CHANNELS.forEach(c => {
      const f = bind[c.key];
      if (!f) return;
      used++;
      const meta = FIELDS.find(x => x.key === f);
      const score = EFFECT[meta.type][c.kind];
      total += score;
      if (score < 35) notes.push({ bad: true,
        t: T(`「${en?meta.labelEn:meta.labelZh}」(${T(TYPE_NAME[meta.type].zh,TYPE_NAME[meta.type].en)}) → ${en?c.labelEn:c.labelZh}：几乎读不出差异`,
             `“${en?meta.labelEn:meta.labelZh}” (${T(TYPE_NAME[meta.type].zh,TYPE_NAME[meta.type].en)}) → ${en?c.labelEn:c.labelZh}: hard to read`) });
      else if (score >= 80) notes.push({ good: true,
        t: T(`「${en?meta.labelEn:meta.labelZh}」→ ${en?c.labelEn:c.labelZh}：有效`,
             `“${en?meta.labelEn:meta.labelZh}” → ${en?c.labelEn:c.labelZh}: effective`) });
    });
    // 重复使用同一字段已被自动解绑，这里奖励"位置"
    let score = 0;
    if (used > 0) {
      score = Math.round(total / used);
      if (bind.x || bind.y) score = Math.min(100, score + 4);
      if (used === 1) score = Math.round(score * 0.78); // 只用一个通道，信息不足
    }
    gauge.set(score, false);
    scoreText.innerHTML = (used === 0
      ? T('尚未绑定字段', 'No field bound yet')
      : notes.slice(0, 4).map(n => `<div style="color:${n.bad?'var(--pit-fg)':'var(--key-fg)'}">${n.bad?'✗':'✓'} ${n.t}</div>`).join(''));
  }
  render();

  ui.setConcl(T(
    `<b>结论：</b>通道有效性依数据类型而不同（Mackinlay / Stevens）：<b>数值</b>最适合用<b>位置</b>，其次长度/面积，<b>最不该用色相</b>（看不出大小、也不色盲友好）；<b>类别</b>最适合用<b>色相/形状</b>；<b>序数</b>用明度或位置。`,
    `<b>Takeaway:</b> channel effectiveness depends on type (Mackinlay/Stevens): <b>quantitative</b> is best on <b>position</b>, not hue; <b>nominal</b> suits <b>color/shape</b>; <b>ordinal</b> suits luminance or position.`));
};

// ============================================================
// d01-4 数据变换算子流水线
// ============================================================
D['d01-4'] = (mount, { d3, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('左：把算子串到一条流水线上，看数字方块如何被变换（不再打印 JSON）。右：切换到「分组/配对」，看 group / rollup / cross / zip 等如何改变数据形状。',
           'Left: chain operators and watch number boxes transform (no JSON). Right: switch to grouping/pairing to see group/rollup/cross/zip reshape data.'),
    lang, accent
  });
  ui.showControls();

  const host = document.createElement('div');
  ui.stage.append(host);

  segmented(ui.controls, [
    { label: T('单序列变换', 'Single series'), value: 'single' },
    { label: T('分组 / 配对', 'Group / pair') }
  ], (mode) => { host.innerHTML = ''; mode === 'single' ? single() : paired(); }, 0);

  // ---------- 模式 A：单序列数字方块流水线 ----------
  function single() {
    const initial = [1, 2, 3, 4, 5];
    let pipe = [{ op: 'input', out: initial }];

    const bar = document.createElement('div');
    bar.className = 'vx-chiprow';
    const ops = [
      { id: 'map2', label: 'map ×2', fn: a => a.map(x => x * 2) },
      { id: 'map1', label: 'map +1', fn: a => a.map(x => x + 1) },
      { id: 'gt', label: 'filter >2', fn: a => a.filter(x => x > 2) },
      { id: 'even', label: 'filter 偶数', fn: a => a.filter(x => x % 2 === 0) },
      { id: 'pairs', label: 'pairs', fn: a => d3.pairs(a) },
      { id: 'sum', label: 'reduce Σ', fn: a => [d3.sum(a)] }
    ];
    ops.forEach(o => {
      const b = button(o.label, '');
      b.addEventListener('click', () => {
        if (pipe[pipe.length - 1].out.length === 1 && pipe[pipe.length - 1].op !== 'pairs') return;
        const last = pipe[pipe.length - 1].out;
        const isPairs = Array.isArray(last[0]);
        if (o.id === 'pairs' && isPairs) return;
        if (o.id === 'sum' && isPairs) return;
        try { pipe.push({ op: o.label, out: o.fn(isPairs ? last.flat() : last) }); draw(); } catch (e) {}
      });
      bar.append(b);
    });
    const undo = button(T('↶ 撤销', '↶ undo'), '');
    undo.addEventListener('click', () => { if (pipe.length > 1) { pipe.pop(); draw(); } });
    const reset = button(T('重置', 'reset'), '');
    reset.addEventListener('click', () => { pipe = [{ op: 'input', out: initial }]; draw(); });
    bar.append(undo, reset);
    host.append(bar);

    const lane = document.createElement('div');
    lane.style.cssText = 'display:flex;gap:10px;overflow-x:auto;padding:10px 0;align-items:flex-start;';
    host.append(lane);

    const numBox = (n, scale) => {
      const h = 16 + scale(n) * 34;
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px">
        <div style="width:30px;height:${h}px;background:${accent};border-radius:5px;opacity:.85;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700">${n}</div>
      </div>`;
    };
    const pairBox = (p) => `<div style="display:flex;flex-direction:column;gap:3px">
        <div style="width:30px;height:26px;background:#6b55c7;border-radius:5px;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px">${p[0]}</div>
        <div style="width:30px;height:26px;background:#c4b5fd;border-radius:5px;color:#4c1d95;display:flex;align-items:center;justify-content:center;font-size:11px">${p[1]}</div>
      </div>`;

    function draw() {
      lane.innerHTML = '';
      const vmax = d3.max(pipe.flatMap(p => p.out.flat()), x => x) || 1;
      const scale = d3.scaleLinear().domain([0, vmax]).range([0, 1]);
      pipe.forEach((p, i) => {
        const stage = document.createElement('div');
        stage.style.cssText = 'flex:none;display:flex;flex-direction:column;align-items:center;gap:6px';
        const isPairs = Array.isArray(p.out[0]);
        const items = isPairs
          ? p.out.map(pr => pairBox(pr)).join('')
          : p.out.map(n => numBox(n, scale)).join('');
        stage.innerHTML = `<div class="vx-tag">${i === 0 ? (T('输入','input')) : p.op}</div>
          <div style="display:flex;gap:6px;align-items:flex-end;min-height:80px;${isPairs?'':''}">${items}</div>
          <div class="small" style="font-size:10px;color:var(--ink-400)">${p.out.length} ${isPairs ? T('对','pairs') : T('项','items')}</div>`;
        lane.append(stage);
        if (i < pipe.length - 1) {
          const a = document.createElement('div');
          a.style.cssText = 'flex:none;align-self:center;color:var(--ink-400);font-size:18px;margin-top:18px';
          a.textContent = '→';
          lane.append(a);
        }
      });
    }
    draw();
  }

  // ---------- 模式 B：分组 / 配对 / 结构 ----------
  function paired() {
    const students = [
      { c: '软件1班', n: 1 }, { c: '软件1班', n: 2 }, { c: '软件2班', n: 3 },
      { c: '软件2班', n: 4 }, { c: '数据1班', n: 5 }, { c: '数据1班', n: 6 }
    ];
    const A = ['A', 'B'], B = [1, 2, 3];
    const matrix = [[1, 2, 3], [4, 5, 6]];
    const list = ['map', 'filter', 'reduce', 'sort'];

    const bar = document.createElement('div');
    bar.className = 'vx-chiprow';
    bar.style.marginBottom = '10px';
    const out = document.createElement('div');
    host.append(bar, out);

    const ops = ['group', 'rollup', 'cross', 'zip', 'merge', 'transpose'];
    const opRow = segmented(bar, ops, (op) => draw(op), -1);

    const box = (v, col) => `<span style="display:inline-flex;min-width:30px;height:26px;align-items:center;justify-content:center;padding:0 7px;border-radius:5px;background:${col};color:#fff;font-size:11px;font-weight:600;margin:2px">${v}</span>`;

    function draw(op) {
      let html = '';
      if (op === 'group') {
        const g = d3.group(students, d => d.c);
        html = `<div class="vx-grid c3" style="margin-top:8px">
          ${[...g].map(([k, arr]) => `<div class="vx-panel"><h5>${k} · ${T('保留','keeps')} ${arr.length} 项</h5>
            ${arr.map(x => box(x.n, '#4a46c9')).join('')}</div>`).join('')}</div>`;
      } else if (op === 'rollup') {
        const g = d3.rollup(students, v => v.length, d => d.c);
        html = `<div class="vx-grid c3" style="margin-top:8px">
          ${[...g].map(([k, n]) => `<div class="vx-panel"><h5>${k} · 聚合为</h5>
            <div style="font-size:26px;font-weight:800;color:#176c6b">${n}</div><div class="small" style="font-size:10px;color:var(--ink-400)">count</div></div>`).join('')}</div>`;
      } else if (op === 'cross') {
        const pairs = d3.cross(A, B);
        html = `<div class="vx-panel"><h5>${T('两列 → 笛卡尔积（连线）','two lists → cross product')}</h5>
          <div style="display:flex;gap:10px;align-items:center;margin:8px 0">
            <div>${A.map(x => box(x, '#0e7fa8')).join('<br>')}</div>
            <span style="color:var(--ink-400)">×</span>
            <div>${B.map(x => box(x, '#b5601a')).join('<br>')}</div>
            <span style="color:var(--ink-400)">=</span>
            <div style="display:flex;flex-wrap:wrap;max-width:240px">${pairs.map(p => box('('+p[0]+','+p[1]+')', '#6b55c7')).join('')}</div>
          </div></div>`;
      } else if (op === 'zip') {
        const z = d3.zip(A, ['一', '二', '三']);
        html = `<div class="vx-panel"><h5>${T('两列按位配对','zip = pair by position')}</h5>
          <div style="display:flex;gap:8px;margin-top:8px">${z.map(p => `<div style="text-align:center">${box(p[0],'#0e7fa8')}<div style="font-size:11px">↕</div>${box(p[1],'#b43b7e')}</div>`).join('')}</div></div>`;
      } else if (op === 'merge') {
        const nested = [[1, 2], [3, 4], [5]];
        html = `<div class="vx-panel"><h5>${T('嵌套数组 → 扁平合并','nested arrays → flatten')}</h5>
          <div style="display:flex;align-items:center;gap:10px;margin-top:8px">
            <div>${nested.map(a => `<span style="display:inline-block;border:1px dashed var(--ink-300);border-radius:6px;padding:4px;margin:2px">${a.map(x=>box(x,'#6f7c91')).join('')}</span>`).join('')}</div>
            <span style="color:var(--ink-400)">→</span>
            <div>${d3.merge(nested).map(x => box(x, '#176c6b')).join('')}</div>
          </div></div>`;
      } else if (op === 'transpose') {
        const t = d3.transpose(matrix);
        const m2 = (m, col) => `<div style="display:flex">${m.map(r => `<div style="display:flex;flex-direction:column">${r.map(x => box(x, col)).join('')}</div>`).join('')}</div>`;
        html = `<div class="vx-panel"><h5>${T('矩阵转置（行↔列）','transpose (rows ↔ cols)')}</h5>
          <div style="display:flex;gap:18px;align-items:flex-start;margin-top:8px">
            <div><div class="small" style="font-size:10px;color:var(--ink-400);margin-bottom:4px">2×3</div>${m2(matrix,'#4a46c9')}</div>
            <span style="color:var(--ink-400)">→</span>
            <div><div class="small" style="font-size:10px;color:var(--ink-400);margin-bottom:4px">3×2</div>${m2(t,'#176c6b')}</div>
          </div></div>`;
      }
      out.innerHTML = html;
    }
    draw('group');
    opRow.querySelector('.vx-btn').classList.add('active');
  }

  ui.setConcl(T(
    `<b>结论：</b>这些变换都在<b>改变数据的形状</b>：<code>map</code> 逐元素、<code>filter</code> 删减、<code>reduce</code> 收敛为一个、<code>pairs/zip/cross</code> 建立配对关系、<code>group</code> 保留全部元素分桶、<code>rollup</code> 把每桶聚合成一个值。`,
    `<b>Takeaway:</b> every operator <b>reshapes data</b>: map per element, filter removes, reduce collapses, pairs/zip/cross create pairs, group keeps all elements in buckets, rollup aggregates each bucket to one value.`));
};

// ============================================================
// d01-5 数据 ↔ DOM 绑定配对（key 身份）
// ============================================================
D['d01-5'] = (mount, { d3, lang, accent }) => {
  const cx = makeCtx(lang, accent);
  const { T, en, dur } = cx;
  const ui = shell(mount, {
    hint: T('左侧是数据卡，右侧是 DOM 柱，连线表示它们的绑定。做「洗牌」后对比：使用 key（按 id 绑定）时柱子跟随卡片；不使用 key（按索引）时柱子不动、数值张冠李戴。',
           'Left = data cards, right = DOM bars, lines = bindings. Shuffle and compare: with a key, bars follow cards; without a key (index), bars stay and swap values.'),
    lang, accent
  });
  ui.showControls();

  const W = 720, H = 300;
  const LX = 50, RX = 460, ROW = 52, TOP = 40;
  const s = svg(d3, ui.stage, W, H);

  let keyed = true;
  let data = ['A', 'B', 'C', 'D'].map((k, i) => ({ k, v: 12 + i * 6 }));
  // bars：右侧 DOM 槽位序列，每个元素携带"出生标签" tag（证明元素身份）
  let bars = [];

  const gLines = s.append('g');
  const gData = s.append('g');
  const gDom = s.append('g');

  // 列标题与状态色图例
  s.append('text').attr('x', LX + 50).attr('y', 18).attr('text-anchor', 'middle').attr('font-size', 12).attr('font-weight', 700).attr('fill', '#454e5e').text(T('数据 (data)', 'data'));
  s.append('text').attr('x', RX + 70).attr('y', 18).attr('text-anchor', 'middle').attr('font-size', 12).attr('font-weight', 700).attr('fill', '#454e5e').text(T('DOM 元素（标签=出生身份）', 'DOM nodes (tag = birth identity)'));
  const lg = s.append('g').attr('transform', `translate(${LX},${H-14})`);
  [[C.enter, T('enter 进入','enter')], [C.update, T('update 更新','update')], [C.exit, T('exit 退出 / 错位','exit / mismatch')]].forEach(([c, t], i) => {
    lg.append('rect').attr('x', i*130).attr('y', -9).attr('width', 11).attr('height', 11).attr('rx', 3).attr('fill', c);
    lg.append('text').attr('x', i*130 + 15).attr('y', 0).attr('font-size', 11).attr('fill', '#6f7c91').text(t);
  });

  const vScale = d3.scaleLinear().range([26, 120]);

  function init() {
    data = ['A', 'B', 'C', 'D'].map((k, i) => ({ k, v: 12 + i * 6 }));
    bars = data.map(d => ({ tag: d.k, v: d.v }));
  }

  // 核心：按 key 或按索引，把新数据 reconcile 到 DOM 槽位
  function reconcile(nextData) {
    const next = [];
    if (keyed) {
      nextData.forEach(d => {
        const ex = bars.find(b => b.tag === d.k);
        next.push(ex ? { tag: ex.tag, v: d.v } : { tag: d.k, v: d.v });
      });
    } else {
      nextData.forEach((d, i) => {
        const ex = bars[i];
        next.push(ex ? { tag: ex.tag, v: d.v } : { tag: d.k, v: d.v }); // 标签固定在槽位
      });
    }
    bars = next;
  }

  function draw(animate = true) {
    vScale.domain([0, Math.max(40, d3.max(data, d => d.v) || 0)]);
    reconcile(data);

    // 左列数据卡
    let cards = gData.selectAll('g.card').data(data, d => d.k);
    cards.exit().transition().duration(animate ? dur : 0).attr('opacity', 0).remove();
    const ce = cards.enter().append('g').attr('class', 'card').attr('opacity', 0);
    ce.append('rect').attr('width', 100).attr('height', 34).attr('rx', 7).attr('fill', '#ecebfa').attr('stroke', '#a5b4fc');
    ce.append('text').attr('class', 'ck').attr('x', 14).attr('y', 22).attr('font-size', 13).attr('font-weight', 700).attr('fill', '#3730a3');
    ce.append('text').attr('class', 'cv').attr('x', 72).attr('y', 22).attr('font-size', 12).attr('fill', '#4338ca');
    const cm = ce.merge(cards);
    cm.select('.ck').text(d => d.k);
    cm.select('.cv').text(d => 'v=' + d.v);
    cm.transition().duration(animate ? dur : 0).attr('opacity', 1)
      .attr('transform', (d, i) => `translate(${LX},${TOP + i*ROW})`);

    // 右列 DOM 柱（key 模式按 tag 匹配，索引模式按位置）
    let bsel = gDom.selectAll('g.bar').data(bars, keyed ? d => d.tag : (d, i) => i);
    bsel.exit().transition().duration(animate ? dur : 0).attr('opacity', 0).remove();
    const be = bsel.enter().append('g').attr('class', 'bar').attr('opacity', 0);
    be.append('rect').attr('class', 'br').attr('x', 26).attr('y', 0).attr('height', 20).attr('rx', 5).attr('fill', C.enter);
    be.append('text').attr('class', 'bt').attr('x', 2).attr('y', 15).attr('font-size', 13).attr('font-weight', 800);
    be.append('text').attr('class', 'bv').attr('x', 34).attr('y', 15).attr('font-size', 11).attr('font-weight', 700).attr('fill', '#fff');
    bsel = be.merge(bsel);
    bsel.transition().duration(animate ? dur : 0).attr('opacity', 1)
      .attr('transform', (d, i) => `translate(${RX},${TOP + i*ROW + 7})`);
    bsel.select('.br').transition().duration(animate ? dur : 0)
      .attr('width', d => vScale(d.v)).attr('fill', (d, i) => (data[i] && data[i].k === d.tag) ? C.update : C.bad);
    bsel.select('.bt').text(d => d.tag)
      .attr('fill', (d, i) => (data[i] && data[i].k === d.tag) ? C.update : C.exit);
    bsel.select('.bv').text(d => d.v);

    drawLines(animate);
  }

  // 连线：数据卡（槽位 i）→ 同槽位 DOM 柱；身份一致蓝，错位红
  function drawLines(animate) {
    const n = Math.min(data.length, bars.length);
    const ldata = d3.range(n);
    let ln = gLines.selectAll('line.ln').data(ldata);
    ln.exit().remove();
    const le = ln.enter().append('line').attr('class', 'ln');
    const merged = le.merge(ln);
    merged.attr('x1', LX + 100).attr('x2', RX + 26)
      .attr('stroke', i => (data[i].k === bars[i].tag) ? C.update : C.exit)
      .attr('stroke-width', 1.8)
      .attr('stroke-dasharray', i => keyed ? '0' : '5 3')
      .attr('opacity', 0.55);
    merged.transition().duration(animate ? dur : 0)
      .attr('y1', i => TOP + i*ROW + 17)
      .attr('y2', i => TOP + i*ROW + 17);
  }

  // 控件
  const keyBtn = toggle(ui.controls, T('key：按 id（推荐）', 'key: by id (good)'), true, (v) => {
    keyed = v;
    keyBtn.el.innerHTML = v
      ? (en ? 'key: by id ✓' : 'key：按 id ✓')
      : (en ? 'no key: by index' : '无 key：按索引');
    keyBtn.el.classList.toggle('active', v);
    init();
    draw(false);
  });
  const bAdd = button(T('+ 添加', '+ add'), '');
  const bUpd = button(T('⇆ 更新值', '⇆ update'), '');
  const bShuffle = button(T('⤨ 洗牌', '⤨ shuffle'), 'primary');
  const bDel = button(T('− 删除', '− remove'), '');
  const bReset = button(T('重置', 'reset'), '');
  ui.controls.append(bAdd, bUpd, bShuffle, bDel, bReset);

  bAdd.addEventListener('click', () => {
    const next = String.fromCharCode(65 + data.length);
    data.push({ k: next, v: 14 + Math.round(Math.random() * 18) });
    draw();
  });
  bUpd.addEventListener('click', () => {
    data = data.map((d, i) => ({ ...d, v: Math.min(40, d.v + (i % 2 ? 3 : -2)) }));
    draw();
  });
  bShuffle.addEventListener('click', () => {
    data = d3.shuffle(data.slice());
    draw();
  });
  bDel.addEventListener('click', () => { data.pop(); draw(); });
  bReset.addEventListener('click', () => { init(); draw(false); });

  init();
  draw(false);

  ui.setConcl(T(
    `<b>结论：</b>Data-Join 用<b>匹配</b>把数据与图形一一对应。<b>有 key 函数</b>时，按 id 匹配，洗牌后柱子会跟随卡片移动，元素身份不丢（enter 绿 / update 蓝 / exit 红）；<b>不提供 key</b>时按<b>索引</b>匹配，洗牌后柱子原地不动、数值张冠李戴——过渡动画会错。`,
    `<b>Takeaway:</b> Data-Join matches data to marks. With a <b>key</b>, joins are by id and bars follow cards after shuffle (identity preserved). Without a key, joins are by index: bars stay put and values swap places, so transitions attach to the wrong nodes.`));
};

export default D;
