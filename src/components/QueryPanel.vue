<template>
  <div class="query-panel" v-if="visible">
    <div class="query-overlay" @click="close"></div>
    <div class="query-content">
      <h3>Historical Data Playback</h3>
      
      <!-- 模式选择 -->
      <div class="mode-tabs">
        <button 
          :class="{ active: mode === 'manual' }"
          @click="mode = 'manual'"
        >
          Manual Import
        </button>
        <button 
          :class="{ active: mode === 'auto' }"
          @click="mode = 'auto'"
        >
          Auto Query
        </button>
      </div>
      
      <!-- Track/Vital选择 -->
      <div class="data-type-selector">
        <label class="radio-option">
          <input type="radio" value="track" v-model="dataType" />
          <span>Track</span>
        </label>
        <label class="radio-option">
          <input type="radio" value="vital" v-model="dataType" />
          <span>Vital</span>
        </label>
      </div>
      
      <!-- 手动模式 -->
      <div v-if="mode === 'manual'" class="manual-mode">
        <div class="file-upload">
          <label>Data File:</label>
          <input type="file" @change="loadDataFile" accept=".json" />
          <span v-if="dataFile" class="file-name">✓ {{ dataFile.name }}</span>
        </div>
        
        <div class="file-upload">
          <label>Layout File:</label>
          <input type="file" @change="loadLayoutFile" accept=".json" />
          <span v-if="layoutFile" class="file-name">✓ {{ layoutFile.name }}</span>
        </div>
        
        <div class="form-actions">
          <button 
            @click="playManual" 
            :disabled="!dataFile || !layoutFile || loading"
            class="btn-primary"
          >
            {{ loading ? 'Loading...' : 'Play' }}
          </button>
          <button @click="close" class="btn-secondary">Cancel</button>
        </div>
      </div>
      
      <!-- 自动模式 -->
      <div v-else class="auto-mode">
        <div class="form-row">
          <label>DeviceID:</label>
          <input v-model="deviceId" type="text" placeholder="e.g. DEVICE_001" />
        </div>
        
        <div class="form-row">
          <label>Start Time:</label>
          <input v-model="startTime" type="datetime-local" />
        </div>
        
        <div class="form-row">
          <label>End Time:</label>
          <input v-model="endTime" type="datetime-local" />
        </div>
        
        <div class="form-actions">
          <button @click="playAuto" :disabled="loading" class="btn-primary">
            {{ loading ? 'Querying...' : 'Play' }}
          </button>
          <button @click="close" class="btn-secondary">Cancel</button>
        </div>
      </div>
      
      <div v-if="error" class="error-msg">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCanvasStore } from '@/stores/canvas';
import { useRadarDataStore } from '@/stores/radarData';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const canvasStore = useCanvasStore();
const radarDataStore = useRadarDataStore();

const mode = ref<'manual' | 'auto'>('auto');  // 默认自动模式
const dataType = ref<'track' | 'vital'>('track');  // 数据类型：Track/Vital
const loading = ref(false);
const error = ref('');

// 手动模式
const dataFile = ref<File | null>(null);
const layoutFile = ref<File | null>(null);
const manualData = ref<any>(null);
const manualLayout = ref<any>(null);

// 自动模式
const deviceId = ref('');
const startTime = ref('');
const endTime = ref('');

// 加载数据文件
const loadDataFile = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    dataFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        manualData.value = JSON.parse(e.target?.result as string);
        console.log('✓ Data file loaded successfully');
      } catch (err) {
        error.value = 'Invalid data file format';
      }
    };
    reader.readAsText(file);
  }
};

// 加载布局文件
const loadLayoutFile = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    layoutFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        manualLayout.value = JSON.parse(e.target?.result as string);
        console.log('✓ Layout file loaded successfully');
      } catch (err) {
        error.value = 'Invalid layout file format';
      }
    };
    reader.readAsText(file);
  }
};

// 手动播放
const playManual = () => {
  if (!manualData.value || !manualLayout.value) {
    error.value = 'Please load data and layout files first';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    // 应用配置并播放
    applyConfigAndPlay(manualLayout.value, manualData.value);
    
    emit('success');
    close();
  } catch (err: any) {
    error.value = err.message || 'Playback failed';
  } finally {
    loading.value = false;
  }
};

// 自动播放
const playAuto = async () => {
  if (!deviceId.value || !startTime.value || !endTime.value) {
    error.value = 'Please fill in all fields';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const start = new Date(startTime.value).getTime();
    const end = new Date(endTime.value).getTime();
    
    // 调用后端API
    const apiEndpoint = dataType.value === 'track' ? '/api/radar/playback' : '/api/vital/playback';
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId: deviceId.value,
        dataType: dataType.value,
        startTime: start,
        endTime: end,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Query failed');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Query failed');
    }
    
    // 应用配置并播放
    applyConfigAndPlay(result.data.layout, result.data.data);
    
    emit('success');
    close();
  } catch (err: any) {
    error.value = err.message || 'Query failed, please try again later';
  } finally {
    loading.value = false;
  }
};

// 应用配置并播放
const applyConfigAndPlay = (layout: any, data: any) => {
  // 应用布局
  canvasStore.setLayout(layout);
  
  // 加载历史数据
  radarDataStore.setMode('fromserver');
  radarDataStore.loadHistoricalData(data);
  
  console.log('✅ 配置已应用，开始播放', {
    layout,
    dataLength: data.length
  });
};

const close = () => {
  emit('close');
};
</script>

<style scoped>
.query-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.query-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.query-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 400px;
}

.query-content h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
}

.mode-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 8px;
}

.mode-tabs button {
  flex: 1;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.mode-tabs button.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  font-weight: 600;
}

.mode-tabs button:hover:not(.active) {
  color: #40a9ff;
}

.data-type-selector {
  display: flex;
  gap: 20px;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 16px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.radio-option input[type="radio"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.radio-option span {
  font-weight: 500;
}

.manual-mode,
.auto-mode {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-upload label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.file-upload input[type="file"] {
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
}

.file-name {
  font-size: 13px;
  color: #52c41a;
  margin-top: 4px;
}

.query-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-row label {
  min-width: 80px;
  font-size: 14px;
  color: #333;
}

.form-row input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #40a9ff;
}

.btn-primary:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #666;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.error-msg {
  padding: 8px 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  color: #ff4d4f;
  font-size: 13px;
}
</style>

