/**
 * 预设配置
 * 家具、结构等对象的默认尺寸和颜色
 */

// ================ 家具类型定义 ================
export type FurnitureType = 
  | 'Bed'
  | 'MonitorBed'  // 睡眠监测床
  | 'Interfere'   // 干扰区域
  | 'Enter'       // 入口
  | 'Wall'
  | 'Furniture'   // 通用家具（菜单显示）
  | 'GlassTV'     // 玻璃/电视
  | 'Other'       // 其他
  | 'Table'       // 桌子
  | 'Chair'       // 椅子
  | 'Curtain'     // 窗帘
  | 'MetalCan'    // 金属桶
  | 'WheelChair'; // 轮椅

// ================ 家具预设配置 ================
interface FurniturePreset {
  typeName: string;
  typeValue: number;
  color: string;      // 默认颜色
  description: string;
}

export const FURNITURE_PRESETS: Record<FurnitureType, FurniturePreset> = {
  Bed: {
    typeName: 'Bed',
    typeValue: 2,
    color: '#d7d7a0',  // RGB: (215, 215, 160) 浅黄绿色，反差大易识别
    description: 'Normal Bed'
  },
  
  MonitorBed: {
    typeName: 'MonitorBed',
    typeValue: 5,
    color: '#F0E68C',  // RGB: (240, 230, 140)
    description: 'Monitor Bed'
  },
  
  Interfere: {
    typeName: 'Interfere',
    typeValue: 3,
    color: '#F5F5F5',  // 浅白色（表示金属反光）
    description: 'Interfere Area'
  },
  
  Enter: {
    typeName: 'Enter',
    typeValue: 4,
    color: '#A9EAA9',  // RGB: (169, 234, 169)
    description: 'Entrance'
  },
  
  Wall: {
    typeName: 'Wall',
    typeValue: 1,
    color: '#000000',  // 黑色
    description: 'Wall'
  },
  
  Furniture: {
    typeName: 'Furniture',
    typeValue: 1,
    color: '#d3d3d3',  // 浅灰色 (使用 Other 的颜色)
    description: 'Generic Furniture'
  },
  
  GlassTV: {
    typeName: 'GlassTV',
    typeValue: 1,
    color: '#e0e0e0',  // 浅灰色
    description: 'Glass/TV'
  },
  
  Other: {
    typeName: 'Other',
    typeValue: 1,
    color: '#d3d3d3',  // 浅灰色
    description: 'Other Object'
  },
  
  Table: {
    typeName: 'Table',
    typeValue: 1,
    color: '#c19a6b',  // 浅棕色
    description: 'Table'
  },
  
  Chair: {
    typeName: 'Chair',
    typeValue: 1,
    color: '#a0522d',  // 赭色
    description: 'Chair'
  },
  
  Curtain: {
    typeName: 'Curtain',
    typeValue: 1,
    color: '#82BBEB',  // RGB: (130, 187, 235)
    description: 'Curtain'
  },
  
  MetalCan: {
    typeName: 'MetalCan',
    typeValue: 3,
    color: '#F5F5F5',  // 浅白色（表示金属反光）
    description: 'Metal Can'
  },
  
  WheelChair: {
    typeName: 'WheelChair',
    typeValue: 3,
    color: '#a0826d',  // 灰棕色
    description: 'Wheel Chair'
  }
};

// ================ 家具类型 → 默认绘图工具映射 ================
export const FURNITURE_TOOL_MAP: Record<string, string> = {
  'Bed': 'rectangle',
  'MonitorBed': 'rectangle',
  'Interfere': 'rectangle',
  'Enter': 'rectangle',
  'Wall': 'line',
  'Furniture': 'rectangle',
  'GlassTV': 'rectangle',
  'Other': 'rectangle',
  'Table': 'rectangle',
  'Chair': 'rectangle',
  'Curtain': 'rectangle',
  'MetalCan': 'rectangle',
  'WheelChair': 'rectangle'
};

// ================ IoT设备预设配置 ================
export interface IoTDevicePreset {
  typeName: string;
  defaultPosition: {
    x: number;   // 画布坐标X（0为中心）
    y: number;   // 画布坐标Y
    z: number;   // 高度（cm）
  };
  color: string;
  installModel: 'ceiling' | 'wall' | 'corn';
  description: string;
}

export const IOT_DEVICE_PRESETS: Record<string, IoTDevicePreset> = {
  Radar: {
    typeName: 'Radar',
    defaultPosition: { x: 0, y: 10, z: 280 },  // 画布中心，顶部，高度280cm
    color: '#2196F3',  // Blue
    installModel: 'ceiling',
    description: '雷达传感器'
  },
  
  Sleepad: {
    typeName: 'Sleepad',
    defaultPosition: { x: 0, y: 100, z: 100 },  // 画布中心，稍下，高度100cm
    color: '#9C27B0',  // Purple
    installModel: 'ceiling',
    description: '睡眠辅助监测器'
  },
  
  Sensor: {
    typeName: 'Sensor',
    defaultPosition: { x: 100, y: 100, z: 150 },  // 稍偏右，高度150cm
    color: '#FF9800',  // Orange
    installModel: 'wall',
    description: '通用传感器'
  }
};

// ================ 辅助函数 ================

/**
 * 获取家具预设配置
 */
export function getFurniturePreset(type: string): FurniturePreset | undefined {
  return FURNITURE_PRESETS[type as FurnitureType];
}

/**
 * 获取IoT设备预设配置
 */
export function getIoTDevicePreset(type: string): IoTDevicePreset | undefined {
  return IOT_DEVICE_PRESETS[type];
}

/**
 * 获取默认颜色
 */
export function getDefaultColor(type: string): string {
  const furniturePreset = getFurniturePreset(type);
  if (furniturePreset) return furniturePreset.color;
  
  const iotPreset = getIoTDevicePreset(type);
  if (iotPreset) return iotPreset.color;
  
  return '#d3d3d3';  // 默认灰色
}

