# 雷达模式绘制总结

## 📋 快速对照表

| 模式 | 图形 | 扇形角度 | 指示器颜色 | 默认方向 |
|------|------|---------|-----------|---------|
| **Ceiling** | 圆形（360°） | - | ⚪ 白色 | 全向 |
| **Wall** | 扇形 | 140°（左右各70°） | 🟢 绿色 | 沿Y轴向下 |
| **Corn** | 扇形 | 90°（左右各45°） | 🟢 绿色 | 沿Y轴向下 |

---

## 🎨 视觉示意图

### Ceiling 模式（顶装）
```
      ⚪
     ╱ ╲
    ●───●
     ╲ ╱
      
  圆形全向
  白色中心点
```

### Wall 模式（壁装）
```
    ╱──╲
   ╱    ╲
  ╱  🟢  ╲
 ──140°──
   (向下)
   
扇形140度
左右各70度
绿色圆心
```

### Corn 模式（角装）
```
   ╱─╲
  ╱   ╲
 ╱ 🟢 ╲
 ──90°──
  (向下)
  
扇形90度
左右各45度
绿色圆心
```

---

## 🔧 关键参数

### Ceiling 模式
```typescript
// 圆形主体
radius: size (20px)

// 扫描波纹
outerRadius: size * 1.5 (30px)

// 白色中心点
indicatorRadius: size * 0.3 (6px)
indicatorColor: '#ffffff'
```

### Wall 模式
```typescript
// 扇形参数
centerAngle: 90°           // Y轴向下方向
halfAngle: 70°             // 左右各70度
startAngle: 20°            // 90° - 70°
endAngle: 160°             // 90° + 70°
sectorRadius: size * 2.0   // 扇形半径

// 扫描波纹
waveRadius: size * 2.5

// 绿色圆心指示器
indicatorRadius: size * 0.3
indicatorColor: '#00ff00'  // 绿色
```

### Corn 模式
```typescript
// 扇形参数
centerAngle: 90°           // Y轴向下方向
halfAngle: 45°             // 左右各45度
startAngle: 45°            // 90° - 45°
endAngle: 135°             // 90° + 45°
sectorRadius: size * 2.0   // 扇形半径

// 扫描波纹
waveRadius: size * 2.5

// 绿色圆心指示器
indicatorRadius: size * 0.3
indicatorColor: '#00ff00'  // 绿色
```

---

## 📐 坐标系说明

### Canvas 坐标系
```
        Y(+V)
         ↓
         │
         │
  ───────●───────→ X(-H)
         │
         │
         
原点在画布中上方
+X 向右（对应雷达 -H）
+Y 向下（对应雷达 +V）
```

### 雷达坐标系映射
```
雷达坐标系 → Canvas坐标系
+H (左)   → -X (左)
-H (右)   → +X (右)
+V (前)   → +Y (下)
-V (后)   → -Y (上)
```

### 扇形方向说明
```
默认（Rotation = 0°）：
- 扇形中轴沿 +Y 方向（向下）
- 对应雷达 +V 方向（前方）
- +H在左边，-H在右边
```

---

## 🎮 旋转角度

### 角度定义
```
Rotation = 0°   → 扇形朝向 +Y（下，雷达前方）
Rotation = 90°  → 扇形朝向 +X（右，雷达右侧）
Rotation = 180° → 扇形朝向 -Y（上，雷达后方）
Rotation = 270° → 扇形朝向 -X（左，雷达左侧）
```

### 实现方式
```typescript
if (rotation !== 0) {
  ctx.translate(position.x, position.y);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-position.x, -position.y);
}
```

---

## 🎯 应用场景

### Ceiling 模式（顶装）
- **安装位置**：天花板中央
- **监测范围**：全方位360度
- **适用场景**：
  - 卧室中央监测
  - 客厅全区域监测
  - 办公室人员存在检测

### Wall 模式（壁装）
- **安装位置**：墙壁上方（1.5-1.8米高度）
- **监测范围**：140度扇形
- **适用场景**：
  - 床头/床尾监测
  - 沙发区域监测
  - 门口进出检测

### Corn 模式（角装）
- **安装位置**：房间墙角（2-3米高度）
- **监测范围**：90度扇形
- **适用场景**：
  - 门口/床边特定区域
  - 墙角局部监测
  - 狭窄空间监测

---

## 💡 设计要点

### 1. 为什么用不同角度？
- **Ceiling**：360度全向覆盖
- **Wall**：140度广角，符合实际雷达波束
- **Corn**：90度窄角，适配墙角直角区域

### 2. 为什么用不同颜色？
- **白色**：全向雷达，中性色
- **绿色**：定向雷达，表示工作状态，清晰标记位置

### 3. 为什么沿Y轴对称？
- 符合雷达坐标系 +V（前方）的定义
- Canvas +Y向下，对应雷达前方
- 旋转逻辑更自然（在原地转圈）

---

## 📝 代码示例

### 添加 Ceiling 雷达
```typescript
const ceilingRadar = {
  typeName: 'Radar',
  geometry: { 
    type: 'point', 
    data: { x: 0, y: 325, z: 280 } 
  },
  device: {
    category: 'iot',
    iot: {
      setupModel: 'ceiling'
    }
  },
  visual: { color: '#2196F3' },
  angle: 0
};
```

### 添加 Wall 雷达
```typescript
const wallRadar = {
  typeName: 'Radar',
  geometry: { 
    type: 'point', 
    data: { x: -280, y: 325, z: 170 } 
  },
  device: {
    category: 'iot',
    iot: {
      setupModel: 'wall'
    }
  },
  visual: { color: '#2196F3' },
  angle: 90  // 向右旋转90度
};
```

### 添加 Corn 雷达
```typescript
const cornRadar = {
  typeName: 'Radar',
  geometry: { 
    type: 'point', 
    data: { x: -280, y: 10, z: 280 } 
  },
  device: {
    category: 'iot',
    iot: {
      setupModel: 'corn'
    }
  },
  visual: { color: '#2196F3' },
  angle: 45  // 向右旋转45度
};
```

---

## 🔍 对比总结

| 特征 | Ceiling | Wall | Corn |
|------|---------|------|------|
| **形状** | 圆形 | 扇形 | 扇形 |
| **覆盖角度** | 360° | 140° | 90° |
| **半角** | - | ±70° | ±45° |
| **指示器** | ⚪ 白色中心点 | 🟢 绿色圆心 | 🟢 绿色圆心 |
| **默认方向** | 全向 | 向下（+Y） | 向下（+Y） |
| **典型高度** | 280cm | 170cm | 280cm |
| **旋转含义** | 图标旋转 | 水平转圈 | 水平转圈 |
| **安装位置** | 天花板中央 | 墙壁上方 | 墙角上方 |

---

**文件**：`src/utils/drawDevices.ts`  
**函数**：`drawRadarDevice()`  
**版本**：v1.0  
**更新**：2025-10-29

