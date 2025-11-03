# 操作指南 - B方案（修正版）

## ✅ 核心逻辑

### 1. IoT设备 - 点击直接生成
```
点击 📡 Radar  → 直接在画布中心生成雷达图标
点击 🛏️ SleepAd → 直接生成睡眠监测器
点击 🔍 Sensor  → 直接生成传感器
```
- **无需画图**
- **一键生成**
- **预设图形和配置**

### 2. 家具/结构 - 选类型自动激活工具
```
点击 🛏️ Bed  → 自动激活 ▭ Rectangle → 在Canvas上画矩形 → 自动设为床
点击 🧱 Wall → 自动激活 📏 Line     → 在Canvas上画线段 → 自动设为墙
```
- **选家具，工具自动点亮**
- **默认工具自动匹配**
- **画完自动设置类型**

### 3. 纯绘图工具 - 自由绘图
```
点击 ▭ Rectangle → 在Canvas上画矩形 → 类型未定，后续可设置
```
- **不绑定类型**
- **用于辅助图形**

---

## 📋 完整操作流程

### 流程1：添加雷达（IoT设备）

```
步骤1: 点击 📡 Radar
      ├─ 系统：✅ 在画布中心生成雷达图标（圆形，半径20）
      ├─ 系统：✅ 自动选中
      └─ 系统：✅ 属性面板显示IoT配置

步骤2: 拖动雷达到合适位置
      └─ 用户：在Canvas上拖动

步骤3: 配置雷达参数
      ├─ 用户：修改Setup模式（Ceiling/Wall/Corn）
      ├─ 用户：修改Work模式
      ├─ 用户：设置边界参数
      └─ 用户：勾选"显示边界"

步骤4: 写入到设备
      └─ 用户：点击 ✍️ Write
             └─ 系统：✅ Read/Write按钮高亮可用
```

**优点**：一键生成，效率最高！

---

### 流程2：添加床（家具）

```
步骤1: 点击 🛏️ Bed
      ├─ 系统：✅ Bed按钮高亮
      ├─ 系统：✅ Rectangle工具自动点亮
      ├─ 系统：✅ canvasStore.drawingMode = 'rectangle'
      ├─ 系统：✅ canvasStore.pendingObjectType = 'Bed'
      └─ 提示：请在Canvas上绘制床的位置

步骤2: 在Canvas上拖拽画矩形
      ├─ 用户：鼠标按下 → 拖动 → 松开
      ├─ 系统：✅ 实时显示尺寸（L: 200, W: 150）
      └─ 系统：✅ 虚线预览

步骤3: 完成绘制
      ├─ 系统：✅ 自动创建对象
      ├─ 系统：✅ 自动设置 typeName = 'Bed'
      ├─ 系统：✅ 自动设置 category = 'furniture'
      ├─ 系统：✅ 自动选中
      └─ 系统：✅ 属性面板显示（已经是Bed类型）

步骤4: 编辑属性
      ├─ 用户：修改Name为"主卧双人床"
      ├─ 用户：调整L/W/H
      └─ 用户：设置反射率

步骤5: 保存
      └─ 用户：点击 💾 Save
```

**优点**：符合思维，工具自动匹配！

---

### 流程3：添加墙体

```
步骤1: 点击 🧱 Wall
      ├─ 系统：✅ Wall按钮高亮
      ├─ 系统：✅ Line工具自动点亮
      └─ 系统：✅ 进入线段绘图模式

步骤2: 在Canvas上画线段
      └─ 用户：点击起点 → 拖动 → 点击终点

步骤3: 完成
      ├─ 系统：✅ 自动设为墙体
      └─ 系统：✅ 显示属性（typeName = 'Wall'）
```

---

### 流程4：自由绘图（不设类型）

```
步骤1: 点击 ◔ Sector（扇形工具）
      ├─ 系统：✅ Sector工具高亮
      └─ 系统：✅ pendingObjectType = null（无类型）

步骤2: 在Canvas上画扇形
      └─ 用户：点中心 → 拖边缘 → 拖弧度

步骤3: 完成
      ├─ 系统：✅ 扇形完成
      ├─ 系统：✅ typeName = 'Other'（未分类）
      └─ 可后续设置类型
```

---

## 🔧 家具类型 → 默认工具映射

| 家具类型 | 默认工具 | 说明 |
|---------|---------|------|
| 🛏️ Bed | ▭ Rectangle | 床通常是矩形 |
| 🚪 Enter | ▭ Rectangle | 入口区是矩形 |
| 🚫 Exclude | ◔ Sector | 排除区通常是扇形 |
| 🧱 Wall | 📏 Line | 墙体是线段 |
| 📺 Curtain | ▭ Rectangle | 窗帘是矩形 |
| 🪑 Table | ▭ Rectangle | 桌子是矩形 |
| 🚪 Door | ▭ Rectangle | 门是矩形 |
| 📦 Other | ▭ Rectangle | 其他默认矩形 |

**用户可以在选择家具后，再次点击其他工具切换**

---

## 🎛️ 按钮状态说明

### 绘图工具
```
未激活: 白色背景
激活:   🔵 蓝色背景 + 白字
```

### 家具按钮
```
未选中: 白色背景
选中:   🔵 蓝色背景 + 白字
```

**关键**：选择家具时，对应的绘图工具也同时点亮！

### Create按钮
```
可用（有类型或工具激活）: 正常显示
禁用（无选择）:          灰色 + 40%透明
```

### Delete按钮
```
可用（有选中对象）: 正常显示
禁用（无选中）:     灰色 + 40%透明
```

### Read/Write按钮
```
可用（选中IoT设备）: 🟢 绿色高亮
禁用（未选中IoT）:   灰色 + 40%透明
```

---

