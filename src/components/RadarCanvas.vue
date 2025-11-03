<template>
  <div class="radar-canvas-wrapper">
    <div class="canvas-header">
      <h3>{{ canvasTitle }}</h3>
      <div class="header-right">
        <label class="vital-toggle">
          <input type="checkbox" v-model="showVital" />
          <span>Vital</span>
        </label>
        <div class="zoom-controls">
          <button @click="adjustZoom(-0.1)" class="zoom-btn">−</button>
          <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
          <button @click="adjustZoom(0.1)" class="zoom-btn">+</button>
        </div>
        <div class="mouse-position">
          X: {{ mouseX }}, Y: {{ mouseY }}
        </div>
      </div>
    </div>
    
    <div class="canvas-container">
      <canvas
        ref="canvasRef"
        :width="canvasStore.width"
        :height="canvasStore.height"
        class="radar-canvas"
        :style="{ cursor: (canvasStore.drawingMode || isCreatingDevice) ? 'crosshair' : cursorStyle }"
        @wheel="handleWheel"
        @mousemove="handleMouseMove"
        @mousedown="handleMouseDown"
        @mouseup="handleMouseUp"
        @click="handleCanvasClick"
        @contextmenu.prevent="handleCanvasContextMenu"
        @dblclick="handleCanvasDblClick"
      ></canvas>
              <div 
                v-if="showContextMenu" 
                class="context-menu" 
                :style="{ left: contextMenuPos.x + 'px', top: contextMenuPos.y + 'px' }"
              >
                <button class="ctx-item" @click="handleContextDelete">Delete</button>
                <button class="ctx-item" @click="handleContextCopy">Copy</button>
                <button class="ctx-item" @click="handleContextLockUnlock">
                  {{ contextMenuTargetId && objectsStore.getObjectById(contextMenuTargetId)?.interactive?.locked ? 'Unlock' : 'Lock' }}
                </button>
                <button class="ctx-item" @click="handleContextBringToFront">Bring to Front</button>
                <button class="ctx-item" @click="handleContextSendToBack">Send to Back</button>
              </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useCanvasStore } from '@/stores/canvas';
import { useRadarDataStore } from '@/stores/radarData';
import { useObjectsStore } from '@/stores/objects';
import type { PostureIconConfig, BaseObject } from '@/utils/types';
import { 
  POSTURE_CONFIGS,
  VITAL_SIGN_CONFIGS, 
  getHeartRateStatus, 
  getBreathingStatus, 
  getSleepStatus 
} from '@/utils/postureIcons';
import { drawObjects } from '@/utils/drawObjects';
import { drawLine, drawRectangle, drawCircle, drawSector } from '@/utils/drawShapes';
import type { Point, RadarPoint } from '@/utils/types';
import { getRadarBoundaryVertices, toCanvasCoordinate } from '@/utils/radarUtils';
import { RADAR_DEFAULT_CONFIG, MOVE_STEP, FURNITURE_CONFIGS, type FurnitureType } from '@/utils/types';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasStore = useCanvasStore();
const radarDataStore = useRadarDataStore();
const objectsStore = useObjectsStore();
const scale = ref(1.0);
const mouseX = ref(0);
const mouseY = ref(0);
const showVital = ref(false);

// 动画渲染控制
const animationFrameId = ref<number | null>(null);
const isAnimating = ref(false);

// 姿态图片缓存（用于Canvas绘制）
const postureImageCache = new Map<number, HTMLImageElement>();

// 预加载所有姿态图标
const preloadPostureIcons = async (): Promise<void> => {
  console.log('🔄 开始预加载姿态图标...');
  console.log(`📦 POSTURE_CONFIGS keys:`, Object.keys(POSTURE_CONFIGS));
  
  const promises = Object.entries(POSTURE_CONFIGS).map(([postureId, config]) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        postureImageCache.set(Number(postureId), img);
        console.log(`✅ Loaded posture ${postureId}: ${config.iconPath}`);
        resolve();
      };
      img.onerror = (e) => {
        console.error(`❌ Failed to load posture ${postureId}: ${config.iconPath}`, e);
        resolve(); // 即使失败也resolve，避免阻塞
      };
      
      if (!config.iconPath) {
        console.error(`❌ No iconPath for posture ${postureId}`);
        resolve();
        return;
      }
      
      img.src = config.iconPath;
    });
  });
  
  try {
    await Promise.all(promises);
    console.log(`✅ 图标预加载完成，缓存中有 ${postureImageCache.size} 个图标`);
  } catch (e) {
    console.error('❌ 图标预加载出错:', e);
  }
};

// Canvas 标题（显示设备名称）
const canvasTitle = computed(() => {
  const params = canvasStore.params;
  if (!params) return 'TrackMonitor';
  
  const deviceNames = params.devices.map(d => d.deviceName).join(', ');
  return deviceNames || 'TrackMonitor';
});
// 右键菜单
const showContextMenu = ref(false);
const contextMenuPos = ref<{ x: number; y: number }>({ x: 0, y: 0 });
const contextMenuTargetId = ref<string | null>(null);

// 绘图状态
const isDrawing = ref(false);
const drawStartPos = ref<{ x: number; y: number } | null>(null);
const tempShape = ref<any | null>(null);

// 拖动状态
const isDragging = ref(false);
const dragType = ref<'move' | 'control-point' | null>(null); // 拖动类型：整体移动 or 控制点
const dragStartPos = ref<{ x: number; y: number } | null>(null); // 拖动起始位置（逻辑坐标）
const draggedObject = ref<BaseObject | null>(null);
const controlPointIndex = ref<number>(-1); // 正在拖动的控制点索引
const cursorStyle = ref<string>('default'); // 鼠标样式

// 判断是否正在创建设备（Radar/Sleepad/Sensor）
const isCreatingDevice = computed(() => {
  const pendingType = canvasStore.pendingObjectType;
  return pendingType === 'Radar' || pendingType === 'Sleepad' || pendingType === 'Sensor';
});

// 调整缩放
const adjustZoom = (delta: number) => {
  const newScale = scale.value + delta;
  if (newScale >= 0.5 && newScale <= 2.0) {
    scale.value = newScale;
    redrawCanvas();
  }
};

// 鼠标滚轮缩放
const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.1 : -0.1;
  adjustZoom(delta);
};

// 获取选中对象的所有控制点（逻辑坐标）
const getControlPoints = (obj: BaseObject): Array<{ x: number; y: number; type: string }> => {
  const points: Array<{ x: number; y: number; type: string }> = [];
  
  if (!obj.interactive.selected) return points;
  
  switch (obj.geometry.type) {
    case 'point':
      // IoT设备：圆心
      points.push({ ...obj.geometry.data, type: 'center' });
      break;
      
    case 'line':
      // 线段：两端点
      points.push({ ...obj.geometry.data.start, type: 'start' });
      points.push({ ...obj.geometry.data.end, type: 'end' });
      break;
      
    case 'rectangle':
      // 矩形：左上、右下顶点
      const vertices = obj.geometry.data.vertices;
      if (vertices && vertices.length >= 4) {
        points.push({ ...vertices[0], type: 'top-left' }); // 左上
        points.push({ ...vertices[3], type: 'bottom-right' }); // 右下
      }
      break;
      
    case 'circle':
      // 圆形：圆心 + 4个方向的半径控制点
      const circleCenter = obj.geometry.data.center;
      const circleRadius = obj.geometry.data.radius;
      points.push({ ...circleCenter, type: 'center' });
      // 上、下、左、右四个方向的半径控制点
      points.push({ x: circleCenter.x, y: circleCenter.y - circleRadius, type: 'top' });
      points.push({ x: circleCenter.x, y: circleCenter.y + circleRadius, type: 'bottom' });
      points.push({ x: circleCenter.x - circleRadius, y: circleCenter.y, type: 'left' });
      points.push({ x: circleCenter.x + circleRadius, y: circleCenter.y, type: 'right' });
      break;
      
    case 'sector':
      // 扇形：圆心 + 两个弧线端点
      points.push({ ...obj.geometry.data.center, type: 'center' });
      points.push({ ...obj.geometry.data.leftPoint, type: 'left' });
      points.push({ ...obj.geometry.data.rightPoint, type: 'right' });
      break;
  }
  
  return points;
};

// 检测点是否在控制点范围内（容差8px逻辑坐标）
const isPointOnControlPoint = (x: number, y: number, obj: BaseObject): { hit: boolean; index: number; point: any } => {
  const tolerance = 8 / scale.value; // 转换为逻辑坐标容差
  const controlPoints = getControlPoints(obj);
  
  // 如果有旋转角度，需要将点击位置反旋转后再与原始控制点坐标比较
  const rotationAngle = obj.angle || 0;
  let testX = x, testY = y;
  
  if (rotationAngle !== 0) {
    // 计算旋转中心（逻辑坐标）
    let centerX = 0, centerY = 0;
    switch (obj.geometry.type) {
      case 'line':
        centerX = (obj.geometry.data.start.x + obj.geometry.data.end.x) / 2;
        centerY = (obj.geometry.data.start.y + obj.geometry.data.end.y) / 2;
        break;
      case 'rectangle':
        const vertices = obj.geometry.data.vertices;
        if (vertices && vertices.length >= 4) {
          centerX = (vertices[0].x + vertices[1].x + vertices[2].x + vertices[3].x) / 4;
          centerY = (vertices[0].y + vertices[1].y + vertices[2].y + vertices[3].y) / 4;
        }
        break;
      case 'circle':
      case 'sector':
        centerX = obj.geometry.data.center.x;
        centerY = obj.geometry.data.center.y;
        break;
      case 'point':
        centerX = obj.geometry.data.x;
        centerY = obj.geometry.data.y;
        break;
    }
    
    // 将点击位置相对于旋转中心进行反旋转
    // Canvas的rotate是顺时针，我们存储的是逆时针角度，所以绘制时用了 -rotationAngle
    // 反旋转时需要使用 +rotationAngle（顺时针旋转角度）
    const angleRad = -(rotationAngle * Math.PI) / 180; // 转换为顺时针角度（与Canvas rotate一致）
    const dx = x - centerX;
    const dy = y - centerY;
    // 反旋转公式（顺时针）：如果对象旋转了-θ，反旋转就是+θ
    testX = centerX + dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
    testY = centerY + dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
  }
  
  for (let i = 0; i < controlPoints.length; i++) {
    const cp = controlPoints[i];
    const dist = Math.sqrt(Math.pow(testX - cp.x, 2) + Math.pow(testY - cp.y, 2));
    if (dist <= tolerance) {
      return { hit: true, index: i, point: cp };
    }
  }
  
  return { hit: false, index: -1, point: null };
};

