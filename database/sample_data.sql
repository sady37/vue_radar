-- ============================================
-- Canvas Layout 示例数据
-- ============================================
-- 用途：后端开发测试用
-- 执行：psql -U your_user -d your_database -f sample_data.sql

-- 示例 1: 简单的房间布局（只有一张床）
INSERT INTO canvas_layouts (canvas_id, canvas_name, room_id, layout_data, created_by, updated_by)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'Room 101',
  'ICU-A-01',
  '{
    "canvasId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "canvasName": "Room 101",
    "params": {
      "canvasId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "canvasName": "Room 101",
      "devices": []
    },
    "objects": [
      {
        "id": "obj_bed_001",
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
        "visual": {
          "color": "#a8c5a8",
          "reflectivity": 30
        },
        "device": null
      }
    ],
    "timestamp": "2025-11-02T10:30:00Z"
  }'::jsonb,
  'admin',
  'admin'
)
ON CONFLICT (canvas_id) DO NOTHING;

-- 示例 2: 完整的房间布局（床 + 雷达 + 家具）
INSERT INTO canvas_layouts (canvas_id, canvas_name, room_id, layout_data, created_by, updated_by)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid,
  'Room 102',
  'ICU-A-02',
  '{
    "canvasId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "canvasName": "Room 102",
    "params": {
      "canvasId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "canvasName": "Room 102",
      "devices": [
        {
          "deviceId": "radar-device-001",
          "deviceName": "Radar01",
          "bedId": null,
          "bedName": null
        }
      ],
      "currentDeviceId": "radar-device-001"
    },
    "objects": [
      {
        "id": "obj_bed_002",
        "name": "Bed",
        "typeName": "Bed",
        "geometry": {
          "type": "rectangle",
          "data": {
            "vertices": [
              {"x": 200, "y": 300},
              {"x": 350, "y": 300},
              {"x": 200, "y": 450},
              {"x": 350, "y": 450}
            ]
          }
        },
        "visual": {
          "color": "#a8c5a8",
          "reflectivity": 30
        },
        "device": null
      },
      {
        "id": "radar_001",
        "name": "Radar01",
        "typeName": "Radar",
        "geometry": {
          "type": "point",
          "data": {"x": 275, "y": 375, "z": 300}
        },
        "device": {
          "category": "iot",
          "type": "Radar",
          "iot": {
            "deviceId": "radar-device-001",
            "isOnline": true,
            "radar": {
              "installModel": "ceiling",
              "workModel": "vital",
              "height": 300,
              "boundary": {
                "leftH": 300,
                "rightH": 300,
                "frontV": 200,
                "rearV": 200
              },
              "signalRadius": 500,
              "showBoundary": true,
              "showSignal": false,
              "areas": [
                {
                  "areaId": 0,
                  "areaType": 5,
                  "objectId": "obj_bed_002",
                  "objectType": "MonitorBed",
                  "vertices": [
                    {"h": 75, "v": -75},
                    {"h": -75, "v": -75},
                    {"h": 75, "v": 75},
                    {"h": -75, "v": 75}
                  ]
                }
              ]
            }
          }
        },
        "bindedDeviceId": "radar-device-001"
      },
      {
        "id": "obj_wall_001",
        "name": "Wall",
        "typeName": "Wall",
        "geometry": {
          "type": "rectangle",
          "data": {
            "vertices": [
              {"x": 50, "y": 200},
              {"x": 500, "y": 200},
              {"x": 50, "y": 220},
              {"x": 500, "y": 220}
            ]
          }
        },
        "visual": {
          "color": "#d2a679",
          "reflectivity": 30
        }
      }
    ],
    "timestamp": "2025-11-02T11:00:00Z"
  }'::jsonb,
  'admin',
  'admin'
)
ON CONFLICT (canvas_id) DO NOTHING;

-- 示例 3: 空白 Canvas（用于测试新建房间）
INSERT INTO canvas_layouts (canvas_id, canvas_name, room_id, layout_data, created_by, updated_by)
VALUES (
  'c3d4e5f6-a7b8-9012-cdef-123456789012'::uuid,
  'Room 103',
  'ICU-A-03',
  '{
    "canvasId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "canvasName": "Room 103",
    "params": {
      "canvasId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "canvasName": "Room 103",
      "devices": []
    },
    "objects": [],
    "timestamp": "2025-11-02T12:00:00Z"
  }'::jsonb,
  'admin',
  'admin'
)
ON CONFLICT (canvas_id) DO NOTHING;

-- 查看插入的数据
SELECT 
  canvas_id,
  canvas_name,
  room_id,
  version,
  jsonb_array_length(layout_data->'objects') as object_count,
  created_at
FROM canvas_layouts
ORDER BY created_at DESC;

-- 提示信息
SELECT '✅ 示例数据已插入！' as status,
       '可以使用以下 Canvas ID 进行测试:' as note;

SELECT 
  canvas_name,
  canvas_id::text as canvas_id_for_testing
FROM canvas_layouts
ORDER BY canvas_name;








