/**
 * 雷达坐标转换工具
 * 
 * ================ 画布坐标系规则 ================
 * - 原点在画布顶部中心 
 * - x轴：向左为负(-)，向右为正(+)
 * - y轴：向下为正(+)，向上为负(-) 
 * 
 * ================ 雷达坐标系规则 ================
 * ceiling模式：
 * - 原点在雷达中心 (0,0) 
 * - H轴：+H=-X，-H=+X
 * - V轴：+V=+Y，-V=-Y
 * 
 * ================ 安装模式边界处理 ================
 * 1. Ceiling模式（吸顶安装）：
 *    - 矩形边界，4个角都有边界
 *    - rearV有值（雷达后方也有探测区域）
 *    - 边界：[rightH, leftH, frontV, rearV]
 * 
 * 2. Wall模式（贴墙安装）：
 *    - 雷达紧贴墙壁，rearV=0（墙面位置）
 *    - 只有前方和左右有探测区域
 *    - 边界：[rightH, leftH, frontV, 0]
 * 
 * 3. Corn模式（墙角安装）：
 *    - ⚠️ 边界计算与Wall模式相同（rearV=0）
 *    - 显示时可能使用扇形图形
 *    - 边界：[rightH, leftH, frontV, 0]
 * 
 * ================ 顶点顺序规则 ================
 * 顶点顺序 (v1,v2,v3,v4)：先minH排序，相同时再用minV排序
 * 默认ceiling模式 (H+向左-X, V+向下+Y):
 * - v1: 首选minH，在相同H中取minV
 * - v2: minH，sec minV
 * - v3: sec min H，minV
 * - v4: sec min H，sec minV
 * 
 * 当雷达旋转后，坐标系跟随旋转，顶点定义规则保持不变
 * 即：v1始终是雷达当前坐标系下的最小H
 */


import type { 
  BaseObject, Point, RadarPoint, RadarBoundaryVertices, 
  RadarReport, RadarObjectInBoundary, RadarArea
} from './types';
import { AREA_TYPE_MAP } from './types';


/**
 * 雷达坐标系 -> 画布坐标系
 */
export function toCanvasCoordinate(radarPoint: RadarPoint, radar: BaseObject): Point {
  // 1. 获取雷达中心位置
  const radarGeometry = radar.geometry;
  if (radarGeometry.type !== 'point') {
    throw new Error('Object is not a radar');
  }
  const radarCenter = radarGeometry.data;

  // 2. 坐标系映射：h/v → x/y（不含旋转）
  // 雷达坐标系：H轴左为正，V轴下为正
  // 画布坐标系：X轴右为正，Y轴下为正
  // 因此：x = -h, y = v
  const localX = -radarPoint.h;  // H左正 → X右正，取负
  const localY = radarPoint.v;   // V下正 → Y下正，保持

  // 3. 应用旋转
  // 关键：因为X=-H存在镜像，旋转方向需要反转
  // 在画布上逆时针旋转angle° = 在映射前的坐标系中顺时针旋转angle°
  // 因此使用 -angle
  const angle = radar.angle || 0;
  const angleRad = -(angle * Math.PI) / 180;  // 注意负号
  const rotatedX = localX * Math.cos(angleRad) - localY * Math.sin(angleRad);
  const rotatedY = localX * Math.sin(angleRad) + localY * Math.cos(angleRad);

  // 4. 平移到雷达中心
  return {
    x: radarCenter.x + rotatedX,
    y: radarCenter.y + rotatedY,
    z: radarCenter.z || 0
  };
}

/**
 * 画布坐标系 -> 雷达坐标系
 */
export function toRadarCoordinate(canvasX: number, canvasY: number, radar: BaseObject): RadarPoint {
  // 1. 获取雷达中心位置
  const radarGeometry = radar.geometry;
  if (radarGeometry.type !== 'point') {
    throw new Error('Object is not a radar');
  }
  const radarCenter = radarGeometry.data;

  // 2. 平移到雷达本地坐标（相对于雷达中心）
  const localX = canvasX - radarCenter.x;
  const localY = canvasY - radarCenter.y;

  // 3. 应用逆旋转
  // 关键：因为X=-H存在镜像，旋转方向需要反转
  // 逆旋转也需要用-angle，然后取逆操作
  const angle = radar.angle || 0;
  const angleRad = -(angle * Math.PI) / 180;  // 注意负号
  const unrotatedX = localX * Math.cos(angleRad) + localY * Math.sin(angleRad);
  const unrotatedY = -localX * Math.sin(angleRad) + localY * Math.cos(angleRad);

  // 4. 坐标系映射：x/y → h/v
  // 画布坐标系：X轴右为正，Y轴下为正
  // 雷达坐标系：H轴左为正，V轴下为正
  // 因此：h = -x, v = y
  const h = -unrotatedX;  // X右正 → H左正，取负
  const v = unrotatedY;   // Y下正 → V下正，保持

  return { 
    h, 
    v, 
    z: 0 
  };
}

