// ============================================================
// ch02.js — 第 2 章《数据可视化流程》双语内容模型（讲解 / 代码 / 演示 数据源）
// 块类型：p h list table theory key pit tip code demo
// ============================================================
export default {
  id: '02',
  title: { zh: '数据可视化流程', en: 'Visualization Pipeline' },
  lede: {
    zh: '把可视化拆成一条完整链路：流程模型 → 数据聚合 → 视觉映射 → 渲染交互，用同一批 80 个新生数据贯穿 Card、Mackinlay、van Wijk 三个模型。',
    en: 'Visualization as one pipeline: reference models → data aggregation → visual mapping → rendering and interaction, following the same 80 students through Card, Mackinlay and van Wijk.'
  },
  objectives: {
    zh: [
      '区分 Card / Mackinlay / van Wijk 三个流程模型各自描述的侧面',
      '掌握 d3.rollup 多层聚合与嵌套 Map，对应 OLAP 切片/切块/钻取',
      '理解 Reingold-Tilford 树布局算法与 d3-hierarchy 全家桶',
      '分清图元与视觉通道、幅度通道与标识通道',
      '掌握 DOM 事件三阶段、事件委托与 stopPropagation'
    ],
    en: [
      'Tell apart what each of Card, Mackinlay and van Wijk describes',
      'Master multi-level d3.rollup and nested Maps, mapped to OLAP slice/dice/drill',
      'Understand the Reingold-Tilford layout and the d3-hierarchy family',
      'Distinguish marks from channels, and magnitude from identity channels',
      'Master DOM event phases, event delegation and stopPropagation'
    ]
  },
  sections: [
    {
      id: '2.1',
      title: { zh: '数据可视化流程', en: 'The Visualization Pipeline' },
      sub: { zh: '从「拿到一张表」到「画出一张图」的完整链路', en: 'From a table in hand to a chart on screen' },
      blocks: [
        { t: 'theory', title: { zh: '三个模型：同一条链路的三个侧面', en: 'Three models, three views of one pipeline' }, body: [
          { t: 'p', x: { zh: 'Card、Mackinlay、van Wijk 不是三个互相竞争的流程，而是叠加关系：Card 给「管道」、Mackinlay 给「自动决策」、van Wijk 给「反馈环」。', en: 'Card, Mackinlay and van Wijk are not competing pipelines — they stack: Card gives the pipe, Mackinlay the automatic decision, and van Wijk the feedback loop.' } },
          { t: 'table', head: [{ zh: '模型', en: 'Model' }, { zh: '关注', en: 'Focus' }, { zh: '核心主张', en: 'Core claim' }, { zh: '对应沙盘阶段', en: 'Sandbox lane' }],
            rows: [
              [{ zh: 'Card 1999', en: 'Card 1999' }, { zh: '数据管道', en: 'Data pipe' }, { zh: '原始数据 → 数据表 → 视觉结构 → 视图', en: 'Raw data → tables → visual structure → views' }, { zh: '前 4 格', en: 'first 4 lanes' }],
              [{ zh: 'Mackinlay 1986', en: 'Mackinlay 1986' }, { zh: '自动映射', en: 'Auto mapping' }, { zh: '为每种数据类型选量化最准的通道', en: 'Pick the most accurate channel per data type' }, { zh: '视觉映射格', en: 'mapping lane' }],
              [{ zh: 'van Wijk 2005', en: 'van Wijk 2005' }, { zh: '反馈环', en: 'Feedback loop' }, { zh: 'View ⇆ Filter ⇆ Param，交互反向影响前序视图', en: 'View ⇆ Filter ⇆ Param; interaction feeds back' }, { zh: '用户交互格', en: 'interaction lane' }]
            ] },
          { t: 'p', x: { zh: '<strong>Card 嵌套变换：</strong>D → T → V → C/L/S（Camera / Light / Screen）。原始数据先被精炼成数据表，再映射成视觉结构，最后经相机、光照、屏幕变换成视图。', en: '<strong>Card’s nested transforms:</strong> D → T → V → C/L/S (Camera / Light / Screen). Raw data are refined into tables, mapped to visual structure, then turned into views via camera/light/screen transforms.' } }
        ]},
        { t: 'code', lang: 'js', title: { zh: '① SVG marker 箭头 + classed 状态切换', en: '① SVG marker arrows + classed state' },
          code: `// 1. 用 <defs> + <marker> 定义箭头（只需定义一次）
svg.append("defs").append("marker")
  .attr("id", "arrowhead")
  .attr("refX", 8)            // 箭头位置校准
  .attr("orient", "auto")     // 跟随线方向旋转
  .append("path").attr("d", "M0,-5L10,0L0,5");

// 2. marker-end 引用箭头
svg.append("line")
  .attr("marker-end", "url(#arrowhead)")
  .attr("x1", x1).attr("y1", y).attr("x2", x2).attr("y2", y);

// 3. classed 接收布尔函数，一次性切换全部节点
svg.selectAll(".node").classed("selected", n => n.id === d.id);`,
          notes: [
            { type: 'why', h: { zh: '关键点', en: 'Key points' },
              x: { zh: '<code>marker-end="url(#arrowhead)"</code> 用 URL 引用 <code>&lt;defs&gt;</code> 里的形状；<code>classed("sel", 谓词)</code> 比手动 forEach 简洁，谓词为真的节点加类、为假的去类。', en: '<code>marker-end</code> references a shape defined in <code>&lt;defs&gt;</code> by URL; <code>classed("sel", predicate)</code> toggles the class on all nodes at once — cleaner than a manual forEach.' } }
          ] },
        { t: 'tip', title: { zh: '学习提示', en: 'Study tip' }, x: {
          zh: '不要背三个模型的名词。打开沙盘，在「数据变换」格筛选性别、在「视觉映射」格换 x 字段、在「用户交互」格刷选——Card 是逐阶段的管道、Mackinlay 决定第三格怎么编码、van Wijk 是末格刷选反向影响前序的回路。',
          en: 'Do not memorize the names. In the sandbox, filter gender in the transform lane, change x in the mapping lane, and brush in the interaction lane — Card is the staged pipe, Mackinlay drives the third lane, van Wijk is the loop feeding the brush back.'
        } },
        { t: 'demo', id: 'd02-1', title: { zh: '端到端联动沙盘（5 阶段管道 + 刷选反馈）', en: 'End-to-end pipeline sandbox (5 lanes + brush feedback)' },
          x: { zh: '一条真实数据流经过原始、变换、映射、渲染、交互 5 个阶段：改筛选、换 x 字段、调缩放，再在末格拖出刷选区间，被选中的点会反向高亮回前序所有阶段；用「理论透镜」分别高亮 Card / Mackinlay / van Wijk 对应的格子。', en: 'Real data flow through five lanes: raw, transform, mapping, render, interaction. Change the filter, x field and zoom, then drag a brush in the last lane — selected points highlight back through every earlier lane. Use the theory lens to highlight Card, Mackinlay or van Wijk.' } }
      ]
    },
    {
      id: '2.2',
      title: { zh: '数据变换：原数据 → 数据表', en: 'Data Transformation: Raw → Table' },
      sub: { zh: 'Card 模型 D→T 阶段：清洗、聚合、连接、派生', en: 'Card’s D→T stage: clean, aggregate, join, derive' },
      blocks: [
        { t: 'theory', title: { zh: '数据变换的四类操作（Card D 层）', en: 'Four operations of data transformation (Card’s D layer)' }, body: [
          { t: 'table', head: [{ zh: '操作', en: 'Operation' }, { zh: '做什么', en: 'What it does' }, { zh: 'D3 实现', en: 'In D3' }],
            rows: [
              [{ zh: '清洗 / 过滤', en: 'Clean / filter' }, { zh: '去缺失、去异常、筛选行', en: 'drop missing/outliers, pick rows' }, { zh: '<code>.filter()</code>、<code>d3.csv(row)</code> 回调', en: '<code>.filter()</code>, the row callback' }],
              [{ zh: '聚合 / 汇总', en: 'Aggregate' }, { zh: '按 key 分组，把同组归约为一个值', en: 'group by key, reduce to a value' }, { zh: '<code>d3.rollup()</code>、<code>d3.group()</code>', en: '<code>d3.rollup()</code>, <code>d3.group()</code>' }],
              [{ zh: '连接 / 关联', en: 'Join' }, { zh: '按键把两张表拼起来', en: 'merge two tables on a key' }, { zh: '<code>d3.index</code> + 手动索引', en: '<code>d3.index</code> + manual lookup' }],
              [{ zh: '派生 / 衍生', en: 'Derive' }, { zh: '由已有列算出新列（班级 → 专业）', en: 'compute a new column (class → major)' }, { zh: 'row 回调里加一个字段', en: 'add a field in the row callback' }]
            ] },
          { t: 'p', x: { zh: '数据变换是流水线的「第一公里」。本节的 rollup 聚合属于「聚合」这一行。', en: 'Data transformation is the first mile of the pipeline. The rollup here belongs to the aggregate row.' } }
        ]},
        { t: 'code', lang: 'js', title: { zh: '① 双层 rollup：keys 是 rest 参数', en: '① Two-level rollup: keys are rest params' },
          code: `const nested = d3.rollup(
  students,
  v => v.length,        // reducer：每组归约为一个值（count）
  d => d.major,         // 外层 key
  d => d.cls            // 内层 key（rest 参数，可继续加）
);
// 返回 Map（不是数组/对象）：嵌套 rollup → 嵌套 Map
for (const [major, inner] of nested)
  for (const [cls, count] of inner)
    console.log(major, cls, count);

// d3.group 保留原数组，d3.rollup 只保留归约值
d3.group(students, d => d.major);   // Map<major, 学生数组>`,
          notes: [
            { type: 'why', h: { zh: 'rollup vs group', en: 'rollup vs group' },
              x: { zh: '<code>d3.rollup</code> 是「按 key 分桶再 reduce 一次」，返回嵌套 <code>Map</code>；<code>d3.group</code> 保留每组的原数组。遍历用 <code>for (const [k,v] of m)</code>。', en: '<code>rollup</code> buckets by key and reduces once, returning a nested <code>Map</code>; <code>group</code> keeps each group’s array. Iterate with <code>for (const [k,v] of m)</code>.' } },
            { type: 'warn', h: { zh: '易错点', en: 'Pitfall' },
              x: { zh: 'rollup 的 keys 是 <code>...keys</code> rest 参数，能传任意多个；只有一个 key 时得到一层 Map，两个 key 时得到 Map 套 Map。', en: 'The keys are a <code>...keys</code> rest parameter, so add as many as you like; one key yields a flat Map, two keys a Map of Maps.' } }
          ] },
        { t: 'code', lang: 'js', title: { zh: '② 用非贪婪正则从班级提取专业', en: '② Extract major with a non-greedy regex' },
          code: `const data = await d3.csv("./data/newstudent.csv", d => {
  const cls = d["班级"].trim();
  const m = cls.match(/^(.+?)(\\d+班)$/); // 非贪婪 + 末尾「数字+班」
  return {
    id:   +d["序号"],
    name: d["姓名"].trim(),
    cls,
    major: m ? m[1] : cls,  // "软件工程1班" → "软件工程"
  };
});`,
          notes: [
            { type: 'why', h: { zh: '为什么非贪婪', en: 'Why non-greedy' },
              x: { zh: '<code>.+?</code> 是非贪婪匹配，让中间尽可能短、把末尾留给 <code>\\d+班</code>；若写成贪婪的 <code>.+</code>，它会吞掉整串，<code>m[1]</code> 取不到专业。', en: '<code>.+?</code> is non-greedy, keeping the middle short and reserving the end for <code>\\d+班</code>; a greedy <code>.+</code> would swallow the whole string and leave <code>m[1]</code> undefined.' } }
          ] },
        { t: 'theory', title: { zh: 'OLAP 切片 / 切块 / 钻取（Codd 1993）', en: 'OLAP slice / dice / drill (Codd 1993)' }, body: [
          { t: 'table', head: [{ zh: 'OLAP 操作', en: 'OLAP op' }, { zh: '实际对应', en: 'Equivalent' }],
            rows: [
              [{ zh: '切片 Slice', en: 'Slice' }, { zh: '<code>.filter()</code> 后再 rollup（固定一个维度）', en: '<code>.filter()</code> then rollup (fix one dim)' }],
              [{ zh: '切块 Dice', en: 'Dice' }, { zh: '多 key rollup（同时按多个维度）', en: 'multi-key rollup (several dims)' }],
              [{ zh: '钻取 Drill', en: 'Drill' }, { zh: '嵌套 rollup + 递归展开（专业 → 班级 → 性别）', en: 'nested rollup + expand (major → class → gender)' }]
            ] },
          { t: 'p', x: { zh: '可视化系统里的「下钻」交互，背后通常就是 rollup + hierarchy 的组合。', en: 'A “drill-down” in a viz system is usually rollup + hierarchy under the hood.' } }
        ]},
        { t: 'demo', id: 'd02-2', title: { zh: '动态聚簇 + 矩形树图 / 马赛克 / 打包圆', en: 'Dynamic clustering + treemap / mosaic / pack' },
          x: { zh: '先看 80 个学生点随维度动态聚簇；再切到矩形树图、马赛克、打包圆，用面积读 rollup 的聚合结果，切换分组维度与计数/平均年龄指标，悬停看组内男女构成。', en: 'Watch 80 dots cluster by dimension; switch to treemap, mosaic or pack to read rollup results by area. Change the dimension and count/mean-age metric; hover to see the gender composition.' } }
      ]
    },
    {
      id: '2.3',
      title: { zh: '视觉映射：数据表 → 视觉结构', en: 'Visual Mapping: Table → Visual Structure' },
      sub: { zh: 'Mackinlay 通道排名 + 图元/通道 + 树布局实例', en: 'Mackinlay ranking + marks/channels + tree layout' },
      blocks: [
        { t: 'theory', title: { zh: '图元（marks）打底，通道（channels）做记号', en: 'Marks as the skeleton, channels as the encoding' }, body: [
          { t: 'p', x: { zh: '视觉结构由<strong>图元</strong>打底：点（Point）、线（Line）、面（Area）；再通过<strong>通道</strong>做记号：位置、颜色、形状、倾斜、大小。', en: 'Visual structure starts with <strong>marks</strong> — point, line, area — then encodes through <strong>channels</strong>: position, color, shape, tilt, size.' } },
          { t: 'table', head: [{ zh: '通道类别', en: 'Channel family' }, { zh: '表达什么', en: 'Expresses' }, { zh: '包含', en: 'Includes' }],
            rows: [
              [{ zh: '幅度通道 Magnitude', en: 'Magnitude' }, { zh: '有序 / 定量，能比大小', en: 'ordered/quantitative, compare amounts' }, { zh: '位置、长度、倾斜、面积、亮度', en: 'position, length, tilt, area, lightness' }],
              [{ zh: '标识通道 Identity', en: 'Identity' }, { zh: '类别，能区分「不同类」', en: 'categorical, distinguish classes' }, { zh: '空间区域、色调、运动、形状', en: 'region, hue, motion, shape' }]
            ] },
          { t: 'p', x: { zh: '<strong>Mackinlay 排名：</strong>位置（Position）对三类数据都最准；定量数据其次是长度 → 角度 → 斜率 → 面积，名义数据其次是色调 → 纹理 → 形状。', en: '<strong>Mackinlay’s ranking:</strong> position is most accurate for all three types; for quantitative data next come length → angle → slope → area, for nominal data hue → texture → shape.' } }
        ]},
        { t: 'theory', title: { zh: 'Reingold-Tilford 树布局（1981，d3.tree 的核心）', en: 'Reingold-Tilford layout (1981, core of d3.tree)' }, body: [
          { t: 'list', x: [
            { zh: '第一遍（自底向上）：对每个父节点计算左右子树各占多少横向空间', en: 'Pass 1 (bottom-up): for each parent measure how wide the left/right subtrees are' },
            { zh: '第二遍（自顶向下）：给每个节点分配绝对坐标，兄弟紧贴父中线且不重叠', en: 'Pass 2 (top-down): assign absolute x so siblings stay centered on the parent without overlap' },
            { zh: '第三遍：处理「线程」（threads），修复跨父中线的子树对齐', en: 'Pass 3: handle “threads” to fix subtrees crossing a parent’s midline' }
          ]},
          { t: 'p', x: { zh: '复杂度 <strong>O(n)</strong>。树布局本质是一种视觉映射——用<strong>位置通道</strong>把层级关系编码成「父在左、子在右」的树。', en: 'Complexity <strong>O(n)</strong>. A tree layout is itself a visual mapping — it encodes hierarchy with the <strong>position channel</strong>.' } },
          { t: 'table', head: [{ zh: 'API', en: 'API' }, { zh: '用途', en: 'Use' }],
            rows: [
              [{ zh: '<code>hierarchy(data)</code>', en: '<code>hierarchy(data)</code>' }, { zh: '嵌套 data → parent/children/depth', en: 'nested data → parent/children/depth' }],
              [{ zh: '<code>tree().size()</code>', en: '<code>tree().size()</code>' }, { zh: 'Reingold-Tilford 树', en: 'Reingold-Tilford tree' }],
              [{ zh: '<code>cluster().size()</code>', en: '<code>cluster().size()</code>' }, { zh: '所有叶子对齐到同一深度', en: 'align all leaves to one depth' }],
              [{ zh: '<code>treemap / pack / partition</code>', en: '<code>treemap / pack / partition</code>' }, { zh: '面积布局：矩形树 / 打包圆 / 冰柱', en: 'area layouts: treemap / circles / icicle' }]
            ] }
        ]},
        { t: 'code', lang: 'js', title: { zh: '① hierarchy + tree 三步走（横向要 swap）', en: '① hierarchy + tree (swap for horizontal)' },
          code: `const root = d3.hierarchy(rootData);          // 1. 嵌套 JSON → 树
const lay  = d3.tree().size([360, 720])          // 2. 布局坐标
  .separation((a, b) => a.parent === b.parent ? 1 : 2);
const td = lay(root);

g.selectAll("path.link").data(td.links()).join("path")
  .attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x)); // ⭐ swap

g.selectAll("g.node").data(td.descendants()).join("g")
  .attr("transform", d => \`translate(\${d.y}, \${d.x})\`);   // ⭐ swap`,
          notes: [
            { type: 'why', h: { zh: '为什么 swap', en: 'Why swap' },
              x: { zh: 'd3.tree 里 <code>x</code> 是深度方向、<code>y</code> 是兄弟排布方向；画横向树（根在左、叶在右）时要在 <code>linkHorizontal</code> 与 <code>transform</code> 里把 x、y 对调。', en: 'In d3.tree, <code>x</code> runs along depth and <code>y</code> across siblings; for a horizontal tree (root left, leaves right) swap x and y in both <code>linkHorizontal</code> and <code>transform</code>.' } },
            { type: 'warn', h: { zh: 'separation', en: 'separation' },
              x: { zh: '<code>separation(a,b)</code> 返回兄弟间距倍数：同父兄弟用 1，非兄弟用 2 以防两棵子树粘连。值越小越挤、越大越宽。', en: '<code>separation(a,b)</code> returns a spacing multiplier: 1 for siblings, 2 for non-siblings so subtrees never merge. Smaller crowds the tree, larger spreads it.' } }
          ] },
        { t: 'demo', id: 'd02-3', title: { zh: '树布局算法分步构建（水平 / 垂直 / 放射）', en: 'Step-by-step tree layout (horizontal / vertical / radial)' },
          x: { zh: '单步播放，看节点从全部重叠 → 后序估算子树宽度 → 叶子定位 → 父节点归位消除重叠；再一键对比水平、垂直、放射三种布局，并拖动 separation 看兄弟间距变化。', en: 'Step through overlap → subtree-width estimation → leaf placement → parent placement; then compare horizontal, vertical and radial layouts and drag separation to change sibling spacing.' } }
      ]
    },
    {
      id: '2.4',
      title: { zh: '视图渲染与用户交互', en: 'View Rendering & Interaction' },
      sub: { zh: '视觉结构 → 视图渲染 + 动画 + 事件反馈循环', en: 'Visual structure → rendering + animation + event feedback' },
      blocks: [
        { t: 'theory', title: { zh: '动画是视图渲染的「时间维」', en: 'Animation is the time dimension of rendering' }, body: [
          { t: 'p', x: { zh: 'D3 用 <code>.transition().duration(ms)</code> 让属性从旧值平滑过渡到新值。动画不是花哨，而是渲染在时间上的展开：', en: 'D3 eases attributes from old to new with <code>.transition().duration(ms)</code>. Animation is not decoration — it is rendering spread over time:' } },
          { t: 'list', x: [
            { zh: '<code>duration=0</code>：瞬间跳变，看不出变化过程', en: '<code>duration=0</code>: instant jump, no process visible' },
            { zh: '<code>duration=500</code>：约 0.5 秒，展开/收缩/位移流畅可见', en: '<code>duration=500</code>: ~0.5s, expand/collapse/move is readable' },
            { zh: '<code>duration&gt;1500</code>：太慢，注意力开始流失', en: '<code>duration&gt;1500</code>: too slow, attention drifts' }
          ]}
        ]},
        { t: 'theory', title: { zh: 'DOM 事件三阶段与事件委托', en: 'DOM event phases and event delegation' }, body: [
          { t: 'list', x: [
            { zh: '捕获 capturing：window → document → … → 目标（从外到内）', en: 'Capturing: window → document → … → target (outside-in)' },
            { zh: '目标 target：目标元素本身', en: 'Target: the target element itself' },
            { zh: '冒泡 bubbling：目标 → … → document → window（从内到外），默认监听这一阶段', en: 'Bubbling: target → … → document → window (inside-out); the default phase' }
          ]},
          { t: 'table', head: [{ zh: '问题', en: 'Problem' }, { zh: '解法（事件委托）', en: 'Fix (delegation)' }],
            rows: [
              [{ zh: '1000 个 li 各绑 click → 慢、占内存', en: 'binding click to 1000 li is slow/memory-heavy' }, { zh: '给父元素 ul 只绑 1 次 click', en: 'bind one click on the parent ul' }],
              [{ zh: '新增 li 要重新绑定', en: 'new li need re-binding' }, { zh: '用 <code>e.target.closest(".leaf")</code> 找真正点击对象', en: 'use <code>e.target.closest(".leaf")</code>' }]
            ] },
          { t: 'p', x: { zh: '委托的优势：1 个监听器代替 N 个，且对未来新增的元素自动生效。', en: 'Delegation replaces N listeners with one and works for elements added later.' } }
        ]},
        { t: 'code', lang: 'js', title: { zh: '① 事件委托 + stopPropagation', en: '① Delegation + stopPropagation' },
          code: `// 单绑：每个叶子一个监听器（N 个）
leaf.on("click", onLeafClick);

// 委托：只在根上绑 1 个，靠冒泡 + closest 找目标
root.on("click", (event) => {
  const leaf = event.target.closest(".leaf");
  if (!leaf) return;
  onLeafClick(leaf.__data__);
});

// 某个祖先层阻断冒泡
blockLayer.on("click", (event) => event.stopPropagation());`,
          notes: [
            { type: 'why', h: { zh: 'stopPropagation 的意义', en: 'Why stopPropagation' },
              x: { zh: '比如点「折叠箭头」只想折叠、不想同时触发「选中」——在折叠监听器里 <code>stopPropagation()</code>，事件就不会继续冒泡到选中监听器。', en: 'Clicking a collapse caret should fold but not also select — call <code>stopPropagation()</code> there so the event never bubbles to the select handler.' } },
            { type: 'warn', h: { zh: '捕获 vs 冒泡', en: 'Capturing vs bubbling' },
              x: { zh: '<code>addEventListener(type, fn, true)</code> 第三参 true 才是捕获阶段；默认 false 是冒泡。需要在事件到达目标前拦截时用捕获。', en: '<code>addEventListener(type, fn, true)</code> listens to capturing; the default false is bubbling. Use capturing to intercept before the event reaches the target.' } }
          ] },
        { t: 'code', lang: 'js', title: { zh: '② transition + duration 让布局动画化', en: '② transition + duration for layout animation' },
          code: `// 树结构变化后全量重画，节点用 transition 平滑到新位置
node.attr("opacity", 0)
  .transition().duration(DURATION)
  .attr("transform", d => \`translate(\${d.y}, \${d.x})\`)
  .attr("opacity", 1);

// 滑块改 duration 后重放
d3.select("#dur").on("input", function () {
  DURATION = +this.value;
  render();
});`,
          notes: [
            { type: 'why', h: { zh: '全量重画的原因', en: 'Why redraw fully' },
              x: { zh: 'D3 没有「智能更新层级结构」的 API，树折叠/展开时全量重画最简单；靠数据绑定让节点在新旧位置间过渡。', en: 'D3 has no API to diff a changing hierarchy; on collapse/expand a full redraw is simplest, and data-join eases nodes between old and new positions.' } }
          ] },
        { t: 'demo', id: 'd02-4', title: { zh: '可折叠 DOM 树：捕获 / 冒泡 / 委托', en: 'Collapsible DOM tree: capture / bubble / delegation' },
          x: { zh: '点击一个学生叶子，观察事件沿 DOM 树自底向上逐层冒泡高亮；选择阻断层体会 stopPropagation；再切换「根节点事件委托」，看监听器数量从 N 个降到 1 个。', en: 'Click a student leaf and watch the event bubble up the DOM tree highlighting each ancestor; pick a blocking layer to see stopPropagation; then switch to root delegation and watch the listener count drop from N to 1.' } }
      ]
    }
  ],
  summary: {
    zh: [
      '三个模型描述同一条链路的三个侧面：Card 是管道、Mackinlay 是自动映射、van Wijk 是反馈环。',
      'd3.rollup 按 key 分桶再归约，返回嵌套 Map，对应 OLAP 的切片、切块、钻取；d3.group 保留原数组。',
      '树布局是用位置通道编码层级，Reingold-Tilford 三遍遍历在 O(n) 内消除重叠，d3.hierarchy 提供 tree/cluster/treemap/pack 全家桶。',
      '渲染在时间维上靠 transition 展开；交互依赖 DOM 事件三阶段，事件委托用 1 个监听器代替 N 个。'
    ],
    en: [
      'The three models describe one pipeline from three angles: Card the pipe, Mackinlay the auto mapping, van Wijk the feedback loop.',
      'd3.rollup buckets by key and reduces to nested Maps, mirroring OLAP slice/dice/drill; d3.group keeps the raw arrays.',
      'A tree layout encodes hierarchy with position; Reingold-Tilford removes overlap in O(n), and d3.hierarchy offers tree/cluster/treemap/pack.',
      'Rendering unfolds over time via transition; interaction relies on the three DOM event phases, and delegation replaces N listeners with one.'
    ]
  },
  quickref: [
    { tag: '2.1', x: { zh: '① marker 箭头 ② classed 状态 ③ 三模型叠加关系', en: '① marker arrows ② classed ③ the three models stack' } },
    { tag: '2.2', x: { zh: '① 变换四操作 ② rollup 嵌套 Map ③ 非贪婪正则提取专业', en: '① four ops ② rollup nested Map ③ non-greedy regex' } },
    { tag: '2.3', x: { zh: '① 图元/通道 ② 幅度 vs 标识 ③ Reingold-Tilford ④ 横向 swap', en: '① marks/channels ② magnitude vs identity ③ Reingold-Tilford ④ swap' } },
    { tag: '2.4', x: { zh: '① duration ② 事件三阶段 ③ 委托 closest ④ stopPropagation', en: '① duration ② three phases ③ delegation closest ④ stopPropagation' } }
  ],
  quiz: [
    { q: { zh: 'Card、Mackinlay、van Wijk 三个模型分别强调流程的哪一侧？', en: 'What does each of Card, Mackinlay and van Wijk emphasize?' },
      a: { zh: 'Card 强调分阶段的数据管道（原始→表→视觉结构→视图）；Mackinlay 强调为数据类型自动选最准的视觉通道；van Wijk 强调交互反馈环（View ⇆ Filter）。', en: 'Card: the staged data pipe; Mackinlay: auto-selecting the most accurate channel per data type; van Wijk: the interaction feedback loop (View ⇆ Filter).' } },
    { q: { zh: 'd3.rollup 和 d3.group 的返回值有什么关键区别？', en: 'What is the key difference between d3.rollup and d3.group?' },
      a: { zh: 'rollup 把每组用 reducer 归约成一个值，返回嵌套 Map；group 保留每组的原始数组，返回 Map<key, 元素数组>。', en: 'rollup reduces each group to one value via a reducer (nested Map); group keeps each group’s raw array (Map<key, array>).' } },
    { q: { zh: '画横向树时，linkHorizontal 和 transform 为什么要交换 d.x / d.y？', en: 'Why swap d.x and d.y for a horizontal tree?' },
      a: { zh: 'd3.tree 中 x 沿深度方向、y 沿兄弟排布方向；横向树要让深度沿屏幕水平方向，故用 x(d.y)、y(d.x) 对调。', en: 'In d3.tree, x runs along depth and y across siblings; a horizontal tree puts depth along screen x, so use x(d.y), y(d.x).' } },
    { q: { zh: '事件委托为什么能用 1 个监听器处理 N 个叶子？它依赖什么机制？', en: 'How can one listener handle N leaves via delegation, and what does it rely on?' },
      a: { zh: '依赖事件冒泡：把监听器挂在共同祖先，点击叶子后事件冒泡到祖先，用 e.target.closest() 找到真正的叶子；新增叶子也无需重新绑定。', en: 'It relies on bubbling: bind one listener on a common ancestor, and after the event bubbles up, use e.target.closest() to find the leaf; new leaves need no re-binding.' } }
  ]
};
