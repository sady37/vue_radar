// ================ 基础几何类型 ================
export interface Point {
  x: number;
  y: number;
  z?: number;  // 高度坐标 - 可选，默认为0
}

// 雷达坐标系中的点（用于报告输出和坐标转换，不用于设备存储）
export interface RadarPoint {
  h: number;  // 水平距离 (Horizontal) - 相对于雷达中心
  v: number;  // 垂直距离 (Vertical) - 相对于雷达中心
  z?: number; // 高度 (可选，默认为0)
}

// ================ 几何形状定义 ================
export interface Line {
  start: Point;
  end: Point;
  thickness: 2;  // 线宽，用于墙体 默认=2
}

export interface Circle {
  center: Point;
  radius: number;
}

// 扇形类型 - 用于雷达墙角安装模式
export interface Sector {
  center: Point;      // 扇形中心点（雷达位置）
  leftPoint: Point;   // 左边界端点
  rightPoint: Point;  // 右边界端点
  radius?: number;    // 半径（可选，可从端点计算）
  sectorAngle?: number; // 弧度（可选，可从端点计算）
}

export interface Rectangle {
  vertices: [Point, Point, Point, Point]; // 顺序：[0]左上、[1]右上、[2]左下、[3]右下
}

export interface Polygon {
  vertices: Point[];  // 顶点数组
}

// ================ 统一的几何定义 ================
// 设备在空间中就是一个点，渲染时可以用图标表示
// 家具/结构可以有各种几何形状
export type Geometry = 
  | { type: 'point'; data: Point }      // 所有设备都用点表示
  | { type: 'line'; data: Line }        // 墙体等线性物体
  | { type: 'circle'; data: Circle }    // 圆形物体
  | { type: 'sector'; data: Sector }    // 扇形物体
  | { type: 'rectangle'; data: Rectangle }  // 矩形物体（床、桌子等）
  | { type: 'polygon'; data: Polygon }  // 多边形物体


// ================ 设备类型分类 ================
export type ObjectType = 
  // IoT设备
  | 'Radar' 
  | 'Sleepad'
  | 'Sensor'
  // 家具物体
  | 'Bed' 
  | 'MonitorBed'    // 监护床
  | 'Door' 
  | 'Wall' 
  | 'Interfere'     // 干扰区域
  | 'Enter'         // 门/进入区域
  | 'Furniture'     // 通用家具
  | 'Other' 
  | 'GlassTV' 
  | 'Table'
  | 'Chair'
  | 'Curtain'
  | 'MetalCan'      // 金属桶
  | 'WheelChair';   // 轮椅

// ================ 物体基础类型 ================
export interface BaseObject {
  // 标识属性
  id: string;
  name: string;
  typeName: ObjectType;
  typeValue: number;
  
  // 几何属性
  geometry: Geometry;
  
  // 视觉属性（颜色、透明度、反射率）
  visual: VisualProperties;
  
  // 交互属性
  interactive: InteractiveProperties;
  
  // 设备属性
  device: DeviceProperties;

  // 旋转角度
  angle?: number;
  
  // 层级（用于控制绘制顺序）
  zIndex?: number;
  
  // 绑定的IoT设备ID（将Canvas对象关联到传入的设备）
  bindedDeviceId?: string;
}

// ================ 视觉属性 ================
// 简化的视觉属性：颜色、透明度、反射率
export interface VisualProperties {
  color: string;                  // 颜色
  transparent: boolean;            // 透明模式（只显示边框）
  reflectivity: number;            // 反射率 0-100，用于调整雷达信号反射效果
}

// ================ 交互属性 ================
// 简化交互状态：选中和锁定
// 锁定状态（locked=true）时，禁止拖动、旋转等编辑操作
export interface InteractiveProperties {
  selected: boolean;  // 选中状态
  locked: boolean;    // 锁定状态（锁定后不可拖动、旋转、编辑）
}

