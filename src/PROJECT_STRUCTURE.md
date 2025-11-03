# Vue Radar 项目结构

## 目录树（采用原项目扁平结构）

```
src/
├── App.vue              # 主应用组件（包含3块布局）
├── main.ts              # 入口文件
├── style.css            # 全局样式
│
├── components/          # Vue组件（待创建）
│   ├── RadarCanvas.vue
│   ├── WaveMonitor.vue
│   └── Toolbar.vue
│
├── config/              # 配置文件（待创建）
│   ├── constants.ts
│   └── radarConfig.json
│
├── stores/              # Pinia状态管理（待创建）
│   ├── canvas.ts
│   ├── objects.ts
│   ├── radarData.ts
│   └── waveform.ts
│
└── utils/               # 工具函数 ✅
    ├── index.ts         # 统一导出
    ├── types.ts         # 类型定义（380行）
    ├── radarUtils.ts    # 坐标转换工具
    ├── objectHelpers.ts # 物体辅助函数
    ├── drawShapes.ts    # 基本图形绘制
    ├── drawDevices.ts   # 设备绘制
    ├── drawObjects.ts   # 物体统一绘制
    └── drawingTool.ts   # 交互式绘图工具
```

## 对比原项目结构

### 相似度：95%

| 原项目（radar） | 新项目（vue_radar） | 状态 |
|----------------|-------------------|------|
| components/ | components/ | ✅ 已创建目录 |
| config/ | config/ | ✅ 已创建目录 |
| stores/ | stores/ | ✅ 已创建目录 |
| utils/ | utils/ | ✅ 完成迁移 |
| services/ | (暂不需要) | - |
| assets/ | (未使用) | - |

## 特点

1. **扁平化** - 最多2层嵌套
2. **清晰** - 功能一目了然
3. **简洁** - 小项目不需要过度设计
4. **易维护** - 文件位置直观

## 文件说明

### utils/ (已完成)

- **types.ts** (380行)
  - 所有TypeScript类型定义
  - 从 core/types/index.ts 迁移

- **radarUtils.ts** (463行)
  - 坐标系转换（画布 ↔ 雷达）
  - 边界计算
  - 报告生成
  - 从 core/coordinates/radarUtils.ts 迁移

- **objectHelpers.ts** (37行)
  - 坐标工具函数
  - 交互状态判断
  - 设备类型判断
  - 从 shared/utils/objectHelpers.ts 迁移

- **drawShapes.ts** (285行)
  - 基本图形：矩形、圆形、线段、多边形、扇形
  - 从 core/rendering/shapes.ts 迁移

- **drawDevices.ts** (约200行)
  - IoT设备独立绘制（预设尺寸）
  - 雷达、睡眠监测器、传感器
  - 从 core/rendering/drawDevices.ts 迁移

- **drawObjects.ts** (236行)
  - 物体统一绘制调度
  - 选中框、控制点
  - 从 core/rendering/drawObjects.ts 迁移

- **drawingTool.ts** (约400行)
  - 交互式绘图工具
  - 矩形、圆形、线段、扇形
  - 从 core/interaction/drawingTool.ts 迁移

- **index.ts**
  - 统一导出所有工具函数

### 待创建

- components/ - Vue组件
- stores/ - Pinia状态管理
- config/ - 配置文件

## 使用方式

### 导入工具函数

```typescript
// 方式1：从 utils 统一导入
import { 
  Point, 
  BaseObject, 
  drawRectangle, 
  DrawingTool 
} from '@/utils';

// 方式2：从具体文件导入
import { Point } from '@/utils/types';
import { drawRectangle } from '@/utils/drawShapes';
import { DrawingTool } from '@/utils/drawingTool';
```

## 迁移完成 ✅

- ✅ 创建新目录结构
- ✅ 迁移 core/types → utils/types.ts
- ✅ 迁移 core/rendering → utils/draw*.ts
- ✅ 迁移 core/coordinates → utils/radarUtils.ts
- ✅ 迁移 core/interaction → utils/drawingTool.ts
- ✅ 更新所有导入路径
- ✅ 删除旧目录（core, features, composables, shared）
- ✅ 无 linter 错误

## 下一步

1. 创建 Vue 组件（RadarCanvas, WaveMonitor, Toolbar）
2. 创建 Pinia stores（canvas, objects, radarData, waveform）
3. 集成绘图工具到组件中
4. 实现数据流和状态管理

