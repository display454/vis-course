# 04 · 像素级 UI 实施规范（UI Specification）

> 本规格是"可以直接照着写 CSS/改结构"的工程单。数值与令牌优先沿用 `tokens.css` 既有变量；新增值在末尾"新增令牌"列出。断点规范为 **1920 / 1440 / 1024 / 768 / 390**（对齐审计视口）。所有尺寸含移动端触控要求。

## 1. 页面整体布局

### 1.1 全局容器
- 版心：`--maxw: 1200px`；左右内边距：桌面 `24px`（≥1024）、平板 `20px`（768–1023）、移动 `16px`（≤640）。
- 页面底 `--page:#eef1f5`；白卡 `--bg:#fff`；发丝线 `--border: rgba(20,27,38,.09)`。
- `body` 最小宽度不设；`overflow-x: hidden` 作为**兜底**（但根因——宽内容——必须用横滚容器解决，不依赖隐藏）。

### 1.2 顶部导航（`.topnav`）
- 高度：桌面 64px；≤760 换两行（品牌+语言第一行，链接横向滚动第二行），每行高 auto、上下 padding 11px。
- 内边距：`0 24px`（桌面）；链接 padding `8px 13px`、radius 8；激活 `background:var(--accent-soft);color:var(--accent)`。
- 语言分段：高 32px（桌面），按钮 `6px 14px`；激活实黑 `#14171c`。
- 层级：`z-index:200`；毛玻璃 `backdrop-filter: blur(12px)`（已具备）。

### 1.3 首页
- Hero：桌面 `padding:84px 24px 76px`；≤960 单列、`padding:64px 16px 56px`；两列 `1.02fr/.98fr`、gap 48px。
- 区块 `.section`：桌面 `padding:80px 24px`（由 88 收紧），≤640 `padding:48px 16px`；区块之间不再额外加 margin。
- 区块头 `.section-head2`：底距 40px（桌面）/28px（移动）；统一三行：眉标（mono，`01`）→ 标题（33px）→ 引导句（≤640px）。
- 知识地图 `.map-wrap`：padding 20px（桌面）/14px（≤640）；内部图例贴顶、提示贴底，SVG 上下留白由现状压缩（移除大段空 `g` 间距，见实施）。
- 章节卡 `.ch-grid`：12 列、gap 20px；前三 `span4`、后两 `span6`；`align-items:stretch`；卡片内 `.desc{flex:1}`，`.go` 置底。
  - 断点：≤1099 为 6/6/6/6/12（末张全宽）；≤720 全 `span12`。
- "怎么用" `.howto-grid`：桌面 4 列 gap16；≤960 2 列；≤640 1 列。
- 关于 `.about-grid`：2 列；≤960 1 列。

### 1.4 章节页（`.lesson-shell`）
- 桌面（≥1024）：`grid-template-columns: 272px minmax(0,1fr)`；gap 40px；外层 `padding:48px 24px 64px`。
- 侧栏 sticky：`top:calc(64px + 24px)`；激活项 3px 左色条 + 主色字（已具备）。
- **≤1024 折叠为单栏**：侧栏变为顶部横向 chip 导航（含进度），沿用现有 ≤920 样式，把断点统一到 1024。
- 阅读列：`--measure:66ch`（仅作用于 `p/li`）；图列 `.codeblock/.tbl-scroll/.demo-card/.callout/figure` 最大 `100%`（内容列约 860px）。
- 三视图 Tab：`position:sticky;top:64px`；轨道 `--panel-3`，padding 5px，radius 12；按钮高 40px（桌面）/48px（≤640，图标+文字）。
- 小节 `.section` 间距 48px；`scroll-margin-top:calc(64px + 56px)`。

### 1.5 栅格/断点总表
| 视口 | 章节框架 | 首页 bento | 怎么用 | 视图 Tab | 表格/宽图 |
| --- | --- | --- | --- | --- | --- |
| ≥1440 | 272 侧栏 + 内容 | 4+4+4 / 6+6 | 4 列 | 横排带字 | 全宽，不滚动 |
| 1024–1439 | 272 侧栏 + 内容 | 6/6/6/6/12 | 4 列 | 横排带字 | 全宽 |
| 768–1023 | 单栏 + 顶部横向章导航 | 6/6/6/6/12 | 2 列 | 横排带字 | 超宽横向滚动 |
| 390–767 | 单栏 + 横向 chip | 全宽 1 列 | 1 列（≤640） | 图标+文字（不降字隐藏） | 横向滚动，min-width 560 |

