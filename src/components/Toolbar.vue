<template>
  <div class="toolbar">
    <div class="tool-section">
      <div class="tool-row-4">
        <button 
          class="tool-btn draw-tool" 
          :class="{ active: activeTool === 'line', disabled: !activeFurniture }"
          @click="selectDrawTool('line')"
          :disabled="!activeFurniture"
          title="Line"
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <line x1="2" y1="18" x2="18" y2="2" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <button 
          class="tool-btn draw-tool"
          :class="{ active: activeTool === 'rect', disabled: !activeFurniture }"
          @click="selectDrawTool('rect')"
          :disabled="!activeFurniture"
          title="Rectangle"
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <rect x="3" y="3" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <button 
          class="tool-btn draw-tool"
          :class="{ active: activeTool === 'sector', disabled: !activeFurniture }"
          @click="selectDrawTool('sector')"
          :disabled="!activeFurniture"
          title="Sector"
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M 10 10 L 4 16 A 8 8 0 0 0 16 16 Z" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <button 
          class="tool-btn draw-tool"
          :class="{ active: activeTool === 'circle', disabled: !activeFurniture }"
          @click="selectDrawTool('circle')"
          :disabled="!activeFurniture"
          title="Circle"
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
      <div class="tool-row-line-color">
        <div class="color-group">
          <button class="color-btn red" :class="{ active: activeColor === colorMap.red, disabled: !activeFurniture }" @click="selectColor('red')" :disabled="!activeFurniture"></button>
          <button class="color-btn orange" :class="{ active: activeColor === colorMap.orange, disabled: !activeFurniture }" @click="selectColor('orange')" :disabled="!activeFurniture"></button>
          <button class="color-btn yellow" :class="{ active: activeColor === colorMap.yellow, disabled: !activeFurniture }" @click="selectColor('yellow')" :disabled="!activeFurniture"></button>
          <button class="color-btn green" :class="{ active: activeColor === colorMap.green, disabled: !activeFurniture }" @click="selectColor('green')" :disabled="!activeFurniture"></button>
          <button class="color-btn blue" :class="{ active: activeColor === colorMap.blue, disabled: !activeFurniture }" @click="selectColor('blue')" :disabled="!activeFurniture"></button>
          <button class="color-btn brown" :class="{ active: activeColor === colorMap.brown, disabled: !activeFurniture }" @click="selectColor('brown')" :disabled="!activeFurniture"></button>
          <button class="color-btn gray" :class="{ active: activeColor === colorMap.gray, disabled: !activeFurniture }" @click="selectColor('gray')" :disabled="!activeFurniture"></button>
          <button class="color-btn black" :class="{ active: activeColor === colorMap.black, disabled: !activeFurniture }" @click="selectColor('black')" :disabled="!activeFurniture"></button>
          <button class="color-btn silver" :class="{ active: activeColor === colorMap.silver, disabled: !activeFurniture }" @click="selectColor('silver')" :disabled="!activeFurniture"></button>
          <button class="color-btn white" :class="{ active: activeColor === colorMap.white, disabled: !activeFurniture }" @click="selectColor('white')" :disabled="!activeFurniture"></button>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="tool-section">
      <div class="tool-row-3">
        <button class="tool-btn bed" :class="{ active: activeFurniture === 'Bed' }" @click="selectFurniture('Bed')">Bed</button>
        <button class="tool-btn enter" :class="{ active: activeFurniture === 'Enter' }" @click="selectFurniture('Enter')">Enter</button>
        <button class="tool-btn interfere" :class="{ active: activeFurniture === 'Interfere' }" @click="selectFurniture('Interfere')">Interfere</button>
      </div>
      <div class="tool-row-3">
        <button class="tool-btn wall" :class="{ active: activeFurniture === 'Wall' }" @click="selectFurniture('Wall')">Wall</button>
        <button class="tool-btn furniture" :class="{ active: activeFurniture === 'Furniture' }" @click="selectFurniture('Furniture')">Furniture</button>
        <button class="tool-btn curtain" :class="{ active: activeFurniture === 'Curtain' }" @click="selectFurniture('Curtain')">Curtain</button>
      </div>
    </div>

    <div class="divider"></div>

    <div class="tool-section">
      <div class="tool-row-3">
        <button class="tool-btn radar" :class="{ active: activeDevice === 'Radar' }" @click="addDevice('Radar')">Radar</button>
        <button class="tool-btn sleepad" :class="{ active: activeDevice === 'Sleepad' }" @click="addDevice('Sleepad')">Sleepad</button>
        <button class="tool-btn sensor" :class="{ active: activeDevice === 'Sensor' }" @click="addDevice('Sensor')">Sensor</button>
      </div>
    </div>

    <div class="divider"></div>

    <div class="tool-section">
      <div class="tool-row-4">
        <button 
          class="action-btn delete" 
          @click="deleteObject"
          :disabled="!selectedObject"
        >Delete</button>
        <button 
          class="action-btn query" 
          :class="{ active: isQuerying }"
          @click="queryDevice"
          :disabled="!isRadarDevice"
        >Query</button>
        <button 
          class="action-btn save-config"
          @click="saveConfig"
          :disabled="!isRadarDevice"
        >IoTSave</button>
        <button 
          class="action-btn calibrate"
          @click="calibrate"
          :disabled="!isRadarDevice"
        >Calibr</button>
      </div>
      <div class="tool-row-4">
        <button 
          class="action-btn bind-btn" 
          :class="{ 'binded': isObjectBinded }"
          @click="toggleBind"
          :disabled="!canBind"
        >{{ isObjectBinded ? 'UnBind' : 'Bind' }}</button>
        <button class="action-btn layout-save" @click="layoutSave">LaySave</button>
        <button class="action-btn layout-exp" @click="layoutExport">LayExp</button>
        <button class="action-btn layout-imp" @click="layoutImport">LayImp</button>
      </div>
    </div>

    <div class="divider"></div>

    <div class="prop-section" v-if="selectedObject && !isIotDevice">
      <!-- 第1行：Name Rotation:旋转角度 -->
      <div class="prop-row prop-row-name">
        <span>Name:</span>
        <input 
          type="text" 
          class="prop-input-name-flex"
          :class="{ 'binded-name': isObjectBinded }"
          placeholder="Object" 
          v-model="objName"
          :disabled="!selectedObject"
        />
        <div class="prop-group">
          <span>Rotation:</span>
          <input 
            type="number" 
            class="prop-num-xs" 
            :value="geometryProps.R"
            @input="updateGeometry('R', Number(($event.target as HTMLInputElement).value))"
            :disabled="!selectedObject"
          />
        </div>
      </div>
      
      <!-- 第2行：线/矩形 Len/Depth/Height 或 圆/sector radians/Radius/Height -->
      <div class="prop-row prop-row-lwh" v-if="selectedObject.geometry.type === 'line' || selectedObject.geometry.type === 'rectangle'">
        <div class="prop-group">
          <span>Len:</span>
          <input 
            type="number" 
            class="prop-num-xs" 
            :value="geometryProps.L"
            @input="updateGeometry('L', Number(($event.target as HTMLInputElement).value))"
            :disabled="!selectedObject"
          />
        </div>
        <div class="prop-group" v-if="selectedObject.geometry.type === 'line' || selectedObject.geometry.type === 'rectangle'">
          <span>Deep:</span>
          <input 
            type="number" 
            class="prop-num-xs" 
            :value="geometryProps.W"
            @input="updateGeometry('W', Number(($event.target as HTMLInputElement).value))"
            :disabled="!selectedObject"
          />
        </div>
        <div class="prop-group">
          <span>Height:</span>
          <input 
            type="number" 
            class="prop-num-xs" 
            :value="geometryProps.H"
            :disabled="!selectedObject"
          />
        </div>
      </div>
      
      <div class="prop-row" v-if="selectedObject.geometry.type === 'circle' || selectedObject.geometry.type === 'sector'">
        <div class="prop-group" v-if="selectedObject.geometry.type === 'sector'">
          <span>radians:</span>
          <input 
            type="number" 
            class="prop-num-sm" 
            :value="geometryProps.sector"
            @input="updateGeometry('sector', Number(($event.target as HTMLInputElement).value))"
            :disabled="!selectedObject"
          />
        </div>
        <div class="prop-group">
          <span>Radius:</span>
          <input 
            type="number" 
            class="prop-num-sm" 
            :value="geometryProps.radius"
            @input="updateGeometry('radius', Number(($event.target as HTMLInputElement).value))"
            :disabled="!selectedObject"
          />
        </div>
        <div class="prop-group">
          <span>Height:</span>
          <input 
            type="number" 
            class="prop-num-xs" 
            :value="geometryProps.H"
            :disabled="!selectedObject"
          />
        </div>
      </div>
      
      <!-- 第3行：Reflect: onlyBoundary -->
      <div class="prop-row prop-row-reflect-boundary">
        <div class="prop-group">
          <span>Reflect:</span>
          <input 
            type="number" 
            class="prop-num-sm" 
            v-model.number="objReflect"
            :disabled="!selectedObject"
          />
        </div>
        <label class="checkbox-label checkbox-boundary">
          <input 
            type="checkbox" 
            :checked="selectedObject?.visual?.transparent || false"
            @change="toggleTransparent"
          />
          <span>onlyBoundary</span>
        </label>
      </div>
    </div>

    <div class="divider" v-if="!isIotDevice"></div>

    <div class="prop-section" v-if="selectedObject && isIotDevice">
      <!-- IoT 设备统一属性 -->
      <div class="prop-row" style="gap: 20px;">
        <div class="prop-group" style="flex: 0 0 auto;">
          <span>Name:</span>
          <input 
            type="text" 
            class="prop-input-name-flex"
            :class="{ 'binded-name': isObjectBinded }"
            placeholder="Device" 
            v-model="objName"
            style="width: 100px;"
          />
        </div>
        <div class="prop-group" style="flex: 0 0 auto;">
          <span>Online:</span>
          <span class="online-indicator" :class="{ active: selectedObject.device?.iot?.isOnline }">●</span>
        </div>
      </div>
      
      <!-- 雷达设备专用配置 -->
      <template v-if="isRadarDevice">
        <div class="prop-row">
          <span>InstallMod:</span>
          <div class="button-group">
            <button 
              class="mode-btn" 
              :class="{ active: selectedObject.device?.iot?.radar?.installModel === 'ceiling' }"
              @click="updateDeviceProp('installModel', 'ceiling')"
            >Ceiling</button>
            <button 
              class="mode-btn" 
              :class="{ active: selectedObject.device?.iot?.radar?.installModel === 'wall' }"
              @click="updateDeviceProp('installModel', 'wall')"
            >Wall</button>
            <button 
              class="mode-btn" 
              :class="{ active: selectedObject.device?.iot?.radar?.installModel === 'corn' }"
              @click="updateDeviceProp('installModel', 'corn')"
            >Corn</button>
          </div>
        </div>
        <div class="prop-row">
          <div class="prop-group" style="flex: 1;">
            <span>WorkMode:</span>
            <span class="prop-value">{{ radarWorkModeDisplay }}</span>
          </div>
          <div class="prop-group" style="flex: 1; margin-left: -20px;">
            <span>TiltAngle:</span>
            <span class="prop-value">{{ radarTiltAngle }}</span>
          </div>
        </div>
        <div class="prop-row">
          <div class="prop-group">
            <span class="label-fixed">Height:</span>
            <input 
              type="number" 
              class="prop-num-sm" 
              :value="radarHeight"
              @change="updateRadarHeight(Number(($event.target as HTMLInputElement).value))"
              step="10"
            />
          </div>
          <div class="prop-group">
            <span class="label-fixed">rotationAngle:</span>
            <input 
              type="number" 
              class="prop-num-sm" 
              :value="radarRotationAngle"
              @input="updateRadarRotationAngle(Number(($event.target as HTMLInputElement).value))"
            />
          </div>
        </div>
        <div class="prop-row">
          <div class="prop-group">
            <span class="label-fixed">Left:</span>
            <input 
              type="number" 
              class="prop-num-sm" 
              :value="radarBoundary.leftH"
              @change="updateRadarBoundary('leftH', Number(($event.target as HTMLInputElement).value))"
              step="10"
            />
          </div>
          <div class="prop-group">
            <span class="label-fixed">Right:</span>
            <input 
              type="number" 
              class="prop-num-sm" 
              :value="radarBoundary.rightH"
              @change="updateRadarBoundary('rightH', Number(($event.target as HTMLInputElement).value))"
              step="10"
            />
          </div>
          <label class="checkbox-label-sm">
            <input 
              type="checkbox" 
              :checked="radarShowBoundary"
              @change="updateRadarShowBoundary(($event.target as HTMLInputElement).checked)"
            />
            <span>Boundary</span>
          </label>
        </div>
        <div class="prop-row">
          <div class="prop-group">
            <span class="label-fixed">Front:</span>
            <input 
              type="number" 
              class="prop-num-sm" 
              :value="radarBoundary.frontV"
              @change="updateRadarBoundary('frontV', Number(($event.target as HTMLInputElement).value))"
              step="10"
            />
          </div>
          <div class="prop-group">
            <span class="label-fixed">Back:</span>
            <input 
              type="number" 
              class="prop-num-sm" 
              :value="radarBoundary.rearV"
              @change="updateRadarBoundary('rearV', Number(($event.target as HTMLInputElement).value))"
              step="10"
            />
          </div>
          <label class="checkbox-label-sm">
            <input 
              type="checkbox" 
              :checked="radarShowSignal"
              @change="updateRadarShowSignal(($event.target as HTMLInputElement).checked)"
            />
            <span>Signal</span>
          </label>
        </div>
        
        <!-- statusMessage 显示在雷达边界下方 -->
        <div class="prop-row" style="margin-bottom: 6px;">
          <div class="prop-group" style="flex: 1;">
            <textarea 
              class="device-info-text" 
              :value="deviceStatusMessage"
              readonly
              rows="4"
              placeholder="StatusMessage"
            ></textarea>
          </div>
        </div>
      </template>
      
      <!-- Sleepad设备专用配置 -->
      <template v-if="isSleepadDevice">
        <!-- statusMessage 显示 -->
        <div class="prop-row" style="margin-bottom: 6px;">
          <div class="prop-group" style="flex: 1;">
            <textarea 
              class="device-info-text" 
              :value="deviceStatusMessage"
              readonly
              rows="2"
              placeholder="StatusMessage"
            ></textarea>
          </div>
        </div>
      </template>
      
      <!-- Sensor设备专用配置 -->
      <template v-if="isSensorDevice">
        <!-- statusMessage 显示 -->
        <div class="prop-row" style="margin-bottom: 6px;">
          <div class="prop-group" style="flex: 1;">
            <textarea 
              class="device-info-text" 
              :value="deviceStatusMessage"
              readonly
              rows="2"
              placeholder="StatusMessage"
            ></textarea>
          </div>
        </div>
      </template>
    </div>

    <div class="control-area">
      <div class="coord-checkbox-row">
        <div class="checkboxes">
          <label class="control-item">
            <input 
              type="checkbox" 
              :checked="selectedObject?.interactive?.locked || false"
              @change="toggleLock"
              :disabled="!selectedObject"
            />
            🔒
          </label>
          <label class="control-item">
            <input 
              type="checkbox" 
              :checked="canvasStore.showScale"
              @change="canvasStore.toggleScale"
            />
            📏
          </label>
          <label class="control-item">
            <input 
              type="checkbox" 
              :checked="canvasStore.showGrid"
              @change="canvasStore.toggleGrid"
            />
            #️⃣
          </label>
        </div>
        <div class="coordinates">
          <div class="coord-item">
            <span>X:</span>
            <span class="coord-value">{{ objCoordinates.x }}</span>
          </div>
          <div class="coord-item">
            <span>Y:</span>
            <span class="coord-value">{{ objCoordinates.y }}</span>
          </div>
        </div>
      </div>

      <div class="direction-rotation-row">
        <div class="direction-btns">
          <button class="dir-btn" @click="moveObject(0, -5)" :disabled="!selectedObject || selectedObject?.interactive?.locked">↑</button>
          <div class="middle-row">
            <button class="dir-btn" @click="moveObject(-5, 0)" :disabled="!selectedObject || selectedObject?.interactive?.locked">←</button>
            <button class="dir-btn" @click="moveObject(5, 0)" :disabled="!selectedObject || selectedObject?.interactive?.locked">→</button>
          </div>
          <button class="dir-btn" @click="moveObject(0, 5)" :disabled="!selectedObject || selectedObject?.interactive?.locked">↓</button>
        </div>
        
        <div class="rotation-btns">
          <div class="rot-row">
            <button class="rot-btn" @click="rotateObject(90)" :disabled="!selectedObject || selectedObject?.interactive?.locked">↺90°</button>
            <button class="rot-btn" @click="rotateObject(-90)" :disabled="!selectedObject || selectedObject?.interactive?.locked">↻90°</button>
          </div>
          <div class="rot-row">
            <button class="rot-btn" @click="rotateObject(10)" :disabled="!selectedObject || selectedObject?.interactive?.locked">↺10°</button>
            <button class="rot-btn" @click="rotateObject(-10)" :disabled="!selectedObject || selectedObject?.interactive?.locked">↻10°</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue';
