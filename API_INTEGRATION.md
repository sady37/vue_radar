# 📡 雷达系统历史记录查询API集成文档

## 概述

本文档描述如何通过API查询房间/床位的历史雷达数据配置，并传递给Vue前端播放。

---

## 🎯 业务流程

```
用户输入房间/床位/时间 
    ↓
前端调用查询API
    ↓
后端查询数据库（房间→雷达ID+布局）
    ↓
返回配置JSON
    ↓
Vue接收配置并初始化
    ↓
WaveMonitor切换到fromserver模式
    ↓
播放历史数据
```

---

## 📋 API接口定义

### 查询雷达配置

**接口地址：** `POST /api/query-radar-config`

**请求参数：**

```typescript
{
  roomId: string;      // 房间ID，例如 "101"
  bedId: string;       // 床位ID，例如 "1" 
  startTime: number;   // 开始时间戳（毫秒）
  endTime: number;     // 结束时间戳（毫秒）
}
```

**响应数据：**

```typescript
{
  success: boolean;
  data: {
    radarId: string;           // 雷达设备ID
    deviceCode: string;        // 设备编码
    deviceName: string;        // 设备名称
    layout: {                  // 布局配置
      radar: {                 // 雷达配置
        position: { x: number; y: number };
        rotation: number;
        config: {
          horizontalAngle: number;
          verticalAngle: number;
          maxDistance: number;
        }
      };
      furniture: Array<{       // 家具配置
        type: string;
        position: { x: number; y: number };
        rotation: number;
        width: number;
        height: number;
      }>;
    };
    timeRange: {
      start: number;
      end: number;
    };
  };
  message?: string;
}
```

---

## 🗃️ 数据库查询逻辑

### 数据库表结构（参考）

```sql
-- 房间床位与雷达绑定表
CREATE TABLE bed_radar_binding (
  id INT PRIMARY KEY,
  room_id VARCHAR(50),
  bed_id VARCHAR(50),
  radar_id VARCHAR(100),
  device_code VARCHAR(100),
  bind_time BIGINT,
  unbind_time BIGINT,
  layout_config TEXT,  -- JSON格式的布局配置
  INDEX idx_room_bed (room_id, bed_id),
  INDEX idx_time (bind_time, unbind_time)
);
```

### 查询SQL示例

```sql
-- 查询指定时间段内的雷达绑定配置
SELECT 
  radar_id,
  device_code,
  layout_config
FROM bed_radar_binding
WHERE room_id = ?
  AND bed_id = ?
  AND bind_time <= ?
  AND (unbind_time IS NULL OR unbind_time >= ?)
ORDER BY bind_time DESC
LIMIT 1;
```

---

## 💻 后端实现示例（Node.js + Express）

```javascript
// /api/query-radar-config
app.post('/api/query-radar-config', async (req, res) => {
  try {
    const { roomId, bedId, startTime, endTime } = req.body;
    
    // 参数验证
    if (!roomId || !bedId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: '参数不完整'
      });
    }
    
    // 查询数据库
    const sql = `
      SELECT 
        radar_id,
        device_code,
        layout_config
      FROM bed_radar_binding
      WHERE room_id = ?
        AND bed_id = ?
        AND bind_time <= ?
        AND (unbind_time IS NULL OR unbind_time >= ?)
      ORDER BY bind_time DESC
      LIMIT 1
    `;
    
    const [rows] = await db.query(sql, [roomId, bedId, startTime, startTime]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该时间段的雷达配置'
      });
    }
    
    const binding = rows[0];
    const layoutConfig = JSON.parse(binding.layout_config);
    
    // 返回配置
    res.json({
      success: true,
      data: {
        radarId: binding.radar_id,
        deviceCode: binding.device_code,
        deviceName: `${roomId}-${bedId}`,
        layout: layoutConfig,
        timeRange: {
          start: startTime,
          end: endTime
        }
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

## 🔗 URL参数模式（直接访问）

支持通过URL参数直接访问，适合外部系统集成。

### URL格式

```
http://localhost:5173/?mode=query&roomId=101&bedId=1&start=1699000000000&end=1699003600000
```

### 参数说明

- `mode=query`: 查询模式
- `roomId`: 房间ID
- `bedId`: 床位ID  
- `start`: 开始时间戳
- `end`: 结束时间戳

### 实现逻辑

在 `App.vue` 的 `onMounted` 中添加：

```typescript
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  
  if (mode === 'query') {
    const roomId = urlParams.get('roomId');
    const bedId = urlParams.get('bedId');
    const start = urlParams.get('start');
    const end = urlParams.get('end');
    
    if (roomId && bedId && start && end) {
      // 自动查询并播放
      autoQueryAndPlay(roomId, bedId, parseInt(start), parseInt(end));
    }
  }
  
  // ... 其他初始化逻辑
});
```

---

## 🎬 前端使用示例

### 方式1：用户手动查询

```typescript
// 1. 用户点击查询按钮
<button @click="showQueryPanel = true">查询历史</button>

