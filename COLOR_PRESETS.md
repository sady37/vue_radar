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
| 2 | Bed | #0cade3 | Gray-blue | 普通床（蓝灰色） |
| 3 | Exclude | #c0c0c0 | Silver | 排除区（银色，金属干扰） |
| 4 | Enter | #a0eda0 | Gray-green | 入口（灰绿色） |
| 5 | MonitorBed | #D2B280 | Gray-orange | 睡眠监测床（灰橙色） |
| 1 | Wall | #000000 | Black | 墙体（黑色，无图标） |
| 3 | TV | #d3d3d3 | Light-Gray | 电视 |
| 3 | GlassTV | #e0e0e0 | Light-Gray | 玻璃电视 |
| 1 | Table | #8b4513 | SaddleBrown | 桌子（棕色） |
| 1 | Chair | #a0522d | Sienna | 椅子（赭色） |
| 1 | Curtain | #4682b4 | SteelBlue | 窗帘（钢蓝色） |

---

## 🔍 特殊说明

### Exclude（排除区）- Silver银色

**颜色**：`#c0c0c0` (Silver)

**原因**：
- 雷达干扰多由**金属**导致
- 银色代表金属特性
- 视觉上明显区分

**形状**：矩形（改为矩形，不再使用扇形）

**用途**：标记雷达不应监测的区域（如金属柜、金属床架等）

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
| 颜色 | #0cade3 (蓝灰) | #D2B280 (灰橙) |
| TypeValue | 2 | 5 |
| 可互转 | ✅ 是 | ✅ 是 |
| 说明 | 普通床 | 带睡眠监测的床 |

**互转逻辑**：2/5可互转，通过属性面板切换

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
visual.color = '#0cade3'  // Bed的预设颜色
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
- **Enter（入口）**：绿色，通行、畅通
- **Exclude（排除）**：银色，金属干扰

### 2. 区分明显
- **Bed**：蓝灰 vs **MonitorBed**：灰橙
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
    color: '#0cade3',  // 只配置颜色
    description: '普通床'
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
L: 190  W: 90  ← 动态更新
```

### 完成后
```
属性面板 → 可精确调整
L: [190]  W: [90]  H: [80]
```

**优点**：
- ✅ 绘制时直观
- ✅ 不会搞混长宽
- ✅ 可事后微调
- ✅ 符合人类习惯

---

## 🎨 颜色预览

### 家具色板

<table>
<tr>
<td bgcolor="#d3d3d3">Other (Gray)</td>
<td bgcolor="#0cade3" style="color:white">Bed (Blue-gray)</td>
<td bgcolor="#c0c0c0">Exclude (Silver)</td>
</tr>
<tr>
<td bgcolor="#a0eda0">Enter (Green)</td>
<td bgcolor="#D2B280">MonitorBed (Orange)</td>
<td bgcolor="#000000" style="color:white">Wall (Black)</td>
</tr>
<tr>
<td bgcolor="#8b4513" style="color:white">Table (Brown)</td>
<td bgcolor="#a0522d" style="color:white">Chair (Sienna)</td>
<td bgcolor="#4682b4" style="color:white">Curtain (Steel Blue)</td>
</tr>
</table>

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

---

**文档状态**：✅ 已完成  
**配置状态**：✅ 已实现  
**最后更新**：2025-10-29

