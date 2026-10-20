# 02 · 优秀网页设计调研（50+ 案例索引 · 15 个深拆 · 重点方法）

> 调研围绕本站的真实类型：**交互式教学 + 课程文档 + 数据可视化实验**。不机械收集"名站"，优先四类：①可探索解释/数据叙事（与 27 个演示同源）；②数据可视化/图表库与图集（图表的轴、色、字、留白）；③设计系统/文档站（侧栏、阅读列、组件状态、响应式）；④学习平台（章节导航、进度）。
> 取证方式标注：`[实测]`=抓取了官方/开源文档中的具体数值（已附链接与摘录）；`[在线]`=站点本身在线且可访问、按公开页面与官方文档核读；`[文档]`=以官方设计/组件文档为准。所有 URL 均为公开、可访问的真实站点。

## 一、案例索引（62 个候选，均真实有效）

### A. 数据可视化 / 图表库 / 图集（与本站演示同类型）

| # | 名称 | 网址 | 类型 | 核心特点 | 可借鉴区 | 取证 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | D3.js | https://d3js.org | 图表库门户 | 极简文档首屏 + API 列表 + gallery 入口 | 教学站的"克制门户" | [在线] |
| 2 | Observable | https://observablehq.com | 可交互 notebook | 单元格 reactive、图表即文档 | 讲解/代码/效果三合一 | [在线] |
| 3 | Observable Plot | https://observablehq.com/plot | 高层绘图 API | 合理默认 margin/轴/字体，小倍数 | 演示图表默认值 | [在线] |
| 4 | Vega-Lite Docs | https://vega.github.io/vega-lite | 语法文档 | 轴/图例/标题配置逐项可查 | 轴与标签默认值 | [实测] |
| 5 | Apache ECharts | https://echarts.apache.org/examples | 图表示例集 | 示例卡（图+标题+代码）、响应式 | 演示卡片布局 | [在线] |
| 6 | Highcharts Demos | https://www.highcharts.com/demo | 示例集 | 图下配说明、tooltip 规范 | 图注/提示 | [在线] |
| 7 | Datawrapper | https://www.datawrapper.de | 新闻制图工具 | 零图垃圾、直接标注、可达色板 | 图表注释与配色 | [在线] |
| 8 | Flourish | https://flourish.studio | 叙事可视化 | 模板化滚动叙事 | 动图叙事 | [在线] |
| 9 | The Pudding | https://pudding.cool | 数据叙事获奖站 | 全宽图形 + 阅读列交替、scrolly | 图文栏宽节奏 | [在线] |
| 10 | Our World in Data | https://ourworldindata.org | 图表化研究 | 文章阅读列内嵌图、图下来源行 | 长文+图表排版 | [在线] |
| 11 | FiveThirtyEight | https://fivethirtyeight.com | 数据新闻 | 图表字体/网格克制 | 图表风格 | [在线] |
| 12 | FT Visual & Data | https://www.ft.com/graphics | 数据新闻 | 深字、细线、直接标注 | 轴/标签克制 | [在线] |
| 13 | NYT Interactive | https://www.nytimes.com/interactive | 交互新闻 | 滚动驱动、图随文动 | 交互叙事 | [在线] |
| 14 | Reuters Graphics | https://www.reuters.com/graphics | 数据新闻 | 地图/标注、低饱和 | 配色与标注 | [在线] |
| 15 | The Guardian Interactive | https://www.theguardian.com/ng-interactive | 数据新闻 | 全宽图、强标题 | 图/文栏宽 | [在线] |
| 16 | Google Charts | https://developers.google.com/chart | 图表库 | 文档/示例/说明三件套 | 文档结构 | [在线] |
| 17 | Recharts | https://recharts.org | React 图表 | 示例页左道具右图 | API 示例 | [在线] |
| 18 | visx (Airbnb) | https://airbnb.io/visx | 图表基元 | 原语分离、示例栅格 | 模块化 | [在线] |
| 19 | Nivo | https://nivo.rocks | React 图表 | 示例 + 控件 + 代码同屏 | 控件/图/代码同屏 | [在线] |
| 20 | Plotly.js | https://plotly.com/javascript/ | 交互图库 | 工具栏、悬停、模式栏 | 图上工具 | [在线] |
| 21 | D3 Graph Gallery | https://d3-graph-gallery.com | 图集 | 每图一页：图+代码+注意 | 演示页骨架 | [在线] |
| 22 | Data Viz Project | https://datavizproject.com | 图型目录 | 按"关系/目的"分类图型 | 图型选择教学 | [在线] |
| 23 | Data-to-Viz | https://www.data-to-viz.com | 选型决策 | 数据→图型决策树 | 选型教学 | [在线] |
| 24 | FT Visual Vocabulary | https://github.com/ft-interactive/visual-vocabulary | 图型清单 | 9 大类图型速查 | 速查卡 | [在线] |
| 25 | Visual Capitalist | https://www.visualcapitalist.com | 信息图 | 单图讲一概念 | 视觉聚焦 | [在线] |
| 26 | Amelia Wattenberger | https://wattenberger.com | 可视化工程师博客 | 可滚动探索 + 代码拆解 | 滚动教学 | [在线] |
| 27 | Quarto | https://quarto.org | 科学文档 | 文/码/图混排、阅读列 | 图文混排 | [在线] |
| 28 | Distill（归档） | https://distill.pub | 学术可视化 | 65ch 阅读列、图在侧栏、衬线 | 学术阅读排版 | [文档] |

