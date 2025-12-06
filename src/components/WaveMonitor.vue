<template>
  <div class="wave-monitor">
    <div class="wave-header">
      <h3>WaveMonitor</h3>
      <button class="query-btn" @click="showQueryPanel = true" title="Query Historical Data">
        🔍
      </button>
    </div>
    
    <!-- Query Panel -->
    <QueryPanel 
      :visible="showQueryPanel" 
      @close="showQueryPanel = false"
      @success="onQuerySuccess"
    />
    
    <!-- Toolbar -->
    <div class="track-toolbar">
      <!-- Row 1: DeviceID query parameters + PlayBack -->
      <div class="control-row">
        <label class="row-label">fromServer:</label>
        <input 
          type="text" 
          v-model="selectedDeviceId" 
          class="device-input"
          placeholder="DeviceID"
          list="device-list"
        />
        <datalist id="device-list">
          <option v-for="device in canvasDevices" :key="device.deviceId" :value="device.deviceId">
            {{ device.deviceId }} ({{ device.name }})
          </option>
        </datalist>
        
        <label class="inline-label">Start:</label>
        <input 
          type="text" 
          v-model="timeInput" 
          class="time-input time-input-wide"
          placeholder="2025103123:27"
        />
        
        <label class="inline-label">～</label>
        <input 
          type="text" 
          v-model="timeLong" 
          @blur="limitTimeLong"
          class="time-long-input"
          :disabled="useEventTime"
          placeholder="1-30"
        />
        <span class="unit">mins</span>
        
        <label class="checkbox-option">
          <input type="checkbox" v-model="useEventTime" />
          <span>Event</span>
        </label>
        
        <button 
          class="action-btn primary" 
          @click="handlePlayBack"
          :disabled="!canPlayBack"
        >
          Play
        </button>
      </div>
      
      <!-- Row 2: File + Display + PlayFile + PlayDemo -->
      <div class="control-row">
        <label class="row-label">fromLocalFile:</label>
        <button 
          class="action-btn primary" 
          @click="handleFromFile" 
          :disabled="isPlaying"
        >
          File
        </button>
        
        <div class="file-display-box" :class="{ 'has-file': selectedFileName }">
          <span v-if="selectedFileName" :title="selectedFileName">{{ selectedFileName }}</span>
          <span v-else class="placeholder">No file selected</span>
        </div>
        
        <label class="inline-label">Display:</label>
        <select v-model="displayRadarId" class="display-select">
          <option value="">Auto</option>
          <option v-for="radar in canvasRadars" :key="radar.id" :value="radar.id">
            {{ radar.name }}
          </option>
        </select>
        
        <button 
          class="action-btn" 
          :class="{ 'enabled': canPlayFile && !isPlaying }"
          @click="handlePlayFile"
          :disabled="!canPlayFile || isPlaying"
        >
          Play
        </button>
        
        <button 
          class="action-btn success" 
          @click="handlePlayDemo"
          :disabled="isPlaying"
        >
          Demo
        </button>
      </div>
      
      <!-- Row 3: Pause/Stop + Speed + Progress -->
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
        
        <span class="section-label section-label-end">Track</span>
      </div>
    </div>
    
    <!-- HR/RR Controls -->
    <div class="vital-toolbar">
      <!-- Row 1: fromServer for HR/RR -->
      <div class="vital-row">
        <label class="row-label">fromServer:</label>
        <input 
          type="text" 
          v-model="vitalDeviceId" 
          class="device-input-sm"
          placeholder="DeviceID"
        />
        
        <label class="inline-label">Start:</label>
        <input 
          type="text" 
          v-model="vitalTimeInput" 
          class="time-input time-input-wide"
          placeholder="2025110423:27"
        />
        
        <label class="inline-label">～</label>
        <input 
          type="text" 
          v-model="vitalTimeLong" 
          @blur="limitVitalTimeLong"
          class="time-long-input"
          placeholder="5-120"
        />
        <span class="unit">mins</span>
        
        <button 
          class="action-btn primary" 
          @click="handleLoadVitalServer"
          :disabled="!canLoadVitalServer"
        >
          Load
        </button>
        
        <span class="section-label section-label-end">Vital</span>
      </div>
      
      <!-- Row 2: fromFile for HR/RR -->
      <div class="vital-row">
        <label class="row-label">fromFile:</label>
        <button 
          class="action-btn primary" 
          @click="handleVitalFromFile"
        >
          File
        </button>
        
        <div class="file-display-box-sm" :class="{ 'has-file': vitalFileName }">
          <span v-if="vitalFileName" :title="vitalFileName">{{ vitalFileName }}</span>
          <span v-else class="placeholder">No file</span>
        </div>
        
        <button 
          class="action-btn primary" 
          @click="handleLoadVitalFile"
          :disabled="!canLoadVitalFile"
        >
          Load
        </button>
        
        <button 
          class="action-btn primary realtime-btn" 
          @click="handleRealTimeVital"
          :disabled="!canRealTimeVital"
        >
          RealTime
        </button>
        
        <select v-model="vitalSelectDevice" class="device-select-sm">
          <option value="">Auto</option>
          <option v-for="device in canvasDevices" :key="device.deviceId" :value="device.deviceId">
            {{ device.name }}
          </option>
        </select>
        
        <div class="style-control">
          <label class="inline-label">Style:</label>
          <label class="bg-toggle">
            <span class="bg-text-fixed">{{ darkBackground ? 'Black' : 'White' }}</span>
            <input type="checkbox" v-model="darkBackground" />
          </label>
        </div>
      </div>
    </div>
    
    <!-- HR/RR Waveform Display -->
    <HRRRWaveform 
      :mode="vitalMode"
      :data="vitalWaveformData"
      :width="590"
      :height="440"
      :dark-background="darkBackground"
      :start-epoch="vitalStartEpoch"
      :end-epoch="vitalEndEpoch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useObjectsStore } from '@/stores/objects';
