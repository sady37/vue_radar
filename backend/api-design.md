# Canvas Layout API 设计

## 基础信息

- **Base URL**: `/api/canvas`
- **认证**: 根据现有系统添加（JWT/Session）
- **返回格式**: JSON
- **Canvas ID**: 使用标准 UUID 格式（如 `a1b2c3d4-e5f6-7890-abcd-ef1234567890`）
- **Canvas Name**: 通常等于房间名称（如 `Room 101`）

---

## 三种操作说明

### 1. **LaySave (保存到数据库)**
- 功能：将布局保存到 PostgreSQL 数据库
- API：`POST /api/canvas/save`
- 用途：持久化存储，支持跨设备访问
- 特点：支持版本控制、多用户共享

### 2. **LayExp (导出到本地文件)**
- 功能：将布局导出为 JSON 文件并下载到本地
- API：无需后端（前端直接操作）
- 用途：备份、迁移、版本管理
- 文件命名：`canvas_{canvasId}_{timestamp}.json`

### 3. **LayImp (从本地文件导入)**
- 功能：从本地 JSON 文件导入布局
- API：无需后端（前端直接操作）
- 用途：恢复备份、导入布局
- 注意：会覆盖当前 Canvas 内容

---

## 1. 保存 Layout (LaySave - 保存到数据库)

### `POST /api/canvas/save`

**功能**: 保存布局到 PostgreSQL 数据库

**请求体**:
```json
{
  "canvasId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",  // UUID 格式
  "canvasName": "Room 101",                             // Canvas名称（房间名）
  "layoutData": {
    "canvasId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "canvasName": "Room 101",
    "params": {...},
    "objects": [...],
    "timestamp": "2025-11-02T10:30:00Z"
  },
  "userId": "user_001"  // 可选：操作人
}
```

**响应**:
```json
{
  "success": true,
  "message": "Layout saved successfully",
  "data": {
    "canvasId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "canvasName": "Room 101",
    "version": 5,
    "updatedAt": "2025-11-02T10:30:00Z"
  }
}
```

**SQL 逻辑**:
```sql
-- 如果存在则更新，否则插入
INSERT INTO canvas_layouts (canvas_id, canvas_name, layout_data, updated_by)
VALUES ($1::uuid, $2, $3, $4)
ON CONFLICT (canvas_id) 
DO UPDATE SET 
  canvas_name = EXCLUDED.canvas_name,
  layout_data = EXCLUDED.layout_data,
  updated_by = EXCLUDED.updated_by;

-- 可选：保存历史版本
INSERT INTO canvas_layout_history (canvas_id, layout_data, version, saved_by)
SELECT canvas_id, layout_data, version, updated_by
FROM canvas_layouts
WHERE canvas_id = $1;
```

---

## 2. 加载 Layout (从数据库加载)

### `GET /api/canvas/load/:canvasId`

**功能**: 从 PostgreSQL 数据库加载布局

**URL 参数**:
- `canvasId`: Canvas 唯一标识（UUID 格式）

**示例**: `GET /api/canvas/load/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

**响应**:
```json
{
  "success": true,
  "data": {
    "canvasId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "canvasName": "Room 101",
    "layoutData": {
      "canvasId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "canvasName": "Room 101",
      "params": {...},
      "objects": [...],
      "timestamp": "2025-11-02T10:30:00Z"
    },
    "version": 5,
    "updatedAt": "2025-11-02T10:30:00Z"
  }
}
```

**如果不存在**:
```json
{
  "success": false,
  "message": "Layout not found",
  "data": null
}
```

**SQL 逻辑**:
```sql
SELECT canvas_name, layout_data, version, updated_at
FROM canvas_layouts
WHERE canvas_id = $1::uuid;
```

---

## 3. 删除 Layout (可选)

### `DELETE /api/canvas/delete/:canvasId`

**响应**:
```json
{
  "success": true,
  "message": "Layout deleted successfully"
}
```

**SQL 逻辑**:
```sql
DELETE FROM canvas_layouts WHERE canvas_id = $1;
```

---

## 4. 获取版本历史 (可选)

### `GET /api/canvas/history/:canvasId`

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "version": 5,
      "savedAt": "2025-11-02T10:30:00Z",
      "savedBy": "user_001"
    },
    {
      "version": 4,
      "savedAt": "2025-11-02T09:15:00Z",
      "savedBy": "user_002"
    }
  ]
}
```

---

## 5. 恢复历史版本 (可选)

### `POST /api/canvas/restore`

**请求体**:
```json
{
  "canvasId": "room_001",
  "version": 4
}
```

**SQL 逻辑**:
```sql
-- 从历史表恢复
UPDATE canvas_layouts
SET layout_data = (
  SELECT layout_data FROM canvas_layout_history
  WHERE canvas_id = $1 AND version = $2
)
WHERE canvas_id = $1;
```

---

## 错误处理

所有接口统一错误格式：
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "..."
  }
}
```

**常见错误码**:
- `CANVAS_NOT_FOUND`: Canvas 不存在
- `INVALID_DATA`: 数据格式错误
- `DATABASE_ERROR`: 数据库错误
- `PERMISSION_DENIED`: 权限不足

---

## 后端实现示例 (Node.js + Express + pg)

```javascript
const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// 保存 Layout
router.post('/save', async (req, res) => {
  const { canvasId, layoutData, userId } = req.body;
  
  try {
    await pool.query(`
      INSERT INTO canvas_layouts (canvas_id, layout_data, updated_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (canvas_id) 
      DO UPDATE SET 
        layout_data = EXCLUDED.layout_data,
        updated_by = EXCLUDED.updated_by
    `, [canvasId, layoutData, userId]);
    
    const result = await pool.query(
      'SELECT version, updated_at FROM canvas_layouts WHERE canvas_id = $1',
      [canvasId]
    );
    
    res.json({
      success: true,
      message: 'Layout saved successfully',
      data: {
        canvasId,
        version: result.rows[0].version,
        updatedAt: result.rows[0].updated_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save layout',
      error: { code: 'DATABASE_ERROR', details: error.message }
    });
  }
});

// 加载 Layout
router.get('/load/:canvasId', async (req, res) => {
  const { canvasId } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT layout_data, version, updated_at FROM canvas_layouts WHERE canvas_id = $1',
      [canvasId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Layout not found',
        data: null
      });
    }
    
    res.json({
      success: true,
      data: {
        canvasId,
        layoutData: result.rows[0].layout_data,
        version: result.rows[0].version,
        updatedAt: result.rows[0].updated_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load layout',
      error: { code: 'DATABASE_ERROR', details: error.message }
    });
  }
});

module.exports = router;
```