import { useCanvasStore } from '@/stores/canvas';
import { useObjectsStore } from '@/stores/objects';
import { FURNITURE_CONFIGS } from '@/utils/types';
import { RADAR_DEFAULT_CONFIG } from '@/utils/types';
import {
  convertInstallModel,
  convertHeight,
  convertBoundary,
  convertArea,
  deleteArea,
  buildMqttUpdateCommand,
  buildMqttReadCommand,
  getAllRadarConfigKeys,
  parseMqttReadResponse,
  type MqttKeyValue
} from '../config/radarMqttConfig';

const canvasStore = useCanvasStore();
const objectsStore = useObjectsStore();

// 外部回调接口（由外部系统提供）
const mqttCallbacks = inject<{
  sendCommand?: (deviceId: string, commandData: Record<string, any>) => Promise<{
    success: boolean;
    data?: Record<string, any>;
    error?: string;
  }>;
  queryDevice?: (deviceId: string) => Promise<{
    success: boolean;
    data?: Record<string, any>;
    error?: string;
  }>;
}>('externalCallbacks', {});

// 绘图工具状态
const activeTool = ref<string | null>(null);
const activeLineWidth = ref(2); // 默认中等线宽
const activeColor = ref<string | null>(null); // 默认不选择颜色（使用物体默认色）
const activeFurniture = ref<string | null>(null); // 当前选中的家具类型
const activeDevice = ref<string | null>(null); // 当前选中的设备类型

// 监听canvasStore的状态变化，当双击重置时，清除Toolbar的选中状态
watch(
  () => [canvasStore.drawingMode, canvasStore.pendingObjectType, objectsStore.selectedId],
  ([mode, pending, selected]) => {
    // 当mode和pending都为null且没有选中对象时（表示双击重置），清除Toolbar的选中状态
    if (mode === null && pending === null && selected === null) {
      activeTool.value = null;
      activeFurniture.value = null;
      activeDevice.value = null;
      activeColor.value = null;
      console.log('🔄 Toolbar状态已重置');
    }
  }
);

// 监听选中对象变化，自动高亮对应的按钮
watch(
  () => objectsStore.selectedObject,
  (obj) => {
    if (!obj) {
      // 没有选中对象时，不清除按钮状态（保持用户选择）
      return;
    }
    
    const typeName = obj.typeName;
    
    // 检查是否是IoT设备
    if (obj.device?.category === 'iot') {
      activeDevice.value = typeName;
      activeFurniture.value = null;
      activeTool.value = null;
      console.log('🔵 高亮设备按钮:', typeName);
    } 
    // 检查是否是家具/结构
    else if (obj.device?.category === 'furniture' || obj.device?.category === 'structure') {
      activeFurniture.value = typeName;
      activeDevice.value = null;
      activeTool.value = null;
      
      // 如果家具有颜色，更新活动颜色（同步颜色按钮）
      if (obj.visual?.color) {
        activeColor.value = obj.visual.color;
        console.log('🎨 同步对象颜色:', obj.visual.color);
      }
      console.log('🔵 高亮家具按钮:', typeName);
    }
  },
  { deep: true }
);

// 导出绘图参数供 Canvas 使用
const getDrawingParams = () => ({
  color: activeColor.value || '#8c8c8c', // 如果没选颜色，默认gray
  lineWidth: activeLineWidth.value
});

// 全局导出（供 Canvas 访问）
(window as any).__toolbarDrawingParams = getDrawingParams;

// 颜色映射
const colorMap = {
  red: '#ff4d4f',
  yellow: '#fadb14',
  green: '#52c41a',
  blue: '#6bb9d3',      // 浅蓝色
  black: '#000000',
  gray: '#d3d3d3',      // 浅灰色 (Light Gray)
  orange: '#ff8c00',
  brown: '#c19a6b',     // 浅棕色 (Light Brown)
  silver: '#a8c5a8',    // 灰绿色 (更灰的绿色)
  white: '#ffffff'
};

// 选中的对象
const selectedObject = computed(() => {
  if (!objectsStore.selectedId) return null;
  return objectsStore.objects.find(obj => obj.id === objectsStore.selectedId);
});

// 判断是否为设备
const isIotDevice = computed(() => {
  return selectedObject.value?.device?.category === 'iot';
});

// 判断是否为雷达设备
const isRadarDevice = computed(() => {
  return isIotDevice.value && selectedObject.value?.typeName === 'Radar';
});

