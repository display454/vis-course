# 05 · 实施报告（Implementation Report）

> 项目：《可视化导论》课程网站（`vis-site/`，纯静态零构建，部署 GitHub Pages）
> 范围：首页 `index.html` + 章节模板 `chapter.html` + 5 章 / 27 个 D3 演示
> 流程：现状审计 → 64 案例调研 → 16 条准则 → 像素级规范 → 改代码 → 两轮浏览器复验
> 日期：2026-10-18

---

## 一、总体结论

本轮不是推倒重做，而是在既有「数据驱动、中英双语、27 演示」架构上做**比例 / 布局 / 状态 / 移动端**的证据化精修。所有改动都能追溯到 `03-design-principles.md` 的准则编号（G1–G16）与 `02-design-research.md` 的方法编号（M1–M10）/ 参考案例。

**验收结果（真实浏览器，CDP 精确视口）**

| 验收项 | 结果 |
| --- | --- |
| 5 个视口（390 / 768 / 1024 / 1440 / 1920）截图 | 全部通过，无横向溢出（地图/宽表/宽图为设计内横向滚动） |
| 27 个 D3 演示全部渲染 | 5/4/8/5/5 全部成功，0 个红色异常（CDP 自动逐例核验） |
| P0 移动端表格竖排单字 | 已修复：横向滚动，表头不换行 |
| P0 移动端 Tab 文字被隐藏 | 已修复：图标在上、文字在下，三栏等宽 |
| P0 固定宽 SVG 三面板缩成 ~100px | 已修复：窄屏保底宽度 + 横向滚动 |
| P0 触控热区 <44px | 已修复：按钮/滑块/下拉 ≥42–48px |
| 知识地图上下 ~100/120px 空白 | 已修复：viewBox 1000×430 → 1000×266 |
| 卡片静态投影偏多 | 已修复：静态无阴影、hover 才上浮投影 |
| 键盘焦点环 / reduced-motion | 已具备（focus-visible 2.5px、动画 .01ms） |
| 零构建、无新依赖、无视频 | 满足：仅原生 CSS/JS + D3 CDN |

---

## 二、改动文件 ↔ 准则 ↔ 案例 映射表

| # | 文件 | 改动 | 准则 | 参考来源 |
| --- | --- | --- | --- | --- |
| 1 | `assets/css/tokens.css` | 新增布局/图表令牌：`--grid-line rgba(20,27,38,.06)`、`--axis-line rgba(20,27,38,.18)`、`--touch 44px`、`--section-y 80px`、`--map-pad 20px` | G4/G6/G10/G12 | Stripe Docs（触控 44px、靠明度分层）；Vega-Lite Axis（网格线弱于轴线）；Linear（96 区块节奏） |
| 2 | `assets/css/base.css` | 新增 `.tbl-scroll`（`overflow-x:auto`、圆角边框、9px 滚动条）；`.tbl-scroll .tbl{min-width:560px}`；`.tbl th{white-space:nowrap}`；≤640 单元 padding 9/12、滚动条高 9px | G1 | **Stripe Docs 宽表横滚不折行**；M1 容器层级 |
| 3 | `assets/js/core.js` | `case 'table'` 渲染容器由内联 `overflow-x:auto` 改为语义化 `.tbl-scroll`（quickref 两列快查表保留原内联，不强制 560） | G1 | Stripe Docs |
| 4 | `assets/css/components.css` | 侧栏单栏断点 920 → **1023**（与 Stripe `<1024` 抽屉一致）；顶部横向 chip 小节导航；**删除 ≤440 隐藏 `.label`**；≤640 Tab 改为「图标上/文字下」纵向、三栏 `min-height:48px`、12px；footer ≤640 改为 40/16 边距、1.8 行高；`select/range` 跟随主色 `accent-color`；演示按钮 ≥42px、select ≥40px | G2/G4/G14/G16 | Stripe Docs（<1024 抽屉、≥44px、触控）；Linear（五态、字号降一级）；M8 组件状态 |
| 5 | `assets/css/components.css`（复验补修） | 单栏列改为 `minmax(0,1fr)`，并给 `.lesson-content/.sidebar` 加 `min-width:0`，根治宽表把整列撑出视口（`scrollWidth` 628→390） | G1 | CSS Grid 经典防溢出（`min-width:auto` 归零），Stripe 列宽约束 |
| 6 | `assets/css/demos.css` | `.vx-scroll` 改 `--floor` 变量制：`>svg{width:max(100%,var(--floor))}`；桌面 `>760` 普通宽图 `--floor:0` 铺满；`.vx-scroll-always`（多列日历）桌面也保留；惯性滚动 + 4px 底距；坐标轴改用 `--axis-line`、网格 `--grid-line`；滑块/下拉跟随章节主色；按钮 ≥42px | G3/G4/G12/G15 | Vega-Lite Axis；Stripe（宽内容横滚、触控）；M6 图表轴色 |
| 7 | `assets/js/demos/_ui.js` | 重写 `svg(d3,stage,W,H,{scrollMin})`：显式 `scrollMin` 注入 `--floor` 并加 `.vx-scroll-always`；隐式在 `W≥760` 时按图宽给 floor（`W≥1000→920`，否则 760）；wrap 复用 `:scope > .vx-scroll`；宽高交给 CSS，不再写死属性 | G3/G15 | Stripe 横滚；M6 |
| 8 | `assets/css/home.css` | 区块节奏 `--section-y:80px`；区块头新增引导句样式、序号字距；`.map-wrap` 内边距令牌化、图例/提示收紧；`.ch-grid/.howto-grid/.about-grid{align-items:stretch}` 行内等高；卡片静态 `box-shadow:none`、hover 才上浮投影；`.section-head2 p` 次级引导文字；数字 `tabular-nums` | G6/G7/G8/G10/G13 | Linear（96 节奏、静态面阶、靠明度分层）；M7 卡片克制；M9 区块引导句 |
| 9 | `assets/js/home.js` | 知识地图 viewBox **1000×430 → 1000×266**，节点/主线/标签 y 全部重排；hero 底部代码注释 `#94a3b8 → #cdd2f2`、位置上移；「怎么用 / 关于」区块头各补一句引导文案（双语，内联 `L()`，未改 i18n） | G6/G8/G10/G13 | Linear（负字距、区块 96）；M9 |
| 10 | `assets/css/chapter.css` | Tab 吸顶让出导航高度的断点与侧栏统一为 **1023** | G16 | Stripe 断点一致 |

