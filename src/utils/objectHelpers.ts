/**
 * 物体辅助函数
 * 处理坐标转换和交互状态判断
 */

import type { Point, RadarPoint, BaseObject } from './types';

// ================ 坐标工具函数 ================
export const ensurePointWithZ = (point: Point): Point & { z: number } => ({
  x: point.x,
  y: point.y,
  z: point.z ?? 0
});

export const ensureRadarPointWithZ = (point: RadarPoint): RadarPoint & { z: number } => ({
  h: point.h,
  v: point.v, 
  z: point.z ?? 0
});

// ================ 交互状态判断 ================
export const canEdit = (obj: BaseObject): boolean => !obj.interactive.locked;
export const canDrag = (obj: BaseObject): boolean => !obj.interactive.locked;
export const canRotate = (obj: BaseObject): boolean => !obj.interactive.locked;
export const isLocked = (obj: BaseObject): boolean => obj.interactive.locked;
export const isSelected = (obj: BaseObject): boolean => obj.interactive.selected;

// ================ 设备类型判断 ================
export const isDevice = (obj: BaseObject): boolean => obj.device.category === 'iot';
export const isFurniture = (obj: BaseObject): boolean => obj.device.category === 'furniture';
export const isStructure = (obj: BaseObject): boolean => obj.device.category === 'structure';

export const isRadar = (obj: BaseObject): boolean => obj.typeName === 'Radar';
export const isSleepad = (obj: BaseObject): boolean => obj.typeName === 'Sleepad';
export const isSensor = (obj: BaseObject): boolean => obj.typeName === 'Sensor';