// ================ 设备属性 ================
export interface DeviceProperties {
  category: 'iot' | 'furniture' | 'structure';
  type: ObjectType;
 
  // IoT设备特有属性
  iot?: IotDeviceProperties;
}

// ================ IoT设备属性 ================
export interface IotDeviceProperties {
  deviceId?: string;
  isOnline: boolean;
  statusMessage?: string;

  // 设备特定属性
  radar?: RadarSpecificProperties;
  sleepad?: SleepadProperties;
  sensor?: SensorProperties;
}


// ================ 通用移动步长 ================
export const MOVE_STEP = 10; // 移动步长 10cm

// ================ Canvas 参数定义 ================
export interface IoTDeviceInfo {
  deviceId: string;       // IoT设备ID（UUIDV4，只读）
  deviceName: string;     // IoT设备名称（VARCHAR(100)，只读）
  bedId?: string;         // 关联的床ID（UUIDV4，可选，只读）
  bedName?: string;       // 床名称（VARCHAR(50)，可选，只读）
}

export interface CanvasParams {
  // Canvas标识（UUID格式，由服务器生成）
  canvasId: string;  // 示例: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  
  // Canvas名称（通常等于房间名称）
  canvasName: string;  // 示例: "Room 101" 或 "ICU-A-01"
  
  // 该Canvas的所有IoT设备信息
  devices: IoTDeviceInfo[];
  
  // 当前操作的设备（可选，用于自动选中）
  currentDeviceId?: string;
}

// ================ 雷达区域定义 ================
export interface RadarArea {
  areaId: number;          // 区域ID (0-15)
  areaType: number;        // 区域类型 (0-5)
  objectId: string;        // 关联的家具对象ID
  objectType: ObjectType;  // 家具类型名称
  vertices: [RadarPoint, RadarPoint, RadarPoint, RadarPoint];  // 雷达坐标系中的4个顶点
}

// ================ 标准材质反射率 ================
export const MATERIAL_REFLECTIVITY = {
  WOOD: 30,    // 木材反射率
  METAL: 90,   // 金属（铁）反射率
  GLASS: 60    // 玻璃反射率
} as const;

// ================ 家具类型默认配置 ================
export interface FurnitureConfig {
  typeName: string;
  areaType: number;     // 区域类型 (0-5)
  color: string;        // 默认颜色
  drawTool: string;     // 默认绘图工具
  reflectivity: number; // 反射率 (0-100)
  description: string;
}

// 家具类型（不包括 IoT 设备）
export type FurnitureType = Exclude<ObjectType, 'Radar' | 'Sleepad' | 'Sensor'>;