// 鼠标移动更新坐标
const handleMouseMove = (event: MouseEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  const canvasX = event.clientX - rect.left;
  const canvasY = event.clientY - rect.top;

  // 转换为逻辑坐标
  const logicalX = Math.round((canvasX - canvasStore.width / 2) / scale.value);
  const logicalY = Math.round(canvasY / scale.value);
  
  mouseX.value = logicalX;
  mouseY.value = logicalY;

  // 如果正在拖动
  if (isDragging.value && draggedObject.value && dragStartPos.value) {
    // 双重检查：在拖动过程中也要检查锁定状态
    if (draggedObject.value.interactive?.locked) {
      // 如果拖动过程中对象被锁定，取消拖动
      isDragging.value = false;
      dragType.value = null;
      dragStartPos.value = null;
      draggedObject.value = null;
      controlPointIndex.value = -1;
      cursorStyle.value = 'default';
      console.log('⚠️ 拖动被中断：对象已锁定');
      return;
    }
    
    if (dragType.value === 'move') {
      // 整体拖动：计算增量
      const deltaX = logicalX - dragStartPos.value.x;
      const deltaY = logicalY - dragStartPos.value.y;
      if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
        updateObjectPosition(draggedObject.value, deltaX, deltaY);
        dragStartPos.value = { x: logicalX, y: logicalY }; // 更新起始位置
        redrawCanvas();
      }
    } else if (dragType.value === 'control-point') {
      // 控制点拖动：直接使用新位置
      updateObjectByControlPoint(draggedObject.value, controlPointIndex.value, logicalX, logicalY);
      dragStartPos.value = { x: logicalX, y: logicalY }; // 更新起始位置
      redrawCanvas();
    }
    return;
  }

  // 如果正在绘图，更新临时形状
  if (isDrawing.value && drawStartPos.value && canvasStore.drawingMode) {
    updateTempShape(logicalX, logicalY);
    redrawCanvas();
    return;
  }

  // 更新鼠标样式（仅在非绘图模式下）
  if (!canvasStore.drawingMode) {
    const selectedObj = objectsStore.selectedObject;
    if (selectedObj) {
      // 如果对象被锁定，不显示可拖动光标
      if (selectedObj.interactive?.locked) {
        cursorStyle.value = 'default';
        return;
      }
      
      // 检查是否在控制点上
      const cpCheck = isPointOnControlPoint(logicalX, logicalY, selectedObj);
      if (cpCheck.hit) {
        cursorStyle.value = 'pointer'; // 控制点：指针
      } else if (isPointInObject(logicalX, logicalY, selectedObj)) {
        cursorStyle.value = 'grab'; // 对象上：抓手
      } else {
        cursorStyle.value = 'default'; // 默认
      }
    } else {
      cursorStyle.value = 'default';
    }
  }
};

// 鼠标按下开始绘图或拖动
const handleMouseDown = (event: MouseEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  const canvasX = event.clientX - rect.left;
  const canvasY = event.clientY - rect.top;
  let logicalX = Math.round((canvasX - canvasStore.width / 2) / scale.value);
  let logicalY = Math.round(canvasY / scale.value);

  // 如果在绘图模式下，开始绘图
  if (canvasStore.drawingMode) {
    isDrawing.value = true;
    drawStartPos.value = { x: logicalX, y: logicalY };
    canvasStore.startDrawing();
    return;
  }

  // 如果在非绘图模式，检查是否可以拖动
  const selectedObj = objectsStore.selectedObject;
  if (selectedObj) {
    // 检查对象是否被锁定
    if (selectedObj.interactive?.locked) {
      console.log('⚠️ 对象已锁定，无法拖动');
      return;
    }
    
    // 先检查是否点击在控制点上
    const cpCheck = isPointOnControlPoint(logicalX, logicalY, selectedObj);
    if (cpCheck.hit) {
      // 开始拖动控制点
      isDragging.value = true;
      dragType.value = 'control-point';
      dragStartPos.value = { x: logicalX, y: logicalY };
      draggedObject.value = selectedObj;
      controlPointIndex.value = cpCheck.index;
      cursorStyle.value = 'grabbing';
      console.log('🎯 开始拖动控制点:', cpCheck.point.type);
      return;
    }
    
    // 检查是否点击在对象上
    if (isPointInObject(logicalX, logicalY, selectedObj)) {
      // 开始整体拖动
      isDragging.value = true;
      dragType.value = 'move';
      dragStartPos.value = { x: logicalX, y: logicalY };
      draggedObject.value = selectedObj;
      cursorStyle.value = 'grabbing';
      console.log('🎯 开始拖动对象:', selectedObj.name || selectedObj.typeName);
      return;
    }
  }
};

// 对齐对象到步长网格
const alignObjectToGrid = (obj: BaseObject) => {
  const alignToStep = (value: number) => Math.round(value / MOVE_STEP) * MOVE_STEP;
  const newGeometry = { ...obj.geometry };
  
  switch (obj.geometry.type) {
    case 'point':
      newGeometry.data = {
        ...obj.geometry.data,
        x: alignToStep(obj.geometry.data.x),
        y: alignToStep(obj.geometry.data.y)
      };
      break;
    case 'line':
      newGeometry.data = {
        ...obj.geometry.data,
        start: {
          x: alignToStep(obj.geometry.data.start.x),
          y: alignToStep(obj.geometry.data.start.y)
        },
        end: {
          x: alignToStep(obj.geometry.data.end.x),
          y: alignToStep(obj.geometry.data.end.y)
        }
      };
      break;
    case 'rectangle':
      newGeometry.data = {
        ...obj.geometry.data,
        vertices: obj.geometry.data.vertices.map((v: Point) => ({
          x: alignToStep(v.x),
          y: alignToStep(v.y)
        }))
      };
      break;
    case 'circle':
      newGeometry.data = {
        ...obj.geometry.data,
        center: {
          x: alignToStep(obj.geometry.data.center.x),
          y: alignToStep(obj.geometry.data.center.y)
        }
      };
      break;
    case 'sector':
      newGeometry.data = {
        ...obj.geometry.data,
        center: {
          x: alignToStep(obj.geometry.data.center.x),
          y: alignToStep(obj.geometry.data.center.y)
        },
        leftPoint: {
          x: alignToStep(obj.geometry.data.leftPoint.x),
          y: alignToStep(obj.geometry.data.leftPoint.y)
        },
        rightPoint: {
          x: alignToStep(obj.geometry.data.rightPoint.x),
          y: alignToStep(obj.geometry.data.rightPoint.y)
        }
      };
      break;
    case 'polygon':
      newGeometry.data = {
        ...obj.geometry.data,
        vertices: obj.geometry.data.vertices.map((v: Point) => ({
          x: alignToStep(v.x),
          y: alignToStep(v.y)
        }))
      };
      break;
  }
  
  objectsStore.updateObject(obj.id, { geometry: newGeometry });
};

// 鼠标松开完成绘图或拖动
const handleMouseUp = (event: MouseEvent) => {
  // 如果正在拖动，结束拖动
  if (isDragging.value) {
    // 拖动结束后，对齐对象到步长网格
    // alignObjectToGrid 会调用 updateObject，从而触发 updateAllRadarAreas
    if (draggedObject.value) {
      alignObjectToGrid(draggedObject.value);
    }
    
    isDragging.value = false;
    dragType.value = null;
    dragStartPos.value = null;
    draggedObject.value = null;
    controlPointIndex.value = -1;
    cursorStyle.value = 'default';
    redrawCanvas();
    return;
  }

  // 如果正在绘图
  if (isDrawing.value && drawStartPos.value && canvasStore.drawingMode) {
    const rect = canvasRef.value?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    const logicalX = Math.round((canvasX - canvasStore.width / 2) / scale.value);
    const logicalY = Math.round(canvasY / scale.value);

    // 创建对象
    const newObjectId = createObjectFromDrawing(drawStartPos.value.x, drawStartPos.value.y, logicalX, logicalY);

    // 重置当前绘图状态，退出绘图模式（取消连续创建）
    isDrawing.value = false;
    drawStartPos.value = null;
    tempShape.value = null;
    canvasStore.endDrawing(); // 退出绘图模式
    
    // 自动选中新创建的对象
    if (newObjectId) {
      objectsStore.selectObject(newObjectId);
      console.log('✅ 创建并选中对象:', newObjectId);
    }
    
    redrawCanvas();
  }
};

