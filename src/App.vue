<template>
  <div class="app-container">
    <div class="radar-system">
      <!-- 左侧：雷达画布 -->
      <RadarCanvas />

      <!-- 第一个分隔器 -->
      <div class="spacer spacer-toggle spacer-top" @click="toggleWaveform">
        <span class="toggle-icon">{{ isWaveformOpen ? '》' : '《' }}</span>
      </div>

      <!-- 中间：示波器 -->
      <div 
        class="waveform-wrapper" 
        :class="{ 'waveform-closed': !isWaveformOpen }"
      >
        <WaveMonitor />
      </div>

      <!-- 第二个分隔器 -->
      <div class="spacer spacer-toggle spacer-bottom" @click="toggleToolbar">
        <span class="toggle-icon">{{ isToolbarOpen ? '》' : '《' }}</span>
      </div>

      <!-- 右侧：工具栏 -->
      <div 
        class="toolbar-wrapper" 
        :class="{ 'toolbar-closed': !isToolbarOpen }"
      >
        <Toolbar />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import RadarCanvas from './components/RadarCanvas.vue';
import WaveMonitor from './components/WaveMonitor.vue';
import Toolbar from './components/Toolbar.vue';
import { useCanvasStore } from '@/stores/canvas';
import { useObjectsStore } from '@/stores/objects';
import { getCanvasParams } from '@/utils/urlParams';

const canvasStore = useCanvasStore();
const objectsStore = useObjectsStore();

// 暴露 canvasStore 供其他地方访问
(window as any).__canvasStore = canvasStore;

const isWaveformOpen = ref(true);
const isToolbarOpen = ref(true);

const toggleWaveform = () => {
  isWaveformOpen.value = !isWaveformOpen.value;
};

const toggleToolbar = () => {
  isToolbarOpen.value = !isToolbarOpen.value;
};

// 初始化：接收参数并加载Canvas
onMounted(() => {
  // 1. 获取Canvas参数（由上层系统提供）
  const params = getCanvasParams();
  
  if (params) {
    // 2. 设置Canvas参数
    canvasStore.setParams(params);
    
    // 3. 使用服务器提供的canvasId加载布局
    const canvasId = canvasStore.getCanvasId();
    if (canvasId) {
      objectsStore.loadCanvas(canvasId);
      
      // 4. 如果指定了currentDeviceId，自动选中该设备
      if (params.currentDeviceId) {
        const device = objectsStore.objects.find(obj => 
          obj.device?.iot && 
          (obj.device.iot.deviceId === params.currentDeviceId || obj.id === params.currentDeviceId)
        );
        
        if (device) {
          objectsStore.selectObject(device.id);
          const deviceInfo = params.devices.find(d => d.deviceId === params.currentDeviceId);
          console.log(`✅ 自动选中设备: ${deviceInfo?.deviceName || params.currentDeviceId}`);
        }
      }
    }
  } else {
    console.warn('⚠️ 未提供URL参数，使用默认空Canvas');
  }
});
</script>

<style scoped>
.app-container {
  padding: 5px;
  background-color: #f0f0f0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.radar-system {
  display: flex;
  height: 650px;
  border-radius: 2px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 分隔器 10x650 */
.spacer {
  width: 10px;
  height: 650px;
  background-color: #e0e0e0;
  border-top: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
}

.spacer-toggle {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.spacer-toggle.spacer-top {
  align-items: flex-start;
  padding-top: 200px;
}

.spacer-toggle.spacer-bottom {
  align-items: flex-end;
  padding-bottom: 200px;
}

.spacer-toggle:hover {
  background-color: #d0d0d0;
}

.toggle-icon {
  color: #666;
  user-select: none;
  font-size: 12px;
}

/* 波形监测容器 */
.waveform-wrapper {
  width: 620px;
  height: 650px;
  transition: width 0.3s ease;
  overflow: hidden;
}

.waveform-wrapper.waveform-closed {
  width: 0;
}

/* 工具栏容器 */
.toolbar-wrapper {
  width: 240px;
  height: 650px;
  transition: width 0.3s ease;
  overflow: hidden;
}

.toolbar-wrapper.toolbar-closed {
  width: 0;
}
</style>