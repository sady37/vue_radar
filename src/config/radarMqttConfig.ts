// src/config/radarMqttConfig.ts
// 雷达设备MQTT配置映射
// 定义Canvas配置项到雷达设备key的映射关系

/**
 * 雷达配置项的MQTT Key映射
 * 按照执行顺序排列：安装模式 → 高度 → 边界 → 区域
 */
export const RADAR_MQTT_KEYS = {
  // 1. 安装模式 (installModel)
  INSTALL_MODEL: 'install_model',  // 值: 0=ceiling, 1=wall, 2=corn
  
  // 2. 安装高度 (height)
  HEIGHT: 'height',  // 单位: cm
  
  // 3. 边界配置 (boundary)
  BOUNDARY_LEFT: 'boundary_left',    // 左边界 (cm)
  BOUNDARY_RIGHT: 'boundary_right',  // 右边界 (cm)
  BOUNDARY_FRONT: 'boundary_front',  // 前边界 (cm)
  BOUNDARY_REAR: 'boundary_rear',    // 后边界 (cm)
  
  // 4. 区域配置 (areas) - 支持16个区域 (0-15)
  // 区域格式: area_{id}_{property}
  // 区域由4个顶点定义，顺序固定：右上、左上、右下、左下（与边界4顶点顺序相同）
  AREA_ID: 'area_{id}_id',              // 区域ID
  AREA_TYPE: 'area_{id}_type',          // 区域类型
  AREA_X1: 'area_{id}_x1',              // 顶点1(右上) X坐标 (cm)
  AREA_Y1: 'area_{id}_y1',              // 顶点1(右上) Y坐标 (cm)
  AREA_X2: 'area_{id}_x2',              // 顶点2(左上) X坐标 (cm)
  AREA_Y2: 'area_{id}_y2',              // 顶点2(左上) Y坐标 (cm)
  AREA_X3: 'area_{id}_x3',              // 顶点3(右下) X坐标 (cm)
  AREA_Y3: 'area_{id}_y3',              // 顶点3(右下) Y坐标 (cm)
  AREA_X4: 'area_{id}_x4',              // 顶点4(左下) X坐标 (cm)
  AREA_Y4: 'area_{id}_y4',              // 顶点4(左下) Y坐标 (cm)
} as const;

/**
 * 安装模式枚举值映射
 */
export const INSTALL_MODEL_MAP = {
  'ceiling': 0,
  'wall': 1,
  'corn': 2
} as const;

/**
 * MQTT命令配置顺序
 * 定义配置写入的优先级顺序
 */
export const MQTT_COMMAND_ORDER = [
  'installModel',  // 1. 先设置安装模式
  'height',        // 2. 再设置高度
  'boundary',      // 3. 然后设置边界
  'area_delete',   // 4. 删除不需要的区域
  'area_update',   // 5. 更新现有区域
  'area_add'       // 6. 最后添加新区域
] as const;

/**
 * 将Canvas配置转换为MQTT key/value格式
 */
export interface MqttKeyValue {
  key: string;
  value: string | number;
}

/**
 * 将installModel转换为MQTT格式
 */
export const convertInstallModel = (installModel: 'ceiling' | 'wall' | 'corn'): MqttKeyValue => {
  return {
    key: RADAR_MQTT_KEYS.INSTALL_MODEL,
    value: INSTALL_MODEL_MAP[installModel]
  };
};

/**
 * 将height转换为MQTT格式
 * Canvas 使用 cm，雷达使用 dm，需要除以10并取整
 */
export const convertHeight = (height: number): MqttKeyValue => {
  return {
    key: RADAR_MQTT_KEYS.HEIGHT,
    value: Math.round(height / 10) // cm -> dm，除以10并取整
  };
};

/**
 * 将boundary转换为MQTT格式（返回4个key/value对）
 * Canvas 使用 cm，雷达使用 dm，需要除以10并取整
 */
export const convertBoundary = (boundary: {
  leftH: number;
  rightH: number;
  frontV: number;
  rearV: number;
}): MqttKeyValue[] => {
  return [
    { key: RADAR_MQTT_KEYS.BOUNDARY_LEFT, value: Math.round(boundary.leftH / 10) },   // cm -> dm
    { key: RADAR_MQTT_KEYS.BOUNDARY_RIGHT, value: Math.round(boundary.rightH / 10) }, // cm -> dm
    { key: RADAR_MQTT_KEYS.BOUNDARY_FRONT, value: Math.round(boundary.frontV / 10) }, // cm -> dm
    { key: RADAR_MQTT_KEYS.BOUNDARY_REAR, value: Math.round(boundary.rearV / 10) }    // cm -> dm
  ];
};

/**
 * 将area转换为MQTT格式（返回多个key/value对）
 * 区域由4个顶点定义，顺序固定（与边界4顶点顺序相同）：
 *   点1(x1,y1): 右上
 *   点2(x2,y2): 左上
 *   点3(x3,y3): 右下
 *   点4(x4,y4): 左下
 */
