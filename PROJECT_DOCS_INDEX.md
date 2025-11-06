# Vue Radar 项目文档索引

**版本：** v0.5-2025011050155  
**最后更新：** 2025-01-10

---

## 📚 项目分板文档 (NEW)

### 🎯 核心分板文档

| 文档名称 | 说明 | 适用对象 |
|---------|------|---------|
| **[PROJECT_MODULES.md](PROJECT_MODULES.md)** | 📋 详细模块分板文档 | 架构师、项目经理 |
| **[MODULES_TREE.md](MODULES_TREE.md)** | 🌳 简洁目录树分板 | 开发人员 |
| **[ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)** | 🏗️ 可视化架构图 | 所有人员 |

---

### 📖 阅读建议

**新成员入门：**
1. 先看 `ARCHITECTURE_DIAGRAM.md` - 了解整体架构
2. 再看 `MODULES_TREE.md` - 熟悉目录结构
3. 最后看 `PROJECT_MODULES.md` - 深入了解细节

**架构审查：**
1. `PROJECT_MODULES.md` - 模块职责和依赖
2. `ARCHITECTURE_DIAGRAM.md` - 数据流和通信机制

**日常开发：**
1. `MODULES_TREE.md` - 快速定位文件
2. 对应组件的文档 - 深入功能细节

---

## 📁 完整文档目录

### 🚀 快速开始

| 文档 | 说明 |
|------|------|
| [readme.md](readme.md) | 项目说明 |
| [QUICK_START.md](QUICK_START.md) | 快速开始指南 |
| [HOW_TO_VIEW.md](HOW_TO_VIEW.md) | 查看指南 |
| [OPERATION_GUIDE.md](OPERATION_GUIDE.md) | 操作指南 |

---

### 🏗️ 架构设计

| 文档 | 说明 | 优先级 |
|------|------|-------|
| **[ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)** | 🏗️ 系统架构图 | ⭐⭐⭐⭐⭐ |
| **[PROJECT_MODULES.md](PROJECT_MODULES.md)** | 📋 模块分板 | ⭐⭐⭐⭐⭐ |
| **[MODULES_TREE.md](MODULES_TREE.md)** | 🌳 目录树 | ⭐⭐⭐⭐ |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | 项目结构 | ⭐⭐⭐⭐ |
| [PROJECT_TREE.txt](PROJECT_TREE.txt) | 文件树 | ⭐⭐⭐ |

---

### 🎨 组件文档

#### RadarCanvas (雷达画布)
- [COMPONENTS_GUIDE.md](COMPONENTS_GUIDE.md) - 组件说明
- [RADAR_DESIGN_FINAL.md](RADAR_DESIGN_FINAL.md) - 雷达设计
- [RADAR_DRAWING_UPDATED.md](RADAR_DRAWING_UPDATED.md) - 绘制更新
- [RADAR_MODES_SUMMARY.md](RADAR_MODES_SUMMARY.md) - 模式总结
- [RADAR_AXIS_UPDATE.md](RADAR_AXIS_UPDATE.md) - 坐标轴更新
- [RADAR_ROTATION.md](RADAR_ROTATION.md) - 旋转机制
- [RADAR_CHANGES_SUMMARY.md](RADAR_CHANGES_SUMMARY.md) - 变更总结

#### WaveMonitor (波形监控)
- [src/components/WAVE_MONITOR_3ROW_LAYOUT.md](src/components/WAVE_MONITOR_3ROW_LAYOUT.md) - 3行布局
- [src/components/WAVE_MONITOR_GUIDE.md](src/components/WAVE_MONITOR_GUIDE.md) - 使用指南
- [src/components/WAVE_MONITOR_QUICK_REF.md](src/components/WAVE_MONITOR_QUICK_REF.md) - 快速参考
- [WAVE_MONITOR_FINAL_EN.md](WAVE_MONITOR_FINAL_EN.md) - 最终设计(EN)
- [WAVE_MONITOR_UI_REDESIGN.md](WAVE_MONITOR_UI_REDESIGN.md) - UI重设计
- [WAVEFORM_GUIDE.md](WAVEFORM_GUIDE.md) - 波形指南

#### Toolbar (工具栏)
- [TOOLBAR_LAYOUT_V2.md](TOOLBAR_LAYOUT_V2.md) - 布局V2
- [TOOLBAR_LAYOUT.md](TOOLBAR_LAYOUT.md) - 布局说明
- [TOOLBAR_WORKFLOW.md](TOOLBAR_WORKFLOW.md) - 工作流程

---

### 💾 数据管理

