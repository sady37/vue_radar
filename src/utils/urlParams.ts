/**
 * 参数接收工具
 * 注意：参数格式由服务器决定，这里只负责接收和验证
 */

import type { CanvasParams } from './types';

/**
 * 获取 Canvas 参数
 * 服务器通过 window.__radarCanvasParams 传递参数
 * 
 * 参数示例：
 * {
 *   canvasId: 'canvas_bedroom_201',
 *   devices: [
 *     { deviceId: 'RadarH', deviceName: '雷达A', bedId: 'Bed001', bedName: '1号床' },
 *     { deviceId: 'SleepadI', deviceName: '睡垫B' }
 *   ],
 *   currentDeviceId: 'RadarH'
 * }
 */
export function getCanvasParams(): CanvasParams | null {
  const params = (window as any).__radarCanvasParams;
  
  if (params && params.canvasId && params.devices && params.devices.length > 0) {
    console.log('🔗 接收到Canvas参数:', params);
    console.log(`   - CanvasID: ${params.canvasId}`);
    console.log(`   - 设备数: ${params.devices.length}`);
    return params;
  }
  
  console.warn('⚠️ 未接收到参数，使用默认空Canvas');
  return null;
}


