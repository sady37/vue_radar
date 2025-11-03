-- ============================================
-- Canvas Layout 常用查询示例
-- ============================================
-- 给后端开发参考的 SQL 查询

-- ========== 基础查询 ==========

-- 1. 查看所有 Canvas（显示基本信息）
SELECT 
  canvas_id,
  canvas_name,
  room_id,
  version,
  jsonb_array_length(layout_data->'objects') as object_count,
  updated_at,
  updated_by
FROM canvas_layouts
ORDER BY updated_at DESC;

-- 2. 查看单个 Canvas 的完整数据
SELECT 
  canvas_id,
  canvas_name,
  layout_data,
  version,
  updated_at
FROM canvas_layouts
WHERE canvas_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid;

-- 3. 按房间名搜索
SELECT canvas_id, canvas_name, version, updated_at
FROM canvas_layouts
WHERE canvas_name LIKE '%Room%'
ORDER BY canvas_name;

-- 4. 查看最近更新的 Canvas
SELECT 
  canvas_name,
  updated_at,
  updated_by,
  version
FROM canvas_layouts
ORDER BY updated_at DESC
LIMIT 10;

-- ========== JSONB 查询（深入 layout_data）==========

-- 5. 查看某个 Canvas 的所有对象
SELECT 
  canvas_name,
  jsonb_array_elements(layout_data->'objects')->>'id' as object_id,
  jsonb_array_elements(layout_data->'objects')->>'name' as object_name,
  jsonb_array_elements(layout_data->'objects')->>'typeName' as object_type
FROM canvas_layouts
WHERE canvas_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid;

-- 6. 查找包含雷达设备的所有 Canvas
SELECT 
  canvas_name,
  canvas_id,
  jsonb_array_length(
    layout_data->'params'->'devices'
  ) as device_count
FROM canvas_layouts
WHERE layout_data->'params'->'devices' IS NOT NULL
  AND jsonb_array_length(layout_data->'params'->'devices') > 0;

-- 7. 查找包含特定设备ID的 Canvas
SELECT canvas_name, canvas_id
FROM canvas_layouts
WHERE layout_data->'params'->'devices' @> '[{"deviceId": "radar-device-001"}]';

-- 8. 统计每个 Canvas 的对象类型分布
SELECT 
  canvas_name,
  jsonb_array_elements(layout_data->'objects')->>'typeName' as object_type,
  COUNT(*) as count
FROM canvas_layouts
GROUP BY canvas_name, object_type
ORDER BY canvas_name, count DESC;

-- 9. 查找包含床的所有 Canvas
SELECT 
  canvas_name,
  canvas_id
FROM canvas_layouts,
     jsonb_array_elements(layout_data->'objects') as obj
WHERE obj->>'typeName' = 'Bed';

-- 10. 查找绑定了设备的所有对象
SELECT 
  canvas_name,
  obj->>'name' as object_name,
  obj->>'typeName' as object_type,
  obj->>'bindedDeviceId' as device_id
FROM canvas_layouts,
     jsonb_array_elements(layout_data->'objects') as obj
WHERE obj->>'bindedDeviceId' IS NOT NULL;

-- ========== 管理查询 ==========

-- 11. 统计数据库使用情况
SELECT 
  COUNT(*) as total_canvas,
  SUM(jsonb_array_length(layout_data->'objects')) as total_objects,
  AVG(jsonb_array_length(layout_data->'objects')) as avg_objects_per_canvas,
  pg_size_pretty(pg_total_relation_size('canvas_layouts')) as table_size
FROM canvas_layouts;

-- 12. 查找超过特定版本号的 Canvas（活跃编辑）
SELECT 
  canvas_name,
  version,
  updated_at,
  updated_by
FROM canvas_layouts
WHERE version > 5
ORDER BY version DESC;

-- 13. 查找长时间未更新的 Canvas
SELECT 
  canvas_name,
  updated_at,
  NOW() - updated_at as time_since_update
FROM canvas_layouts
WHERE updated_at < NOW() - INTERVAL '30 days'
ORDER BY updated_at;

-- ========== 历史版本查询 ==========

-- 14. 查看某个 Canvas 的所有历史版本
SELECT 
  version,
  saved_at,
  saved_by
FROM canvas_layout_history
WHERE canvas_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
ORDER BY version DESC;

-- 15. 对比当前版本和历史版本的对象数量
SELECT 
  'current' as version_type,
  version,
  jsonb_array_length(layout_data->'objects') as object_count
FROM canvas_layouts
WHERE canvas_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
UNION ALL
SELECT 
  'history' as version_type,
  version,
  jsonb_array_length(layout_data->'objects') as object_count
FROM canvas_layout_history
WHERE canvas_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
ORDER BY version DESC;

-- ========== 维护操作 ==========

-- 16. 删除某个 Canvas 的所有历史版本（保留最近5个）
DELETE FROM canvas_layout_history
WHERE canvas_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
  AND version NOT IN (
    SELECT version FROM canvas_layout_history
    WHERE canvas_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
    ORDER BY version DESC
    LIMIT 5
  );

-- 17. 清理 90 天前的历史数据
DELETE FROM canvas_layout_history
WHERE saved_at < NOW() - INTERVAL '90 days';

-- 18. 重建索引（性能优化）
REINDEX TABLE canvas_layouts;
REINDEX TABLE canvas_layout_history;

-- 19. 分析表（更新统计信息）
ANALYZE canvas_layouts;
ANALYZE canvas_layout_history;

-- ========== 高级查询（性能优化）==========

-- 20. 创建 GIN 索引（加速 JSONB 查询）
-- 如果经常按设备ID查询，可以创建索引：
CREATE INDEX IF NOT EXISTS idx_layout_devices 
ON canvas_layouts USING GIN ((layout_data->'params'->'devices'));

-- 如果经常按对象类型查询，可以创建索引：
CREATE INDEX IF NOT EXISTS idx_layout_objects 
ON canvas_layouts USING GIN ((layout_data->'objects'));

-- 21. 查看索引使用情况
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'canvas_layouts'
ORDER BY idx_scan DESC;

-- ========== 数据导出/备份 ==========

-- 22. 导出某个 Canvas 为可读格式
SELECT 
  canvas_name,
  canvas_id::text,
  jsonb_pretty(layout_data) as layout_json
FROM canvas_layouts
WHERE canvas_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid;

-- 23. 批量导出所有 Canvas（用于备份）
COPY (
  SELECT 
    canvas_id::text,
    canvas_name,
    room_id,
    layout_data::text,
    version,
    created_at,
    updated_at
  FROM canvas_layouts
) TO '/tmp/canvas_backup.csv' WITH CSV HEADER;

-- ========== 测试查询 ==========

-- 24. 测试数据完整性
SELECT 
  canvas_name,
  CASE 
    WHEN layout_data->'canvasId' IS NULL THEN '❌ 缺少 canvasId'
    WHEN layout_data->'objects' IS NULL THEN '❌ 缺少 objects'
    WHEN jsonb_typeof(layout_data->'objects') != 'array' THEN '❌ objects 不是数组'
    ELSE '✅ 数据完整'
  END as status
FROM canvas_layouts;

-- 25. 查找 JSON 格式异常的记录
SELECT 
  canvas_name,
  canvas_id
FROM canvas_layouts
WHERE layout_data IS NULL
   OR jsonb_typeof(layout_data) != 'object'
   OR layout_data->'objects' IS NULL;



