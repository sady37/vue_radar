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
      <div v-if="hoverInfo.sleepState">Sleep: {{ hoverInfo.sleepState }}</div>
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
        <span>{{ formatAbsoluteTime(startEpoch + currentTime) }}</span>
        <span>/</span>
        <span>{{ formatAbsoluteTime(startEpoch + totalDuration) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';

// Props
const props = withDefaults(defineProps<{
  mode: 'realtime' | 'history';  // 显示模式
  data: any[];                   // 波形数据 [{ timestamp, hr, rr, sleepStage? }]
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
const hoverInfo = ref<{ x: number; y: number; time: string; hr: number; rr: number; sleepState?: string } | null>(null);

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

// 起始epoch（用于template访问）
const startEpoch = computed(() => props.startEpoch || 0);

// 睡眠状态颜色映射
const SLEEP_STATE_COLORS: Record<string, string> = {
  'Awake': '#FFE7BA',           // 浅橙/米色
  'Light sleep': '#BAE7FF',     // 浅蓝色
  'Deep sleep': '#D3ADF7',      // 浅紫色
  'Not in Bed': '#F5F5F5',      // 浅灰/米白色
  'Not monitoring': '#BFBFBF'   // 中灰色
};

// 从sleep_stage解析睡眠状态
const parseSleepState = (sleepStage: number | undefined): string => {
  if (sleepStage === undefined || sleepStage === null || sleepStage === 0) {
    return 'Not monitoring';
  }
  
  // 直接值映射（某些数据源直接使用数字表示状态）
  if (sleepStage === 1) return 'Light sleep';   // 1: 浅睡
  if (sleepStage === 2) return 'Deep sleep';    // 2: 深睡
  if (sleepStage === 3) return 'Awake';         // 3: 清醒
  
  // bit字段模式（提取bit 7-6）
  const sleepBits = (sleepStage >> 6) & 0b11;
  
  switch (sleepBits) {
    case 0b00:  // 00: 未定义
      return 'Not monitoring';
    case 0b01:  // 01: 浅睡
      return 'Light sleep';
    case 0b10:  // 10: 深睡
      return 'Deep sleep';
    case 0b11:  // 11: 清醒
      return 'Awake';
    default:
      return 'Not monitoring';
  }
};

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
  // Normal: 55-95
  if (value >= 55 && value <= 95) {
    return '#1890ff';  // Normal: 蓝色
  }
  // L2: 45-54 或 96-115
  else if ((value >= 45 && value <= 54) || (value >= 96 && value <= 115)) {
    return '#fadb14';  // L2: 黄色
  }
  // L1: 0-44 或 116+
  else {
    return '#ff4d4f';  // L1: 红色
  }
};

// 根据RR值获取颜色
const getRRColor = (value: number): string => {
  // Normal: 10-23
  if (value >= 10 && value <= 23) {
    return '#52c41a';  // Normal: 绿色
  }
  // L2: 8-9 或 24-26
  else if ((value >= 8 && value <= 9) || (value >= 24 && value <= 26)) {
    return '#fadb14';  // L2: 黄色
  }
  // L1: 0-7 或 27+
  else {
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
  
  // 调试信息
  if (props.mode === 'realtime' && props.data.length > 0) {
    console.log(`🎨 绘制波形: 数据点=${props.data.length}, 最新时间=${props.data[props.data.length - 1].timestamp.toFixed(1)}s`);
  }
  
  // 绘制背景（根据darkBackground属性）
  const bgColor = props.data.length > 0 && props.darkBackground ? '#1a1a1a' : '#ffffff';
  const fgColor = props.data.length > 0 && props.darkBackground ? '#ffffff' : '#333333';
  const gridColor = props.data.length > 0 && props.darkBackground ? '#444' : '#e0e0e0';
  const textColor = props.data.length > 0 && props.darkBackground ? '#999' : '#666';
  
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
  
  // 计算边距
  const padding = { left: 35, right: 10, top: 10, bottom: 60 };  // right=10px
  const chartWidth = canvasWidth.value - padding.left - padding.right;
  const chartHeight = canvasHeight.value - padding.top - padding.bottom;
  
  // Y轴范围：-2到150（-2到0用于睡眠状态）
  const yMin = -2;
  const yMax = 150;
  
  // 辅助函数：值到Y坐标
  const valueToY = (value: number): number => {
    const ratio = (value - yMin) / (yMax - yMin);
    return padding.top + chartHeight * (1 - ratio);  // Y轴向下
  };
  
  // 辅助函数：timestamp到X坐标（用于实时模式和绘制）
  const timestampToX = (timestamp: number): number => {
    if (props.mode === 'realtime') {
      const windowSize = 30;  // 30秒窗口
      
      // 使用props.data而不是displayData，避免循环引用
      const allData = props.data;
      if (allData.length === 0) return padding.left;
      
      const latestTimestamp = allData[allData.length - 1].timestamp;
      
      // 窗口起始时间
      const windowStart = Math.max(0, latestTimestamp - windowSize);
      
      // 计算该点在窗口中的位置
      const ratio = (timestamp - windowStart) / windowSize;
      return padding.left + chartWidth * Math.max(0, Math.min(1, ratio));
    } else {
      // 历史模式使用分钟边界计算
      const startEpoch = props.startEpoch || 0;
      const endEpoch = props.endEpoch || startEpoch;
      if (startEpoch > 0 && endEpoch > 0) {
        const startMinuteBoundary = Math.floor(startEpoch / 60) * 60;
        const endMinuteBoundary = Math.ceil(endEpoch / 60) * 60;
        const pointEpoch = startEpoch + timestamp;
        const ratio = (pointEpoch - startMinuteBoundary) / (endMinuteBoundary - startMinuteBoundary);
        return padding.left + chartWidth * ratio;
      }
      return padding.left;
    }
  };
  
  // 辅助函数：索引到X坐标
  const indexToX = (index: number): number => {
    if (props.mode === 'realtime') {
      // 实时模式：根据timestamp计算位置（30秒窗口）
      const windowSize = 30;  // 30秒窗口
      if (index < 0 || index >= props.data.length) return padding.left;
      
      const point = props.data[index];
      const latestTimestamp = props.data.length > 0 ? props.data[props.data.length - 1].timestamp : 0;
      
      // 计算该点相对于最新点的时间差
      const timeFromLatest = point.timestamp - latestTimestamp;  // 负值，表示多少秒前
      
      // 将时间映射到X轴（-30s到0s）
      const ratio = (timeFromLatest + windowSize) / windowSize;  // 0到1
      return padding.left + chartWidth * Math.max(0, Math.min(1, ratio));
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
  
  // Y轴刻度和标签（包含睡眠状态区域）
  const yTicks = [150, 125, 100, 75, 50, 25, 0];
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
  
  // 在Y=0位置画一条分隔线
  const y0Line = valueToY(0);
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, y0Line);
  ctx.lineTo(canvasWidth.value - padding.right, y0Line);
  ctx.stroke();
  
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
      // 实时模式：动态刻度，根据当前时间调整
      const latestTimestamp = props.data.length > 0 ? props.data[props.data.length - 1].timestamp : 0;
      
      // 如果还在前30秒，刻度从0开始；否则显示滚动窗口
      if (latestTimestamp <= 30) {
        // 前30秒：0s, 5s, 10s, 15s, 20s, 25s, 30s
        const ticks = [0, 5, 10, 15, 20, 25, 30];
        ticks.forEach((tick) => {
          const ratio = tick / 30;
          const x = padding.left + (chartWidth * ratio);
          const y = canvasHeight.value - padding.bottom;
          // 刻度线
          ctx.strokeStyle = gridColor;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 5);
          ctx.stroke();
          // 标签
          ctx.fillStyle = textColor;
          ctx.fillText(`${tick}s`, x, y + 8);
        });
      } else {
        // >30秒：滚动窗口，显示相对于now的时间
        const ticks = [-30, -25, -20, -15, -10, -5, 0];
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
      }
    } else {
      // 历史模式：X轴对齐到分钟边界
      const startEpoch = props.startEpoch || 0;
      const endEpoch = props.endEpoch || startEpoch;
      
      if (startEpoch > 0 && endEpoch > 0) {
        // 计算分钟边界（向下取整起始，向上取整结束）
        const startMinuteBoundary = Math.floor(startEpoch / 60) * 60;
        const endMinuteBoundary = Math.ceil(endEpoch / 60) * 60;
        const totalMinutes = Math.ceil((endMinuteBoundary - startMinuteBoundary) / 60);
        
        // 决定显示哪些刻度
        let ticksToShow: number[] = [];
        
        if (totalMinutes > 30) {
          // 超过30分钟：首尾 + 5的倍数
          ticksToShow.push(0); // 首（起始分钟）
          
          // 中间：5的倍数
          for (let i = 1; i < totalMinutes; i++) {
            const tickEpoch = startMinuteBoundary + (i * 60);
            const minutes = new Date(tickEpoch * 1000).getMinutes();
            if (minutes % 5 === 0) {
              ticksToShow.push(i);
            }
          }
          
          ticksToShow.push(totalMinutes); // 尾（结束分钟）
        } else {
          // <=30分钟：每分钟显示
          for (let i = 0; i <= totalMinutes; i++) {
            ticksToShow.push(i);
          }
        }
        
        // 绘制刻度
        ticksToShow.forEach(i => {
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
        });
      }
    }
  }
  
  // 绘制睡眠状态色块区域（Y轴0到-2）
  if (props.data.length > 0) {
    const sleepY0 = valueToY(0);    // Y=0的坐标
    const sleepYNeg2 = valueToY(-2); // Y=-2的坐标
    const sleepHeight = sleepYNeg2 - sleepY0;  // 色块高度
    
    // 按数据点绘制睡眠状态色块
    let displayData = props.data;
    if (props.mode === 'realtime') {
      // 实时模式：过滤最近30秒内的数据
      const latestTimestamp = props.data.length > 0 ? props.data[props.data.length - 1].timestamp : 0;
      displayData = props.data.filter(p => p.timestamp >= latestTimestamp - 30);
    }
    
    displayData.forEach((point, index) => {
      const sleepState = parseSleepState(point.sleepStage);
      const color = SLEEP_STATE_COLORS[sleepState];
      
      // 计算色块宽度（当前点到下一个点的距离）
      const x1 = props.mode === 'realtime' 
        ? timestampToX(point.timestamp)
        : indexToX(index);
      const x2 = index < displayData.length - 1 
        ? (props.mode === 'realtime' 
            ? timestampToX(displayData[index + 1].timestamp)
            : indexToX(index + 1))
        : canvasWidth.value - padding.right;
      const blockWidth = x2 - x1;
      
      ctx.fillStyle = color;
      ctx.fillRect(x1, sleepY0, blockWidth, sleepHeight);
    });
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
    // 实时模式：过滤最近30秒内的数据（根据timestamp）
    const latestTimestamp = props.data.length > 0 ? props.data[props.data.length - 1].timestamp : 0;
    displayData = props.data.filter(p => p.timestamp >= latestTimestamp - 30);
  }
  
  // 绘制HR曲线（相邻点连线或孤立点）
  ctx.lineWidth = 2;
  for (let i = 0; i < displayData.length; i++) {
    const point = displayData[i];
    if (point.hr && point.hr > 0) {
      const x = timestampToX(point.timestamp);
      const y = valueToY(point.hr);
      const color = getHRColor(point.hr);
      
      // 检查前后是否有相邻点
      const hasPrev = i > 0 && displayData[i - 1].hr && displayData[i - 1].hr > 0;
      const hasNext = i < displayData.length - 1 && displayData[i + 1].hr && displayData[i + 1].hr > 0;
      
      if (hasPrev) {
        // 有前一个点，画线段到当前点
        const prevPoint = displayData[i - 1];
        const prevX = timestampToX(prevPoint.timestamp);
        const prevY = valueToY(prevPoint.hr);
        const prevColor = getHRColor(prevPoint.hr);
        
        // 用前一点的颜色画线
        ctx.strokeStyle = prevColor;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      
      if (!hasPrev && !hasNext) {
        // 孤立点，画圆点
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  // 绘制RR曲线（相邻点连线或孤立点）
  ctx.lineWidth = 2;
  for (let i = 0; i < displayData.length; i++) {
    const point = displayData[i];
    if (point.rr && point.rr > 0) {
      const x = timestampToX(point.timestamp);
      const y = valueToY(point.rr);
      const color = getRRColor(point.rr);
      
      // 检查前后是否有相邻点
      const hasPrev = i > 0 && displayData[i - 1].rr && displayData[i - 1].rr > 0;
      const hasNext = i < displayData.length - 1 && displayData[i + 1].rr && displayData[i + 1].rr > 0;
      
      if (hasPrev) {
        // 有前一个点，画线段到当前点
        const prevPoint = displayData[i - 1];
        const prevX = timestampToX(prevPoint.timestamp);
        const prevY = valueToY(prevPoint.rr);
        const prevColor = getRRColor(prevPoint.rr);
        
        // 用前一点的颜色画线
        ctx.strokeStyle = prevColor;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      
      if (!hasPrev && !hasNext) {
        // 孤立点，画圆点
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
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
  
  const padding = { left: 35, right: 10, top: 10, bottom: 60 };  // 与绘制函数保持一致
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
    
    // 计算绝对时间
    const absoluteEpoch = (props.startEpoch || 0) + point.timestamp;
    const absoluteTime = formatAbsoluteTime(absoluteEpoch);
    const sleepState = parseSleepState(point.sleepStage);
    
    hoverInfo.value = {
      x: x + 10,
      y: y - 80,  // 增加高度以容纳睡眠状态
      time: absoluteTime,  // 使用绝对时间 HH:MM:SS
      hr: point.hr || 0,
      rr: point.rr || 0,
      sleepState: sleepState
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

// 格式化绝对时间（epoch秒 → HH:MM:SS）
const formatAbsoluteTime = (epochSeconds: number): string => {
  const date = new Date(epochSeconds * 1000);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
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
  padding: 8px;  /* 恢复83b0f27的8px */
  border: 1px solid #e0e0e0;  /* 恢复83b0f27的边框 */
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

