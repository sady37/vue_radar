<template>
  <div class="wave-monitor">
    <div class="wave-header">
      <h3>WaveMonitor</h3>
    </div>
    
    <!-- Toolbar -->
    <div class="track-toolbar">
      <!-- Row 1: fromServer -->
      <div class="control-row">
        <label class="row-label">fromServer:</label>
        <input 
          type="text" 
          v-model="selectedDeviceId" 
          class="device-input"
          placeholder="DeviceID"
        />
        
        <label class="inline-label">Start:</label>
        <input 
          type="text" 
          v-model="timeInput" 
          class="time-input"
          placeholder="2025110423:27:42"
        />
        
        <label class="inline-label">～</label>
        <input 
          type="number" 
          v-model.number="timeLong" 
          class="time-long-input"
          min="1"
          max="60"
        />
        <span class="unit">mins</span>
        
        <button 
          class="action-btn primary" 
          @click="handleLoadServer"
          :disabled="!canLoadServer"
        >
          Load
        </button>
        
        <button 
          class="action-btn success" 
          @click="handleRealTimeServer"
          :disabled="!canRealTimeServer"
        >
          RealTime
        </button>
      </div>
      
      <!-- Row 2: fromFile -->
      <div class="control-row">
        <label class="row-label">fromFile:</label>
        <button 
          class="action-btn file-btn" 
          @click="handleFromFile"
        >
          File
        </button>
        
        <div class="file-display-box" :class="{ 'has-file': selectedFileName }">
          <span v-if="selectedFileName" :title="selectedFileName">{{ selectedFileName }}</span>
          <span v-else class="placeholder">No file selected</span>
        </div>
        
        <button 
          class="action-btn primary" 
          @click="handleLoadFile"
          :disabled="!canLoadFile"
        >
          Load
        </button>
        
        <button 
          class="action-btn success" 
          @click="handleRealTimeFile"
          :disabled="!canRealTimeFile"
        >
          RealTime
        </button>
        
        <label class="inline-label">Select:</label>
        <select v-model="displayDeviceId" class="device-select">
          <option value="">Auto</option>
          <option v-for="device in canvasDevices" :key="device.deviceId" :value="device.deviceId">
            {{ device.name }}
          </option>
        </select>
        
        <button 
          class="action-btn demo" 
          @click="handleDemo"
        >
          Demo
        </button>
      </div>
      
      <!-- Row 3: Playback controls -->
      <div class="control-row row-tight">
        <button 
          class="action-btn control-btn" 
          @click="handlePauseResume"
          :disabled="!isPlaying"
        >
          {{ isPaused ? 'Resume' : 'Pause' }}
        </button>
        
        <button 
          class="action-btn control-btn stop-btn" 
          @click="handleStop"
          :disabled="!isPlaying"
        >
          Stop
        </button>
        
        <!-- Speed buttons -->
        <button 
          v-for="speed in [1, 1.5, 2]" 
          :key="speed"
          @click="playbackSpeed = speed"
          :class="['speed-btn-inline', { active: playbackSpeed === speed }]"
        >
          {{ speed }}x
        </button>
        
        <!-- Progress label + display -->
        <label class="progress-label">now/played/sum:</label>
        <div v-if="isPlaying" class="progress-display">
          <span class="current-time">{{ currentTimeDisplay }}</span>
          <span class="separator">/</span>
          <span class="elapsed-mins">{{ elapsedMinutes }}min</span>
          <span class="separator">/</span>
          <span class="total-mins">{{ totalMinutes }}min</span>
        </div>
        <div v-else class="progress-placeholder">
          --:--:--/--/--
        </div>
      </div>
    </div>
    
    <!-- Waveform display area -->
    <div class="waveform-content">
      <div v-if="!dataLoaded" class="placeholder">
        <p>Select data source and click Play or Demo</p>
        <p v-if="useEventTime" class="hint">Event: 60s before + 120s after = 3min</p>
        <p v-else class="hint">StartTime: {{ timeLong }}min</p>
      </div>
      <div v-else class="waveform-display">
        <!-- Waveform Controls -->
        <div class="waveform-controls">
          <label class="waveform-option">
            <input type="checkbox" v-model="showHR" @change="drawWaveform" />
            <span>HR</span>
          </label>
          <label class="waveform-option">
            <input type="checkbox" v-model="showRR" @change="drawWaveform" />
            <span>RR</span>
          </label>
          <label class="waveform-option">
            <input type="checkbox" v-model="darkBackground" @change="drawWaveform" />
            <span>Dark</span>
          </label>
        </div>
        
        <!-- Single Canvas for both HR and RR -->
        <canvas 
          ref="waveformCanvasRef" 
          class="waveform-canvas"
          :style="{ backgroundColor: darkBackground ? '#000000' : '#ffffff' }"
        ></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useObjectsStore } from '@/stores/objects';
