# 数据库设计文档

## 📋 目录说明

```
database/
├── README.md              # 本文档（给后端开发看的）
├── schema.sql             # 表结构定义（PostgreSQL）
├── sample_data.sql        # 示例数据（可选）
└── queries_example.sql    # 常用查询示例
```

---

## 🎯 给后端开发的说明

### 这个 Vue 项目需要后端提供什么？

**核心功能**：存储和加载 Canvas 布局（JSON 格式）

**需要的 API**：
1. `POST /api/canvas/save` - 保存布局到数据库
2. `GET /api/canvas/load/:canvasId` - 从数据库加载布局

**就这么简单！** 前端会把整个 Canvas 状态序列化成 JSON，后端只需要存/取这个 JSON。

---

## 🗄️ 数据库表结构

### 主表：`canvas_layouts`

**用途**：存储每个房间的 Canvas 布局

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | UUID | 主键（自动生成） | `550e8400-...` |
| `canvas_id` | UUID | Canvas唯一标识 | `a1b2c3d4-...` |
| `canvas_name` | VARCHAR(100) | Canvas名称（通常=房间名） | `"Room 101"` |
| `room_id` | VARCHAR(100) | 房间ID（可选，用于关联） | `"ICU-A-01"` |
| `layout_data` | JSONB | **核心字段**：完整的布局 JSON | `{...}` |
| `version` | INTEGER | 版本号（每次保存自动+1） | `5` |
| `created_at` | TIMESTAMP | 创建时间 | `2025-11-02 10:30:00` |
| `updated_at` | TIMESTAMP | 更新时间（自动触发器） | `2025-11-02 15:45:00` |
| `created_by` | VARCHAR(100) | 创建者（可选） | `"user_001"` |
| `updated_by` | VARCHAR(100) | 最后修改者（可选） | `"user_002"` |

### 历史表：`canvas_layout_history`（可选）

**用途**：保存历史版本，支持回滚

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 主键 |
| `canvas_id` | UUID | 关联的 Canvas |
| `layout_data` | JSONB | 历史版本的 JSON |
| `version` | INTEGER | 版本号 |
| `saved_at` | TIMESTAMP | 保存时间 |
| `saved_by` | VARCHAR(100) | 保存者 |

---

## 📦 layout_data 字段的 JSON 结构

**这是前端发来的 JSON 格式**（后端只需原样存储）：

```json
{
  "canvasId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "canvasName": "Room 101",
  "params": {
    "canvasId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "canvasName": "Room 101",
    "devices": [
      {
        "deviceId": "device-uuid-001",
        "deviceName": "Radar01",
        "bedId": null,
        "bedName": null
      }
    ]
  },
  "objects": [
    {
      "id": "obj_1234567890",
      "name": "Bed",
      "typeName": "Bed",
      "geometry": {
        "type": "rectangle",
        "data": {
          "vertices": [
            {"x": 100, "y": 200},
            {"x": 250, "y": 200},
            {"x": 100, "y": 350},
            {"x": 250, "y": 350}
          ]
        }
      },
      "device": null,
      "bindedDeviceId": null
    },
    {
      "id": "radar_1234567890",
      "name": "Radar01",
      "typeName": "Radar",
      "device": {
        "category": "iot",
        "iot": {
          "deviceId": "device-uuid-001",
          "radar": {
            "installModel": "ceiling",
            "boundary": {
              "leftH": 300,
              "rightH": 300,
              "frontV": 200,
              "rearV": 200
            },
            "areas": [
              {
                "areaId": 0,
                "areaType": 5,
                "objectId": "obj_1234567890",
                "vertices": [...]
              }
            ],
            "baseline": {
              "installModel": "ceiling",
              "queriedAt": "2025-11-02T10:30:00Z"
            }
          }
        }
      },
      "bindedDeviceId": "device-uuid-001"
    }
  ],
  "timestamp": "2025-11-02T10:30:00Z"
}
```

**重点**：
- 后端**不需要解析**这个 JSON 的内容
- 只需要原样存到 `layout_data` 字段（JSONB 类型）
- 前端自己会解析和使用

---

## 🚀 快速开始

### 1. 创建数据库表

```bash
# 连接到 PostgreSQL
psql -U your_user -d your_database

# 执行建表脚本
\i /path/to/vue_radar/database/schema.sql

# 检查表是否创建成功
\dt canvas_layouts
```

### 2. 实现后端 API（示例）

#### Node.js + Express + pg