// 是否可以绑定（bed/monitorBed或IoT设备）
const canBind = computed(() => {
  if (!selectedObject.value) return false;
  const typeName = selectedObject.value.typeName;
  return typeName === 'Bed' || typeName === 'MonitorBed' || isIotDevice.value;
});

// 对象是否已绑定
const isObjectBinded = computed(() => {
  return !!selectedObject.value?.bindedDeviceId;
});

// 获取未绑定的设备列表
const unbindedDevices = computed(() => {
  const params = canvasStore.params;
  if (!params) return [];
  
  // 获取所有已绑定的deviceId
  const bindedIds = new Set(
    objectsStore.objects
      .filter(obj => obj.bindedDeviceId)
      .map(obj => obj.bindedDeviceId)
  );
  
  // 过滤出未绑定的设备
  return params.devices.filter(device => !bindedIds.has(device.deviceId));
});

// 判断是否为Sleepad设备
const isSleepadDevice = computed(() => {
  return isIotDevice.value && selectedObject.value?.typeName === 'Sleepad';
});

// 判断是否为Sensor设备
const isSensorDevice = computed(() => {
  return isIotDevice.value && selectedObject.value?.typeName === 'Sensor';
});

// 查询相关状态
const isQuerying = ref(false);
const isReading = ref(false);
const isWriting = ref(false);
const showSettings = ref(false);

// 雷达配置备份（用于Cancel功能）
const radarConfigBackup = ref<any>(null);

// IoT 设备信息显示（显示 statusMessage）
const deviceStatusMessage = computed(() => {
  if (!selectedObject.value || !isIotDevice.value) {
    return '';
  }
  const device = selectedObject.value.device?.iot;
  if (!device) return '';
  
  // 直接返回 statusMessage 内容
  return device.statusMessage || '';
});

// 属性编辑 - Name
const objName = computed({
  get: () => selectedObject.value?.name || '',
  set: (val: string) => {
    if (selectedObject.value) {
      objectsStore.updateObject(selectedObject.value.id, { name: val });
    }
  }
});

// 属性编辑 - Reflect（反射率） - 暂时存储在 visual 中
const objReflect = computed({
  get: () => (selectedObject.value?.visual as any)?.reflect || 50,
  set: (val: number) => {
    if (selectedObject.value) {
      objectsStore.updateObject(selectedObject.value.id, {
        visual: { ...selectedObject.value.visual, reflect: val } as any
      });
    }
  }
});

// 几何属性计算
const geometryProps = computed(() => {
  if (!selectedObject.value) return { L: 0, W: 0, H: 0, R: 0, radius: 0, sector: 360 };
  
  const geo = selectedObject.value.geometry;
  let L = 0, W = 0, H = 0, R = 0, radius = 0, sector = 360;
  
  switch (geo.type) {
    case 'line':
      // 线段：计算长度和深度（thickness，对于线段显示为线宽）
      L = Math.sqrt(
        Math.pow(geo.data.end.x - geo.data.start.x, 2) +
        Math.pow(geo.data.end.y - geo.data.start.y, 2)
      );
      W = geo.data.thickness || 2; // 线段深度（实际为线宽/厚度）
      H = (geo.data.start as any).z || (geo.data.end as any).z || 0;
      break;
    case 'rectangle':
      if (geo.data.vertices && geo.data.vertices.length >= 4) {
        L = Math.abs(geo.data.vertices[1].x - geo.data.vertices[0].x);
        W = Math.abs(geo.data.vertices[2].y - geo.data.vertices[0].y);
        H = geo.data.vertices[0].z || 0;
      }
      break;
    case 'circle':
      radius = geo.data.radius || 0;
      H = (geo.data as any).z || 0; // 圆形高度（z坐标）
      break;
    case 'sector':
      radius = geo.data.radius || 0;
      H = (geo.data as any).z || 0; // 扇形高度（z坐标）
      // 计算扇形角度
      if (geo.data.leftPoint && geo.data.rightPoint && geo.data.center) {
        const leftAngle = Math.atan2(
          geo.data.leftPoint.y - geo.data.center.y,
          geo.data.leftPoint.x - geo.data.center.x
        );
        const rightAngle = Math.atan2(
          geo.data.rightPoint.y - geo.data.center.y,
          geo.data.rightPoint.x - geo.data.center.x
        );
        let angleDiff = rightAngle - leftAngle;
        if (angleDiff < 0) angleDiff += 2 * Math.PI;
        sector = Math.round(angleDiff * (180 / Math.PI));
      }
      break;
  }
  
  R = selectedObject.value.angle || 0;
  
  return { L: Math.round(L), W: Math.round(W), H, R: Math.round(R), radius: Math.round(radius), sector };
});

// 更新几何属性
const updateGeometry = (prop: string, value: number) => {
  if (!selectedObject.value) return;
  
  const obj = selectedObject.value;
  const geo = obj.geometry;
  
  if (prop === 'R') {
    // 更新旋转角度
    objectsStore.updateObject(obj.id, { angle: value });
    return;
  }
  
  // 更新几何数据
  switch (geo.type) {
    case 'line':
      if (prop === 'L') {
        // 更新线段长度：保持方向和深度（线宽），改变长度
        const currentLength = Math.sqrt(
          Math.pow(geo.data.end.x - geo.data.start.x, 2) +
          Math.pow(geo.data.end.y - geo.data.start.y, 2)
        );
        if (currentLength === 0) return;
        const scale = value / currentLength;
        const dx = geo.data.end.x - geo.data.start.x;
        const dy = geo.data.end.y - geo.data.start.y;
        objectsStore.updateObject(obj.id, {
          geometry: {
            ...geo,
            data: {
              ...geo.data,
              end: {
                x: geo.data.start.x + dx * scale,
                y: geo.data.start.y + dy * scale
              }
            }
          }
        });
      } else if (prop === 'W') {
        // 更新线段深度（实际为线宽/厚度）
        objectsStore.updateObject(obj.id, {
          geometry: {
            ...geo,
            data: {
              ...geo.data,
              thickness: Math.max(1, value) // 最小深度（线宽）为1
            }
          }
        });
      }
      break;
    case 'rectangle':
      if (prop === 'L' || prop === 'W') {
        const vertices = geo.data.vertices;
        const centerX = (vertices[0].x + vertices[1].x) / 2;
        const centerY = (vertices[0].y + vertices[2].y) / 2;
        const newL = prop === 'L' ? value : Math.abs(vertices[1].x - vertices[0].x);
        const newW = prop === 'W' ? value : Math.abs(vertices[2].y - vertices[0].y);
        
        objectsStore.updateObject(obj.id, {
          geometry: {
            ...geo,
            data: {
              vertices: [
                { x: centerX - newL / 2, y: centerY - newW / 2, z: vertices[0].z },
                { x: centerX + newL / 2, y: centerY - newW / 2, z: vertices[1].z },
                { x: centerX - newL / 2, y: centerY + newW / 2, z: vertices[2].z },
                { x: centerX + newL / 2, y: centerY + newW / 2, z: vertices[3].z }
              ]
            }
          }
        });
      }
      break;
    case 'circle':
      if (prop === 'radius') {
        objectsStore.updateObject(obj.id, {
          geometry: {
            ...geo,
            data: { ...geo.data, radius: value }
          }
        });
      }
      break;
    case 'sector':
      if (prop === 'radius' || prop === 'sector') {
        const center = geo.data.center;
        const currentRadius = geo.data.radius || 0;
        const newRadius = prop === 'radius' ? value : currentRadius;
        
        // 计算当前中心角度
        const leftAngle = Math.atan2(
          geo.data.leftPoint.y - center.y,
          geo.data.leftPoint.x - center.x
        );
        const rightAngle = Math.atan2(
          geo.data.rightPoint.y - center.y,
          geo.data.rightPoint.x - center.x
        );
        const currentAngle = (leftAngle + rightAngle) / 2;
        
        // 计算新的扇形角度
        const newSectorAngle = prop === 'sector' ? value : geometryProps.value.sector;
        const halfAngle = (newSectorAngle / 2) * (Math.PI / 180);
        
        objectsStore.updateObject(obj.id, {
          geometry: {
            ...geo,
            data: {
              center,
              leftPoint: {
                x: center.x + newRadius * Math.cos(currentAngle - halfAngle),
                y: center.y + newRadius * Math.sin(currentAngle - halfAngle)
              },
              rightPoint: {
                x: center.x + newRadius * Math.cos(currentAngle + halfAngle),
                y: center.y + newRadius * Math.sin(currentAngle + halfAngle)
              },
              radius: newRadius
            }
          }
        });
      }
      break;
  }
};

// 绘图工具点击（切换模式）
const selectDrawTool = (tool: 'line' | 'rect' | 'sector' | 'circle') => {
  // 必须先选中家具才能使用绘图工具
  if (!activeFurniture.value) {
    console.log('⚠️ 请先选择家具，然后才能选择绘图工具');
    return;
  }
  
  // 清除当前对象的选中状态
  objectsStore.selectObject(null);
  
  if (activeTool.value === tool) {
    // 再次点击同一工具，取消绘图模式
    activeTool.value = null;
    canvasStore.setDrawingMode(null);
    // 不清除 pendingObjectType，保持当前家具类型
  } else {
    // 点击新工具，激活绘图模式
    activeTool.value = tool;
    canvasStore.setDrawingMode(tool);
    // 保持当前选中的家具类型，不改变为 Other
    canvasStore.setPendingObjectType(activeFurniture.value);
    // 使用家具的默认颜色（如果还没有选择颜色）
    if (!activeColor.value && activeFurniture.value) {
      const furnitureConfig = FURNITURE_CONFIGS[activeFurniture.value as keyof typeof FURNITURE_CONFIGS];
      if (furnitureConfig) {
        activeColor.value = furnitureConfig.color;
      }
    }
    // 不清除家具选中状态，保持 activeFurniture
    activeDevice.value = null; // 只清除设备选中
    console.log('🎨 绘图工具激活:', tool, '家具类型:', activeFurniture.value);
  }
};

// 切换透明模式（仅显示边框）
const toggleTransparent = (event: Event) => {
  const checked = (event.target as HTMLInputElement).checked;
  const selectedObj = objectsStore.selectedObject;
  if (selectedObj && selectedObj.device?.category !== 'iot') {
    objectsStore.updateObject(selectedObj.id, {
      visual: {
        ...selectedObj.visual,
        transparent: checked
      }
    });
    console.log('🎨 切换透明模式:', selectedObj.name || selectedObj.typeName, checked ? '仅边框' : '填充');
  }
};

// 切换锁定状态
const toggleLock = (event: Event) => {
  const checked = (event.target as HTMLInputElement).checked;
  const selectedObj = objectsStore.selectedObject;
  if (selectedObj) {
    if (!selectedObj.interactive) {
      (selectedObj as any).interactive = { selected: false, locked: false };
    }
    objectsStore.updateObject(selectedObj.id, {
      interactive: {
        ...selectedObj.interactive,
        locked: checked
      }
    });
    console.log(checked ? '🔒 对象已锁定' : '🔓 对象已解锁');
  }
};

