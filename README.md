# 《可视化导论》课程网站（重构版）

中国石油大学（华东）《可视化导论》课程教学网站。在原有 D3.js v7 双语课程内容基础上完全重构为
**数据驱动、零构建、纯静态**的网站，可直接部署到 GitHub Pages。

- 纯静态：HTML + CSS + 原生 ES Modules，**无需 npm / 打包 / 框架**
- 可视化：D3.js v7（CDN 引入，不占用服务器空间）
- 双语：中文 / 英文单一数据源 `{zh, en}`，一键切换（右上角，或 URL 加 `?lang=en`）
- 学习功能：交互式知识地图、学习进度（localStorage）、全站检索（Ctrl/⌘ + K）、
  每章「讲解 / 关键代码 / 演示」三视图、章末小结 / 关键点速查 / 自测题
- 适配：桌面、平板、手机响应式

---

## 一、本地预览

> 站点使用了 ES Modules 和 `fetch` 读取数据，**不能直接双击 index.html**（`file://` 会被浏览器拦截），
> 需要起一个本地静态服务器。

在本目录（`vis-site/`）下任选一种：

```bash
# Python 3（推荐，电脑一般自带）
python -m http.server 8000
# 然后浏览器打开 http://localhost:8000/

# 或 Node
npx serve .
```

- 首页：http://localhost:8000/
- 章节页：http://localhost:8000/chapter.html?c=01 （c 取 01–05）

---

## 二、目录结构

```
vis-site/
├── index.html                 # 首页（仅宿主，内容由 JS 渲染）
├── chapter.html               # 章节页宿主（?c=01..05 驱动 5 章，复用同一模板）
├── assets/
│   ├── css/
│   │   ├── tokens.css         # 设计令牌（颜色/字号/间距 + 5 章识别色）
│   │   ├── base.css           # reset / 排版 / 代码高亮 / 表格 / 按钮
│   │   ├── components.css     # 导航 / 侧栏 / 三视图 / 教学卡片 / 检索 / 响应式
│   │   ├── home.css           # 首页（hero / 知识地图 / 章节卡 / 使用方式）
│   │   └── chapter.css        # 章节页（代码视图 / 演示视图 / 章末）
│   ├── js/
│   │   ├── i18n.js            # 双语状态、UI 字典、t() / L()
│   │   ├── store.js           # 学习进度（localStorage）
│   │   ├── core.js            # 章节渲染引擎（块渲染 / 三视图 / 演示懒加载 / 自测）
│   │   ├── home.js            # 首页（动态 hero、知识地图 SVG、卡片、检索）
│   │   └── demos/
│   │       └── d01.js … d05.js # 五章共 27 个交互演示；_ui.js 为共享组件
│   └── data/content/
│       ├── meta.js            # 5 章元数据（标题 / 颜色 / 标签 / 小节数 / 演示数）
│       └── ch01.js … ch05.js  # 五章完整双语内容（讲解/代码/演示 数据源）
└── data/                      # 数据文件（CSV / JSON，离线可用，随站点一起部署）
    ├── newstudent.csv
    ├── crime.csv
    ├── weather_2024.csv
    ├── french_names.json
    ├── storyline.js
    └── time-attributes.js
```

---

## 三、数据驱动：如何新增 / 修改一章内容

所有教学内容都写成数据，**不用改 HTML**。

### 1. 章元数据 `assets/data/content/meta.js`
每章一条记录：`id / num / numEn / title{zh,en} / color / hex / tags / concepts /
nSections / nDemos / nKeys / desc`。

### 2. 章内容 `assets/data/content/chXX.js`
导出一个章节对象，每个小节由若干「内容块」组成，支持块类型：
`p / h / list / table / case / theory / key / pit / tip / code / demo`。

- `code`：⭐ 关键代码，含 `code`（源码）与 `notes`（为什么这么写 / 常见坑）
- `demo`：通过 `id` 引用 `assets/js/demos/dXX.js` 中的交互演示
- 所有文本统一为 `{zh:'…', en:'…'}`

### 3. 交互演示 `assets/js/demos/dXX.js`
契约：`export default { 'd01-1': async (mount, ctx) => { … } }`，
其中 `ctx = { d3, data }`，`data` 是数据文件基路径。演示按需懒加载。

---

## 四、部署到 GitHub Pages

1. 把本目录（`vis-site/`）里的**全部文件**放进一个 GitHub 仓库（仓库名可设为 `vis`），
   并让 `index.html` 位于仓库根目录（或 `docs/` 目录）。
2. 仓库 → **Settings → Pages**：
   - Source 选 **Deploy from a branch**
   - Branch 选 **main**，目录选 **/(root)**（若用 docs 则选 /docs），保存。
3. 等待约 1 分钟，访问：
   `https://<你的用户名>.github.io/vis/`

**注意（相对路径，无需任何配置）：**
- 全站资源均使用相对路径，部署在 `username.github.io/vis` 这类子路径也能直接用。
- D3 仅通过 CDN 加载；**不包含视频**，数据文件已压缩，整站体积极小，符合服务器空间限制。

> 若 GitHub Pages 页面打开是 404：确认仓库根目录有 `index.html`；若强制使用 Jekyll，
> 可在仓库根目录放一个空文件 `.nojekyll`。

---

## 五、技术说明

- 图表：D3.js v7（`https://cdn.jsdelivr.net/npm/d3@7/+esm`）
- 代码高亮：自研极简高亮（core.js），无第三方依赖
- 字体：Sora / Noto Sans SC / JetBrains Mono，经外部镜像加载，带系统字体回退；图标为内联 SVG
- 进度：`localStorage`（键 `vis-progress`）；语言：`localStorage`（键 `vis-locale`）
- 无视频、无大图片；尊重 `prefers-reduced-motion`

## 正式发布

- 在线网站：<https://display454.github.io/vis-course/>
- 独立仓库：<https://github.com/display454/vis-course>
- 发布来源：`main` 分支根目录；不依赖博客项目。
- 数据随站点保存；D3 和网络字体使用外部地址，因此首次使用演示需要网络连接。
- 2026-10-20 发布前检查：27 个演示在中英文两种语言下全部渲染通过；390 / 768 / 1024 / 1440 / 1920 宽度的首页、章节页均无整页横向溢出。
