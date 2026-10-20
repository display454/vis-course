// ============================================================
// ch03.js — 第 3 章《色彩专题》双语内容模型（讲解 / 代码 / 演示 数据源）
// 块类型：p h list table theory key pit tip code demo
// ============================================================
export default {
  id: '03',
  title: { zh: '色彩专题', en: 'Color' },
  lede: {
    zh: '颜色不是装饰，而是一条可视化通道：颜色空间与感知均匀性、三类 colormap 的选择、色域裁剪、色系几何、科研经典配色、常见错误、仪表板配色哲学与色觉缺陷（CVD）可访问性，全程用真实学生与犯罪数据动手验证。',
    en: 'Color is a channel, not decoration: color spaces and perceptual uniformity, the three colormap families, gamut clipping, hue-wheel geometry, research-grade palettes, common pitfalls, dashboard coloring and CVD accessibility — all tested on real data.'
  },
  objectives: {
    zh: [
      '理解 RGB/HSL 与 CIE Lab 在感知均匀性上的差别，知道为什么不能直接在 RGB 里插值',
      '能为顺序/发散/定性三类数据语义选对 colormap，并识破 jet 的假边界',
      '理解色域嵌套与超色域 clamp，能解释鲜艳设计在普通屏幕上发灰的原因',
      '掌握 5 种色系和谐规则的几何本质与适用场景',
      '会用 Wong / Paul Tol / Tableau 等经典配色并做色差与 CVD 量化对比',
      '掌握「主色鲜明、配套低饱和、强调唯一」与 WCAG 对比度检查',
      '理解不能只靠颜色编码，会用形状/标签/纹理做冗余可访问设计'
    ],
    en: [
      'See why RGB/HSL are not perceptually uniform and why RGB interpolation is wrong',
      'Match sequential/diverging/qualitative colormaps to data semantics and detect jet’s fake bands',
      'Understand nested gamuts and clipping, and why vivid designs look dull on ordinary screens',
      'Master the geometry and use cases of the five harmony rules',
      'Use Wong/Paul Tol/Tableau palettes with quantitative ΔE and CVD comparison',
      'Apply vivid-main/low-sat-supports/one-accent coloring and WCAG contrast checks',
      'Avoid color-only encoding; add shape/label/texture redundancy for accessibility'
    ]
  },
  sections: [
    {
      id: '3.1',
      title: { zh: '颜色模型基础', en: 'Color Models' },
      sub: { zh: '为什么需要多种颜色空间？它们各自擅长什么？', en: 'Why do we need several color spaces and what is each good at?' },
      blocks: [
        { t: 'theory', title: { zh: '颜色是颜色空间里的一个坐标', en: 'A color is a coordinate in a color space' }, body: [
          { t: 'p', x: { zh: '同一个颜色在不同空间里是一组不同的坐标。设计 colormap 时不能直接在 RGB 里插值——RGB 是设备导向、<strong>不感知均匀</strong>的：等长的 RGB 步长，人眼感受到的色差并不相等。', en: 'The same color is a different coordinate in different spaces. You should not interpolate colormaps directly in RGB — it is device-oriented and <strong>not perceptually uniform</strong>: equal RGB steps give unequal perceived differences.' } },
          { t: 'table', head: [{ zh: '空间', en: 'Space' }, { zh: '坐标', en: 'Coordinates' }, { zh: '特点', en: 'Trait' }, { zh: '擅长', en: 'Best for' }],
            rows: [
              [{ zh: 'RGB', en: 'RGB' }, { zh: '红/绿/蓝', en: 'R/G/B' }, { zh: '加色、设备相关', en: 'additive, device' }, { zh: '屏幕显示', en: 'screen output' }],
              [{ zh: 'HSL', en: 'HSL' }, { zh: '色相/饱和度/亮度', en: 'Hue/Sat/Light' }, { zh: '艺术家友好，仍不感知均匀', en: 'artist-friendly, still not uniform' }, { zh: '取色、调色', en: 'picking colors' }],
              [{ zh: 'CIE Lab', en: 'CIE Lab' }, { zh: 'L*/a*/b*', en: 'L*/a*/b*' }, { zh: '感知均匀', en: 'perceptually uniform' }, { zh: '插值、色差、colormap', en: 'interpolation, ΔE, colormaps' }],
              [{ zh: 'CMYK', en: 'CMYK' }, { zh: '青/品/黄/黑', en: 'C/M/Y/K' }, { zh: '减色、印刷', en: 'subtractive, print' }, { zh: '印刷（Web 不用）', en: 'print (not for web)' }]
            ] },
          { t: 'p', x: { zh: '<strong>Lab 距离 ≈ 感知差：</strong>在 Lab 空间里，两个颜色的欧氏距离 ΔE 大致等于人眼感受到的色差，因此设计感知线性的色阶、量化「两个颜色够不够分开」都在 Lab 里做。', en: '<strong>Lab distance ≈ perceived difference:</strong> the Euclidean ΔE between two Lab colors approximates the perceptual gap, so perceptually linear ramps and “are these two colors separable?” checks are done in Lab.' } }
        ]},
        { t: 'code', lang: 'js', title: { zh: '① d3-color 在空间间转换并计算色差', en: '① Convert between spaces and compute ΔE with d3-color' },
          code: `// d3 自动做了 sRGB 线性化与 Lab 转换
const c = d3.rgb(220, 90, 150);
d3.hsl(c).formatHsl();      // "hsl(342, 65%, 61%)"
d3.lab(c);                 // { l: 57.7, a: 65.9, b: -6.0 }

// 两点 Lab 欧氏距离 = 感知色差 ΔE
function deltaE(a, b) {
  const A = d3.lab(a), B = d3.lab(b);
  return Math.hypot(A.l - B.l, A.a - B.a, A.b - B.b);
}
// 平滑渐变要在 Lab 插值，而不是 RGB
const ramp = d3.interpolateLab("#08519c", "#f7fbff");`,
          notes: [
            { type: 'why', h: { zh: '为什么用 Lab 插值', en: 'Why interpolate in Lab' },
              x: { zh: '<code>d3.interpolateRgb</code> 在 RGB 直线上插值，中段会出现脏灰、亮度不均；<code>d3.interpolateLab</code> 沿感知均匀方向走，亮度平滑、不发灰。', en: '<code>d3.interpolateRgb</code> cuts through muddy gray with uneven lightness; <code>d3.interpolateLab</code> follows the perceptual direction for a smooth, clean ramp.' } }
          ] },
        { t: 'demo', id: 'd03-1', title: { zh: '颜色空间几何实验室：RGB / HSL / Lab 联动', en: 'Color-space lab: RGB / HSL / Lab linked' },
          x: { zh: '拖动 R/G/B 改变同一个颜色，观察它在 RGB 立方体、HSL 色轮、Lab 切片里的位置；生成「RGB 等距环」，看 RGB 里等距的点在 Lab 里疏密不均，直观理解感知非均匀。', en: 'Drag R/G/B to move one color through the RGB cube, HSL wheel and Lab slice; generate an RGB-equidistant ring and see how its even spacing becomes uneven in Lab.' } }
      ]
    },
    {
      id: '3.2',
      title: { zh: 'colormap 三类选择', en: 'Three Colormap Families' },
      sub: { zh: '顺序型 / 发散型 / 定性型。选错类型 = 误导读者', en: 'Sequential / diverging / qualitative. The wrong family misleads.' },
      blocks: [
        { t: 'table', head: [{ zh: '类型', en: 'Family' }, { zh: '数据语义', en: 'Data semantics' }, { zh: '视觉特征', en: 'Visual signature' }, { zh: '例子', en: 'Examples' }],
          rows: [
            [{ zh: '顺序型', en: 'Sequential' }, { zh: '有自然顺序（人口、温度）', en: 'ordered (population, temp)' }, { zh: '亮度单调', en: 'monotone lightness' }, { zh: 'Viridis / Cividis / Blues', en: 'Viridis / Cividis / Blues' }],
            [{ zh: '发散型', en: 'Diverging' }, { zh: '有意义的中点（0、均值）', en: 'meaningful midpoint (0, mean)' }, { zh: '两端异色、中间浅', en: 'two hues, light center' }, { zh: 'RdBu / BrBG / PiYG', en: 'RdBu / BrBG / PiYG' }],
            [{ zh: '定性型', en: 'Qualitative' }, { zh: '无序类别（产品、地区）', en: 'unordered categories' }, { zh: '色相区分、亮度相近', en: 'hue-coded, similar lightness' }, { zh: 'Tableau10 / Set1', en: 'Tableau10 / Set1' }]
          ] },
        { t: 'pit', title: { zh: '典型错误：jet 与无中点的发散色', en: 'Pitfalls: jet and diverging without a midpoint' },
          x: { zh: 'jet/彩虹谱亮度反复、局部梯度制造并不存在的「边界」，还把视线吸向黄色；用发散色 RdBu 画单向递增的谋杀率时，接近白色的中段会被误读成「中点」，但那个数值毫无语义。', en: 'jet/rainbow has non-monotone lightness and local-gradient artifacts that invent boundaries while pulling the eye to yellow; applying RdBu to one-way murder rates makes the near-white middle read as a “midpoint” that has no meaning.' } },
        { t: 'code', lang: 'js', title: { zh: '① 顺序色阶：scaleSequential', en: '① Sequential ramp with scaleSequential' },
          code: `// 有序数据 → 顺序色，亮度随值单调变化
const color = d3.scaleSequential(d3.interpolateViridis)
                .domain([0, d3.max(rows, d => d.rate)]);
bars.attr("fill", d => color(d.rate));

// 发散色必须显式锚定有意义的中点（如 0）
const div = d3.scaleDiverging(d3.interpolateRdBu)
              .domain([-max, 0, max]);`,
          notes: [
            { type: 'warn', h: { zh: 'domain 决定中点', en: 'The domain sets the midpoint' },
              x: { zh: '<code>scaleDiverging</code> 的三参数 domain 是 [最小值, 中点, 最大值]；中点不写或写错，白色就不会落在有意义的位置。', en: 'The three-value domain of <code>scaleDiverging</code> is [min, midpoint, max]; omit or mis-set the midpoint and the white center lands on a meaningless value.' } }
          ] },
        { t: 'demo', id: 'd03-2', title: { zh: '配色诊断工作台：亮度 / 梯度 / CVD 三条诊断曲线', en: 'Colormap clinic: lightness / gradient / CVD diagnostics' },
          x: { zh: '同一份真实各州谋杀率数据，切换 Viridis / Cividis / Blues / RdBu / jet；下方三条曲线实时诊断亮度是否单调、局部梯度有无假峰、绿色盲后相邻色能否分开。', en: 'Color the same real murder-rate data with Viridis/Cividis/Blues/RdBu/jet; three live curves diagnose lightness monotonicity, fake gradient peaks and deuteranopia separability.' } }
      ]
    },
    {
      id: '3.3',
      title: { zh: 'CIE Lab 色域图', en: 'CIE Lab Gamuts' },
      sub: { zh: '在感知均匀的空间里，色域长什么样？', en: 'What do gamuts look like in a perceptually uniform space?' },
      blocks: [
        { t: 'p', x: { zh: 'RGB 是个立方体，你无法看出「哪些颜色真的能显示、哪些会失真」。在 Lab 的 a*b* 平面上，每个设备能表达的颜色围成一个封闭区域，称为<strong>色域（gamut）</strong>。', en: 'RGB is a cube that tells you nothing about which colors can actually be displayed. On the Lab a*b* plane, each device’s reproducible colors form a closed region called its <strong>gamut</strong>.' } },
        { t: 'list', x: [
          { zh: 'sRGB：屏幕通用标准，Web/PPT/一般科研图都在它里面', en: 'sRGB: the web/PPT/most-figure default' },
          { zh: 'Adobe RGB：摄影/印刷，绿色域更广', en: 'Adobe RGB: photography/print, wider greens' },
          { zh: 'Rec.2020：4K/HDR，色域最大（Rec.2020 ⊃ Adobe RGB ⊃ sRGB）', en: 'Rec.2020: 4K/HDR, the largest (Rec.2020 ⊃ Adobe RGB ⊃ sRGB)' }
        ] },
        { t: 'key', title: { zh: '超色域颜色会被裁剪（clamp）', en: 'Out-of-gamut colors are clamped' }, body: [
          { t: 'p', x: { zh: '超出 sRGB 的高饱和颜色（如很纯的绿）在普通屏幕上显示不出来，会被裁到色域边界上最近的可显示色，产生 ΔE 色差——这就是鲜艳设计在普通屏幕上「发灰发脏」的原因。', en: 'Highly saturated colors outside sRGB (e.g. a very pure green) cannot be shown on an ordinary screen; they are clamped to the nearest in-gamut color, producing a ΔE error — why vivid designs look dull or dirty there.' } }
        ] },
        { t: 'code', lang: 'js', title: { zh: '① Lab 转换与色域裁剪', en: '① Lab conversion and gamut clipping' },
          code: `// d3.lab(...).rgb() 转 sRGB 时，超出 [0,255] 的分量会被截断
const vivid = d3.lab(60, 120, -10);
const shown = vivid.rgb();        // 可能得到 r>255 / 负值
const safeHex = shown.clamp().formatHex();

// 设计连续色阶时在 Lab 里插值，避免穿过色域外
const ramp = d3.interpolateLab("#f7fbff", "#08519c");`,
          notes: [
            { type: 'why', h: { zh: '为什么是 Lab', en: 'Why Lab' },
              x: { zh: 'Lab 是设备无关的中转空间：先在 Lab 里设计色阶，再统一转到目标色域，能最大限度减少 clamp 造成的失真。', en: 'Lab is the device-independent hub: design the ramp in Lab, then convert to the target gamut to minimize clipping distortion.' } }
          ] },
        { t: 'demo', id: 'd03-3', title: { zh: '三色域边界叠加 + clamp 轨迹', en: 'Three-gamut overlay with clamp trajectory' },
          x: { zh: '拖 L* 滑块，看 sRGB / Adobe RGB / Rec.2020 在 a*b* 平面的边界实时缩放；点一个色域外的颜色，观察它被 clamp 回 sRGB 的轨迹和 ΔE。', en: 'Drag L* to scale the sRGB/Adobe RGB/Rec.2020 boundaries; click a point outside sRGB to watch its clamp trajectory and ΔE.' } }
      ]
    },
    {
      id: '3.4',
      title: { zh: '色系搭配规则（5 大类）', en: 'Five Harmony Rules' },
      sub: { zh: '单色 / 类比 / 互补 / 三等分 / 分裂互补', en: 'Mono / analogous / complementary / triadic / split-complementary' },
      blocks: [
        { t: 'table', head: [{ zh: '规则', en: 'Rule' }, { zh: '色相环几何', en: 'Wheel geometry' }, { zh: '性格', en: 'Character' }, { zh: '适用', en: 'Use for' }],
          rows: [
            [{ zh: '单色', en: 'Monochromatic' }, { zh: '同一色相，变 L/S', en: 'same hue, vary L/S' }, { zh: '安全、低风险', en: 'safe, low risk' }, { zh: '严肃科研图', en: 'sober figures' }],
            [{ zh: '类比', en: 'Analogous' }, { zh: '相邻 ±30°', en: 'neighbors ±30°' }, { zh: '和谐、对比弱', en: 'harmonious, soft' }, { zh: '层级/分组', en: 'grouping' }],
            [{ zh: '互补', en: 'Complementary' }, { zh: '正对 180°', en: 'opposite, 180°' }, { zh: '对比最强、易刺眼', en: 'strongest, can clash' }, { zh: '突出重点', en: 'emphasis' }],
            [{ zh: '三等分', en: 'Triadic' }, { zh: '120° 等分', en: '120° spacing' }, { zh: '活泼平衡', en: 'lively, balanced' }, { zh: '3 个类别', en: 'three categories' }],
            [{ zh: '分裂互补', en: 'Split-comp' }, { zh: '互补点两侧 150°', en: '±150° around complement' }, { zh: '强对比不刺眼', en: 'strong yet gentle' }, { zh: '一般情况', en: 'general use' }]
          ] },
        { t: 'p', x: { zh: '这些规则本质上是色相环上的几何关系：互补是过圆心的直径、类比是相邻扇形、三等分是内接等边三角形、分裂互补是一个 Y 形。', en: 'These rules are literally geometry on the hue wheel: a complement is a diameter, analogous a neighboring wedge, triadic an inscribed equilateral triangle, and split-complementary a Y shape.' } },
        { t: 'code', lang: 'js', title: { zh: '① 用 d3.hsl 计算和谐色', en: '① Derive harmony colors with d3.hsl' },
          code: `const h = 210;
const triad = [0, 120, 240].map(dh =>
  d3.hsl((h + dh) % 360, 0.62, 0.55).formatHex());
// 互补：d3.hsl((h+180)%360, s, l)
// 类比：d3.hsl(h±30, s, l)；单色：保持 h，只改 l/s`,
          notes: [
            { type: 'why', h: { zh: '几何即规则', en: 'Geometry is the rule' },
              x: { zh: '用色相角做加减，比手挑十六进制颜色更稳定，也方便交互生成与批量换主色。', en: 'Adding angles to hue is more robust than hand-picking hex values, and makes interactive recolor and global hue changes trivial.' } }
          ] },
        { t: 'demo', id: 'd03-4', title: { zh: '交互式 HSL 色轮和谐器', en: 'Interactive HSL harmony wheel' },
          x: { zh: '旋转主色相并切换五种规则，色轮上实时画出几何关系，下方真实班级多类图同步上色。', en: 'Rotate the base hue and switch rules to draw the geometry live while a real class chart recolors.' } }
      ]
    },
    {
      id: '3.5',
      title: { zh: '科研经典配色', en: 'Research-grade Palettes' },
      sub: { zh: 'Wong / Paul Tol / Okabe-Ito / Tableau — 顶刊都在用什么', en: 'Wong / Paul Tol / Okabe-Ito / Tableau — what top journals use' },
      blocks: [
        { t: 'list', x: [
          { zh: 'Wong 2011（Nature Methods）：8 色，CVD 友好、灰度打印友好', en: 'Wong 2011 (Nature Methods): 8 colors, CVD- and print-friendly' },
          { zh: 'Okabe-Ito 2002：与 Wong 同源的 8 色，早期 Nature/Science 默认', en: 'Okabe-Ito 2002: the same 8-color family, early Nature/Science default' },
          { zh: 'Paul Tol：bright（白底）/ muted（深底），SRON 技术报告', en: 'Paul Tol: bright (white bg) / muted (dark bg), SRON tech note' },
          { zh: 'Tableau 10：商业图表之王，10 色但部分色对 CVD 不友好', en: 'Tableau 10: the business-chart default, 10 colors, some CVD-weak pairs' },
          { zh: 'Paired(12)：配对设计（处理前/后），但 12 色已过载', en: 'Paired (12): before/after pairing, but 12 colors is overloaded' }
        ] },
        { t: 'key', title: { zh: '量化而非凭感觉', en: 'Quantify, don’t guess' }, body: [
          { t: 'p', x: { zh: '一套配色好不好，可量化为：正常/各类 CVD 下相邻类别的最小色差 ΔE、灰度后亮度差。Wong 与 Paul Tol 在这些指标下都保持较大间隔，这正是它们成为黄金标准的原因。', en: 'A palette can be judged by the minimum between-class ΔE under normal and CVD vision, and the lightness spread in grayscale. Wong and Paul Tol keep large gaps on all of these, which is why they are the golden standard.' } }
        ] },
        { t: 'code', lang: 'js', title: { zh: '① 直接使用离散色板', en: '① Use categorical palettes directly' },
          code: `import * as d3 from "d3";
// 定性数据：取色板前 N 个（N ≤ 7）
const colors = d3.schemeTableau10.slice(0, 7);
const color = d3.scaleOrdinal(classes, colors);

// 顺序数据：从 Viridis 连续插值取 N 档
const seq = d3.range(N).map(i => d3.interpolateViridis(i / (N - 1)));`,
          notes: [
            { type: 'warn', h: { zh: '类别数 ≤ 7', en: 'Keep categories ≤ 7' },
              x: { zh: '人眼能可靠命名的色相有限，超过 7 个类别就应考虑合并小类，或改用形状/标签/连续编码；绝不能把连续色阶当离散色硬取。', en: 'Few hues can be reliably named; beyond ~7 categories, merge small groups or add shape/label/continuous encoding. Never subsample a continuous ramp as discrete categories.' } }
          ] },
        { t: 'demo', id: 'd03-5', title: { zh: '经典配色真实图 A/B 量化对比', en: 'A/B quantitative comparison of classic palettes' },
          x: { zh: '同一张真实多类别散点（班级×性别），切换 Wong / Tol / Tableau / Paired / jet 并叠加 CVD/灰度滤镜，右侧条形实时给出各方案最小相邻色差。', en: 'One real multi-class scatter (class×gender); switch Wong/Tol/Tableau/Paired/jet and apply CVD/grayscale filters; the bars rank each palette by minimum between-class ΔE.' } }
      ]
    },
    {
      id: '3.6',
      title: { zh: '对错案例对比', en: 'Spot the Bad Coloring' },
      sub: { zh: '从被动投票改为主动找茬：亲手点出问题并一键修复', en: 'From passive voting to active spotting: find the flaw and fix it' },
      blocks: [
        { t: 'p', x: { zh: '光看理论不如亲手选错一次。常见的配色坑集中在四类：jet 假边界、红绿难分、类别色过多、强调色对比不足。', en: 'Choosing the wrong chart once teaches more than theory. The recurring flaws are four: jet fake bands, red-green confusion, too many categories, and weak emphasis.' } },
        { t: 'list', x: [
          { zh: 'jet 彩虹谱：非感知均匀、CVD 与打印都不友好，Nature 已禁用', en: 'jet/rainbow: non-uniform, CVD- and print-unfriendly, banned by Nature' },
          { zh: '红绿对比：红绿色盲眼中几乎同色，是最严重的可访问性问题', en: 'Red-green: nearly identical to red-green colorblind viewers — the top accessibility issue' },
          { zh: '颜色过多：超过 7 种时眼睛无法区分和记忆', en: 'Too many colors: beyond ~7 they cannot be distinguished or remembered' },
          { zh: '强调色太弱：关键项与背景同明度，重点被埋没', en: 'Weak accent: the key item shares the background’s lightness and is buried' }
        ] },
        { t: 'key', title: { zh: '修法：换色 + 冗余通道', en: 'The fix: recolor + redundant channels' }, body: [
          { t: 'p', x: { zh: '绝大多数配色坑都能通过两步修复：换成感知正确的色阶（Viridis / Wong），再叠加形状、直接标签等不依赖颜色的冗余通道。', en: 'Nearly every color flaw is fixed in two steps: switch to a perceptually correct ramp (Viridis/Wong), then add a non-color channel such as shape or a direct label.' } }
        ] },
        { t: 'demo', id: 'd03-6', title: { zh: '配色找茬闯关：点问题区域 → 选类型 → 一键修复', en: 'Color-fault challenge: spot → diagnose → fix' },
          x: { zh: '连续四关，每关先点击图中可疑区域再选择问题类型；答对后区域高亮并给出解释，可一键修复看前后对比并计分。', en: 'Four rounds: click the suspect region, pick the issue type, then highlight and explain; fix it for a before/after comparison and score.' } }
      ]
    },
    {
      id: '3.7',
      title: { zh: '鲜艳 + 低饱和 配色哲学', en: 'Vivid Main, Low-Saturation Supports' },
      sub: { zh: '颜色数量 ≤ 7、鲜艳颜色 + 低饱和度 = 好看又耐看', en: '≤7 colors, one vivid main plus low-saturation supports' },
      blocks: [
        { t: 'list', x: [
          { zh: '颜色数量 ≤ 7：超过 7 种眼睛就分不清', en: 'Keep ≤7 colors — beyond that they cannot be separated' },
          { zh: '主色鲜明（S≈70%）：承担识别与关键数据', en: 'A vivid main color (S≈70%) for identity and key data' },
          { zh: '配套色低饱和（S 30–50%）：当背景与次要系列，耐看', en: 'Low-saturation supports (S 30–50%) for backgrounds and secondary series' },
          { zh: '强调色唯一：只给一个重点，不要全饱和', en: 'Exactly one accent, never fully saturated' },
          { zh: '柱内白字等文字对比要达 WCAG 4.5:1', en: 'Text such as white-on-bar labels must meet WCAG 4.5:1' }
        ] },
        { t: 'code', lang: 'js', title: { zh: '① WCAG 相对亮度与对比度', en: '① WCAG relative luminance and contrast' },
          code: `function relLum(hex) {
  const c = d3.rgb(hex);
  const f = v => { v /= 255;
    return v <= 0.03928 ? v/12.92
                        : ((v+0.055)/1.055) ** 2.4; };
  return 0.2126*f(c.r) + 0.7152*f(c.g) + 0.0722*f(c.b);
}
function contrast(a, b) {
  const L1 = relLum(a), L2 = relLum(b);
  return (Math.max(L1,L2)+0.05) / (Math.min(L1,L2)+0.05);
}
contrast(barColor, "#ffffff") >= 4.5; // 正文/白字达标线`,
          notes: [
            { type: 'warn', h: { zh: '先线性化再加权', en: 'Linearize before weighting' },
              x: { zh: '必须先对 sRGB 分量做 gamma 线性化再乘 0.2126/0.7152/0.0722，直接在 0–255 上加权会得到错误的对比度。', en: 'Linearize the sRGB channels before applying 0.2126/0.7152/0.0722; weighting raw 0–255 values gives an incorrect contrast.' } }
          ] },
        { t: 'demo', id: 'd03-7', title: { zh: '多面板仪表板上色 + WCAG 检测', en: 'Dashboard coloring with live WCAG checks' },
          x: { zh: '调主色相与饱和度，给柱/线/区/标注多面板整体上色；下方实时检查白字对比、相邻色差与饱和度分布，看「全饱和↔低饱和」如何影响耐看度。', en: 'Tune base hue and saturation to color a multi-panel dashboard; live checks show white-text contrast, adjacent ΔE and saturation spread as you move between full and low saturation.' } }
      ]
    },
    {
      id: '3.8',
      title: { zh: 'CVD 论文图测', en: 'CVD Figure Testing' },
      sub: { zh: '你的图在色盲眼里还看得懂吗？', en: 'Does your figure still make sense to a colorblind viewer?' },
      blocks: [
        { t: 'p', x: { zh: '约 8% 男性、0.5% 女性有色觉缺陷，其中绿色盲（deuteranopia）最常见。把图导出后用 CVD 模拟过滤一遍，检查每一类是否仍可区分，是投稿前的固定动作。', en: 'About 8% of men and 0.5% of women have a color vision deficiency, with deuteranopia most common. Running your exported figure through a CVD simulator and checking every class is still separable is a pre-submission routine.' } },
        { t: 'key', title: { zh: '正解：不要只靠颜色', en: 'The fix: never rely on color alone' }, body: [
          { t: 'p', x: { zh: '加入不依赖颜色的<strong>冗余通道</strong>：不同形状、直接文字标签、纹理填充，或直接改用 Wong 色。即使颜色在某类视觉下坍缩，类别仍能被区分。', en: 'Add <strong>redundant channels</strong> that do not depend on color: distinct shapes, direct labels, texture fills, or simply the Wong palette. Classes then stay separable even when color collapses.' } }
        ] },
        { t: 'code', lang: 'js', title: { zh: '① 形状 + 标签的冗余编码', en: '① Redundant encoding with shapes and labels' },
          code: `// 同一类别同时给颜色 + 形状 + 标签
const shapes = [d3.symbolCircle, d3.symbolSquare,
                d3.symbolTriangle, d3.symbolDiamond];
points.attr("d", d => d3.symbol().type(shapes[d.group])(80))
      .attr("fill", d => color(d.group))
      .attr("transform", d => \`translate(\${x(d.x)},\${y(d.y)})\`);
// 直接标注（最稳的冗余）：labels 写类别名而非只靠图例`,
          notes: [
            { type: 'why', h: { zh: '为什么直接标签最稳', en: 'Why labels are the strongest' },
              x: { zh: '形状可区分的类别数有限（约 5–6 种），而文字标签不依赖任何视觉通路，是最可靠的冗余；能直接标注时优先标注。', en: 'Shapes support only ~5–6 classes, whereas text labels use no visual channel at all; when feasible, label directly.' } }
          ] },
        { t: 'demo', id: 'd03-8', title: { zh: '实时 CVD/灰度滤镜 + 冗余修复', en: 'Live CVD/grayscale filter with redundancy repair' },
          x: { zh: '在正常/红/绿/蓝色盲/灰度间切换，看等亮度红绿在灰度下完全重合；再逐项加入形状、标签、纹理、Wong 色，观察它们如何重新可分。', en: 'Switch between normal/protan/deutan/tritan/grayscale to see equal-luminance red and green merge in grayscale; then add shapes, labels, texture and Wong colors one by one to restore separation.' } }
      ]
    }
  ],
  summary: {
    zh: [
      '颜色是一条可视化通道：RGB/HSL 设备导向且不感知均匀，Lab 距离≈感知差，插值与色差都应在 Lab 里做。',
      'colormap 要匹配数据语义：顺序型亮度单调、发散型锚定有意义的中点、定性型用区分离散色；jet 的假边界要禁用。',
      '色域嵌套（Rec.2020⊃Adobe RGB⊃sRGB），超 sRGB 颜色会被 clamp 产生 ΔE，Lab 是跨色域的中转空间。',
      '5 种色系规则是色相环几何；科研用 Wong/Okabe-Ito/Paul Tol 并用最小色差与 CVD 量化验证，类别数 ≤7。',
      '仪表板遵循主色鲜明、配套低饱和、强调唯一，白字对比 ≥4.5；可访问性靠形状/标签/纹理冗余，不能只靠颜色。'
    ],
    en: [
      'Color is a channel: RGB/HSL are device-oriented and not uniform; Lab distance ≈ perception, so interpolation and ΔE belong in Lab.',
      'Match the colormap to semantics: monotone sequential, diverging with a meaningful midpoint, discrete qualitative; never jet.',
      'Gamuts nest (Rec.2020⊃Adobe RGB⊃sRGB); out-of-sRGB colors are clamped with ΔE, and Lab is the cross-gamut hub.',
      'The five harmony rules are wheel geometry; use Wong/Okabe-Ito/Paul Tol and verify with minimum ΔE/CVD, keeping ≤7 categories.',
      'Dashboards use a vivid main color, low-saturation supports and one accent with ≥4.5 text contrast; accessibility needs shape/label/texture, not color alone.'
    ]
  },
  quickref: [
    { tag: '3.1', x: { zh: '① RGB/HSL 不感知均匀 ② Lab ΔE≈感知差 ③ interpolateLab 插值', en: '① RGB/HSL not uniform ② Lab ΔE≈perception ③ interpolateLab' } },
    { tag: '3.2', x: { zh: '① 顺序/发散/定性 ② 亮度单调 ③ 发散锚定中点 ④ 禁用 jet', en: '① seq/div/qual ② monotone lightness ③ anchor midpoint ④ no jet' } },
    { tag: '3.3', x: { zh: '① 色域嵌套 ② 超色域 clamp ③ ΔE 色差 ④ Lab 中转', en: '① nested gamuts ② clamp ③ ΔE ④ Lab hub' } },
    { tag: '3.4', x: { zh: '① 单色安全 ② 类比和谐 ③ 互补强调 ④ 三等分 3 类 ⑤ 分裂互补', en: '① mono safe ② analogous ③ complement emphasis ④ triadic 3 类 ⑤ split' } },
    { tag: '3.5', x: { zh: '① Wong/Okabe-Ito/Tol ② 最小色差量化 ③ 类别 ≤7 ④ 连续≠离散', en: '① Wong/Okabe-Ito/Tol ② min ΔE ③ ≤7 ④ continuous≠discrete' } },
    { tag: '3.6', x: { zh: '① jet 假边界 ② 红绿难分 ③ 色过多 ④ 强调弱 ⑤ 换色+冗余', en: '① jet ② red-green ③ too many ④ weak accent ⑤ recolor+redundancy' } },
    { tag: '3.7', x: { zh: '① 主色 S70% ② 配套 S30-50% ③ 强调唯一 ④ WCAG 4.5:1', en: '① main S70% ② supports S30-50% ③ one accent ④ WCAG 4.5:1' } },
    { tag: '3.8', x: { zh: '① 8% 男性色盲 ② 不只靠颜色 ③ 形状/标签/纹理 ④ Wong 兜底', en: '① ~8% men ② not color alone ③ shape/label/texture ④ Wong fallback' } }
  ],
  quiz: [
    { q: { zh: '为什么设计连续色阶要在 Lab 而不是 RGB 里插值？', en: 'Why interpolate a continuous ramp in Lab instead of RGB?' },
      a: { zh: 'RGB 不感知均匀，等长 RGB 步长人眼色差不等，线性插值会穿过脏灰、亮度不均；Lab 感知均匀，等距 ΔE≈等色差，色阶平滑且不发灰。', en: 'RGB is not perceptually uniform: equal RGB steps give unequal perceived differences and linear interpolation cuts through muddy gray with uneven lightness. Lab is uniform, so equal ΔE gives equal perceived steps and a smooth clean ramp.' } },
    { q: { zh: '顺序型、发散型、定性型 colormap 分别对应什么数据？', en: 'What data semantics map to sequential, diverging and qualitative colormaps?' },
      a: { zh: '有自然顺序的量（人口/温度）用顺序型，亮度单调；有意义中点（0/均值）的偏差用发散型，两端异色中间浅；无顺序类别用定性型，靠色相区分、亮度相近。', en: 'Ordered quantities (population/temperature) use sequential with monotone lightness; deviations around a meaningful midpoint (0/mean) use diverging with two hues and a light center; unordered categories use qualitative hue-coded colors of similar lightness.' } },
    { q: { zh: '为什么鲜艳的设计在普通屏幕上会「发灰发脏」？', en: 'Why does a vivid design look dull or dirty on an ordinary screen?' },
      a: { zh: '高饱和色可能落在 sRGB 色域之外，普通屏幕无法显示，会被 clamp 到边界最近的可显示色，产生 ΔE 色差，饱和度被压低，于是发灰。', en: 'Highly saturated colors may fall outside sRGB; an ordinary screen cannot produce them and clamps them to the nearest in-gamut color, causing a ΔE error that lowers saturation and looks dull.' } },
    { q: { zh: '要让一张多类别图在红绿色盲和灰度打印下都能区分，有哪些做法？', en: 'How do you keep a multi-category chart separable under red-green CVD and grayscale printing?' },
      a: { zh: '改用 Wong/Okabe-Ito 等 CVD 友好且有明暗差的配色，类别数 ≤7，并叠加不依赖颜色的冗余通道：不同形状、直接文字标签或纹理填充；不能只靠颜色。', en: 'Use a CVD-friendly palette with lightness spread such as Wong/Okabe-Ito, keep ≤7 categories, and add non-color redundancy: distinct shapes, direct text labels or texture fills — never rely on color alone.' } },
    { q: { zh: '仪表板「主色鲜明、配套低饱和、强调唯一」分别解决什么问题？', en: 'What problems do vivid main, low-saturation supports and one accent solve in a dashboard?' },
      a: { zh: '主色鲜明承担识别与关键数据；配套色降饱和当背景与次要系列，避免大面积高彩造成疲劳；只保留一个强调色，让真正的重点被看到；同时保证白字等对比 ≥4.5。', en: 'A vivid main color carries identity and key data; low-saturation supports act as backgrounds and secondary series to avoid fatigue from large saturated areas; one accent reserves attention for the real focus; and text contrast must stay ≥4.5.' } }
  ]
};