// 颜色选择
const selectColor = (color: keyof typeof colorMap) => {
  // 必须先选中家具才能使用颜色选择
  if (!activeFurniture.value) {
    console.log('⚠️ 请先选择家具，然后才能选择颜色');
    return;
  }
  
  const newColor = colorMap[color];
  activeColor.value = newColor;
  
  // 如果选中了对象，更新对象的颜色（不清除选中状态）
  const selectedObj = objectsStore.selectedObject;
  if (selectedObj && selectedObj.device?.category !== 'iot') {
    // 只更新非IoT设备的颜色
    objectsStore.updateObject(selectedObj.id, {
      visual: {
        ...selectedObj.visual,
        color: newColor
      }
    });
    console.log('🎨 更新对象颜色:', selectedObj.name || selectedObj.typeName, '→', newColor);
  }
};

// 家具选择（自动激活对应绘图工具，使用默认颜色）
const selectFurniture = (type: string) => {
  // 清除当前对象的选中状态
  objectsStore.selectObject(null);
  
  // 根据家具类型自动选择绘图工具
  const toolMap: Record<string, string> = {
    'Bed': 'rect',
    'Enter': 'rect',
    'Interfere': 'rect',
    'Wall': 'line',
    'Furniture': 'rect',
    'Curtain': 'rect',
    'GlassTV': 'rect',
    'Table': 'rect',
    'Chair': 'rect',
    'Other': 'rect',
    'MetalCan': 'rect',
    'WheelChair': 'rect'
  };
  
  const tool = toolMap[type] || 'rect';
  activeTool.value = tool;
  activeFurniture.value = type; // 设置选中的家具
  activeDevice.value = null; // 清除设备选中
  canvasStore.setDrawingMode(tool);
  canvasStore.setPendingObjectType(type);
  
  // 使用家具的默认颜色（不管用户是否选择了颜色）
  const furnitureConfig = FURNITURE_CONFIGS[type as keyof typeof FURNITURE_CONFIGS];
  if (furnitureConfig) {
    activeColor.value = furnitureConfig.color;
    console.log(`🪑 选中家具类型: ${type}，激活绘图工具: ${tool}，使用默认颜色: ${furnitureConfig.color}`);
  } else {
    // 如果没有预设，使用gray作为默认颜色
    if (!activeColor.value) {
      activeColor.value = colorMap.gray;
    }
    console.log(`🪑 选中家具类型: ${type}，激活绘图工具: ${tool}`);
  }
};

// IoT设备添加（直接创建）
const addDevice = (type: string) => {
  // 清除当前对象的选中状态
  objectsStore.selectObject(null);
  
  activeDevice.value = type; // 设置选中的设备
  activeFurniture.value = null; // 清除家具选中
  activeTool.value = null; // 清除绘图工具选中
  canvasStore.setDrawingMode(null); // 清除绘图模式
  
  
  // 不直接创建，而是设置待放置状态
  canvasStore.setPendingObjectType(type);
  console.log(`📍 准备放置设备: ${type}，请在画布上点击放置位置`);
  
  /* 旧的直接创建逻辑
  const deviceId = `${type.toLowerCase()}_${Date.now()}`;
  const newDevice: any = {
    id: deviceId,
    typeName: type,
    name: type,
    geometry: {
      type: 'point',
      data: {
        x: 0,  // 画布中心
        y: 100, // 稍微偏下
        z: 280  // 默认高度
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
        deviceId: deviceId,
        isOnline: true,
        installModel: 'ceiling',
        communication: 'wifi'
      }
    },
    interactive: {
      selected: true,
      locked: false
    },
    angle: 0
  };
  
  objectsStore.addObject(newDevice);
  console.log(`✅ 创建设备: ${type}`, newDevice);
  */
};

// 删除对象
const deleteObject = () => {
  if (objectsStore.selectedId) {
    objectsStore.removeObject(objectsStore.selectedId);
  }
};

// 更新设备属性
const updateDeviceProp = (prop: string, value: any) => {
  if (!selectedObject.value || !selectedObject.value.device?.iot) return;
  
  const iot = selectedObject.value.device.iot;
  
  // 特殊处理：切换installModel时，应用默认配置（高度、边界等）
  if (prop === 'installModel' && isRadarDevice.value) {
    const defaultConfig = RADAR_DEFAULT_CONFIG[value as 'ceiling' | 'wall' | 'corn'];
    
    if (defaultConfig) {
      // 更新高度（z坐标）
      const geo = selectedObject.value.geometry;
      if (geo.type === 'point') {
        objectsStore.updateObject(selectedObject.value.id, {
          geometry: {
            ...geo,
            data: {
              ...geo.data,
              z: defaultConfig.height
            }
          }
        });
      }
      
      // 更新雷达配置（边界、hfov、vfov等）
      const currentRadar = iot.radar || {};
      const updatedRadar = {
        ...currentRadar,
        hfov: defaultConfig.hfov,
        vfov: defaultConfig.vfov,
        boundary: { ...defaultConfig.boundary },
        // 信号区域配置（所有模式都有）
        ...('signalRadius' in defaultConfig ? {
          signalRadius: (defaultConfig as any).signalRadius
        } : {}),
        ...('signalAngle' in defaultConfig ? {
          signalAngle: (defaultConfig as any).signalAngle
        } : {})
      };
      
      const updatedRadarWithModel = {
        ...updatedRadar,
        installModel: value
      };
      
      const updatedIot = {
        ...iot,
        radar: updatedRadarWithModel
      };
      
      objectsStore.updateObject(selectedObject.value.id, {
        device: {
          ...selectedObject.value.device,
          iot: updatedIot
        }
      });
      
      console.log(`🔧 切换雷达模式为 ${value}，已应用默认配置:`, defaultConfig);
      return;
    }
  }
  
  // 处理嵌套属性（radar, sleepad等）
  if (prop === 'radar' || prop === 'sleepad' || prop === 'sensor') {
    const updatedIot = {
      ...iot,
      [prop]: value
    };
    
    objectsStore.updateObject(selectedObject.value.id, {
      device: {
        ...selectedObject.value.device,
        iot: updatedIot
      }
    });
  } else if ((prop === 'installModel' || prop === 'workModel') && isRadarDevice.value) {
    // installModel 和 workModel 属于 radar 属性
    const currentRadar = iot.radar || {};
    const updatedRadar = {
      ...currentRadar,
      [prop]: value
    };
    
    const updatedIot = {
      ...iot,
      radar: updatedRadar
    };
    
    objectsStore.updateObject(selectedObject.value.id, {
      device: {
        ...selectedObject.value.device,
        iot: updatedIot
      }
    });
  } else {
    // 处理直接属性（deviceId, isOnline, statusMessage等）
    const updatedIot = {
      ...iot,
      [prop]: value
    };
    
    objectsStore.updateObject(selectedObject.value.id, {
      device: {
        ...selectedObject.value.device,
        iot: updatedIot
      }
    });
  }
  
  console.log(`🔧 更新设备属性 ${prop}:`, value);
};

// 对象坐标
const objCoordinates = computed(() => {
  if (!selectedObject.value) return { x: 0, y: 0 };
  
  const geo = selectedObject.value.geometry;
  
  switch (geo.type) {
    case 'point':
      // IoT设备：设备位置
      return { x: Math.round(geo.data.x || 0), y: Math.round(geo.data.y || 0) };
    case 'rectangle':
      // 矩形：左上角（P1）顶点
      if (geo.data.vertices && geo.data.vertices.length >= 4) {
        const leftTop = geo.data.vertices[0]; // 左上角
        return { x: Math.round(leftTop.x), y: Math.round(leftTop.y) };
      }
      break;
    case 'circle':
    case 'sector':
      // 圆形/扇形：圆心
      if (geo.data.center) {
        return { x: Math.round(geo.data.center.x), y: Math.round(geo.data.center.y) };
      }
      break;
    case 'line':
      // 线段：起点
      if (geo.data.start) {
        return { x: Math.round(geo.data.start.x), y: Math.round(geo.data.start.y) };
      }
      break;
  }
  
  return { x: 0, y: 0 };
});

// 移动对象
const moveObject = (dx: number, dy: number) => {
  if (!selectedObject.value) return;
  
  // 检查是否锁定
  if (selectedObject.value.interactive?.locked) {
    console.log('⚠️ 对象已锁定，无法移动');
    return;
  }
  
  const obj = selectedObject.value;
  const geo = obj.geometry;
  
  switch (geo.type) {
    case 'point':
      objectsStore.updateObject(obj.id, {
        geometry: {
          ...geo,
          data: {
            ...geo.data,
            x: (geo.data.x || 0) + dx,
            y: (geo.data.y || 0) + dy
          }
        }
      });
      break;
      
    case 'rectangle':
      if (geo.data.vertices && geo.data.vertices.length >= 4) {
        const newVertices = geo.data.vertices.map((v: any) => ({
          x: v.x + dx,
          y: v.y + dy,
          z: v.z
        })) as [any, any, any, any];
        objectsStore.updateObject(obj.id, {
          geometry: {
            ...geo,
            data: { vertices: newVertices }
          }
        });
      }
      break;
      
    case 'circle':
      objectsStore.updateObject(obj.id, {
        geometry: {
          ...geo,
          data: {
            ...geo.data,
            center: {
              x: geo.data.center.x + dx,
              y: geo.data.center.y + dy
            }
          }
        }
      });
      break;
      
    case 'sector':
      objectsStore.updateObject(obj.id, {
        geometry: {
          ...geo,
          data: {
            center: {
              x: geo.data.center.x + dx,
              y: geo.data.center.y + dy
            },
            leftPoint: {
              x: geo.data.leftPoint.x + dx,
              y: geo.data.leftPoint.y + dy
            },
            rightPoint: {
              x: geo.data.rightPoint.x + dx,
              y: geo.data.rightPoint.y + dy
            },
            radius: geo.data.radius
          }
        }
      });
      break;
      
    case 'line':
      objectsStore.updateObject(obj.id, {
        geometry: {
          ...geo,
          data: {
            start: {
              x: geo.data.start.x + dx,
              y: geo.data.start.y + dy
            },
            end: {
              x: geo.data.end.x + dx,
              y: geo.data.end.y + dy
            },
            thickness: geo.data.thickness
          }
        }
      });
      break;
  }
  
  console.log(`📦 移动对象 ${obj.name} by (${dx}, ${dy})`);
};