// 更新临时形状
const updateTempShape = (endX: number, endY: number) => {
  if (!drawStartPos.value) return;

  const startX = drawStartPos.value.x;
  const startY = drawStartPos.value.y;

  switch (canvasStore.drawingMode) {
    case 'line':
      tempShape.value = {
        type: 'line',
        start: { x: startX, y: startY },
        end: { x: endX, y: endY }
      };
      break;

    case 'rect':
      tempShape.value = {
        type: 'rect',
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width: Math.abs(endX - startX),
        height: Math.abs(endY - startY)
      };
      break;

    case 'circle':
      const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      tempShape.value = {
        type: 'circle',
        center: { x: startX, y: startY },
        radius
      };
      break;

    case 'sector':
      // 扇形：从起点到终点，计算角度和半径
      const angle = Math.atan2(endY - startY, endX - startX);
      const sectorRadius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      tempShape.value = {
        type: 'sector',
        center: { x: startX, y: startY },
        radius: sectorRadius,
        angle: angle * (180 / Math.PI)
      };
      break;
  }
};

// 从绘图创建对象，返回新对象的ID
const createObjectFromDrawing = (startX: number, startY: number, endX: number, endY: number): string | null => {
  if (!canvasStore.drawingMode) return null;

  // 对齐到步长（10cm）
  const alignToStep = (value: number) => Math.round(value / MOVE_STEP) * MOVE_STEP;
  startX = alignToStep(startX);
  startY = alignToStep(startY);
  endX = alignToStep(endX);
  endY = alignToStep(endY);

  // 获取当前工具栏的绘图参数
  const drawingParams = (window as any).__toolbarDrawingParams?.() || { 
    color: '#000000', 
    lineWidth: 2 
  };

  // 获取反射率（如果类型在 FURNITURE_CONFIGS 中则使用配置值，否则默认50）
  const getReflectivity = (typeName: string): number => {
    const config = FURNITURE_CONFIGS[typeName as FurnitureType];
    return config ? config.reflectivity : 50;
  };

  const objectId = `obj_${Date.now()}`;
  let newObject: any = null;

  console.log('📍 创建对象坐标 (逻辑):', { 
    start: { x: startX, y: startY }, 
    end: { x: endX, y: endY },
    color: drawingParams.color,
    lineWidth: drawingParams.lineWidth
  });

  switch (canvasStore.drawingMode) {
    case 'line':
      // 计算线段长度，确保最小长度为5
      const lineLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      if (lineLength < 5) {
        console.log('⚠️ 线段长度太小（最小5），已取消创建');
        return null;
      }
      
      // Wall 默认宽度为 5，其他线段使用绘图参数中的宽度
      const lineThickness = (canvasStore.pendingObjectType === 'Wall') 
        ? 5 
        : (drawingParams.lineWidth || 2);
      
      newObject = {
        id: objectId,
        typeName: canvasStore.pendingObjectType || 'Wall',
        name: canvasStore.pendingObjectType || 'Line',
        geometry: {
          type: 'line',
          data: {
            start: { x: startX, y: startY },
            end: { x: endX, y: endY },
            thickness: lineThickness
          }
        },
        visual: {
          color: drawingParams.color,
          transparent: false,
          reflectivity: getReflectivity(canvasStore.pendingObjectType || 'Wall')
        },
        device: {
          category: 'structure'
        },
        interactive: {
          selected: false,
          locked: false
        },
        angle: 0
      };
      break;

    case 'rect':
      const minX = Math.min(startX, endX);
      const maxX = Math.max(startX, endX);
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);
      
      // 确保最小尺寸为5
      const rectWidth = maxX - minX;
      const rectHeight = maxY - minY;
      if (rectWidth < 5 || rectHeight < 5) {
        console.log('⚠️ 矩形尺寸太小（最小5x5），已取消创建');
        return null;
      }
      
      newObject = {
        id: objectId,
        typeName: canvasStore.pendingObjectType || 'Furniture',
        name: canvasStore.pendingObjectType || 'Rectangle',
        geometry: {
          type: 'rectangle',
          data: {
            vertices: [
              { x: minX, y: minY },
              { x: maxX, y: minY },
              { x: minX, y: maxY },
              { x: maxX, y: maxY }
            ]
          }
        },
        visual: {
          color: drawingParams.color,
          transparent: false,
          reflectivity: getReflectivity(canvasStore.pendingObjectType || 'Other')
        },
        device: {
          category: 'furniture'
        },
        interactive: {
          selected: false,
          locked: false
        },
        angle: 0
      };
      break;

    case 'circle':
      const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      
      // 确保最小半径为5
      if (radius < 5) {
        console.log('⚠️ 圆形半径太小（最小5），已取消创建');
        return null;
      }
      
      newObject = {
        id: objectId,
        typeName: canvasStore.pendingObjectType || 'Other',
        name: canvasStore.pendingObjectType || 'Circle',
        geometry: {
          type: 'circle',
          data: {
            center: { x: startX, y: startY },
            radius
          }
        },
        visual: {
          color: drawingParams.color,
          transparent: false,
          reflectivity: getReflectivity(canvasStore.pendingObjectType || 'Other')
        },
        device: {
          category: 'furniture'
        },
        interactive: {
          selected: false,
          locked: false
        },
        angle: 0
      };
      break;

    case 'sector':
      const sectorRadius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      
      // 确保最小半径为5
      if (sectorRadius < 5) {
        console.log('⚠️ 扇形半径太小（最小5），已取消创建');
        return null;
      }
      
      const angle = Math.atan2(endY - startY, endX - startX);
      const halfAngle = (45 * Math.PI) / 180; // 45度扇形
      
      // 计算扇形的左右边界点
      const leftAngle = angle - halfAngle;
      const rightAngle = angle + halfAngle;
      
      newObject = {
        id: objectId,
        typeName: canvasStore.pendingObjectType || 'Other',
        name: canvasStore.pendingObjectType || 'Sector',
        geometry: {
          type: 'sector',
          data: {
            center: { x: startX, y: startY },
            leftPoint: {
              x: startX + sectorRadius * Math.cos(leftAngle),
              y: startY + sectorRadius * Math.sin(leftAngle)
            },
            rightPoint: {
              x: startX + sectorRadius * Math.cos(rightAngle),
              y: startY + sectorRadius * Math.sin(rightAngle)
            },
            radius: sectorRadius
          }
        },
        visual: {
          color: drawingParams.color,
          transparent: false,
          reflectivity: getReflectivity(canvasStore.pendingObjectType || 'Other')
        },
        device: {
          category: 'furniture'
        },
        interactive: {
          selected: false,
          locked: false
        },
        angle: 0
      };
      break;
  }

  if (newObject) {
    objectsStore.addObject(newObject);
    console.log('✅ 创建对象:', newObject.name);
    return objectId; // 返回新对象的ID
  }
  
  return null;
};

// 鼠标点击选择对象（仅在非绘图模式下）
const handleCanvasClick = (event: MouseEvent) => {
  // 点击时隐藏右键菜单
  if (showContextMenu.value) showContextMenu.value = false;
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  const canvasX = event.clientX - rect.left;
  const canvasY = event.clientY - rect.top;

  // 转换为逻辑坐标
  let logicalX = Math.round((canvasX - canvasStore.width / 2) / scale.value);
  let logicalY = Math.round(canvasY / scale.value);

  // 如果有待放置的设备，创建设备
  if (canvasStore.pendingObjectType && !canvasStore.drawingMode) {
    // 对齐到步长（10cm）
    const alignToStep = (value: number) => Math.round(value / MOVE_STEP) * MOVE_STEP;
    logicalX = alignToStep(logicalX);
    logicalY = alignToStep(logicalY);
    
    const type = canvasStore.pendingObjectType;
    const canvasId = `${type.toLowerCase()}_${Date.now()}`;
    
    // 生成临时设备ID和名称（Radar01, Radar02...）
    const tempDevice = objectsStore.generateTempDeviceId(type as 'Radar' | 'Sleepad' | 'Sensor');
    
    const newDevice: any = {
      id: canvasId,  // Canvas内部ID
      typeName: type,
      name: tempDevice.deviceName,  // 临时名称：Radar01, Sleepad01...
      geometry: {
        type: 'point',
        data: {
          x: logicalX,
          y: logicalY,
          z: type === 'Radar' ? RADAR_DEFAULT_CONFIG.ceiling.height : 280  // 雷达使用默认高度，其他设备280
        }
      },
      visual: {
        color: type === 'Radar' ? '#2196F3' : type === 'Sleepad' ? '#9C27B0' : '#FF9800',
        transparent: false
      },
      device: {
        category: 'iot',
        type: type,
        isInteractive: true,
        isObstacle: false,
        iot: {
          deviceId: tempDevice.deviceId,  // 临时设备ID：Radar01, Sleepad01...
          isOnline: true,
          communication: 'wifi',
          // 雷达设备：初始化radar配置（包括边界、高度、信号区域等）
          ...(type === 'Radar' ? {
            radar: {
              installModel: 'ceiling',  // 默认安装模式
              workModel: 'vital',        // 默认工作模式
              hfov: RADAR_DEFAULT_CONFIG.ceiling.hfov,
              vfov: RADAR_DEFAULT_CONFIG.ceiling.vfov,
              boundary: { ...RADAR_DEFAULT_CONFIG.ceiling.boundary },
              signalRadius: RADAR_DEFAULT_CONFIG.ceiling.signalRadius,
              signalAngle: RADAR_DEFAULT_CONFIG.ceiling.signalAngle,
              showBoundary: true,  // 默认显示边界
              showSignal: false
            }
          } : {})
        }
      },
      interactive: {
        selected: true,
        locked: false
      },
      angle: 0
    };
    
    objectsStore.addObject(newDevice);
    canvasStore.setPendingObjectType(null); // 清除待放置状态
    console.log(`✅ 在 (${logicalX}, ${logicalY}) 创建设备: ${type}`);
    return;
  }

  // 如果在绘图模式下，不处理选择
  if (canvasStore.drawingMode) return;

  // 检测点击的对象（从后往前，即从顶层开始）
  const clickedObject = [...objectsStore.objects].reverse().find(obj => {
    return isPointInObject(logicalX, logicalY, obj);
  });

  // 更新选中状态
  if (clickedObject) {
    objectsStore.selectObject(clickedObject.id);
    redrawCanvas();
  } else {
    objectsStore.selectObject(null);
    redrawCanvas();
  }
};

