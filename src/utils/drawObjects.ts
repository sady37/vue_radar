/**
 * 物体绘制工具
 * 协调基本图形和设备绘制
 */

import type { BaseObject, Point } from './types';
import { isDevice } from './objectHelpers';
import {
  drawRectangle,
  drawCircle,
  drawLine,
  drawPolygon,
  drawPoint
} from './drawShapes';
import {
  drawRadarDevice,
  drawSleepAideDevice,
  drawSensorDevice,
  drawGenericDevice
} from './drawDevices';

// ================ 绘制接口 ================
export interface DrawContext {
  ctx: CanvasRenderingContext2D;
  scale?: number;
  offset?: Point;
  showLabels?: boolean;  // 是否显示标签
}

// ================ 主绘制函数 ================
export function drawObject(obj: BaseObject, context: DrawContext): void {
  // 根据设备类别分发绘制
  if (isDevice(obj)) {
    // IoT设备：使用独立的设备绘制函数
    drawDeviceObject(obj, context);
  } else {
    // 家具/结构：使用基本图形绘制
    drawShapeObject(obj, context);
  }
  
  // 如果选中，绘制选中框
  if (obj.interactive?.selected) {
    drawSelectionBorder(obj, context);
  }
  
  // 显示对象名称（对于设备，在图标下方5px；对于其他对象，在左下角）
  if (obj.name) {
    if (isDevice(obj) && obj.geometry.type === 'point') {
      // 设备：在图标下方 5px（不使用 drawDeviceLabel，避免重复和黑边）
      drawObjectLabel(obj, context, true);
    } else {
      // 其他对象：在左下角
      drawObjectLabel(obj, context, false);
    }
  }
}

// 绘制对象名称标签（左下角，或设备图标下方）
function drawObjectLabel(obj: BaseObject, context: DrawContext, isDevice: boolean = false): void {
  const { ctx, scale = 1, offset = { x: 0, y: 0 } } = context;
  
  // 坐标转换辅助函数
  const toCanvasCoord = (p: Point): Point => ({
    x: offset.x + p.x * scale,
    y: offset.y + p.y * scale
  });
  
  let labelX = 0;
  let labelY = 0;
  
  // 计算标签位置
  switch (obj.geometry.type) {
    case 'point':
      // IoT设备：在图标下方（画布坐标）
      const pointPos = toCanvasCoord(obj.geometry.data);
      labelX = pointPos.x;
      // 设备图标大小约15px（画布坐标）
      // 雷达设备：图标下方 12px；其他设备：图标下方 5px
      const deviceIconHeight = 15; // 图标高度
      const deviceSpacing = (obj.typeName === 'Radar') ? 12 : 5; // 雷达12px，其他5px
      labelY = pointPos.y + (isDevice ? deviceIconHeight + deviceSpacing : 15);
      break;
      
    case 'line':
      // 线段：在起点或终点下方（选择Y值较大的点）
      const start = toCanvasCoord(obj.geometry.data.start);
      const end = toCanvasCoord(obj.geometry.data.end);
      labelX = start.y > end.y ? start.x : end.x;
      labelY = Math.max(start.y, end.y) + 15;
      break;
      
    case 'rectangle':
      // 矩形：在左下角顶点下方
      const vertices = obj.geometry.data.vertices.map(toCanvasCoord);
      if (vertices.length >= 4) {
        // 找到Y值最大的点（底部），如果有多个，选择X值最小的（左侧）
        let bottomLeft = vertices[0];
        for (const v of vertices) {
          if (v.y > bottomLeft.y || (v.y === bottomLeft.y && v.x < bottomLeft.x)) {
            bottomLeft = v;
          }
        }
        labelX = bottomLeft.x;
        labelY = bottomLeft.y + 15;
      }
      break;
      
    case 'circle':
      // 圆形：在圆心下方（底部）
      const center = toCanvasCoord(obj.geometry.data.center);
      const radius = obj.geometry.data.radius * scale;
      labelX = center.x;
      labelY = center.y + radius + 15;
      break;
      
    case 'sector':
      // 扇形：在底部弧线中点下方
      const sectorLeft = toCanvasCoord(obj.geometry.data.leftPoint);
      const sectorRight = toCanvasCoord(obj.geometry.data.rightPoint);
      // 找到底部（Y值最大的点）
      const bottomPoint = sectorLeft.y > sectorRight.y ? sectorLeft : sectorRight;
      labelX = bottomPoint.x;
      labelY = bottomPoint.y + 15;
      break;
      
    case 'polygon':
      // 多边形：在底部最左侧顶点下方
      const polyVertices = obj.geometry.data.vertices.map(toCanvasCoord);
      if (polyVertices.length > 0) {
        let bottomLeft = polyVertices[0];
        for (const v of polyVertices) {
          if (v.y > bottomLeft.y || (v.y === bottomLeft.y && v.x < bottomLeft.x)) {
            bottomLeft = v;
          }
        }
        labelX = bottomLeft.x;
        labelY = bottomLeft.y + 15;
      }
      break;
  }
  
  // 绘制文本标签
  if (labelX !== 0 || labelY !== 0) {
    ctx.save();
    // 已绑定对象使用绿色标签
    ctx.fillStyle = obj.bindedDeviceId ? '#52c41a' : '#333333';
    ctx.font = obj.bindedDeviceId ? 'bold 12px Arial' : '12px Arial';
    // 设备标签居中，其他对象左对齐
    ctx.textAlign = isDevice && obj.geometry.type === 'point' ? 'center' : 'left';
    ctx.textBaseline = 'top';
    
    ctx.fillText(obj.name, labelX, labelY);
    ctx.restore();
  }
}