```javascript
const express = require('express');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use(express.json());

// 保存布局
app.post('/api/canvas/save', async (req, res) => {
  const { canvasId, canvasName, layoutData, userId } = req.body;
  
  try {
    await pool.query(`
      INSERT INTO canvas_layouts (canvas_id, canvas_name, layout_data, updated_by)
      VALUES ($1::uuid, $2, $3, $4)
      ON CONFLICT (canvas_id) 
      DO UPDATE SET 
        canvas_name = EXCLUDED.canvas_name,
        layout_data = EXCLUDED.layout_data,
        updated_by = EXCLUDED.updated_by
    `, [canvasId, canvasName, layoutData, userId]);
    
    const result = await pool.query(
      'SELECT version, updated_at FROM canvas_layouts WHERE canvas_id = $1::uuid',
      [canvasId]
    );
    
    res.json({
      success: true,
      data: {
        canvasId,
        canvasName,
        version: result.rows[0].version,
        updatedAt: result.rows[0].updated_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 加载布局
app.get('/api/canvas/load/:canvasId', async (req, res) => {
  const { canvasId } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT canvas_name, layout_data, version, updated_at FROM canvas_layouts WHERE canvas_id = $1::uuid',
      [canvasId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Layout not found' });
    }
    
    res.json({
      success: true,
      data: {
        canvasId,
        canvasName: result.rows[0].canvas_name,
        layoutData: result.rows[0].layout_data,
        version: result.rows[0].version,
        updatedAt: result.rows[0].updated_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(3000, () => console.log('API running on port 3000'));
```

### 3. 测试 API

```bash
# 保存布局
curl -X POST http://localhost:3000/api/canvas/save \
  -H "Content-Type: application/json" \
  -d '{
    "canvasId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "canvasName": "Room 101",
    "layoutData": {"objects": []},
    "userId": "user_001"
  }'

# 加载布局
curl http://localhost:3000/api/canvas/load/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## 🔍 常用查询

### 查看所有 Canvas
```sql
SELECT 
  canvas_id,
  canvas_name,
  version,
  updated_at,
  jsonb_array_length(layout_data->'objects') as object_count
FROM canvas_layouts
ORDER BY updated_at DESC;
```

### 查看某个 Canvas 的对象列表
```sql
SELECT 
  canvas_name,
  jsonb_array_elements(layout_data->'objects')->>'name' as object_name,
  jsonb_array_elements(layout_data->'objects')->>'typeName' as object_type
FROM canvas_layouts
WHERE canvas_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

### 查找包含特定设备的 Canvas
```sql
SELECT canvas_name, canvas_id
FROM canvas_layouts
WHERE layout_data->'params'->'devices' @> '[{"deviceId": "device-uuid-001"}]';
```

### 查看历史版本
```sql
SELECT version, saved_at, saved_by
FROM canvas_layout_history
WHERE canvas_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
ORDER BY version DESC;
```

---

## 📊 数据量估算

假设：
- 100 个房间
- 每个房间平均 10 个对象（床、雷达、家具等）
- 每个 Canvas JSON 大小约 50KB

**存储需求**：
- 主表：100 × 50KB = 5MB
- 历史表（保留 10 个版本）：100 × 10 × 50KB = 50MB
- **总计**：< 100MB

**性能**：PostgreSQL JSONB 查询非常快，完全够用。

---

## 🔐 安全建议

### 1. 输入验证
```javascript
// 验证 UUID 格式
const isValidUUID = (uuid) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};

if (!isValidUUID(canvasId)) {
  return res.status(400).json({ error: 'Invalid Canvas ID' });
}
```

### 2. 权限控制
```javascript
// 检查用户是否有权限编辑该 Canvas
const hasPermission = await checkUserPermission(userId, canvasId);
if (!hasPermission) {
  return res.status(403).json({ error: 'Permission denied' });
}
```

### 3. SQL 注入防护
```javascript
// ✅ 使用参数化查询（已经在上面的示例中）
pool.query('SELECT * FROM canvas_layouts WHERE canvas_id = $1', [canvasId]);

// ❌ 绝对不要拼接 SQL
pool.query(`SELECT * FROM canvas_layouts WHERE canvas_id = '${canvasId}'`); // 危险！
```

---

## 🐛 常见问题

### Q1: layout_data 字段太大怎么办？
**A**: JSONB 类型最大 1GB，实际 Canvas 布局一般 < 1MB，完全够用。如果真的很大，可以启用 PostgreSQL 的 TOAST 压缩。

### Q2: 需要对 layout_data 内容做索引吗？
**A**: 一般不需要。如果需要按设备ID快速查询，可以创建 GIN 索引：
```sql
CREATE INDEX idx_layout_data_devices ON canvas_layouts USING GIN ((layout_data->'params'->'devices'));
```

### Q3: 版本号如何自增？
**A**: 已经在 `schema.sql` 中配置了触发器，每次 UPDATE 自动 +1。

### Q4: 如何回滚到历史版本？
**A**: 
```sql
UPDATE canvas_layouts
SET layout_data = (
  SELECT layout_data FROM canvas_layout_history
  WHERE canvas_id = $1 AND version = $2
)
WHERE canvas_id = $1;
```

---

## 📞 联系前端

如果有任何问题，请联系前端开发：
- API 契约：参考 `backend/api-design.md`
- 前端代码：`src/api/layoutApi.ts`
- 类型定义：`src/utils/types.ts` (搜索 `CanvasParams`)

---

**最后更新**: 2025-11-02  
**维护者**: Vue Radar 团队






