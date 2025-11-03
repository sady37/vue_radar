# Pinia Stores 使用指南

## ✅ 已完成集成

所有组件已成功集成 Pinia stores，实现了状态集中管理和组件间数据共享。

---

## 📦 Store 模块

### 1. Canvas Store（画布状态）

**文件**：`src/stores/canvas.ts`

**管理内容**：
- 画布尺寸（620×520）
- 缩放比例（0.5x - 2.0x）
- 显示选项（网格、刻度、边界）
- 网格和刻度参数

**使用示例**：

```typescript
import { useCanvasStore } from '@/stores';

const canvasStore = useCanvasStore();

// 获取状态
console.log(canvasStore.scale);           // 当前缩放
console.log(canvasStore.scaleInfo);       // { current, min, max, percentage }
console.log(canvasStore.originX);         // 原点X坐标

// 修改状态
canvasStore.setScale(1.5);                // 设置缩放
canvasStore.adjustZoom(0.1);              // 调整缩放
canvasStore.toggleGrid();                 // 切换网格
canvasStore.toggleScale();                // 切换刻度

// 坐标转换
const logical = canvasStore.toLogicalCoord(canvasX, canvasY);
console.log(logical);  // { x, y }
```

**状态属性**：
```typescript
{
  width: 620,
  height: 520,
  scale: 1.0,
  minScale: 0.5,
  maxScale: 2.0,
  showGrid: true,
  showScale: true,
  showBoundary: true,
  gridSize: 50,
  tickInterval: 100
}
```

---

### 2. Objects Store（对象管理）

**文件**：`src/stores/objects.ts`

**管理内容**：
- 所有对象列表（设备、家具、结构）
- 当前选中对象
- 对象ID生成

**使用示例**：

```typescript
import { useObjectsStore } from '@/stores';
import type { BaseObject } from '@/utils/types';

const objectsStore = useObjectsStore();

// 添加对象
const radar: BaseObject = {
  id: '',  // 自动生成
  typeName: 'Radar',
  device: { category: 'iot', /* ... */ },
  geometry: { type: 'point', data: { x: 0, y: 10, z: 280 } },
  // ...
};
objectsStore.addObject(radar);

// 查询对象
console.log(objectsStore.radars);         // 所有雷达
console.log(objectsStore.iotDevices);     // 所有IoT设备
console.log(objectsStore.furniture);      // 所有家具
console.log(objectsStore.selectedObject); // 选中的对象

// 操作对象
objectsStore.selectObject('radar_123');   // 选中
objectsStore.removeObject('radar_123');   // 删除
objectsStore.updateObject('radar_123', { /* updates */ }); // 更新
objectsStore.duplicateObject('radar_123');// 复制
objectsStore.clearAll();                  // 清空
```

**Getters**：
```typescript
{
  radars,           // BaseObject[] - 所有雷达
  iotDevices,       // BaseObject[] - 所有IoT设备
  furniture,        // BaseObject[] - 所有家具
  structures,       // BaseObject[] - 所有结构
  selectedObject,   // BaseObject | null - 选中的对象
  orderedObjects,   // BaseObject[] - 按zIndex排序
  totalCount,       // number - 对象总数
  hasSelection      // boolean - 是否有选中
}
```

---

### 3. RadarData Store（雷达数据）

**文件**：`src/stores/radarData.ts`

**管理内容**：
- 雷达连接状态
- 实时目标数据
- 人员信息
- 历史轨迹

**使用示例**：

```typescript
import { useRadarDataStore, type PersonData } from '@/stores';

const radarDataStore = useRadarDataStore();

// 设置连接
radarDataStore.setConnected(true);
radarDataStore.setActiveRadar('radar_001');

// 更新数据
const person: PersonData = {
  id: 'person1',
  position: { h: 100, v: 200, z: 80 },
  posture: 'Lying',
  heartRate: 72,
  breathRate: 16,
  sleepState: 'LightSleep',
  movement: 5,
  isPresent: true,
  lastUpdate: Date.now()
};
radarDataStore.addPerson(person);

// 查询数据
console.log(radarDataStore.presentCount);        // 在场人数
console.log(radarDataStore.personsWithVitalSigns); // 有生命体征的人员
console.log(radarDataStore.getPersonTrajectory('person1')); // 轨迹

// 模拟数据（测试用）
radarDataStore.mockData();
```

**数据类型**：
```typescript
interface PersonData {
  id: string;
  position: RadarPoint;
  posture: string;       // Lying、Sitting、Standing、Walking
  heartRate?: number;
  breathRate?: number;
  sleepState?: string;
  movement?: number;
  isPresent: boolean;
  lastUpdate: number;
}
```

---

### 4. Waveform Store（波形数据）

**文件**：`src/stores/waveform.ts`

**管理内容**：
- 4路波形数据（心率、呼吸、睡眠、体动）
- 暂停/录制状态
- 数据缓冲

**使用示例**：

```typescript
import { useWaveformStore } from '@/stores';

const waveformStore = useWaveformStore();

// 控制操作
waveformStore.togglePause();    // 切换暂停
waveformStore.pause();          // 暂停
waveformStore.resume();         // 继续
waveformStore.clearAll();       // 清空所有数据

// 更新数据
waveformStore.updateChannelData('heartRate', 72);
waveformStore.updateCurrentValue('sleepState', '浅睡');

// 批量更新
waveformStore.updateMultipleChannels({
  heartRate: 72,
  breathRate: 16,
  movement: 5
});

// 查询状态
console.log(waveformStore.channels);            // 所有通道
console.log(waveformStore.getChannel('heartRate')); // 指定通道
console.log(waveformStore.hasData);            // 是否有数据

// 数据导出
const data = waveformStore.exportData();

// 模拟数据（测试用）
waveformStore.mockData();
```