import { useRadarDataStore } from '@/stores/radarData';
import { MockRadarService } from '@/utils/mockRadarData';

const objectsStore = useObjectsStore();
const radarDataStore = useRadarDataStore();

// ===== Canvas引用 =====
const waveformCanvasRef = ref<HTMLCanvasElement | null>(null);

// ===== 状态管理 =====
const selectedDeviceId = ref('');    // fromServer: DeviceID
const timeInput = ref('');           // fromServer: Start时间
const timeLong = ref(5);             // fromServer: 时长（分钟）
const useEventTime = ref(false);     // Event模式（暂时保留，兼容旧代码）

const selectedFileName = ref('');    // fromFile: 文件名
const selectedFileContent = ref(''); // fromFile: 文件内容
const displayDeviceId = ref('');     // fromFile: Select设备
const displayRadarId = ref('');      // 展示雷达（兼容旧代码）

const isPlaying = ref(false);        // 播放状态
const isPaused = ref(false);         // 暂停状态
const playbackSpeed = ref<number>(1);
const currentTimeDisplay = ref('00:00:00');
const elapsedSeconds = ref(0);
const totalSeconds = ref(0);

const dataLoaded = ref(false);
const loadedDataInfo = ref('');
const darkBackground = ref(false);   // 背景颜色切换
const showHR = ref(true);            // 显示HR曲线
const showRR = ref(true);            // 显示RR曲线

// 播放控制
let playbackIntervalId: number | null = null;
let mockService: MockRadarService | null = null;

// 波形数据缓存
let vitalDataCache: Array<{
  timestamp: number;
  heartRate: number | null;
  breathing: number | null;
}> = [];

// ===== 计算属性 =====
// 本 Canvas 中的雷达列表（用于展示）
const canvasRadars = computed(() => {
  return objectsStore.objects.filter(obj => obj.typeName === 'Radar');
});

// 本 Canvas 中的设备信息（包括Radar和Sleeppad）
const canvasDevices = computed(() => {
  return objectsStore.objects
    .filter(obj => obj.typeName === 'Radar' || obj.typeName === 'Sleeppad')
    .map(obj => ({
      deviceId: obj.device?.iot?.deviceId || obj.id,
      name: obj.name || obj.typeName,
      type: obj.typeName
    }));
});

// fromServer: Load 按钮可用
const canLoadServer = computed(() => {
  return selectedDeviceId.value && timeInput.value && timeLong.value;
});

// fromServer: RealTime 按钮可用
const canRealTimeServer = computed(() => {
  return selectedDeviceId.value;
});

// fromFile: Load 按钮可用
const canLoadFile = computed(() => {
  return selectedFileName.value && selectedFileContent.value;
});

// fromFile: RealTime 按钮可用
const canRealTimeFile = computed(() => {
  return selectedFileName.value && selectedFileContent.value;
});

// 已播放分钟数
const elapsedMinutes = computed(() => {
  return Math.floor(elapsedSeconds.value / 60);
});

// 总分钟数
const totalMinutes = computed(() => {
  return Math.floor(totalSeconds.value / 60);
});

// ===== 监听 Event 复选框 =====
watch(useEventTime, (isEvent) => {
  if (isEvent) {
    // Event 模式：自动设置为3分钟（前60秒+后120秒）
    timeLong.value = 3;
  } else {
    // 普通模式：恢复默认2分钟
    if (timeLong.value === 3) {
      timeLong.value = 2;
    }
  }
});