/**
 * 获取雷达边界在画布坐标系中的4个顶点（所有模式都是矩形）
 * - Ceiling模式：雷达在中心，使用leftH/rightH/frontV/rearV
 * - Wall模式：雷达在后边（rearV=0），使用leftH/rightH/frontV
 * - Corn模式：雷达在顶点，只使用leftH和rightH（矩形长宽），矩形顶点=(0,0),(leftH,0),(leftH,rightH),(0,rightH)
 */
export function getRadarBoundaryVertices(radar: BaseObject): Point[] {
  // 1. 获取雷达配置
  const iotConfig = radar.device.iot;
  const radarConfig = iotConfig?.radar;
  const installModel = radarConfig?.installModel || 'ceiling';
  
  // 2. 直接使用雷达对象的边界配置
  const boundary = radarConfig!.boundary!;
  
  // 3. 根据安装模式生成雷达坐标系中的边界顶点
  let radarVertices: RadarPoint[];
  
  if (installModel === 'ceiling') {
    // Ceiling模式：矩形边界，4个角都有边界
    radarVertices = [
      { h: -boundary.rightH, v: -boundary.rearV, z: 0 },    // 右上
      { h: boundary.leftH, v: -boundary.rearV, z: 0 },      // 左上
      { h: -boundary.rightH, v: boundary.frontV, z: 0 },    // 右下
      { h: boundary.leftH, v: boundary.frontV, z: 0 }       // 左下
    ];
  } else if (installModel === 'corn') {
    // Corn模式：矩形边界，雷达在顶点(0,0)
    // 只使用leftH和rightH（矩形的长宽），不使用frontV和rearV
    // 矩形在雷达坐标系中需要旋转，使对角线朝向+V方向
    
    const leftH = boundary.leftH || 0;
    const rightH = boundary.rightH || 0;
    
    // 对角线与+H轴的夹角
    const diagonalAngle = Math.atan2(rightH, leftH);
    
    // 需要旋转的角度：使对角线朝向+V（90度）
    // rotationNeeded = π/2 - diagonalAngle
    const rotationNeeded = Math.PI / 2 - diagonalAngle;
    
    // 原始矩形4个顶点（未旋转）：
    const originalVertices = [
      { h: leftH, v: 0 },      // 顶点2
      { h: 0, v: 0 },          // 顶点1（雷达）
      { h: leftH, v: rightH }, // 顶点3（对角）
      { h: 0, v: rightH }      // 顶点4
    ];
    
    // 绕雷达位置(0,0)旋转矩形
    radarVertices = originalVertices.map(v => ({
      h: v.h * Math.cos(rotationNeeded) - v.v * Math.sin(rotationNeeded),
      v: v.h * Math.sin(rotationNeeded) + v.v * Math.cos(rotationNeeded),
      z: 0
    }));
  } else {
    // Wall模式：雷达紧贴墙壁，rearV=0（墙面位置）
    radarVertices = [
      { h: -boundary.rightH, v: 0, z: 0 },                  // 右上 (紧贴墙壁)
      { h: boundary.leftH, v: 0, z: 0 },                    // 左上 (紧贴墙壁)
      { h: -boundary.rightH, v: boundary.frontV, z: 0 },    // 右下
      { h: boundary.leftH, v: boundary.frontV, z: 0 }       // 左下
    ];
  }
  
  // 4. 使用 toCanvasCoordinate 转换为画布坐标
  const canvasVertices = radarVertices.map(vertex => 
    toCanvasCoordinate(vertex, radar)
  );
  
  // 5. 返回顶点数组（3个或4个）
  return canvasVertices;
}


/**
 * 使用射线法判断点是否在多边形内
 */
export function isPointInPolygon(point: Point, vertices: Point[]): boolean {
  if (vertices.length < 3) return false; // 至少需要3个顶点
  
  let inside = false;
  const x = point.x;
  const y = point.y;
  
  // 遍历多边形的每条边
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    
    // 检查点是否在边的Y范围内
    const yInRange = (yi > y) !== (yj > y);
    
    if (yInRange) {
      // 计算射线与边的交点X坐标
      const intersectX = (xj - xi) * (y - yi) / (yj - yi) + xi;
      
      // 如果交点在点的右侧，则计数
      if (x < intersectX) {
        inside = !inside;
      }
    }
  }
  
  return inside;
}

