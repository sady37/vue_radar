# 快速开始

## 🎉 当前进度

### ✅ 已完成

1. **目录结构重构** - 采用扁平化设计
2. **类型定义** - 完整的 TypeScript 类型系统
3. **工具函数** - 坐标转换、绘图工具
4. **基础组件** - Canvas、Waveform、Toolbar
5. **主应用布局** - 三块横向布局

### 🔲 待实现

1. 状态管理（Pinia stores）
2. 组件通信
3. 绘图交互
4. 数据绑定

---

## 🚀 运行项目

### 1. 安装依赖

```bash
cd /Users/sady3721/project/vue_radar
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问应用

打开浏览器访问：http://localhost:5173

---

## 📂 项目结构

```
vue_radar/
├── src/
│   ├── App.vue                    ✅ 主应用（三块布局）
│   ├── main.ts                    ✅ 入口文件
│   ├── style.css                  ✅ 全局样式
│   │
│   ├── components/                ✅ Vue 组件
│   │   ├── RadarCanvas.vue       ✅ 雷达画布（坐标系、缩放）
│   │   ├── WaveformMonitor.vue   ✅ 波形监视器（4路波形）
│   │   └── Toolbar.vue           ✅ 工具栏（设备、家具、工具）
│   │
│   ├── config/                    🔲 配置目录（待创建）
│   ├── stores/                    🔲 状态管理（待创建）
│   │
│   └── utils/                     ✅ 工具函数
│       ├── types.ts              ✅ 类型定义（380行）
│       ├── radarUtils.ts         ✅ 坐标转换（483行）
│       ├── objectHelpers.ts      ✅ 对象辅助（37行）
│       ├── drawShapes.ts         ✅ 基本图形（285行）
│       ├── drawDevices.ts        ✅ 设备绘制（218行）
│       ├── drawObjects.ts        ✅ 对象绘制（236行）
│       ├── drawingTool.ts        ✅ 交互工具（345行）
│       └── index.ts              ✅ 统一导出
│
├── COMPONENTS_GUIDE.md            ✅ 组件开发指南
├── CORN_MODE_GUIDE.md             ✅ Corn模式说明
├── VERIFICATION_SUMMARY.md        ✅ 验证总结
├── LAYOUT.md                      ✅ 布局说明
├── REFACTOR_PLAN.md               ✅ 重构计划
├── PROJECT_TREE.txt               ✅ 目录树
└── QUICK_START.md                 ✅ 本文档
```

---

## 🎨 当前功能

### RadarCanvas（雷达画布）

**功能**：
- ✅ 画布坐标系（原点在顶部中心）
- ✅ 网格绘制（50单位间隔）
- ✅ 刻度标注（100单位间隔）
- ✅ 缩放控制（按钮 + 滚轮）
- ✅ 鼠标坐标显示

**操作**：
- 点击 `+/-` 按钮缩放
- 滚轮缩放
- 鼠标移动查看坐标

**尺寸**：620 × 520 px

### WaveformMonitor（波形监视器）

**功能**：
- ✅ 4路波形显示（心率、呼吸、睡眠、体动）
- ✅ 暂停/继续控制
- ✅ 清空数据
- ✅ 网格背景
- ✅ 模拟波形

**操作**：
- 点击 ⏸️ 暂停/▶️ 继续
- 点击 🗑️ 清空

**尺寸**：620 × 520 px

### Toolbar（工具栏）

**功能**：
- ✅ IoT设备（雷达、睡眠监测、传感器）
- ✅ 家具/结构（床、桌子、墙体、门）
- ✅ 绘图工具（矩形、圆形、线段、扇形）
- ✅ 视图控制（网格、刻度）

**操作**：
- 点击按钮添加设备/家具
- 点击绘图工具激活（高亮显示）
- 切换复选框控制视图

**尺寸**：200 × 520 px（可折叠）

---

## 🔧 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | 最新 | 组件框架 |
| TypeScript | 最新 | 类型安全 |
| Vite | 最新 | 构建工具 |
| Canvas API | - | 2D绘图 |
| Pinia | 待集成 | 状态管理 |

---

## 📐 坐标系统

### 画布坐标系

```
      -X ← (0,0) → +X
           ↓
          +Y