import { useRadarDataStore } from '@/stores/radarData';
import { MockRadarService } from '@/utils/mockRadarData';
import QueryPanel from './QueryPanel.vue';
import HRRRWaveform from './HRRRWaveform.vue';

const objectsStore = useObjectsStore();
const radarDataStore = useRadarDataStore();

// ===== 查询面板 =====
const showQueryPanel = ref(false);

const onQuerySuccess = () => {
  console.log('✅ Query success, data loaded');
  showQueryPanel.value = false;
};

// ===== 状态管理 =====
const selectedDeviceId = ref('');    // DeviceID 查询（第1行）
const displayRadarId = ref('');      // 展示雷达
const timeInput = ref('');
const useEventTime = ref(false);
const timeLong = ref<number | string>('');

const selectedFileName = ref('');    // 文件选择（第2行）
const selectedFileContent = ref(''); // 文件内容

const isPlaying = ref(false);        // 播放状态（第3行）
const isPaused = ref(false);         // 暂停状态
const playbackSpeed = ref<number>(1);
const currentTimeDisplay = ref('00:00:00');
const elapsedSeconds = ref(0);
const totalSeconds = ref(0);

// HR/RR控制状态
const vitalDeviceId = ref('');        // fromServer: DeviceID
const vitalTimeInput = ref('');       // fromServer: Start时间
const vitalTimeLong = ref<number | string>('');         // fromServer: 时长
const vitalFileName = ref('');        // fromFile: 文件名
const vitalFileContent = ref('');     // fromFile: 文件内容
const vitalSelectDevice = ref('');    // fromFile: Select设备
const darkBackground = ref(true);     // 背景色（默认黑色）

// HR/RR波形数据
const vitalMode = ref<'realtime' | 'history'>('history');  // 波形模式
const vitalWaveformData = ref<Array<{ timestamp: number; hr?: number; rr?: number; sleepStage?: number }>>([]);  // 波形数据（hr和rr可选，允许中断）
const vitalParsedData = ref<Array<{ timestamp: number; hr: number; rr: number; sleepStage?: number }>>([]);  // 解析后的临时数据
const vitalStartEpoch = ref<number>(0);  // 历史数据的起始时间（秒，epoch）
const vitalEndEpoch = ref<number>(0);    // 历史数据的结束时间（秒，epoch）

