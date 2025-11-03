# WaveMonitor 3行布局设计

## 📐 界面布局

```
┌─────────────────────────────────────────────────────────────┐
│ WaveMonitor                                                  │
├─────────────────────────────────────────────────────────────┤
│ 第1行：[DeviceID] StartTime:[2025103123:27:28] ~:[2]mins   │
│        ☑Event  [PlayBack]                                   │
│                                                              │
│ 第2行：FromFile: [选择文件] sample.txt [PlayFile][PlayDemo]│
│                                                              │
│ 第3行：[Pause][Stop] 23:27:28/45s/120s  Speed: 1x 1.5x 2x  │
│                                       Display:[Radar01▼]     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 三行职责

### 第1行：DeviceID 查询参数 + PlayBack

**功能：** 从服务器查询指定设备的历史数据

**控件：**
- `DeviceID` - 设备 UUID（支持自动提示本Canvas的设备）
- `StartTime` - 开始时间
- `~` - 分隔符
- `TimeLong` - 时长（1-30分钟）
- `☑ Event` - 事件模式（自动3分钟）
- `[PlayBack]` - 执行查询并播放

**逻辑：**
```typescript
PlayBack → 查询服务器 → 返回历史数据 → 开始播放
```

---

### 第2行：文件选择 + PlayFile + PlayDemo

**功能：** 从本地文件或演示数据回放

**控件：**
- `FromFile:` - 标签
- `[选择文件]` - 打开文件选择器
- 文件名显示 - 绿色文字（已选择）或灰色（未选择）
- `[PlayFile]` - 播放已选择的文件
- `[PlayDemo]` - 播放演示数据

**逻辑：**
```typescript
选择文件 → 显示文件名 → PlayFile → 解析文件 → 开始播放

PlayDemo → 设置演示参数 → 开始播放
```

---

### 第3行：播放控制 + 进度显示 + 速度/展示

**功能：** 播放控制和状态显示

**控件：**
- `[Pause]` / `[Resume]` - 暂停/继续
- `[Stop]` - 停止（红色）
- 时间显示 - `23:27:28/45s/120s`
  - 当前轨迹时间 / 已播放秒数 / 总秒数
- `Speed:` - 播放速度（1x / 1.5x / 2x）
- `Display:` - 展示雷达选择

**逻辑：**
```typescript
播放时显示：
  - Pause 可用
  - Stop 可用
  - 时间实时更新
  - Speed 播放时禁用

停止时：
  - Pause/Stop 禁用
  - 时间隐藏
  - Speed 可调整
```

---

## 🎮 按钮启用逻辑

### 第1行：PlayBack

```typescript
启用条件：
  - selectedDeviceId ≠ 空
  - timeInput ≠ 空
```

### 第2行：PlayFile

```typescript
启用条件：
  - selectedFileName ≠ 空
  - isPlaying = false
```

### 第2行：PlayDemo

```typescript
启用条件：
  - isPlaying = false
```

### 第3行：Pause

```typescript
启用条件：
  - isPlaying = true
```

### 第3行：Stop

```typescript
启用条件：
  - isPlaying = true
```

---

## 📊 三种播放方式

### 方式 1：PlayBack（服务器查询）

```
第1行输入：
  DeviceID: 550e8400-...
  StartTime: 2025103123:27:28
  TimeLong: 2 mins
  
点击 [PlayBack]
  ↓
查询服务器：
  {
    deviceId: "550e8400-...",
    startTime: 1730418448,
    endTime: 1730418568
  }
  ↓
返回历史数据 → 开始播放
```

### 方式 2：PlayFile（文件回放）

```
第2行操作：
  1. 点击 [选择文件]
  2. 选择 sample.txt
  3. 显示文件名（绿色）
  4. 点击 [PlayFile]
  
  ↓
解析文件 → 开始播放
```

### 方式 3：PlayDemo（演示）

```
第2行操作：
  点击 [PlayDemo]
  
  ↓
自动设置：
  - DeviceID: 本Canvas第一个雷达
  - StartTime: 当前时间-5分钟
  - TimeLong: 2 mins
  - Display: 第一个雷达
  ↓
开始播放
```

---

## ⏱️ 时间显示格式

### 第3行播放时显示

```
[Pause][Stop] 23:27:28/45s/120s  Speed: ...
               ↑      ↑   ↑
            当前时间  已播  总时长
```

**组成部分：**
- **当前时间**：`23:27:28`（蓝色，当前轨迹的时间戳）
- **已播放**：`45s`（绿色，从开始到现在）
- **总时长**：`120s`（灰色，总共多少秒）

**示例：**
```
开始：00:00:00/0s/120s
10秒后：00:00:10/10s/120s
30秒后：00:00:30/30s/120s
结束：00:02:00/120s/120s
```

---

## 🎨 视觉反馈

### 文件选择状态

**未选择：**
```
FromFile: [选择文件] 未选择 [PlayFile]
                     ↑ 灰色斜体
                            ↑ 禁用
```

**已选择：**
```
FromFile: [选择文件] sample.txt [PlayFile]
                     ↑ 绿色加粗
                                ↑ 可用
```

### 播放控制状态

**未播放：**
```
[Pause][Stop]  ← 灰色禁用
Speed: [1x][1.5x][2x]  ← 可选择
```

**播放中：**
```
[Pause][Stop] 23:27:28/45s/120s  ← 可用
       ↑ 红色
Speed: [1x][1.5x][2x]  ← 禁用
```

**暂停中：**
```
[Resume][Stop] 23:27:28/45s/120s  ← 可用
 ↑ Resume
```

---

## 🔄 完整工作流程

### PlayBack 流程

```
1. 输入 DeviceID
2. 输入 StartTime
3. 设置 TimeLong 或勾选 Event
4. 点击 [PlayBack]
   ↓
5. 查询服务器
   ↓
6. 第3行显示进度
   [Pause][Stop] 23:27:28/0s/120s
   ↓
7. 实时更新时间
   [Pause][Stop] 23:27:30/2s/120s
   [Pause][Stop] 23:27:45/17s/120s
   ↓
8. 播放完成或点击 Stop
```

### PlayFile 流程

```
1. 点击 [选择文件]
2. 选择 sample.txt
   ↓ 显示文件名（绿色）
3. 点击 [PlayFile]
   ↓
4. 解析文件
   ↓
5. 第3行显示进度
   [Pause][Stop] 00:00:00/0s/120s
   ↓
6. 实时更新
```

### PlayDemo 流程

```
1. 点击 [PlayDemo]
   ↓
2. 自动填充所有参数
   ↓
3. 立即开始播放
```

---

## ✅ 功能总结

### 三种数据源
1. ✅ **PlayBack** - 服务器查询（第1行参数）
2. ✅ **PlayFile** - 本地文件（第2行选择）
3. ✅ **PlayDemo** - 演示数据（快速启动）

### 播放控制
1. ✅ **Pause/Resume** - 暂停/继续
2. ✅ **Stop** - 停止播放
3. ✅ **Speed** - 播放速度（1x / 1.5x / 2x）

### 实时反馈
1. ✅ **文件名显示** - 绿色/灰色状态
2. ✅ **时间显示** - 当前/已播/总时长
3. ✅ **按钮状态** - 启用/禁用自动管理

---

**3行布局完成：查询 → 文件 → 控制，清晰分层！** 🎉