// 2. 填写表单并提交
// 3. QueryPanel组件自动调用API
// 4. 接收配置并更新store
// 5. 自动播放
```

### 方式2：URL参数直接访问

```bash
# 外部系统直接打开URL
http://your-domain/?mode=query&roomId=101&bedId=1&start=xxx&end=xxx
```

---

## 📊 数据流程图

```
┌──────────────────────────────────────────────────────────┐
│                     用户/外部系统                          │
└─────────────┬────────────────────────────────────────────┘
              │
              ├─ 方式1: 手动输入 ──→ QueryPanel.vue
              │                         │
              │                         ↓
              │                    调用API
              │                         │
              └─ 方式2: URL参数 ────────┤
                                        │
                                        ↓
                        POST /api/query-radar-config
                                        │
                                        ↓
                            ┌──────────────────┐
                            │   数据库查询      │
                            │ bed_radar_binding│
                            └──────────────────┘
                                        │
                                        ↓
                            返回 {radarId, layout, ...}
                                        │
                                        ↓
                            ┌──────────────────┐
                            │  canvasStore     │
                            │  setParams()     │
                            └──────────────────┘
                                        │
                                        ↓
                            ┌──────────────────┐
                            │ radarDataStore   │
                            │ setMode('fromserver') │
                            └──────────────────┘
                                        │
                                        ↓
                            ┌──────────────────┐
                            │  WaveMonitor     │
                            │  播放历史数据     │
                            └──────────────────┘
```

---

## ✅ 完整集成步骤

### 后端

1. ✅ 创建 `bed_radar_binding` 表
2. ✅ 实现 `/api/query-radar-config` 接口
3. ✅ 添加数据库查询逻辑
4. ✅ 返回标准JSON格式

### 前端

1. ✅ 创建 `QueryPanel.vue` 组件
2. ✅ 在 `App.vue` 中集成查询面板
3. ✅ 添加URL参数解析逻辑
4. ✅ 更新 `radarDataStore` 支持模式切换

---

## 🔧 配置示例

### Layout配置JSON示例

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

## 🎯 使用场景

1. **医护查看历史**: 医护人员输入房间、床位、时间，查看患者历史活动
2. **外部系统集成**: HIS系统通过URL参数直接打开历史回放
3. **数据分析**: 研究人员查询特定时间段的数据进行分析
4. **事故回溯**: 发生跌倒等事件时，快速调取事发时间段数据

---

## 🔐 安全建议

1. **权限验证**: API需要验证用户权限
2. **数据加密**: 敏感数据传输使用HTTPS
3. **参数校验**: 严格校验输入参数，防止SQL注入
4. **访问日志**: 记录所有查询请求，用于审计

---

## 📝 总结

- ✅ 支持**两种查询方式**：手动查询 + URL参数
- ✅ **后端API简单**：一个POST接口即可
- ✅ **前端自动化**：收到配置后自动播放
- ✅ **灵活扩展**：支持外部系统集成

---

**实现完成后，用户只需输入房间/床位/时间，系统就能自动查询配置并播放历史数据！** 🎉