export const FURNITURE_CONFIGS: Record<FurnitureType, FurnitureConfig> = {
  'Bed': {
    typeName: 'Bed',
    areaType: 2,
    color: '#a8c5a8',      // 灰绿色
    drawTool: 'rectangle',
    reflectivity: MATERIAL_REFLECTIVITY.WOOD,
    description: 'Normal Bed'
  },
  'MonitorBed': {
    typeName: 'MonitorBed',
    areaType: 5,
    color: '#FFC080',      // 奶油橙色
    drawTool: 'rectangle',
    reflectivity: MATERIAL_REFLECTIVITY.WOOD,
    description: 'Monitor Bed'
  },
  'Interfere': {
    typeName: 'Interfere',
    areaType: 3,
    color: '#fadb14',      // 黄色 - 雷达干扰区
    drawTool: 'rectangle',
    reflectivity: MATERIAL_REFLECTIVITY.METAL,
    description: 'Interfere Area'
  },
  'Enter': {
    typeName: 'Enter',
    areaType: 4,
    color: '#a0eda0',      // 亮绿色
    drawTool: 'rectangle',
    reflectivity: MATERIAL_REFLECTIVITY.WOOD,
    description: 'Entrance'
  },
  'Door': {
    typeName: 'Door',
    areaType: 4,
    color: '#a0eda0',      // 亮绿色（同 Enter）
    drawTool: 'rectangle',
    reflectivity: MATERIAL_REFLECTIVITY.WOOD,
    description: 'Door'
  },
  'Wall': {
    typeName: 'Wall',
    areaType: 1,
    color: '#000000',      // 黑色
    drawTool: 'line',
    reflectivity: MATERIAL_REFLECTIVITY.WOOD,
    description: 'Wall'
  },
  'Furniture': {
    typeName: 'Furniture',
    areaType: 1,
    color: '#d3d3d3',      // 浅灰色
    drawTool: 'rectangle',
    reflectivity: MATERIAL_REFLECTIVITY.WOOD,
    description: 'Generic Furniture'
  },
  'GlassTV': {
    typeName: 'GlassTV',
    areaType: 1,
    color: '#e0e0e0',      // 浅灰色
    drawTool: 'rectangle',
    reflectivity: MATERIAL_REFLECTIVITY.GLASS,
    description: 'Glass/TV'
  },
  'Other': {
    typeName: 'Other',
    areaType: 1,
    color: '#d3d3d3',      // 浅灰色
    drawTool: 'rectangle',
    reflectivity: MATERIAL_REFLECTIVITY.WOOD,
    description: 'Other Object'
  },
  'Table': {
    typeName: 'Table',
    areaType: 1,
    color: '#c19a6b',      // 浅棕色
    drawTool: 'rectangle',
    reflectivity: MATERIAL_REFLECTIVITY.WOOD,
    description: 'Table'
  },
  'Chair': {
    typeName: 'Chair',
    areaType: 1,
    color: '#a0522d',      // 赭色
    drawTool: 'rectangle',
    reflectivity: MATERIAL_REFLECTIVITY.WOOD,
    description: 'Chair'
  },
  'Curtain': {
    typeName: 'Curtain',
    areaType: 1,
    color: '#6bb9d3',      // 浅蓝色
    drawTool: 'rectangle',
    reflectivity: MATERIAL_REFLECTIVITY.GLASS,
    description: 'Curtain'
  },
  'MetalCan': {
    typeName: 'MetalCan',
    areaType: 3,
    color: '#fadb14',      // 黄色
    drawTool: 'rectangle',
    reflectivity: MATERIAL_REFLECTIVITY.METAL,
    description: 'Metal Can'
  },
  'WheelChair': {
    typeName: 'WheelChair',
    areaType: 3,
    color: '#fadb14',      // 黄色
    drawTool: 'rectangle',
    reflectivity: MATERIAL_REFLECTIVITY.METAL,
    description: 'Wheel Chair'
  }
};

// 区域类型映射（从 FURNITURE_CONFIGS 自动生成）
export const AREA_TYPE_MAP: Record<string, number> = Object.entries(FURNITURE_CONFIGS).reduce(
  (map, [key, config]) => {
    map[key] = config.areaType;
    return map;
  },
  { 'Door': 4 } as Record<string, number>  // Door 是 Enter 的别名
);

// ================ 雷达特定属性 ================
export interface RadarSpecificProperties {
  installModel?: 'ceiling' | 'wall' | 'corn';  // 设备安装模式：ceiling(吸顶) | wall(贴墙) | corn(墙角)
  workModel?: string;    // 设备工作模式 fall-detect/vital-sign/sleep-monitoring
  
  // 旋转角度（从Canvas的angle属性获取）
  rotation?: number;       // 平面旋转角度 (0-360度，逆时针为正)

  hfov?: number;      // 水平视场角
  vfov?: number;      // 垂直视场角
  
  // 陀螺仪数据（只读，从设备查询获取）
  //Roll:沿X轴翻转，Pitch:沿Y轴翻转，Yaw:沿Z轴翻转
  //wall corn时，应该是上倾68.5度，即yaw:68.5
  accelera?: string;  // 格式：Roll:Pitch:Yaw:calibrated（如 "36.74:9.97:-38.52:0"）
  
