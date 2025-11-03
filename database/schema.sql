-- ============================================
-- Canvas Layout 存储表
-- ============================================

CREATE TABLE IF NOT EXISTS canvas_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Canvas 标识（使用标准 UUID）
  canvas_id UUID UNIQUE NOT NULL,           -- Canvas唯一标识（UUID格式）
  canvas_name VARCHAR(100) NOT NULL,        -- Canvas名称（通常等于房间名称）
  room_id VARCHAR(100),                     -- 关联的房间ID（可选，用于查询）
  
  -- Layout 数据（JSONB 格式，支持索引和查询）
  layout_data JSONB NOT NULL,               -- 完整的 Canvas JSON
  
  -- 版本和时间
  version INTEGER DEFAULT 1,                -- 版本号（每次保存+1）
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 操作人
  created_by VARCHAR(100),                  -- 创建者
  updated_by VARCHAR(100)                   -- 最后修改者
);

-- 索引
CREATE INDEX idx_canvas_layouts_canvas_id ON canvas_layouts(canvas_id);
CREATE INDEX idx_canvas_layouts_room_id ON canvas_layouts(room_id);
CREATE INDEX idx_canvas_layouts_updated_at ON canvas_layouts(updated_at DESC);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_canvas_layouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_canvas_layouts_updated_at
  BEFORE UPDATE ON canvas_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_canvas_layouts_updated_at();

-- ============================================
-- 可选：历史版本表（如果需要回滚）
-- ============================================

CREATE TABLE IF NOT EXISTS canvas_layout_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL,                  -- 使用 UUID 格式
  layout_data JSONB NOT NULL,
  version INTEGER NOT NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  saved_by VARCHAR(100)
);

CREATE INDEX idx_canvas_layout_history_canvas_id ON canvas_layout_history(canvas_id);
CREATE INDEX idx_canvas_layout_history_version ON canvas_layout_history(canvas_id, version DESC);

-- ============================================
-- 示例：layout_data 的 JSON 结构
-- ============================================

/*
{
  "canvasId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",  // UUID 格式
  "canvasName": "Room 101",                             // Canvas名称（房间名）
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
    ],
    "currentDeviceId": "device-uuid-001"
  },
  "objects": [
    {
      "id": "obj_1234567890",
      "name": "Bed",
      "typeName": "Bed",
      "geometry": {...},
      "device": {...},
      "bindedDeviceId": "device-uuid-001"
    }
  ],
  "timestamp": "2025-11-02T10:30:00Z"
}
*/

