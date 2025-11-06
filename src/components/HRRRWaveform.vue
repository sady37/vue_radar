<template>
  <div class="hrrr-waveform">
    <canvas 
      ref="canvasRef" 
      :width="canvasWidth" 
      :height="canvasHeight"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    ></canvas>
    
    <!-- 实时模式：右上角显示当前值 -->
    <div v-if="mode === 'realtime' && currentValues" class="realtime-values">
      <div class="value-item hr">
        <span class="label">HR:</span>
        <span class="value">{{ currentValues.hr }}</span>
        <span class="unit">bpm</span>
      </div>
      <div class="value-item rr">
        <span class="label">RR:</span>
        <span class="value">{{ currentValues.rr }}</span>
        <span class="unit">/min</span>
      </div>
    </div>
    
    <!-- 历史模式：鼠标悬停显示 -->
    <div v-if="mode === 'history' && hoverInfo" class="hover-info" :style="{ left: hoverInfo.x + 'px', top: hoverInfo.y + 'px' }">
      <div>{{ hoverInfo.time }}</div>
      <div>HR: {{ hoverInfo.hr }} bpm</div>
      <div>RR: {{ hoverInfo.rr }} /min</div>
    </div>
    
    <!-- 历史模式：时间滑轨 -->
    <div v-if="mode === 'history' && totalDuration > 0" class="time-slider">
      <input 
        type="range" 
        :min="0" 
        :max="totalDuration" 
        v-model.number="currentTime"
        @input="handleSliderChange"
      />
      <div class="time-display">
        <span>{{ formatTime(currentTime) }}</span>
        <span>/</span>
        <span>{{ formatTime(totalDuration) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';

// Props
const props = withDefaults(defineProps<{
  mode: 'realtime' | 'history';  // 显示模式
  data: any[];                   // 波形数据 [{ timestamp, hr, rr }]
  width?: number;                // Canvas宽度
  height?: number;               // Canvas高度
  darkBackground?: boolean;      // 背景色控制
  startEpoch?: number;           // 历史数据起始时间（epoch秒）
  endEpoch?: number;             // 历史数据结束时间（epoch秒）
}>(), {
  width: 800,
  height: 400,
  darkBackground: false  // 默认白色背景
});

// Refs
const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasWidth = computed(() => props.width || 800);
const canvasHeight = computed(() => props.height || 300);
const currentTime = ref(0);
const hoverInfo = ref<{ x: number; y: number; time: string; hr: number; rr: number } | null>(null);

// 当前值（实时模式）
const currentValues = computed(() => {
  if (props.mode === 'realtime' && props.data.length > 0) {
    const latest = props.data[props.data.length - 1];
    return {
      hr: latest.hr || 0,
      rr: latest.rr || 0
    };
  }
  return null;
});

// 总时长（历史模式，秒）
const totalDuration = computed(() => {
  if (props.mode === 'history' && props.data.length > 0) {
    const first = props.data[0].timestamp;
    const last = props.data[props.data.length - 1].timestamp;
    return last - first;
  }
  return 0;
});

// HR报警阈值
const HR_THRESHOLDS = {
  normal: { min: 55, max: 95 },
  l2: { min: 45, max: 115 },
  // l1: 0-44, 116+
};

// RR报警阈值
const RR_THRESHOLDS = {
  normal: { min: 10, max: 23 },
  l2: { min: 8, max: 26 },
  // l1: 0-7, 27+
};

// 根据HR值获取颜色
const getHRColor = (value: number): string => {
  if (value >= HR_THRESHOLDS.normal.min && value <= HR_THRESHOLDS.normal.max) {
    return '#1890ff';  // Normal: 蓝色
  } else if (value >= HR_THRESHOLDS.l2.min && value <= HR_THRESHOLDS.l2.max) {
    return '#fadb14';  // L2: 黄色
  } else {
    return '#ff4d4f';  // L1: 红色
  }
};

// 根据RR值获取颜色
const getRRColor = (value: number): string => {
  if (value >= RR_THRESHOLDS.normal.min && value <= RR_THRESHOLDS.normal.max) {
    return '#52c41a';  // Normal: 绿色
  } else if (value >= RR_THRESHOLDS.l2.min && value <= RR_THRESHOLDS.l2.max) {
    return '#fadb14';  // L2: 黄色
  } else {
    return '#ff4d4f';  // L1: 红色
  }
};

// 绘制波形
const drawWaveform = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // 清空画布
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
  
  // 绘制背景（根据darkBackground属性）
  const bgColor = props.data.length > 0 && props.darkBackground ? '#1a1a1a' : '#ffffff';
  const fgColor = props.data.length > 0 && props.darkBackground ? '#ffffff' : '#333333';
  const gridColor = props.data.length > 0 && props.darkBackground ? '#444' : '#e0e0e0';
  const textColor = props.data.length > 0 && props.darkBackground ? '#999' : '#666';
  
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
  
  // 计算边距
  const padding = { left: 50, right: 30, top: 20, bottom: 40 };
  const chartWidth = canvasWidth.value - padding.left - padding.right;
  const chartHeight = canvasHeight.value - padding.top - padding.bottom;
  
  // Y轴范围：0-150
  const yMin = 0;
  const yMax = 150;
  
  // 辅助函数：值到Y坐标
  const valueToY = (value: number): number => {
    const ratio = (value - yMin) / (yMax - yMin);
    return padding.top + chartHeight * (1 - ratio);  // Y轴向下
  };
  
  // 辅助函数：索引到X坐标
  const indexToX = (index: number): number => {
    if (props.mode === 'realtime') {
      // 实时模式：固定300秒窗口
      const windowSize = 300;
      const dataLength = Math.min(props.data.length, windowSize);
      const ratio = index / dataLength;
      return padding.left + chartWidth * ratio;
    } else {
      // 历史模式：基于分钟边界计算
      const startEpoch = props.startEpoch || 0;
      const endEpoch = props.endEpoch || startEpoch;
      
      if (startEpoch > 0 && endEpoch > 0 && props.data.length > 0 && index < props.data.length) {
        // 计算分钟边界
        const startMinuteBoundary = Math.floor(startEpoch / 60) * 60;
        const endMinuteBoundary = Math.ceil(endEpoch / 60) * 60;
        
        // 数据点的实际epoch = 起始epoch + 相对时间
        const pointEpoch = startEpoch + props.data[index].timestamp;
        
        // 计算在分钟边界范围内的比例
        const ratio = (pointEpoch - startMinuteBoundary) / (endMinuteBoundary - startMinuteBoundary);
        return padding.left + chartWidth * ratio;
      }
      
      // 回退：使用索引比例
      const ratio = index / Math.max(1, props.data.length - 1);
      return padding.left + chartWidth * ratio;
    }
  };
  
  // 绘制Y轴和刻度
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.fillStyle = textColor;
  ctx.font = '12px Arial';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  
  // Y轴线
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, canvasHeight.value - padding.bottom);
  ctx.stroke();
  
  // Y轴刻度和标签
  const yTicks = [0, 10, 23, 45, 55, 95, 115, 150];
  yTicks.forEach(tick => {
    const y = valueToY(tick);
    // 刻度线
    ctx.beginPath();
    ctx.moveTo(padding.left - 5, y);
    ctx.lineTo(padding.left, y);
    ctx.stroke();
    // 标签
    ctx.fillText(String(tick), padding.left - 10, y);
  });
  
  // 绘制报警线（横虚线）
  const drawAlarmLine = (value: number, color: string, label: string) => {
    const y = valueToY(value);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(canvasWidth.value - padding.right, y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 标签
    ctx.fillStyle = color;
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, padding.left + 5, y - 5);
  };
  
  // HR报警线
  drawAlarmLine(HR_THRESHOLDS.normal.min, '#fadb14', 'HR-N');  // 55 黄色
  drawAlarmLine(HR_THRESHOLDS.normal.max, '#fadb14', '');      // 95 黄色
  drawAlarmLine(HR_THRESHOLDS.l2.min, '#ff4d4f', 'HR-L2');     // 45 红色
  drawAlarmLine(HR_THRESHOLDS.l2.max, '#ff4d4f', 'HR-L1');     // 115 红色
  
  // RR报警线（去掉normal黄线，因为太接近L2红线）
  // drawAlarmLine(RR_THRESHOLDS.normal.min, '#fadb14', 'RR-N');  // 10 黄色 (已删除)
  // drawAlarmLine(RR_THRESHOLDS.normal.max, '#fadb14', '');      // 23 黄色 (已删除)
  drawAlarmLine(RR_THRESHOLDS.l2.min, '#ff4d4f', 'RR-L2');     // 8 红色
  drawAlarmLine(RR_THRESHOLDS.l2.max, '#ff4d4f', '');          // 26 红色
  
  // 绘制X轴
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, canvasHeight.value - padding.bottom);
  ctx.lineTo(canvasWidth.value - padding.right, canvasHeight.value - padding.bottom);
  ctx.stroke();
  
  // X轴刻度和标签（仅在有数据时绘制）
  if (props.data.length > 0) {
    ctx.strokeStyle = gridColor;
    ctx.fillStyle = textColor;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    if (props.mode === 'realtime') {
      // 实时模式：-300s to 0s (now)
      const ticks = [-300, -240, -180, -120, -60, 0];
      ticks.forEach((tick, index) => {
        const x = padding.left + (chartWidth * (index / (ticks.length - 1)));
        const y = canvasHeight.value - padding.bottom;
        // 刻度线
        ctx.strokeStyle = gridColor;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 5);
        ctx.stroke();
        // 标签
        ctx.fillStyle = textColor;
        ctx.fillText(tick === 0 ? 'now' : `${tick}s`, x, y + 8);
      });
    } else {
      // 历史模式：X轴对齐到分钟边界
      const startEpoch = props.startEpoch || 0;
      const endEpoch = props.endEpoch || startEpoch;
      
      if (startEpoch > 0 && endEpoch > 0) {
        // 计算分钟边界（向下取整起始，向上取整结束）
        const startMinuteBoundary = Math.floor(startEpoch / 60) * 60;
        const endMinuteBoundary = Math.ceil(endEpoch / 60) * 60;
        const totalMinutes = Math.ceil((endMinuteBoundary - startMinuteBoundary) / 60);
        
        // 绘制分钟刻度（每分钟一个刻度）
        for (let i = 0; i <= totalMinutes; i++) {
          const tickEpoch = startMinuteBoundary + (i * 60);
          const ratio = (tickEpoch - startMinuteBoundary) / (endMinuteBoundary - startMinuteBoundary);
          const x = padding.left + (chartWidth * ratio);
          const y = canvasHeight.value - padding.bottom;
          
          // 刻度线
          ctx.strokeStyle = gridColor;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 5);
          ctx.stroke();
          
          // 标签：只显示分钟数
          ctx.fillStyle = textColor;
          const date = new Date(tickEpoch * 1000);
          const minutes = date.getMinutes();
          ctx.fillText(`${minutes}`, x, y + 8);
        }
      }
    }
  }
  
  // 绘制数据
  if (props.data.length === 0) {
    // 无数据时显示提示
    ctx.fillStyle = textColor;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No Data - Load CSV file or start RealTime', canvasWidth.value / 2, canvasHeight.value / 2);
    return;
  }
  
  // 获取显示数据
  let displayData = props.data;
  if (props.mode === 'realtime') {
    // 实时模式：只显示最近300秒
    displayData = props.data.slice(-300);
  }
  
  // 绘制HR曲线（根据值动态变色）
  ctx.lineWidth = 2;
  let prevHRColor = '';
  let hrPathStarted = false;
  let lastHRPoint: { x: number; y: number } | null = null;
  
  displayData.forEach((point, index) => {
    if (point.hr && point.hr > 0) {
      const x = indexToX(index);
      const y = valueToY(point.hr);
      const color = getHRColor(point.hr);
      
      // 颜色变化或首次绘制时，开始新路径
      if (color !== prevHRColor) {
        if (hrPathStarted) {
          ctx.stroke();  // 结束上一段
        }
        ctx.strokeStyle = color;
        ctx.beginPath();
        // 从上一个点开始，保持连续
        if (lastHRPoint) {
          ctx.moveTo(lastHRPoint.x, lastHRPoint.y);
          ctx.lineTo(x, y);
        } else {
          ctx.moveTo(x, y);
        }
        prevHRColor = color;
        hrPathStarted = true;
      } else {
        ctx.lineTo(x, y);
      }
      lastHRPoint = { x, y };
    }
  });
  if (hrPathStarted) ctx.stroke();
  
  // 绘制RR曲线（根据值动态变色）
  ctx.lineWidth = 2;
  let prevRRColor = '';
  let rrPathStarted = false;
  let lastRRPoint: { x: number; y: number } | null = null;
  
  displayData.forEach((point, index) => {
    if (point.rr && point.rr > 0) {
      const x = indexToX(index);
      const y = valueToY(point.rr);
      const color = getRRColor(point.rr);
      
      // 颜色变化或首次绘制时，开始新路径
      if (color !== prevRRColor) {
        if (rrPathStarted) {
          ctx.stroke();  // 结束上一段
        }
        ctx.strokeStyle = color;
        ctx.beginPath();
        // 从上一个点开始，保持连续
        if (lastRRPoint) {
          ctx.moveTo(lastRRPoint.x, lastRRPoint.y);
          ctx.lineTo(x, y);
        } else {
          ctx.moveTo(x, y);
        }
        prevRRColor = color;
        rrPathStarted = true;
      } else {
        ctx.lineTo(x, y);
      }
      lastRRPoint = { x, y };
    }
  });
  if (rrPathStarted) ctx.stroke();
  
  // 历史模式：绘制当前时间指示线
  if (props.mode === 'history' && currentTime.value > 0) {
    const ratio = currentTime.value / totalDuration.value;
    const x = padding.left + chartWidth * ratio;
    
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, canvasHeight.value - padding.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
  }
};

