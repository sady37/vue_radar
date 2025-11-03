1. 保持现有核心资产
✅ 不动的部分：绘制引擎(drawPosture、drawRadar)、坐标转换(radarUtils)、图标系统(postureIcons)、数据模拟(mockRadarData)

src/
├── core/                    # 核心引擎
│   ├── rendering/          # 绘制引擎（现有utils）
│   ├── coordinates/        # 坐标系统  
│   ├── simulation/         # 数据模拟
│   └── types/              # 统一类型定义
├── features/               # 功能模块
│   ├── radar-canvas/       # 雷达画布功能
│   ├── object-management/  # 物体管理
│   ├── vital-monitor/      # 生理监控（新增波形）
│   └── data-source/        # 数据源管理
├── components/             # 通用组件
├── stores/                 # 状态管理（重构为统一store）
└── composables/            # Vue组合式函数


核心类型定义 (core/types/)

坐标转换系统 (core/coordinates/) - radarUtils.ts

渲染引擎 (core/rendering/) - drawPosture.ts, drawRadar.ts

图标系统 (core/rendering/) - postureIcons.ts

数据模拟 (core/simulation/) - mockRadarData.ts