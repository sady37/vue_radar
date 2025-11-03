/**
 * 波形数据 Store
 * 管理生命体征波形数据（心率、呼吸、睡眠、体动）
 */

import { defineStore } from 'pinia';

// 波形数据点
export interface WaveformDataPoint {
  timestamp: number;  // 时间戳
  value: number;      // 数值
}

// 波形通道
export interface WaveformChannel {
  id: string;
  name: string;        // 通道名称
  unit: string;        // 单位
  color: string;       // 显示颜色
  data: WaveformDataPoint[];  // 数据点
  currentValue: string;       // 当前值（用于显示）
  minValue?: number;   // 最小值
  maxValue?: number;   // 最大值
  enabled: boolean;    // 是否启用
}

export const useWaveformStore = defineStore('waveform', {
  state: () => ({
    // 波形通道
    channels: [
      {
        id: 'heartRate',
        name: '心率',
        unit: 'BPM',
        color: '#e74c3c',
        data: [],
        currentValue: '-- BPM',
        minValue: 40,
        maxValue: 120,
        enabled: true
      },
      {
        id: 'breathRate',
        name: '呼吸',
        unit: 'RPM',
        color: '#3498db',
        data: [],
        currentValue: '-- RPM',
        minValue: 10,
        maxValue: 30,
        enabled: true
      },
      {
        id: 'sleepState',
        name: '睡眠状态',
        unit: '',
        color: '#9b59b6',
        data: [],
        currentValue: '--',
        enabled: true
      },
      {
        id: 'movement',
        name: '体动',
        unit: '',
        color: '#f39c12',
        data: [],
        currentValue: '--',
        enabled: true
      }
    ] as WaveformChannel[],
    
    // 控制状态
    isPaused: false,
    isRecording: false,
    
    // 缩放设置
    scale: 1.0,
    minScale: 0.5,
    maxScale: 2.0,
    
    // 数据缓冲配置
    maxDataPoints: 300,  // 每个通道最多保留的数据点数
    sampleInterval: 100, // 采样间隔（毫秒）
    
    // 最后更新时间
    lastUpdate: 0
  }),
  
  getters: {
    /**
     * 获取指定通道
     */
    getChannel: (state) => (channelId: string) => 
      state.channels.find(ch => ch.id === channelId),
    
    /**
     * 启用的通道数量
     */
    enabledChannelCount: (state) => 
      state.channels.filter(ch => ch.enabled).length,
    
    /**
     * 是否有数据
     */
    hasData: (state) => 
      state.channels.some(ch => ch.data.length > 0),
    
    /**
     * 总数据点数
     */
    totalDataPoints: (state) => 
      state.channels.reduce((sum, ch) => sum + ch.data.length, 0)
  },
  
  actions: {
    /**
     * 更新通道数据
     */
    updateChannelData(channelId: string, value: number) {
      const channel = this.channels.find(ch => ch.id === channelId);
      if (!channel || this.isPaused) return;
      
      const dataPoint: WaveformDataPoint = {
        timestamp: Date.now(),
        value
      };
      
      channel.data.push(dataPoint);
      
      // 限制数据点数量
      if (channel.data.length > this.maxDataPoints) {
        channel.data.shift();
      }
      
      // 更新当前值显示
      this.updateCurrentValue(channelId, value);
      
      this.lastUpdate = Date.now();
    },
    
    /**
     * 更新当前值显示
     */
    updateCurrentValue(channelId: string, value: number | string) {
      const channel = this.channels.find(ch => ch.id === channelId);
      if (!channel) return;
      
      if (typeof value === 'number') {
        channel.currentValue = `${value} ${channel.unit}`;
      } else {
        channel.currentValue = value;
      }
    },
    
    /**
     * 批量更新多个通道
     */
    updateMultipleChannels(updates: Record<string, number>) {
      Object.entries(updates).forEach(([channelId, value]) => {
        this.updateChannelData(channelId, value);
      });
    },
    
    /**
     * 切换暂停/继续
     */
    togglePause() {
      this.isPaused = !this.isPaused;
      console.log(this.isPaused ? '⏸️ 波形已暂停' : '▶️ 波形继续');
    },
    
    /**
     * 暂停
     */
    pause() {
      this.isPaused = true;
    },
    
    /**
     * 继续
     */
    resume() {
      this.isPaused = false;
    },
    
    /**
     * 清空指定通道数据
     */
    clearChannel(channelId: string) {
      const channel = this.channels.find(ch => ch.id === channelId);
      if (channel) {
        channel.data = [];
        channel.currentValue = `-- ${channel.unit}`;
      }
    },
    
    /**
     * 清空所有数据
     */
    clearAll() {
      this.channels.forEach(channel => {
        channel.data = [];
        channel.currentValue = `-- ${channel.unit}`;
      });
      this.lastUpdate = 0;
      console.log('🧹 清空波形数据');
    },
    
    /**
     * 启用/禁用通道
     */
    setChannelEnabled(channelId: string, enabled: boolean) {
      const channel = this.channels.find(ch => ch.id === channelId);
      if (channel) {
        channel.enabled = enabled;
      }
    },
    
    /**
     * 开始录制
     */
    startRecording() {
      this.isRecording = true;
      console.log('🔴 开始录制');
    },
    
    /**
     * 停止录制
     */
    stopRecording() {
      this.isRecording = false;
      console.log('⏹️ 停止录制');
    },
    
    /**
     * 导出数据
     */
    exportData() {
      const data = {
        channels: this.channels.map(ch => ({
          id: ch.id,
          name: ch.name,
          unit: ch.unit,
          data: ch.data
        })),
        exportTime: new Date().toISOString()
      };
      
      console.log('📥 导出数据:', data);
      return data;
    },
    
    /**
     * 模拟数据（用于测试）
     */
    mockData() {
      // 模拟心率数据
      this.updateChannelData('heartRate', 72 + Math.random() * 10 - 5);
      
      // 模拟呼吸数据
      this.updateChannelData('breathRate', 16 + Math.random() * 4 - 2);
      
      // 模拟睡眠状态
      this.updateCurrentValue('sleepState', '浅睡');
      
      // 模拟体动
      this.updateChannelData('movement', Math.random() * 10);
    },
    
    /**
     * 设置缩放比例
     */
    setScale(scale: number) {
      this.scale = Math.max(this.minScale, Math.min(this.maxScale, scale));
    },
    
    /**
     * 调整缩放（增量）
     */
    adjustZoom(delta: number) {
      this.setScale(this.scale + delta);
    },
    
    /**
     * 重置缩放
     */
    resetZoom() {
      this.scale = 1.0;
    }
  }
});

