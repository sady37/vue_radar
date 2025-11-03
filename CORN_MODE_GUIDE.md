# Corn（墙角）模式说明

## 概述

Corn 模式是雷达安装在墙角时的特殊模式，在边界计算上与 Wall 模式相同。

## 三种安装模式对比

| 模式 | 安装位置 | rearV值 | 边界形状 | 探测区域 |
|------|---------|---------|---------|---------|
| **Ceiling** | 吸顶安装 | 有值（如200） | 矩形 | 4个方向 |
| **Wall** | 贴墙安装 | 0（紧贴墙壁） | 梯形 | 前方+左右 |
| **Corn** | 墙角安装 | 0（紧贴墙壁） | 梯形/扇形 | 前方+左右 |

## 边界计算规则

### Ceiling 模式（吸顶）

```typescript
// 4个角都有边界
radarVertices = [
  { h: -boundary.rightH, v: -boundary.rearV, z: 0 },  // 右上（后方）
  { h: boundary.leftH, v: -boundary.rearV, z: 0 },    // 左上（后方）
  { h: -boundary.rightH, v: boundary.frontV, z: 0 },  // 右下（前方）
  { h: boundary.leftH, v: boundary.frontV, z: 0 }     // 左下（前方）
];
```

**边界值示例**：
- leftH: 280, rightH: 280, frontV: 200, rearV: 200
- 形成一个矩形探测区域

### Wall 模式（贴墙）

```typescript
// 雷达紧贴墙壁，rearV=0
radarVertices = [
  { h: -boundary.rightH, v: 0, z: 0 },                // 右上（墙面）
  { h: boundary.leftH, v: 0, z: 0 },                  // 左上（墙面）
  { h: -boundary.rightH, v: boundary.frontV, z: 0 },  // 右下
  { h: boundary.leftH, v: boundary.frontV, z: 0 }     // 左下
];
```

**边界值示例**：
- leftH: 280, rightH: 280, frontV: 350, rearV: 0
- 形成一个梯形探测区域（后方紧贴墙壁）

### Corn 模式（墙角）

```typescript
// ⚠️ 与 Wall 模式使用相同的边界计算！
radarVertices = [
  { h: -boundary.rightH, v: 0, z: 0 },                // 右上（墙面）
  { h: boundary.leftH, v: 0, z: 0 },                  // 左上（墙面）
  { h: -boundary.rightH, v: boundary.frontV, z: 0 },  // 右下
  { h: boundary.leftH, v: boundary.frontV, z: 0 }     // 左下
];
```

**边界值示例**：
- leftH: 280, rightH: 280, frontV: 350, rearV: 0
- 边界计算与 Wall 相同
- 显示时可能使用扇形图形

## 代码实现位置

### 1. types.ts - 类型定义

```typescript
// 第131行：setupModel 类型定义
setupModel?: 'ceiling' | 'wall' | 'corn';  

// 第157-170行：高度配置
export const RADAR_HEIGHT_CONFIG = {
  ceiling: { min: 200, max: 300, default: 280, step: 10 },
  wall: { min: 150, max: 180, default: 165, step: 10 },
  corn: { min: 200, max: 300, default: 280, step: 10 }  // 与ceiling相同
} as const;

// 第220-248行：默认配置
export const RADAR_DEFAULT_CONFIG = {
  ceiling: { /* ... */ },
  wall: { /* ... */ },
  corn: {  // 与wall类似，但高度范围不同
    Rotation: 0,
    ReflectionH: 68.5,
    ReflectionV: 0,
    boundary: {
      leftH: 280,
      rightH: 280,
      frontV: 350,
      rearV: 0  // ⚠️ 关键：rearV=0，与wall相同
    }
  }
};
```

### 2. radarUtils.ts - 边界计算

```typescript
// 第91-128行：getRadarBoundaryVertices 函数
export function getRadarBoundaryVertices(radar: BaseObject): [Point, Point, Point, Point] {
  const setupModel = iotConfig?.setupModel || 'ceiling';
  const boundary = radarConfig!.boundary!;
  
  let radarVertices: RadarPoint[];
  
  if (setupModel === 'ceiling') {
    // Ceiling模式：矩形边界，4个角都有边界
    radarVertices = [/* rearV有值 */];
  } else {
    // ⚠️ Wall模式 和 Corn模式：使用相同的边界计算
    // 雷达紧贴墙壁，rearV=0（墙面位置）
    radarVertices = [/* rearV=0 */];
  }
  
  return canvasVertices;
}
```

### 3. drawDevices.ts - 设备绘制

```typescript
// 第15行：setupModel 参数类型
setupModel: 'ceiling' | 'wall' | 'corn' = 'ceiling'

// 第38-42行：绘制指示器
if (setupModel === 'wall' || setupModel === 'corn') {
  // wall/corn模式：绘制扇形指示器
  drawSector(ctx, position, size * 0.6, -angle / 2, angle / 2, {
    fillColor: '#ffffff',
    strokeColor: visual.color,
    opacity: 0.3
  });
}
```

## 关键要点

### ✅ 已正确实现

1. **类型定义**：`'ceiling' | 'wall' | 'corn'` 在所有地方一致
2. **边界计算**：Corn 模式与 Wall 模式使用相同的逻辑（rearV=0）
3. **高度配置**：Corn 模式有独立的高度范围配置
4. **绘制显示**：Corn 和 Wall 都显示扇形指示器

### ⚠️ 核心逻辑

```typescript
// 边界计算的核心代码
if (setupModel === 'ceiling') {
  // rearV 有值
} else {
  // wall 和 corn 都走这里
  // rearV = 0
}
```

## 使用示例

### 创建 Corn 模式雷达

```typescript
const cornRadar: BaseObject = {
  id: 'radar-001',
  typeName: 'Radar',
  device: {
    category: 'iot',
    iot: {
      deviceId: 'radar-001',
      isOnline: true,
      setupModel: 'corn',  // ⚠️ 关键：设置为 corn
      communication: 'wifi',
      radar: {
        boundary: {
          leftH: 280,
          rightH: 280,
          frontV: 350,
          rearV: 0  // ⚠️ rearV=0，与wall相同
        },
        // ... 其他配置
      }
    }
  },
  geometry: {
    type: 'point',
    data: { x: 310, y: 10, z: 280 }
  },
  // ... 其他属性
};
```

### 获取边界顶点

```typescript
// Corn 模式和 Wall 模式会得到相同形状的边界
const vertices = getRadarBoundaryVertices(cornRadar);
// 返回：[右上(墙), 左上(墙), 右下, 左下]
// 其中右上和左上的 v=0（紧贴墙壁）
```

## 总结

- **Corn 模式** 在边界计算上与 **Wall 模式完全相同**
- 两者的核心区别在于：
  - 安装位置不同（墙角 vs 墙面）
  - 可能的显示效果不同（扇形更明显）
  - 高度范围配置不同
- 代码实现时，Corn 和 Wall 共享边界计算逻辑
- 只要记住：**Corn = Wall + 墙角特征**

## 验证清单

- ✅ setupModel 类型定义包含 'corn'
- ✅ RADAR_HEIGHT_CONFIG 有 corn 配置
- ✅ RADAR_DEFAULT_CONFIG 有 corn 默认值
- ✅ getRadarBoundaryVertices 将 corn 和 wall 一起处理
- ✅ drawRadarDevice 对 corn 和 wall 使用相同的扇形指示器
- ✅ 所有边界计算中 corn 的 rearV=0

---

**文档创建时间**：2025-10-29  
**最后更新**：2025-10-29