// 右键菜单：在对象上显示删除/取消选中
const handleCanvasContextMenu = (event: MouseEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  const canvasX = event.clientX - rect.left;
  const canvasY = event.clientY - rect.top;
  const logicalX = Math.round((canvasX - canvasStore.width / 2) / scale.value);
  const logicalY = Math.round(canvasY / scale.value);

  // 命中测试（从顶层开始）
  const target = [...objectsStore.objects].reverse().find(obj => isPointInObject(logicalX, logicalY, obj));
  if (!target) {
    showContextMenu.value = false;
    return;
  }

  // 选中该对象
  objectsStore.selectObject(target.id);
  contextMenuTargetId.value = target.id;

  // 菜单位置（放在鼠标位置，基于容器定位）
  const containerRect = (canvasRef.value!.parentElement as HTMLElement).getBoundingClientRect();
  contextMenuPos.value = { x: event.clientX - containerRect.left, y: event.clientY - containerRect.top };
  showContextMenu.value = true;
};

const handleContextDelete = () => {
  if (contextMenuTargetId.value) {
    objectsStore.removeObject(contextMenuTargetId.value);
    objectsStore.clearSelection();
    showContextMenu.value = false;
    contextMenuTargetId.value = null;
    redrawCanvas();
  }
};

const handleContextCopy = () => {
  if (contextMenuTargetId.value) {
    objectsStore.duplicateObject(contextMenuTargetId.value);
    showContextMenu.value = false;
    contextMenuTargetId.value = null;
    redrawCanvas();
  }
};

const handleContextBringToFront = () => {
  if (contextMenuTargetId.value) {
    const obj = objectsStore.getObjectById(contextMenuTargetId.value);
    if (obj) {
      // 移除对象
      const index = objectsStore.objects.findIndex(o => o.id === contextMenuTargetId.value);
      if (index !== -1) {
        objectsStore.objects.splice(index, 1);
        // 添加到末尾（最上层）
        objectsStore.objects.push(obj);
        redrawCanvas();
      }
    }
    showContextMenu.value = false;
  }
};

const handleContextSendToBack = () => {
  if (contextMenuTargetId.value) {
    const obj = objectsStore.getObjectById(contextMenuTargetId.value);
    if (obj) {
      // 移除对象
      const index = objectsStore.objects.findIndex(o => o.id === contextMenuTargetId.value);
      if (index !== -1) {
        objectsStore.objects.splice(index, 1);
        // 添加到开头（最下层）
        objectsStore.objects.unshift(obj);
        redrawCanvas();
      }
    }
    showContextMenu.value = false;
  }
};

const handleContextLockUnlock = () => {
  if (contextMenuTargetId.value) {
    const obj = objectsStore.getObjectById(contextMenuTargetId.value);
    if (obj) {
      if (!obj.interactive) {
        (obj as any).interactive = { selected: false, locked: false };
      }
      const newLockedState = !obj.interactive.locked;
      objectsStore.updateObject(obj.id, {
        interactive: {
          ...obj.interactive,
          locked: newLockedState
        }
      });
      console.log(newLockedState ? '🔒 对象已锁定' : '🔓 对象已解锁');
      redrawCanvas();
    }
    showContextMenu.value = false;
  }
};

// 更新对象位置（整体拖动）
const updateObjectPosition = (obj: BaseObject, deltaX: number, deltaY: number) => {
  if (!obj || (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1)) return;
  
  // 检查对象是否被锁定
  if (obj.interactive?.locked) {
    console.log('⚠️ 对象已锁定，无法移动');
    return;
  }
  
  const newGeometry = { ...obj.geometry };
  
  switch (obj.geometry.type) {
    case 'point':
      // IoT设备：移动点坐标（拖动时不对齐，松开后再对齐）
      newGeometry.data = {
        ...obj.geometry.data,
        x: obj.geometry.data.x + deltaX,
        y: obj.geometry.data.y + deltaY
      };
      break;
      
    case 'line':
      // 线段：移动起点和终点
      newGeometry.data = {
        ...obj.geometry.data,
        start: {
          x: obj.geometry.data.start.x + deltaX,
          y: obj.geometry.data.start.y + deltaY
        },
        end: {
          x: obj.geometry.data.end.x + deltaX,
          y: obj.geometry.data.end.y + deltaY
        }
      };
      break;
      
    case 'rectangle':
      // 矩形：移动所有顶点
      newGeometry.data = {
        ...obj.geometry.data,
        vertices: obj.geometry.data.vertices.map((v: Point) => ({
          x: v.x + deltaX,
          y: v.y + deltaY
        }))
      };
      // 更新center（基于vertices计算）
      if (newGeometry.data.vertices.length >= 4) {
        const minX = Math.min(...newGeometry.data.vertices.map((v: Point) => v.x));
        const maxX = Math.max(...newGeometry.data.vertices.map((v: Point) => v.x));
        const minY = Math.min(...newGeometry.data.vertices.map((v: Point) => v.y));
        const maxY = Math.max(...newGeometry.data.vertices.map((v: Point) => v.y));
        newGeometry.data.center = {
          x: (minX + maxX) / 2,
          y: (minY + maxY) / 2
        };
      }
      break;
      
    case 'circle':
      // 圆形：移动中心点
      newGeometry.data = {
        ...obj.geometry.data,
        center: {
          x: obj.geometry.data.center.x + deltaX,
          y: obj.geometry.data.center.y + deltaY
        }
      };
      break;
      
    case 'sector':
      // 扇形：移动中心点和边界点
      newGeometry.data = {
        ...obj.geometry.data,
        center: {
          x: obj.geometry.data.center.x + deltaX,
          y: obj.geometry.data.center.y + deltaY
        },
        leftPoint: {
          x: obj.geometry.data.leftPoint.x + deltaX,
          y: obj.geometry.data.leftPoint.y + deltaY
        },
        rightPoint: {
          x: obj.geometry.data.rightPoint.x + deltaX,
          y: obj.geometry.data.rightPoint.y + deltaY
        }
      };
      break;
      
    case 'polygon':
      // 多边形：移动所有顶点
      newGeometry.data = {
        ...obj.geometry.data,
        vertices: obj.geometry.data.vertices.map((v: Point) => ({
          x: v.x + deltaX,
          y: v.y + deltaY
        }))
      };
      break;
  }
  
  objectsStore.updateObject(obj.id, { geometry: newGeometry });
};