// 播放控制
let playbackIntervalId: number | null = null;
let mockService: MockRadarService | null = null;

// ===== 计算属性 =====
// 本 Canvas 中的雷达列表（用于展示）
const canvasRadars = computed(() => {
  return objectsStore.objects.filter(obj => obj.typeName === 'Radar');
});

// 本 Canvas 中的设备信息（用于 DeviceID 提示）
const canvasDevices = computed(() => {
  return canvasRadars.value.map(r => ({
    deviceId: r.device?.iot?.deviceId || r.id,
    name: r.name,
    radarId: r.id  // Canvas 内部ID
  }));
});

// PlayBack 按钮是否可用（第1行）
const canPlayBack = computed(() => {
  if (!selectedDeviceId.value) return false;
  if (!timeInput.value) return false;
  return true;
});

// PlayFile 按钮是否可用（第2行）
const canPlayFile = computed(() => {
  return !!selectedFileName.value;
});

// HR/RR 相关计算属性
const canLoadVitalServer = computed(() => {
  return vitalDeviceId.value && vitalTimeInput.value && vitalTimeLong.value;
});

const canLoadVitalFile = computed(() => {
  return vitalFileName.value && vitalFileContent.value;
});

const canRealTimeVital = computed(() => {
  // RealTime模式从radarDataStore获取数据，不需要文件
  return true;
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
  input.accept = '.csv,.json';
  
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      console.log('📂 File loaded successfully:', file.name);
      
      selectedFileName.value = file.name;
      selectedFileContent.value = text;
      
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
const handlePlayBack = () => {
  console.log('🎬 PlayBack: Query historical data from server');
  startPlayback('backend');
};

// Row 2: PlayFile (play from selected file)
const handlePlayFile = () => {
  console.log('📂 PlayFile: Play from file');
  startPlayback('file');
};

// Row 2: PlayDemo (demo mode)
const handlePlayDemo = () => {
  console.log('🎲 PlayDemo: Demo mode');
  
  // Set demo parameters
  selectedDeviceId.value = canvasDevices.value[0]?.deviceId || 'DEMO_UUID';
  displayRadarId.value = canvasRadars.value[0]?.id || '';
  
  const now = Math.floor(Date.now() / 1000);
  const demoStart = now - 300;
  timeInput.value = formatTimestamp(demoStart);
  
  useEventTime.value = false;
  timeLong.value = 2;  // Demo场景实际是2分钟（120秒）
  playbackSpeed.value = 1;
  
  // Start playback
  startPlayback('demo');
};

// ===== HR/RR控制处理函数 =====
const handleLoadVitalServer = () => {
  console.log('📡 Load HR/RR from Server:', {
    deviceId: vitalDeviceId.value,
    start: vitalTimeInput.value,
    duration: vitalTimeLong.value
  });
  alert('Server mode: Not implemented yet');
};

const handleVitalFromFile = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,.json';
  
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      vitalFileName.value = file.name;
      vitalFileContent.value = text;
      
      // 解析CSV数据到临时变量（不立即显示）
      if (file.name.endsWith('.csv')) {
        const result = parseVitalCSV(text);
        vitalParsedData.value = result.records;
        vitalStartEpoch.value = result.startEpoch;
        vitalEndEpoch.value = result.endEpoch;
        console.log(`✅ Parsed Vital CSV: ${result.records.length} records`);
        console.log(`   Start: ${new Date(result.startEpoch * 1000).toLocaleString()}`);
        console.log(`   End: ${new Date(result.endEpoch * 1000).toLocaleString()}`);
      }
      
      console.log(`✅ Vital file selected: ${file.name}`);
    } catch (error) {
      console.error('❌ Vital file load failed:', error);
      vitalFileName.value = '';
      vitalFileContent.value = '';
      vitalParsedData.value = [];
      alert('File load failed');
    }
  };
  
  input.click();
};