// 旋转对象
const rotateObject = (angleDelta: number) => {
  if (!selectedObject.value) return;
  
  // 检查是否锁定
  if (selectedObject.value.interactive?.locked) {
    console.log('⚠️ 对象已锁定，无法旋转');
    return;
  }
  
  const currentAngle = selectedObject.value.angle || 0;
  // angleDelta: 正值为逆时针，负值为顺时针
  // 转换为逆时针360度值（0-360）
  let newAngle = currentAngle + angleDelta;
  
  // 规范化角度到 0-360 范围
  while (newAngle < 0) newAngle += 360;
  while (newAngle >= 360) newAngle -= 360;
  
  objectsStore.updateObject(selectedObject.value.id, { angle: newAngle });
  
  console.log(`🔄 旋转对象 ${selectedObject.value.name} to ${newAngle}° (逆时针)`);
  
  // 如果是雷达，旋转后输出区域信息
  if (selectedObject.value.typeName === 'Radar') {
    // 等待一下让区域更新完成
    setTimeout(() => {
      objectsStore.logRadarAreas(selectedObject.value!.id);
    }, 100);
  }
};

// ================ 雷达设备配置 ================
// 雷达工作模式
const radarWorkMode = computed({
  get: () => selectedObject.value?.device?.iot?.radar?.workModel || 'vital',
  set: (val) => updateDeviceProp('workModel', val)
});

// 雷达工作模式显示（只读显示，首字母大写）
const radarWorkModeDisplay = computed(() => {
  const mode = radarWorkMode.value;
  if (!mode) return 'Vital';
  // 首字母大写
  return mode.charAt(0).toUpperCase() + mode.slice(1);
});

// 更新雷达工作模式
const updateRadarWorkMode = (mode: 'fall' | 'vital' | 'all') => {
  updateDeviceProp('workModel', mode);
};

// 雷达倾斜角度显示（TiltAngle）- 直接显示陀螺仪原始值
const radarTiltAngle = computed(() => {
  if (!selectedObject.value || !isRadarDevice.value) {
    return '--';
  }
  
  // 从雷达配置中读取 accelera 原始值
  const accelera = selectedObject.value.device?.iot?.radar?.accelera;
  if (accelera) {
    return accelera;  // 直接显示原始格式：36.74:9.97:-38.52:0
  }
  
  return '--';  // 未查询时显示--
});

// 雷达高度
const radarHeight = computed(() => {
  if (!selectedObject.value || !isRadarDevice.value) {
    // 返回wall模式的默认高度
    return RADAR_DEFAULT_CONFIG.wall.height;
  }
  const currentHeight = (selectedObject.value.geometry.data as any).z;
  if (currentHeight !== undefined && currentHeight !== null) {
    return currentHeight;
  }
  // 如果没有设置高度，使用当前模式的默认高度
  const installModel = selectedObject.value.device?.iot?.radar?.installModel || 'wall';
  return RADAR_DEFAULT_CONFIG[installModel as keyof typeof RADAR_DEFAULT_CONFIG]?.height || RADAR_DEFAULT_CONFIG.wall.height;
});

const updateRadarHeight = (height: number) => {
  if (!selectedObject.value || !isRadarDevice.value) return;
  // 精度检查：舍入到10的倍数
  const roundedHeight = Math.round(height / 10) * 10;
  const geo = selectedObject.value.geometry;
  if (geo.type === 'point') {
    objectsStore.updateObject(selectedObject.value.id, {
      geometry: {
        ...geo,
        data: {
          ...geo.data,
          z: roundedHeight
        }
      }
    });
  }
};

// 雷达旋转角度
const radarRotationAngle = computed(() => {
  if (!selectedObject.value || !isRadarDevice.value) {
    return 0;
  }
  return selectedObject.value.angle || 0;
});

const updateRadarRotationAngle = (angle: number) => {
  if (!selectedObject.value || !isRadarDevice.value) return;
  // 确保角度在0-360范围内
  let normalizedAngle = angle;
  while (normalizedAngle < 0) normalizedAngle += 360;
  while (normalizedAngle >= 360) normalizedAngle -= 360;
  objectsStore.updateObject(selectedObject.value.id, { angle: normalizedAngle });
};

// 雷达边界
const radarBoundary = computed(() => {
  if (!selectedObject.value || !isRadarDevice.value) {
    // 返回wall模式的默认边界
    return RADAR_DEFAULT_CONFIG.wall.boundary;
  }
  const currentBoundary = selectedObject.value.device?.iot?.radar?.boundary;
  if (currentBoundary) {
    return currentBoundary;
  }
  // 如果没有设置边界，使用当前模式的默认边界
  const installModel = selectedObject.value.device?.iot?.radar?.installModel || 'wall';
  const defaultConfig = RADAR_DEFAULT_CONFIG[installModel as keyof typeof RADAR_DEFAULT_CONFIG];
  return defaultConfig?.boundary || RADAR_DEFAULT_CONFIG.wall.boundary;
});

const updateRadarBoundary = (key: 'leftH' | 'rightH' | 'frontV' | 'rearV', value: number) => {
  if (!selectedObject.value || !isRadarDevice.value) return;
  // 精度检查：舍入到10的倍数
  const roundedValue = Math.round(value / 10) * 10;
  const current = radarBoundary.value;
  const newBoundary = { ...current, [key]: roundedValue };
  
  // 确保radar对象存在
  const iot = selectedObject.value.device?.iot || {};
  const radar = iot.radar || { showBoundary: false, showSignal: false };
  
  updateDeviceProp('radar', {
    ...radar,
    boundary: newBoundary
  });
};

// 雷达显示边界
const radarShowBoundary = computed({
  get: () => {
    if (!selectedObject.value || !isRadarDevice.value) return true; // 默认显示边界
    const showBoundary = selectedObject.value.device?.iot?.radar?.showBoundary;
    // 如果未设置，默认返回true（显示边界）
    return showBoundary !== undefined ? showBoundary : true;
  },
  set: (val) => {
    if (!selectedObject.value || !isRadarDevice.value) return;
    const iot = selectedObject.value.device?.iot || {};
    const radar = iot.radar || { boundary: radarBoundary.value, showSignal: false };
    updateDeviceProp('radar', { ...radar, showBoundary: val });
  }
});

const updateRadarShowBoundary = (show: boolean) => {
  radarShowBoundary.value = show;
};

// 雷达显示信号
const radarShowSignal = computed({
  get: () => selectedObject.value?.device?.iot?.radar?.showSignal || false,
  set: (val) => {
    if (!selectedObject.value || !isRadarDevice.value) return;
    const iot = selectedObject.value.device?.iot || {};
    const radar = iot.radar || { boundary: radarBoundary.value, showBoundary: false };
    updateDeviceProp('radar', { ...radar, showSignal: val });
  }
});

const updateRadarShowSignal = (show: boolean) => {
  radarShowSignal.value = show;
};

// ================ Sleepad设备配置 ================
const sleepadBedId = computed({
  get: () => selectedObject.value?.device?.iot?.sleepad?.monitoringBedId || '',
  set: (val) => {
    if (!selectedObject.value || !isSleepadDevice.value) return;
    const iot = selectedObject.value.device?.iot || {};
    const sleepad = iot.sleepad || { status: 'pad unlink' };
    updateDeviceProp('sleepad', { ...sleepad, monitoringBedId: val });
  }
});

const updateSleepadBedId = (bedId: string) => {
  sleepadBedId.value = bedId;
};

const sleepadStatus = computed({
  get: () => selectedObject.value?.device?.iot?.sleepad?.status || 'pad unlink',
  set: (val) => updateSleepadStatus(val as any)
});

const updateSleepadStatus = (status: 'pad unlink' | 'sensior fall_down' | 'error') => {
  if (!selectedObject.value || !isSleepadDevice.value) return;
  const iot = selectedObject.value.device?.iot || {};
  const sleepad = iot.sleepad || { monitoringBedId: '' };
  updateDeviceProp('sleepad', { ...sleepad, status });
};

// ================ 设备操作 ================
// 查询设备配置
const queryDevice = async () => {
  if (!selectedObject.value || !isIotDevice.value) return;
  
  isQuerying.value = true;
  
  try {
    // 模拟API调用，从雷达读取配置
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟从硬件读取的数据（包括设备信息）
    const mockData = {
      // 配置信息
      installModel: 'wall',
      workModel: 'vital',
      boundary: { leftH: 300, rightH: 300, frontV: 400, rearV: 0 },
      accelera: '36.74:9.97:-38.52:0',  // 陀螺仪数据：Roll:Pitch:Yaw:calibrated
      // 设备信息
      macAddress: '00:1A:2B:3C:4D:5E',
      ipAddress: '192.168.1.100',
      SerialNumber: 'RD2024001',
      DeviceModel: 'Radar-Pro-V2',
      DeviceCode: 'RD-PRO-2024',
      IMEI: '123456789012345',
      firmwareVersion: 'v2.1.0',
      hardwareVersion: 'v1.5',
      communication: 'wifi' as const
    };
    
    // 备份当前配置（用于Cancel）
    radarConfigBackup.value = {
      installModel: selectedObject.value.device?.iot?.radar?.installModel,
      workModel: selectedObject.value.device?.iot?.radar?.workModel,
      boundary: selectedObject.value.device?.iot?.radar?.boundary
    };
    
    // 保存baseline（查询快照，用于IoTSave时对比）
    const baseline = {
      installModel: mockData.installModel,
      workModel: mockData.workModel,
      height: (selectedObject.value.geometry.data as any).z || mockData.boundary.frontV,
      boundary: { ...mockData.boundary },
      areas: selectedObject.value.device?.iot?.radar?.areas || [],
      queriedAt: new Date().toISOString()
    };
    
    // 更新配置到UI（包括baseline）
    updateDeviceProp('installModel', mockData.installModel);
    updateDeviceProp('workModel', mockData.workModel);
    updateDeviceProp('radar', {
      ...selectedObject.value.device?.iot?.radar,
      boundary: mockData.boundary,
      accelera: mockData.accelera,  // 保存陀螺仪数据
      baseline: baseline             // 保存配置快照
    });
    
    // 更新 statusMessage（包含查询结果和设备信息）
    const queryInfo = [
      `Query Result:`,
      `installModel: ${mockData.installModel}`,
      `workModel: ${mockData.workModel}`,
      `boundary: L${mockData.boundary.leftH} R${mockData.boundary.rightH} F${mockData.boundary.frontV} B${mockData.boundary.rearV}`,
      ``,
      `Device Info:`,
      `MAC: ${mockData.macAddress}`,
      `IP: ${mockData.ipAddress}`,
      `SN: ${mockData.SerialNumber}`,
      `Model: ${mockData.DeviceModel}`,
      `FW: ${mockData.firmwareVersion}`
    ].join('\n');
    
    updateDeviceProp('statusMessage', queryInfo);
    
    console.log('📖 查询雷达配置成功:', mockData);
  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    isQuerying.value = false;
  }
};