**通道结构**：
```typescript
interface WaveformChannel {
  id: string;             // 'heartRate' | 'breathRate' | 'sleepState' | 'movement'
  name: string;           // '心率' | '呼吸' | '睡眠状态' | '体动'
  unit: string;           // 'BPM' | 'RPM' | ''
  color: string;          // 显示颜色
  data: WaveformDataPoint[];
  currentValue: string;   // 当前值显示
  enabled: boolean;       // 是否启用
}
```

---

## 🔄 组件间通信

### 工作流程示例

#### 场景1：添加雷达设备

```
用户操作：点击 Toolbar 的"添加雷达"按钮

1. Toolbar.vue
   └─> handleAddDevice('radar')
       └─> objectsStore.addObject(radarObject)  ✅ 数据写入 store

2. RadarCanvas.vue
   └─> watch(() => objectsStore.objects, ...)  👀 监听到变化
       └─> redrawCanvas()
           └─> drawObject(radarObject)  🎨 自动重绘
```

#### 场景2：切换网格显示

```
用户操作：在 Toolbar 勾选/取消"显示网格"

1. Toolbar.vue
   └─> v-model="showGrid"  (computed 双向绑定)
       └─> canvasStore.showGrid = true/false  ✅ 自动同步

2. RadarCanvas.vue
   └─> watch(() => canvasStore.showGrid, ...)  👀 监听到变化
       └─> redrawCanvas()  🎨 立即更新显示
```

#### 场景3：缩放画布

```
用户操作：点击 Canvas 的"+"按钮或滚轮

1. RadarCanvas.vue
   └─> adjustZoom(0.1)
       └─> canvasStore.adjustZoom(0.1)  ✅ 更新 store

2. RadarCanvas.vue (自动)
   └─> watch(() => canvasStore.scale, ...)  👀 监听到变化
       └─> redrawCanvas()  🎨 重绘（新缩放）

3. Toolbar.vue (如需要)
   └─> 读取 canvasStore.scaleInfo  📊 显示当前缩放
```

---

## 📝 最佳实践

### 1. 使用 Computed 双向绑定

✅ **推荐**：
```typescript
const showGrid = computed({
  get: () => canvasStore.showGrid,
  set: (value) => {
    canvasStore.showGrid = value;
  }
});
```

❌ **不推荐**：
```typescript
const showGrid = ref(true);

const toggleGrid = () => {
  showGrid.value = !showGrid.value;
  canvasStore.showGrid = showGrid.value;  // 手动同步
};
```

### 2. 使用 Actions 而非直接修改

✅ **推荐**：
```typescript
canvasStore.adjustZoom(0.1);  // 使用 action
```

❌ **不推荐**：
```typescript
canvasStore.scale += 0.1;  // 直接修改（绕过边界检查）
```

### 3. 使用 Getters 获取派生状态

✅ **推荐**：
```typescript
console.log(objectsStore.radars);  // 使用 getter
```

❌ **不推荐**：
```typescript
const radars = objectsStore.objects.filter(obj => obj.typeName === 'Radar');
```

### 4. 组件只监听需要的数据

✅ **推荐**：
```typescript
watch(() => canvasStore.scale, () => {
  redrawCanvas();
});
```

❌ **不推荐**：
```typescript
watch(() => canvasStore, () => {
  redrawCanvas();
}, { deep: true });  // 监听整个 store，性能差
```

---

## 🧪 测试和调试

### Vue Devtools

1. 安装 Vue Devtools 浏览器扩展
2. 打开开发者工具 → Vue 标签
3. 选择 Pinia 图标 🍍
4. 查看所有 stores 的实时状态

### 控制台调试

```javascript
// 在浏览器控制台访问 store（开发模式）
const canvasStore = window.__PINIA__.state.value.canvas;
console.log(canvasStore);

const objectsStore = window.__PINIA__.state.value.objects;
console.log(objectsStore.objects);
```

### 模拟数据

```typescript
// 生成测试数据
radarDataStore.mockData();    // 模拟雷达数据
waveformStore.mockData();     // 模拟波形数据
```

---

## 📊 数据流图

```
┌─────────────────┐
│   Toolbar.vue   │  用户点击按钮
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ objectsStore    │  添加对象
│ .addObject()    │
└────────┬────────┘
         │
         ▼ (自动触发)
┌─────────────────┐
│ RadarCanvas.vue │  监听变化
│ watch(objects)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ redrawCanvas()  │  重新绘制
└─────────────────┘
```

---

## 🚀 下一步

1. **添加持久化**：使用 `pinia-plugin-persistedstate` 保存状态到 localStorage
2. **添加撤销/重做**：使用 `@pinia/plugin-history`
3. **添加 WebSocket**：在 radarData store 中集成实时数据
4. **优化性能**：使用 `storeToRefs` 解构响应式数据

---

## 📚 参考文档

- [Pinia 官方文档](https://pinia.vuejs.org/)
- [Vue 3 Composition API](https://vuejs.org/api/composition-api-setup.html)
- [TypeScript 与 Pinia](https://pinia.vuejs.org/core-concepts/typescript.html)

---

**创建时间**：2025-10-29  
**版本**：v1.0  
**状态**：✅ 已完成集成