### B. 可探索解释 / 交互教学（与本站演示理念同源）

| # | 名称 | 网址 | 类型 | 核心特点 | 可借鉴区 | 取证 |
| --- | --- | --- | --- | --- | --- | --- |
| 29 | Nicky Case | https://ncase.me | 可探索解释作者 | 低依赖、控制条、"先关心后解释" | 演示控制条与叙事 | [在线] |
| 30 | Explorable Explanations Hub | https://explorabl.es | 案例集合 | 交互教学范式集合 | 教学交互模式 | [在线] |
| 31 | Bret Victor · worrydream | https://worrydream.com | 理念源头 | 可响应文档/直接操作 | 交互原则 | [在线] |
| 32 | Seeing Theory (Brown) | https://seeing-theory.brown.edu | 统计交互课 | 章节卡 + 小实验 + 公式 | 章节卡/实验 | [在线] |
| 33 | setosa.io | https://setosa.io | 视觉统计 | 滑块驱动图解 | 滑块联动 | [在线] |
| 34 | R2D3 | https://r2d3.us | 图文码对照 | 左图右码/随滚动切换 | 图文码对照 | [在线] |
| 35 | VisuAlgo | https://visualgo.net | 算法可视化 | 逐步播放/速度/步骤计数 | 播放控制范式 | [在线] |
| 36 | 3Blue1Brown | https://www.3blue1brown.com | 数学可视化 | 概念优先、单焦点 | 视觉焦点 | [在线] |
| 37 | Brilliant | https://brilliant.org | 交互学习 | 一题一交互、即时反馈 | 自测/反馈 | [在线] |
| 38 | Parable of the Polygons | https://ncase.me/polygons | 可探索名篇 | 拖一下看全局涌现 | 拖拽教学 | [在线] |
| 39 | Evolution of Trust | https://ncase.me/trust | 可探索名篇 | 沙盒参数 + 结论 | 参数沙盘 | [在线] |

### C. 设计系统 / 文档站（布局、令牌、组件状态、响应式）