// 解析Vital CSV数据
const parseVitalCSV = (content: string): { records: Array<{ timestamp: number; hr: number; rr: number; sleepStage?: number }>, startEpoch: number, endEpoch: number } => {
  const lines = content.trim().split('\n');
  const data: Array<{ timestamp: number; hr: number; rr: number; sleepStage?: number }> = [];
  
  if (lines.length < 2) return { records: [], startEpoch: 0, endEpoch: 0 };
  
  // 跳过表头
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      
      // CSV格式: id,device_code,breath_rate,heart_rate,event,timestamp,sleep_stage
      const record = {
        timestamp: parseInt(values[5] || '0', 10),
        hr: parseInt(values[3] || '0', 10),  // heart_rate
        rr: parseInt(values[2] || '0', 10),  // breath_rate
        sleepStage: parseInt(values[6] || '0', 10)  // sleep_stage
      };
      
      data.push(record);
    } catch (err) {
      console.warn('Vital CSV line parsing failed:', line, err);
    }
  }
  
  // 按时间戳排序（从旧到新）
  data.sort((a, b) => a.timestamp - b.timestamp);
  
  // 记录原始起始和结束epoch，再转换为相对时间
  let startEpoch = 0;
  let endEpoch = 0;
  if (data.length > 0) {
    startEpoch = data[0].timestamp;
    endEpoch = data[data.length - 1].timestamp;
    
    // 转换为相对时间（第一条记录为0秒）
    data.forEach(record => {
      record.timestamp = record.timestamp - startEpoch;
    });
  }
  
  console.log(`✅ Vital CSV parsing completed: ${data.length} records, duration: ${data.length > 0 ? data[data.length - 1].timestamp : 0}s`);
  return { records: data, startEpoch, endEpoch };
};

const handleLoadVitalFile = () => {
  console.log('📂 Load HR/RR from File:', vitalFileName.value);
  // 将解析的临时数据加载到波形显示
  if (vitalParsedData.value.length > 0) {
    vitalWaveformData.value = [...vitalParsedData.value];  // 复制数据
    vitalMode.value = 'history';
    console.log(`✅ Loaded Vital historical data: ${vitalWaveformData.value.length} records`);
  } else {
    alert('No data to load. Please select a file first.');
  }
};

const handleRealTimeVital = () => {
  console.log('🔴 RealTime HR/RR');
  console.log('   Current radarDataStore.persons:', radarDataStore.persons.length);
  
  // 切换到实时模式
  vitalMode.value = 'realtime';
  vitalWaveformData.value = [];  // 清空数据，准备接收实时数据
  vitalStartEpoch.value = Math.floor(Date.now() / 1000);  // 记录起始时间
  lastVitalUpdateTime = 0;  // 重置时间
  lastVitalValues = { hr: undefined, rr: undefined };  // 重置上次值
  
  console.log('✅ Switched to realtime mode, starting to receive radar data');
  console.log('   Tip: If no data, please click Demo button to start simulation data');
};

// 监听radarDataStore的实时vital数据
let lastVitalUpdateTime = 0;
let lastVitalValues = { hr: undefined as number | undefined, rr: undefined as number | undefined };

watch(() => radarDataStore.persons, (persons) => {
  // 只在实时模式下处理
  if (vitalMode.value !== 'realtime') {
    return;
  }
  
  const now = Date.now() / 1000;  // 当前epoch秒
  
  // 获取第一个人员（如果存在）
  const person = persons.length > 0 ? persons[0] : null;
  
  if (!person) {
    // console.log('⚠️  没有人员数据');
    return;
  }
  
  const currentHR = person.heartRate !== undefined && person.heartRate > 0 ? person.heartRate : undefined;
  const currentRR = person.breathRate !== undefined && person.breathRate > 0 ? person.breathRate : undefined;
  
  // 时间防抖：必须至少间隔1.8秒（mockRadarData每2秒更新一次vital）
  const timePassed = now - lastVitalUpdateTime;
  if (timePassed < 1.8) {
    return;  // 间隔太短，跳过
  }
  
  lastVitalUpdateTime = now;
  lastVitalValues = { hr: currentHR, rr: currentRR };
  
  const relativeTime = now - vitalStartEpoch.value;  // 相对起始时间的秒数
  
  // 添加数据点（保留undefined，允许数据中断）
  vitalWaveformData.value.push({
    timestamp: relativeTime,
    hr: currentHR,
    rr: currentRR,
    sleepStage: person.sleepState
  });
  
  // 保留窗口外的数据（用于平滑滚动），但限制总数
  const maxDataPoints = 100;  // 最多保留100个点
  if (vitalWaveformData.value.length > maxDataPoints) {
    vitalWaveformData.value.shift();
  }
  
  console.log(`📊 RealTime Vital: t=${relativeTime.toFixed(1)}s, HR=${currentHR}, RR=${currentRR}, Δt=${timePassed.toFixed(1)}s`);
}, { deep: true });