- 原点：画布顶部中心
- X轴：左负(-)，右正(+)
- Y轴：向下为正(+)
```

### 雷达坐标系（Ceiling模式）

```
      +H ← (0,0) → -H
           ↓
          +V

- 原点：雷达中心
- H轴：+H=-X（向左），-H=+X（向右）
- V轴：+V=+Y（向下），-V=-Y（向上）
```

### 坐标转换

```typescript
import { toCanvasCoordinate, toRadarCoordinate } from '@/utils';

// 雷达坐标 → 画布坐标
const canvasPoint = toCanvasCoordinate(radarPoint, radarObject);

// 画布坐标 → 雷达坐标
const radarPoint = toRadarCoordinate(canvasX, canvasY, radarObject);
```

---

## 🎯 下一步开发

### Step 1: 创建 Pinia Stores

```bash
# 创建 stores
touch src/stores/canvas.ts
touch src/stores/objects.ts
touch src/stores/radarData.ts
touch src/stores/waveform.ts
```

**优先实现**：
1. `canvas.ts` - 画布状态（缩放、网格、刻度）
2. `objects.ts` - 对象管理（设备、家具列表）

### Step 2: 实现组件通信

**Toolbar → Canvas**：
- 点击设备按钮 → 添加到画布
- 选择绘图工具 → 激活绘图模式
- 切换视图 → 更新画布显示

**Canvas → Toolbar**：
- 选中对象 → 显示属性面板
- 绘制完成 → 添加到对象列表

### Step 3: 集成绘图工具

```typescript
// 在 RadarCanvas.vue 中集成 DrawingTool
import { DrawingTool } from '@/utils';

const drawingTool = new DrawingTool(canvasRef.value!);

// 设置绘图模式
drawingTool.setMode('rectangle');

// 监听绘制完成
drawingTool.onDrawComplete((result) => {
  console.log('绘制完成:', result);
  // 添加到对象列表
});
```

### Step 4: 数据可视化

- 绘制雷达设备（使用 `drawRadarDevice`）
- 绘制家具（使用 `drawRectangle`, `drawCircle`）
- 显示雷达边界
- 显示探测目标

---

## 🐛 调试技巧

### 查看画布坐标

鼠标移动到画布上，左下角显示当前坐标：

```
X: 123 | Y: 456
```

### 查看缩放比例

画布右上角显示当前缩放：

```
[+] 100% [-]
```

### 浏览器控制台

打开开发者工具（F12），查看：
- 组件事件日志
- 错误信息
- 性能分析

---

## 📚 文档索引

| 文档 | 说明 |
|------|------|
| `QUICK_START.md` | 本文档 |
| `COMPONENTS_GUIDE.md` | 组件详细说明 |
| `CORN_MODE_GUIDE.md` | Corn模式说明 |
| `VERIFICATION_SUMMARY.md` | 验证总结 |
| `LAYOUT.md` | 布局说明 |
| `REFACTOR_PLAN.md` | 重构计划 |
| `src/PROJECT_STRUCTURE.md` | 项目结构 |

---

## 💡 常用命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview

# 类型检查
npm run type-check

# Linter
npm run lint

# 格式化
npm run format
```

---

## ❓ 常见问题

### Q: 画布不显示？

A: 检查：
1. 组件是否正确导入
2. Canvas 尺寸是否设置
3. 浏览器控制台是否有错误

### Q: 缩放不工作？

A: 检查：
1. `scale` 值是否在 0.5-2.0 范围
2. 滚轮事件是否被阻止（`@wheel.prevent`）

### Q: 如何添加新组件？

A: 
1. 在 `src/components/` 创建 `.vue` 文件
2. 在 `App.vue` 中导入
3. 更新 `COMPONENTS_GUIDE.md`

---

## 🎓 学习资源

- [Vue 3 组合式 API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [TypeScript 入门](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
- [Canvas 教程](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [Vite 配置](https://vitejs.dev/config/)

---

**版本**：v1.0  
**更新**：2025-10-29  
**状态**：✅ 基础组件完成

🚀 **现在可以开始开发了！**