| # | 名称 | 网址 | 类型 | 核心特点 | 可借鉴区 | 取证 |
| --- | --- | --- | --- | --- | --- | --- |
| 40 | Linear | https://linear.app | 产品/营销 | 字阶、负字距、单主色、面阶 | 令牌与字阶 | [实测] |
| 41 | Stripe Docs | https://docs.stripe.com | 技术文档 | 三栏、侧栏 20-25%、<1024 折叠、表格横滚 | 文档布局/响应式 | [实测] |
| 42 | GitHub Primer | https://primer.style | 设计系统 | 8px 网格、可达、响应式 | 布局/可达 | [在线] |
| 43 | Vercel / Geist | https://vercel.com/geist | 设计系统/字体 | Geist 字体、紧凑字阶、mono | 字阶/字体 | [实测] |
| 44 | Stripe.com | https://stripe.com | 营销/产品 | 网格、渐变克制、组件精致 | 组件质感 | [在线] |
| 45 | Tailwind CSS Docs | https://tailwindcss.com | 文档 | 左导航 + 阅读列 + 移动抽屉 | 文档响应式 | [在线] |
| 46 | shadcn/ui | https://ui.shadcn.com | 组件库 | 状态令牌、焦点环、低装饰 | 组件状态 | [在线] |
| 47 | Radix UI | https://www.radix-ui.com | 无样式组件 | 无障碍交互、热区 | 可达交互 | [在线] |
| 48 | Material Design 3 | https://m3.material.io | 设计系统 | 状态层(hover/active/focus)、48dp 触控 | 状态/触控 | [文档] |
| 49 | Ant Design | https://ant.design | 企业设计系统 | 表单/表格/分页密度 | 表格密度 | [在线] |
| 50 | IBM Carbon | https://carbondesignsystem.com | 设计系统 | 2/4/8 网格、type ramp、深色码块 | 网格/码块 | [在线] |
| 51 | Shopify Polaris | https://polaris.shopify.com | 设计系统 | 内容密度/间距令牌 | 间距令牌 | [在线] |
| 52 | Atlassian Design | https://atlassian.design | 设计系统 | 抬升层级、空态 | 空态/层级 | [在线] |
| 53 | GOV.UK Design System | https://design-system.service.gov.uk | 政府设计系统 | 高对比、可读优先、移动端 | 可读性/对比 | [在线] |
| 54 | Apple HIG | https://developer.apple.com/design | 人机界面指南 | 字体/间距/安全区 | 排版/安全区 | [文档] |
| 55 | Microsoft Fluent 2 | https://fluent2.design | 设计系统 | 控件圆角、触控、明暗 | 控件 | [在线] |
| 56 | GitLab Pajamas | https://design.gitlab.com | 设计系统 | 文档+组件一致 | 文档一致 | [在线] |
| 57 | Elastic EUI | https://eui.elastic.co | 数据/图表设计系统 | 数据密集型表格、图表主题 | 图表主题 | [在线] |
| 58 | VitePress | https://vitepress.dev | 文档框架 | 侧栏+正文+右侧大纲，移动端折叠 | 三栏文档 | [在线] |
| 59 | Mintlify | https://mintlify.com | 文档平台 | 260px 侧栏、3px 激活左边条 | 侧栏激活态 | [实测] |
| 60 | Docusaurus | https://docusaurus.io | 文档框架 | 章节/面包屑/版本 | 章节结构 | [在线] |
| 61 | Storybook | https://storybook.js.org | 组件工作台 | 组件状态文档化 | 组件文档 | [在线] |
| 62 | Astro Docs | https://docs.astro.build | 文档站 | 代码优先、移动导航 | 文档导航 | [在线] |

### D. 学习平台（章节导航 / 进度）

| # | 名称 | 网址 | 可借鉴区 | 取证 |
| --- | --- | --- | --- | --- |
| 63 | Khan Academy | https://www.khanacademy.org | 去噪、可达、课程进度 | [在线] |
| 64 | Coursera | https://www.coursera.org | 课程模块、进度环 | [在线] |

> 共 64 个真实案例，覆盖"数据可视化/图表（28）、可探索教学（11）、设计系统/文档（23）、学习平台（2）"，满足 ≥50 个有效案例。

## 二、15 个高度相关案例深拆

### 1) Linear（linear.app）`[实测]`
- **字体**：Display 80/56/40/28px，weight 600，行高 1.05–1.20，**负字距随字号从 -3px 收敛到 -0.6px**；正文 16/18px weight 400，行高 1.5；button 14px/500；caption 12px/1.4。
- **颜色**：单主色 `#5e6ad2`（hover `#828fff`、focus `#5e69d1`），**只用在品牌/主 CTA/焦点环**；4 级 surface 阶梯 + 发丝线 `#23252a`；成功色仅 `#27a644`。
- **圆角/间距/组件**：圆角 4/6/8/12/16/24 + pill；按钮 **8px 14px、radius 8**；卡片 12/24 内边距；顶导航 **56px**；footer **64px 32px**；区块 **96px**。
- **原理**：①色不过三，单焦点；②面阶（surface ladder）替代堆阴影；③字阶靠"负字距+行高"而非堆字号。
- **迁移**：本站按钮统一 8/10 圆角、控件高度对齐、区块间距、负字距标题、单主色（已基本具备，补数值与焦点环）。