  // 边界配置 - 用户设置的检测边界
  boundary?: {
    leftH: number;   // 左侧边界距离 (cm)
    rightH: number;  // 右侧边界距离 (cm)
    frontV: number;  // 前方边界距离 (cm)
    rearV: number;   // 后方边界距离 (cm)
  };
  
  // 信号区域配置
  signalRadius?: number;  // 信号可探测距离 (cm)
  signalAngle?: number;   // 信号区域扇形角度 (度)
  
  // 显示控制
  showBoundary?: boolean;  // 是否显示边界，默认显示
  showSignal?: boolean;    // 是否显示信号范围，默认不显示
  
  // 区域列表
  areas?: RadarArea[];     // 区域列表，最多16个 (0-15)
  
  // 配置快照（Query时从真实设备查询回来的配置，用于IoTSave时对比）
  baseline?: {
    installModel?: 'ceiling' | 'wall' | 'corn';
    workModel?: string;
    height?: number;
    boundary?: {
      leftH: number;
      rightH: number;
      frontV: number;
      rearV: number;
    };
    areas?: RadarArea[];
    queriedAt?: string;  // 查询时间戳
  };
}

// ================ 雷达默认配置 ================
// 整合了默认高度、边界、视场角等所有配置
// Rotation: 平面旋转角度（从Canvas的angle属性获取，逆时针为正）
export const RADAR_DEFAULT_CONFIG = {
  // wall模式默认  +H=-X, +V=+Z
  wall: {
    height: 170,    // 默认高度 170cm
    Rotation: 0,    // 平面旋转角度（从Canvas的angle属性获取）
    hfov: 140,      // 水平视场角140度
    vfov: 120,      // 垂直视场角120度
    signalAngle: 180, // 即雷达相当于只向前照180度，默认边界是矩形，雷达在矩形的中心
    signalRadius: 500,     // 信号可探测距离500cm
    showBoundary: true,    // 默认显示边界
    showSignal: false,     // 默认不显示信号
    boundary: {
      leftH: 300,    // 3米
      rightH: 300,   // 3米
      frontV: 400,   // 4米
      rearV: 0       // 0米
    }
  } ,
  // ceiling模式默认 +H=-X, +V=+Y
  ceiling: {
    height: 300,    // 默认高度 300cm
    Rotation: 0,    // 平面旋转角度（从Canvas的angle属性获取）
    hfov: 140,      // 水平视场角140度
    vfov: 120,      // 垂直视场角120度
    signalAngle: 360, // 即雷达向下360度，默认边界是矩形，雷达在矩形的中心
    signalRadius: 400,     // 信号可探测距离500cm
    showBoundary: true,    // 默认显示边界
    showSignal: false,     // 默认不显示信号
    boundary: {
      leftH: 300,    // 3米
      rightH: 300,   // 3米
      frontV: 200,   // 2米
      rearV: 200     // 2米
    }
  },
  // corn模式默认（雷达在矩形左上角，leftH/rightH为矩形的长/宽）
  corn: {
    height: 300,    // 默认高度 300cm
    Rotation: 0,    // 平面旋转角度（从Canvas的angle属性获取）
    hfov: 90,       // 水平视场角90度
    vfov: 120,      // 垂直视场角120度
    signalAngle: 90, // 即雷达的1/4圆周，90度，因为一侧有遮挡，所以信号区域为1/4圆周
    signalRadius: 800,     // 信号可探测距离800cm
    showBoundary: true,    // 默认显示边界
    showSignal: false,     // 默认不显示信号
    boundary: {
      leftH: 600,    // 6米  左边沿安装的墙面，左边6米
      rightH: 0,   // 右边是与左边沿安装的墙面垂直的墙面，信号被遮挡，所以rightH为0
      frontV: 600,     // 相当于雷达的前方，6米（Corn模式：雷达在左上角，向下为前方）
      rearV: 0       // 
    }
  }
} as const;

// ================ Sleepad设备属性 ================
export interface SleepadProperties {

}