// 通过控制点更新对象（调整尺寸）
const updateObjectByControlPoint = (obj: BaseObject, controlPointIndex: number, newX: number, newY: number) => {
  if (!obj || controlPointIndex < 0) return;
  
  // 检查对象是否被锁定
  if (obj.interactive?.locked) {
    console.log('⚠️ 对象已锁定，无法调整');
    return;
  }
  
  const controlPoints = getControlPoints(obj);
  if (controlPointIndex >= controlPoints.length) return;
  
  const cp = controlPoints[controlPointIndex];
  const newGeometry = { ...obj.geometry };
  
  switch (obj.geometry.type) {
    case 'point':
      // IoT设备：移动位置
      newGeometry.data = { ...obj.geometry.data, x: newX, y: newY };
      break;
      
    case 'line':
      // 线段：拖动端点
      if (cp.type === 'start') {
        newGeometry.data = {
          ...obj.geometry.data,
          start: { x: newX, y: newY }
        };
      } else if (cp.type === 'end') {
        newGeometry.data = {
          ...obj.geometry.data,
          end: { x: newX, y: newY }
        };
      }
      break;
      
    case 'rectangle':
      // 矩形：拖动左上或右下顶点调整尺寸
      const vertices = [...obj.geometry.data.vertices];
      if (cp.type === 'top-left') {
        // 拖动左上角：更新 vertices[0]
        vertices[0] = { x: newX, y: newY };
        vertices[1] = { x: vertices[1].x, y: newY }; // 右上Y跟随
        vertices[2] = { x: newX, y: vertices[2].y }; // 左下X跟随
        // vertices[3] (右下) 不变
      } else if (cp.type === 'bottom-right') {
        // 拖动右下角：更新 vertices[3]
        vertices[3] = { x: newX, y: newY };
        vertices[1] = { x: newX, y: vertices[1].y }; // 右上X跟随
        vertices[2] = { x: vertices[2].x, y: newY }; // 左下Y跟随
        // vertices[0] (左上) 不变
      }
      newGeometry.data = {
        ...obj.geometry.data,
        vertices: vertices,
        center: {
          x: (vertices[0].x + vertices[3].x) / 2,
          y: (vertices[0].y + vertices[3].y) / 2
        }
      };
      break;
      
    case 'circle':
      // 圆形：拖动圆心移动位置，拖动圆周控制点调整半径
      if (cp.type === 'center') {
        // 拖动圆心：移动整个圆
        newGeometry.data = {
          ...obj.geometry.data,
          center: { x: newX, y: newY }
        };
      } else {
        // 拖动圆周控制点：调整半径
        const center = obj.geometry.data.center;
        // 计算新半径（圆心到新位置的距离）
        const newRadius = Math.sqrt(Math.pow(newX - center.x, 2) + Math.pow(newY - center.y, 2));
        newGeometry.data = {
          ...obj.geometry.data,
          radius: newRadius
        };
      }
      break;
      
    case 'sector':
      // 扇形：拖动圆心、左端点或右端点
      if (cp.type === 'center') {
        // 拖动圆心：整体移动扇形
        const oldCenter = obj.geometry.data.center;
        const deltaX = newX - oldCenter.x;
        const deltaY = newY - oldCenter.y;
        newGeometry.data = {
          ...obj.geometry.data,
          center: { x: newX, y: newY },
          leftPoint: {
            x: obj.geometry.data.leftPoint.x + deltaX,
            y: obj.geometry.data.leftPoint.y + deltaY
          },
          rightPoint: {
            x: obj.geometry.data.rightPoint.x + deltaX,
            y: obj.geometry.data.rightPoint.y + deltaY
          }
        };
      } else if (cp.type === 'left') {
        // 拖动左端点：更新左端点位置，重新计算半径，保持右端点相对角度
        const center = obj.geometry.data.center;
        const newLeftRadius = Math.sqrt(Math.pow(newX - center.x, 2) + Math.pow(newY - center.y, 2));
        
        // 计算新的左端点角度
        const newLeftAngle = Math.atan2(newY - center.y, newX - center.x);
        
        // 计算右端点的角度（保持原来的角度差，或使用原来的角度）
        const oldRightAngle = Math.atan2(
          obj.geometry.data.rightPoint.y - center.y,
          obj.geometry.data.rightPoint.x - center.x
        );
        
        // 保持右端点使用新半径，但角度不变（或保持角度差）
        // 这里我们使用新半径，但保持原来的角度差
        const oldLeftAngle = Math.atan2(
          obj.geometry.data.leftPoint.y - center.y,
          obj.geometry.data.leftPoint.x - center.x
        );
        const angleDiff = oldRightAngle - oldLeftAngle;
        const newRightAngle = newLeftAngle + angleDiff;
        
        newGeometry.data = {
          ...obj.geometry.data,
          leftPoint: { x: newX, y: newY },
          rightPoint: {
            x: center.x + newLeftRadius * Math.cos(newRightAngle),
            y: center.y + newLeftRadius * Math.sin(newRightAngle)
          },
          radius: newLeftRadius
        };
      } else if (cp.type === 'right') {
        // 拖动右端点：更新右端点位置，重新计算半径，保持左端点相对角度
        const center = obj.geometry.data.center;
        const newRightRadius = Math.sqrt(Math.pow(newX - center.x, 2) + Math.pow(newY - center.y, 2));
        
        // 计算新的右端点角度
        const newRightAngle = Math.atan2(newY - center.y, newX - center.x);
        
        // 保持左端点的角度差
        const oldLeftAngle = Math.atan2(
          obj.geometry.data.leftPoint.y - center.y,
          obj.geometry.data.leftPoint.x - center.x
        );
        const oldRightAngle = Math.atan2(
          obj.geometry.data.rightPoint.y - center.y,
          obj.geometry.data.rightPoint.x - center.x
        );
        const angleDiff = oldRightAngle - oldLeftAngle;
        const newLeftAngle = newRightAngle - angleDiff;
        
        newGeometry.data = {
          ...obj.geometry.data,
          leftPoint: {
            x: center.x + newRightRadius * Math.cos(newLeftAngle),
            y: center.y + newRightRadius * Math.sin(newLeftAngle)
          },
          rightPoint: { x: newX, y: newY },
          radius: newRightRadius
        };
      }
      break;
  }
  
  objectsStore.updateObject(obj.id, { geometry: newGeometry });
};

// 双击画布：取消所有选中
const handleCanvasDblClick = (event: MouseEvent) => {
  // 取消选中
  objectsStore.selectObject(null);
  
  // 通知Toolbar重置状态（通过设置一个标志或直接操作store）
  canvasStore.setDrawingMode(null);
  canvasStore.setPendingObjectType(null);
  
  console.log('🔄 双击画布，重置所有选中状态');
};

// 判断点是否在对象内
const isPointInObject = (x: number, y: number, obj: BaseObject): boolean => {
  switch (obj.geometry.type) {
    case 'point': {
      // IoT设备：使用圆形碰撞检测
      const dx = x - obj.geometry.data.x;
      const dy = y - obj.geometry.data.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= 20; // 20像素的检测范围
    }
    
    case 'rectangle': {
      // 矩形：检测点是否在矩形内
      const vertices = obj.geometry.data.vertices;
      // 简单的AABB检测（假设矩形未旋转）
      const minX = Math.min(...vertices.map(v => v.x));
      const maxX = Math.max(...vertices.map(v => v.x));
      const minY = Math.min(...vertices.map(v => v.y));
      const maxY = Math.max(...vertices.map(v => v.y));
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }
    
    case 'circle': {
      // 圆形：点到圆心的距离
      const dx = x - obj.geometry.data.center.x;
      const dy = y - obj.geometry.data.center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= obj.geometry.data.radius;
    }
    
    case 'line': {
      // 线段：点到线段的距离
      const { start, end, thickness } = obj.geometry.data;
      const lineLength = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      const dot = ((x - start.x) * (end.x - start.x) + (y - start.y) * (end.y - start.y)) / (lineLength * lineLength);
      
      if (dot < 0 || dot > 1) return false; // 点在线段延长线上
      
      const closestX = start.x + dot * (end.x - start.x);
      const closestY = start.y + dot * (end.y - start.y);
      const distance = Math.sqrt(Math.pow(x - closestX, 2) + Math.pow(y - closestY, 2));
      
      return distance <= (thickness || 2) + 5; // 线宽 + 5像素容差
    }
    
    case 'sector': {
      // 扇形：检测点是否在扇形内
      const { center, leftPoint, rightPoint, radius } = obj.geometry.data;
      
      // 1. 检查点到中心的距离是否在半径内
      const dx = x - center.x;
      const dy = y - center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const sectorRadius = radius || Math.sqrt(
        Math.pow(leftPoint.x - center.x, 2) + Math.pow(leftPoint.y - center.y, 2)
      );
      
      if (distance > sectorRadius) return false;
      
      // 2. 检查点的角度是否在扇形范围内
      const pointAngle = Math.atan2(dy, dx);
      const leftAngle = Math.atan2(leftPoint.y - center.y, leftPoint.x - center.x);
      const rightAngle = Math.atan2(rightPoint.y - center.y, rightPoint.x - center.x);
      
      // 处理角度环绕问题
      const normalizeAngle = (angle: number) => {
        while (angle < 0) angle += Math.PI * 2;
        while (angle >= Math.PI * 2) angle -= Math.PI * 2;
        return angle;
      };
      
      const normLeft = normalizeAngle(leftAngle);
      const normRight = normalizeAngle(rightAngle);
      const normPoint = normalizeAngle(pointAngle);
      
      if (normLeft <= normRight) {
        return normPoint >= normLeft && normPoint <= normRight;
      } else {
        return normPoint >= normLeft || normPoint <= normRight;
      }
    }
    
    default:
      return false;
  }
};

// 计算人员当前的插值位置（平滑动画，0.5秒，20帧/秒）
const getInterpolatedPosition = (person: any): Point => {
  // 如果没有移动动画，直接返回当前位置
  if (!person.isMoving || !person.startPosition || !person.targetPosition) {
    return person.position;
  }
  
  const now = Date.now();
  const elapsed = now - (person.moveStartTime || 0);
  const duration = person.moveDuration || 500;  // 0.5秒 = 500ms
  
  // 动画已完成
  if (elapsed >= duration) {
    return person.targetPosition;
  }
  
  // 使用 easeOutQuad 缓动函数
  const progress = elapsed / duration;
  const eased = 1 - Math.pow(1 - progress, 2);  // easeOutQuad
  
  // 线性插值（lerp）
  return {
    x: person.startPosition.x + (person.targetPosition.x - person.startPosition.x) * eased,
    y: person.startPosition.y + (person.targetPosition.y - person.startPosition.y) * eased,
    z: person.startPosition.z + (person.targetPosition.z - person.startPosition.z) * eased
  };
};

// 检测人员是否在移动（用于自动切换Walking姿态）
const isPersonMoving = (person: any): boolean => {
  if (!person.isMoving) return false;
  
  const now = Date.now();
  const elapsed = now - (person.moveStartTime || 0);
  const duration = person.moveDuration || 500;
  
  return elapsed < duration;
};

