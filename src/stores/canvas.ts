/**
 * 画布状态管理
 * 管理缩放、网格、刻度等画布显示状态
 */

import { defineStore } from 'pinia';
import type { CanvasParams } from '@/utils/types';

export const useCanvasStore = defineStore('canvas', {
  state: () => ({
    // Canvas 参数（多租户信息）
    params: null as CanvasParams | null,
    
    // 画布尺寸
    width: 620,
    height: 600,  // canvas 实际高度（不包括 header）
    
    // 缩放
    scale: 1.0,
    minScale: 0.5,
    maxScale: 2.0,
    
    // 显示选项
    showGrid: true,
    showScale: true,
    showBoundary: true,  // 显示雷达边界
    
    // 网格参数
    gridSize: 50,        // 网格间隔（逻辑单位）
    tickInterval: 100,   // 刻度间隔（逻辑单位）
    
    // 绘图模式
    drawingMode: null as string | null,  // 'line' | 'rectangle' | 'circle' | 'sector' | null
    isDrawing: false,                     // 是否正在绘图
    pendingObjectType: null as string | null,  // 待创建的对象类型（家具/结构）
  }),
  
  getters: {
    /**
     * 原点X坐标（画布中心）
     */
    originX: (state) => state.width / 2,
    
    /**
     * 原点Y坐标（画布顶部）
     */
    originY: () => 0,
    
    /**
     * 缩放范围信息
     */
    scaleInfo: (state) => ({
      current: state.scale,
      min: state.minScale,
      max: state.maxScale,
      percentage: Math.round(state.scale * 100)
    })
  },
  
  actions: {
    /**
     * 设置缩放比例
     */
    setScale(scale: number) {
      this.scale = Math.max(this.minScale, Math.min(this.maxScale, scale));
    },
    
    /**
     * 调整缩放（增量）
     */
    adjustZoom(delta: number) {
      this.setScale(this.scale + delta);
    },
    
    /**
     * 重置缩放
     */
    resetZoom() {
      this.scale = 1.0;
    },
    
    /**
     * 切换网格显示
     */
    toggleGrid() {
      this.showGrid = !this.showGrid;
    },
    
    /**
     * 切换刻度显示
     */
    toggleScale() {
      this.showScale = !this.showScale;
    },
    
    /**
     * 切换边界显示
     */
    toggleBoundary() {
      this.showBoundary = !this.showBoundary;
    },
    
    /**
     * 画布坐标转逻辑坐标
     */
    toLogicalCoord(canvasX: number, canvasY: number) {
      return {
        x: Math.round((canvasX - this.originX) / this.scale),
        y: Math.round(canvasY / this.scale)
      };
    },
    
    /**
     * 设置绘图模式
     */
    setDrawingMode(mode: string | null) {
      this.drawingMode = mode;
      console.log(mode ? `✏️ 进入绘图模式: ${mode}` : '🖱️ 退出绘图模式');
    },
    
    /**
     * 设置待创建对象类型
     */
    setPendingObjectType(type: string | null) {
      this.pendingObjectType = type;
      console.log(type ? `🏗️ 待创建对象: ${type}` : '清空待创建对象');
    },
    
    /**
     * 开始绘图
     */
    startDrawing() {
      this.isDrawing = true;
    },
    
    /**
     * 结束绘图
     */
    endDrawing() {
      this.isDrawing = false;
      this.drawingMode = null;
      this.pendingObjectType = null;
    },
    
    /**
     * 设置 Canvas 参数
     */
    setParams(params: CanvasParams) {
      this.params = params;
      console.log('📋 Canvas参数已设置:', params);
    },
    
    /**
     * 获取当前 Canvas ID
     */
    getCanvasId(): string | null {
      return this.params?.canvasId || null;
    }
  }
});

