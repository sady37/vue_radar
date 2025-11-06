# Vue Radar 模块目录树

**版本：** v0.5-2025011050155

---

## 📂 核心业务层

```
components/
├── RadarCanvas.vue           ⭐⭐⭐⭐⭐ (2647行) - 雷达可视化核心
│   ├── 雷达坐标系绘制
│   ├── 人体轨迹显示
│   ├── 姿态图标渲染
│   ├── 生理指标面板
│   └── 缩放/平移交互
│
├── WaveMonitor.vue           ⭐⭐⭐⭐ (1400+行) - 波形监控核心
│   ├── Track播放控制 (fromServer/fromFile/Demo)
│   ├── Vital播放控制 (fromServer/fromFile/RealTime)
│   ├── HR/RR数据查询
│   ├── 波形图表绘制
│   └── 历史数据回放
│
├── Toolbar.vue               ⭐⭐⭐⭐⭐ (3132行) - 编辑工具核心
│   ├── 绘图工具 (Wall/Furniture/Curtain)
│   ├── 对象属性编辑
│   ├── IoT设备配置
│   └── 雷达参数调整
│
└── QueryPanel.vue            ⭐⭐⭐ (415行) - 查询面板
    ├── 手动导入 (Data + Layout)
    ├── 自动查询 (DeviceID + Time)
    └── Track/Vital类型选择
```

---

## 💾 数据管理层

```
stores/
├── canvas.ts                 ⭐⭐ (162行) - 画布状态
│   ├── 画布尺寸
│   ├── 网格显示
│   ├── 绘图模式
│   └── 布局数据
│
├── objects.ts                ⭐⭐⭐⭐ (481行) - 场景对象
│   ├── 几何图形 (Rect/Line/Circle/Sector/Polygon)
│   ├── IoT设备 (Radar/Sleeppad/Camera)
│   └── 家具/墙体/窗帘
│
├── radarData.ts              ⭐⭐⭐⭐ (441行) - 雷达数据
│   ├── persons[] - 人员数据
│   ├── historicalData[] - 历史数据
│   └── vitalHistory[] - 生理数据
│
├── waveform.ts               ⭐⭐⭐ (294行) - 波形数据
│   ├── HR/RR时序数据
│   ├── 波形缓存
│   └── 实时数据流
│
└── index.ts                  - Store导出
```

---

## 🛠️ 工具支持层

```
utils/
├── 绘图工具
│   ├── drawDevices.ts        - 设备绘制
│   ├── drawObjects.ts        - 对象绘制
│   ├── drawShapes.ts         - 几何图形
│   └── drawingTool.ts        - 绘图交互
│
├── 数据工具
│   ├── mockRadarData.ts      - Mock数据生成
│   ├── radarUtils.ts         - 雷达工具函数
│   ├── autoQuery.ts          - 自动查询
│   └── urlParams.ts          - URL参数解析
│
├── 配置工具
│   ├── postureIcons.ts       ⭐⭐ (184行) - 姿态图标配置
│   ├── alarmSound.ts         ⭐⭐ (77行) - 告警音频
│   └── types.ts              - TypeScript类型
│
├── 对象工具
│   ├── objectHelpers.ts      - 对象操作辅助
│   └── index.ts              - 工具函数导出
│
└── 文档
    └── RADAR_DATA_FORMAT.md  - 雷达数据格式
```

---

## ⚙️ 配置层

```
config/
├── presets.ts                ⭐⭐ (208行) - 预设配置
│   ├── COLOR_PRESETS         - 颜色预设
│   ├── FURNITURE_PRESETS     - 家具预设
│   └── RADAR_PRESETS         - 雷达预设
│
├── radarMqttConfig.ts        - MQTT连接配置
└── mqtt-integration-guide.md - MQTT集成指南
```

---

## 🗄️ 后端支持层

```
backend/
└── api-design.md             - API设计文档

database/
├── schema.sql                - 数据库表结构
├── sample_data.sql           - 示例数据
├── queries_example.sql       - 查询示例
└── README.md                 - 数据库说明

api/
└── layoutApi.ts              - Layout API调用
```

---

## 📚 文档层