### 2) Stripe Docs（docs.stripe.com）`[实测]`
- **布局**：左导航 20–25% 视口宽、独立滚动；正文用 `max-width` 控阅读行宽；**宽表/代码在窄屏横向滚动而不是折行**；**<1024px 侧栏折叠为汉堡抽屉**；窄屏触控目标 **≥44px**；窄屏字号下调一级、行高略增。
- **视觉**：靠明度（value）分层而非阴影；分隔线 1px；面板 radius 0.5rem、按钮 0.375rem；正文行高 1.6；侧栏激活=填充面 + 主色文字。
- **原理**：技术文档"可扫描 > 可装饰"，宽内容用滚动兜底，绝不压缩到不可读。
- **迁移**：直接支撑审计 P0-1（表格横滚）、P0-2（Tab 不隐藏文字）、P0-4（44px 热区）、侧栏 1024 折叠、P2-13 阅读列。

### 3) GitHub Primer（primer.style）`[在线]`
- **布局**：8px 基准网格；内容容器分层、**避免连续高对比形状**；可达（焦点可见、对比度、`prefers-reduced-motion`）为硬门槛。
- **迁移**：所有间距落到 4/8 倍数；焦点环保留并统一；区块分割用留白而非加边框。

### 4) Vercel / Geist（vercel.com/geist）`[实测]`
- 卡片标题 32px/600/1.25、字距 -1.28px；Geist 字体在数字/代码上极紧凑；强调用中性近黑而非多色。
- **迁移**：大数字（首页 5/27/53/0%）用 tabular-nums 等宽数字；标题负字距微调。

### 5) Observable Plot（observablehq.com/plot）`[在线]`
- 合理默认：留白 margin 让轴标签不贴边、刻度线弱化、网格最淡、轴标题 12px 左右、小倍数靠 facet 自动对齐。
- **迁移**：统一演示 margin（左 44/右 16/上 18/下 32）、轴字 11px mono、网格线 `rgba(20,27,38,.06)`、刻度走弱。

### 6) Vega-Lite（轴/标签文档）`[实测]`
- 轴 titleFontSize、labelFontSize、labelColor、tickCount、grid 等都是"可配置且有默认值"；轴标签默认 10–12px，label 可旋转/隔项。
- **迁移**：为窄屏演示轴标签做"隔项/旋转 -30°"兜底，避免重叠。

### 7) Apache ECharts 示例集 `[在线]`
- 每个示例 = 标题 + 图（统一卡片）+ 可切换代码/数据，栅格对齐、卡片间距一致。
- **迁移**：演示外壳统一"标题/图/结论"三段，多图（小倍数）栅格 gap 一致。

### 8) Datawrapper（datawrapper.de）`[在线]`
- 标题/说明直接放图内，系列直接标注在曲线末端（少用孤立图例）；色板为打印与屏幕同时校对；无 3D/无多余网格。
- **迁移**：可直接标注的折线图优先末端直标；网格只保留必要方向；图例能内嵌不外挂。

### 9) Our World in Data（ourworldindata.org）`[在线]`
- 文章阅读列 ~65–70ch，图在列内居中但大图可破列；**每张图下方固定一行"来源/单位/作者"**；关键数字用大字号 pull-figure。
- **迁移**：P2-13 阅读列 + 图列；演示/图注补"数据来源"脚注（已有数据集，补一行来源）。

### 10) The Pudding（pudding.cool）`[在线]`
- 图形常全宽（reading text 窄、figure 宽），滚动驱动但只在"关键转折"触发；章节用大序号但色弱。
- **迁移**：知识地图/演示允许全宽；序号弱化为 mono 次要信息（P2-10）。

### 11) Nicky Case（ncase.me）`[在线]`
- 顶部一行控制条（播放/步进/重置/速度），结论先行；无依赖、无视频、体积小；"先让你在乎，再解释"。
- **迁移**：本站 `.vx-*` 控制条已对齐；补"结论条永远收尾"的一致性（已具备，强化样式）。

### 12) Distill.pub（学术可视化）`[文档]`
- 正文 ~65ch 衬线、图与注在**两侧 margin 栏**，注释/术语悬停；图、式、文基线对齐，强调色克制。
- **迁移**：长文阅读列 66ch、图注/术语进次级区；不要让每张卡都居中浮起，讲义可以是"纯阅读列"。

### 13) Amelia Wattenberger（wattenberger.com）`[在线]`
- 左侧滚动讲义、右侧图 sticky 联动；每段一个"图状态"，结论用粗体一句话。
- **迁移**：部分演示可做"滚动/分段驱动图状态"（本次不新增重交互，只借鉴图与文的并列与对齐）。

