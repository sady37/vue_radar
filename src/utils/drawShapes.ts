/**
 * 基本几何图形绘制
 * 底层绘制函数，不关心业务逻辑，只负责绘制形状
 */

import type { Point, Circle, Line, Rectangle, Polygon, Sector } from './types';

export interface ShapeStyle {
  fillColor?: string;      // 填充颜色
  strokeColor?: string;    // 边框颜色
  lineWidth?: number;      // 线宽
  fillOnly?: boolean;      // 仅填充
  strokeOnly?: boolean;    // 仅描边
  opacity?: number;        // 透明度 0-1
}

// ================ 矩形绘制 ================
export function drawRectangle(
  ctx: CanvasRenderingContext2D,
  vertices: [Point, Point, Point, Point],
  style: ShapeStyle = {}
): void {
  const {
    fillColor = '#000000', // 填充颜色
    strokeColor = '#000000', // 边框颜色
    lineWidth = 1, // 线宽
    fillOnly = false, // 仅填充
    strokeOnly = false, // 仅描边
    opacity = 1  // 透明度 0-1
  } = style;

  ctx.save();
  ctx.globalAlpha = opacity;
  
  // 矩形顶点顺序：[右上, 左上, 右下, 左下]
  // p1=右上, p2=左上, p3=右下, p4=左下
  const [p1, p2, p3, p4] = vertices;
  
  // 按照矩形边的顺序绘制：上边 -> 左边 -> 下边 -> 右边
  // 不绘制对角线，只绘制四条边
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);  // 起点：右上
  ctx.lineTo(p2.x, p2.y);  // 上边：右上 -> 左上
  ctx.lineTo(p4.x, p4.y);  // 左边：左上 -> 左下
  ctx.lineTo(p3.x, p3.y);  // 下边：左下 -> 右下
  ctx.lineTo(p1.x, p1.y);  // 右边：右下 -> 右上（显式闭合，不依赖closePath避免对角线）
  
  if (!strokeOnly) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  
  if (!fillOnly) {
    // 重新绘制路径用于描边，确保只绘制边框，不绘制对角线
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);  // 上边
    ctx.lineTo(p4.x, p4.y);  // 左边
    ctx.lineTo(p3.x, p3.y);  // 下边
    ctx.lineTo(p1.x, p1.y);  // 右边（显式闭合）
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  
  ctx.restore();
}

// ================ 圆形绘制 ================
export function drawCircle(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  style: ShapeStyle = {}
): void {
  const {
    fillColor = '#000000',
    strokeColor = '#000000',
    lineWidth = 1,
    fillOnly = false,
    strokeOnly = false,
    opacity = 1
  } = style;

  ctx.save();
  ctx.globalAlpha = opacity;
  
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.closePath();
  
  if (!strokeOnly) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  
  if (!fillOnly) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  
  ctx.restore();
}

// ================ 线段绘制 ================
export function drawLine(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  style: ShapeStyle = {}
): void {
  const {
    strokeColor = '#000000',
    lineWidth = 1,
    opacity = 1
  } = style;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  
  ctx.restore();
}

// ================ 多边形绘制 ================
export function drawPolygon(
  ctx: CanvasRenderingContext2D,
  vertices: Point[],
  style: ShapeStyle = {}
): void {
  if (vertices.length < 3) return;

  const {
    fillColor = '#000000',
    strokeColor = '#000000',
    lineWidth = 1,
    fillOnly = false,
    strokeOnly = false,
    opacity = 1
  } = style;

  ctx.save();
  ctx.globalAlpha = opacity;
  
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  
  for (let i = 1; i < vertices.length; i++) {
    ctx.lineTo(vertices[i].x, vertices[i].y);
  }
  
  ctx.closePath();
  
  if (!strokeOnly) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  
  if (!fillOnly) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  
  ctx.restore();
}

// ================ 扇形绘制 ================
export function drawSector(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  startAngle: number,  // 起始角度（弧度）
  endAngle: number,    // 结束角度（弧度）
  style: ShapeStyle = {}
): void {
  const {
    fillColor = '#000000',
    strokeColor = '#000000',
    lineWidth = 1,
    fillOnly = false,
    strokeOnly = false,
    opacity = 1
  } = style;

  ctx.save();
  ctx.globalAlpha = opacity;
  
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.arc(center.x, center.y, radius, startAngle, endAngle);
  ctx.closePath();
  
  if (!strokeOnly) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  
  if (!fillOnly) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  
  ctx.restore();
}

// ================ 辅助函数：根据两点计算扇形 ================
export function drawSectorByPoints(
  ctx: CanvasRenderingContext2D,
  sector: Sector,
  style: ShapeStyle = {}
): void {
  const { center, leftPoint, rightPoint, radius } = sector;
  
  // 计算半径（如果未提供）
  const r = radius || Math.sqrt(
    Math.pow(leftPoint.x - center.x, 2) + Math.pow(leftPoint.y - center.y, 2)
  );
  
  // 计算角度
  const startAngle = Math.atan2(leftPoint.y - center.y, leftPoint.x - center.x);
  const endAngle = Math.atan2(rightPoint.y - center.y, rightPoint.x - center.x);
  
  drawSector(ctx, center, r, startAngle, endAngle, style);
}

// ================ 点绘制（用于标记位置） ================
export function drawPoint(
  ctx: CanvasRenderingContext2D,
  point: Point,
  size: number = 5,
  style: ShapeStyle = {}
): void {
  drawCircle(ctx, point, size, style);
}

// ================ 虚线矩形（用于选中框） ================
export function drawDashedRectangle(
  ctx: CanvasRenderingContext2D,
  vertices: [Point, Point, Point, Point],
  style: ShapeStyle = {}
): void {
  const {
    strokeColor = '#00aaff',
    lineWidth = 2
  } = style;

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([5, 5]);
  
  const [p1, p2, p3, p4] = vertices;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.closePath();
  ctx.stroke();
  
  ctx.restore();
}

// ================ 虚线圆（用于选中框） ================
export function drawDashedCircle(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  style: ShapeStyle = {}
): void {
  const {
    strokeColor = '#00aaff',
    lineWidth = 2
  } = style;

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([5, 5]);
  
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.restore();
}