// ===== 方法 =====
// 第2行：选择文件
const handleFromFile = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt,.csv,.json';
  
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      console.log('📂 文件加载成功:', file.name);
      
      selectedFileName.value = file.name;
      selectedFileContent.value = text;
      dataLoaded.value = true;
      loadedDataInfo.value = `${file.name} (${text.split('\n').length} 行)`;
      
      console.log(`✅ File selected: ${file.name}`);
    } catch (error) {
      console.error('❌ File load failed:', error);
      selectedFileName.value = '';
      selectedFileContent.value = '';
      alert('File load failed');
    }
  };
  
  input.click();
};

// Row 1: PlayBack (query from server)
// ===== Row 1: fromServer =====
const handleLoadServer = () => {
  console.log('📡 Load from Server: Historical data');
  startPlayback('server');
};

const handleRealTimeServer = () => {
  console.log('🔴 RealTime from Server');
  // TODO: 实现实时模式
  alert('RealTime mode: Coming soon');
};

// ===== Row 2: fromFile =====
const handleLoadFile = () => {
  console.log('📂 Load from File: Historical data');
  startPlayback('file');
};

const handleRealTimeFile = () => {
  console.log('🔴 RealTime from File');
  // TODO: 实现实时模式
  alert('RealTime mode: Coming soon');
};

// ===== Demo模式（用于测试） =====
const handleDemo = () => {
  console.log('🎲 Demo mode');
  startPlayback('demo');
};