/**
 * 判断点是否在雷达边界内（使用射线法）
 */
export function isPointInRadarBoundary(point: Point, radar: BaseObject): boolean {
  // 获取雷达边界的4个顶点
  const boundaryVertices = getRadarBoundaryVertices(radar);
  
  // 使用射线法判断点是否在边界多边形内
  return isPointInPolygon(point, boundaryVertices);
}


/**
 * 获取物体在画布坐标系中的顶点
 */
export function getObjectVertices(obj: BaseObject): Point[] {
  // 安全检查：只处理家具类物体
  if (!obj.device || obj.device.category !== 'furniture') {
    return [];
  }
  
  const geometry = obj.geometry;
  
  switch (geometry.type) {
    case 'point':
      // 点：设备没有顶点概念，返回空数组
      return [];
      
    case 'rectangle':
      // 矩形：确保顶点按顺时针顺序返回（左上→右上→右下→左下）
      // 原始顺序是：[0]左上、[1]右上、[2]左下、[3]右下
      // 需要调整为：[0]左上、[1]右上、[3]右下、[2]左下
      const verts = geometry.data.vertices;
      return [verts[0], verts[1], verts[3], verts[2]];
      
    case 'circle':
      // 圆形：转换为外接正方形的4个顶点（顺时针：右上→右下→左下→左上）
      const { center, radius } = geometry.data;
      return [
        { x: center.x + radius, y: center.y - radius, z: center.z || 0 }, // 右上
        { x: center.x + radius, y: center.y + radius, z: center.z || 0 }, // 右下
        { x: center.x - radius, y: center.y + radius, z: center.z || 0 }, // 左下
        { x: center.x - radius, y: center.y - radius, z: center.z || 0 }, // 左上
      ];
      
    case 'line':
      // 线段：返回起点和终点
      const line = geometry.data;
      return [
        { ...line.start },
        { ...line.end }
      ];
      
    case 'polygon':
      // 多边形：直接返回所有顶点
      return [...geometry.data.vertices];
      
    default:
      return [];
  }
}

/**
 * 基于顶点计算物体的几何中心点（仅对家具类物体）
 */
export function getObjectCenter(obj: BaseObject): Point {
  // 只处理家具类物体
  if (obj.device.category !== 'furniture') {
    return { x: 0, y: 0, z: 0 };
  }
  
  const vertices = getObjectVertices(obj);
  
  if (vertices.length === 0) return { x: 0, y: 0, z: 0 };
  
  const sumX = vertices.reduce((sum, vertex) => sum + vertex.x, 0);
  const sumY = vertices.reduce((sum, vertex) => sum + vertex.y, 0);
  const sumZ = vertices.reduce((sum, vertex) => sum + (vertex.z || 0), 0);
  
  return {
    x: sumX / vertices.length,
    y: sumY / vertices.length,
    z: sumZ / vertices.length
  };
}


/**
 * 判断家具是否在雷达边界内
 */
export function isObjectInBoundary(obj: BaseObject, radar: BaseObject): boolean {
  // 只检查家具类物体
  if (obj.device.category !== 'furniture') {
    return false;
  }

  // 1. 获取家具的顶点（画布坐标）
  const objectVertices = getObjectVertices(obj);
  if (objectVertices.length === 0) return false;

  // 2. 获取雷达边界顶点（画布坐标）
  const boundaryVertices = getRadarBoundaryVertices(radar);

  // 3. 检查家具的每个顶点是否在边界内
  for (const vertex of objectVertices) {
    if (!isPointInPolygon(vertex, boundaryVertices)) {
      // 只要有一个顶点在边界外，整个物体就不在边界内
      return false;
    }
  }

  // 4. 所有顶点都在边界内
  return true;
}

/**
 * 获取雷达边界内的所有家具
 */
export function getObjectsInBoundary(objects: BaseObject[], radar: BaseObject): BaseObject[] {
  return objects.filter(obj => 
    obj.device.category === 'furniture' && 
    isObjectInBoundary(obj, radar)
  );
}

/**
 * 计算家具与雷达边界的重叠面积比例 (0-1)
 */