// 限制Track时长输入范围（2-30分钟）
const limitTimeLong = () => {
  if (!timeLong.value) {
    timeLong.value = 2;  // 默认2分钟
    return;
  }
  const num = parseInt(String(timeLong.value));
  if (isNaN(num) || num < 2) {
    timeLong.value = 2;
  } else if (num > 30) {
    timeLong.value = 30;
  } else {
    timeLong.value = num;
  }
};

// 限制Vital时长输入范围（5-120分钟，最长2小时）
const limitVitalTimeLong = () => {
  if (!vitalTimeLong.value) {
    vitalTimeLong.value = 5;  // 默认5分钟
    return;
  }
  const num = parseInt(String(vitalTimeLong.value));
  if (isNaN(num) || num < 5) {
    vitalTimeLong.value = 5;
  } else if (num > 120) {
    vitalTimeLong.value = 120;
  } else {
    vitalTimeLong.value = num;
  }
};

// 开始播放（统一入口）
const startPlayback = async (source: 'backend' | 'file' | 'demo') => {
  try {
    // 验证展示雷达
    if (!displayRadarId.value && canvasRadars.value.length > 0) {
      displayRadarId.value = canvasRadars.value[0].id;
      console.log(`🎯 Auto-selected display radar: ${canvasRadars.value[0].name}`);
    }
    
    const displayRadar = canvasRadars.value.find(r => r.id === displayRadarId.value);
    
    console.log(`\n🎬 Starting playback (${source})`);
    console.log(`🎨 Display radar: ${displayRadar?.name || 'Not selected'}`);
    
    // 启用回放模式（禁用时间过滤）
    radarDataStore.setPlaybackMode(true);
    
    let historicalData: any[] = [];
    
    if (source === 'backend') {
      // 从服务器查询
      const queryParams = calculateTimeRange();
      console.log('📡 Query parameters:', queryParams);
      
      alert('Backend mode: Not implemented yet. Please use Demo mode.');
      radarDataStore.setPlaybackMode(false);
      return;
      
    } else if (source === 'file') {
      // 从文件回放
      console.log('📂 File:', selectedFileName.value);
      
      if (!selectedFileContent.value) {
        throw new Error('No file content loaded');
      }
      
      // 解析文件内容（类似 MockRadarService.parseRealData）
      historicalData = parseRealData(selectedFileContent.value);
      totalSeconds.value = historicalData.length;  // 每秒一条数据
      
      console.log(`📊 File data: ${historicalData.length} records`);
      
    } else if (source === 'demo') {
      // Demo 模式：仅生成雷达数据，使用Canvas中已有的布局
      console.log('🎲 Demo mode: Generating simulated radar data');
      console.log('📦 Using Canvas layout, object count:', objectsStore.objects.length);
      
      // 检查是否有雷达
      const radar = objectsStore.objects.find(obj => obj.typeName === 'Radar');
      if (!radar) {
        alert('⚠️ Please load Canvas layout first (radar object required)\n\nSteps:\n1. Click Load Layout\n2. Select Canvas_Tom.json\n3. Then click Demo');
        radarDataStore.setPlaybackMode(false);
        return;
      }
      
      const bed = objectsStore.objects.find(obj => obj.typeName === 'Bed');
      console.log(`✅ Using display radar: ${radar.name || radar.id}`);
      if (bed) {
        console.log(`✅ Bed object detected: ${bed.name || bed.id}`);
      } else {
        console.log('⚠️ No bed object detected, will use radar center area to simulate on-bed scenario');
      }
      
      // 创建 MockRadarService 实例（传递 Canvas 对象）
      mockService = new MockRadarService(
        {},  // 使用默认配置
        objectsStore.objects  // 传递 Canvas 对象数组
      );
      
      // 获取仿真历史数据（生成120秒=2分钟的演示场景）
      const demoSeconds = 120;
      historicalData = mockService.getHistoricalData(demoSeconds);
      totalSeconds.value = historicalData.length;
      
      console.log(`📊 Generated ${historicalData.length} simulated radar data records`);
      
      if (historicalData.length > 0) {
        console.log('📌 First frame example:', historicalData[0]);
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
    
    // 初始化显示
    currentTimeDisplay.value = formatSecondsToTime(historicalData[0].timestamp);
    
    console.log('✅ Starting to play historical data...');
    
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
        console.log('✅ Playback completed');
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
      
      // 计算真实时间间隔（根据timestamp差值）
      let interval = 1000;  // 默认1秒
      if (currentIndex < historicalData.length) {
        const currentTimestamp = frameData.timestamp;
        const nextTimestamp = historicalData[currentIndex].timestamp;
        const timeDiff = nextTimestamp - currentTimestamp;  // 秒
        interval = timeDiff * 1000;  // 转换为毫秒
      }
      
      // 应用播放速度调整
      interval = interval / playbackSpeed.value;
      
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

// 解析真实数据（从文件 - 支持CSV和表格格式）
const parseRealData = (content: string): any[] => {
  const lines = content.trim().split('\n');
  const data: any[] = [];
  
  console.log(`📂 Parsing file, total ${lines.length} lines`);
  
  // 检测格式：CSV或表格
  const firstDataLine = lines.find(l => l.trim() && !l.trim().startsWith('+'));
  const isCSV = firstDataLine && !firstDataLine.includes('|');
  
  console.log(`📋 Detected format: ${isCSV ? 'CSV' : 'Table'}`);
  
  if (isCSV) {
    // CSV格式解析
    let headers: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // 第一行是表头
      if (i === 0 || headers.length === 0) {
        headers = line.split(',').map(h => h.trim().replace(/"/g, ''));
        console.log('📋 CSV headers:', headers);
        continue;
      }
      
      try {
        // 解析CSV行
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length < headers.length) {
          console.warn('Insufficient columns, skipping:', line);
          continue;
        }
        
        // 构建对象
        const row: any = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx];
        });
        
        // 转换为标准格式
        const record = {
          timestamp: parseInt(row.timestamp || '0', 10),
          persons: [{
            id: parseInt(row.id || '0', 10),
            deviceCode: row.device_code || 'UNKNOWN',
            personIndex: parseInt(row.person_index || '0', 10),
            posture: parseInt(row.posture || '0', 10),
            position: {
              x: parseInt(row.coordinate_x || '0', 10) * 10,  // dm → cm
              y: parseInt(row.coordinate_y || '0', 10) * 10,  // dm → cm
              z: parseInt(row.coordinate_z || '0', 10)
            },
            remainTime: parseInt(row.remaining_time || '0', 10),
            event: parseInt(row.event || '0', 10),
            areaId: parseInt(row.area_id || '0', 10),
            heartRate: undefined,
            breathRate: undefined,
            sleepState: undefined
          }]
        };
        
        data.push(record);
      } catch (e) {
        console.warn('CSV parsing failed:', line, e);
      }
    }
  } else {
    // 表格格式解析（原有逻辑）
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
          console.warn('Insufficient columns, skipping:', trimmed);
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
        console.warn('Parsing failed:', line, e);
      }
    }
  }
  
  console.log(`✅ Successfully parsed ${data.length} records`);
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
  
  // 清理 Mock Service
  mockService = null;
  
  // 重置状态
  isPlaying.value = false;
  isPaused.value = false;
  elapsedSeconds.value = 0;
  currentTimeDisplay.value = '00:00:00';
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
    const durationMinutes = timeLong.value || 2;  // 默认2分钟
    const durationSeconds = durationMinutes * 60;
    return {
      deviceId: selectedDeviceId.value,   // ← 第1层：数据来源的 UUID
      start: timestamp,
      end: timestamp + durationSeconds,
      duration: durationSeconds,
      mode: 'start'
    };
  }
};

