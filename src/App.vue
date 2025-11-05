<template>
  <div class="app-container">
    <div class="radar-system">
      <!-- 左侧：雷达画布 -->
      <RadarCanvas />

      <!-- 第一个分隔器 -->
      <div class="spacer spacer-toggle" @click="toggleWaveform"></div>

      <!-- 中间：示波器 -->
      <div 
        class="waveform-wrapper" 
        :class="{ 'waveform-closed': !isWaveformOpen }"
      >
        <WaveMonitor />
      </div>

      <!-- 第二个分隔器 -->
      <div class="spacer spacer-toggle" @click="toggleToolbar"></div>

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

const isWaveformOpen = ref(true);
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
    console.log('🎬 回放模式：从服务器加载 data + layout');
    try {
      const response = await fetch(dataUrl);
      const result = await response.json();
      
      // 应用布局
      canvasStore.setLayout(result.layout);
      
      // 加载数据
      radarDataStore.setMode('fromserver');
      radarDataStore.loadHistoricalData(result.data);
      
      console.log('✅ 回放数据加载成功', {
        radarId: result.radarId,
        dataLength: result.data?.length
      });
      return;
    } catch (error) {
      console.error('❌ 回放数据加载失败:', error);
    }
  }
  
  // 1. 检查是否是URL查询模式（手动查询）
  const isAutoQuery = await autoQueryFromURL();
  if (isAutoQuery) {
    console.log('🎬 URL自动查询模式已启动');
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

/* 分隔器 3x650 */
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