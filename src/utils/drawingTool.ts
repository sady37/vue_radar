/**
 * 交互式绘图工具
 * 处理鼠标交互，创建几何图形
 */

import type { Point, Rectangle, Circle, Line, Sector } from './types';

// ================ 绘图结果类型 ================
export interface RectangleDrawResult {
  type: 'rectangle';
  vertices: [Point, Point, Point, Point];  // 4个顶点：右上、左上、右下、左下
  width: number;      // 宽度
  height: number;     // 高度
  center: Point;      // 中心点
}

export interface CircleDrawResult {
  type: 'circle';
  center: Point;      // 圆心
  radius: number;     // 半径
}

export interface LineDrawResult {
  type: 'line';
  start: Point;       // 起点
  end: Point;         // 终点
  length: number;     // 长度
  center: Point;      // 中心点
}

export interface SectorDrawResult {
  type: 'sector';
  center: Point;      // 圆心
  leftPoint: Point;   // 左边界点
  rightPoint: Point;  // 右边界点
  radius: number;     // 半径
  angle: number;      // 弧度（radians）
  angleDegrees: number; // 角度（degrees）
}

export type DrawResult = RectangleDrawResult | CircleDrawResult | LineDrawResult | SectorDrawResult;

// ================ 绘图工具类 ================
export class DrawingTool {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isDrawing: boolean = false;
  private drawingMode: 'rectangle' | 'circle' | 'line' | 'sector' | null = null;
  
  // 绘图状态
  private startPoint: Point | null = null;
  private currentPoint: Point | null = null;
  private sectorFirstPoint: Point | null = null;  // 扇形的第一个边界点
  
  // 回调函数
  private onComplete: ((result: DrawResult) => void) | null = null;
  private onDrawing: ((result: DrawResult) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.setupEventListeners();
  }

  // ================ 设置绘图模式 ================
  setMode(mode: 'rectangle' | 'circle' | 'line' | 'sector' | null): void {
    this.drawingMode = mode;
    this.reset();
  }

  // ================ 设置回调 ================
  onDrawComplete(callback: (result: DrawResult) => void): void {
    this.onComplete = callback;
  }

  onDrawingUpdate(callback: (result: DrawResult) => void): void {
    this.onDrawing = callback;
  }