// 绘制人员（来自雷达数据）
const drawPersons = (ctx: CanvasRenderingContext2D) => {
  // 获取当前在场的所有人员
  const persons = radarDataStore.currentPersons;
  
  if (persons.length === 0) return;
  
  let hasActiveAnimation = false;
  
  persons.forEach(person => {
    // 跳过无人标记（id=88）
    if (person.id === 88) return;
    
    // 获取插值后的位置（平滑动画）
    const currentPos = getInterpolatedPosition(person);
    
    // 检查是否还在动画中
    const moving = isPersonMoving(person);
    if (moving) {
      hasActiveAnimation = true;
    }
    
    // ===== 坐标转换：雷达坐标系 -> 画布坐标系 =====
    // 1. 使用第一个雷达作为展示雷达（或使用默认雷达）
    // 注意：person.deviceCode 是数据来源，不一定是Canvas中的雷达
    const radar = objectsStore.objects.find(obj => obj.typeName === 'Radar');
    
    if (!radar) {
      console.warn(`⚠️ Canvas 中无雷达对象`);
      return;
    }
    
    // 2. 构建雷达坐标点（已经是 cm，由数据入口处转换）
    const radarPoint: RadarPoint = {
      h: currentPos.x,  // cm (水平)
      v: currentPos.y   // cm (垂直)
    };
    
    // 调试：输出雷达信息（仅首次）
    if (person.id % 1000000 === 0) {
      const radarPos = radar.geometry.type === 'point' ? radar.geometry.data : { x: 0, y: 0 };
      console.log(`📡 Radar info:`, {
        name: radar.name,
        position: radarPos,
        angle: radar.angle || 0
      });
    }
    
    // 3. 使用 toCanvasCoordinate 转换为画布坐标（考虑雷达位置和旋转）
    const canvasPoint = toCanvasCoordinate(radarPoint, radar);
    
    // 4. 转换为屏幕坐标（应用缩放）
    const screenX = canvasPoint.x * scale.value;
    const screenY = canvasPoint.y * scale.value;
    
    console.log(`🧍 Person ${person.id}: radarCoord(${currentPos.x.toFixed(1)}cm, ${currentPos.y.toFixed(1)}cm) -> canvas(${canvasPoint.x.toFixed(1)}, ${canvasPoint.y.toFixed(1)}) -> screen(${screenX.toFixed(0)}px, ${screenY.toFixed(0)}px), posture=${person.posture}, moving=${moving}`);
    
    // ===== 确定显示的姿态（移动时自动切换为Walking） =====
    const displayPosture = moving ? 1 : person.posture;  // 1 = Walking
    
    // ===== 绘制姿态图片 =====
    const postureImg = postureImageCache.get(displayPosture);
    const config = POSTURE_CONFIGS[displayPosture];
    
    // 调试信息（只在第一帧输出）
    if (person.id % 100 === 0 || !postureImg) {
      console.log(`  🎨 尝试绘制姿态 ${displayPosture}:`, {
        hasImg: !!postureImg,
        imgComplete: postureImg?.complete,
        hasConfig: !!config,
        cacheSize: postureImageCache.size,
        iconPath: config?.iconPath
      });
    }
    
    if (postureImg && postureImg.complete && config) {
      // 获取图片原始尺寸
      const originalSize = config.size;
      
      // 计算绘制尺寸（原图的80%）
      const drawSize = originalSize * 0.8 * scale.value;
      
      // 绘制图片（居中于人员位置）
      ctx.save();
      ctx.drawImage(
        postureImg,
        screenX - drawSize / 2,  // x（居中）
        screenY - drawSize / 2,  // y（居中）
        drawSize,                 // width
        drawSize                  // height
      );
      ctx.restore();
    } else {
      // 降级方案：绘制简单圆圈
      ctx.save();
      ctx.beginPath();
      ctx.arc(screenX, screenY, 8 * scale.value, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
    
    // 绘制人员标签
    drawPersonLabel(ctx, person, screenX, screenY);
    
    // 绘制轨迹
    if (person.deviceCode && person.personIndex !== undefined) {
      drawPersonTrajectory(ctx, person.deviceCode, person.personIndex);
    }
  });
  
  // 如果有动画在进行，继续请求下一帧
  if (hasActiveAnimation && !isAnimating.value) {
    startAnimationLoop();
  }
};

// 绘制人员标签
const drawPersonLabel = (
  ctx: CanvasRenderingContext2D, 
  person: any, 
  screenX: number, 
  screenY: number
) => {
  ctx.save();
  ctx.font = `${10 * scale.value}px Arial`;
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  
  // 显示人员索引
  const label = `P${person.personIndex}`;
  ctx.fillText(label, screenX, screenY - 30 * scale.value);
  
  ctx.restore();
};

// 绘制人员轨迹（坐标转换：雷达坐标系 -> 画布坐标系）
const drawPersonTrajectory = (
  ctx: CanvasRenderingContext2D,
  deviceCode: string,
  personIndex: number
) => {
  const trajectory = radarDataStore.getPersonTrajectory(deviceCode, personIndex);
  
  if (trajectory.length < 2) return;
  
  // 使用第一个雷达作为展示雷达
  const radar = objectsStore.objects.find(obj => obj.typeName === 'Radar');
  
  if (!radar) {
    console.warn(`⚠️ 轨迹：Canvas 中无雷达对象`);
    return;
  }
  
  ctx.save();
  ctx.strokeStyle = 'rgba(24, 144, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  
  ctx.beginPath();
  
  // 转换第一个点（已经是 cm）
  const firstRadarPoint: RadarPoint = {
    h: trajectory[0].x,  // cm
    v: trajectory[0].y
  };
  const firstCanvasPoint = toCanvasCoordinate(firstRadarPoint, radar);
  ctx.moveTo(firstCanvasPoint.x * scale.value, firstCanvasPoint.y * scale.value);
  
  // 连接后续点
  for (let i = 1; i < trajectory.length; i++) {
    const radarPoint: RadarPoint = {
      h: trajectory[i].x,  // cm
      v: trajectory[i].y
    };
    const canvasPoint = toCanvasCoordinate(radarPoint, radar);
    ctx.lineTo(canvasPoint.x * scale.value, canvasPoint.y * scale.value);
  }
  
  ctx.stroke();
  ctx.restore();
};

// 启动动画循环（20帧/秒，每帧间隔50ms）
const startAnimationLoop = () => {
  if (isAnimating.value) return;  // 避免重复启动
  
  isAnimating.value = true;
  
  const fps = 20;  // 20帧/秒
  const frameInterval = 1000 / fps;  // 50ms
  let lastFrameTime = Date.now();
  
  const animate = () => {
    const now = Date.now();
    const elapsed = now - lastFrameTime;
    
    // 帧率限制：只有当经过足够时间时才渲染
    if (elapsed >= frameInterval) {
      lastFrameTime = now - (elapsed % frameInterval);  // 修正累积误差
      redrawCanvas();
    }
    
    // 检查是否还有人员在移动
    const hasMoving = radarDataStore.currentPersons.some(p => {
      if (!p.isMoving) return false;
      const elapsed = Date.now() - (p.moveStartTime || 0);
      return elapsed < (p.moveDuration || 500);  // 0.5秒
    });
    
    if (hasMoving) {
      // 继续动画
      animationFrameId.value = requestAnimationFrame(animate);
    } else {
      // 动画完成，停止循环
      stopAnimationLoop();
    }
  };
  
  animationFrameId.value = requestAnimationFrame(animate);
};

// 停止动画循环
const stopAnimationLoop = () => {
  if (animationFrameId.value !== null) {
    cancelAnimationFrame(animationFrameId.value);
    animationFrameId.value = null;
  }
  isAnimating.value = false;
};

// 重绘画布
const redrawCanvas = () => {
  const ctx = canvasRef.value?.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvasStore.width, canvasStore.height);
  drawCoordinateSystem(ctx);
  
  // 绘制所有对象（家具和设备）
  drawAllObjects(ctx);
  
  // 绘制雷达边界（如果启用）
  drawRadarBoundaries(ctx);
  
  // 绘制人员（来自雷达数据）
  drawPersons(ctx);
  
  // 绘制临时形状
  if (tempShape.value) {
    drawTempShape(ctx);
  }
  
  // 绘制生理状态面板
  if (showVital.value) {
    drawStatusPanel(ctx);
  }
};

// 绘制临时形状（绘图过程中）
const drawTempShape = (ctx: CanvasRenderingContext2D) => {
  if (!tempShape.value) return;

  ctx.save();
  ctx.strokeStyle = '#1890ff';
  ctx.fillStyle = 'rgba(24, 144, 255, 0.1)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  const originX = canvasStore.width / 2;
  
  // 辅助函数：绘制起点/圆心标记
  const drawStartPoint = (x: number, y: number) => {
    ctx.save();
    ctx.setLineDash([]); // 取消虚线
    
    // 外圈 - 蓝色
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#1890ff';
    ctx.fill();
    
    // 内圈 - 白色
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    
    ctx.restore();
  };

  switch (tempShape.value.type) {
    case 'line':
      const lineStartX = originX + tempShape.value.start.x * scale.value;
      const lineStartY = tempShape.value.start.y * scale.value;
      const lineEndX = originX + tempShape.value.end.x * scale.value;
      const lineEndY = tempShape.value.end.y * scale.value;
      
      drawLine(
        ctx,
        { x: lineStartX, y: lineStartY },
        { x: lineEndX, y: lineEndY },
        { strokeColor: '#1890ff', lineWidth: 2 }
      );
      
      // 绘制起点标记
      drawStartPoint(lineStartX, lineStartY);
      break;

    case 'rect':
      const x = tempShape.value.x;
      const y = tempShape.value.y;
      const w = tempShape.value.width;
      const h = tempShape.value.height;
      const rectStartX = originX + x * scale.value;
      const rectStartY = y * scale.value;
      
      drawRectangle(
        ctx,
        [
          { x: rectStartX, y: rectStartY },
          { x: originX + (x + w) * scale.value, y: rectStartY },
          { x: rectStartX, y: (y + h) * scale.value },
          { x: originX + (x + w) * scale.value, y: (y + h) * scale.value }
        ],
        { 
          fillColor: 'rgba(24, 144, 255, 0.1)', 
          strokeColor: '#1890ff', 
          lineWidth: 2 
        }
      );
      
      // 绘制起点标记（左上角）
      drawStartPoint(rectStartX, rectStartY);
      break;

    case 'circle':
      const circleCenterX = originX + tempShape.value.center.x * scale.value;
      const circleCenterY = tempShape.value.center.y * scale.value;
      
      drawCircle(
        ctx,
        { x: circleCenterX, y: circleCenterY },
        tempShape.value.radius * scale.value,
        { 
          fillColor: 'rgba(24, 144, 255, 0.1)', 
          strokeColor: '#1890ff', 
          lineWidth: 2,
          strokeOnly: false
        }
      );
      
      // 绘制圆心标记
      drawStartPoint(circleCenterX, circleCenterY);
      break;

    case 'sector':
      // 扇形绘制 - 默认45度角
      const sectorCenterX = originX + tempShape.value.center.x * scale.value;
      const sectorCenterY = tempShape.value.center.y * scale.value;
      const sectorRadius = tempShape.value.radius * scale.value;
      const angle = tempShape.value.angle * (Math.PI / 180);
      const halfAngle = (45 * Math.PI) / 180; // 默认扇形角度
      
      drawSector(
        ctx,
        { x: sectorCenterX, y: sectorCenterY },
        sectorRadius,
        angle - halfAngle,
        angle + halfAngle,
        {
          fillColor: 'rgba(24, 144, 255, 0.1)',
          strokeColor: '#1890ff',
          lineWidth: 2
        }
      );
      
      // 绘制圆心标记
      drawStartPoint(sectorCenterX, sectorCenterY);
      break;
  }

  ctx.restore();
};

// 绘制所有对象
const drawAllObjects = (ctx: CanvasRenderingContext2D) => {
  if (objectsStore.objects.length === 0) return;
  
  // 使用 drawObjects 统一绘制，自动分层
  drawObjects(objectsStore.objects, {
    ctx,
    scale: scale.value,
    offset: { x: canvasStore.width / 2, y: 0 }, // Canvas原点在顶部中央
    showLabels: true // 显示对象名称
  });
};

// 绘制雷达边界
const drawRadarBoundaries = (ctx: CanvasRenderingContext2D) => {
  const radars = objectsStore.radars;
  if (radars.length === 0) return;
  
  const originX = canvasStore.width / 2;
  
  radars.forEach(radar => {
    // 检查是否显示边界：优先使用设备的showBoundary，否则使用全局的showBoundary
    const deviceShowBoundary = radar.device?.iot?.radar?.showBoundary;
    const shouldShow = deviceShowBoundary !== undefined 
      ? deviceShowBoundary 
      : canvasStore.showBoundary;
    
    if (!shouldShow) return;
    
    // 检查是否有边界配置
    const boundary = radar.device?.iot?.radar?.boundary;
    if (!boundary) return;
    
    try {
      // 获取边界顶点（画布坐标）
      const boundaryVertices = getRadarBoundaryVertices(radar);
      
      if (boundaryVertices.length < 4) return;
      
      // 转换为画布坐标
      const canvasVertices = boundaryVertices.map(v => ({
        x: originX + v.x * scale.value,
        y: v.y * scale.value
      }));
      
      // 重新排序顶点为：左上、右上、右下、左下
      // 根据getRadarBoundaryVertices返回的顺序：[右上, 左上, 右下, 左下]
      const topLeft = canvasVertices[1];    // 左上
      const topRight = canvasVertices[0];   // 右上
      const bottomRight = canvasVertices[2]; // 右下
      const bottomLeft = canvasVertices[3];  // 左下
      
      // 绘制矩形边界线（只画四条边，不闭合，不画对角线）
      ctx.save();
      ctx.strokeStyle = '#1890ff'; // 边界用蓝色
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]); // 虚线
      ctx.globalAlpha = 0.6; // 半透明
      
      ctx.beginPath();
      // 上边：左上 -> 右上
      ctx.moveTo(topLeft.x, topLeft.y);
      ctx.lineTo(topRight.x, topRight.y);
      // 右边：右上 -> 右下
      ctx.lineTo(bottomRight.x, bottomRight.y);
      // 下边：右下 -> 左下
      ctx.lineTo(bottomLeft.x, bottomLeft.y);
      // 左边：左下 -> 左上
      ctx.lineTo(topLeft.x, topLeft.y);
      // 不调用closePath()，这样就不会画对角线
      ctx.stroke();
      
      ctx.restore();
      
      // 单独绘制信号区域（如果启用）
      if (radar.device?.iot?.radar?.showSignal) {
        drawRadarSignalArea(ctx, radar, originX);
      }
    } catch (error) {
      console.warn('绘制雷达边界失败:', radar.name || radar.typeName, error);
    }
  });
};