export function calculateOverlapRatio(obj: BaseObject, radar: BaseObject): number {
  if (obj.device.category !== 'furniture') {
    return 0;
  }

  // 简化实现：如果物体完全在边界内，返回1；否则返回0
  // 实际应该计算精确的重叠面积，这里先简化
  return isObjectInBoundary(obj, radar) ? 1 : 0;
}

/**
 * 获取带容差的雷达边界顶点（边界扩大20cm）
 */
export function getRadarBoundaryWithTolerance(radar: BaseObject, tolerance: number = 20): Point[] {
  // 1. 获取原始边界顶点
  const originalVertices = getRadarBoundaryVertices(radar);
  
  // 2. 计算边界中心点
  const center = getObjectCenter({
    ...radar,
    geometry: {
      type: 'polygon',
      data: { vertices: originalVertices }
    }
  } as BaseObject);
  
  // 3. 将每个顶点从中心向外扩展
  const expandedVertices = originalVertices.map(vertex => {
    // 计算从中心到顶点的方向向量
    const dx = vertex.x - center.x;
    const dy = vertex.y - center.y;
    
    // 计算向量的长度
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return vertex;
    
    // 向外扩展指定距离
    const scale = (length + tolerance) / length;
    
    return {
      x: center.x + dx * scale,
      y: center.y + dy * scale,
      z: vertex.z
    };
  });
  
  return expandedVertices;
}

/**
 * 判断家具是否在雷达边界内（带20cm容差）
 */
export function isObjectInBoundaryWithTolerance(obj: BaseObject, radar: BaseObject, tolerance: number = 20): boolean {
  // 只检查家具类物体
  if (obj.device.category !== 'furniture') {
    return false;
  }

  // 1. 获取家具的顶点
  const objectVertices = getObjectVertices(obj);
  if (objectVertices.length === 0) return false;

  // 2. 获取雷达边界顶点（已考虑旋转）
  const radarBoundaryVertices = getRadarBoundaryVertices(radar);
  
  // 3. 计算边界的包围盒（考虑容差）
  const boundaryXs = radarBoundaryVertices.map(v => v.x);
  const boundaryYs = radarBoundaryVertices.map(v => v.y);
  const minX = Math.min(...boundaryXs) - tolerance;
  const maxX = Math.max(...boundaryXs) + tolerance;
  const minY = Math.min(...boundaryYs) - tolerance;
  const maxY = Math.max(...boundaryYs) + tolerance;

  // 4. 检查所有顶点是否都在边界包围盒内
  for (const v of objectVertices) {
    if (v.x < minX || v.x > maxX || v.y < minY || v.y > maxY) {
      return false;
    }
  }

  return true;
}

/**
 * 获取雷达边界内的所有家具（带容差）
 */
export function getObjectsInBoundaryWithTolerance(objects: BaseObject[], radar: BaseObject, tolerance: number = 20): BaseObject[] {
  return objects.filter(obj => 
    obj.device.category === 'furniture' && 
    isObjectInBoundaryWithTolerance(obj, radar, tolerance)
  );
}

/**
 * 获取物体在雷达坐标系中的顶点
 */
export function getObjectVerticesInRadar(obj: BaseObject, radar: BaseObject): RadarPoint[] {
  // 只处理家具类物体
  if (obj.device.category !== 'furniture') {
    return [];
  }

  // 1. 获取物体在画布坐标系中的顶点
  const canvasVertices = getObjectVertices(obj);
  
  // 2. 转换为雷达坐标系
  const radarVertices = canvasVertices.map(vertex => 
    toRadarCoordinate(vertex.x, vertex.y, radar)
  );
  
  // 3. 取整到10的倍数（保持与原系统一致）
  const roundToTen = (num: number) => Math.round(num / 10) * 10;
  
  const roundedVertices = radarVertices.map(vertex => ({
    h: roundToTen(vertex.h),
    v: roundToTen(vertex.v),
    z: roundToTen(vertex.z || 0)
  }));
  
  // 4. 按照顶点顺序规则排序：右上、左上、右下、左下
  // 先按V（从小到大），同V时按H（从小到大）
  return roundedVertices.sort((a, b) => {
    if (Math.abs(a.v - b.v) < 1) {
      return a.h - b.h; // V相同时按H排序（从小到大，即从右到左）
    }
    return a.v - b.v; // 优先按V排序（从小到大，即从上到下）
  });
}




/**
 * 生成雷达配置报告
 */