---

## 三、关键设计决策（像素级）

### 1. 宽表：横向滚动而不是把文字压成竖排（G1）
- 旧：390px 下表格无固定列宽、无滚动容器，四列被挤到 ~70px，`准确性 / 完整性 / 允许的运算` 逐字竖排。
- 新：`core.js` 输出 `.tbl-scroll`；表 `min-width:560px`、表头 `white-space:nowrap`，容器 `overflow-x:auto`。
- 复验：390 下 `scrollWidth=560 / clientWidth=298 / over=true`，而 `document.scrollWidth=390`（横滚被限制在表格内部，不污染整页）。

### 2. 三视图 Tab：任何宽度都保留文字（G2）
- 旧：`≤440px` 直接 `.label{display:none}`，三个 Tab 只剩图标，教学含义丢失。
- 新：`≤640px` 按钮纵向排列（图标 16px + 文字 12px）、`min-height:48px`、`padding:6px 4px`。
- 复验：390 下三个按钮各 **109px**（讲解 / 关键代码 / 演示），`right=361 < 390`，全部可见。

### 3. 宽 SVG：窄屏保底可读宽度 + 横滚（G3）
- 旧：d03-1 三个 3D 色空间固定约 1060px 宽，390 下整体缩到 ~100px/面板，轴标签无法读。
- 新：`_ui.svg` 按图宽注入 `--floor`（≥1000px 宽图保底 920px，其余 760px；多列日历用显式 `scrollMin` 保留完整宽度）；桌面 ≥761px 普通宽图 `--floor:0` 正常铺满，不制造无谓滚动。
- 复验：d03-1（920 保底）、d04-2（760 保底）、d05-5（显式 scrollMin）在 390 下轴/标注均为原字号可读，右侧内容可横滑；d03-1 在 1440 桌面仍铺满。

### 4. 触控目标与控件跟色（G4/G14）
- 演示按钮 `.vx-btn` 与 `.demo-btn` 窄屏 `min-height:42px`（Tab 48px）；`select min-height:40px`；滑块/下拉 `accent-color:var(--accent/--acc)`，原生控件从默认蓝改为章节主色。
- 焦点：`:focus-visible` 2.5px 章节色描边 + 2px offset（base 与 demos 各一套）。

### 5. 首页比例与留白（G6/G7/G8/G10）
- 知识地图高度 430→266，消除上下各约 100/120px 空带；节点内文字/标签坐标重排。
- 区块纵向间距由偏长的 88px 收紧为令牌 `--section-y:80px`；区块头补一行次级引导句（`--ink-3` / `fs-sm` / 1.65），并给序号加字距。
- 三类卡片网格 `align-items:stretch` 行内等高；静态统一去除投影、改用 1px 边框分层，仅 hover 上浮 + 章节色描边和投影（Linear「靠明度分层、克制阴影」）。
- hero 统计数字加 `tabular-nums`；hero 代码注释对比度过低（#94a3b8）改为 #cdd2f2。

---

## 四、两轮截图迭代记录

