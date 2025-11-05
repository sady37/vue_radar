# 🎬 简化版历史数据播放指南

## 🎯 核心思路

**两种模式：**
1. **手动模式** - 手工导入数据文件 + layout.json
2. **自动模式** - 输入RadarID+时间，服务器下发data+layout

---

## 📦 模式1：手动导入（离线播放）

### 使用步骤

1. **准备文件**
   - `radar_data.json` - 历史雷达数据
   - `layout.json` - 布局配置

2. **导入数据**
   ```typescript
   // 通过文件选择器导入
   <input type="file" @change="loadDataFile" accept=".json" />
   <input type="file" @change="loadLayoutFile" accept=".json" />
   ```

3. **自动播放**
   - 数据和布局加载完成后自动开始播放

### 文件格式

**radar_data.json**
```json
[
  {
    "timestamp": 1699000000000,
    "persons": [{
      "id": 1,
      "posture": 6,
      "position": { "x": 0, "y": -50 },
      "heartRate": 72,
      "breathRate": 16
    }]
  },
  ...
]
```

**layout.json**
```json
{
  "radar": {
    "position": { "x": 300, "y": 100 },
    "rotation": 0,
    "config": {
      "horizontalAngle": 120,
      "verticalAngle": 60,
      "maxDistance": 300
    }
  },
  "furniture": [
    {
      "type": "bed",
      "position": { "x": 300, "y": 200 },
      "rotation": 0,
      "width": 200,
      "height": 100
    }
  ]
}
```

---

## 🌐 模式2：自动下发（在线播放）

### API接口定义

**接口：** `POST /api/radar/playback`

**请求：**
```json
{
  "radarId": "RADAR_001",
  "startTime": 1699000000000,
  "endTime": 1699003600000
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "radarId": "RADAR_001",
    "timeRange": {
      "start": 1699000000000,
      "end": 1699003600000
    },
    "layout": {
      "radar": { ... },
      "furniture": [ ... ]
    },
    "data": [
      {
        "timestamp": 1699000000000,
        "persons": [ ... ]
      },
      ...
    ]
  }
}
```

### URL参数模式

**格式：**
```
http://localhost:5173/?radarId=RADAR_001&start=1699000000000&end=1699003600000
```

**参数：**
- `radarId` - 雷达设备ID
- `start` - 开始时间戳（毫秒）
- `end` - 结束时间戳（毫秒）

---

## 💻 Vue实现

### 简化的查询面板

```vue
<template>
  <div class="simple-query">
    <h3>历史数据播放</h3>
    
    <!-- 手动模式 -->
    <div class="manual-mode">
      <h4>手动导入</h4>
      <input type="file" @change="loadData" accept=".json" />
      <input type="file" @change="loadLayout" accept=".json" />
      <button @click="playManual">播放</button>
    </div>
    
    <div class="divider">或</div>
    
    <!-- 自动模式 -->
    <div class="auto-mode">
      <h4>自动查询</h4>
      <input v-model="radarId" placeholder="雷达ID" />
      <input v-model="startTime" type="datetime-local" />
      <input v-model="endTime" type="datetime-local" />
      <button @click="playAuto">播放</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const radarId = ref('');
const startTime = ref('');
const endTime = ref('');
const manualData = ref(null);
const manualLayout = ref(null);

// 手动加载数据
const loadData = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      manualData.value = JSON.parse(e.target?.result as string);
    };
    reader.readAsText(file);
  }
};

// 手动加载布局
const loadLayout = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      manualLayout.value = JSON.parse(e.target?.result as string);
    };
    reader.readAsText(file);
  }
};

// 手动播放
const playManual = () => {
  if (!manualData.value || !manualLayout.value) {
    alert('请先导入数据和布局文件');
    return;
  }
  
  // 应用配置并播放
  applyConfigAndPlay(manualLayout.value, manualData.value);
};

// 自动播放
const playAuto = async () => {
  if (!radarId.value || !startTime.value || !endTime.value) {
    alert('请填写完整信息');
    return;
  }
  
  const start = new Date(startTime.value).getTime();
  const end = new Date(endTime.value).getTime();
  
  // 调用API
  const response = await fetch('/api/radar/playback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      radarId: radarId.value,
      startTime: start,
      endTime: end
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    // 应用配置并播放
    applyConfigAndPlay(result.data.layout, result.data.data);
  }
};

// 应用配置并播放
const applyConfigAndPlay = (layout: any, data: any) => {
  const canvasStore = useCanvasStore();
  const radarDataStore = useRadarDataStore();
  
  // 应用布局
  canvasStore.setLayout(layout);
  
  // 加载历史数据
  radarDataStore.setMode('fromserver');
  radarDataStore.loadHistoricalData(data);
  
  console.log('✅ 配置已应用，开始播放');
};
</script>
```

