# IoT设备图层管理更新

## 📋 修改说明

### 1. Sleepad 只显示边框
**修改**：移除矩形填充，只保留边框线

**原因**：
- 更清晰简洁
- 不遮挡背后的内容
- 突出3个绿色传感器圆点

### 2. IoT设备始终在最上层
**实现**：新增`drawObjects`批量绘制函数

**原因**：
- IoT设备是关键监测设备
- 需要始终可见，不被家具遮挡
- 便于用户识别和操作

---

## 🎨 Sleepad 视觉效果

### 修改前
```
  ┌─────────────┐
  │█ ● █ ● █ ● █│  有紫色底色
  └─────────────┘
```

### 修改后
```
  ┌─────────────┐
  │  ●   ●   ●  │  只有边框，无底色
  └─────────────┘
```

**特点**：
- 边框：紫色（设备颜色）
- 填充：无（透明）
- 圆点：绿色（保持不变）

---

## 🔧 绘制顺序管理

### 新增函数：drawObjects()

**功能**：批量绘制对象，确保IoT设备在最上层

**实现逻辑**：
```typescript
export function drawObjects(objects: BaseObject[], context: DrawContext): void {
  // 1. 分离IoT设备和其他对象
  const furnitureObjects = objects.filter(obj => !isDevice(obj));
  const iotDevices = objects.filter(obj => isDevice(obj));
  
  // 2. 先绘制家具/结构（底层）
  furnitureObjects.forEach(obj => drawObject(obj, context));
  
  // 3. 再绘制IoT设备（顶层）
  iotDevices.forEach(obj => drawObject(obj, context));
}
```

---

## 📊 图层顺序

### Canvas绘制顺序（从下到上）

```
Layer 3: IoT设备（最上层）
         ├─ Radar
         ├─ Sleepad
         └─ Sensor
         
Layer 2: 家具/结构（中层）
         ├─ Bed
         ├─ Table
         ├─ Wall
         └─ Other
         
Layer 1: 坐标系/网格（底层）
         ├─ Grid
         ├─ Axes
         └─ Background
```

---

## 💡 设计理由

### 为什么IoT设备要在最上层？

1. **可见性优先**
   - IoT设备是监测的核心
   - 需要始终可见可操作
   - 避免被家具遮挡

2. **用户体验**
   - 用户需要清楚看到设备位置
   - 便于点击选中设备
   - 便于调整设备配置

3. **实际对应**
   - 现实中IoT设备安装在墙上/天花板
   - 不会被家具完全遮挡
   - 视觉上应该突出

4. **操作便利**
   - Read/Write操作需要先选中设备
   - 设备在上层更容易点击
   - 避免误选家具

### 为什么Sleepad无底色？

1. **视觉清晰**
   - 无底色更简洁
   - 不会遮挡床的轮廓
   - 突出绿色传感器圆点

2. **层次分明**
   - 边框表示设备范围
   - 圆点表示传感器位置
   - 不与家具颜色混淆

3. **实际对应**
   - Sleepad放在床垫下
   - 实际使用时看不到底色
   - 只需标识传感器位置

---

## 🔧 代码修改

### 1. Sleepad边框修改

**文件**：`src/utils/drawDevices.ts`

**修改前**：
```typescript
// 绘制矩形边框
ctx.rect(-6, -3, 12, 6);
ctx.fillStyle = visual.transparent ? 'transparent' : visual.color;
ctx.fill();  // 有填充
ctx.strokeStyle = visual.color;
ctx.stroke();
```

**修改后**：
```typescript
// 绘制矩形边框（只有边框，无底色）
ctx.rect(-6, -3, 12, 6);
ctx.strokeStyle = visual.color;
ctx.lineWidth = 1;
ctx.stroke();  // 只有边框
```

---

### 2. 批量绘制函数

**文件**：`src/utils/drawObjects.ts`