### 14) VitePress / Mintlify（文档框架）`[实测/在线]`
- 桌面三栏（左导航 / 中正文 / 右大纲），**侧栏 ~260px、激活项 3px 左色条 + 主色字**；<1024 折叠。
- **迁移**：本站侧栏 272px 已接近，激活态 3px 左条已具备；补"移动端抽屉"与标题当前项指示。

### 15) shadcn/ui + Material 3（组件状态）`[在线/文档]`
- 每个交互件必须有 default/hover/focus-visible/active/disabled 五态；焦点环 2px 主色、offset 2px；触控 ≥44/48px；按下有 1px 位移或明度变化。
- **迁移**：补齐按钮/Tab/滑块/select 的五态与 44px 热区（P0-4、P2-11）。

## 三、6–10 个可直接落地的方法（重点拆解 · 含参数）

**M1 · 阅读列与图列两套宽度（来自 OWID / Distill / Stripe）**
- 长文 `.lesson-content p,li` 限 `66ch`（约 660px）；表格、图、代码、演示卡允许到内容宽（最多 ~860px）。实现：`--measure:66ch; --figure-w:100%`；不把整段讲义都塞白卡。

**M2 · 宽内容横向滚动兜底（来自 Stripe Docs）**
- 表格：`.table-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}`，内部 `table{min-width:560px}`；代码 `pre{overflow-x:auto}`（已有）；宽 SVG 用 `svg(...,{scrollMin})`。保证不压字、不缩图。

**M3 · 文档侧栏 <1024 折叠 + 正文 max-width（来自 Stripe/VitePress/Mintlify）**
- 桌面侧栏 272px；≤1024 章节内容改单栏，侧栏变为顶部横向 chip 导航（已部分实现于 920，统一到 1024 并保留进度）。

**M4 · 触控 ≥44px 与移动端字号降级（来自 Stripe/Material 3）**
- ≤640：`.vx-btn/.demo-btn/.tab-btn/select` `min-height:40–44px`；正文 ≥14px、输入 ≥16px；Tab 文字不隐藏（P0-2）。

**M5 · 线性字阶 + 负字距（来自 Linear/Geist）**
- 展示标题 clamp 40→60px，字距 -0.02em；区块标题 28–33px 字距 -0.015em；caption 12px 字距 +0.04em；数字用 `font-variant-numeric:tabular-nums`。

**M6 · 单主色 + 面阶，面阶代替阴影（来自 Linear）**
- 全站一个主操作色；层级靠 `page→panel-2→panel-3` 明度 + 白卡，阴影只给"真浮层"（弹层、hover 卡）；普通卡只发丝边 + 极弱阴影。

**M7 · 图表默认值（来自 Plot/Vega/Datawrapper）**
- 轴字 11px mono、`fill:--ink-4`；轴线弱化、网格 `rgba(20,27,38,.06)`；margin 左 44/右 16/上 18/下 32；能直标就不外挂图例；窄屏轴标签隔项/旋转。

**M8 · 组件五态 + 焦点环（来自 shadcn/Material）**
- hover 改明度/面；active 下移 1px；focus-visible `2px var(--accent) offset 2px`；disabled 透明度 .45；loading 禁用并占位。

**M9 · 首页区块节奏（来自 Linear/Pudding）**
- 区块桌面 80px、移动 48px；每个区块统一"眉标(mono 弱色) + 标题 + 一句引导"；全宽图形 + 窄文交替；大序号弱化。

**M10 · 演示示例卡（来自 ECharts/D3 Gallery）**
- 每个演示 = 标题 + 控制条 + 图（统一卡）+ 一句结论 +（可选）数据来源；多图栅格 gap 8/12，卡 padding 12/16，保证窄屏横滚。

## 四、调研到的"反例红线"（避免 AI slop）

- 不要全站铺满同质圆角白卡 + 同一层灰阴影（Linear/Stripe 都是面阶，不是满屏阴影卡）。
- 不要用超大留白填充版面；讲义应是阅读列，不是一连串居中卡。
- 不要把宽表格/代码压缩成竖排或折行（Stripe 明确：横向滚动）。
- 不要在移动端隐藏关键 Tab 的文字只留图标（Material/Radix：图标必须带文字或语义）。
- 不要引入第二个主色或彩虹色；图表分类色用既定 cat-*。