---

## 🗄️ 后端实现（简化版）

### API接口

```javascript
// POST /api/radar/playback
app.post('/api/radar/playback', async (req, res) => {
  try {
    const { radarId, startTime, endTime } = req.body;
    
    // 1. 查询布局配置（从配置表）
    const layoutSql = `
      SELECT layout_config 
      FROM radar_layouts 
      WHERE radar_id = ? 
        AND effective_time <= ?
      ORDER BY effective_time DESC 
      LIMIT 1
    `;
    const [layoutRows] = await db.query(layoutSql, [radarId, startTime]);
    
    if (layoutRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到布局配置'
      });
    }
    
    const layout = JSON.parse(layoutRows[0].layout_config);
    
    // 2. 查询历史数据（从数据表）
    const dataSql = `
      SELECT * 
      FROM radar_history 
      WHERE radar_id = ? 
        AND timestamp BETWEEN ? AND ?
      ORDER BY timestamp ASC
    `;
    const [dataRows] = await db.query(dataSql, [radarId, startTime, endTime]);
    
    // 3. 返回合并结果
    res.json({
      success: true,
      data: {
        radarId,
        timeRange: { start: startTime, end: endTime },
        layout: layout,
        data: dataRows
      }
    });
    
  } catch (error) {
    console.error('查询失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});
```

---

## 📊 数据库设计（简化版）

### 布局配置表

```sql
CREATE TABLE radar_layouts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  radar_id VARCHAR(100) NOT NULL,
  layout_config TEXT NOT NULL,  -- JSON格式
  effective_time BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_radar_time (radar_id, effective_time)
);
```

### 历史数据表

```sql
CREATE TABLE radar_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  radar_id VARCHAR(100) NOT NULL,
  timestamp BIGINT NOT NULL,
  persons_data TEXT NOT NULL,  -- JSON格式
  INDEX idx_radar_time (radar_id, timestamp)
);
```

---

## 🔄 完整流程对比

### 手动模式（离线）

```
1. 选择 radar_data.json → 读取到内存
2. 选择 layout.json → 读取到内存
3. 点击播放 → 应用配置 → 开始播放
```

### 自动模式（在线）

```
1. 输入 RadarID + 时间
2. 调用 API → 服务器查询
3. 返回 { layout, data }
4. 自动应用配置 → 开始播放
```

---

## 🎯 对比两种方案

| 特性 | 手动模式 | 自动模式 |
|------|---------|---------|
| **网络要求** | 无需网络 | 需要网络 |
| **服务器** | 不需要 | 需要后端API |
| **数据来源** | 本地文件 | 数据库查询 |
| **使用场景** | 离线分析、测试 | 实时查询、生产环境 |
| **输入** | 2个JSON文件 | RadarID + 时间 |
| **便捷性** | 需手动准备文件 | 一键查询播放 |

---

## 💡 推荐使用方式

### 开发/测试阶段 → 手动模式
- 快速测试不同数据
- 无需后端支持
- 灵活调试

### 生产环境 → 自动模式
- 用户友好（只需输入RadarID+时间）
- 数据统一管理
- 权限控制方便

---

## 🚀 实现步骤

### 前端（2选1或都支持）

**手动模式：**
1. ✅ 添加文件选择器
2. ✅ 读取JSON文件
3. ✅ 应用配置并播放

**自动模式：**
1. ✅ 创建查询表单（RadarID+时间）
2. ✅ 调用API接口
3. ✅ 接收data+layout
4. ✅ 自动播放

### 后端（仅自动模式需要）

1. ⏳ 创建数据库表（layouts + history）
2. ⏳ 实现 `/api/radar/playback` 接口
3. ⏳ 查询逻辑：layout + data
4. ⏳ 返回统一格式JSON

---

## 📋 总结

**核心优势：**
- ✅ **简单直接** - 只需 RadarID + 时间
- ✅ **一次返回** - layout 和 data 一起下发
- ✅ **自动播放** - Vue接收后自动开始
- ✅ **双模式** - 支持手动和自动，灵活应对不同场景

**关键点：**
- RadarID是唯一标识
- 时间范围确定数据区间
- 服务器同时返回layout和data
- Vue无需关心数据来源，统一播放

**这个方案比之前的房间/床位查询简单多了！** 🎉