// 绘制雷达信号区域
const drawRadarSignalArea = (ctx: CanvasRenderingContext2D, radar: BaseObject, originX: number) => {
  const installModel = radar.device?.iot?.radar?.installModel || 'ceiling';
  const radarConfig = radar.device?.iot?.radar;
  const radarHeight = (radar.geometry.data as any).z || 280; // 雷达高度（cm）
  
  // 雷达位置（逻辑坐标）
  const radarPos = {
    x: radar.geometry.data.x,
    y: radar.geometry.data.y
  };
  
  ctx.save();
  ctx.strokeStyle = '#ff6b6b'; // 信号区域用红色
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]); // 虚线
  ctx.globalAlpha = 0.6; // 半透明
  ctx.fillStyle = 'rgba(255, 107, 107, 0.1)'; // 浅红色填充
  
  try {
    if (installModel === 'ceiling') {
      // Ceiling模式：通过高度、hfov/vfov计算投影边界（矩形），同时受信号半径限制
      const hfov = radarConfig?.hfov || 140; // 水平视场角
      const vfov = radarConfig?.vfov || 120; // 垂直视场角
      const signalRadius = radarConfig?.signalRadius || 500; // 信号半径限制
      
      // 计算投影到地面的矩形尺寸
      // 水平方向投影宽度 = 2 * height * tan(hfov/2)
      // 垂直方向投影长度 = 2 * height * tan(vfov/2)
      const hfovRad = (hfov * Math.PI) / 180;
      const vfovRad = (vfov * Math.PI) / 180;
      let projectionWidth = 2 * radarHeight * Math.tan(hfovRad / 2);
      let projectionLength = 2 * radarHeight * Math.tan(vfovRad / 2);
      
      // 受信号半径限制：投影不能超过信号半径
      // 矩形对角线长度不能超过 signalRadius
      const diagonalLength = Math.sqrt(projectionWidth * projectionWidth + projectionLength * projectionLength) / 2;
      if (diagonalLength > signalRadius) {
        // 按比例缩小到信号半径范围内
        const scale_factor = signalRadius / diagonalLength;
        projectionWidth *= scale_factor;
        projectionLength *= scale_factor;
      }
      
      const canvasPos = {
        x: originX + radarPos.x * scale.value,
        y: radarPos.y * scale.value
      };
      
      // 绘制投影矩形（中心在雷达位置，考虑旋转）
      const halfWidth = projectionWidth / 2;
      const halfLength = projectionLength / 2;
      
      // 获取雷达旋转角度
      const angle = radar.angle || 0;
      const angleRad = (angle * Math.PI) / 180;
      
      // 计算旋转后的4个角点（标准逆时针旋转矩阵）
      const corners = [
        { x: -halfWidth, y: -halfLength }, // 左上
        { x: halfWidth, y: -halfLength },  // 右上
        { x: halfWidth, y: halfLength },   // 右下
        { x: -halfWidth, y: halfLength }   // 左下
      ].map(corner => ({
        x: canvasPos.x + (corner.x * Math.cos(angleRad) - corner.y * Math.sin(angleRad)) * scale.value,
        y: canvasPos.y + (corner.x * Math.sin(angleRad) + corner.y * Math.cos(angleRad)) * scale.value
      }));
      
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      ctx.lineTo(corners[1].x, corners[1].y);
      ctx.lineTo(corners[2].x, corners[2].y);
      ctx.lineTo(corners[3].x, corners[3].y);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      
    } else if (installModel === 'wall') {
      // Wall模式：扇形，半径为signalRadius，夹角为hfov
      const angle = radar.angle || 0; // 雷达旋转角度（逆时针为正）
      const angleRad = (angle * Math.PI) / 180; // 正角度，逆时针
      const hfov = radarConfig?.hfov || 140; // 使用hfov作为扇形夹角
      const signalRadius = radarConfig?.signalRadius || 500; // 信号区域半径
      const signalAngleRad = (hfov * Math.PI) / 180; // 扇形角度（弧度）
      
      const canvasPos = {
        x: originX + radarPos.x * scale.value,
        y: radarPos.y * scale.value
      };
      
      // 扇形中心角度
      // Canvas坐标系：0°=右，90°=下，180°=左，270°=上
      // 雷达默认向下 = 90° = Math.PI/2
      // 逆时针旋转angle° → 90° - angle°
      const centerAngle = Math.PI / 2 - angleRad; // 向下基准，逆时针旋转用减法
      const startAngle = centerAngle - signalAngleRad / 2;
      const endAngle = centerAngle + signalAngleRad / 2;
      
      ctx.beginPath();
      ctx.moveTo(canvasPos.x, canvasPos.y);
      ctx.arc(canvasPos.x, canvasPos.y, signalRadius * scale.value, startAngle, endAngle);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      
    } else if (installModel === 'corn') {
      // Corn模式：90度扇形，半径为signalRadius
      // leftH>0, rightH=0：扇形在左边；leftH=0, rightH>0：扇形在右边
      const signalRadius = radarConfig?.signalRadius || 900; // 信号区域半径
      const signalAngleRad = (90 * Math.PI) / 180; // 固定90度扇形
      
      const boundary = radarConfig?.boundary;
      const leftH = boundary?.leftH || 0;
      const rightH = boundary?.rightH || 0;
      
      const canvasPos = {
        x: originX + radarPos.x * scale.value,
        y: radarPos.y * scale.value
      };
      
      // 考虑雷达的旋转角度（逆时针为正）
      const radarAngle = radar.angle || 0;
      const radarAngleRad = (radarAngle * Math.PI) / 180; // 正角度，逆时针
      
      let centerAngle: number;
      if (leftH > 0 && rightH === 0) {
        // 左边：扇形向左下方向（Canvas坐标系：135°）
        // 逆时针旋转angle° → 135° - angle°
        centerAngle = (3 * Math.PI / 4) - radarAngleRad; // 左下基准，逆时针旋转用减法
      } else if (leftH === 0 && rightH > 0) {
        // 右边：扇形向右下方向（Canvas坐标系：45°）
        centerAngle = (Math.PI / 4) - radarAngleRad; // 右下基准，逆时针旋转用减法
      } else {
        // 默认：左边
        centerAngle = (3 * Math.PI / 4) - radarAngleRad;
      }
      
      const startAngle = centerAngle - signalAngleRad / 2;
      const endAngle = centerAngle + signalAngleRad / 2;
      
      ctx.beginPath();
      ctx.moveTo(canvasPos.x, canvasPos.y);
      ctx.arc(canvasPos.x, canvasPos.y, signalRadius * scale.value, startAngle, endAngle);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    }
  } catch (error) {
    console.warn('绘制雷达信号区域失败:', radar.name || radar.typeName, error);
  }
  
  ctx.restore();
};