// ================ 批量绘制函数（确保IoT设备在最上层） ================
/**
 * 绘制多个对象，确保IoT设备始终在最上层
 * @param objects 对象数组
 * @param context 绘制上下文
 */
export function drawObjects(objects: BaseObject[], context: DrawContext): void {
  // 分离IoT设备和其他对象
  const furnitureObjects: BaseObject[] = [];
  const iotDevices: BaseObject[] = [];
  
  objects.forEach(obj => {
    if (isDevice(obj)) {
      iotDevices.push(obj);
    } else {
      furnitureObjects.push(obj);
    }
  });
  
  // 先绘制家具/结构（底层）
  furnitureObjects.forEach(obj => {
    drawObject(obj, context);
  });
  
  // 再绘制IoT设备（顶层）
  iotDevices.forEach(obj => {
    drawObject(obj, context);
  });
}

// ================ IoT设备绘制 ================
function drawDeviceObject(obj: BaseObject, context: DrawContext): void {
  const { ctx, scale = 1, offset = { x: 0, y: 0 } } = context;
  
  // IoT设备必须是点类型
  if (obj.geometry.type !== 'point') {
    console.warn('Device should have point geometry');
    return;
  }
  
  // 转换设备位置到画布坐标
  const canvasPosition = {
    x: offset.x + obj.geometry.data.x * scale,
    y: offset.y + obj.geometry.data.y * scale
  };
  
  const { visual, device } = obj;
  
  // 根据设备类型调用对应的绘制函数
  switch (obj.typeName) {
    case 'Radar':
      const installModel = device.iot?.radar?.installModel || 'ceiling';
      // 如果有旋转角度，在调用绘制前应用旋转变换
      if (obj.angle && obj.angle !== 0) {
        ctx.save();
        ctx.translate(canvasPosition.x, canvasPosition.y);
        // Canvas的rotate是顺时针，所以需要取负值来转换为逆时针
        // 用户要求角度是逆时针360度值，所以直接使用负值
        ctx.rotate(-(obj.angle * Math.PI) / 180);
        ctx.translate(-canvasPosition.x, -canvasPosition.y);
        drawRadarDevice(ctx, canvasPosition, visual, installModel);
        ctx.restore();
      } else {
        drawRadarDevice(ctx, canvasPosition, visual, installModel);
      }
      break;
      
    case 'Sleepad':
      drawSleepAideDevice(ctx, canvasPosition, visual);
      break;
      
    case 'Sensor':
      const sensorType = device.iot?.sensor?.sensorType || 'motion';
      drawSensorDevice(ctx, canvasPosition, visual, sensorType);
      break;
      
    default:
      drawGenericDevice(ctx, canvasPosition, visual, obj.typeName.substring(0, 2));
  }
}

