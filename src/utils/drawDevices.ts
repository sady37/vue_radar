/**
 * IoT设备绘制
 * 独立的设备绘制函数，使用预设尺寸
 * 可以调用基本图形函数，但参数是预设的
 */

import type { BaseObject, Point } from './types';
import { drawPolygon } from './drawShapes';

// ================ 雷达设备绘制 ================
/**
 * 绘制雷达设备（不处理旋转，旋转由上层处理）
 * @param ctx Canvas上下文
 * @param position 雷达位置
 * @param visual 视觉属性
 * @param installModel 安装模式
 */
export function drawRadarDevice(
  ctx: CanvasRenderingContext2D,
  position: Point,
  visual: BaseObject['visual'],
  installModel: 'ceiling' | 'wall' | 'corn' = 'ceiling'
): void {
  const scale = 1; // 缩放比例（可以后续调整）
  
  ctx.save();
  
  // 移动到雷达位置，以雷达位置为原点绘制
  ctx.translate(position.x, position.y);
  
  if (installModel === 'ceiling') {
    // ================ Ceiling 模式 ================
    // 参考之前的实现：3个同心圆 + 坐标线 + LED指示器
    
    // 1. 绘制坐标线
    ctx.beginPath();
    ctx.strokeStyle = 'rgb(113, 128, 150)';
    ctx.lineWidth = 0.2;
    // H轴 (左正右负)
    ctx.moveTo(15 * scale, 0);
    ctx.lineTo(-15 * scale, 0);
    // V轴
    ctx.moveTo(0, -15 * scale);
    ctx.lineTo(0, 15 * scale);
    ctx.stroke();
    
    // 2. 绘制3个同心圆（外、中、内）
    // 外圈
    ctx.beginPath();
    ctx.arc(0, 0, 15 * scale, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(190, 227, 248, 0.5)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(144, 205, 244, 0.5)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    
    // 中圈
    ctx.beginPath();
    ctx.arc(0, 0, 10 * scale, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(99, 179, 237, 0.5)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(66, 153, 225, 0.5)';
    ctx.stroke();
  
    // 内圈
    ctx.beginPath();
    ctx.arc(0, 0, 5 * scale, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(49, 130, 206, 0.5)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(43, 108, 176, 0.5)';
    ctx.stroke();
    
    // 3. LED指示器（绿色矩形，在+V方向，增大40%）
    const indicatorY = 17;
    const ledWidth = 5 * 1.4 * scale;   // 增大40%
    const ledHeight = 1.5 * 1.4 * scale; // 增大40%
    ctx.beginPath();
    ctx.fillStyle = 'rgb(116, 199, 151)';
    ctx.strokeStyle = 'rgb(47, 133, 90)';
    ctx.lineWidth = 0.5;
    ctx.rect(-ledWidth / 2, (indicatorY - ledHeight / 2) * scale, ledWidth, ledHeight);
    ctx.fill();
    ctx.stroke();
  
    // 4. 模式标识
    ctx.fillStyle = 'rgb(74, 85, 104)';
    ctx.font = `${8 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C', 0, (indicatorY + 8) * scale);
    
  } else if (installModel === 'wall') {
    // ================ Wall 模式 ================
    // 与Ceiling类似，但从圆形改为140度扇形
    // 沿Y轴向下对称，左右各70度
    
    const halfAngle = (70 * Math.PI) / 180; // 70度
    const centerAngle = Math.PI / 2; // 90度，Y轴向下方向
    const startAngle = centerAngle - halfAngle; // 90° - 70° = 20°
    const endAngle = centerAngle + halfAngle;   // 90° + 70° = 160°
    
    // 1. 绘制坐标线（只显示H轴，不显示V轴）
    ctx.beginPath();
    ctx.strokeStyle = 'rgb(113, 128, 150)';
    ctx.lineWidth = 0.2;
    // H轴 (左正右负)
    ctx.moveTo(15 * scale, 0);
    ctx.lineTo(-15 * scale, 0);
    // Wall模式不显示V轴
    ctx.stroke();
    
    // 2. 绘制3个同心扇形（外、中、内）
    // 外扇形
    ctx.beginPath();
    ctx.arc(0, 0, 15 * scale, startAngle, endAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(190, 227, 248, 0.5)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(144, 205, 244, 0.5)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    
    // 中扇形
    ctx.beginPath();
    ctx.arc(0, 0, 10 * scale, startAngle, endAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(99, 179, 237, 0.5)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(66, 153, 225, 0.5)';
    ctx.stroke();
    
    // 内扇形
    ctx.beginPath();
    ctx.arc(0, 0, 5 * scale, startAngle, endAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(49, 130, 206, 0.5)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(43, 108, 176, 0.5)';
    ctx.stroke();
    
    // 3. LED指示器（绿色矩形，在圆心上方4px）
    const indicatorY = -4; // 圆心上方 4px
    const ledWidth = 5 * 1.4 * scale;
    const ledHeight = 1.5 * 1.4 * scale;
    ctx.beginPath();
    ctx.fillStyle = 'rgb(116, 199, 151)';
    ctx.strokeStyle = 'rgb(47, 133, 90)';
    ctx.lineWidth = 0.5;
    ctx.rect(-ledWidth / 2, (indicatorY - ledHeight / 2) * scale, ledWidth, ledHeight);
    ctx.fill();
    ctx.stroke();
    
    // 4. 模式标识
    ctx.fillStyle = 'rgb(74, 85, 104)';
    ctx.font = `${8 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('W', 0, (indicatorY - 8) * scale);
    
  } else {
    // ================ Corn 模式 ================
    // 与Ceiling类似，但从圆形改为90度扇形
    // 沿Y轴向下对称，左右各45度
    
    const halfAngle = (45 * Math.PI) / 180; // 45度
    const centerAngle = Math.PI / 2; // 90度，Y轴向下方向
    const startAngle = centerAngle - halfAngle; // 90° - 45° = 45°
    const endAngle = centerAngle + halfAngle;   // 90° + 45° = 135°
    
    // 1. 绘制坐标线（只显示H轴，不显示V轴）
    ctx.beginPath();
    ctx.strokeStyle = 'rgb(113, 128, 150)';
    ctx.lineWidth = 0.2;
    // H轴 (左正右负)
    ctx.moveTo(15 * scale, 0);
    ctx.lineTo(-15 * scale, 0);
    // Corn模式不显示V轴
    ctx.stroke();
    
    // 2. 绘制3个同心扇形（外、中、内）
    // 外扇形
    ctx.beginPath();
    ctx.arc(0, 0, 15 * scale, startAngle, endAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(190, 227, 248, 0.5)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(144, 205, 244, 0.5)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    
    // 中扇形
    ctx.beginPath();
    ctx.arc(0, 0, 10 * scale, startAngle, endAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(99, 179, 237, 0.5)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(66, 153, 225, 0.5)';
    ctx.stroke();
    
    // 内扇形
    ctx.beginPath();
    ctx.arc(0, 0, 5 * scale, startAngle, endAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(49, 130, 206, 0.5)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(43, 108, 176, 0.5)';
    ctx.stroke();
    
    // 3. LED指示器（绿色矩形，在圆心上方4px）
    const indicatorY = -4; // 圆心上方 4px
    const ledWidth = 5 * 1.4 * scale;
    const ledHeight = 1.5 * 1.4 * scale;
    ctx.beginPath();
    ctx.fillStyle = 'rgb(116, 199, 151)';
    ctx.strokeStyle = 'rgb(47, 133, 90)';
    ctx.lineWidth = 0.5;
    ctx.rect(-ledWidth / 2, (indicatorY - ledHeight / 2) * scale, ledWidth, ledHeight);
    ctx.fill();
    ctx.stroke();
    
    // 4. 模式标识
    ctx.fillStyle = 'rgb(74, 85, 104)';
    ctx.font = `${8 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Co', 0, (indicatorY - 8) * scale);
  }
  
  ctx.restore();
}

// ================ Sleepad设备绘制 ================
export function drawSleepAideDevice(
  ctx: CanvasRenderingContext2D,
  position: Point,
  visual: BaseObject['visual']
): void {
  const baseScale = 3;  // 放大3倍
  const length = 12 * baseScale;  // 长度
  const width = 6 * baseScale;    // 宽度
  const scale = 1;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // 绘制矩形边框（只有边框，无底色）
  ctx.beginPath();
  ctx.rect(-length / 2 * scale, -width / 2 * scale, length * scale, width * scale);
  ctx.strokeStyle = visual.color;
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // 绘制3个绿色圆形，中心平均分布
  const circleRadius = 1 * baseScale * scale;
  const spacing = length / 4; // 平均分成4段，3个圆在3个位置
  
  ctx.fillStyle = '#00ff00'; // 绿色
  
  // 左边圆
  ctx.beginPath();
  ctx.arc(-spacing * scale, 0, circleRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // 中间圆
  ctx.beginPath();
  ctx.arc(0, 0, circleRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // 右边圆
    ctx.beginPath();
  ctx.arc(spacing * scale, 0, circleRadius, 0, Math.PI * 2);
  ctx.fill();
  
    ctx.restore();
}

// ================ 传感器设备绘制 ================
export function drawSensorDevice(
  ctx: CanvasRenderingContext2D,
  position: Point,
  visual: BaseObject['visual'],
  sensorType: 'motion' | 'temperature' | 'humidity' = 'motion'
): void {
  const size = 12; // 预设大小
  
  // 使用菱形表示传感器
  const vertices: Point[] = [
    { x: position.x, y: position.y - size },       // 上
    { x: position.x + size, y: position.y },       // 右
    { x: position.x, y: position.y + size },       // 下
    { x: position.x - size, y: position.y }        // 左
  ];
  
  drawPolygon(ctx, vertices, {
    fillColor: visual.color,
    strokeColor: visual.color,
    lineWidth: 2,
    strokeOnly: visual.transparent
  });
  
  // 根据传感器类型绘制图标
  ctx.save();
  ctx.fillStyle = visual.transparent ? visual.color : '#ffffff';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const icon = sensorType === 'motion' ? 'M' : 
               sensorType === 'temperature' ? 'T' : 'H';
  ctx.fillText(icon, position.x, position.y);
  
  ctx.restore();
}

// ================ 通用IoT设备绘制（其他类型） ================
export function drawGenericDevice(
  ctx: CanvasRenderingContext2D,
  position: Point,
  visual: BaseObject['visual'],
  label?: string
): void {
  const size = 15; // 预设大小
  const scale = 1;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // 使用矩形
  ctx.beginPath();
  ctx.rect(-size * scale, -size * scale, size * 2 * scale, size * 2 * scale);
  ctx.fillStyle = visual.transparent ? 'transparent' : visual.color;
  ctx.fill();
  ctx.strokeStyle = visual.color;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // 绘制标签
  if (label && !visual.transparent) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);
  }
  
  ctx.restore();
}

// ================ 设备选中框 ================
export function drawDeviceSelectionBox(
  ctx: CanvasRenderingContext2D,
  position: Point,
  size: number = 30
): void {
  ctx.save();
  ctx.strokeStyle = '#00aaff';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  
  ctx.strokeRect(
    position.x - size,
    position.y - size,
    size * 2,
    size * 2
  );
  
  ctx.restore();
}

// ================ 设备名称标签 ================
export function drawDeviceLabel(
  ctx: CanvasRenderingContext2D,
  position: Point,
  label: string,
  offsetY: number = 25
): void {
  ctx.save();
  
  // 背景
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  const textWidth = ctx.measureText(label).width;
  ctx.fillRect(
    position.x - textWidth / 2 - 4,
    position.y + offsetY - 10,
    textWidth + 8,
    16
  );
  
  // 文字
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, position.x, position.y + offsetY);
  
  ctx.restore();
}

