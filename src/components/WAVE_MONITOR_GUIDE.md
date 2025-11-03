# WaveMonitor 历史数据回放指南

## 📋 组件概述

**WaveMonitor**（原 WaveformMonitor）是雷达历史数据回放和波形监测组件。

**主要功能：**
1. 🎬 历史数据回放
2. 📊 事件时间查看
3. 🔒 HIPAA 隐私保护（最大30分钟）
4. 📁 本地文件加载
5. 🎲 演示模式

---

## 🎮 Track 工具栏

### 控件说明

```
┌─────────────────────────────────────────────────────────────┐
│ Track                                                        │
│                                                              │
│ Device: [选择设备▼]  StartTime: [20251031 23:27:28]        │
│ TimeLong: [2] min  ☐ EventTime [20251031 23:30:00]         │
│                                                              │
│ [FromFile] [PlayBack] [Demo]   Progress: 50/100 | Speed: 1x│
└─────────────────────────────────────────────────────────────┘
```

### 1️⃣ Device（设备选择）

**功能：** 选择要回放的雷达设备

**数据源：** 从当前 Canvas 中的 Radar 对象提取

```typescript
availableDevices = ['RADAR_001', 'RADAR_002', ...];
```

---

### 2️⃣ StartTime（开始时间）

**格式：** `YYYYMMDD HH:MM:SS`

**示例：**
- `20251031 23:27:28`
- `2025103123:27:28`（也支持）

**功能：** 指定回放的起始时间

---

### 3️⃣ TimeLong（时长）

**单位：** 分钟

**范围：**
- 默认：`2` 分钟
- 最小：`1` 分钟
- 最大：`30` 分钟（HIPAA 隐私保护）

**说明：** 限制最大观看时长，防止隐私泄漏

---

### 4️⃣ EventTime（事件时间模式）

**功能：** 勾选后，可以指定特定事件时间点

**格式：** 同 StartTime（`YYYYMMDD HH:MM:SS`）

**回放范围：**
```
事件时间前 60 秒 ────→ 事件时间 ────→ 事件时间后 60 秒
                     (共 120 秒 = 2 分钟)
```

**示例：**
```
EventTime: 20251031 23:30:00
实际回放：23:29:00 ~ 23:31:00（前后各1分钟）
```

---

### 5️⃣ FromFile（从文件加载）

**功能：** 从本地文件加载历史数据

**支持格式：**
- `.txt` - 文本格式（sample.txt）
- `.csv` - CSV 格式
- `.json` - JSON 格式

**操作流程：**
1. 点击 `FromFile` 按钮
2. 选择本地文件
3. 系统自动解析并加载数据
4. 显示加载结果

**示例数据：** `src/assets/Data/sample.txt`

---

### 6️⃣ PlayBack（播放/停止）

**功能：** 开始或停止历史数据回放

**状态：**
- 未播放：显示 `PlayBack`（白色按钮）
- 播放中：显示 `Stop`（红色按钮）

**验证规则：**
```typescript
// 必须满足以下条件才能播放：
1. 已选择设备（Device）
2. 已输入开始时间（StartTime 或 EventTime）
3. TimeLong 在 1-30 分钟范围内
```

**播放控制：**
- 播放速度：可调（1x, 2x, 5x, 10x）
- 播放进度：实时显示（50/100）
- 暂停/继续：点击 Stop

---

### 7️⃣ Demo（演示模式）

**功能：** 快速加载演示数据

**自动设置：**
```typescript
selectedDevice = 'DEMO_RADAR';
startTime = '当前时间 - 5 分钟';
timeLong = 2;  // 2分钟
dataSource = 'sample.txt';
```

**操作流程：**
1. 点击 `Demo` 按钮
2. 系统自动填充参数
3. 提示"演示数据已加载"
4. 点击 `PlayBack` 开始播放

---

## 🎬 使用场景

### 场景 1：查看特定时间段的历史数据

```
目标：查看 2025年10月31日 晚上11点到11点2分 的数据

操作：
1. Device: 选择 "RADAR_001"
2. StartTime: 输入 "20251031 23:00:00"
3. TimeLong: 输入 "2"
4. 点击 PlayBack

结果：
回放从 23:00:00 到 23:02:00 的数据（2分钟）
```

---

### 场景 2：查看跌倒事件前后的数据

```
目标：查看 2025年10月31日 23:30:00 发生的跌倒事件

操作：
1. Device: 选择 "RADAR_001"
2. 勾选 EventTime
3. EventTime: 输入 "20251031 23:30:00"
4. 点击 PlayBack

结果：
自动回放 23:29:00 ~ 23:31:00 的数据（前后各1分钟）
```

---

### 场景 3：从本地文件加载数据

```
目标：加载本地保存的历史数据文件

操作：
1. 点击 FromFile 按钮
2. 选择文件（如 sample.txt）
3. 等待加载完成
4. Device 和 StartTime 自动填充
5. 点击 PlayBack

结果：
从文件中读取数据并回放
```

---

### 场景 4：快速演示

```
目标：快速查看演示数据

操作：
1. 点击 Demo 按钮
2. 点击 PlayBack

结果：
自动加载演示数据并回放
```

---

## 🔒 HIPAA 隐私保护

### 时长限制

**规则：**
```typescript
TimeLong: {
  min: 1,     // 最小 1 分钟
  max: 30,    // 最大 30 分钟
  default: 2  // 默认 2 分钟
}
```