// ================ 家具/结构绘制（使用基本图形） ================
function drawShapeObject(obj: BaseObject, context: DrawContext): void {
  const { ctx, scale = 1, offset = { x: 0, y: 0 } } = context;
  const { visual } = obj;
  
  // 坐标转换辅助函数
  const toCanvasCoord = (p: Point): Point => ({
    x: offset.x + p.x * scale,
    y: offset.y + p.y * scale
  });
  
  // 如果有旋转角度，应用旋转变换
  const rotationAngle = obj.angle || 0;
  if (rotationAngle !== 0) {
    // 计算对象的中心点用于旋转
    let centerX = 0, centerY = 0;
    switch (obj.geometry.type) {
      case 'line':
        const start = toCanvasCoord(obj.geometry.data.start);
        const end = toCanvasCoord(obj.geometry.data.end);
        centerX = (start.x + end.x) / 2;
        centerY = (start.y + end.y) / 2;
        break;
      case 'rectangle':
        const vertices = obj.geometry.data.vertices.map(toCanvasCoord);
        if (vertices.length >= 4) {
          centerX = (vertices[0].x + vertices[1].x + vertices[2].x + vertices[3].x) / 4;
          centerY = (vertices[0].y + vertices[1].y + vertices[2].y + vertices[3].y) / 4;
        }
        break;
      case 'circle':
      case 'sector':
        const center = toCanvasCoord(obj.geometry.data.center);
        centerX = center.x;
        centerY = center.y;
        break;
    }
    
    if (centerX !== 0 || centerY !== 0) {
      ctx.save();
      ctx.translate(centerX, centerY);
      // Canvas的rotate是顺时针，所以需要取负值来转换为逆时针
      // 但用户要求角度是逆时针360度值，所以直接使用负值
      ctx.rotate(-(rotationAngle * Math.PI) / 180); // 负号表示逆时针为正
      ctx.translate(-centerX, -centerY);
    }
  }
  
  // 根据几何形状调用基本图形绘制函数
  switch (obj.geometry.type) {
    case 'rectangle':
      const rectVertices = obj.geometry.data.vertices.map(toCanvasCoord);
      drawRectangle(ctx, rectVertices as [Point, Point, Point, Point], {
        fillColor: visual.color,
        strokeColor: '#999999',  // 家具默认灰色边框
        lineWidth: 2,
        strokeOnly: visual.transparent  // 透明模式仅描边
      });
      break;
      
    case 'circle':
      drawCircle(
        ctx, 
        toCanvasCoord(obj.geometry.data.center), 
        obj.geometry.data.radius * scale, 
        {
          fillColor: visual.color,
          strokeColor: '#999999',  // 家具默认灰色边框
          lineWidth: 2,
          strokeOnly: visual.transparent
        }
      );
      break;
      
    case 'line':
      drawLine(
        ctx, 
        toCanvasCoord(obj.geometry.data.start), 
        toCanvasCoord(obj.geometry.data.end), 
        {
          strokeColor: visual.color,
          lineWidth: obj.geometry.data.thickness * scale
        }
      );
      break;
      
    case 'polygon':
      const polyVertices = obj.geometry.data.vertices.map(toCanvasCoord);
      drawPolygon(ctx, polyVertices, {
        fillColor: visual.color,
        strokeColor: visual.color,
        lineWidth: 2,
        strokeOnly: visual.transparent
      });
      break;
    
    case 'sector':
      // 扇形需要特殊处理
      // 注意：扇形的旋转已经在上面通过ctx.rotate处理了
      // 这里需要基于原始几何数据计算角度，旋转会在ctx变换中应用
      const { center, leftPoint, rightPoint, radius } = obj.geometry.data;
      const canvasCenter = toCanvasCoord(center);
      const canvasLeft = toCanvasCoord(leftPoint);
      const canvasRight = toCanvasCoord(rightPoint);
      
      // 计算角度和半径
      const startAngle = Math.atan2(canvasLeft.y - canvasCenter.y, canvasLeft.x - canvasCenter.x);
      const endAngle = Math.atan2(canvasRight.y - canvasCenter.y, canvasRight.x - canvasCenter.x);
      const canvasRadius = radius ? radius * scale : Math.sqrt(
        Math.pow(canvasLeft.x - canvasCenter.x, 2) + Math.pow(canvasLeft.y - canvasCenter.y, 2)
      );
      
      ctx.beginPath();
      ctx.moveTo(canvasCenter.x, canvasCenter.y);
      ctx.arc(canvasCenter.x, canvasCenter.y, canvasRadius, startAngle, endAngle);
      ctx.closePath();
      
      if (!visual.transparent) {
        ctx.fillStyle = visual.color;
        ctx.fill();
      }
      ctx.strokeStyle = visual.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
      
    case 'point':
      // 如果非设备物体意外使用了point类型，绘制一个小圆点
      drawPoint(ctx, toCanvasCoord(obj.geometry.data), 5, {
        fillColor: visual.color,
        strokeColor: visual.color
      });
      break;
  }
  
  // 如果有旋转，恢复变换
  if (rotationAngle !== 0) {
    ctx.restore();
  }
}