// 开始播放（统一入口）
const startPlayback = async (source: 'server' | 'file' | 'demo') => {
  try {
    console.log(`\n🎬 开始加载数据 (${source})`);
    
    // 启用回放模式（禁用时间过滤）
    radarDataStore.setPlaybackMode(true);
    
    let historicalData: any[] = [];
    
    if (source === 'server') {
      // 从服务器查询历史数据
      console.log('📡 从服务器查询:', {
        deviceId: selectedDeviceId.value,
        start: timeInput.value,
        duration: timeLong.value
      });
      
      alert('Server mode: Not implemented yet.\nPlease use File or Demo for testing.');
      radarDataStore.setPlaybackMode(false);
      return;
      
    } else if (source === 'file') {
      // 从文件回放
      console.log('📂 文件:', selectedFileName.value);
      
      if (!selectedFileContent.value) {
        throw new Error('No file content loaded');
      }
      
      // 解析文件内容（类似 MockRadarService.parseRealData）
      historicalData = parseRealData(selectedFileContent.value);
      totalSeconds.value = historicalData.length;  // 每秒一条数据
      
      console.log(`📊 文件数据: ${historicalData.length} 条记录`);
      
    } else if (source === 'demo') {
      // Demo 模式：仅生成雷达数据，使用Canvas中已有的布局
      console.log('🎲 Demo mode: Generating simulated radar data');
      console.log('📦 使用Canvas布局，对象数量:', objectsStore.objects.length);
      
      // 检查是否有雷达
      const radar = objectsStore.objects.find(obj => obj.typeName === 'Radar');
      if (!radar) {
        alert('⚠️ 请先加载Canvas布局（需要雷达对象）\n\n操作步骤：\n1. 点击 Load Layout\n2. 选择 Canvas_Tom.json\n3. 再点击 Demo');
        radarDataStore.setPlaybackMode(false);
        return;
      }
      
      const bed = objectsStore.objects.find(obj => obj.typeName === 'Bed');
      console.log(`✅ 使用展示雷达: ${radar.name || radar.id}`);
      if (bed) {
        console.log(`✅ 检测到床对象: ${bed.name || bed.id}`);
      } else {
        console.log('⚠️ 未检测到床对象，将使用雷达中心区域模拟床上场景');
      }
      
      // 创建 MockRadarService 实例（传递 Canvas 对象）
      mockService = new MockRadarService(
        {},  // 使用默认配置
        objectsStore.objects  // 传递 Canvas 对象数组
      );
      
      // 获取仿真历史数据（生成120秒=2分钟的数据）
      const demoSeconds = 120;
      historicalData = mockService.getHistoricalData(demoSeconds);
      totalSeconds.value = historicalData.length;
      
      console.log(`📊 生成 ${historicalData.length} 条仿真雷达数据`);
      
      if (historicalData.length > 0) {
        console.log('📌 第一帧示例:', historicalData[0]);
      }
    }
    
    // 检查是否有数据
    if (historicalData.length === 0) {
      throw new Error('No historical data available');
    }
    
    // 启动播放
    isPlaying.value = true;
    isPaused.value = false;
    elapsedSeconds.value = 0;
    dataLoaded.value = true;
    loadedDataInfo.value = `${historicalData.length} records loaded from ${source}`;
    
    // 初始化显示
    currentTimeDisplay.value = formatSecondsToTime(historicalData[0].timestamp);
    
    console.log('✅ 开始播放历史数据...');
    
    // 初始化Canvas
    initCanvases();
    
    // 清空波形数据缓存并加载新数据
    vitalDataCache = [];
    
    // 一次性提取所有历史数据中的生理数据
    historicalData.forEach(frame => {
      if (frame.persons && frame.persons.length > 0) {
        const person = frame.persons[0];
        if (person.heartRate || person.breathRate) {
          vitalDataCache.push({
            timestamp: frame.timestamp,
            heartRate: person.heartRate || null,
            breathing: person.breathRate || null
          });
        }
      }
    });
    
    console.log(`📊 生理数据提取完成: ${vitalDataCache.length} 个数据点`);
    
    // 立即绘制完整波形
    drawWaveform();
    
    // 等待200ms确保姿态图标预加载完成
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 播放历史数据
    let currentIndex = 0;
    
    const playNextFrame = () => {
      if (!isPlaying.value) {
        // 被手动停止
        return;
      }
      
      if (currentIndex >= historicalData.length) {
        // 播放完成
        console.log('✅ 播放完成');
        handleStop();
        return;
      }
      
      if (isPaused.value) {
        // 暂停状态，稍后重试
        playbackIntervalId = window.setTimeout(playNextFrame, 100);
        return;
      }
      
      // 获取当前帧数据
      const frameData = historicalData[currentIndex];
      
      // 更新雷达数据（persons中已包含生理数据：heartRate, breathRate, sleepState）
      radarDataStore.updatePersons(frameData.persons);
      
      // 调试：每10帧输出一次
      if (currentIndex % 10 === 0) {
        console.log(`📊 Frame ${currentIndex}/${historicalData.length}:`, {
          timestamp: frameData.timestamp,
          personsCount: frameData.persons.length,
          person: frameData.persons[0] ? {
            posture: frameData.persons[0].posture,
            position: frameData.persons[0].position,
            heartRate: frameData.persons[0].heartRate,
            breathRate: frameData.persons[0].breathRate,
            sleepState: frameData.persons[0].sleepState
          } : null
        });
      }
      
      // 验证数据是否更新到 store（仅首帧输出）
      if (currentIndex === 0) {
        console.log(`  ✅ Store persons count: ${radarDataStore.persons.length}`);
        console.log(`  ✅ Store currentPersons count: ${radarDataStore.currentPersons.length}`);
      }
      
      // 更新进度显示
      currentTimeDisplay.value = formatSecondsToTime(frameData.timestamp);
      elapsedSeconds.value = currentIndex;
      
      // 下一帧
      currentIndex++;
      
      // 根据播放速度调整间隔（基准：1秒）
      const interval = 1000 / playbackSpeed.value;
      playbackIntervalId = window.setTimeout(playNextFrame, interval);
    };
    
    // 开始播放
    playNextFrame();
    
  } catch (error) {
    console.error('❌ Playback failed:', error);
    alert(`Playback failed: ${error}`);
    radarDataStore.setPlaybackMode(false);
    isPlaying.value = false;
  }
};

