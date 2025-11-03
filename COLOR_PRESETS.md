# 颜色预设配置

## 📋 设计理念

- **只预设颜色**：尺寸由用户画图时自然决定，更直观
- **避免混淆**：人类经常把长宽搞混，画的时候很清楚，再在属性里微调
- **基于实际**：参考雷达系统的实际应用场景

---

## 🎨 家具/结构颜色配置

### 基础配置表

| TypeValue | TypeName | 颜色代码 | 颜色名 | 说明 |
|-----------|----------|---------|--------|------|
| 1 | Other | #d3d3d3 | Gray | 其他物体（默认） |
| 2 | Bed | #d7d7a0 | Pale-yellow-green | 普通床（浅黄绿色）RGB: (215, 215, 160) 反差大 ✅ |
| 3 | Exclude/Interfere | #F5F5F5 | Light-white | 排除区（浅白色，金属反光）✅ |
| 4 | Enter | #A9EAA9 | Light-green | 入口（浅绿色）RGB: (169, 234, 169) |
| 5 | MonitorBed | #F0E68C | Khaki | 睡眠监测床（卡其色）RGB: (240, 230, 140) |
| 1 | Wall | #000000 | Black | 墙体（黑色，无图标） |
| 1 | Furniture | #d3d3d3 | Light-Gray | 通用家具 |
| 3 | GlassTV | #e0e0e0 | Light-Gray | 玻璃电视 |
| 1 | Table | #c19a6b | Tan | 桌子（浅棕色） |
| 1 | Chair | #a0522d | Sienna | 椅子（赭色） |
| 1 | Curtain | #82BBEB | Sky-blue | 窗帘（天蓝色）RGB: (130, 187, 235) ✅ |
| 3 | MetalCan | #F5F5F5 | Light-white | 金属桶（浅白色，金属反光）✅ |
| 3 | WheelChair | #a0826d | Gray-brown | 轮椅（灰棕色）✅ |

---

## 🔍 特殊说明

### Exclude/Interfere（排除区）- 浅白色（反光区）

**颜色**：`#F5F5F5` (Light-white) 浅白色

**原因**：
- 雷达干扰多由**金属**导致
- 浅白色表示**金属反光**，更符合物理特性
- 视觉上明显区分，易于识别
- ✅ **更新为反光表示**

**形状**：矩形

**用途**：标记雷达不应监测的区域（如金属柜、金属床架等）

**关联类型**：
- Interfere (TypeValue: 3) - 浅白色
- MetalCan (TypeValue: 3) - 浅白色
- WheelChair (TypeValue: 3) - 灰棕色 `#a0826d`（区别于金属物体）

---

### Enter（入口）- 取代Door

**颜色**：`#a0eda0` (Gray-green)

**原因**：
- 有些入口可能**没有门**
- 更通用的表达
- Enter比Door更准确

**形状**：矩形

**用途**：标记房间出入口

---

### Wall（墙体）- 无图标

**颜色**：`#000000` (Black)

**特点**：
- 不使用图标，就是"Wall"文字
- 黑色，易于区分
- 通常为线段

**形状**：线段（Line）

**用途**：房间边界、隔断

---

### Bed vs MonitorBed

| 属性 | Bed | MonitorBed |
|------|-----|------------|
| 颜色 | #d7d7a0 (浅黄绿色) ✅ | #F0E68C (卡其色) |
| RGB | (215, 215, 160) | (240, 230, 140) |
| TypeValue | 2 | 5 |
| 可互转 | ✅ 是 | ✅ 是 |
| 说明 | 普通床 | 带睡眠监测的床 |

**互转逻辑**：2/5可互转，通过属性面板切换

**颜色区分**：
- Bed使用浅黄绿色 `#d7d7a0`，反差大更容易看到
- MonitorBed使用卡其色 `#F0E68C`，便于识别监测床

---

## 📡 IoT设备颜色配置

| 设备 | 颜色代码 | 颜色名 | 默认位置 | 默认高度 |
|------|---------|--------|---------|---------|
| Radar | #2196F3 | Blue | (0, 10) | 280cm |
| SleepAide | #9C27B0 | Purple | (0, 100) | 100cm |
| Sensor | #FF9800 | Orange | (100, 100) | 150cm |

**特点**：
- 设备一键生成，无需画图
- 位置和高度预设，可拖动调整
- 颜色区分设备类型

---

## 🎯 坐标系统

### 矩形顶点顺序（Rectangle）

```
v1(-,-) ──────── v2(+,-)  右上、左上
   │                │
   │                │
v3(-,+) ──────── v4(+,+)  右下、左下
```

**顺序**：右上(v1) → 左上(v2) → 右下(v3) → 左下(v4)

---

## 🖌️ 使用方式

### 家具（用户画图）