**新增函数**：
```typescript
/**
 * 绘制多个对象，确保IoT设备始终在最上层
 * @param objects 对象数组
 * @param context 绘制上下文
 */
export function drawObjects(objects: BaseObject[], context: DrawContext): void {
  // 分离IoT设备和其他对象
  const furnitureObjects: BaseObject[] = [];
  const iotDevices: BaseObject[] = [];
  
  objects.forEach(obj => {
    if (isDevice(obj)) {
      iotDevices.push(obj);
    } else {
      furnitureObjects.push(obj);
    }
  });
  
  // 先绘制家具/结构（底层）
  furnitureObjects.forEach(obj => {
    drawObject(obj, context);
  });
  
  // 再绘制IoT设备（顶层）
  iotDevices.forEach(obj => {
    drawObject(obj, context);
  });
}
```

---

## 📝 使用方式

### 单个对象绘制（原有方式）
```typescript
// 直接绘制单个对象
drawObject(obj, context);
```

### 批量绘制（推荐使用）
```typescript
// 自动处理图层顺序
const allObjects = objectsStore.objects;
drawObjects(allObjects, context);

// 结果：
// 1. 先绘制所有家具/结构
// 2. 再绘制所有IoT设备（在最上层）
```

---

## 🎯 实际效果

### 场景：床上有Sleepad

**绘制顺序**：
```
1. 绘制床（矩形，蓝灰色）
   ┌──────────┐
   │          │
   │   床     │
   │          │
   └──────────┘

2. 绘制Sleepad（在床上方）
   ┌──────────┐
   │  ┌────┐  │
   │  │ ● ●│● │  Sleepad始终可见
   │  └────┘  │
   └──────────┘
```

### 场景：墙角有Radar

**绘制顺序**：
```
1. 绘制墙（黑色线）
   │
   │ 墙
   │

2. 绘制Radar（在墙上方）
   │  W
   │ ▓▓▓  
   │ ╱●╲  Radar图标清晰可见
```

---

## 📊 对比表

| 特征 | 修改前 | 修改后 |
|------|--------|--------|
| **Sleepad填充** | 有底色 | 无底色（透明） |
| **Sleepad边框** | 有 | 有（保持） |
| **传感器圆点** | 绿色 | 绿色（保持） |
| **绘制顺序** | 顺序绘制 | 分层绘制 |
| **IoT位置** | 可能被遮挡 | 始终在顶层 |
| **家具位置** | 混合绘制 | 在底层 |

---

## ✅ 优点总结

### Sleepad无底色
- ✅ 视觉更简洁
- ✅ 不遮挡床的颜色
- ✅ 传感器圆点更突出
- ✅ 边框清晰标识范围

### IoT设备在顶层
- ✅ 始终可见
- ✅ 便于点击选中
- ✅ 避免被遮挡
- ✅ 符合实际物理位置
- ✅ 更好的用户体验

---

## 🔍 技术要点

### 1. isDevice() 判断
```typescript
// 使用设备分类判断
if (obj.device.category === 'iot') {
  // IoT设备
} else {
  // 家具/结构
}
```

### 2. 数组分离
```typescript
// 使用forEach分离，保持原有顺序
objects.forEach(obj => {
  if (isDevice(obj)) {
    iotDevices.push(obj);
  } else {
    furnitureObjects.push(obj);
  }
});
```

### 3. 分层绘制
```typescript
// 先绘制底层，后绘制顶层
furnitureObjects.forEach(obj => drawObject(obj, context));
iotDevices.forEach(obj => drawObject(obj, context));
```

---

## 📚 相关文档

- `SLEEPAD_DESIGN.md` - Sleepad设计说明
- `RADAR_DESIGN_FINAL.md` - 雷达设计说明
- `drawObjects.ts` - 绘制函数实现

---

## 📁 修改文件

| 文件 | 修改内容 | 行数 |
|------|---------|------|
| `src/utils/drawDevices.ts` | Sleepad移除填充 | 251-256 |
| `src/utils/drawObjects.ts` | 新增drawObjects函数 | 60-88 |
| `IOT_LAYER_UPDATE.md` | 新增文档 | - |

---

**版本**：v1.0  
**日期**：2025-10-29  
**状态**：✅ 已实现  
**核心改进**：IoT设备图层管理 + Sleepad视觉优化