export const convertArea = (area: {
  areaId: number;
  areaType?: string;
  points: {
    x1: number;  // 右上 X
    y1: number;  // 右上 Y
    x2: number;  // 左上 X
    y2: number;  // 左上 Y
    x3: number;  // 右下 X
    y3: number;  // 右下 Y
    x4: number;  // 左下 X
    y4: number;  // 左下 Y
  };
}): MqttKeyValue[] => {
  const keyValues: MqttKeyValue[] = [];
  const id = area.areaId;
  
  // 区域ID
  keyValues.push({
    key: RADAR_MQTT_KEYS.AREA_ID.replace('{id}', id.toString()),
    value: area.areaId
  });
  
  // 区域类型
  if (area.areaType) {
    keyValues.push({
      key: RADAR_MQTT_KEYS.AREA_TYPE.replace('{id}', id.toString()),
      value: area.areaType
    });
  }
  
  // 4个顶点的坐标（按顺序：右上、左上、右下、左下）
  // Canvas 使用 cm，雷达使用 dm，需要除以10并取整
  keyValues.push(
    { key: RADAR_MQTT_KEYS.AREA_X1.replace('{id}', id.toString()), value: Math.round(area.points.x1 / 10) },  // 右上 X (cm->dm)
    { key: RADAR_MQTT_KEYS.AREA_Y1.replace('{id}', id.toString()), value: Math.round(area.points.y1 / 10) },  // 右上 Y (cm->dm)
    { key: RADAR_MQTT_KEYS.AREA_X2.replace('{id}', id.toString()), value: Math.round(area.points.x2 / 10) },  // 左上 X (cm->dm)
    { key: RADAR_MQTT_KEYS.AREA_Y2.replace('{id}', id.toString()), value: Math.round(area.points.y2 / 10) },  // 左上 Y (cm->dm)
    { key: RADAR_MQTT_KEYS.AREA_X3.replace('{id}', id.toString()), value: Math.round(area.points.x3 / 10) },  // 右下 X (cm->dm)
    { key: RADAR_MQTT_KEYS.AREA_Y3.replace('{id}', id.toString()), value: Math.round(area.points.y3 / 10) },  // 右下 Y (cm->dm)
    { key: RADAR_MQTT_KEYS.AREA_X4.replace('{id}', id.toString()), value: Math.round(area.points.x4 / 10) },  // 左下 X (cm->dm)
    { key: RADAR_MQTT_KEYS.AREA_Y4.replace('{id}', id.toString()), value: Math.round(area.points.y4 / 10) }   // 左下 Y (cm->dm)
  );
  
  return keyValues;
};

/**
 * 删除area（发送空的坐标值，或者特殊标记）
 */
export const deleteArea = (areaId: number): MqttKeyValue[] => {
  const id = areaId.toString();
  // 将所有坐标设为 0 或 -1 表示删除
  return [
    { key: RADAR_MQTT_KEYS.AREA_ID.replace('{id}', id), value: -1 },  // -1 表示删除
    { key: RADAR_MQTT_KEYS.AREA_X1.replace('{id}', id), value: 0 },
    { key: RADAR_MQTT_KEYS.AREA_Y1.replace('{id}', id), value: 0 },
    { key: RADAR_MQTT_KEYS.AREA_X2.replace('{id}', id), value: 0 },
    { key: RADAR_MQTT_KEYS.AREA_Y2.replace('{id}', id), value: 0 },
    { key: RADAR_MQTT_KEYS.AREA_X3.replace('{id}', id), value: 0 },
    { key: RADAR_MQTT_KEYS.AREA_Y3.replace('{id}', id), value: 0 },
    { key: RADAR_MQTT_KEYS.AREA_X4.replace('{id}', id), value: 0 },
    { key: RADAR_MQTT_KEYS.AREA_Y4.replace('{id}', id), value: 0 }
  ];
};

/**
 * 生成MQTT更新命令的data部分
 * 将多个key/value对转换为 {key1: value1, key2: value2} 格式
 */
export const buildMqttUpdateData = (keyValues: MqttKeyValue[]): Record<string, string | number> => {
  const data: Record<string, string | number> = {};
  keyValues.forEach(kv => {
    data[kv.key] = kv.value;
  });
  return data;
};

/**
 * 生成完整的MQTT更新命令
 */
export const buildMqttUpdateCommand = (
  keyValues: MqttKeyValue[],
  requestId: string = `req_${Date.now()}`
) => {
  return {
    cmd: 'update',
    requestId: requestId,
    data: buildMqttUpdateData(keyValues)
  };
};

/**
 * 生成MQTT读取命令
 */
export const buildMqttReadCommand = (
  keys: string[],
  requestId: string = `req_${Date.now()}`
) => {
  return {
    cmd: 'read',
    requestId: requestId,
    data: {
      key: keys
    }
  };
};

/**
 * 获取所有需要查询的配置key列表
 * 用于Query操作，读取设备完整配置
 */
