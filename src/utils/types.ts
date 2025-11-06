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
  center?: Point;     // 中心点（可选，用于渲染和交互）
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
    color: '#d7d7a0',      // RGB: (215, 215, 160) 浅黄绿色，反差大易识别
    drawTool: 'rectangle',
    reflectivity: MATERIAL_REFLECTIVITY.WOOD,
    description: 'Normal Bed'
  },
  'MonitorBed': {
    typeName: 'MonitorBed',
    areaType: 5,
    color: '#F0E68C',      // RGB: (240, 230, 140)
    drawTool: 'rectangle',
    reflectivity: MATERIAL_REFLECTIVITY.WOOD,
    description: 'Monitor Bed'
  },
  'Interfere': {
    typeName: 'Interfere',
    areaType: 3,
    color: '#F5F5F5',      // 浅白色（表示金属反光）
    drawTool: 'rectangle',
    reflectivity: MATERIAL_REFLECTIVITY.METAL,
    description: 'Interfere Area'
  },
  'Enter': {
    typeName: 'Enter',
    areaType: 4,
    color: '#A9EAA9',      // RGB: (169, 234, 169)
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
    color: '#82BBEB',      // RGB: (130, 187, 235)
    drawTool: 'rectangle',
    reflectivity: MATERIAL_REFLECTIVITY.GLASS,
    description: 'Curtain'
  },
  'MetalCan': {
    typeName: 'MetalCan',
    areaType: 3,
    color: '#F5F5F5',      // 浅白色（表示金属反光）
    drawTool: 'rectangle',
    reflectivity: MATERIAL_REFLECTIVITY.METAL,
    description: 'Metal Can'
  },
  'WheelChair': {
    typeName: 'WheelChair',
    areaType: 3,
    color: '#a0826d',      // 灰棕色
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
// Rotation: 平面旋转角度初始值（逆时针为正），corn的初始值是45度
export const RADAR_DEFAULT_CONFIG = {
  // wall模式默认  +H=-X, +V=+Z
  wall: {
    height: 170,    // 默认高度 170cm
    Rotation: 0,    // 平面旋转角度初始值（逆时针为正）
    hfov: 140,      // 水平视场角140度
    vfov: 120,      // 垂直视场角120度
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
    Rotation: 0,    // 平面旋转角度初始值（逆时针为正）
    hfov: 140,      // 水平视场角140度
    vfov: 120,      // 垂直视场角120度
    signalRadius: 400,     // 信号可探测距离400cm
    showBoundary: true,    // 默认显示边界
    showSignal: false,     // 默认不显示信号
    boundary: {
      leftH: 300,    // 3米
      rightH: 300,   // 3米
      frontV: 200,   // 2米
      rearV: 200     // 2米
    }
  },
  // corn模式默认（雷达在顶点，矩形由leftH和rightH确定）
  corn: {
    height: 200,    // 默认高度 200cm
    Rotation: 45,    // 平面旋转角度初始值（逆时针为正）
    hfov: 90,       // 水平视场角90度
    vfov: 120,      // 垂直视场角120度
    signalRadius: 800,     // 信号可探测距离800cm
    showBoundary: true,    // 默认显示边界
    showSignal: false,     // 默认不显示信号
    boundary: {
      leftH: 600,    // 矩形宽度（H方向，6米）
      rightH: 600,   // 矩形高度（V方向，6米）
      frontV: 0,     // 不使用
      rearV: 0       // 不使用
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
  heartRate: number;        // 心率值（bpm）
  breathing: number;        // 呼吸率（次/分）
  sleepState: number;       // 睡眠状态（0-3，见SleepState枚举）
  timestamp?: number;
  
  // 可选：已解析的状态字段（如果后端提供）
  breathStatus?: number;      // 呼吸状态（0-3，见BreathStatus枚举）
  heartRateStatus?: number;   // 心率状态（0-3，见HeartRateStatus枚举）
  vitalSignStatus?: number;   // 生命体征状态（0-3，见VitalSignStatus枚举）
}

// ================ CSV数据格式（数据库/文件导入） ================
// 生命体征CSV格式
export interface VitalSignCSVData {
  id: number;
  device_code: string;      // 设备编码
  breath_rate: number;      // 呼吸率（次/分）
  heart_rate: number;       // 心率（bpm）
  event: string | null;     // 事件
  timestamp: number;        // Unix时间戳（秒）
  sleep_stage: number;      // 8位位字段（包含呼吸/心率/体征/睡眠状态）
}

// 人员轨迹CSV格式
export interface PersonTrackCSVData {
  id: number;
  device_code: string;      // 设备编码
  person_index: number;     // 人员索引（0开始）
  coordinate_x: number;     // X坐标（cm）
  coordinate_y: number;     // Y坐标（cm）
  coordinate_z: number;     // Z坐标/高度（cm）
  remaining_time: number;   // 停留时间（秒）
  posture: number;          // 姿态（0-11，见PersonPosture枚举）
  event: number;            // 事件标识
  area_id: number;          // 区域ID（0-15）
  timestamp: number;        // Unix时间戳（秒）
}

// ================ 生命体征状态编码 ================
// 说明：这些状态可能来自：
// 1. 后端已解析的独立字段（推荐）
// 2. 或从sleep_stage位字段解析（使用parseVitalStatusBits函数）

// bit 1-0: 呼吸状态
export enum BreathStatus {
  Normal = 0,      // 00: 呼吸正常
  TooLow = 1,      // 01: 呼吸过低
  TooHigh = 2,     // 10: 呼吸过高
  Pause = 3        // 11: 呼吸暂停
}

export const BREATH_STATUS_LABELS: Record<number, string> = {
  0: 'Normal',
  1: 'TooLow',
  2: 'TooHigh',
  3: 'Pause'
};

// bit 3-2: 心率状态
export enum HeartRateStatus {
  Normal = 0,      // 00: 心率正常
  TooLow = 1,      // 01: 心率过低
  TooHigh = 2,     // 10: 心率过高
  Undefined = 3    // 11: 未定义
}

export const HEART_RATE_STATUS_LABELS: Record<number, string> = {
  0: 'Normal',
  1: 'TooLow',
  2: 'TooHigh',
  3: 'Undefined'
};

// bit 5-4: 生命体征情况
export enum VitalSignStatus {
  Normal = 0,      // 00: 状态正常
  Undefined1 = 1,  // 01: 未定义
  Undefined2 = 2,  // 10: 未定义
  Weak = 3         // 11: 生命体征弱
}

export const VITAL_SIGN_STATUS_LABELS: Record<number, string> = {
  0: 'Normal',
  1: 'Undefined',
  2: 'Undefined',
  3: 'Weak'
};

// bit 7-6: 睡眠状态
export enum SleepState {
  Undefined = 0,   // 00: 未定义
  LightSleep = 1,  // 01: 浅睡
  DeepSleep = 2,   // 10: 深睡
  Awake = 3        // 11: 清醒
}

export const SLEEP_STATE_LABELS: Record<number, string> = {
  0: 'Undefined',
  1: 'LightSleep',
  2: 'DeepSleep',
  3: 'Awake'
};

// ================ 位字段解析函数 ================
// 从sleep_stage位字段提取各种状态
export function parseVitalStatusBits(sleepStageValue: number) {
  return {
    breathStatus: (sleepStageValue & 0b11) as BreathStatus,           // bit 1-0
    heartRateStatus: ((sleepStageValue >> 2) & 0b11) as HeartRateStatus, // bit 3-2
    vitalSignStatus: ((sleepStageValue >> 4) & 0b11) as VitalSignStatus, // bit 5-4
    sleepState: ((sleepStageValue >> 6) & 0b11) as SleepState           // bit 7-6
  };
}

// 从各状态构建sleep_stage位字段
export function buildVitalStatusBits(
  breathStatus: BreathStatus,
  heartRateStatus: HeartRateStatus,
  vitalSignStatus: VitalSignStatus,
  sleepState: SleepState
): number {
  return (
    (breathStatus & 0b11) |
    ((heartRateStatus & 0b11) << 2) |
    ((vitalSignStatus & 0b11) << 4) |
    ((sleepState & 0b11) << 6)
  );
}

// ================ CSV数据转换函数 ================
// 将PersonTrackCSVData转换为PersonData
export function convertPersonTrackCSV(csvData: PersonTrackCSVData): PersonData {
  return {
    id: csvData.id,
    deviceCode: csvData.device_code,
    personIndex: csvData.person_index,
    position: {
      x: csvData.coordinate_x,
      y: csvData.coordinate_y,
      z: csvData.coordinate_z
    },
    posture: csvData.posture,
    remainTime: csvData.remaining_time,
    event: csvData.event,
    areaId: csvData.area_id,
    timestamp: csvData.timestamp
  };
}

// 将VitalSignCSVData转换为VitalSignData
export function convertVitalSignCSV(csvData: VitalSignCSVData): VitalSignData {
  const parsed = parseVitalStatusBits(csvData.sleep_stage);
  return {
    type: 0,  // 默认类型
    heartRate: csvData.heart_rate,
    breathing: csvData.breath_rate,
    sleepState: parsed.sleepState,
    timestamp: csvData.timestamp,
    breathStatus: parsed.breathStatus,
    heartRateStatus: parsed.heartRateStatus,
    vitalSignStatus: parsed.vitalSignStatus
  };
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
  type: 'svg' | 'default' | 'png';
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
