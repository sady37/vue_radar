# 📡 Vue雷达系统接口调用指南

## 🎯 核心理念

**Vue只负责展示和播放，不负责数据查询！**

- ✅ Vue接收 data + layout
- ✅ Vue自动播放
- ❌ Vue不做数据库查询
- ❌ Vue不做复杂业务逻辑

---

## 🚀 三种调用方式

### 方式1：回放模式（最简单⭐推荐）

**适用场景：** 服务器已准备好 data + layout，直接让Vue播放

**URL格式：**
```
http://localhost:5173/?mode=playback&dataUrl=/api/radar/playback/session_12345
```

**参数说明：**
- `mode=playback` - 回放模式
- `dataUrl` - 数据接口地址（返回data+layout）

**服务器接口返回格式：**
```json
{
  "radarId": "RADAR_001",
  "layout": {
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
  },
  "data": [
    {
      "timestamp": 1699000000000,
      "persons": [
        {
          "id": 1,
          "posture": 6,
          "position": { "x": 0, "y": -50 },
          "heartRate": 72,
          "breathRate": 16
        }
      ]
    }
  ]
}
```

**流程：**
```
用户/系统点击"查看历史"
    ↓
服务器准备session数据
    ↓
生成URL: ?mode=playback&dataUrl=/api/.../session_xxx
    ↓
打开Vue页面
    ↓
Vue自动请求dataUrl
    ↓
接收 layout + data
    ↓
自动播放
```

**优点：**
- ✅ 最简单：只需一个URL
- ✅ 无需传输大数据（URL很短）
- ✅ 服务器控制session，安全可控
- ✅ Vue无需关心数据来源

---

### 方式2：URL参数模式（直接传参）

**适用场景：** 直接通过URL传递所有配置

**URL格式：**
```
http://localhost:5173/
  ?radarId=RADAR_001
  &start=1699000000000
  &end=1699003600000
```

**参数说明：**
- `radarId` - 雷达设备ID
- `start` - 开始时间戳（毫秒）
- `end` - 结束时间戳（毫秒）

**流程：**
```
URL包含 radarId + 时间
    ↓
Vue检测到参数
    ↓
调用 /api/radar/playback
    ↓
接收 layout + data
    ↓
自动播放
```

**服务器需提供接口：**
```
POST /api/radar/playback
{
  "radarId": "RADAR_001",
  "startTime": 1699000000000,
  "endTime": 1699003600000
}
```

**优点：**
- ✅ URL参数清晰
- ✅ 适合外部系统集成
- ✅ 可分享链接

---

### 方式3：手动查询模式（用户交互）

**适用场景：** 用户在Vue界面手动输入查询

**界面：**
- 点击右上角🔍按钮
- 选择"自动查询"
- 输入 radarId + 时间
- 点击播放

**优点：**
- ✅ 用户友好
- ✅ 无需外部系统
- ✅ 灵活查询

---

## 💡 推荐方案对比

| 方案 | 适用场景 | URL长度 | 安全性 | 实现难度 |
|------|---------|---------|--------|---------|
| **方式1：回放模式⭐** | 生产环境 | 短 | 高 | 简单 |
| 方式2：URL参数 | 外部集成 | 短 | 中 | 简单 |
| 方式3：手动查询 | 手动操作 | - | 高 | 中等 |

---

## 🏗️ 实现示例

### 示例1：从病历系统跳转查看