## 2. 字体与颜色

### 2.1 字阶（px / 行高 / 字重 / 字距）
| 角色 | 字号 | 字重 | 行高 | 字距 | 字体 |
| --- | --- | --- | --- | --- | --- |
| Hero 大标题 | clamp(38px, 4.8vw, 60px) | 700/800 | 1.08 | -0.025em | display |
| 区块 H2 | 33px（≤640 25px） | 700 | 1.18 | -0.02em | display |
| 小节 H2 | 25px | 700 | 1.22 | -0.015em | display |
| 小节 H3/H4 | 17/20px | 700 | 1.35 | -0.01em | display |
| 正文 | 15.5px（≤640 15px） | 400 | 1.72 | 0.003em | sans |
| 卡片描述 | 13.5px | 400 | 1.62 | 0 | sans |
| 眉标/序号 | 12px | 700 | 1.3 | +0.08em（中文）/+.12em | mono/sans |
| 图表轴字 | 11px | 400 | 1.2 | 0 | mono |
| 代码块 | 13px | 400 | 1.7 | 0 | mono |
| 大数字 | 34px（≤640 28） | 800 | 1 | -0.02em | display，**tabular-nums** |

- 所有统计/百分比/坐标轴数字加 `font-variant-numeric: tabular-nums`。
- 禁止全大写中文；英文眉标可用 uppercase（仅 12px）。

### 2.2 颜色（沿用 tokens，新增图表网格色）
- 文字：`--ink-1 #14171c`（标题）、`--ink-2 #333a46`（正文）、`--ink-3 #566175`（次级）、`--ink-4 #6f7c91`（轴/caption）。正文对 `#fff` 对比 ≥ 9:1，`--ink-3` 对 `#fff` ≈ 5.4:1（过 4.5）。
- 主色：`#4a46c9`（hover `#3a36a6`）；五章身份色见 tokens；语义 ok `#1f7a4d`/bad `#b3382c`/warn `#a85e12`/info `#0e6e92`。
- 新增：`--grid-line: rgba(20,27,38,.06)`（图表网格）、`--axis-line: rgba(20,27,38,.18)`（坐标轴线）、`--touch:44px`（触控尺寸令牌）。

## 3. 组件级规范（含五态）

### 3.1 按钮
| 类型 | 高/内边距 | 字号/字重 | 圆角 | 默认 | hover | active | focus-visible | disabled |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 主 `.btn-primary` | 40 / 11px 20px | 13.5/600 | 10 | `accent` 底白字 | 深一档 + 同色阴影 | `translateY(1px)` | `2px accent offset2` | 透明度 .5 |
| 次 `.btn-ghost` | 40 / 同 | 13.5/600 | 10 | 白底发丝边 | 底 `--panel-2`、边加深 | 同上 | 同上 | .5 |
| 演示 `.vx-btn` | 34（≤640 42） | 13/600 | 8 | 白底线边 | 边→主色、底 `accent-soft` | — | `2px acc offset2` | .45 |
| 分段 Tab | 40（≤640 48） | 13.5/700 | 8 | 透明、灰字 | 字变深 | — | 环 | — |

- 过渡：`transition: all .15s var(--ease)`（hover/active）；`--ease: cubic-bezier(.22,.61,.36,1)`。

### 3.2 输入控件
- `select`：高 36（≤640 42）、padding `7px 11px`、radius 8、发丝边；focus 同焦点环。
- `input[type=range]`：`accent-color:var(--acc)`；可点轨道高度 ≥24px（移动端），滑块拇指 ≥22px。
- 文本输入（检索框）：高 54（桌面弹层）、padding 19px 22px、字号 17px（防 iOS 缩放）。

### 3.3 表格
- 外包 `.tbl-scroll{overflow-x:auto}`；`table{min-width:560px}`；`table-layout:fixed` + 显式 `<col>` 或 `th` 宽度和为 100%。
- 单元格 padding `10px 14px`；表头 `--panel-2` 底、12.5px/700；偶数行斑马；不竖排、不逐字换行。

### 3.4 卡片/教学块
- 普通卡：白底、发丝边、radius 12；**普通卡不加阴影**（G11）；hover 卡 `--shadow-sm` + 上移 2–4px；弹层 `--shadow-lg`。
- callout：radius 12、padding 16×20；标题 13.5/700 带 19px 图标；theory/key/pit/tip/err 色沿用。
- 代码块：冷炭 `#131824`、radius 12、`pre{overflow-x:auto}` 13px/1.7；mac 点与复制按钮沿用；窄屏不折行、可横滚。