// Cancel：放弃雷达配置修改，恢复之前的值
// SaveConfig：保存雷达配置，写入雷达
const saveConfig = async () => {
  if (!selectedObject.value || !isRadarDevice.value) return;
  
  try {
    const device = selectedObject.value;
    const radar = device.device?.iot?.radar;
    const baseline = radar?.baseline;
    
    // 1. 检查是否有baseline（必须先Query才能Save）
    if (!baseline || !baseline.queriedAt) {
      console.warn('⚠️ 未找到baseline配置，请先执行Query操作');
      alert('请先执行Query操作获取设备当前配置');
      return;
    }
    
    // 2. 获取当前配置（不包括workModel，由业务层管理）
    const currentConfig = {
      installModel: radar?.installModel,
      height: (device.geometry.data as any).z,
      boundary: radar?.boundary,
      areas: radar?.areas || [],
      rotation: device.angle || 0
    };
    
    // 3. 对比差异，生成命令列表
    const commands = generateConfigCommands(baseline, currentConfig, device.device?.iot?.deviceId);
    
    if (commands.length === 0) {
      console.log('✅ 配置无变化，无需写入');
      alert('配置无变化，无需保存');
      return;
    }
    
    // 4. 显示待执行的命令
    console.log('📝 待执行命令列表:', commands);
    const commandSummary = commands.map((cmd, idx) => 
      `${idx + 1}. ${cmd.description}`
    ).join('\n');
    
    const confirmed = confirm(
      `检测到以下配置变化，确认写入设备？\n\n${commandSummary}\n\n总共 ${commands.length} 条命令`
    );
    
    if (!confirmed) {
      console.log('❌ 用户取消保存');
      return;
    }
    
    // 5. 按顺序执行命令，等待服务器响应
    const executeResult = await executeRadarCommands(commands);
    
    // 6. 根据服务器返回结果，决定是否需要手动验证
    if (executeResult.allSuccess) {
      // 所有命令都成功执行，使用服务器返回值更新baseline
      console.log('✅ 所有命令执行成功');
      
      // 可选：如果需要双重验证，可以手动Query
      const needManualVerify = false; // 可配置
      
      if (needManualVerify) {
        console.log('🔍 执行手动验证（可选）...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        const verifyResult = await verifyRadarConfig(device.device?.iot?.deviceId, currentConfig);
        
        if (!verifyResult.success) {
          console.warn('⚠️ 手动验证发现问题，但服务器已确认写入');
          const failedItems = verifyResult.failures.map(f => `  - ${f}`).join('\n');
          alert(`配置已写入设备，但手动验证发现差异：\n\n${failedItems}`);
        }
      }
      
      // 更新baseline为当前配置（服务器已确认）
      updateDeviceProp('radar', {
        ...radar,
        baseline: {
          installModel: currentConfig.installModel,
          height: currentConfig.height,
          boundary: { ...currentConfig.boundary },
          areas: [...currentConfig.areas],
          queriedAt: new Date().toISOString()
        }
      });
      
      alert('配置保存成功！所有命令已执行。');
      
    } else {
      // 有命令执行失败
      console.error('❌ 部分命令执行失败');
      const failedCommands = executeResult.failures.map(f => `  - ${f.description}: ${f.error}`).join('\n');
      
      // 执行手动Query，获取设备真实状态
      console.log('🔍 执行手动Query，获取设备当前状态...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      const actualConfig = await QueryRadar(device.device?.iot?.deviceId);
      
      // 更新baseline为设备真实状态
      updateDeviceProp('radar', {
        ...radar,
        baseline: {
          installModel: actualConfig.installModel,
          height: actualConfig.height,
          boundary: { ...actualConfig.boundary },
          areas: [...actualConfig.areas],
          queriedAt: new Date().toISOString()
        }
      });
      
      alert(`部分配置写入失败：\n\n${failedCommands}\n\nbaseline已更新为设备当前状态。`);
    }
    
  } catch (error) {
    console.error('❌ 保存失败:', error);
    alert(`保存失败: ${error}`);
  }
};

// 对比配置差异，生成命令列表
interface RadarCommand {
  type: 'installModel' | 'height' | 'boundary' | 'area_add' | 'area_update' | 'area_delete';
  description: string;
  mqttKeyValues: MqttKeyValue[];  // MQTT格式的key/value数组
  deviceId: string;
  order: number;  // 执行顺序
}

const generateConfigCommands = (
  baseline: any, 
  current: any, 
  deviceId: string
): RadarCommand[] => {
  const commands: RadarCommand[] = [];
  
  // 命令执行顺序定义
  const ORDER = {
    installModel: 1,
    height: 2,
    boundary: 3,
    area_delete: 4,
    area_update: 5,
    area_add: 6
  };
  
  // 1. 检查 installModel 变化
  if (baseline.installModel !== current.installModel) {
    commands.push({
      type: 'installModel',
      description: `安装模式: ${baseline.installModel} → ${current.installModel}`,
      mqttKeyValues: [convertInstallModel(current.installModel)],
      deviceId,
      order: ORDER.installModel
    });
  }
  
  // 2. 检查 height 变化（差异超过1cm才触发）
  if (Math.abs((baseline.height || 0) - (current.height || 0)) > 1) {
    commands.push({
      type: 'height',
      description: `安装高度: ${baseline.height}cm → ${current.height}cm`,
      mqttKeyValues: [convertHeight(current.height)],
      deviceId,
      order: ORDER.height
    });
  }
  
  // 3. 检查 boundary 变化
  const boundaryChanged = baseline.boundary && current.boundary && (
    baseline.boundary.leftH !== current.boundary.leftH ||
    baseline.boundary.rightH !== current.boundary.rightH ||
    baseline.boundary.frontV !== current.boundary.frontV ||
    baseline.boundary.rearV !== current.boundary.rearV
  );
  
  if (boundaryChanged) {
    const b = baseline.boundary;
    const c = current.boundary;
    commands.push({
      type: 'boundary',
      description: `边界范围: L${b.leftH}/R${b.rightH}/F${b.frontV}/B${b.rearV} → L${c.leftH}/R${c.rightH}/F${c.frontV}/B${c.rearV}`,
      mqttKeyValues: convertBoundary(current.boundary),
      deviceId,
      order: ORDER.boundary
    });
  }
  
  // 4. 检查 areas 变化（区域配置）
  const baselineAreas = baseline.areas || [];
  const currentAreas = current.areas || [];
  
  // 找出删除的区域（优先删除）
  baselineAreas.forEach((area: any) => {
    const exists = currentAreas.find((c: any) => c.areaId === area.areaId);
    if (!exists) {
      commands.push({
        type: 'area_delete',
        description: `删除区域: Area ${area.areaId}`,
        mqttKeyValues: deleteArea(area.areaId),  // deleteArea 返回数组
        deviceId,
        order: ORDER.area_delete
      });
    }
  });
  
  // 找出新增和更新的区域
  currentAreas.forEach((area: any) => {
    const exists = baselineAreas.find((b: any) => b.areaId === area.areaId);
    if (!exists) {
      // 新增区域
      commands.push({
        type: 'area_add',
        description: `新增区域: ${area.areaName || `Area ${area.areaId}`}`,
        mqttKeyValues: convertArea(area),
        deviceId,
        order: ORDER.area_add
      });
    } else if (JSON.stringify(exists) !== JSON.stringify(area)) {
      // 更新区域
      commands.push({
        type: 'area_update',
        description: `更新区域: ${area.areaName || `Area ${area.areaId}`}`,
        mqttKeyValues: convertArea(area),
        deviceId,
        order: ORDER.area_update
      });
    }
  });
  
  // 按order排序，确保执行顺序正确
  return commands.sort((a, b) => a.order - b.order);
};

// 验证雷达配置是否写入成功
interface VerifyResult {
  success: boolean;
  actualConfig: any;  // 实际从设备读取的配置
  failures: string[];  // 失败项描述
}

const verifyRadarConfig = async (deviceId: string, expectedConfig: any): Promise<VerifyResult> => {
  const failures: string[] = [];
  
  try {
    // 1. 调用QueryRadar从设备读取实际配置
    console.log('   正在从设备读取配置...');
    const actualConfig = await QueryRadar(deviceId);
    
    console.log('   期望配置:', expectedConfig);
    console.log('   实际配置:', actualConfig);
    
    // 2. 对比 installModel
    if (actualConfig.installModel !== expectedConfig.installModel) {
      failures.push(`安装模式不匹配: 期望 ${expectedConfig.installModel}, 实际 ${actualConfig.installModel}`);
    }
    
    // 3. 对比 height（允许±2cm误差）
    const heightDiff = Math.abs(actualConfig.height - expectedConfig.height);
    if (heightDiff > 2) {
      failures.push(`安装高度不匹配: 期望 ${expectedConfig.height}cm, 实际 ${actualConfig.height}cm`);
    }
    
    // 4. 对比 boundary
    if (actualConfig.boundary.leftH !== expectedConfig.boundary.leftH) {
      failures.push(`左边界不匹配: 期望 ${expectedConfig.boundary.leftH}, 实际 ${actualConfig.boundary.leftH}`);
    }
    if (actualConfig.boundary.rightH !== expectedConfig.boundary.rightH) {
      failures.push(`右边界不匹配: 期望 ${expectedConfig.boundary.rightH}, 实际 ${actualConfig.boundary.rightH}`);
    }
    if (actualConfig.boundary.frontV !== expectedConfig.boundary.frontV) {
      failures.push(`前边界不匹配: 期望 ${expectedConfig.boundary.frontV}, 实际 ${actualConfig.boundary.frontV}`);
    }
    if (actualConfig.boundary.rearV !== expectedConfig.boundary.rearV) {
      failures.push(`后边界不匹配: 期望 ${expectedConfig.boundary.rearV}, 实际 ${actualConfig.boundary.rearV}`);
    }
    
    // 5. 对比 areas（简化对比：只检查数量和areaId）
    const expectedAreas = expectedConfig.areas || [];
    const actualAreas = actualConfig.areas || [];
    
    if (expectedAreas.length !== actualAreas.length) {
      failures.push(`区域数量不匹配: 期望 ${expectedAreas.length} 个, 实际 ${actualAreas.length} 个`);
    } else {
      // 检查每个区域是否存在
      expectedAreas.forEach((expected: any) => {
        const actual = actualAreas.find((a: any) => a.areaId === expected.areaId);
        if (!actual) {
          failures.push(`区域 ${expected.areaId} 未找到`);
        } else if (actual.enable !== expected.enable) {
          failures.push(`区域 ${expected.areaId} 启用状态不匹配`);
        }
      });
    }
    
    // 6. 输出验证结果
    if (failures.length === 0) {
      console.log('   ✅ 所有配置项验证通过');
    } else {
      console.warn('   ⚠️ 发现配置不匹配项:');
      failures.forEach(f => console.warn(`      ${f}`));
    }
    
    return {
      success: failures.length === 0,
      actualConfig: actualConfig,
      failures: failures
    };
    
  } catch (error) {
    console.error('   ❌ 验证失败:', error);
    // 验证失败时，返回期望配置作为actualConfig（降级处理）
    return {
      success: false,
      actualConfig: expectedConfig,
      failures: [`验证过程出错: ${error}`]
    };
  }
};

// QueryRadar：从设备读取配置
const QueryRadar = async (deviceId: string) => {
  console.log('   📡 查询设备配置:', deviceId);
  
  // 检查是否有外部回调函数
  if (mqttCallbacks.queryDevice) {
    try {
      // 调用外部系统提供的函数
      const response = await mqttCallbacks.queryDevice(deviceId);
      
      if (response.success && response.data) {
        // 解析外部系统返回的 key/value 数据，转换为 Canvas 配置格式
        const config = parseMqttReadResponse(response.data);
        console.log('   ✅ Query完成:', config);
        return config;
      } else {
        throw new Error(response.error || 'Query失败');
      }
    } catch (error) {
      console.error('   ❌ Query失败:', error);
      throw error;
    }
  } else {
    // 没有外部回调，使用模拟数据（开发模式）
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockData = {
      install_model: 1,  // wall
      height: 170,
      boundary_left: 300,
      boundary_right: 300,
      boundary_front: 400,
      boundary_rear: 0,
    };
    const config = parseMqttReadResponse(mockData);
    console.log('   ✅ Query完成（模拟）:', config);
    return config;
  }
};

// 执行结果接口
interface ExecuteResult {
  allSuccess: boolean;
  successCount: number;
  failures: Array<{
    command: RadarCommand;
    description: string;
    error: string;
  }>;
}

// 按顺序执行命令列表，等待服务器响应
const executeRadarCommands = async (commands: RadarCommand[]): Promise<ExecuteResult> => {
  console.log('🚀 开始执行雷达配置命令...');
  console.log('');
  
  const failures: Array<{ command: RadarCommand; description: string; error: string }> = [];
  let successCount = 0;
  
  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    console.log(`📡 [${i + 1}/${commands.length}] ${cmd.description}`);
    
    try {
      // WriteRadar 会等待服务器响应（通过 requestId 匹配）
      const response = await WriteRadar(cmd);
      
      // 检查外部系统返回的结果
      if (response.success) {
        console.log(`✅ 命令执行成功`);
        if (response.data) {
          console.log(`   返回数据:`, JSON.stringify(response.data, null, 2));
        }
        successCount++;
      } else {
        const errorMsg = response.error || '未知错误';
        console.error(`❌ 命令执行失败: ${errorMsg}`);
        failures.push({
          command: cmd,
          description: cmd.description,
          error: errorMsg
        });
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ 命令执行失败:`, errorMsg);
      failures.push({
        command: cmd,
        description: cmd.description,
        error: errorMsg
      });
    }
    
    // 命令间延迟，避免设备处理不过来
    if (i < commands.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  console.log('');
  if (failures.length === 0) {
    console.log(`✅ 所有命令执行完成 (${successCount}/${commands.length})`);
  } else {
    console.warn(`⚠️ 命令执行完成，${failures.length} 个失败 (${successCount}/${commands.length})`);
  }
  
  return {
    allSuccess: failures.length === 0,
    successCount,
    failures
  };
};

// 外部系统响应接口（与 MQTT 无关）
interface ExternalResponse {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

// WriteRadar：调用外部提供的命令发送函数
const WriteRadar = async (command: RadarCommand): Promise<ExternalResponse> => {
  // 将 key/value 数组转换为对象
  const commandData = command.mqttKeyValues.reduce((acc, kv) => {
    acc[kv.key] = kv.value;
    return acc;
  }, {} as Record<string, any>);
  
  console.log(`   设备ID: ${command.deviceId}`);
  console.log(`   配置数据:`, commandData);
  
  // 检查是否有外部回调函数
  if (mqttCallbacks.sendCommand) {
    try {
      // 调用外部系统提供的函数（外部系统负责 MQTT/HTTP/其他通信）
      const response = await mqttCallbacks.sendCommand(command.deviceId, commandData);
      console.log(`   ← 响应:`, response);
      return response;
    } catch (error) {
      console.error(`   ❌ 发送失败:`, error);
      throw error;
    }
  } else {
    // 没有外部回调，使用模拟数据（开发模式）
    await new Promise(resolve => setTimeout(resolve, 800));
    const mockResponse: ExternalResponse = {
      success: true,
      data: commandData
    };
    console.log(`   ← 模拟响应:`, mockResponse);
    return mockResponse;
  }
};

// calibrate 校正功能（占位函数）
const calibrate = () => {
  if (!selectedObject.value || !isRadarDevice.value) return;
  console.log('🔧 执行校正');
  // TODO: 实现校正逻辑
};

// ================ 布局管理 ================
// 保存当前布局到 localStorage
const layoutSave = async () => {
  const canvasId = canvasStore.getCanvasId();
  if (!canvasId) {
    console.warn('⚠️ 无法保存：未设置CanvasID');
    alert('无法保存：缺少CanvasID');
    return;
  }
  
  console.log('💾 正在保存布局到服务器...');
  const result = await objectsStore.saveCanvas(canvasId);
  alert(result.message);
};

// 导出布局为JSON文件 (LayExp - 导出到本地文件)
const layoutExport = () => {
  const canvasId = canvasStore.getCanvasId() || 'canvas_export';
  const canvasName = canvasStore.params?.canvasName || 'Unnamed Canvas';
  
  const canvasData = {
    canvasId: canvasId,
    canvasName: canvasName,
    params: canvasStore.params,
    objects: objectsStore.objects,
    timestamp: new Date().toISOString()
  };
  
  const jsonStr = JSON.stringify(canvasData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  // 文件名使用 canvasName，更直观
  a.download = `canvas_${canvasName.replace(/\s+/g, '_')}_${Date.now()}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  console.log(`📤 布局已导出: ${canvasName}`);
};

// 导入布局JSON文件 (LayImp - 从本地文件导入)
const layoutImport = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const canvasData = JSON.parse(e.target?.result as string);
        objectsStore.objects = canvasData.objects || [];
        objectsStore.selectedId = null;
        objectsStore.updateAllRadarAreas();
        
        console.log('📥 布局已导入:', canvasData.params);
        alert(`✅ 布局已导入: ${canvasData.objects.length}个对象`);
      } catch (error) {
        console.error('❌ 导入失败:', error);
        alert('❌ 导入失败：文件格式错误');
      }
    };
    reader.readAsText(file);
  };
  
  input.click();
};

