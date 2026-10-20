// ============================================================
// ch04.js — 第 4 章《低维数据可视化》双语内容模型（讲解 / 代码 / 演示 数据源）
// 块类型：p h list table theory key pit tip code demo
// ============================================================
export default {
  id: '04',
  title: { zh: '低维数据可视化', en: 'Low-Dimensional Visualization' },
  lede: {
    zh: '在画点、画线之前先把数据「摆正」：宽表如何变成长表（tidy data）、数据值怎样经过三层坐标变换变成像素、十几种曲线插值各自的脾气、为什么 45° 斜率最易读，以及 Marching Squares 如何从网格里追踪等值线。',
    en: 'Before plotting points and lines, get the data right: reshape wide to long (tidy data), map values through three coordinate layers to pixels, choose among line curves, understand why 45° is the most readable slope, and trace contours with Marching Squares.'
  },
  objectives: {
    zh: [
      '区分宽格式与长格式，会用 flatMap 把多指标列熔化成 (实体, 指标, 值) 三元组',
      '理解数据空间 → 归一化坐标 → 屏幕像素三层变换，以及 margin 的作用',
      '按数据特征选 scaleLinear / scaleLog / scaleSqrt / scaleBand',
      '区分插值与拟合，知道十种 line.curve 的过冲与单调性差异',
      '理解 45° 黄金角与 banking 原则，会用纵横比/log 轴改善斜率判读',
      '掌握 Marching Squares 的 16 种 case 与线性插值，了解 Marching Cubes 推广'
    ],
    en: [
      'Distinguish wide from long formats and melt metric columns into (entity, metric, value) triples with flatMap',
      'Understand the three layers data → normalized → screen pixels and the role of margin',
      'Choose scaleLinear / scaleLog / scaleSqrt / scaleBand by data shape',
      'Separate interpolation from fitting and know the overshoot/monotonicity of line curves',
      'Understand the 45° banking rule and fix slope reading with aspect ratio or log axes',
      'Master the 16 Marching Squares cases and linear interpolation, and the Marching Cubes extension'
    ]
  },
  sections: [
    {
      id: '4.1',
      title: { zh: '数据转换：宽表与长表', en: 'Reshaping: Wide and Long' },
      sub: { zh: '犯罪数据是宽格式，可视化常要长格式', en: 'The crime data is wide; visualization often needs long' },
      blocks: [
        { t: 'table', head: [{ zh: '格式', en: 'Format' }, { zh: '一行代表', en: 'One row is' }, { zh: '列', en: 'Columns' }, { zh: '优点', en: 'Strength' }],
          rows: [
            [{ zh: '宽表 wide', en: 'wide' }, { zh: '一个实体（州）', en: 'one entity (state)' }, { zh: '每个指标一列', en: 'one column per metric' }, { zh: '人眼直观', en: 'human-readable' }],
            [{ zh: '长表 long', en: 'long' }, { zh: '一次观测', en: 'one observation' }, { zh: '州, 指标, 值', en: 'state, metric, value' }, { zh: '利于过滤/分组/join', en: 'filter/group/join' }]
          ] },
        { t: 'p', x: { zh: 'tidy data 三原则：每列一个变量、每行一次观测、每格一个值。宽表把「指标」这个变量藏进了列名，d3.group/rollup 无法直接用；熔化成三元组后，指标成为一个可筛选、可上色的普通列。', en: 'Tidy data has one variable per column, one observation per row, one value per cell. A wide table hides the metric inside column headers, which d3.group/rollup cannot consume; after melting, the metric becomes an ordinary filterable/colorable column.' } },
        { t: 'code', lang: 'js', title: { zh: '① 宽 → 长：flatMap 熔化', en: '① Wide to long: melt with flatMap' },
          code: `const METRICS = ['murder','robbery','burglary','arson'];
const long = wide.flatMap(d =>
  METRICS.map(k => ({ state: d.state, metric: k, value: +d[k] }))
);
// 1 行（含 4 个指标）→ 4 行三元组；行数 = 州数 × 指标数
// 读入时用 d3.autoType / +d.field 自动转数字`,
          notes: [
            { type: 'why', h: { zh: 'flatMap 而非 map', en: 'flatMap not map' },
              x: { zh: '<code>map</code> 会得到「数组的数组」，<code>flatMap</code> 把每行展开成多行并拍平一层，正好是 melt 的语义；单元总数不变。', en: '<code>map</code> yields an array of arrays; <code>flatMap</code> expands each row into several and flattens one level — exactly melt, with the same total cell count.' } }
          ] },
        { t: 'demo', id: 'd04-1', title: { zh: '宽/长格式单元飞行 morph', en: 'Wide/long cell-flight morph' },
          x: { zh: '宽表（州 × 指标）里每个单元随「重塑」飞到长表的一行三元组，可跟踪某州的所有单元；过程中 24 个单元数量守恒，只是把位置编码改成列编码。', en: 'Each cell in the wide state×metric table flies into a long triple row; track one state. The 24 cells are conserved — positional encoding simply becomes column encoding.' } }
      ]
    },
    {
      id: '4.2',
      title: { zh: '坐标轴变换', en: 'Coordinate Transform' },
      sub: { zh: '数据空间 → 坐标系空间 → 屏幕空间，三层职责分明', en: 'Data → coordinate → screen: three distinct layers' },
      blocks: [
        { t: 'list', x: [
          { zh: '数据空间：原始数值，如谋杀率 3.9 / 15.9，人口 53 万到 2700 万', en: 'Data space: raw values such as rates 3.9/15.9, population 0.53M–27M' },
          { zh: '坐标系空间：归一化到 [0,1]（或 innerWidth），与尺寸无关', en: 'Coordinate space: normalized to [0,1] (or inner width), size-independent' },
          { zh: '屏幕空间：再加上 margin 偏移，得到最终像素', en: 'Screen space: add margin offsets to get final pixels' }
        ] },
        { t: 'p', x: { zh: '分层的好处是坐标空间内的线、点可以共享，换尺寸时只重算最后一层。<code>d3.axisBottom</code> 自动完成坐标系→屏幕的标注。', en: 'Layering lets marks in coordinate space be shared; only the last layer recomputes on resize. <code>d3.axisBottom</code> handles the coordinate-to-screen labeling.' } },
        { t: 'table', head: [{ zh: 'scale', en: 'scale' }, { zh: '适用', en: 'Use when' }, { zh: '例子', en: 'Example' }],
          rows: [
            [{ zh: 'scaleLinear', en: 'scaleLinear' }, { zh: '数值均匀、最常用', en: 'even values, default' }, { zh: '温度、率', en: 'temperature, rate' }],
            [{ zh: 'scaleLog', en: 'scaleLog' }, { zh: '跨数量级', en: 'spans orders of magnitude' }, { zh: '人口、GDP', en: 'population, GDP' }],
            [{ zh: 'scaleSqrt', en: 'scaleSqrt' }, { zh: '面积映射（圆面积）', en: 'area encoding (bubbles)' }, { zh: '气泡图', en: 'bubble chart' }],
            [{ zh: 'scaleBand', en: 'scaleBand' }, { zh: '类别轴', en: 'categorical axis' }, { zh: '柱状图', en: 'bar chart' }]
          ] },
        { t: 'code', lang: 'js', title: { zh: '① scale 就是数据→像素的函数', en: '① A scale is a data→pixel function' },
          code: `const x = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.rate)])
  .range([margin.left, width - margin.right]);
x(10);                 // 直接返回像素坐标
// 右偏跨数量级时改用 log：
const xp = d3.scaleLog().domain([1e5, 3e7]).range([0, w]);`,
          notes: [
            { type: 'warn', h: { zh: 'log 域不能含 0', en: 'log domain cannot include 0' },
              x: { zh: '<code>scaleLog</code> 要求 domain 两端为正；数据含 0 时用 <code>domain([1, max])</code> 或先过滤/平移。', en: '<code>scaleLog</code> requires positive domain endpoints; for zeros use <code>domain([1, max])</code> or filter/shift first.' } }
          ] },
        { t: 'demo', id: 'd04-2', title: { zh: '三层映射器与网格变形', en: 'Three-layer mappers with grid warping' },
          x: { zh: '同一批谋杀率在数据域、归一化、像素三层间逐点对应；切 linear/log/sqrt 时网格被拉伸压缩、右偏数据被拉直，跟踪一个点穿过三层。', en: 'The same murder rates map point-for-point through domain, normalized and pixel layers; switching linear/log/sqrt warps the grid and straightens the right-skewed data. Track one point through all three.' } }
      ]
    },
    {
      id: '4.3',
      title: { zh: '曲线拟合', en: 'Curve Fitting' },
      sub: { zh: '同样的点，十种 line.curve 画风各异', en: 'The same points, ten different line curves' },
      blocks: [
        { t: 'p', x: { zh: '<strong>插值</strong>曲线穿过每一个数据点（linear/monotoneX/natural/catmullRom/step）；<strong>拟合</strong>曲线不要求穿过点，只反映趋势（basis/bundle、回归）。', en: '<strong>Interpolation</strong> passes through every point (linear/monotoneX/natural/catmullRom/step); <strong>fitting</strong> does not pass through points, only the trend (basis/bundle, regression).' } },
        { t: 'table', head: [{ zh: 'curve', en: 'curve' }, { zh: '行为', en: 'Behavior' }, { zh: '适用', en: 'Use for' }],
          rows: [
            [{ zh: 'linear', en: 'linear' }, { zh: '直线连接', en: 'straight segments' }, { zh: '默认、读数准', en: 'default, accurate' }],
            [{ zh: 'monotoneX', en: 'monotoneX' }, { zh: '过点且保单调', en: 'through points, monotone' }, { zh: '有序数据、防伪震荡', en: 'ordered data, no artifacts' }],
            [{ zh: 'catmullRom/natural', en: 'catmullRom/natural' }, { zh: '过点张力样条', en: 'through-point splines' }, { zh: '抖动数据平滑', en: 'smooth noisy data' }],
            [{ zh: 'basis/bundle', en: 'basis/bundle' }, { zh: '不过点、走趋势', en: 'miss points, trend' }, { zh: '多线趋势', en: 'many-line trend' }],
            [{ zh: 'step 系列', en: 'step family' }, { zh: '阶跃', en: 'step changes' }, { zh: '离散状态/信号', en: 'discrete states/signals' }]
          ] },
        { t: 'pit', title: { zh: '过冲（overshoot）', en: 'Overshoot' },
          x: { zh: 'catmullRom/cardinal 在数据剧烈转折时会越过相邻数据点的范围，制造数据中不存在的峰/谷；需要保单调用 monotoneX，看趋势用 basis。', en: 'catmullRom/cardinal can swing beyond neighboring points at sharp turns, inventing peaks/valleys that are not in the data; use monotoneX to preserve monotonicity or basis for trend.' } },
        { t: 'code', lang: 'js', title: { zh: '① 选择 curve', en: '① Choosing a curve' },
          code: `const line = d3.line()
  .x(d => x(d.year)).y(d => y(d.value))
  .curve(d3.curveMonotoneX);   // 保单调
// d3.curveStepBefore / curveBasis / curveCatmullRom ...
paths.attr('d', line);`,
          notes: [
            { type: 'why', h: { zh: '小倍数比较', en: 'Compare with small multiples' },
              x: { zh: '同一份数据把十种 curve 画成小倍数同屏，比逐个切换更能看清过冲与是否穿点的差异。', en: 'Drawing ten curves on the same data as small multiples reveals overshoot and through-point differences better than switching one at a time.' } }
          ] },
        { t: 'demo', id: 'd04-3', title: { zh: '十种曲线小倍数 + 过冲标注', en: 'Ten-curve small multiples with overshoot tags' },
          x: { zh: '同一组控制点铺成 2×5 小倍数，逐格标注是否穿过数据点、是否过冲；拖动上方控制点，十条曲线同步反应，还可按过冲排序。', en: 'One control set in a 2×5 grid tagged for through-point vs overshoot; drag a control point and all ten react, with an overshoot sort.' } }
      ]
    },
    {
      id: '4.4',
      title: { zh: '倾角感知（45° 黄金角）', en: 'Slope Perception (45°)' },
      sub: { zh: '人眼对斜率的估计不是线性的', en: 'Slope estimation is not linear' },
      blocks: [
        { t: 'p', x: { zh: 'Cleveland 1984 让被试估计线段斜率：接近水平（0°）或垂直（90°）时误差最大，在 45° 附近最准，整体呈 U 形。人眼会系统性地夸大陡度。', en: 'Cleveland (1984) had subjects estimate slopes: errors are largest near horizontal (0°) or vertical (90°) and smallest around 45° — a U shape; steepness is systematically exaggerated.' } },
        { t: 'list', x: [
          { zh: '让关键数据的斜率落在 30°–60° 区间', en: 'Keep key slopes within 30°–60°' },
          { zh: '比较多条增长曲线时用 log 轴，把陡度拉回 45° 附近', en: 'Use a log axis for growth curves to bring slopes near 45°' },
          { zh: '避免在 5° 以下或 85° 以上做趋势对比', en: 'Avoid comparing trends below 5° or above 85°' },
          { zh: '调整纵横比（banking）使平均斜率约 45°', en: 'Bank the aspect ratio so average slope is about 45°' }
        ] },
        { t: 'key', title: { zh: 'banking to 45°', en: 'Banking to 45°' }, body: [
          { t: 'p', x: { zh: '同一条数据曲线，改变图的纵横比（宽/高）会改变屏幕上的倾角。把关键斜率「存」到 45° 附近，读者对增减幅度的判断最准。', en: 'Changing the aspect ratio changes the on-screen angle of the same data curve; banking key slopes to ~45° makes rate-of-change judgments most accurate.' } }
        ] },
        { t: 'demo', id: 'd04-4', title: { zh: '斜率判读心理物理实验', en: 'Slope-judgment psychophysics lab' },
          x: { zh: '拖动滑块复刻屏幕上线段的陡度，八轮后用你自己的误差画出误差-倾角曲线，重现 45° 最准；再用纵横比滑块体会 banking 如何把一条数据 45° 的线挪离对角。', en: 'Drag a slider to reproduce each line’s steepness; after eight rounds your own error-versus-angle curve is plotted, recreating the 45° optimum. The aspect-ratio slider shows how banking moves a true 45° line off the diagonal.' } }
      ]
    },
    {
      id: '4.5',
      title: { zh: '等值线：Marching Squares', en: 'Contours: Marching Squares' },
      sub: { zh: '给定标量场与阈值，追踪「值 = 阈值」的曲线', en: 'Trace where a scalar field equals a threshold' },
      blocks: [
        { t: 'p', x: { zh: '把标量场离散为网格，每个 cell 看四个角「是否高于阈值」，得到一个 4 位二进制数（位 = BL/BR/TR/TL，共 2⁴=16 种 case）；查表决定画 0、1 或 2 条线段，把高/低两片分开。', en: 'Discretize the scalar field into a grid; each cell reads its four corners as above/below threshold, giving a 4-bit code (bits BL/BR/TR/TL, 16 cases); the lookup draws 0/1/2 segments separating high from low.' } },
        { t: 'list', x: [
          { zh: '最近邻取中点：线段端点放在边中点，省事但位置不准', en: 'Nearest-neighbor: endpoints at edge midpoints — simple but imprecise' },
          { zh: '沿边线性插值：按两角数值算出阈值真实穿过点，更准', en: 'Linear interpolation: compute where the threshold truly crosses each edge' },
          { zh: '推广到 3D 即 Marching Cubes（Lorensen & Cline 1987），用于 MRI/CT 等值面', en: 'In 3D it is Marching Cubes (1987) for MRI/CT isosurfaces' }
        ] },
        { t: 'code', lang: 'js', title: { zh: '① 4 角查表', en: '① Four corners lookup' },
          code: `// bl/br/tr/tl 高于阈值分别贡献位 1/2/4/8
let code = 0;
if (bl > th) code |= 1;
if (br > th) code |= 2;
if (tr > th) code |= 4;
if (tl > th) code |= 8;
const segments = EDGE_TABLE[code]; // 0/1/2 条线段
// 端点沿边线性插值：t = (th - va)/(vb - va)`,
          notes: [
            { type: 'why', h: { zh: '应用', en: 'Applications' },
              x: { zh: '地形等高线、天气等温线/等压线、核密度等高图、医学影像重建，都是「给标量场取等值线」。', en: 'Topographic contours, weather isotherms/isobars, kernel-density contours and medical imaging all take contours of a scalar field.' } }
          ] },
        { t: 'demo', id: 'd04-5', title: { zh: 'Marching Squares 逐格算法 + 鼠标塑形', en: 'Cell-by-cell Marching Squares with sculpting' },
          x: { zh: '逐格高亮、四角二值化、16 种 case 查表并画出线段；切最近邻/线性插值看精度差异，拖动阈值，或按住鼠标直接塑形标量场。', en: 'Step through highlighted cells, binary-classified corners, the 16-case lookup and segments; toggle nearest/linear interpolation, change the threshold, or press-drag to sculpt the field.' } }
      ]
    }
  ],
  summary: {
    zh: [
      '宽表每列是一个指标、长表每行是一次观测（实体, 指标, 值）；flatMap 做 melt 时单元数守恒，长表才是 d3 分组想要的 tidy 形状。',
      '坐标变换分三层：数据值 → 归一化 [0,1] → 加 margin 的屏幕像素；线性均匀、log 跨数量级、sqrt 配面积、band 配类别。',
      '插值曲线穿过所有点（linear/monotoneX/catmullRom/step），basis/bundle 是拟合只走趋势；catmullRom 会过冲，保单调用 monotoneX。',
      '斜率判读在 45° 最准、0°/90° 最差（Cleveland）；用 banking 纵横比和 log 轴把关键斜率留在 30–60°。',
      'Marching Squares 用四角 4 位二进制查 16 种 case 画等值线段，线性插值更准，三维推广是 Marching Cubes。'
    ],
    en: [
      'Wide tables have one metric per column; long tables have one observation per row (entity, metric, value). flatMap melts with cell count conserved, and long is the tidy form d3 grouping expects.',
      'Coordinates map in three layers: value → normalized [0,1] → margin-inset pixels; linear for even, log for orders of magnitude, sqrt for area, band for categories.',
      'Interpolation passes through points (linear/monotoneX/catmullRom/step); basis/bundle fit the trend. catmullRom can overshoot; monotoneX preserves monotonicity.',
      'Slope is read best at 45° and worst at 0°/90° (Cleveland); bank aspect ratio and use log axes to keep key slopes at 30–60°.',
      'Marching Squares uses four-corner 4-bit codes to look up 16 cases and draw contour segments; linear interpolation is more accurate, and the 3D extension is Marching Cubes.'
    ]
  },
  quickref: [
    { tag: '4.1', x: { zh: '① 宽/长 ② tidy 三原则 ③ flatMap melt ④ 单元守恒', en: '① wide/long ② tidy rules ③ flatMap melt ④ cells conserved' } },
    { tag: '4.2', x: { zh: '① 三层变换 ② margin ③ linear/log/sqrt/band ④ log 域非零', en: '① three layers ② margin ③ linear/log/sqrt/band ④ log no zero' } },
    { tag: '4.3', x: { zh: '① 插值 vs 拟合 ② monotoneX 保单调 ③ basis 走趋势 ④ 过冲', en: '① interp vs fit ② monotoneX ③ basis trend ④ overshoot' } },
    { tag: '4.4', x: { zh: '① 45° 最准 ② U 形误差 ③ banking ④ log 拉斜率', en: '① 45° best ② U-shaped error ③ banking ④ log slopes' } },
    { tag: '4.5', x: { zh: '① 四角 4 位 ② 16 case ③ 线性插值 ④ Marching Cubes', en: '① 4 corners ② 16 cases ③ linear interp ④ Marching Cubes' } }
  ],
  quiz: [
    { q: { zh: '宽表转长表后，数据单元（值）的总数会变化吗？为什么？', en: 'Does the total number of data values change when melting wide to long? Why?' },
      a: { zh: '不变。melt 只是把「位置编码」（行=实体、列=指标）改成「列编码」（实体, 指标, 值）；宽表的每个单元对应长表的一行，6 州 × 4 指标 = 24 个单元，转换前后都是 24。', en: 'No. Melt only converts positional encoding (row=entity, column=metric) into column encoding (entity, metric, value); each wide cell becomes one long row, so 6 states × 4 metrics = 24 cells before and after.' } },
    { q: { zh: '数据空间、坐标系空间、屏幕空间分别是什么？margin 属于哪一层？', en: 'What are the data, coordinate and screen spaces, and which layer contains margin?' },
      a: { zh: '数据空间是原始数值；坐标系空间是归一化到 [0,1]（与尺寸无关）；屏幕空间是再加上 margin 偏移得到的最终像素。margin 是坐标空间→屏幕空间的固定偏移，属于最后一层。', en: 'Data space holds raw values; coordinate space normalizes to [0,1], independent of size; screen space adds margin offsets to produce final pixels. Margin is the fixed offset in the last layer.' } },
    { q: { zh: '插值与拟合有什么区别？数据要保单调时应选哪种 curve？', en: 'How do interpolation and fitting differ, and which curve preserves monotonicity?' },
      a: { zh: '插值曲线经过每个数据点（linear/monotoneX/natural/catmullRom/step），拟合曲线（basis/bundle）不穿点、只反映趋势。要保单调、避免伪震荡应选 curveMonotoneX；catmullRom 在剧烈转折时可能过冲。', en: 'Interpolation passes through every point (linear/monotoneX/natural/catmullRom/step); fitting (basis/bundle) follows the trend without passing through. Use curveMonotoneX to preserve monotonicity; catmullRom can overshoot at sharp turns.' } },
    { q: { zh: '为什么建议让关键斜率落在 45° 附近？怎样做到？', en: 'Why should key slopes sit near 45°, and how do you achieve it?' },
      a: { zh: 'Cleveland 实验表明人眼对斜率的判读在 45° 附近最准、接近水平或垂直时误差最大。可通过调整图的纵横比（banking）让平均斜率约 45°，或对指数增长数据用 log 轴把陡度拉回该区间。', en: 'Cleveland showed slope judgments are most accurate near 45° and worst near horizontal/vertical. Bank the aspect ratio so average slope is ~45°, or use a log axis for exponential growth to bring slopes back into that range.' } },
    { q: { zh: '一个 Marching Squares 格四个角的状态决定什么？线性插值比取中点好在哪？', en: 'What do a Marching Squares cell’s four corner states determine, and why is linear interpolation better than midpoints?' },
      a: { zh: '四角「高于/低于阈值」组成 4 位二进制（0–15），查表决定画 0/1/2 条线段把高/低两片分开。取中点假设阈值恰在边中央，位置不准；沿边线性插值 t=(th−va)/(vb−va) 能定位阈值真实穿过点，等值线更贴合。', en: 'The four above/below states form a 4-bit code (0–15) whose lookup draws 0/1/2 segments separating high and low. Midpoints assume the crossing is at the edge center; linear interpolation t=(th−va)/(vb−va) locates the true crossing, giving a more accurate contour.' } }
  ]
};
