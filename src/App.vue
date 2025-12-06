<template>
  <div class="app-container">
    <div class="radar-system">
      <!-- Left: Radar Canvas -->
      <RadarCanvas />

      <!-- First separator -->
      <div class="spacer spacer-toggle" @click="toggleWaveform"></div>

      <!-- Middle: Waveform Monitor -->
      <div 
        class="waveform-wrapper" 
        :class="{ 'waveform-closed': !isWaveformOpen }"
      >
        <WaveMonitor />
      </div>

      <!-- Second separator -->
      <div class="spacer spacer-toggle" @click="toggleToolbar"></div>

      <!-- Right: Toolbar -->
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
import { ref, onMounted, provide } from 'vue';
import RadarCanvas from './components/RadarCanvas.vue';
import WaveMonitor from './components/WaveMonitor.vue';
import Toolbar from './components/Toolbar.vue';
import { useCanvasStore } from '@/stores/canvas';
import { useObjectsStore } from '@/stores/objects';
import { useRadarDataStore } from '@/stores/radarData';
import { getCanvasParams } from '@/utils/urlParams';
import { autoQueryFromURL } from '@/utils/autoQuery';

const canvasStore = useCanvasStore();
const objectsStore = useObjectsStore();
const radarDataStore = useRadarDataStore();

// 暴露 canvasStore 供其他地方访问
(window as any).__canvasStore = canvasStore;

const isWaveformOpen = ref(false);
const isToolbarOpen = ref(true);

const toggleWaveform = () => {
  isWaveformOpen.value = !isWaveformOpen.value;
};

const toggleToolbar = () => {
  isToolbarOpen.value = !isToolbarOpen.value;
};

// 向子组件提供面板控制
provide('panelControls', {
  isWaveformOpen,
  isToolbarOpen,
  toggleWaveform,
  toggleToolbar
});

// 初始化：接收参数并加载Canvas
onMounted(async () => {
  // 0. 检查是否是回放模式（直接接收data+layout）
  const urlParams = new URLSearchParams(window.location.search);
  const playbackMode = urlParams.get('mode');
  const dataUrl = urlParams.get('dataUrl');
  
  if (playbackMode === 'playback' && dataUrl) {
    console.log('🎬 Playback mode: Loading data + layout from server');
    try {
      const response = await fetch(dataUrl);
      const result = await response.json();
      
      // 应用布局
      objectsStore.setLayout(result.layout);
      
      // 加载数据
      radarDataStore.setMode('fromserver');
      radarDataStore.loadHistoricalData(result.data);
      
      console.log('✅ Playback data loaded successfully', {
        radarId: result.radarId,
        dataLength: result.data?.length
      });
      return;
    } catch (error) {
      console.error('❌ Failed to load playback data:', error);
    }
  }
  
  // 1. 检查是否是URL查询模式（手动查询）
  const isAutoQuery = await autoQueryFromURL();
  if (isAutoQuery) {
    console.log('🎬 URL auto-query mode started');
    return;
  }
  
  // 2. 获取Canvas参数（由上层系统提供）
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
          console.log(`✅ Auto-selected device: ${deviceInfo?.deviceName || params.currentDeviceId}`);
        }
      }
    }
  } else {
    console.warn('⚠️ No URL parameters provided, using default empty Canvas');
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

/* Separator 3x650 */
.spacer {
  width: 3px;
  height: 650px;
  background-color: #e0e0e0;
  border-top: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
}

.spacer-toggle {
  cursor: pointer;
  transition: background-color 0.2s;
}

.spacer-toggle:hover {
  background-color: #d0d0d0;
}

/* Waveform monitor container */
.waveform-wrapper {
  width: 620px;
  height: 650px;
  transition: width 0.3s ease;
  overflow: hidden;
}

.waveform-wrapper.waveform-closed {
  width: 0;
}

/* Toolbar container */
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