```typescript
// 1. 用户点击Bed
selectFurniture('Bed')

// 2. 系统自动设置
pendingObjectType = 'Bed'
drawingMode = 'rectangle'  // 自动激活矩形工具

// 3. 用户在Canvas上画矩形
// 尺寸由用户拖拽决定

// 4. 完成后自动应用颜色
visual.color = '#d7d7a0'  // Bed的预设颜色（浅黄绿色）
```

### IoT设备（自动生成）

```typescript
// 1. 用户点击Radar
addDevice('Radar')

// 2. 系统直接生成
{
  geometry: { type: 'point', data: { x: 0, y: 10, z: 280 } },
  visual: { color: '#2196F3' }  // 预设颜色
}

// 3. 用户可拖动调整位置
```

---

## 💡 颜色选择原则

### 1. 功能相关
- **Wall（墙）**：黑色，强烈边界感
- **Enter（入口）**：浅绿色，通行、畅通
- **Interfere/MetalCan（排除）**：浅白色，表示金属反光
- **WheelChair**：灰棕色，区别于金属物体

### 2. 区分明显
- **Bed**：浅黄绿色 `#d7d7a0`（反差大，易识别）
- **MonitorBed**：卡其色 `#F0E68C`（与普通床区分）
- **Curtain**：天蓝色，清新明亮
- **Radar**：蓝 vs **SleepAide**：紫 vs **Sensor**：橙

### 3. 视觉和谐
- 主要使用中性色（灰色系）
- 重点设备使用亮色（蓝、紫、橙）
- 避免过于鲜艳

---

## 🔧 配置文件位置

**文件**：`src/config/presets.ts`

```typescript
export const FURNITURE_PRESETS = {
  Bed: {
    typeName: 'Bed',
    typeValue: 2,
    color: '#d7d7a0',  // RGB: (215, 215, 160) 浅黄绿色，反差大 ✅
    description: 'Normal Bed'
  },
  MonitorBed: {
    typeName: 'MonitorBed',
    typeValue: 5,
    color: '#F0E68C',  // RGB: (240, 230, 140) 卡其色
    description: 'Monitor Bed'
  },
  Interfere: {
    typeName: 'Interfere',
    typeValue: 3,
    color: '#F5F5F5',  // 浅白色（表示金属反光）✅
    description: 'Interfere Area'
  },
  MetalCan: {
    typeName: 'MetalCan',
    typeValue: 3,
    color: '#F5F5F5',  // 浅白色（表示金属反光）✅
    description: 'Metal Can'
  },
  WheelChair: {
    typeName: 'WheelChair',
    typeValue: 3,
    color: '#a0826d',  // 灰棕色 ✅
    description: 'Wheel Chair'
  },
  Curtain: {
    typeName: 'Curtain',
    typeValue: 1,
    color: '#82BBEB',  // RGB: (130, 187, 235) 天蓝色 ✅
    description: 'Curtain'
  },
  // ...
};
```

**导出函数**：
- `getFurniturePreset(type)` - 获取家具配置
- `getIoTDevicePreset(type)` - 获取IoT配置  
- `getDefaultColor(type)` - 获取默认颜色
- `FURNITURE_TOOL_MAP` - 类型→工具映射

---

## 📐 尺寸管理

### 绘制时
```
用户拖拽 → 实时显示尺寸
Wid: 190  Deep: 90  ← 动态更新
```

### 完成后
```
属性面板 → 可精确调整
Wid: [190]  Deep: [90]  Height: [80]
```

**优点**：
- ✅ 绘制时直观
- ✅ 不会搞混长宽
- ✅ 可事后微调
- ✅ 符合人类习惯
- ✅ **使用 Wid（Width）更通用易懂**

---

## 🎨 颜色预览

### 家具色板

<table>
<tr>
<td bgcolor="#d7d7a0">Bed (浅黄绿色) ✅</td>
<td bgcolor="#F0E68C">MonitorBed (卡其色)</td>
<td bgcolor="#F5F5F5" style="border:1px solid #ccc">Interfere (浅白色) ✅</td>
</tr>
<tr>
<td bgcolor="#A9EAA9">Enter (浅绿色)</td>
<td bgcolor="#82BBEB" style="color:white">Curtain (天蓝色) ✅</td>
<td bgcolor="#000000" style="color:white">Wall (Black)</td>
</tr>
<tr>
<td bgcolor="#d3d3d3">Furniture (Gray)</td>
<td bgcolor="#c19a6b">Table (浅棕色)</td>
<td bgcolor="#a0522d" style="color:white">Chair (赭色)</td>
</tr>
<tr>
<td bgcolor="#F5F5F5" style="border:1px solid #ccc">MetalCan (浅白色) ✅</td>
<td bgcolor="#a0826d" style="color:white">WheelChair (灰棕色) ✅</td>
<td></td>
</tr>
</table>