export function generateRadarReport(radar: BaseObject, objects: BaseObject[]): RadarReport | null {
  if (radar.typeName !== 'Radar') {
    return null;
  }

  const iotConfig = radar.device.iot;
  const radarConfig = iotConfig?.radar;
  const installModel = radarConfig?.installModel || 'ceiling';
  
  // 获取边界内的家具
  const furnitureInBoundary = getObjectsInBoundaryWithTolerance(objects, radar);
  
  // 转换为雷达报告格式
  const reportObjects: RadarObjectInBoundary[] = furnitureInBoundary.map(obj => ({
    typeValue: obj.typeValue,
    typeName: obj.typeName,
    id: obj.id,
    name: obj.name,
    radarVertices: getObjectVerticesInRadar(obj, radar)
  }));

  // 获取边界顶点并转换为雷达坐标系
  const boundaryVertices = getRadarBoundaryVertices(radar);
  
  // 转换为雷达坐标系
  const radarPoints = boundaryVertices.map(vertex => 
    toRadarCoordinate(vertex.x, vertex.y, radar)
  );
  
  // 按照雷达坐标系规则排序：先minH排序，相同时再用minV排序
  const sortedVertices = [...radarPoints].sort((a, b) => {
    if (a.h !== b.h) return a.h - b.h; // 先按H排序
    return a.v - b.v; // H相同时按V排序
  });

  // 创建符合类型定义的 RadarBoundaryVertices 对象
  const radarBoundaryVertices: RadarBoundaryVertices = {
    v1: sortedVertices[0],
    v2: sortedVertices[1],
    v3: sortedVertices[2],
    v4: sortedVertices[3]
  };

  return {
    id: radar.id,
    typeValue: radar.typeValue,
    typeName: radar.typeName,
    name: radar.name,
    installModel,
    config: {
      boundary: radarConfig!.boundary!
    },
    boundaryVertices: radarBoundaryVertices,
    objects: reportObjects
  };
}

/**
 * 判断雷达中心是否在某个家具对象内
 */
export function isRadarCenterInObject(obj: BaseObject, radar: BaseObject): boolean {
  if (obj.device.category !== 'furniture') return false;
  
  const radarGeometry = radar.geometry;
  if (radarGeometry.type !== 'point') return false;
  const radarCenter = radarGeometry.data;  // 雷达自身的坐标（不是边界中心）
  
  const objectVertices = getObjectVertices(obj);
  if (objectVertices.length === 0) return false;
  
  return isPointInPolygon(radarCenter, objectVertices);
}

/**
 * 分配 area-id（0-15，找第一个可用的）
 */
export function assignAreaIds(count: number, existingAreas: RadarArea[] = []): number[] {
  const usedIds = new Set(existingAreas.map(area => area.areaId));
  const assignedIds: number[] = [];
  
  for (let i = 0; i < count && assignedIds.length < 16; i++) {
    for (let id = 0; id <= 15; id++) {
      if (!usedIds.has(id) && !assignedIds.includes(id)) {
        assignedIds.push(id);
        break;
      }
    }
  }
  
  return assignedIds;
}

/**
 * 更新雷达的区域列表
 */
export function updateRadarAreas(radar: BaseObject, allObjects: BaseObject[]): RadarArea[] {
  // 1. 获取边界内的家具
  const furnitureInBoundary = getObjectsInBoundaryWithTolerance(allObjects, radar);
  
  // 2. 分配 area-id
  const areaIds = assignAreaIds(furnitureInBoundary.length, radar.device.iot?.radar?.areas);
  
  // 3. 转换为 RadarArea 格式
  const areas: RadarArea[] = furnitureInBoundary.map((obj, index) => {
    const areaId = areaIds[index];
    
    // 根据家具类型获取 area-type
    let areaType = AREA_TYPE_MAP[obj.typeName] || 1;
    
    // 对于床，动态判断雷达是否在床内
    if (obj.typeName === 'Bed' || obj.typeName === 'MonitorBed') {
      const radarInBed = isRadarCenterInObject(obj, radar);
      areaType = radarInBed ? 5 : 2;
    }
    
    // 获取对象在雷达坐标系中的顶点
    const radarVertices = getObjectVerticesInRadar(obj, radar);
    
    const vertices: [RadarPoint, RadarPoint, RadarPoint, RadarPoint] = [
      radarVertices[0] || { h: 0, v: 0, z: 0 },
      radarVertices[1] || { h: 0, v: 0, z: 0 },
      radarVertices[2] || { h: 0, v: 0, z: 0 },
      radarVertices[3] || { h: 0, v: 0, z: 0 }
    ];
    
    return {
      areaId,
      areaType,
      objectId: obj.id,
      objectType: obj.typeName,
      vertices
    };
  });
  
  return areas;
}