// ================ 传感器属性 ================
export interface SensorProperties {
  sensorType: 'motion' | 'temperature' | 'humidity';
}


// ================ 人员数据相关 ================
export interface PersonData {
  // ===== 核心标识字段 =====
  id: number;               // 数据记录ID（唯一标识）
  deviceCode: string;       // 雷达设备编码（必填，用于多雷达场景）
  personIndex: number;      // 人员索引（必填，0-N，用于区分同一雷达识别的多人）
  
  // ===== 位置和姿态 =====
  position: Point;          // 位置坐标（Canvas坐标系，cm）
  posture: number;          // 姿态（枚举值，见 PersonPosture）
  
  // ===== 状态信息 =====
  remainTime: number;       // 剩余时间（秒）
  event: number;            // 事件标识（0=无事件）
  areaId: number;           // 区域ID（0-15）
  timestamp: number;        // UNIX 时间戳（秒）
  
  // ===== 生理数据（可选，部分数据源包含）=====
  heartRate?: number;       // 心率（bpm）
  breathRate?: number;      // 呼吸率（次/分）
  sleepState?: number;      // 睡眠状态（位字段）
  movement?: number;        // 体动值
  
  // ===== 前端渲染字段（可选）=====
  targetPosition?: Point;   // 目标位置（动画用）
  startPosition?: Point;    // 起始位置（动画用）
  moveStartTime?: number;   // 移动开始时间
  moveDuration?: number;    // 移动持续时间
  isMoving?: boolean;       // 是否正在移动
}

export interface VitalSignData {
  type: number;
  heartRate: number;
  breathing: number;
  sleepState: number;
  timestamp?: number;
}

// ================ 姿态枚举 ================
export enum PersonPosture {
  Init = 0,
  Walking = 1,
  FallSuspect = 2,
  Sitting = 3,
  Standing = 4,
  FallConfirm = 5,
  Lying = 6,
  SitGroundSuspect = 7,
  SitGroundConfirm = 8,
  SitUpBed = 9,
  SitUpBedSuspect = 10,
  SitUpBedConfirm = 11
}

export const POSTURE_LABELS: Record<number, string> = {
  0: 'Init',
  1: 'Walking',
  2: 'FallSuspect',
  3: 'Sitting',
  4: 'Standing',
  5: 'FallConfirm',
  6: 'Lying',
  7: 'SitGroundSuspect',
  8: 'SitGroundConfirm',
  9: 'SitUpBed',
  10: 'SitUpBedSuspect',
  11: 'SitUpBedConfirm'
};

// ================ 图标配置 ================
export interface PostureIconConfig {
  type: 'svg' | 'default';
  iconPath?: string;
  size: number;
  showLabel: boolean;
}

// ================ 雷达报告和视图 ================
export interface RadarReport {
  id: string;
  typeValue: number;
  typeName: string;
  name: string;
  installModel: 'ceiling' | 'wall'|'corn';  // 统一使用 installModel
  config: {
    boundary: {
      leftH: number;
      rightH: number;
      frontV: number;
      rearV: number;
    };
  };
  boundaryVertices: RadarBoundaryVertices;
  objects: RadarObjectInBoundary[];
}

export interface RadarBoundaryVertices {
  v1: RadarPoint;
  v2: RadarPoint;
  v3: RadarPoint;
  v4: RadarPoint;
}

export interface RadarObjectInBoundary {
  typeValue: number;
  typeName: string;
  id: string;
  name: string;
  radarVertices?: RadarPoint[];
}

export interface RadarView {
  radar_install_style: string;  // 对应 installModel: '0'-ceiling, '1'-wall, '2'-corn
  radar_install_height: string;
  rectangle: string;
  [key: `declare_area_${string}`]: string;
}

// ================ 房间布局 ================
export interface RoomLayout {
  objects: BaseObject[];
}

// ================ 波形数据 ================
export interface WaveDataPoint {
  timestamp: number;
  heartRate: number;
  breathing: number;
  value?: number;
}