// 解析真实数据（从文件 - 表格格式）
const parseRealData = (content: string): any[] => {
  const lines = content.trim().split('\n');
  const data: any[] = [];
  
  console.log(`📂 解析文件，共 ${lines.length} 行`);
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 跳过空行、分隔线、表头
    if (!trimmed || 
        trimmed.startsWith('+') || 
        trimmed.includes('device_code') ||
        !trimmed.startsWith('|')) {
      continue;
    }
    
    try {
      // 解析表格行（| 分隔）
      const cols = trimmed.split('|').map(c => c.trim()).filter(c => c);
      
      if (cols.length < 12) {
        console.warn('列数不足，跳过:', trimmed);
        continue;
      }
      
      // 安全解析数字
      const safeParse = (str: string) => {
        if (str === 'NULL' || !str) return 0;
        const num = parseInt(str, 10);
        return Number.isNaN(num) ? 0 : num;
      };
      
      // 解析为标准格式
      const record = {
        timestamp: safeParse(cols[10]),  // timestamp
        persons: [{
          id: safeParse(cols[0]),
          deviceCode: cols[1] || 'UNKNOWN',
          personIndex: safeParse(cols[11]),  // person_index
          posture: safeParse(cols[7]),       // posture
          position: {
            x: safeParse(cols[3]) * 10,     // dm → cm (统一在入口转换)
            y: safeParse(cols[4]) * 10,     // dm → cm
            z: safeParse(cols[5])
          },
          heartRate: undefined,
          breathRate: undefined,
          sleepState: undefined
        }]
      };
      
      data.push(record);
    } catch (e) {
      console.warn('解析失败:', line, e);
    }
  }
  
  console.log(`✅ 成功解析 ${data.length} 条记录`);
  return data;
};

// 格式化秒数为时间字符串（HH:MM:SS）
const formatSecondsToTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// Row 3: Pause/Resume
const handlePauseResume = () => {
  isPaused.value = !isPaused.value;
  console.log(isPaused.value ? '⏸️ Paused' : '▶️ Resumed');
};

// Row 3: Stop
const handleStop = () => {
  console.log('⏹️ Stopped');
  
  // 停止播放间隔
  if (playbackIntervalId !== null) {
    clearTimeout(playbackIntervalId);
    playbackIntervalId = null;
  }
  
  // 退出回放模式
  radarDataStore.setPlaybackMode(false);
  
  // 清除所有人员和轨迹数据
  radarDataStore.clearAllData();
  
  // 清空波形数据缓存
  vitalDataCache = [];
  
  // 清理 Mock Service
  mockService = null;
  
  // 重置状态
  isPlaying.value = false;
  isPaused.value = false;
  elapsedSeconds.value = 0;
  currentTimeDisplay.value = '00:00:00';
  dataLoaded.value = false;
  loadedDataInfo.value = '';
  
  // 清空Canvas
  if (waveformCanvasRef.value) {
    const ctx = waveformCanvasRef.value.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, waveformCanvasRef.value.width, waveformCanvasRef.value.height);
  }
};

// 计算查询参数（第1层：数据查询）
const calculateTimeRange = () => {
  const timestamp = parseTimeString(timeInput.value);
  
  if (useEventTime.value) {
    // Event: 前60秒，后120秒（共180秒=3分钟）
    return {
      deviceId: selectedDeviceId.value,   // ← 第1层：数据来源的 UUID
      start: timestamp - 60,
      event: timestamp,
      end: timestamp + 120,
      duration: 180,
      mode: 'event'
    };
  } else {
    // StartTime: 从指定时间开始
    const durationSeconds = timeLong.value * 60;
    return {
      deviceId: selectedDeviceId.value,   // ← 第1层：数据来源的 UUID
      start: timestamp,
      end: timestamp + durationSeconds,
      duration: durationSeconds,
      mode: 'start'
    };
  }
};

// 解析时间字符串
const parseTimeString = (timeStr: string): number => {
  const cleaned = timeStr.replace(/\s+/g, '');
  
  const year = parseInt(cleaned.substring(0, 4));
  const month = parseInt(cleaned.substring(4, 6)) - 1;
  const day = parseInt(cleaned.substring(6, 8));
  
  const timepart = cleaned.substring(8);
  const [hours, minutes, seconds] = timepart.split(':').map(s => parseInt(s) || 0);
  
  const date = new Date(year, month, day, hours, minutes, seconds);
  return Math.floor(date.getTime() / 1000);
};

