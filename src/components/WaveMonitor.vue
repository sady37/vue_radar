<template>
  <div class="wave-monitor">
    <div class="wave-header">
      <h3>WaveMonitor</h3>
    </div>
    
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
          class="time-input"
          placeholder="2025103123:27:28"
        />
        
        <label class="inline-label">～</label>
        <input 
          type="number" 
          v-model.number="timeLong" 
          class="time-long-input"
          :disabled="useEventTime"
          min="1"
          max="30"
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
          class="action-btn file-btn" 
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
      </div>
    </div>
    
    <!-- Waveform display area -->
    <div class="waveform-content">
      <div v-if="!dataLoaded" class="placeholder">
        <p>Select data source and click Play or Demo</p>
        <p v-if="useEventTime" class="hint">Event: 60s before + 120s after = 3min</p>
        <p v-else class="hint">StartTime: {{ timeLong }}min</p>
      </div>
      <div v-else class="data-info">
        <p>Data loaded: {{ loadedDataInfo }}</p>
        <p v-if="isPlaying">Playing... ({{ playbackSpeed }}x)</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useObjectsStore } from '@/stores/objects';
import { useRadarDataStore } from '@/stores/radarData';
import { MockRadarService } from '@/utils/mockRadarData';

const objectsStore = useObjectsStore();
const radarDataStore = useRadarDataStore();

// ===== 状态管理 =====
const selectedDeviceId = ref('');    // DeviceID 查询（第1行）
const displayRadarId = ref('');      // 展示雷达
const timeInput = ref('');
const useEventTime = ref(false);
const timeLong = ref(2);

const selectedFileName = ref('');    // 文件选择（第2行）
const selectedFileContent = ref(''); // 文件内容

const isPlaying = ref(false);        // 播放状态（第3行）
const isPaused = ref(false);         // 暂停状态
const playbackSpeed = ref<number>(1);
const currentTimeDisplay = ref('00:00:00');
const elapsedSeconds = ref(0);
const totalSeconds = ref(0);

const dataLoaded = ref(false);
const loadedDataInfo = ref('');

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
  timeLong.value = 2;
  playbackSpeed.value = 1;
  
  // Start playback
  startPlayback('demo');
};

// 开始播放（统一入口）
const startPlayback = async (source: 'backend' | 'file' | 'demo') => {
  try {
    // 验证展示雷达
    if (!displayRadarId.value && canvasRadars.value.length > 0) {
      displayRadarId.value = canvasRadars.value[0].id;
      console.log(`🎯 自动选择展示雷达: ${canvasRadars.value[0].name}`);
    }
    
    const displayRadar = canvasRadars.value.find(r => r.id === displayRadarId.value);
    
    console.log(`\n🎬 开始回放 (${source})`);
    console.log(`🎨 展示雷达: ${displayRadar?.name || '未选择'}`);
    
    // 启用回放模式（禁用时间过滤）
    radarDataStore.setPlaybackMode(true);
    
    let historicalData: any[] = [];
    
    if (source === 'backend') {
      // 从服务器查询
      const queryParams = calculateTimeRange();
      console.log('📡 查询参数:', queryParams);
      
      alert('Backend mode: Not implemented yet. Please use Demo mode.');
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
      
      // 获取仿真历史数据（生成240秒=4分钟的数据）
      const demoSeconds = 240;
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
  
  // 清理 Mock Service
  mockService = null;
  
  // 重置状态
  isPlaying.value = false;
  isPaused.value = false;
  elapsedSeconds.value = 0;
  currentTimeDisplay.value = '00:00:00';
  dataLoaded.value = false;
  loadedDataInfo.value = '';
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

.display-select {
  padding: 4px 6px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  width: 75px;
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
</style>
