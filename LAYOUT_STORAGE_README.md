# Canvas Layout 存储方案

## 📋 架构概览

```
┌──────────────────────────────────────────┐
│           Vue 前端 (Browser)             │
│  ┌──────────┬──────────┬──────────────┐ │
│  │ LaySave  │  LayExp  │   LayImp     │ │
│  │ 保存到DB │ 导出文件 │  导入文件    │ │
│  └────┬─────┴────┬─────┴─────┬────────┘ │
└───────┼──────────┼───────────┼──────────┘
        │          │           │
        ▼          ▼           ▼
   ┌─────────┐ ┌──────────┐ ┌──────────┐
   │PostgreSQL│ │本地文件  │ │本地文件  │
   │ (主存储) │ │(.json)   │ │(.json)   │
   └─────────┘ └──────────┘ └──────────┘
        │
        └─── localStorage (缓存)
```

### 关键信息
- **Canvas ID**: 使用标准 **UUID** 格式（如 `a1b2c3d4-e5f6-7890-abcd-ef1234567890`）
- **Canvas Name**: 通常等于**房间名称**（如 `Room 101` 或 `ICU-A-01`）

### 三种操作
1. **LaySave (保存到数据库)**
   - 保存到 PostgreSQL
   - 支持跨设备访问、版本控制
   
2. **LayExp (导出到本地文件)**
   - 下载为 JSON 文件
   - 用于备份、迁移
   - 文件命名：`canvas_Room_101_1730123456789.json`
   
3. **LayImp (从本地文件导入)**
   - 上传 JSON 文件
   - 恢复备份
   - ⚠️ 会覆盖当前内容

---

## 🗄️ 数据库表结构

### 1. `canvas_layouts` (主表)

```sql
CREATE TABLE canvas_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID UNIQUE NOT NULL,           -- Canvas唯一标识 (UUID格式)
  canvas_name VARCHAR(100) NOT NULL,        -- Canvas名称 (通常等于房间名)
  room_id VARCHAR(100),                     -- 房间ID（可选，用于查询）
  layout_data JSONB NOT NULL,               -- Layout JSON数据
  version INTEGER DEFAULT 1,                -- 版本号
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);
```

**示例数据**:
```sql
-- canvasId: a1b2c3d4-e5f6-7890-abcd-ef1234567890
-- canvasName: "Room 101"
```

### 2. `canvas_layout_history` (历史表，可选)

```sql
CREATE TABLE canvas_layout_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id VARCHAR(100) NOT NULL,
  layout_data JSONB NOT NULL,
  version INTEGER NOT NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  saved_by VARCHAR(100)
);
```

详细 SQL 见: `database/schema.sql`

---

## 🔌 后端 API 接口

### 1. 保存 Layout
```
POST /api/canvas/save
Content-Type: application/json

{
  "canvasId": "room_001",
  "layoutData": { ... },
  "userId": "user_001"
}

Response:
{
  "success": true,
  "message": "Layout saved successfully",
  "data": {
    "canvasId": "room_001",
    "version": 5,
    "updatedAt": "2025-11-02T10:30:00Z"
  }
}
```

### 2. 加载 Layout
```
GET /api/canvas/load/:canvasId

Response:
{
  "success": true,
  "data": {
    "canvasId": "room_001",
    "layoutData": { ... },
    "version": 5,
    "updatedAt": "2025-11-02T10:30:00Z"
  }
}
```

详细 API 文档见: `backend/api-design.md`

---

## 🔧 前端实现

### 文件结构
```
src/
├── api/
│   └── layoutApi.ts           # API 服务层
├── stores/
│   └── objects.ts             # Store (修改了 saveCanvas/loadCanvas)
└── components/
    └── Toolbar.vue            # UI (LaySave 按钮)
```

### 工作流程

#### **保存流程** (LaySave 按钮)
```typescript
1. 用户点击 "LaySave"
2. objectsStore.saveCanvas(canvasId)
3. ├─ 调用 API: POST /api/canvas/save
4. │  └─ 保存到 PostgreSQL
5. └─ 同时缓存到 localStorage
6. 返回结果给用户
```

#### **加载流程** (App 启动)
```typescript
1. App.vue onMounted
2. objectsStore.loadCanvas(canvasId)
3. ├─ 调用 API: GET /api/canvas/load/:canvasId
4. │  ├─ 成功 → 使用服务器数据
5. │  │         └─ 缓存到 localStorage
6. │  └─ 失败 → 降级到 localStorage
7. 渲染 Canvas
```