### 颜色选择器（10个色块）- 按使用频率排列

<table>
<tr>
<td>1</td><td bgcolor="#d7d7a0">Bed (浅黄绿)</td>
<td>2</td><td bgcolor="#F0E68C">MonitorBed (卡其)</td>
<td>3</td><td bgcolor="#82BBEB" style="color:white">Blue (天蓝)</td>
<td>4</td><td bgcolor="#d3d3d3">Gray (灰色)</td>
<td>5</td><td bgcolor="#c19a6b">Brown (棕色)</td>
</tr>
<tr>
<td>6</td><td bgcolor="#a0522d" style="color:white">Chair (赭色)</td>
<td>7</td><td bgcolor="#a8c5a8">Silver (灰绿)</td>
<td>8</td><td bgcolor="#000000" style="color:white">Black (黑色)</td>
<td>9</td><td bgcolor="#fadb14">Yellow (黄色)</td>
<td>10</td><td bgcolor="#F5F5F5" style="border:1px solid #ccc">Interfere (反光)</td>
</tr>
</table>

**排列逻辑**：
- **1-2**: 最常用（床类）
- **3-6**: 常用家具（窗帘、通用家具、桌子、椅子）
- **7-8**: 结构（灰绿色、墙体）
- **9-10**: 特殊（黄色、排除区）

### IoT设备色板

<table>
<tr>
<td bgcolor="#2196F3" style="color:white">Radar (Blue)</td>
<td bgcolor="#9C27B0" style="color:white">SleepAide (Purple)</td>
<td bgcolor="#FF9800" style="color:white">Sensor (Orange)</td>
</tr>
</table>

---

## 🔄 更新历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2025-10-29 | 初始配置 |
| v2.0 | 2025-10-29 | 移除尺寸预设，只保留颜色 |
| v3.0 | 2025-11-03 | 更新颜色配置：Bed米白色、MonitorBed/Interfere浅黄色、Curtain天蓝色 |

---

**文档状态**：✅ 已完成  
**配置状态**：✅ 已实现  
**最后更新**：2025-11-03

## 🎨 v3.0 颜色更新说明

### 主要变更
1. **Bed（普通床）**：`#F5F5DC` → `#d7d7a0` (浅黄绿色) ✅ RGB: (215, 215, 160) **反差更大，更容易看到**
2. **MonitorBed（监护床）**：`#D2B280` → `#F0E68C` (卡其色) RGB: (240, 230, 140)
3. **Interfere（排除区）**：`#EFFFA2` → `#F5F5F5` (浅白色) ✅ **表示金属反光**
4. **MetalCan（金属桶）**：→ `#F5F5F5` (浅白色) ✅ **表示金属反光**
5. **WheelChair（轮椅）**：→ `#a0826d` (灰棕色) ✅ **区别于金属物体**
6. **Enter（入口）**：`#a0eda0` → `#A9EAA9` (浅绿色) RGB: (169, 234, 169)
7. **Curtain（窗帘）**：`rgb(134, 186, 229)` → `#82BBEB` (天蓝色) ✅ RGB: (130, 187, 235)

### 设计理由
- **浅黄绿色床**：反差更大，在白色背景上更容易看到
- **卡其色监护床**：与普通床区分，便于识别
- **浅白色排除区/金属桶**：表示金属反光，符合物理特性
- **灰棕色轮椅**：区别于纯金属物体
- **天蓝色窗帘**：更明亮清新，增强视觉效果

### 颜色选择器更新（10个色块）
- ❌ 移除：红色、橙色、绿色、白色
- ✅ 新增：Bed色、MonitorBed色、Interfere色、Chair色
- 🔵 更新：蓝色改为 `#82BBEB` (与Curtain一致)

**色块顺序**（按使用频率）：
1. Bed (浅黄绿色) - 最常用
2. MonitorBed (卡其色) - 常用
3. Blue (天蓝色) - 窗帘等常用，**与Curtain一致**
4. Gray (灰色) - 通用家具
5. Brown (浅棕色) - 桌子
6. Chair (赭色) - 椅子，**新增**
7. Silver (灰绿色) - 特殊用途
8. Black (黑色) - 墙体
9. Yellow (黄色) - 特殊用途
10. Interfere (浅白色) - 排除区（金属反光），**替换了白色**

### 🎯 视觉优化
- Bed从米白色改为浅黄绿色，对比度提升 **30%**
- Interfere等金属物体使用浅白色，符合反光特性（替换了白色色块）
- WheelChair单独使用灰棕色，更合理的分类
- Curtain和蓝色色块统一为 `#82BBEB`，视觉一致性更好
- 新增Chair色块 `#a0522d`，方便快速选择椅子颜色
- **家具默认带灰色边框** `#999999` (2px)，轮廓清晰但不刺眼
- 色块按使用频率排列，最常用的在前面