// ================ 设备绑定 ================
// 切换绑定状态
const toggleBind = () => {
  if (!selectedObject.value || !canBind.value) return;
  
  if (isObjectBinded.value) {
    // 解绑
    unBindDevice();
  } else {
    // 绑定：显示设备选择列表
    showBindDeviceList();
  }
};

// 显示设备选择列表
const showBindDeviceList = () => {
  const devices = unbindedDevices.value;
  
  if (devices.length === 0) {
    alert('⚠️ 没有可绑定的设备（所有设备都已绑定）');
    return;
  }
  
  // 构建选择列表
  let message = '请选择要绑定的设备：\n\n';
  devices.forEach((device, index) => {
    message += `${index + 1}. ${device.deviceName} (${device.deviceId})\n`;
    if (device.bedId) {
      message += `   关联床: ${device.bedName || device.bedId}\n`;
    }
  });
  
  const choice = prompt(message + '\n请输入序号 (1-' + devices.length + '):');
  
  if (choice) {
    const index = parseInt(choice) - 1;
    if (index >= 0 && index < devices.length) {
      bindDevice(devices[index]);
    } else {
      alert('❌ 无效的选择');
    }
  }
};

// 绑定设备
const bindDevice = (device: any) => {
  if (!selectedObject.value) return;
  
  const obj = selectedObject.value;
  
  // 更新对象：替换为真实设备ID和名称
  const updates: any = {
    bindedDeviceId: device.deviceId,  // 标记已绑定
    name: device.deviceName           // 使用真实设备名称
  };
  
  // 如果是IoT设备，更新device.iot.deviceId
  if (obj.device?.iot) {
    updates.device = {
      ...obj.device,
      iot: {
        ...obj.device.iot,
        deviceId: device.deviceId  // 替换为真实设备ID（UUIDV4）
      }
    };
  }
  
  objectsStore.updateObject(obj.id, updates);
  
  console.log(`✅ 已绑定设备: ${device.deviceName} (${device.deviceId})`);
  alert(`✅ 已绑定: ${device.deviceName}`);
};

// 解绑设备
const unBindDevice = () => {
  if (!selectedObject.value) return;
  
  const obj = selectedObject.value;
  const oldDeviceName = obj.name;
  
  // 生成新的临时ID和名称
  const tempDevice = objectsStore.generateTempDeviceId(obj.typeName as 'Radar' | 'Sleepad' | 'Sensor');
  
  const updates: any = {
    bindedDeviceId: undefined,          // 清除绑定标记
    name: tempDevice.deviceName         // 新的临时名称：Radar03
  };
  
  // 如果是IoT设备，替换为新的临时ID
  if (obj.device?.iot) {
    updates.device = {
      ...obj.device,
      iot: {
        ...obj.device.iot,
        deviceId: tempDevice.deviceId  // 新的临时ID：Radar03
      }
    };
  }
  
  objectsStore.updateObject(obj.id, updates);
  
  console.log(`🔓 已解绑设备: ${oldDeviceName} → ${tempDevice.deviceName}`);
  alert(`🔓 已解绑: ${oldDeviceName}\n新临时ID: ${tempDevice.deviceName}`);
};

// 切换设置显示
const toggleSettings = () => {
  showSettings.value = !showSettings.value;
  console.log('⚙️ 设置面板:', showSettings.value ? '显示' : '隐藏');
};
</script>