// 绘制生理状态面板
const drawStatusPanel = (ctx: CanvasRenderingContext2D) => {
  const vital = radarDataStore.currentVital;
  if (!vital) return;
  
  ctx.save();
  
  // 透明白色背景，带阴影
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  ctx.fillRect(10, 10, 180, 90);
  ctx.shadowColor = 'transparent'; // 重置阴影
  
  // 边框
  ctx.strokeStyle = 'rgba(224, 224, 224, 0.8)';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, 180, 90);

  // 统一图标加载和绘制函数
  const drawIconAndText = (
    iconConfig: PostureIconConfig, 
    x: number, 
    y: number, 
    value: string
  ) => {
    const icon = new Image();
    icon.src = iconConfig.iconPath;
    icon.onload = () => {
      ctx.drawImage(icon, x, y, iconConfig.size, iconConfig.size);
      // 在图标加载完成后绘制文字
      ctx.font = '14px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'left';
      ctx.fillText(value, x + iconConfig.size + 8, y + iconConfig.size/2 + 5);
    };
  };

  // 心率
  const heartStatus = getHeartRateStatus(vital.heartRate);
  drawIconAndText(
    VITAL_SIGN_CONFIGS.heart[heartStatus], 
    20, 20,
    vital.heartRate ? `${vital.heartRate} bpm` : '--'
  );

  // 呼吸
  const breathingStatus = getBreathingStatus(vital.breathing);
  drawIconAndText(
    VITAL_SIGN_CONFIGS.breathing[breathingStatus], 
    20, 50,
    vital.breathing ? `${vital.breathing} rpm` : '--'
  );

  // 睡眠状态
  const sleepStatus = getSleepStatus(vital.sleepState);
  const sleepLabel = sleepStatus === 'deep' ? 'Deep' : 
                    sleepStatus === 'light' ? 'Light' : 
                    sleepStatus === 'awake' ? 'Awake' : '--';
  drawIconAndText(
    VITAL_SIGN_CONFIGS.sleep[sleepStatus], 
    20, 80,
    sleepLabel
  );
  
  ctx.restore();
};

// 绘制坐标系统
const drawCoordinateSystem = (ctx: CanvasRenderingContext2D) => {
  // 底色
  ctx.fillStyle = 'rgb(255, 248, 220)';
  ctx.fillRect(0, 0, canvasStore.width, canvasStore.height);

  const originX = canvasStore.width / 2;  // 原点X坐标（画布中心）
  const originY = 0;                       // 原点Y坐标（画布顶部）

  // 绘制网格
  if (canvasStore.showGrid) {
    const gridLogicSize = 50;  // 网格逻辑间隔
    ctx.strokeStyle = 'rgb(221, 221, 221)';
    ctx.lineWidth = 0.5;

    // 垂直网格线（X轴）
    // 右侧网格线
    for (let logicX = 0; ; logicX += gridLogicSize) {
      const pixelX = originX + logicX * scale.value;
      if (pixelX > canvasStore.width) break;
      ctx.beginPath();
      ctx.moveTo(pixelX, 0);
      ctx.lineTo(pixelX, canvasStore.height);
      ctx.stroke();
    }
    // 左侧网格线
    for (let logicX = gridLogicSize; ; logicX += gridLogicSize) {
      const pixelX = originX - logicX * scale.value;
      if (pixelX < 0) break;
      ctx.beginPath();
      ctx.moveTo(pixelX, 0);
      ctx.lineTo(pixelX, canvasStore.height);
      ctx.stroke();
    }

    // 水平网格线（Y轴）
    for (let logicY = 0; ; logicY += gridLogicSize) {
      const pixelY = originY + logicY * scale.value;
      if (pixelY > canvasStore.height) break;
      ctx.beginPath();
      ctx.moveTo(0, pixelY);
      ctx.lineTo(canvasStore.width, pixelY);
      ctx.stroke();
    }
  }

  // 刻度标注
  if (canvasStore.showScale) {
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgb(0, 0, 0)';

    const tickLogicInterval = 100;  // 刻度逻辑间隔

    // X轴刻度（左负右正）
    for (let logicX = 0; ; logicX += tickLogicInterval) {
      const pixelXRight = originX + logicX * scale.value;
      if (pixelXRight > canvasStore.width) break;
      if (logicX !== 0) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`+${logicX}`, pixelXRight, 5);
        ctx.textBaseline = 'bottom';
        ctx.fillText(`+${logicX}`, pixelXRight, canvasStore.height - 5);
      }

      const pixelXLeft = originX - logicX * scale.value;
      if (pixelXLeft >= 0) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`-${logicX}`, pixelXLeft, 5);
        ctx.textBaseline = 'bottom';
        ctx.fillText(`-${logicX}`, pixelXLeft, canvasStore.height - 5);
      }
    }

    // Y轴刻度（从上到下递增）
    for (let logicY = 0; ; logicY += tickLogicInterval) {
      const pixelY = originY + logicY * scale.value;
      if (pixelY > canvasStore.height) break;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${logicY}`, 20, pixelY);

      ctx.textAlign = 'left';
      ctx.fillText(`${logicY}`, canvasStore.width - 20, pixelY);
    }

    // 原点标记
    ctx.beginPath();
    ctx.arc(originX, originY, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgb(24, 144, 255)';
    ctx.fill();
  }
};

// 监听显示选项和对象变化
watch(
  [
    () => canvasStore.showGrid, 
    () => canvasStore.showScale, 
    () => canvasStore.showBoundary, // 监听全局边界显示开关
    scale, 
    showVital,
    () => objectsStore.objects.length,
    () => objectsStore.selectedId
  ],
  () => {
    redrawCanvas();
  }
);

// 深度监听对象变化
watch(
  () => objectsStore.objects,
  () => {
    redrawCanvas();
  },
  { deep: true }
);

// 监听生理数据变化
// 监听生理数据变化，重绘
watch(
  () => radarDataStore.currentVital,
  () => {
    if (showVital.value) {
      redrawCanvas();
    }
  },
  { deep: true }
);

// 监听人员数据变化，触发重绘和动画
watch(
  () => radarDataStore.lastUpdate,
  () => {
    // 数据更新时：
    // 1. 立即重绘一次
    redrawCanvas();
    
    // 2. 如果有人员在移动，启动动画循环
    const hasMoving = radarDataStore.currentPersons.some(p => p.isMoving);
    if (hasMoving && !isAnimating.value) {
      startAnimationLoop();
    }
  }
);

onMounted(async () => {
  console.log('📍 RadarCanvas mounted');
  
  try {
    await preloadPostureIcons();
  } catch (error) {
    console.error('❌ 预加载姿态图标失败:', error);
  }
  
  redrawCanvas();
});

// 组件卸载时清理动画
onUnmounted(() => {
  stopAnimationLoop();
});
</script>

<style scoped>
.radar-canvas-wrapper {
  width: 620px;
  height: 650px;
  background-color: white;
  border: 1px solid #ccc;
  display: flex;
  flex-direction: column;
}

.canvas-header {
  padding: 10px 15px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.canvas-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.mouse-position {
  font-size: 12px;
  color: #666;
  font-family: 'Courier New', monospace;
  min-width: 100px;
}

.canvas-container {
  position: relative;
  flex: 1;
}

.radar-canvas {
  display: block;
  cursor: crosshair;
}

.context-menu {
  position: absolute;
  background: #fff;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  border-radius: 4px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 10;
}
.context-menu .ctx-item {
  padding: 6px 10px;
  font-size: 12px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 3px;
  cursor: pointer;
}
.context-menu .ctx-item:hover {
  background: #f0f7ff;
  border-color: #1890ff;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ccc;
  border-radius: 3px;
  background: white;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
  transition: all 0.2s;

  &:hover {
    background: #f0f0f0;
    border-color: #999;
  }

  &:active {
    background: #e0e0e0;
  }
}

.zoom-level {
  min-width: 45px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.vital-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  cursor: pointer;
  user-select: none;

  input[type="checkbox"] {
    margin: 0;
  }

  span {
    color: #666;
    font-weight: 500;
  }
}
</style>

