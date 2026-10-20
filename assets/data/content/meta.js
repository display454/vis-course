// ============================================================
// meta.js — 课程元数据（首页卡片 / 知识地图 / 检索 / 进度）
// 各章完整讲义在 ch01.js … ch05.js，这里只放轻量摘要。
// ============================================================

export const CHAPTERS = [
  {
    id: '01', num: '第 1 章', numEn: 'Chapter 1',
    title: { zh: '数据', en: 'Data' },
    hex: '#4a46c9',
    icon: 'database',
    desc: {
      zh: '从 DeepSeek 合成的新生数据出发，讲透数据生成、DIKW 金字塔、Stevens 测量尺度、Mackinlay 视觉通道、D3 数据变换与 Data-Join 三态。',
      en: 'From DeepSeek-generated student data to data loading, the DIKW pyramid, Stevens scales, Mackinlay channels, D3 transforms and the Data-Join lifecycle.'
    },
    tags: { zh: ['DIKW 金字塔', 'Stevens 4 尺度', 'Mackinlay 通道', '8 个 D3 函数', 'Selection 三态'],
             en: ['DIKW', 'Stevens scales', 'Mackinlay channels', 'D3 array ops', 'Data-Join'] },
    nSections: 5, nDemos: 5, nKeys: 13,
    concepts: ['数据加载', 'DIKW', '测量尺度', '视觉通道', '数据变换', 'Data-Join']
  },
  {
    id: '02', num: '第 2 章', numEn: 'Chapter 2',
    title: { zh: '数据可视化流程', en: 'Visualization Pipeline' },
    hex: '#0e7fa8',
    icon: 'flow',
    desc: {
      zh: 'Card 数据流模型，新生数据 → 分类树 → 树形列表的完整链路，d3.rollup 多层聚合、Reingold-Tilford 树布局与 DOM 事件委托。',
      en: 'Card’s reference model, student data → hierarchy → collapsible tree, d3.rollup, the Reingold-Tilford layout and DOM event delegation.'
    },
    tags: { zh: ['Card 模型', 'd3.rollup', 'Reingold-Tilford', '视觉映射', '事件委托'],
             en: ['Card model', 'd3.rollup', 'Reingold-Tilford', 'Visual mapping', 'Delegation'] },
    nSections: 4, nDemos: 4, nKeys: 10,
    concepts: ['Card 流程', '数据聚合', 'rollup', '树布局', '图元', '交互']
  },
  {
    id: '03', num: '第 3 章', numEn: 'Chapter 3',
    title: { zh: '色彩专题', en: 'Color' },
    hex: '#b43b7e',
    icon: 'palette',
    desc: {
      zh: '颜色是可视化基础：4 种颜色空间、colormap 三类、CIE Lab 色域、5 大色系、Wong/Paul Tol 经典科研配色、对错案例、配色生成器与 CVD 色盲检测。',
      en: 'Color foundations: 4 color spaces, three colormap families, CIE Lab gamut, 5 harmonies, Wong/Paul Tol palettes, right/wrong cases, a palette generator and CVD simulation.'
    },
    tags: { zh: ['4 颜色空间', 'CVD', 'colormap', '5 大色系', '科研配色', '配色生成器'],
             en: ['Color spaces', 'CVD', 'colormap', 'Harmonies', 'Palettes', 'Generator'] },
    nSections: 8, nDemos: 8, nKeys: 12,
    concepts: ['颜色空间', 'colormap', 'Lab 色域', '色系', '科研配色', 'CVD']
  },
  {
    id: '04', num: '第 4 章', numEn: 'Chapter 4',
    title: { zh: '低维数据可视化', en: 'Low-Dimensional Viz' },
    hex: '#176c6b',
    icon: 'chart',
    desc: {
      zh: 'Crime 数据的宽/长格式转换、数据→坐标→屏幕三层坐标变换、10 种曲线拟合、Cleveland 45° 黄金倾角与 Marching Squares 等值线。',
      en: 'Wide/long reshaping of Crime data, three-layer coordinate transforms, 10 curve types, Cleveland’s 45° slope principle and Marching Squares contours.'
    },
    tags: { zh: ['宽长转换', '三层坐标', '10 种曲线', 'Cleveland 45°', 'Marching Squares'],
             en: ['Reshape', 'Coordinates', 'Curves', 'Cleveland 45°', 'Marching Squares'] },
    nSections: 5, nDemos: 5, nKeys: 9,
    concepts: ['数据转换', '坐标变换', '曲线拟合', '倾角感知', '等值线']
  },
  {
    id: '05', num: '第 5 章', numEn: 'Chapter 5',
    title: { zh: '时序数据可视化', en: 'Time Series' },
    hex: '#b5601a',
    icon: 'clock',
    desc: {
      zh: '时间的 5 个属性、法国人名时间序列折线图、van Wijk 日历热图、阿基米德螺旋周期日历，以及《侏罗纪公园》Storyline 故事线。',
      en: 'Five time attributes, French-names line chart, van Wijk calendar heatmap, Archimedean spiral calendar, and the Jurassic Park storyline.'
    },
    tags: { zh: ['时间属性', '折线图', '日历热图', '阿基米德螺旋', 'Storyline'],
             en: ['Time attributes', 'Line chart', 'Calendar heatmap', 'Spiral', 'Storyline'] },
    nSections: 5, nDemos: 5, nKeys: 9,
    concepts: ['时间属性', '折线图', '日历热图', '螺旋图', '故事线']
  }
];

export const chapterById = (id) => CHAPTERS.find(c => c.id === String(id).padStart(2, '0'));