// 解析时间字符串（支持精确到分钟或秒）
const parseTimeString = (timeStr: string): number => {
  const cleaned = timeStr.replace(/\s+/g, '');
  
  const year = parseInt(cleaned.substring(0, 4));
  const month = parseInt(cleaned.substring(4, 6)) - 1;
  const day = parseInt(cleaned.substring(6, 8));
  
  const timepart = cleaned.substring(8);
  const parts = timepart.split(':').map(s => parseInt(s) || 0);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;  // 如果没有秒，默认为0
  
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;  /* 恢复v0.6的15px */
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.wave-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.wave-header .query-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: #1890ff;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.wave-header .query-btn:hover {
  background: #40a9ff;
  transform: scale(1.08);
}

.wave-header .query-btn:active {
  transform: scale(0.92);
}

/* 工具栏 */
.track-toolbar {
  padding: 10px 15px;  /* 恢复v0.6的15px padding */
  background-color: #fafafa;
  border-bottom: 1px solid #e0e0e0;
}

/* HR/RR工具栏 */
.vital-toolbar {
  padding: 8px 15px;  /* 恢复v0.6的15px */
  background-color: #f0f7ff;
  border-bottom: 1px solid #d0e7ff;
}

.vital-row {
  display: flex;
  align-items: center;
  gap: 6px;  /* 恢复v0.6的6px */
  margin-bottom: 6px;
}