| 文档 | 说明 |
|------|------|
| [STORES_GUIDE.md](STORES_GUIDE.md) | Store指南 |
| [src/utils/RADAR_DATA_FORMAT.md](src/utils/RADAR_DATA_FORMAT.md) | 雷达数据格式 |
| [LAYOUT.md](LAYOUT.md) | 布局格式 |
| [LAYOUT_STORAGE_README.md](LAYOUT_STORAGE_README.md) | 布局存储 |
| [LAYOUT_OPERATIONS_GUIDE.md](LAYOUT_OPERATIONS_GUIDE.md) | 布局操作 |

---

### 🔌 功能特性

#### 设备相关
- [SLEEPAD_DESIGN.md](SLEEPAD_DESIGN.md) - Sleeppad设计
- [CORN_MODE_GUIDE.md](CORN_MODE_GUIDE.md) - Corn模式指南
- [IOT_LAYER_UPDATE.md](IOT_LAYER_UPDATE.md) - IoT层更新

#### 人员显示
- [PERSON_DISPLAY_GUIDE.md](PERSON_DISPLAY_GUIDE.md) - 人员显示指南
- [VITAL_SIGNS_STANDARDS.md](VITAL_SIGNS_STANDARDS.md) - 生理指标标准

#### 动画系统
- [SMOOTH_ANIMATION_SYSTEM.md](SMOOTH_ANIMATION_SYSTEM.md) - 平滑动画系统

#### 查询功能
- [QUERY_USAGE.md](QUERY_USAGE.md) - 查询使用
- [SIMPLE_PLAYBACK_GUIDE.md](SIMPLE_PLAYBACK_GUIDE.md) - 简单回放指南
- [TWO_LAYER_PLAYBACK_DESIGN.md](TWO_LAYER_PLAYBACK_DESIGN.md) - 双层回放设计

---

### 🔗 集成文档

| 文档 | 说明 |
|------|------|
| [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) | 集成指南 |
| [API_INTEGRATION.md](API_INTEGRATION.md) | API集成 |
| [VUE_INTERFACE_GUIDE.md](VUE_INTERFACE_GUIDE.md) | Vue接口指南 |
| [src/config/mqtt-integration-guide.md](src/config/mqtt-integration-guide.md) | MQTT集成 |
| [src/config/radarMqttConfig.example.md](src/config/radarMqttConfig.example.md) | MQTT配置示例 |

---

### 🗄️ 后端文档

| 文档 | 说明 |
|------|------|
| [backend/api-design.md](backend/api-design.md) | API设计 |
| [database/README.md](database/README.md) | 数据库说明 |
| [database/schema.sql](database/schema.sql) | 表结构 |
| [database/sample_data.sql](database/sample_data.sql) | 示例数据 |
| [database/queries_example.sql](database/queries_example.sql) | 查询示例 |

---

### 🎨 配置文档

| 文档 | 说明 |
|------|------|
| [COLOR_PRESETS.md](COLOR_PRESETS.md) | 颜色预设 |

---

### 📝 更新日志

| 文档 | 说明 |
|------|------|
| [UPDATE_SUMMARY.md](UPDATE_SUMMARY.md) | 更新摘要 |
| [VERIFICATION_SUMMARY.md](VERIFICATION_SUMMARY.md) | 验证总结 |
| [REFACTOR_PLAN.md](REFACTOR_PLAN.md) | 重构计划 |

---

## 🎯 按角色分类

### 👨‍💼 项目经理 / 产品经理

**必读：**
1. [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) - 了解整体架构
2. [PROJECT_MODULES.md](PROJECT_MODULES.md) - 掌握模块划分
3. [UPDATE_SUMMARY.md](UPDATE_SUMMARY.md) - 跟踪项目进度

**参考：**
- [QUICK_START.md](QUICK_START.md) - 快速演示
- [OPERATION_GUIDE.md](OPERATION_GUIDE.md) - 功能说明

---

### 👨‍💻 前端开发人员

**必读：**
1. [MODULES_TREE.md](MODULES_TREE.md) - 熟悉目录结构
2. [COMPONENTS_GUIDE.md](COMPONENTS_GUIDE.md) - 了解组件
3. [STORES_GUIDE.md](STORES_GUIDE.md) - 理解状态管理

**参考：**
- [WAVE_MONITOR_3ROW_LAYOUT.md](src/components/WAVE_MONITOR_3ROW_LAYOUT.md)
- [TOOLBAR_LAYOUT_V2.md](TOOLBAR_LAYOUT_V2.md)
- [RADAR_DESIGN_FINAL.md](RADAR_DESIGN_FINAL.md)