// 格式化时间戳
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}:${minutes}:${seconds}`;
};

// ===== 波形绘制 =====
const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 240;
const Y_MIN = 0;
const Y_MAX = 150;
const WINDOW_SECONDS = 300; // 实时模式：300秒滑动窗口

// 初始化Canvas
onMounted(() => {
  initCanvases();
});


const initCanvases = () => {
  if (waveformCanvasRef.value) {
    waveformCanvasRef.value.width = CANVAS_WIDTH;
    waveformCanvasRef.value.height = CANVAS_HEIGHT * 2; // 合并后高度加倍
  }
};

// 监听背景色切换，重绘波形
watch(darkBackground, () => {
  if (dataLoaded.value) {
    drawWaveform();
  }
});

// 绘制波形（单个Canvas，同时显示HR和RR）
const drawWaveform = () => {
  if (!waveformCanvasRef.value) return;
  if (!dataLoaded.value) return;
  
  const data = vitalDataCache;
  if (data.length === 0) return;
  
  const canvas = waveformCanvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const width = canvas.width;
  const height = canvas.height;
  const isDark = darkBackground.value;
  
  // 清空画布
  ctx.fillStyle = isDark ? '#000000' : '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // HR阈值
  const hrThresholds = { normal: [55, 95], l2Low: [45, 54], l2High: [96, 115] };
  // RR阈值
  const rrThresholds = { normal: [10, 23], l2Low: [8, 9], l2High: [24, 26] };
  
  // 1. 绘制Y轴刻度和网格（每10一标）
  ctx.fillStyle = isDark ? '#666' : '#999';
  ctx.font = '10px Arial';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  
  for (let val = 0; val <= 150; val += 10) {
    const y = valueToY(val, height);
    ctx.fillText(val.toString(), 35, y);
    
    // 网格线
    ctx.strokeStyle = isDark ? '#333' : '#e8e8e8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();
  }
  
  // 2. 绘制辅助线
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.font = '9px Arial';
  ctx.textAlign = 'left';
  
  // 黄色虚线：10, 23, 55, 95
  ctx.strokeStyle = '#ffc000';
  [10, 23, 55, 95].forEach(val => {
    const y = valueToY(val, height);
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();
    
    // 右侧标注
    ctx.fillStyle = '#ffc000';
    ctx.fillText(val.toString(), width - 35, y - 2);
  });
  
  // 红色虚线：8, 26, 45, 115
  ctx.strokeStyle = '#ff4d4f';
  [8, 26, 45, 115].forEach(val => {
    const y = valueToY(val, height);
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();
    
    // 右侧标注
    ctx.fillStyle = '#ff4d4f';
    ctx.fillText(val.toString(), width - 35, y - 2);
  });
  
  ctx.setLineDash([]); // 恢复实线
  
  // 3. 绘制HR波形
  if (showHR.value && data.length >= 2) {
    const xStep = (width - 40) / data.length;
    
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const curr = data[i];
      
      const prevValue = prev.heartRate;
      const currValue = curr.heartRate;
      
      if (prevValue === undefined || currValue === undefined || 
          prevValue === null || currValue === null ||
          prevValue === 0 || currValue === 0 ||
          prevValue === -255 || currValue === -255) {
        continue;
      }
      
      const x1 = (i - 1) * xStep + 40;
      const y1 = valueToY(prevValue, height);
      const x2 = i * xStep + 40;
      const y2 = valueToY(currValue, height);
      
      // HR颜色
      const color = getHRColor(currValue, hrThresholds, isDark);
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
  
  // 4. 绘制RR波形
  if (showRR.value && data.length >= 2) {
    const xStep = (width - 40) / data.length;
    
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const curr = data[i];
      
      const prevValue = prev.breathing;
      const currValue = curr.breathing;
      
      if (prevValue === undefined || currValue === undefined || 
          prevValue === null || currValue === null ||
          prevValue === 0 || currValue === 0 ||
          prevValue === -255 || currValue === -255) {
        continue;
      }
      
      const x1 = (i - 1) * xStep + 40;
      const y1 = valueToY(prevValue, height);
      const x2 = i * xStep + 40;
      const y2 = valueToY(currValue, height);
      
      // RR颜色
      const color = getRRColor(currValue, rrThresholds);
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
};

// 数值转Y坐标
const valueToY = (value: number, height: number): number => {
  const ratio = (Y_MAX - value) / (Y_MAX - Y_MIN);
  return ratio * height;
};

// 获取HR颜色
const getHRColor = (
  value: number,
  thresholds: { normal: [number, number], l2Low: [number, number], l2High: [number, number] },
  isDark: boolean
): string => {
  // Normal区域：[55-95]
  if (value >= thresholds.normal[0] && value <= thresholds.normal[1]) {
    return isDark ? '#ffffff' : '#000000';  // 白/黑
  }
  
  // L2区域：[45-54] 或 [96-115]
  if ((value >= thresholds.l2Low[0] && value <= thresholds.l2Low[1]) ||
      (value >= thresholds.l2High[0] && value <= thresholds.l2High[1])) {
    return '#ffc000';  // 黄色
  }
  
  // L1区域：[0-44] 或 [116-∞]
  return '#ff4d4f';  // 红色
};

// 获取RR颜色
const getRRColor = (
  value: number,
  thresholds: { normal: [number, number], l2Low: [number, number], l2High: [number, number] }
): string => {
  // Normal区域：[10-23]
  if (value >= thresholds.normal[0] && value <= thresholds.normal[1]) {
    return '#00b050';  // 绿色
  }
  
  // L2区域：[8-9] 或 [24-26]
  if ((value >= thresholds.l2Low[0] && value <= thresholds.l2Low[1]) ||
      (value >= thresholds.l2High[0] && value <= thresholds.l2High[1])) {
    return '#ffc000';  // 黄色
  }
  
  // L1区域：[0-7] 或 [27-∞]
  return '#ff4d4f';  // 红色
};

</script>

<style scoped>
.wave-monitor {
  width: 620px;
  height: 650px;
  background-color: white;
  border: 1px solid #ccc;
  display: flex;
  flex-direction: column;
}

.wave-header {
  padding: 10px 15px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.wave-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

/* 工具栏 */
.track-toolbar {
  padding: 10px 15px;
  background-color: #fafafa;
  border-bottom: 1px solid #e0e0e0;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.control-row:last-child {
  margin-bottom: 0;
}

.control-row.row-compact {
  gap: 6px;  /* Row 2: compact */
}

.control-row.row-tight {
  gap: 4px;  /* Row 3: tighter */
}

/* 内联标签 */
.inline-label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  margin: 0;
}

.row-label {
  font-size: 12px;
  color: #1890ff;
  font-weight: 500;
  white-space: nowrap;
  margin: 0 4px 0 0;
}

/* 输入框 */
.device-input {
  padding: 5px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 11px;
  width: 105px;
  background-color: white;
  font-family: monospace;
}

.device-input::placeholder {
  color: #999;
  font-family: system-ui;
}

.display-select,
.device-select {
  padding: 4px 6px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  width: 90px;
  background-color: white;
}

.label-tight {
  margin-left: 3px;  /* Display 标签与 Demo 按钮距离更近 */
}

.hint-text {
  font-size: 11px;
  color: #999;
  font-style: italic;
  margin-left: 5px;
}

.time-input {
  padding: 5px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 11px;
  width: 125px;
  font-family: monospace;
  background-color: white;
}

.time-long-input {
  padding: 5px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  width: 45px;
  text-align: center;
  background-color: white;
}

.time-long-input:disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.unit {
  font-size: 12px;
  color: #666;
  margin-left: 2px;
}

/* 复选框 */
.checkbox-option {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
  margin-left: 6px;
}

.checkbox-option input[type="checkbox"] {
  cursor: pointer;
}

.checkbox-option span {
  font-size: 12px;
  color: #666;
}


/* 操作按钮 */
.action-btn {
  padding: 5px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: white;
  color: #333;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background-color: #f0f0f0;
  border-color: #1890ff;
  color: #1890ff;
}

.action-btn:disabled {
  background-color: #f5f5f5;
  color: #bfbfbf;
  border-color: #d9d9d9;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Play 按钮可用时的样式 */
.action-btn.enabled {
  border-color: #1890ff;
  color: #1890ff;
  background-color: #e6f7ff;
}

.action-btn.enabled:hover {
  border-color: #40a9ff;
  background-color: #bae7ff;
}

/* Demo 按钮的成功样式（绿色，更醒目） */
.action-btn.success {
  background-color: #52c41a;
  border-color: #52c41a;
  color: white;
  font-weight: 500;
}

.action-btn.success:hover:not(:disabled) {
  background-color: #73d13d;
  border-color: #73d13d;
}

.action-btn.success:disabled {
  background-color: #f5f5f5;
  border-color: #d9d9d9;
  color: #bfbfbf;
}

.action-btn.demo {
  background-color: #722ed1;
  border-color: #722ed1;
  color: white;
  font-weight: 500;
}

.action-btn.demo:hover {
  background-color: #9254de;
  border-color: #9254de;
}

/* File display box */
.file-display-box {
  padding: 5px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: #fafafa;
  font-size: 12px;
  color: #ccc;
  font-style: italic;
  min-width: 140px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-display-box.has-file {
  background-color: #f6ffed;
  border-color: #b7eb8f;
  color: #52c41a;
  font-weight: 600;
  font-style: normal;
}

.file-display-box .placeholder {
  color: #ccc;
  font-style: italic;
}

.file-btn {
  min-width: 50px;
}

/* 控制按钮 */
.control-btn {
  min-width: 60px;
}

.stop-btn {
  background-color: #ff4d4f;
  color: white;
  border-color: #ff4d4f;
}

.stop-btn:hover:not(:disabled) {
  background-color: #ff7875;
  border-color: #ff7875;
}

/* Progress label */
.progress-label {
  font-size: 12px;
  color: #666;
  margin-left: 12px;
  white-space: nowrap;
}

.progress-placeholder {
  font-size: 12px;
  color: #ccc;
  font-family: monospace;
  margin-left: 4px;
}

/* Inline speed buttons */
.speed-btn-inline {
  padding: 4px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  background-color: white;
  color: #666;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 40px;
}

.speed-btn-inline:hover:not(:disabled) {
  background-color: #f0f0f0;
  border-color: #1890ff;
}

.speed-btn-inline.active {
  background-color: #1890ff;
  color: white;
  border-color: #1890ff;
}

.speed-btn-inline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Progress display */
.progress-display {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: monospace;
  font-size: 12px;
  margin-left: 4px;
}

.progress-display .current-time {
  color: #1890ff;
  font-weight: 600;
}

.progress-display .elapsed-mins {
  color: #52c41a;
  font-weight: 600;
}

.progress-display .total-mins {
  color: #666;
}

.progress-display .separator {
  color: #d9d9d9;
}

.action-btn.primary {
  background-color: #1890ff;
  color: white;
  border-color: #1890ff;
}

.action-btn.primary:hover:not(:disabled) {
  background-color: #40a9ff;
  border-color: #40a9ff;
}

.action-btn.stop {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
}

.action-btn.stop:hover {
  background-color: #ff7875;
  border-color: #ff7875;
}

/* 播放信息 */
.playback-info {
  margin-left: auto;
  font-size: 12px;
  color: #1890ff;
  font-weight: 600;
}

/* 内容区域 */
.waveform-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.placeholder {
  text-align: center;
  color: #999;
}

.placeholder p {
  margin: 8px 0;
  font-size: 14px;
}

.placeholder .hint {
  font-size: 12px;
  color: #1890ff;
  font-style: italic;
}

.data-info {
  text-align: center;
  color: #333;
}

.data-info p {
  margin: 6px 0;
  font-size: 13px;
}

/* 波形显示容器 */
.waveform-display {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
}

.waveform-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 12px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 10px;
}

.waveform-option {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  user-select: none;
}

.waveform-option input[type="checkbox"] {
  cursor: pointer;
}

.waveform-canvas {
  flex: 1;
  width: 100%;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
}
</style>