  // ================ 事件监听 ================
  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }

  private getMousePos(event: MouseEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  // ================ 鼠标事件处理 ================
  private handleMouseDown(event: MouseEvent): void {
    if (!this.drawingMode) return;

    const point = this.getMousePos(event);

    if (this.drawingMode === 'sector' && this.startPoint && !this.sectorFirstPoint) {
      // 扇形第二步：确定第一条边
      this.sectorFirstPoint = point;
      this.isDrawing = true;
    } else {
      // 所有图形的第一步：记录起点
      this.startPoint = point;
      this.isDrawing = true;
      
      if (this.drawingMode === 'sector') {
        this.sectorFirstPoint = null;  // 重置扇形状态
      }
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isDrawing || !this.startPoint) return;

    this.currentPoint = this.getMousePos(event);

    // 实时预览
    const result = this.calculateResult();
    if (result && this.onDrawing) {
      this.onDrawing(result);
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (!this.isDrawing || !this.startPoint) return;

    this.currentPoint = this.getMousePos(event);

    // 扇形需要三次点击，所以第二次mouseup不结束
    if (this.drawingMode === 'sector' && this.sectorFirstPoint) {
      const result = this.calculateResult();
      if (result && this.onComplete) {
        this.onComplete(result);
      }
      this.reset();
    } else if (this.drawingMode !== 'sector') {
      // 其他图形直接完成
      const result = this.calculateResult();
      if (result && this.onComplete) {
        this.onComplete(result);
      }
      this.reset();
    } else {
      // 扇形第一步完成，等待第二步
      this.isDrawing = false;
    }
  }

  private handleMouseLeave(event: MouseEvent): void {
    if (this.isDrawing && this.drawingMode !== 'sector') {
      // 非扇形模式下，鼠标离开画布则取消
      this.reset();
    }
  }

  // ================ 计算几何结果 ================
  private calculateResult(): DrawResult | null {
    if (!this.startPoint || !this.currentPoint) return null;

    switch (this.drawingMode) {
      case 'rectangle':
        return this.calculateRectangle();
      case 'circle':
        return this.calculateCircle();
      case 'line':
        return this.calculateLine();
      case 'sector':
        return this.calculateSector();
      default:
        return null;
    }
  }

  // ================ 矩形计算（对角线法） ================
  private calculateRectangle(): RectangleDrawResult {
    const p1 = this.startPoint!;
    const p2 = this.currentPoint!;

    // 计算4个顶点（确保矩形正确）
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);

    const vertices: [Point, Point, Point, Point] = [
      { x: maxX, y: minY },  // 右上
      { x: minX, y: minY },  // 左上
      { x: maxX, y: maxY },  // 右下
      { x: minX, y: maxY }   // 左下
    ];

    const width = maxX - minX;
    const height = maxY - minY;
    const center = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2
    };

    return {
      type: 'rectangle',
      vertices,
      width,
      height,
      center
    };
  }

  // ================ 圆形计算 ================
  private calculateCircle(): CircleDrawResult {
    const center = this.startPoint!;
    const edge = this.currentPoint!;

    const radius = Math.sqrt(
      Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
    );

    return {
      type: 'circle',
      center,
      radius
    };
  }

  // ================ 线段计算 ================
  private calculateLine(): LineDrawResult {
    const start = this.startPoint!;
    const end = this.currentPoint!;

    const length = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );

    const center = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    };

    return {
      type: 'line',
      start,
      end,
      length,
      center
    };
  }

  // ================ 扇形计算 ================
  private calculateSector(): SectorDrawResult | null {
    if (!this.sectorFirstPoint) return null;

    const center = this.startPoint!;
    const leftPoint = this.sectorFirstPoint;
    const rightPoint = this.currentPoint!;

    // 计算半径（取第一个点到圆心的距离）
    const radius = Math.sqrt(
      Math.pow(leftPoint.x - center.x, 2) + Math.pow(leftPoint.y - center.y, 2)
    );

    // 计算两条边的角度
    const angle1 = Math.atan2(leftPoint.y - center.y, leftPoint.x - center.x);
    const angle2 = Math.atan2(rightPoint.y - center.y, rightPoint.x - center.x);

    // 计算弧度（确保为正值）
    let angle = angle2 - angle1;
    if (angle < 0) angle += Math.PI * 2;
    if (angle > Math.PI * 2) angle -= Math.PI * 2;

    const angleDegrees = (angle * 180) / Math.PI;

    return {
      type: 'sector',
      center,
      leftPoint,
      rightPoint,
      radius,
      angle,
      angleDegrees
    };
  }

  // ================ 重置状态 ================
  private reset(): void {
    this.isDrawing = false;
    this.startPoint = null;
    this.currentPoint = null;
    this.sectorFirstPoint = null;
  }

  // ================ 清理 ================
  destroy(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }
}

// ================ 辅助函数：格式化输出 ================
export function formatDrawResult(result: DrawResult): string {
  switch (result.type) {
    case 'rectangle':
      return `矩形:
  顶点: 右上${pointStr(result.vertices[0])}, 左上${pointStr(result.vertices[1])}, 右下${pointStr(result.vertices[2])}, 左下${pointStr(result.vertices[3])}
  宽度: ${result.width.toFixed(2)}px
  高度: ${result.height.toFixed(2)}px
  中心点: ${pointStr(result.center)}`;

    case 'circle':
      return `圆形:
  圆心: ${pointStr(result.center)}
  半径: ${result.radius.toFixed(2)}px`;

    case 'line':
      return `线段:
  起点: ${pointStr(result.start)}
  终点: ${pointStr(result.end)}
  长度: ${result.length.toFixed(2)}px
  中心点: ${pointStr(result.center)}`;

    case 'sector':
      return `扇形:
  圆心: ${pointStr(result.center)}
  左边界点: ${pointStr(result.leftPoint)}
  右边界点: ${pointStr(result.rightPoint)}
  半径: ${result.radius.toFixed(2)}px
  弧度: ${result.angle.toFixed(4)} rad
  角度: ${result.angleDegrees.toFixed(2)}°`;

    default:
      return '';
  }
}

function pointStr(point: Point): string {
  return `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
}