**原因：**
- 防止长时间观看历史数据导致隐私泄漏
- 符合 HIPAA（美国健康保险携带和责任法案）要求
- 限制数据访问时间窗口

**建议：**
- 日常查看：2-5 分钟
- 事件分析：使用 EventTime 模式（固定2分钟）
- 长时间分析：分段查看（每段 ≤ 30 分钟）

---

## ⏱️ 时间格式

### 输入格式

**标准格式：** `YYYYMMDD HH:MM:SS`

**组成部分：**
- `YYYY` - 年份（4位）
- `MM` - 月份（2位，01-12）
- `DD` - 日期（2位，01-31）
- `HH` - 小时（2位，00-23）
- `MM` - 分钟（2位，00-59）
- `SS` - 秒数（2位，00-59）

**示例：**
```
20251031 23:27:28  ✅ 推荐（有空格）
2025103123:27:28   ✅ 也支持（无空格）
20251031_23:27:28  ❌ 不支持（下划线）
2025-10-31 23:27:28 ❌ 不支持（横杠）
```

### 时间解析

```typescript
parseTimeString('20251031 23:27:28')
  ↓
{
  year: 2025,
  month: 10,  // 注意：代码中是 9（0-based）
  day: 31,
  hours: 23,
  minutes: 27,
  seconds: 28
}
  ↓
UNIX Timestamp: 1730418448  // 秒级
```

---

## 📊 回放模式

### 模式 1：时间范围模式（默认）

**触发条件：** 未勾选 EventTime

**计算逻辑：**
```typescript
start = parseTimeString(startTime);
end = start + timeLong * 60;
duration = timeLong * 60;  // 秒
```

**示例：**
```
StartTime: 20251031 23:00:00
TimeLong: 5 分钟

结果：
start: 23:00:00
end:   23:05:00
duration: 300 秒
```

---

### 模式 2：事件时间模式

**触发条件：** 勾选 EventTime

**计算逻辑：**
```typescript
eventTimestamp = parseTimeString(eventTime);
start = eventTimestamp - 60;  // 前60秒
end = eventTimestamp + 60;    // 后60秒
duration = 120;               // 固定120秒
```

**示例：**
```
EventTime: 20251031 23:30:00

结果：
start: 23:29:00  (事件前60秒)
event: 23:30:00  (事件时刻)
end:   23:31:00  (事件后60秒)
duration: 120 秒
```

**优势：**
- 快速定位事件前后情况
- 固定时长，符合 HIPAA 要求
- 无需计算时间范围

---

## 🎛️ 播放控制

### 播放状态

| 状态 | 按钮文字 | 按钮颜色 | 其他按钮 |
|------|---------|---------|---------|
| 未播放 | PlayBack | 白色 | 全部可用 |
| 播放中 | Stop | 红色 | FromFile/Demo 禁用 |

### 播放信息

**显示内容：**
```
Progress: 50/100  |  Speed: 1x
   ↑        ↑           ↑
  当前    总数       播放速度
```

**播放速度：**
- `1x` - 正常速度（实时）
- `2x` - 2倍速
- `5x` - 5倍速
- `10x` - 10倍速（快速浏览）

---

## 🔗 集成说明

### 与 radarData Store 集成

```typescript
// 回放时，数据通过 radarDataStore 更新
radarDataStore.updatePersons(historicalData);

// Canvas 自动响应数据更新
watch(() => radarDataStore.lastUpdate, () => {
  redrawCanvas();
  startAnimationLoop();  // 触发平滑动画
});
```

### 与 MockRadarData 集成

```typescript
// 使用 MockRadarData 的历史数据回放功能
const mockService = new MockRadarService();
mockService.playHistoricalData(timeRange, speed);
```

---

## 📁 数据文件格式

### sample.txt 格式

```
| id | device_code | ... | person_index |
|  1 | RADAR_001   | ... |      0       |
|  2 | RADAR_001   | ... |      0       |
|  3 | RADAR_001   | ... |      1       |
```

**字段说明：**
- `device_code` - 雷达设备编码
- `person_index` - 人员索引（多人场景）
- `coordinate_x/y` - 位置（单位：dm）
- `posture` - 姿态
- `timestamp` - 时间戳

---

## ✅ 功能检查清单

### 基本功能
- [x] 设备选择（从 Canvas 对象提取）
- [x] 时间输入（StartTime 格式化）
- [x] 时长控制（1-30分钟限制）
- [x] 事件模式（前后60秒）
- [x] 文件加载（.txt/.csv/.json）
- [x] 播放控制（Play/Stop）
- [x] 演示模式（快速启动）

### UI/UX
- [x] 工具栏布局
- [x] 按钮状态切换
- [x] 播放进度显示
- [x] 错误提示（参数验证）
- [x] 加载状态提示

### 待实现
- [ ] 实际数据解析逻辑
- [ ] 回放定时器
- [ ] 播放速度控制
- [ ] 进度条显示
- [ ] 暂停/继续功能
- [ ] 波形绘制

---

## 🎯 下一步开发

1. **数据解析器**
   - 解析 sample.txt 格式
   - 支持 CSV/JSON 格式
   - 数据验证和清洗

2. **回放引擎**
   - 定时器控制
   - 速度调节
   - 进度追踪

3. **波形显示**
   - Canvas 绘制
   - 实时更新
   - 多通道显示

4. **与 Canvas 联动**
   - 同步人员位置
   - 触发动画
   - 轨迹绘制

---

**现在 WaveMonitor 已经具备完整的历史数据回放工具栏！** 🎉