### 第一轮（after1）发现的问题
- 1440 首页/章节、1920、1024、768、390 首页、390 宽图演示均达标。
- **发现 1 个真实缺陷（P0 级）**：390 章节页三视图 Tab 第三项「演示」被切到右缘，整页 `scrollWidth=628`。
- 根因：单栏布局 `.lesson-shell{grid-template-columns:1fr}` 等价于 `minmax(auto,1fr)`，宽表 `min-width:560px` 的最小内容尺寸沿网格列向上传播，把内容列整体撑到 604px（宽表横滚容器虽在，但没拦住网格列的 min-content）。

### 第一轮 → 修复
- `components.css` 单栏列改为 `grid-template-columns:minmax(0,1fr)`，并给 `.lesson-content、.sidebar` 加 `min-width:0`。

### 第二轮复验
- 390 章节页：`document.scrollWidth` **628 → 390**，`bodyOver=false`；Tab 容器 342、三按钮各 109px、第三项 `right=361` 全部可见；宽表 `clientWidth=298 / scrollWidth=560` 仅在表格内部横滚。
- 重拍 390 章节页全页（6973px）：Tab、表格、速查、自测、下一章、footer 均正常。
- 其余视口（1440/1920/1024/768）与桌面演示不受影响，保持第一轮达标状态。

### 截图证据
- 优化前：`_shots/audit/`（`true-home-390_p1/p2`、`true-ch01-390_p1/p2`、`true-d031-390`、各断点 `before-*`）
- 优化后：`_shots/after1/`（`after-home-1440/1920/1024/768`、`after-ch01-1440/1024/390`、`after-d031-390`、`after-d021-390`、`after-d042-390`、`after-d055-390`）
- 典型前后对比：
  - `true-d031-390.png`（三面板缩成 ~100px）→ `after-d031-390.png`（920 保底横滚、轴可读）
  - `true-ch01-390_p1.png`（Tab 仅图标、表格竖排）→ `after-ch01-390_p1.png`（图标+文字三栏、表格横滚）

---

## 五、自动化 / 回归核验

1. **27 个演示逐例渲染**（CDP 注入脚本，等待 `ready` 后统计 svg / canvas / 流水线 DOM / 异常 `<pre>`）：
   - 第 1 章 5/5、第 2 章 4/4、第 3 章 8/8、第 4 章 5/5、第 5 章 5/5，**0 失败**。
   - 其中 d01-1、d01-4、d02-4、d04-1、d05-1 为 HTML 卡片/Canvas/时间轴流水线（无 svg 属正常），已二次核验均有完整非空 DOM。
2. **横向溢出**：390 首页/章节 `document.scrollWidth === clientWidth`；地图（≤860）、宽表、宽图的横滚均为容器内设计内滚动。
3. **可访问性**：`focus-visible` 焦点环存在；`prefers-reduced-motion:reduce` 下动画/过渡降至 .01ms、`scroll-behavior:auto`；截图以 `--force-prefers-reduced-motion` 拍摄。
4. **断点行为**：390（单栏 + 顶部横滑小节 + 纵向 Tab）、768（hero 叠栏、地图横滚保可读）、1024（保留 272 侧栏）、1440（内容 880/最大 1200）、1920（容器居中不拉伸）。
5. **无新增依赖、无视频、无构建步骤**；所有路径相对，D3 仍走 jsDelivr，字体走自托管镜像。

---

## 六、遗留与取舍（如实记录）

1. **768 平板知识地图保留横向滚动**：地图 viewBox 收窄后，若在 768 强制全缩放，标签文字会降到 ~8px；故维持 ≤860 横滚、820 保底（标签 ≈10–13px 可读），以切边作为自然滚动提示。这是可读性优先的取舍。
2. **首页 bento 跨行不做等高**：`3+2` 布局下第一行卡片内容自然更高，第二行仅 2 卡；已用行内 `align-items:stretch` 保证**同一行**等高、「进入章节」按钮贴底，未强行拉平两行，避免大量空白。
3. **d01-1 双栏机器动画**在 390 维持其内部 4 列 `min-width:150px` 横滚（教学需要同时看到四个阶段），属演示级设计内滚动。
4. 未改动任何教学文案、数据、接口与演示交互逻辑；中文为主的结构未做英文长词专项（英文为次要形态，结构同构）。

---

## 七、交付物

- 5 份过程文档：`01-ui-audit.md`、`02-design-research.md`、`03-design-principles.md`、`04-ui-specification.md`、`05-implementation-report.md`（本文件）。
- 源码：重新打包 `vis-site-source.zip`（含 5 份 ui-optimization 文档，已排除 `_*` 临时脚本/测试页与 `_shots`）。
- 前后截图：`_shots/audit/`（前）、`_shots/after1/`（后）。