// ================ 选中框绘制 ================
function drawSelectionBorder(obj: BaseObject, context: DrawContext): void {
  const { ctx, scale = 1, offset = { x: 0, y: 0 } } = context;
  
  // 坐标转换辅助函数
  const toCanvasCoord = (p: Point): Point => ({
    x: offset.x + p.x * scale,
    y: offset.y + p.y * scale
  });
  
  // 如果有旋转角度，需要应用旋转来绘制选中框和控制点
  const rotationAngle = obj.angle || 0;
  let rotationCenterX = 0, rotationCenterY = 0;
  
  // 计算旋转中心
  if (rotationAngle !== 0) {
    switch (obj.geometry.type) {
      case 'line':
        const start = toCanvasCoord(obj.geometry.data.start);
        const end = toCanvasCoord(obj.geometry.data.end);
        rotationCenterX = (start.x + end.x) / 2;
        rotationCenterY = (start.y + end.y) / 2;
        break;
      case 'rectangle':
        const vertices = obj.geometry.data.vertices.map(toCanvasCoord);
        if (vertices.length >= 4) {
          rotationCenterX = (vertices[0].x + vertices[1].x + vertices[2].x + vertices[3].x) / 4;
          rotationCenterY = (vertices[0].y + vertices[1].y + vertices[2].y + vertices[3].y) / 4;
        }
        break;
      case 'circle':
      case 'sector':
        const center = toCanvasCoord(obj.geometry.data.center);
        rotationCenterX = center.x;
        rotationCenterY = center.y;
        break;
      case 'point':
        const pointPos = toCanvasCoord(obj.geometry.data);
        rotationCenterX = pointPos.x;
        rotationCenterY = pointPos.y;
        break;
    }
    
    if (rotationCenterX !== 0 || rotationCenterY !== 0) {
      ctx.save();
      ctx.translate(rotationCenterX, rotationCenterY);
      ctx.rotate(-(rotationAngle * Math.PI) / 180); // 负号表示逆时针为正
      ctx.translate(-rotationCenterX, -rotationCenterY);
    }
  }
  
  // 统一样式：蓝色虚线边框
  ctx.save();
  ctx.strokeStyle = '#1890ff'; // 蓝色
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]); // 虚线
  
  // 根据几何类型绘制选中框
  if (isDevice(obj) && obj.geometry.type === 'point') {
    // IoT设备：绘制圆形选中框
    const canvasPos = toCanvasCoord(obj.geometry.data);
    ctx.beginPath();
    ctx.arc(canvasPos.x, canvasPos.y, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore(); // 恢复虚线设置
    
    // 绘制控制点（圆心）
    drawControlPoint(ctx, canvasPos.x, canvasPos.y);
    
    // 如果有旋转，恢复旋转变换
    if (rotationAngle !== 0 && (rotationCenterX !== 0 || rotationCenterY !== 0)) {
      ctx.restore(); // 恢复旋转变换
    }
    return;
  } else if (obj.geometry.type === 'line') {
    // 线段：绘制虚线
    const start = toCanvasCoord(obj.geometry.data.start);
    const end = toCanvasCoord(obj.geometry.data.end);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.restore(); // 恢复虚线设置
    
    // 绘制控制点（两端点）
    drawControlPoint(ctx, start.x, start.y);
    drawControlPoint(ctx, end.x, end.y);
    
    // 如果有旋转，恢复旋转变换
    if (rotationAngle !== 0 && (rotationCenterX !== 0 || rotationCenterY !== 0)) {
      ctx.restore(); // 恢复旋转变换
    }
    return;
  } else if (obj.geometry.type === 'rectangle') {
    // 矩形：绘制虚线矩形（不绘制对角线）
    // 顶点顺序：[右上, 左上, 右下, 左下] = [vertices[0], vertices[1], vertices[2], vertices[3]]
    const vertices = obj.geometry.data.vertices.map(toCanvasCoord);
    ctx.beginPath();
    // 按照矩形边的顺序绘制：上边 -> 左边 -> 下边 -> 右边
    ctx.moveTo(vertices[0].x, vertices[0].y);  // 右上
    ctx.lineTo(vertices[1].x, vertices[1].y);  // 右上 -> 左上（上边）
    ctx.lineTo(vertices[3].x, vertices[3].y);  // 左上 -> 左下（左边）
    ctx.lineTo(vertices[2].x, vertices[2].y);  // 左下 -> 右下（下边）
    ctx.lineTo(vertices[0].x, vertices[0].y);  // 右下 -> 右上（右边，显式闭合）
    ctx.stroke();
    ctx.restore(); // 恢复虚线设置
    
    // 绘制控制点（左上、右下顶点）
    drawControlPoint(ctx, vertices[0].x, vertices[0].y); // 左上
    drawControlPoint(ctx, vertices[3].x, vertices[3].y); // 右下
    
    // 如果有旋转，恢复旋转变换
    if (rotationAngle !== 0 && (rotationCenterX !== 0 || rotationCenterY !== 0)) {
      ctx.restore(); // 恢复旋转变换
    }
    return;
  } else if (obj.geometry.type === 'circle') {
    // 圆形：绘制虚线圆
    const center = toCanvasCoord(obj.geometry.data.center);
    const radius = obj.geometry.data.radius * scale;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore(); // 恢复虚线设置
    
    // 绘制控制点（圆心 + 4个方向的半径控制点）
    // 由于旋转变换已经应用，控制点会自然跟随旋转
    drawControlPoint(ctx, center.x, center.y); // 圆心
    drawControlPoint(ctx, center.x, center.y - radius); // 上
    drawControlPoint(ctx, center.x, center.y + radius); // 下
    drawControlPoint(ctx, center.x - radius, center.y); // 左
    drawControlPoint(ctx, center.x + radius, center.y); // 右
    
    // 如果有旋转，恢复旋转变换
    if (rotationAngle !== 0 && (rotationCenterX !== 0 || rotationCenterY !== 0)) {
      ctx.restore(); // 恢复旋转变换
    }
    return;
  } else if (obj.geometry.type === 'sector') {
    // 扇形：绘制虚线扇形
    const { center, leftPoint, rightPoint, radius } = obj.geometry.data;
    const canvasCenter = toCanvasCoord(center);
    const canvasLeft = toCanvasCoord(leftPoint);
    const canvasRight = toCanvasCoord(rightPoint);
    
    const startAngle = Math.atan2(canvasLeft.y - canvasCenter.y, canvasLeft.x - canvasCenter.x);
    const endAngle = Math.atan2(canvasRight.y - canvasCenter.y, canvasRight.x - canvasCenter.x);
    const canvasRadius = radius ? radius * scale : Math.sqrt(
      Math.pow(canvasLeft.x - canvasCenter.x, 2) + Math.pow(canvasLeft.y - canvasCenter.y, 2)
    );
    
    ctx.beginPath();
    ctx.moveTo(canvasCenter.x, canvasCenter.y);
    ctx.arc(canvasCenter.x, canvasCenter.y, canvasRadius, startAngle, endAngle);
    ctx.closePath();
    ctx.stroke();
    ctx.restore(); // 恢复虚线设置
    
    // 绘制控制点（圆心 + 两个弧线端点）
    drawControlPoint(ctx, canvasCenter.x, canvasCenter.y); // 圆心
    drawControlPoint(ctx, canvasLeft.x, canvasLeft.y);     // 左端点
    drawControlPoint(ctx, canvasRight.x, canvasRight.y);   // 右端点
    
    // 如果有旋转，恢复旋转变换
    if (rotationAngle !== 0 && (rotationCenterX !== 0 || rotationCenterY !== 0)) {
      ctx.restore(); // 恢复旋转变换
    }
    return;
  } else if (obj.geometry.type === 'polygon') {
    // 多边形：绘制虚线
    const vertices = obj.geometry.data.vertices.map(toCanvasCoord);
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore(); // 恢复虚线设置
    
    // 绘制控制点（所有顶点）
    vertices.forEach(v => drawControlPoint(ctx, v.x, v.y));
    
    // 如果有旋转，恢复旋转变换
    if (rotationAngle !== 0 && (rotationCenterX !== 0 || rotationCenterY !== 0)) {
      ctx.restore(); // 恢复旋转变换
    }
    return;
  }
  
  ctx.restore(); // 恢复虚线设置
  
  // 如果有旋转，恢复旋转变换
  if (rotationAngle !== 0 && (rotationCenterX !== 0 || rotationCenterY !== 0)) {
    ctx.restore(); // 恢复旋转变换
  }
}