```
docs/ (根目录文档)
│
├── 用户文档
│   ├── QUICK_START.md        - 快速开始
│   ├── OPERATION_GUIDE.md    - 操作指南
│   └── HOW_TO_VIEW.md        - 查看指南
│
├── 组件文档
│   ├── COMPONENTS_GUIDE.md   - 组件说明
│   ├── WAVE_MONITOR_3ROW_LAYOUT.md
│   └── TOOLBAR_LAYOUT_V2.md
│
├── 架构设计
│   ├── PROJECT_STRUCTURE.md  - 项目结构
│   ├── PROJECT_MODULES.md    - 模块分板 (本文档)
│   ├── STORES_GUIDE.md       - Store指南
│   └── INTEGRATION_GUIDE.md  - 集成指南
│
├── 功能文档
│   ├── RADAR_DESIGN_FINAL.md - 雷达设计
│   ├── SLEEPAD_DESIGN.md     - Sleeppad设计
│   ├── PERSON_DISPLAY_GUIDE.md
│   ├── CORN_MODE_GUIDE.md
│   └── SMOOTH_ANIMATION_SYSTEM.md
│
├── 数据格式
│   ├── RADAR_DATA_FORMAT.md  - 雷达数据格式
│   ├── LAYOUT.md             - 布局格式
│   └── VITAL_SIGNS_STANDARDS.md - 生理指标标准
│
└── 更新日志
    ├── UPDATE_SUMMARY.md     - 更新摘要
    ├── RADAR_CHANGES_SUMMARY.md
    └── VERIFICATION_SUMMARY.md
```

---

## 🎨 资源层

```
assets/
├── alarms/                   - 告警音频 (L1/L2/L3)
│   ├── L1_alarm.mp3
│   ├── L2_alarm.mp3
│   └── L3_alarm.mp3
│
├── icons/                    - 姿态图标 (PNG/SVG)
│   ├── Walking.png
│   ├── Sitting.png
│   ├── LyingBed.png
│   ├── FallConfirm.png
│   └── ...
│
├── Data/                     - 示例数据
│   ├── canvas_demo.json
│   └── canvas_Tom.json
│
└── bak-icon/                 - 备份图标
```

---

## 🔄 模块交互关系

```
                    App.vue
                       ↓
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
  RadarCanvas    WaveMonitor     Toolbar
        ↓              ↓              ↓
        └──────────────┼──────────────┘
                       ↓
        ┌──────────────┴──────────────┐
        ↓                             ↓
    Stores                         Utils
    ├── canvas                     ├── draw*
    ├── objects                    ├── radar*
    ├── radarData                  ├── posture*
    └── waveform                   └── alarm*
```

---

## 📊 代码量统计

| 层级 | 文件数 | 代码行数 | 占比 |
|------|-------|---------|------|
| 核心业务层 | 4个 | ~7600行 | 60% |
| 数据管理层 | 5个 | ~1400行 | 11% |
| 工具支持层 | 15个 | ~2000行 | 16% |
| 配置层 | 3个 | ~300行 | 2% |
| 后端支持 | 4个 | ~500行 | 4% |
| 文档层 | 30+个 | ~5000行 | 7% |

**总计：** ~60个文件，~17000行代码

---

## 🎯 关键路径

### P0 核心链路
```
用户操作
  ↓
RadarCanvas/WaveMonitor/Toolbar
  ↓
Objects Store / RadarData Store
  ↓
Draw Utils / Radar Utils
  ↓
Canvas渲染
```

### P1 数据链路
```
QueryPanel 查询
  ↓
API调用 (layoutApi)
  ↓
RadarData Store 加载
  ↓
WaveMonitor 播放
  ↓
RadarCanvas 显示
```

### P2 配置链路
```
Presets 预设
  ↓
Canvas Store 加载
  ↓
Toolbar 应用
  ↓
Objects Store 更新
  ↓
RadarCanvas 渲染
```

---

## 📝 模块分板总结

### ✅ 已完成
- 核心业务层架构清晰
- 数据管理层职责明确
- 工具支持层功能完善
- 文档层体系完整

### 🚧 待优化
- WaveMonitor波形实现
- QueryPanel后端集成
- RadarCanvas性能优化
- 测试覆盖率提升

### 🎯 下一步
1. 实现HR/RR波形绘制
2. 完善API集成
3. 性能调优
4. 测试补充

---

**维护说明：** 本文档为项目模块分板的快速参考，详细说明请参考 `PROJECT_MODULES.md`

