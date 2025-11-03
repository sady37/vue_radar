# 目录结构重构计划

## 问题分析

当前结构过于复杂，有以下问题：
1. `core/` 嵌套太深，不够直观
2. `features/` 文件夹大多为空
3. `composables/` 与 `utils/` 职责不清
4. `shared/` 命名不够明确

## 建议的新结构（参考原项目）

```
src/
├── App.vue
├── main.ts
├── style.css
│
├── components/              # Vue 组件
│   ├── RadarCanvas.vue     # 雷达画布
│   ├── WaveformMonitor.vue # 示波器
│   ├── Toolbar.vue         # 工具栏
│   └── common/             # 通用组件
│
├── config/                  # 配置文件
│   ├── radarConfig.json    # 雷达配置
│   ├── deviceTypes.ts      # 设备类型定义
│   └── constants.ts        # 常量定义
│
├── services/                # 服务层（API调用）
│   ├── radarApi.ts         # 雷达API
│   ├── websocket.ts        # WebSocket连接
│   └── dataSync.ts         # 数据同步
│
├── stores/                  # 状态管理（Pinia）
│   ├── canvas.ts           # 画布状态
│   ├── objects.ts          # 物体状态
│   ├── radarData.ts        # 雷达数据
│   └── waveform.ts         # 波形数据
│
├── utils/                   # 工具函数
│   ├── types.ts            # 类型定义 ⬅️ 从 core/types 移动
│   ├── coordinates.ts      # 坐标转换 ⬅️ 从 core/coordinates 移动
│   ├── drawing.ts          # 绘图工具 ⬅️ 从 core/rendering 移动
│   │   ├── shapes.ts       # 基本图形
│   │   ├── devices.ts      # 设备绘制
│   │   └── objects.ts      # 物体绘制
│   ├── interaction.ts      # 交互工具 ⬅️ 从 core/interaction 移动
│   └── helpers.ts          # 辅助函数
│
└── assets/                  # 资源文件
    ├── icons/              # 图标
    └── images/             # 图片
```

## 迁移对照表

### 从 core/ 迁移

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `core/types/index.ts` | `utils/types.ts` | 类型定义 |
| `core/coordinates/` | `utils/coordinates.ts` | 坐标工具 |
| `core/rendering/shapes.ts` | `utils/drawing/shapes.ts` | 基本图形 |
| `core/rendering/drawDevices.ts` | `utils/drawing/devices.ts` | 设备绘制 |
| `core/rendering/drawObjects.ts` | `utils/drawing/objects.ts` | 物体绘制 |
| `core/interaction/drawingTool.ts` | `utils/interaction.ts` | 交互工具 |

### 删除或合并

| 路径 | 操作 | 说明 |
|------|------|------|
| `features/` | 删除 | 大多为空，不需要 |
| `composables/` | 合并到 `utils/` 或 `stores/` | 根据功能合并 |
| `shared/` | 删除 | 合并到 `utils/` |
| `core/rendering/example.ts` | 删除 | 示例文件 |
| `core/interaction/demo.html` | 删除 | 演示文件 |
| `core/interaction/README.md` | 移到文档 | 文档文件 |

## 优势对比

### 原复杂结构
```
❌ src/core/rendering/shapes.ts
   - 4层嵌套
   - 不直观

❌ src/features/radar-canvas/index.ts
   - 功能不清晰
   - 空文件夹多
```

### 新简洁结构
```
✅ src/utils/drawing/shapes.ts
   - 2-3层嵌套
   - 功能清晰

✅ src/components/RadarCanvas.vue
   - 组件就是功能
   - 一目了然
```

## 实施步骤

### 第一步：创建新目录结构
```bash
mkdir -p src/components/common
mkdir -p src/config
mkdir -p src/stores
mkdir -p src/utils/drawing
mkdir -p src/assets/icons
```

### 第二步：迁移文件

1. **迁移类型定义**
   ```bash
   mv src/core/types/index.ts src/utils/types.ts
   ```

2. **迁移坐标工具**
   ```bash
   mv src/core/coordinates/radarUtils.ts src/utils/coordinates.ts
   ```

3. **迁移绘图工具**
   ```bash
   mv src/core/rendering/shapes.ts src/utils/drawing/shapes.ts
   mv src/core/rendering/drawDevices.ts src/utils/drawing/devices.ts
   mv src/core/rendering/drawObjects.ts src/utils/drawing/objects.ts
   ```

4. **迁移交互工具**
   ```bash
   mv src/core/interaction/drawingTool.ts src/utils/interaction.ts
   ```

5. **创建组件**
   ```bash
   # 从 App.vue 中拆分
   # - RadarCanvas.vue
   # - WaveformMonitor.vue
   # - Toolbar.vue
   ```

### 第三步：更新导入路径

所有文件的导入路径需要更新：
```typescript
// 旧的
import { Point } from '@/core/types';
import { drawRectangle } from '@/core/rendering/shapes';

// 新的
import { Point } from '@/utils/types';
import { drawRectangle } from '@/utils/drawing/shapes';
```

### 第四步：删除旧目录
```bash
rm -rf src/core
rm -rf src/features
rm -rf src/composables
rm -rf src/shared
```

### 第五步：创建stores

参考原项目，创建状态管理文件：
```typescript
// src/stores/canvas.ts
// src/stores/objects.ts
// src/stores/radarData.ts
// src/stores/waveform.ts
```

## 最终效果

```
src/
├── App.vue                 ✅ 主应用
├── main.ts                 ✅ 入口
├── style.css               ✅ 全局样式
├── components/             ✅ 6个组件文件
├── config/                 ✅ 3个配置文件
├── services/               ✅ 3个服务文件
├── stores/                 ✅ 4个状态文件
├── utils/                  ✅ 6个工具文件
│   └── drawing/           ✅ 3个绘图文件
└── assets/                 ✅ 资源文件

总计: ~25个文件，结构清晰，易于维护
```

## 参考原项目的优点

1. **扁平化**：最多2-3层嵌套
2. **职责明确**：一个文件夹一个功能
3. **易于查找**：文件位置直观
4. **便于维护**：不需要深入多层目录

## 建议

是否立即执行重构？我可以帮你：
1. 自动迁移所有文件
2. 更新所有导入路径
3. 创建新的组件和stores
4. 确保代码正常运行

整个过程约需要30-50个操作步骤。