// 绘制单个控制点（蓝色圆点）
function drawControlPoint(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.setLineDash([]); // 实线
  
  // 外圈 - 蓝色
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#1890ff';
  ctx.fill();
  
  // 内圈 - 白色
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  
  ctx.restore();
}

// ================ 编辑控制点绘制 ================
export function drawControlPoints(obj: BaseObject, context: DrawContext): void {
  if (!obj.interactive?.selected || obj.interactive?.locked) {
    return;
  }
  
  const { ctx } = context;
  const controlPointSize = 4;
  
  // 根据几何类型绘制控制点
  if (obj.geometry.type === 'rectangle') {
    obj.geometry.data.vertices.forEach(vertex => {
      drawPoint(ctx, vertex, controlPointSize, {
        fillColor: '#00aaff',
        strokeColor: '#ffffff',
        lineWidth: 1
      });
    });
  } else if (obj.geometry.type === 'circle') {
    const { center, radius } = obj.geometry.data;
    // 圆心
    drawPoint(ctx, center, controlPointSize, {
      fillColor: '#00aaff',
      strokeColor: '#ffffff',
      lineWidth: 1
    });
    // 半径控制点（4个方向）
    drawPoint(ctx, { x: center.x + radius, y: center.y }, controlPointSize, {
      fillColor: '#00aaff',
      strokeColor: '#ffffff',
      lineWidth: 1
    });
    drawPoint(ctx, { x: center.x - radius, y: center.y }, controlPointSize, {
      fillColor: '#00aaff',
      strokeColor: '#ffffff',
      lineWidth: 1
    });
    drawPoint(ctx, { x: center.x, y: center.y + radius }, controlPointSize, {
      fillColor: '#00aaff',
      strokeColor: '#ffffff',
      lineWidth: 1
    });
    drawPoint(ctx, { x: center.x, y: center.y - radius }, controlPointSize, {
      fillColor: '#00aaff',
      strokeColor: '#ffffff',
      lineWidth: 1
    });
  } else if (obj.geometry.type === 'polygon') {
    obj.geometry.data.vertices.forEach(vertex => {
      drawPoint(ctx, vertex, controlPointSize, {
        fillColor: '#00aaff',
        strokeColor: '#ffffff',
        lineWidth: 1
      });
    });
  }
}