export const getAllRadarConfigKeys = (): string[] => {
  const keys: string[] = [
    // 基础配置
    RADAR_MQTT_KEYS.INSTALL_MODEL,
    RADAR_MQTT_KEYS.HEIGHT,
    
    // 边界配置
    RADAR_MQTT_KEYS.BOUNDARY_LEFT,
    RADAR_MQTT_KEYS.BOUNDARY_RIGHT,
    RADAR_MQTT_KEYS.BOUNDARY_FRONT,
    RADAR_MQTT_KEYS.BOUNDARY_REAR,
  ];
  
  // 添加所有区域配置key（支持16个区域）
  for (let i = 0; i < 16; i++) {
    keys.push(
      RADAR_MQTT_KEYS.AREA_ID.replace('{id}', i.toString()),
      RADAR_MQTT_KEYS.AREA_TYPE.replace('{id}', i.toString()),
      RADAR_MQTT_KEYS.AREA_X1.replace('{id}', i.toString()),
      RADAR_MQTT_KEYS.AREA_Y1.replace('{id}', i.toString()),
      RADAR_MQTT_KEYS.AREA_X2.replace('{id}', i.toString()),
      RADAR_MQTT_KEYS.AREA_Y2.replace('{id}', i.toString()),
      RADAR_MQTT_KEYS.AREA_X3.replace('{id}', i.toString()),
      RADAR_MQTT_KEYS.AREA_Y3.replace('{id}', i.toString()),
      RADAR_MQTT_KEYS.AREA_X4.replace('{id}', i.toString()),
      RADAR_MQTT_KEYS.AREA_Y4.replace('{id}', i.toString())
    );
  }
  
  return keys;
};

/**
 * 解析MQTT读取响应，转换为Canvas配置格式
 * 雷达使用 dm，Canvas 使用 cm，需要乘以10
 */
export const parseMqttReadResponse = (mqttData: Record<string, any>) => {
  // 1. 解析 installModel
  const installModelValue = mqttData[RADAR_MQTT_KEYS.INSTALL_MODEL];
  const installModelMap: Record<number, 'ceiling' | 'wall' | 'corn'> = {
    0: 'ceiling',
    1: 'wall',
    2: 'corn'
  };
  const installModel = installModelMap[installModelValue] || 'wall';
  
  // 2. 解析 height（dm -> cm，乘以10）
  const heightDm = mqttData[RADAR_MQTT_KEYS.HEIGHT] || 17;  // dm
  const height = heightDm * 10;  // 转换为 cm
  
  // 3. 解析 boundary（dm -> cm，乘以10）
  const boundary = {
    leftH: (mqttData[RADAR_MQTT_KEYS.BOUNDARY_LEFT] || 0) * 10,   // dm -> cm
    rightH: (mqttData[RADAR_MQTT_KEYS.BOUNDARY_RIGHT] || 0) * 10, // dm -> cm
    frontV: (mqttData[RADAR_MQTT_KEYS.BOUNDARY_FRONT] || 0) * 10, // dm -> cm
    rearV: (mqttData[RADAR_MQTT_KEYS.BOUNDARY_REAR] || 0) * 10    // dm -> cm
  };
  
  // 4. 解析 areas（使用4个点的坐标）
  const areas: any[] = [];
  for (let i = 0; i < 16; i++) {
    const idKey = RADAR_MQTT_KEYS.AREA_ID.replace('{id}', i.toString());
    const areaIdValue = mqttData[idKey];
    
    // 只添加有效的区域（area_id 不为 -1 或 undefined）
    if (areaIdValue !== undefined && areaIdValue !== -1) {
      const typeKey = RADAR_MQTT_KEYS.AREA_TYPE.replace('{id}', i.toString());
      const x1Key = RADAR_MQTT_KEYS.AREA_X1.replace('{id}', i.toString());
      const y1Key = RADAR_MQTT_KEYS.AREA_Y1.replace('{id}', i.toString());
      const x2Key = RADAR_MQTT_KEYS.AREA_X2.replace('{id}', i.toString());
      const y2Key = RADAR_MQTT_KEYS.AREA_Y2.replace('{id}', i.toString());
      const x3Key = RADAR_MQTT_KEYS.AREA_X3.replace('{id}', i.toString());
      const y3Key = RADAR_MQTT_KEYS.AREA_Y3.replace('{id}', i.toString());
      const x4Key = RADAR_MQTT_KEYS.AREA_X4.replace('{id}', i.toString());
      const y4Key = RADAR_MQTT_KEYS.AREA_Y4.replace('{id}', i.toString());
      
      areas.push({
        areaId: i,
        areaType: mqttData[typeKey] || '',
        points: {
          // dm -> cm，乘以10
          x1: (mqttData[x1Key] || 0) * 10,
          y1: (mqttData[y1Key] || 0) * 10,
          x2: (mqttData[x2Key] || 0) * 10,
          y2: (mqttData[y2Key] || 0) * 10,
          x3: (mqttData[x3Key] || 0) * 10,
          y3: (mqttData[y3Key] || 0) * 10,
          x4: (mqttData[x4Key] || 0) * 10,
          y4: (mqttData[y4Key] || 0) * 10
        }
      });
    }
  }
  
  return {
    installModel,
    height,
    boundary,
    areas
  };
};

