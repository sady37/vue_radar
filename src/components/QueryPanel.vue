<template>
  <div class="query-panel" v-if="visible">
    <div class="query-overlay" @click="close"></div>
    <div class="query-content">
      <h3>历史数据播放</h3>
      
      <!-- 模式选择 -->
      <div class="mode-tabs">
        <button 
          :class="{ active: mode === 'manual' }"
          @click="mode = 'manual'"
        >
          手动导入
        </button>
        <button 
          :class="{ active: mode === 'auto' }"
          @click="mode = 'auto'"
        >
          自动查询
        </button>
      </div>
      
      <!-- 手动模式 -->
      <div v-if="mode === 'manual'" class="manual-mode">
        <div class="file-upload">
          <label>数据文件：</label>
          <input type="file" @change="loadDataFile" accept=".json" />
          <span v-if="dataFile" class="file-name">✓ {{ dataFile.name }}</span>
        </div>
        
        <div class="file-upload">
          <label>布局文件：</label>
          <input type="file" @change="loadLayoutFile" accept=".json" />
          <span v-if="layoutFile" class="file-name">✓ {{ layoutFile.name }}</span>
        </div>
        
        <div class="form-actions">
          <button 
            @click="playManual" 
            :disabled="!dataFile || !layoutFile || loading"
            class="btn-primary"
          >
            {{ loading ? '加载中...' : '播放' }}
          </button>
          <button @click="close" class="btn-secondary">取消</button>
        </div>
      </div>
      
      <!-- 自动模式 -->
      <div v-else class="auto-mode">
        <div class="form-row">
          <label>雷达ID：</label>
          <input v-model="radarId" type="text" placeholder="例如：RADAR_001" />
        </div>
        
        <div class="form-row">
          <label>开始时间：</label>
          <input v-model="startTime" type="datetime-local" />
        </div>
        
        <div class="form-row">
          <label>结束时间：</label>
          <input v-model="endTime" type="datetime-local" />
        </div>
        
        <div class="form-actions">
          <button @click="playAuto" :disabled="loading" class="btn-primary">
            {{ loading ? '查询中...' : '播放' }}
          </button>
          <button @click="close" class="btn-secondary">取消</button>
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
const loading = ref(false);
const error = ref('');

// 手动模式
const dataFile = ref<File | null>(null);
const layoutFile = ref<File | null>(null);
const manualData = ref<any>(null);
const manualLayout = ref<any>(null);

// 自动模式
const radarId = ref('');
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
        console.log('✓ 数据文件加载成功');
      } catch (err) {
        error.value = '数据文件格式错误';
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
        console.log('✓ 布局文件加载成功');
      } catch (err) {
        error.value = '布局文件格式错误';
      }
    };
    reader.readAsText(file);
  }
};

// 手动播放
const playManual = () => {
  if (!manualData.value || !manualLayout.value) {
    error.value = '请先加载数据和布局文件';
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
    error.value = err.message || '播放失败';
  } finally {
    loading.value = false;
  }
};

// 自动播放
const playAuto = async () => {
  if (!radarId.value || !startTime.value || !endTime.value) {
    error.value = '请填写完整信息';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const start = new Date(startTime.value).getTime();
    const end = new Date(endTime.value).getTime();
    
    // 调用后端API
    const response = await fetch('/api/radar/playback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        radarId: radarId.value,
        startTime: start,
        endTime: end,
      }),
    });
    
    if (!response.ok) {
      throw new Error('查询失败');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '查询失败');
    }
    
    // 应用配置并播放
    applyConfigAndPlay(result.data.layout, result.data.data);
    
    emit('success');
    close();
  } catch (err: any) {
    error.value = err.message || '查询失败，请稍后重试';
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