---

## 🚀 部署步骤

### 1. 创建数据库表
```bash
psql -U your_user -d your_database -f database/schema.sql
```

### 2. 配置后端 API
根据 `backend/api-design.md` 实现后端接口，推荐：
- **Node.js**: Express + pg
- **Python**: FastAPI + psycopg2
- **Java**: Spring Boot + JPA

### 3. 配置前端环境变量
创建 `.env` 文件：
```env
VITE_API_BASE_URL=http://localhost:3000/api/canvas
```

生产环境修改为实际后端地址：
```env
VITE_API_BASE_URL=https://your-backend.com/api/canvas
```

### 4. 启动服务
```bash
# 前端
npm run dev

# 后端（根据实际框架）
npm start  # Node.js
uvicorn main:app --reload  # Python FastAPI
```

---

## 🧪 测试

### 1. 功能测试
```typescript
// 1. 保存测试
await objectsStore.saveCanvas('test_room_001');
// 预期: 控制台显示 "💾 Layout已保存到服务器: test_room_001, version=1"

// 2. 加载测试
await objectsStore.loadCanvas('test_room_001');
// 预期: 控制台显示 "📂 从服务器加载: test_room_001, 5个对象, version=1"

// 3. 离线测试（关闭后端）
await objectsStore.loadCanvas('test_room_001');
// 预期: 控制台显示 "⚠️ 服务器加载失败，尝试从 localStorage 加载"
```

### 2. 数据库验证
```sql
-- 查看所有 Canvas
SELECT canvas_id, version, updated_at, 
       jsonb_array_length(layout_data->'objects') as object_count
FROM canvas_layouts
ORDER BY updated_at DESC;

-- 查看某个 Canvas 的详细数据
SELECT layout_data FROM canvas_layouts WHERE canvas_id = 'room_001';

-- 查看历史版本
SELECT version, saved_at FROM canvas_layout_history 
WHERE canvas_id = 'room_001' 
ORDER BY version DESC;
```

---

## 📊 优势

1. **跨设备访问**: 
   - 护士 A 在 PC1 编辑保存 → 护士 B 在 PC2 刷新页面即可看到最新布局

2. **数据安全**: 
   - PostgreSQL 提供事务支持、备份、恢复

3. **性能优化**: 
   - localStorage 缓存加速首次加载
   - 离线模式：网络故障时仍可使用缓存数据

4. **版本控制** (可选):
   - 保存历史版本，支持回滚

5. **多租户隔离**: 
   - 每个房间 (canvasId) 独立存储

---

## 🔐 安全建议

### 1. 认证授权
```typescript
// layoutApi.ts
headers: {
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json'
}
```

### 2. 权限控制
- **读权限**: 所有医护人员可查看
- **写权限**: 仅管理员/负责人可编辑
- **删除权限**: 仅管理员

### 3. 输入验证
```typescript
// 后端验证
if (!canvasId || !layoutData || !layoutData.objects) {
  return { success: false, message: 'Invalid data' };
}
```

### 4. SQL 注入防护
```sql
-- ✅ 使用参数化查询
SELECT * FROM canvas_layouts WHERE canvas_id = $1;

-- ❌ 禁止字符串拼接
SELECT * FROM canvas_layouts WHERE canvas_id = '${canvasId}';
```

---

## 🐛 故障排查

### 问题 1: "网络错误，无法连接到服务器"
**原因**: 后端 API 未启动或 URL 配置错误

**解决**:
```bash
# 1. 检查后端是否运行
curl http://localhost:3000/api/canvas/load/test_room_001

# 2. 检查 .env 配置
cat .env | grep VITE_API_BASE_URL
```

### 问题 2: "CORS 跨域错误"
**原因**: 后端未配置 CORS

**解决** (Node.js/Express):
```javascript
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173',  // 前端地址
  credentials: true
}));
```

### 问题 3: "保存成功但刷新后数据丢失"
**原因**: 数据保存到 localStorage 但未保存到数据库

**排查**:
```sql
-- 检查数据库是否有记录
SELECT * FROM canvas_layouts WHERE canvas_id = 'room_001';
```

---

## 📞 支持

如有问题，请检查：
1. `database/schema.sql` - 数据库表结构
2. `backend/api-design.md` - API 接口文档
3. `src/api/layoutApi.ts` - 前端 API 调用
4. 浏览器控制台 Console - 查看日志

---

**最后更新**: 2025-11-02
**版本**: 1.0.0