## 🎨 视觉反馈示例

### 场景1：选择床
```
Toolbar状态:
┌─────────────────────────┐
│ 📏 Line    ▭ Rectangle  │ ← Rectangle点亮🔵
│ ◔ Sector   ⭕ Circle    │
├─────────────────────────┤
│ 🛏️ Bed     🚪 Enter     │ ← Bed点亮🔵
│ 🚫 Exclude              │
│ 🧱 Wall    📺 Curtain   │
│ 📦 Other                │
└─────────────────────────┘

Canvas状态:
光标变为十字架 ✚
提示: "请绘制床的位置"
```

### 场景2：选择墙体
```
Toolbar状态:
┌─────────────────────────┐
│ 📏 Line    ▭ Rectangle  │ ← Line点亮🔵
│ ◔ Sector   ⭕ Circle    │
├─────────────────────────┤
│ 🛏️ Bed     🚪 Enter     │
│ 🚫 Exclude              │
│ 🧱 Wall    📺 Curtain   │ ← Wall点亮🔵
│ 📦 Other                │
└─────────────────────────┘
```

---

## 📊 状态流转

### 家具模式
```
初始状态
   ↓
点击Bed
   ↓
Bed高亮 + Rectangle高亮
   ↓
pendingObjectType = 'Bed'
drawingMode = 'rectangle'
   ↓
在Canvas上绘制
   ↓
完成 → 自动设为Bed
   ↓
显示属性编辑
```

### IoT设备模式
```
初始状态
   ↓
点击Radar
   ↓
直接生成设备
   ↓
自动选中
   ↓
Read/Write高亮
   ↓
可配置/可写入
```

### 纯绘图模式
```
初始状态
   ↓
点击Rectangle
   ↓
Rectangle高亮
   ↓
pendingObjectType = null
drawingMode = 'rectangle'
   ↓
在Canvas上绘制
   ↓
完成 → 类型未定
   ↓
可手动设置类型
```

---

## 🔄 数据流

### Toolbar → Canvas Store
```typescript
// 选择家具
selectFurniture('Bed')
   ↓
canvasStore.pendingObjectType = 'Bed'  ← 存储待创建类型
canvasStore.drawingMode = 'rectangle'  ← 存储绘图模式
```

### Canvas 监听 Store
```typescript
watch(() => canvasStore.drawingMode, (mode) => {
  if (mode) {
    // 进入绘图模式
    initDrawingTool(mode);
    cursor = 'crosshair';
  }
});

watch(() => canvasStore.pendingObjectType, (type) => {
  if (type) {
    // 有待创建类型
    console.log(`准备创建: ${type}`);
  }
});
```

### 绘制完成 → 创建对象
```typescript
// Canvas绘制完成
onDrawingComplete((geometry) => {
  const type = canvasStore.pendingObjectType || 'Other';
  
  const newObject = {
    typeName: type,
    geometry: geometry,
    device: {
      category: type === 'Other' ? 'furniture' : 'furniture'
    }
  };
  
  objectsStore.addObject(newObject);
  
  // 清除状态
  canvasStore.endDrawing();
});
```

---

## ✅ 优点总结

### 相比旧方案
1. **IoT设备更快**：点击直接生成，无需画图
2. **家具更直观**：选床就知道要画矩形
3. **工具自动匹配**：墙→线段，床→矩形
4. **步骤更少**：2步完成（选类型→画图）
5. **符合思维**："我要加个床" → 自动进入矩形模式

### 技术优势
1. **状态集中管理**：pendingObjectType在store
2. **组件自动同步**：Toolbar设置→Canvas响应
3. **逻辑清晰**：家具用画的，IoT用生成的
4. **扩展性好**：新增家具类型只需添加映射

---

## 🧪 测试场景

### 场景1：完整流程（床）
- [x] 点击Bed按钮
- [x] Bed和Rectangle同时高亮
- [x] 在Canvas画矩形
- [x] 实时显示L/W
- [x] 完成后自动设为Bed
- [x] 属性面板显示Bed配置
- [x] 修改属性
- [x] 保存

### 场景2：IoT设备（雷达）
- [x] 点击Radar
- [x] 雷达直接生成在画布中心
- [x] 自动选中
- [x] Read/Write按钮高亮🟢
- [x] 配置参数
- [x] 写入设备

### 场景3：切换工具
- [x] 点击Bed（Rectangle激活）
- [x] 再点击Circle（切换为Circle）
- [x] 画圆形
- [x] 仍然设为Bed类型

### 场景4：Delete按钮
- [x] 未选中对象→Delete灰色禁用
- [x] 选中对象→Delete正常可用
- [x] 点击Delete→对象删除

---

## 📝 关键代码

### 家具类型映射
```typescript
const FURNITURE_TOOL_MAP: Record<string, string> = {
  'Bed': 'rectangle',
  'Wall': 'line',
  'Exclude': 'sector',
  // ...
};
```

### 选择家具函数
```typescript
const selectFurniture = (type: string) => {
  const defaultTool = FURNITURE_TOOL_MAP[type] || 'rectangle';
  
  pendingObjectType.value = type;       // 设置待创建类型
  activeTool.value = defaultTool;       // 激活工具
  canvasStore.setDrawingMode(defaultTool);  // 通知Canvas
};
```

### IoT设备直接生成
```typescript
const addDevice = (type: string) => {
  const deviceConfig = {
    typeName: type,
    geometry: { type: 'point', data: { x: 0, y: 325, z: 280 } },
    device: { category: 'iot', /* ... */ }
  };
  
  objectsStore.addObject(deviceConfig);  // 直接添加
};
```

---

**版本**：v3.0 - B方案修正版  
**更新时间**：2025-10-29  
**状态**：✅ 已实现