.vital-row:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: #1890ff;
  padding: 2px 8px;
  background: rgba(24, 144, 255, 0.1);
  border-radius: 3px;
}

.section-label-end {
  margin-left: auto;  /* 推到右侧 */
}

.realtime-btn {
  margin-left: 20px;  /* 恢复v0.6的20px */
}

.control-row {
  display: flex;
  align-items: center;
  gap: 6px;  /* 恢复v0.6的6px */
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
  width: 105px;  /* 恢复v0.6的105px */
  background-color: white;
  font-family: monospace;
}

.device-input::placeholder {
  color: #999;
  font-family: system-ui;
}

.display-select {
  padding: 4px 6px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  width: 75px;  /* 恢复v0.6的75px */
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

.time-input-wide {
  width: 120px;  /* 减小20px: 140 -> 120 */
}

.time-long-input {
  padding: 5px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  width: 60px;  /* 增加10px: 50 -> 60 */
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

/* File display box */
.file-display-box {
  padding: 5px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: #fafafa;
  font-size: 12px;
  color: #ccc;
  font-style: italic;
  min-width: 140px;  /* 恢复v0.6的140px */
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
  margin-left: 12px;  /* 恢复v0.6的12px */
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

/* HR/RR专用样式 */
.device-input-sm {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 11px;
  width: 95px;  /* 恢复v0.6的95px */
  background-color: white;
}

.file-display-box-sm {
  flex: 1;
  max-width: 160px;  /* 恢复v0.6的160px */
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 11px;
  background-color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-display-box-sm.has-file {
  color: #52c41a;
  font-weight: 600;
}

.file-display-box-sm .placeholder {
  color: #ccc;
  font-style: italic;
  font-size: 10px;
}

.device-select-sm {
  padding: 4px 6px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 11px;
  width: 90px;  /* 恢复v0.6的90px */
  background-color: white;
}

.bg-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #333;
  cursor: pointer;
  user-select: none;
  margin-left: 4px;
  padding: 3px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
}

.bg-toggle input[type="checkbox"] {
  cursor: pointer;
  margin-left: 6px;
}

.bg-toggle .bg-text-fixed {
  display: inline-block;
  width: 42px;  /* 恢复v0.6的42px */
  text-align: left;
  font-weight: 500;
  margin-right: 0;
}

.style-control {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 2px;  /* 整体右移2px */
}

.waveform-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  min-height: 200px;
}

.waveform-content .placeholder {
  text-align: center;
  color: #999;
}
</style>