**病历系统代码：**
```javascript
// 用户点击"查看48小时历史"
function viewRadarHistory(roomId, bedId) {
  // 1. 调用后端准备session
  const response = await fetch('/api/prepare-playback-session', {
    method: 'POST',
    body: JSON.stringify({
      roomId,
      bedId,
      hours: 48  // 最近48小时
    })
  });
  
  const { sessionId } = await response.json();
  
  // 2. 打开Vue页面
  const vueUrl = `http://radar-vue.com/?mode=playback&dataUrl=/api/radar/playback/session_${sessionId}`;
  window.open(vueUrl, '_blank');
}
```

**后端实现：**
```javascript
// POST /api/prepare-playback-session
app.post('/api/prepare-playback-session', async (req, res) => {
  const { roomId, bedId, hours } = req.body;
  
  // 1. 查询房间→雷达映射
  const radarId = await getRadarIdByRoom(roomId, bedId);
  
  // 2. 查询历史数据
  const endTime = Date.now();
  const startTime = endTime - hours * 3600 * 1000;
  const data = await queryRadarData(radarId, startTime, endTime);
  
  // 3. 查询布局
  const layout = await getRadarLayout(radarId, startTime);
  
  // 4. 创建session（存到Redis，5分钟过期）
  const sessionId = generateSessionId();
  await redis.setex(
    `playback:${sessionId}`,
    300,
    JSON.stringify({ radarId, layout, data })
  );
  
  res.json({ sessionId });
});

// GET /api/radar/playback/session_xxx
app.get('/api/radar/playback/session_:id', async (req, res) => {
  const sessionData = await redis.get(`playback:${req.params.id}`);
  
  if (!sessionData) {
    return res.status(404).json({ error: 'Session expired' });
  }
  
  res.json(JSON.parse(sessionData));
});
```

---

### 示例2：直接URL调用

**外部系统：**
```javascript
// 已知radarId，直接构建URL
const radarId = 'RADAR_001';
const start = Date.now() - 48 * 3600 * 1000;  // 48小时前
const end = Date.now();

const url = `http://radar-vue.com/?radarId=${radarId}&start=${start}&end=${end}`;
window.open(url, '_blank');
```

**Vue自动：**
1. 检测到 radarId + start + end
2. 调用 `/api/radar/playback`
3. 接收 data + layout
4. 自动播放

---

## 📊 数据格式要求

### Layout格式

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
      "type": "bed|chair|table|door|window",
      "position": { "x": 300, "y": 200 },
      "rotation": 0,
      "width": 200,
      "height": 100
    }
  ]
}
```

### Data格式

```json
[
  {
    "timestamp": 1699000000000,
    "persons": [
      {
        "id": 1,
        "posture": 6,  // 0-11，见姿态枚举
        "position": { "x": 0, "y": -50 },  // 雷达坐标（cm）
        "heartRate": 72,      // 可选
        "breathRate": 16,     // 可选
        "sleepState": 1       // 可选：0-3
      }
    ]
  }
]
```

### 姿态枚举

```typescript
0: Init           // 初始化
1: Walking        // 走动
2: FallSuspect    // 疑似跌倒
3: Sitting        // 坐姿
4: Standing       // 站立
5: FallConfirm    // 确认跌倒
6: Lying          // 躺卧
7: SitGroundSuspect    // 疑似坐地
8: SitGroundConfirm    // 确认坐地
9: SitUpBed            // 坐起床
10: SitUpBedSuspect    // 疑似坐起
11: SitUpBedConfirm    // 确认坐起
```

---

## ✅ Vue当前能力检查

### ✅ 已支持

- ✅ 接收 layout + data 并播放
- ✅ URL参数解析
- ✅ 回放模式
- ✅ 自动查询模式
- ✅ 手动查询界面
- ✅ WaveMonitor fromserver模式
- ✅ 姿态图标显示
- ✅ 轨迹显示
- ✅ 生理数据显示（可选）

### ❌ 不支持（也不需要）

- ❌ 数据库查询
- ❌ 房间→雷达映射
- ❌ 复杂业务逻辑
- ❌ 权限验证

---

## 🎯 总结

**Vue的职责：**
- ✅ 接收配置（layout + data）
- ✅ 展示雷达画布
- ✅ 播放历史数据
- ✅ 用户交互

**服务器的职责：**
- ✅ 数据查询（房间→雷达→数据）
- ✅ 准备session
- ✅ 权限验证
- ✅ 数据缓存

**最佳实践：**
```
1. 服务器准备好所有数据
2. 创建session（短期有效）
3. 生成URL：?mode=playback&dataUrl=xxx
4. 打开Vue页面
5. Vue自动播放
```

**这样分工清晰，Vue简单纯粹！** ✨