### 3.5 图表/演示
- 容器：`.vx` 14px；控制条 gap 8；图卡 radius 12；多图小倍数 gap 8/12。
- 图表 margin：左 44 / 右 16 / 上 18 / 下 32；轴字 11px mono `--ink-4`；网格 `--grid-line`；坐标轴线 `--axis-line`。
- 宽图（W≥860）：窄屏 `scrollMin=Math.max(W,560)` 走 `.vx-scroll`；轴标签必要时隔项或 -30° 旋转。
- 结论条：底部 13px、白底发丝边、radius 8；正确/错误用 ok/bad；句末结论加粗。

### 3.6 其他
- 分页 `.pager`：桌面 2 列、≤640 1 列；卡 padding 20×24；hover 边→主色、上移 2px。
- 检索弹层：`z-index:300`，遮罩 `rgba(15,20,30,.42)`；盒子 radius 18、`--shadow-lg`；结果项 radius 8。
- 页脚：深色 `#14171c`、桌面 `padding:48px 24px`；≤640 行高 1.8、底 padding 28px。

## 4. 动效与响应式
- 唯一缓动 `cubic-bezier(.22,.61,.36,1)`；时长：即时反馈 150ms、状态 240ms、面板/入场 380ms；只在 hover/active/tab 切换/展开时动，不做全站滚动入场。
- 尊重 `prefers-reduced-motion`：动画/过渡降到 .01ms（已具备）。
- 禁止装饰性粒子/常驻渐变动画；hero 网格为静态。

## 5. 实施映射表（区域 → 问题 → 案例 → 目标 → 参数 → 文件 → 验收）

| 区域 | 问题 | 案例 | 目标 | 关键参数 | 文件 | 验收 |
| --- | --- | --- | --- | --- | --- | --- |
| 表格 | 竖排单字 | Stripe/AntD | 横滚不压字 | `.tbl-scroll overflow-x:auto; table min-width:560` | base.css + core.js 渲染包装 | 390 表可读 |
| 三视图 Tab | 隐藏文字 | Material/Radix | 文字常驻 | 删隐藏；≤640 48px 高 | components.css | 390 三标签可见 |
| 宽 SVG | 缩成小图 | Stripe/ECharts | 横滚保底 | `scrollMin` | d03.js 等 + `_ui.js` | 390 图可读 |
| 控件热区 | 34px | Material/Stripe | ≥44 | min-height 42–44 | demos.css | 盒模型达标 |
| 知识地图 | 留白大 | Pudding/ECharts | 图为主体 | padding/map 留白 | home.css + home.js | 空区减小 |
| bento | 行高参差 | Linear/Primer | 等高 | stretch + flex 置底 | home.css | 底缘对齐 |
| 区块头 | 缺引导句 | Linear | 三行统一 | 眉标+标题+引导 | home.css/index.html | 结构一致 |
| 阅读列 | 时宽时窄 | Distill/OWID | 双列宽 | 66ch 文本/全宽图 | chapter.css | 右缘整齐 |
| 侧栏断点 | 920 偏挤 | Stripe/VitePress | 1024 折叠 | 断点 920→1024 | components.css | 1024 单栏 |
| 数字 | 未等宽 | Geist | tabular-nums | font-variant | home.css | 数字等宽 |
| 控件色 | 系统默认 | Carbon | 跟随主色 | accent-color | demos.css | 滑块主色 |
| 五态 | 不统一 | shadcn/Material | 态齐备 | hover/focus/active | base/demos/components | 键盘可达 |
| Hero 注释 | 淡/贴边 | Datawrapper | 可读 | 不透明度/内边距 | home.js/svg | 注释清晰 |
| 页脚 | 贴边 | Linear | 行高/底距 | 1.8/28px | components.css | 不裁切 |

## 6. 新增/调整令牌（集中在 tokens.css，不新建文件）
```css
--grid-line: rgba(20, 27, 38, .06);
--axis-line: rgba(20, 27, 38, .18);
--touch: 44px;
--section-y: 80px;        /* 桌面区块纵向间距，移动覆盖为 48px */
--map-pad: 20px;          /* 移动覆盖 14px */
```
> 所有改动通过既有变量与既有类名完成，不新增前端框架/依赖。