// 监听背景颜色变化
watch(() => props.darkBackground, () => {
  drawWaveform();
});

// 鼠标移动处理（历史模式）
const handleMouseMove = (e: MouseEvent) => {
  if (props.mode !== 'history' || props.data.length === 0) return;
  
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const padding = { left: 50, right: 30, top: 20, bottom: 40 };
  const chartWidth = canvasWidth.value - padding.left - padding.right;
  
  // 检查是否在图表区域内
  if (x < padding.left || x > canvasWidth.value - padding.right) {
    hoverInfo.value = null;
    return;
  }
  
  // 计算对应的数据索引
  const ratio = (x - padding.left) / chartWidth;
  const index = Math.round(ratio * (props.data.length - 1));
  
  if (index >= 0 && index < props.data.length) {
    const point = props.data[index];
    hoverInfo.value = {
      x: x + 10,
      y: y - 60,
      time: formatTime(point.timestamp - props.data[0].timestamp),
      hr: point.hr || 0,
      rr: point.rr || 0
    };
  }
};

const handleMouseLeave = () => {
  hoverInfo.value = null;
};

// 滑轨改变处理
const handleSliderChange = () => {
  // 重绘以显示当前时间线
  drawWaveform();
};

// 格式化时间（秒 → MM:SS）
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// 监听数据变化
watch(() => props.data, () => {
  drawWaveform();
}, { deep: true });