---

### 👨‍🔧 后端开发人员

**必读：**
1. [backend/api-design.md](backend/api-design.md) - API规范
2. [database/schema.sql](database/schema.sql) - 数据库设计
3. [API_INTEGRATION.md](API_INTEGRATION.md) - 接口对接

**参考：**
- [RADAR_DATA_FORMAT.md](src/utils/RADAR_DATA_FORMAT.md)
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)

---

### 🎨 UI/UX 设计师

**必读：**
1. [OPERATION_GUIDE.md](OPERATION_GUIDE.md) - 交互流程
2. [COLOR_PRESETS.md](COLOR_PRESETS.md) - 颜色规范
3. [COMPONENTS_GUIDE.md](COMPONENTS_GUIDE.md) - 组件布局

**参考：**
- [WAVE_MONITOR_UI_REDESIGN.md](WAVE_MONITOR_UI_REDESIGN.md)
- [TOOLBAR_LAYOUT_V2.md](TOOLBAR_LAYOUT_V2.md)

---

### 🧪 测试人员

**必读：**
1. [QUICK_START.md](QUICK_START.md) - 功能概览
2. [OPERATION_GUIDE.md](OPERATION_GUIDE.md) - 操作指南
3. [VERIFICATION_SUMMARY.md](VERIFICATION_SUMMARY.md) - 验证要点

**参考：**
- [QUERY_USAGE.md](QUERY_USAGE.md)
- [SIMPLE_PLAYBACK_GUIDE.md](SIMPLE_PLAYBACK_GUIDE.md)

---

### 🏗️ 架构师

**必读：**
1. [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) - 系统架构
2. [PROJECT_MODULES.md](PROJECT_MODULES.md) - 模块设计
3. [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - 项目结构

**参考：**
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- [TWO_LAYER_PLAYBACK_DESIGN.md](TWO_LAYER_PLAYBACK_DESIGN.md)
- [REFACTOR_PLAN.md](REFACTOR_PLAN.md)

---

## 🔍 按功能分类

### 雷达相关
- RADAR_DESIGN_FINAL.md
- RADAR_DRAWING_UPDATED.md
- RADAR_MODES_SUMMARY.md
- RADAR_AXIS_UPDATE.md
- RADAR_ROTATION.md
- RADAR_DATA_FORMAT.md

### 波形监控
- WAVE_MONITOR_3ROW_LAYOUT.md
- WAVE_MONITOR_GUIDE.md
- WAVE_MONITOR_FINAL_EN.md
- WAVEFORM_GUIDE.md

### 数据回放
- QUERY_USAGE.md
- SIMPLE_PLAYBACK_GUIDE.md
- TWO_LAYER_PLAYBACK_DESIGN.md

### 人员显示
- PERSON_DISPLAY_GUIDE.md
- VITAL_SIGNS_STANDARDS.md
- SMOOTH_ANIMATION_SYSTEM.md

### 布局管理
- LAYOUT.md
- LAYOUT_STORAGE_README.md
- LAYOUT_OPERATIONS_GUIDE.md

---

## 📊 文档统计

| 类别 | 文档数量 |
|------|---------|
| 架构设计 | 5个 |
| 组件文档 | 15个 |
| 数据管理 | 5个 |
| 功能特性 | 9个 |
| 集成文档 | 5个 |
| 后端文档 | 5个 |
| 更新日志 | 3个 |
| **总计** | **47个** |

---

## 🎓 学习路径

### 🌟 初级（1-2天）
1. readme.md
2. QUICK_START.md
3. ARCHITECTURE_DIAGRAM.md
4. MODULES_TREE.md

### 🚀 中级（3-5天）
1. PROJECT_MODULES.md
2. COMPONENTS_GUIDE.md
3. STORES_GUIDE.md
4. RADAR_DESIGN_FINAL.md
5. WAVE_MONITOR_3ROW_LAYOUT.md
6. TOOLBAR_LAYOUT_V2.md

### 💎 高级（1-2周）
1. 所有组件详细文档
2. 所有数据格式文档
3. 集成文档
4. 后端文档
5. 源代码阅读

---

## 📝 文档维护

### 更新规则
- 每次版本更新时同步更新相关文档
- 新增功能必须添加文档
- 重大变更需要更新架构文档

### 文档审查
- 每月审查一次文档完整性
- 每季度审查一次架构文档
- 版本发布前全面审查

---

**维护说明：** 本索引文档随项目更新而更新，请保持同步。  
**最后更新：** 2025-01-10  
**当前版本：** v0.5-2025011050155