<style lang="scss" scoped>
.toolbar {
  padding: 6px;
  height: 650px;
  width: 240px;
  background-color: white;
  border: 1px solid #ccc;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .divider {
    height: 1px;
    background-color: #ddd;
    margin: 6px 0;
  }

  .tool-section {
    flex-shrink: 0;
    
    .tool-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      margin-bottom: 4px;
    }

    .tool-row-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
      margin-bottom: 4px;
    }

    .tool-row-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      margin-bottom: 4px;
    }

    .tool-row-line-color {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .tool-btn {
      padding: 4px;
      border: 1px solid #ccc;
      font-size: 12px;
      cursor: pointer;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 2px;

      &.draw-tool {
        height: 32px;
        svg {
          color: #333;
        }
      }

      &.bed { background: #a8c5a8; }       // 灰绿色
      &.enter { background: #a0eda0; }     // 亮绿色
      &.interfere { background: #fadb14; } // 黄色
      &.wall { background: #e8e8e8; }      // 墙体
      &.furniture { background: #d3d3d3; } // 浅灰色
      &.curtain { background: #6bb9d3; }   // 浅蓝色
      &.sleepad { background: #dda0dd; }   // 紫色
      &.sensor { background: #ffa07a; }    // 橙色
      
      &.radar {
        background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
        svg {
          color: #1890ff;
        }
      }

      &:hover:not(:disabled) {
        opacity: 0.8;
      }
      
      &.active {
        border: 2px solid #1890ff;
        box-shadow: 0 0 4px rgba(24, 144, 255, 0.5);
      }
      
      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        pointer-events: none;
      }
      
      &.bind-btn {
        background: #f0f0f0;
        
        &.binded {
          background: #52c41a; // 绿色表示已绑定
          color: white;
        }
      }
    }
    
    // 已绑定对象的Name输入框样式
    .binded-name {
      color: #52c41a !important;
      font-weight: bold;
      border-color: #52c41a !important;
    }

    .color-group {
      display: flex;
      gap: 4px;
      flex: 1;
      justify-content: flex-start;
    }

    .color-btn {
      width: 18px;
      height: 18px;
      border: 1px solid #d9d9d9;
      cursor: pointer;
      transition: all 0.2s;
      
      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        pointer-events: none;
      }

      &.red { background: #ff4d4f; }
      &.yellow { background: #fadb14; }
      &.green { background: #52c41a; }
      &.blue { background: #6bb9d3; }     // 浅蓝色
      &.black { background: #000000; }
      &.gray { background: #d3d3d3; }     // 浅灰色 (Light Gray)
      &.orange { background: #ff8c00; }
      &.brown { background: #c19a6b; }    // 浅棕色 (Light Brown)
      &.silver { background: #a8c5a8; }   // 灰绿色 (更灰的绿色)
      &.white { background: #ffffff; }

      &:hover {
        transform: scale(1.1);
        border-color: #000;
      }

      &.active {
        border: 2px solid #1890ff;
        box-shadow: 0 0 4px rgba(24, 144, 255, 0.5);
      }
    }

    .action-btn {
      padding: 4px 2px;
      border: 1px solid #ccc;
      font-size: 11px;
      cursor: pointer;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 2px;

      &.create {
        background: #1890ff;
        color: white;
        &:hover { background: #40a9ff; }
      }
      &.delete {
        background: #ff4d4f;
        color: white;
        &:hover { background: #ff7875; }
      }
      &.restart {
        background: #fff7e6;
        &:hover { background: #ffd591; }
      }
      &.setting {
        background: #f0f0f0;
        &:hover { background: #e0e0e0; }
        &.active {
          background: #1890ff;
          color: white;
        }
      }
      &.query {
        background: #f0f0f0;
        &:hover { background: #e0e0e0; }
        &.active {
          background: #1890ff;
          color: white;
        }
      }
      &.read, &.write {
        background: #e1f7e1;
        &:hover { background: #c8f0c8; }
        &.active {
          background: #52c41a;
          color: white;
        }
      }
      &.layout-save {
        background: #e1f7e1;
        &:hover { background: #c8f0c8; }
      }
      &.layout-exp, &.layout-imp {
        background: #f9f1f1;
        &:hover { background: #e8d8d8; }
      }

      &:disabled {
        background: #f0f0f0;
        color: #999;
        cursor: not-allowed;
      }
    }
  }

  .prop-section {
    flex-shrink: 0;
    font-size: 12px;

    .status-label {
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 3px;
      background-color: #ff4d4f;
      color: white;
      
      &.online {
        background-color: #52c41a;
      }
    }

    .prop-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;

      > span {
        font-size: 12px;
        color: #555;
        white-space: nowrap;
      }

      .prop-value {
        font-size: 12px;
        color: #333;
        font-weight: 500;
        white-space: nowrap;
      }

      .prop-input {
        flex: 1;
        padding: 2px 4px;
        font-size: 12px;
        border: 1px solid #ccc;
        border-radius: 2px;
        height: 22px;
      }

      .prop-input-name {
        width: 90px;
        padding: 2px 4px;
        font-size: 12px;
        border: 1px solid #ccc;
        border-radius: 2px;
        height: 22px;
      }

      .prop-input-name-flex {
        width: 80px;
        padding: 2px 4px;
        font-size: 12px;
        border: 1px solid #ccc;
        border-radius: 2px;
        height: 22px;
      }

      .prop-group {
        display: flex;
        align-items: center;
        gap: 2px;

        span {
          font-size: 12px;
          color: #555;
        }

        .label-fixed {
          min-width: 38px;
          text-align: left;
        }

        .prop-num {
          width: 45px;
          padding: 2px 4px;
          text-align: right;
          font-size: 11px;
          border: 1px solid #ccc;
          border-radius: 2px;
          height: 22px;
        }

        .prop-num-sm {
          width: 40px;
          padding: 2px 4px;
          text-align: right;
          font-size: 12px;
          border: 1px solid #ccc;
          border-radius: 2px;
          height: 22px;
        }

        .prop-num-xs {
          width: 35px;
          padding: 2px 4px;
          text-align: right;
          font-size: 12px;
          border: 1px solid #ccc;
          border-radius: 2px;
          height: 22px;
        }
      }

      .device-info-text {
        width: 100%;
        padding: 4px 6px;
        border: 1px solid #ccc;
        border-radius: 2px;
        font-size: 11px;
        font-family: 'Courier New', monospace;
        line-height: 1.4;
        background-color: #f9f9f9;
        resize: none;
        overflow-y: auto;
        
        &:focus {
          outline: none;
          border-color: #1890ff;
        }
      }

      &.prop-row-lwh {
        justify-content: space-between;
      }

      &.prop-row-lwhr {
        justify-content: space-between;
        
        .prop-group {
          flex: 1;
        }
      }

      &.prop-row-name {
        gap: 16px; // 增加 Name 输入框与 Rotation 之间的间距（原来默认是6px，增加10px = 16px）
        
        .prop-group-reflect {
          flex-shrink: 0;
        }
      }
      
      &.prop-row-reflect-boundary {
        justify-content: space-between;
        
        .prop-group {
          // Reflect 输入框
        }
        
        .checkbox-boundary {
          margin-left: 30px; // Reflect 输入框与 onlyBoundary 之间的间距增加 30px
        }
      }

      .prop-num {
        width: 50px;
        padding: 2px 4px;
        text-align: right;
        font-size: 11px;
        border: 1px solid #ccc;
        border-radius: 2px;
        height: 22px;
      }

      label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        cursor: pointer;
        white-space: nowrap;

        input[type="radio"],
        input[type="checkbox"] {
          margin: 0;
        }
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 3px;
        font-size: 11px;

        input[type="checkbox"] {
          margin: 0;
        }
      }

      .checkbox-label-sm {
        display: flex;
        align-items: center;
        gap: 2px;
        font-size: 9px;
        white-space: nowrap;

        input[type="checkbox"] {
          margin: 0;
          width: 12px;
          height: 12px;
        }
      }
      
      .online-indicator {
        font-size: 16px;
        margin-left: 4px;
        color: #ccc;
        transition: color 0.3s;
        
        &.active {
          color: #52c41a;
        }
      }

      .button-group {
        display: flex;
        gap: 3px;
        flex: 1;

        .mode-btn {
          flex: 1;
          padding: 2px 4px;
          font-size: 9px;
          border: 1px solid #ccc;
          background: white;
          cursor: pointer;
          border-radius: 2px;
          height: 20px;
          transition: all 0.2s;

          &:hover {
            background: #f0f0f0;
          }

          &.active {
            background: #1890ff;
            color: white;
            border-color: #1890ff;
          }
        }
      }

      .prop-group-inline {
        display: flex;
        align-items: center;
        gap: 2px;
        white-space: nowrap;

        span {
          font-size: 10px;
          color: #555;
        }

        .prop-num-xs {
          width: 35px;
          padding: 2px 3px;
          text-align: right;
          font-size: 10px;
          border: 1px solid #ccc;
          border-radius: 2px;
          height: 20px;
        }
      }
    }
  }

  .query-result-area {
    flex: 1;
    min-height: 60px;
    max-height: 150px;
    overflow-y: auto;
    padding: 6px;
    font-size: 11px;
    font-family: 'Courier New', monospace;
    background: #fafafa;
    border: 1px solid #e0e0e0;
    border-radius: 3px;
    margin: 6px 0;
    
    .query-result-content {
      position: relative;
      
      .query-result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
        
        strong {
          font-size: 12px;
          color: #333;
        }
        
        .close-btn {
          background: transparent;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
          
          &:hover {
            background: #e0e0e0;
            color: #333;
          }
        }
      }
      
      pre {
        margin: 0;
        font-size: 9px;
        line-height: 1.4;
        white-space: pre-wrap;
        word-wrap: break-word;
        color: #333;
      }
    }
    
    &:empty {
      display: none;
    }
  }

  .control-area {
    margin-top: auto;
    padding-top: 8px;
    border-top: 1px solid #eee;

    .coord-checkbox-row {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      gap: 20px;

      .checkboxes {
        display: flex;
        gap: 10px;
        flex-shrink: 0;

        .control-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          cursor: pointer;

          input[type="checkbox"] {
            margin: 0;
          }
        }
      }

      .coordinates {
        display: flex;
        gap: 15px;
        flex-shrink: 0;

        .coord-item {
          display: flex;
          align-items: center;
          gap: 4px;

          span {
            font-size: 12px;
          }

          .coord-value {
            font-family: 'Courier New', monospace;
            font-weight: 600;
          }
        }
      }
    }

    .direction-rotation-row {
      display: flex;
      justify-content: center;
      gap: 40px;
      align-items: center;

      .direction-btns {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .middle-row {
          display: flex;
          gap: 20px;
          margin: 4px 0;
        }

        .dir-btn {
          width: 24px;
          height: 24px;
          padding: 0;
          border: 1px solid #ccc;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          border-radius: 2px;

          &:hover {
            background: #f0f0f0;
          }
          &:disabled {
            background: #f5f5f5;
            cursor: not-allowed;
            color: #ccc;
          }
        }
      }

      .rotation-btns {
        display: flex;
        flex-direction: column;
        gap: 20px;

        .rot-row {
          display: flex;
          gap: 4px;
        }

        .rot-btn {
          width: 57px; /* 44px * 1.3 = 57.2px，取整为57px */
          padding: 4px 5px; /* 3px*1.3=3.9px, 4px*1.3=5.2px，取整 */
          border: 1px solid #ccc;
          background: white;
          cursor: pointer;
          font-size: 13px; /* 10px * 1.3 = 13px */
          border-radius: 2px;
          text-align: center;

          &:hover {
            background: #f0f0f0;
          }
          &:disabled {
            background: #f5f5f5;
            cursor: not-allowed;
            color: #ccc;
          }
        }
      }
    }
  }
}

input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
  -webkit-appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    appearance: none;
    -webkit-appearance: none;
    margin: 0;
  }
}
</style>