// 挂载时绘制
onMounted(() => {
  drawWaveform();
});
</script>

<style scoped>
.hrrr-waveform {
  position: relative;
  border-radius: 4px;
  padding: 8px;
  border: 1px solid #e0e0e0;
}

canvas {
  display: block;
  border-radius: 4px;
  cursor: crosshair;
}

.realtime-values {
  position: absolute;
  top: 30px;
  right: 40px;
  display: flex;
  gap: 20px;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.value-item {
  display: flex;
  gap: 4px;
  align-items: baseline;
}

.value-item.hr .value {
  color: #1890ff;
  font-size: 18px;
  font-weight: bold;
}

.value-item.rr .value {
  color: #52c41a;
  font-size: 18px;
  font-weight: bold;
}

.value-item .label {
  color: #999;
}

.value-item .unit {
  color: #666;
  font-size: 12px;
}

.hover-info {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 10;
}

.hover-info div {
  margin: 2px 0;
}

.time-slider {
  margin-top: 8px;
  padding: 0 50px 0 50px;
}

.time-slider input[type="range"] {
  width: 100%;
  height: 4px;
  background: #444;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.time-slider input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: #1890ff;
  border-radius: 50%;
  cursor: pointer;
}

.time-slider input[type="range"]::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #1890ff;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.time-display {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}
</style>

