# Canvas 人员显示功能使用指南

## 📋 概述

Canvas 现在支持实时显示雷达检测到的人员，包括：
- ✅ 人员姿态图标（根据姿态显示不同图标）
- ✅ 人员标签（显示人员索引 P0, P1, P2...）
- ✅ 移动轨迹（最近50个位置点）
- ✅ 多人显示（支持同一雷达识别多人）
- ✅ 自动更新（数据更新时自动重绘）

---

## 🚀 快速开始

### 步骤 1：启动数据仿真

```typescript
// 在您的组件或初始化代码中
import { MockRadarService } from '@/utils/mockRadarData';
import { useRadarDataStore } from '@/stores/radarData';
import { useObjectsStore } from '@/stores/objects';

const radarDataStore = useRadarDataStore();
const objectsStore = useObjectsStore();

// 创建 Mock 服务
const mockService = new MockRadarService();

// 加载 Canvas 布局（让仿真知道床和雷达的位置）
mockService.loadCanvasLayout(objectsStore.objects);

// 启动数据流
mockService.startMockDataStream(
  // 人员轨迹数据回调
  (persons) => {
    radarDataStore.updatePersons(persons);
  },
  // 生理数据回调
  (vital) => {
    console.log('生理数据:', vital);
  }
);
```

### 步骤 2：自动显示

✅ 无需其他操作！Canvas 会自动：
1. 监听 `radarDataStore.persons` 变化
2. 调用 `drawPersons()` 绘制所有在场人员
3. 绘制姿态图标、标签和轨迹

---

## 🎨 显示效果

### 人员图标

根据姿态显示不同的 SVG 图标：

| 姿态 | 图标 | 颜色/样式 |
|------|------|----------|
| Lying (6) | 躺卧图标 | 浅蓝色 |
| Sitting (3) | 坐姿图标 | 默认 |
| Standing (4) | 站立图标 | 默认 |
| Walking (1) | 行走图标 | 默认 |
| FallConfirm (5) | 跌倒图标 | 红色警告 |
| SitUpBed (9) | 床上坐起图标 | 浅蓝色 |

### 人员标签

在图标上方显示：`P0`, `P1`, `P2`...

- P0 = 第1个人（personIndex = 0）
- P1 = 第2个人（personIndex = 1）
- P2 = 第3个人（personIndex = 2）

### 移动轨迹

- 蓝色虚线，连接最近50个位置点
- 淡化效果，显示移动路径
- 每个人独立的轨迹

---

## 📊 多人显示示例

### 场景：房间内2个人

```typescript
// 数据更新
radarDataStore.updatePersons([
  {
    id: 1001,
    deviceCode: '9D8A326309E7',
    personIndex: 0,              // 第1个人
    position: { x: 220, y: 170, z: 80 },
    posture: 6,                  // Lying
    remainTime: 30,
    event: 0,
    areaId: 1,
    timestamp: 1743269335
  },
  {
    id: 1002,
    deviceCode: '9D8A326309E7',
    personIndex: 1,              // 第2个人
    position: { x: 350, y: 300, z: 90 },
    posture: 4,                  // Standing
    remainTime: 5,
    event: 0,
    areaId: 0,
    timestamp: 1743269335
  }
]);
```

**Canvas 显示：**
```
床铺区域：
  [躺卧图标] P0  (220, 170)
  └─ 蓝色虚线轨迹

房间中央：
  [站立图标] P1  (350, 300)
  └─ 蓝色虚线轨迹
```

---

## 🎮 控制选项

### 显示/隐藏轨迹

可以在绘制函数中添加开关：

```typescript
const showTrajectory = ref(true);

const drawPersons = (ctx: CanvasRenderingContext2D) => {
  persons.forEach(person => {
    drawPosture(ctx, {...}, scale.value);
    drawPersonLabel(ctx, person);
    
    // 可选：只在开关打开时绘制轨迹
    if (showTrajectory.value && person.deviceCode) {
      drawPersonTrajectory(ctx, person.deviceCode, person.personIndex);
    }
  });
};
```

### 自定义标签内容

```typescript
// 显示更多信息
const label = `P${person.personIndex} | ${getPostureName(person.posture)}`;

// 或显示区域
const label = `P${person.personIndex} | Area${person.areaId}`;

// 或显示剩余时间
const label = `P${person.personIndex} | ${person.remainTime}s`;
```

---

## 🔄 实时更新流程

```
MockRadarService                radarDataStore              RadarCanvas
      |                              |                          |
      | 每1秒生成数据                  |                          |
      |----------------------------->|                          |
      |   updatePersons()            |                          |
      |                              |                          |
      |                              | watch 触发                |
      |                              |------------------------->|
      |                              |                          |
      |                              |                   redrawCanvas()
      |                              |                   drawPersons()
      |                              |                   显示图标+轨迹
```

---

## 📝 完整示例代码

### 在 App.vue 或其他初始化位置：

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { MockRadarService } from '@/utils/mockRadarData';
import { useRadarDataStore } from '@/stores/radarData';
import { useObjectsStore } from '@/stores/objects';

const radarDataStore = useRadarDataStore();
const objectsStore = useObjectsStore();

let mockService: MockRadarService | null = null;

onMounted(() => {
  // 创建并启动 Mock 服务
  mockService = new MockRadarService({
    vitalSignProbability: {
      danger: 0.2,
      warning: 0.2,
      normal: 0.5,
      undefined: 0.1
    },
    areaProbability: {
      bed: 0.6  // 60%概率在床上
    }
  });
  
  // 加载布局
  mockService.loadCanvasLayout(objectsStore.objects);
  
  // 启动数据流
  mockService.startMockDataStream(
    (persons) => {
      radarDataStore.updatePersons(persons);
      
      // 可选：打印日志
      persons.forEach(p => {
        console.log(
          `人员 P${p.personIndex}: ` +
          `位置(${Math.round(p.position.x)}, ${Math.round(p.position.y)}) ` +
          `姿态:${p.posture} 区域:${p.areaId}`
        );
      });
    },
    (vital) => {
      console.log(`生理数据: 心率${vital.heartRate} 呼吸${vital.breathing}`);
    }
  );
  
  console.log('✅ 人员数据流已启动');
});

onUnmounted(() => {
  // 停止数据流
  if (mockService) {
    mockService.stopDataStream();
    console.log('🛑 人员数据流已停止');
  }
});
</script>
```

---

## 🎯 功能特性

### 1. 自动在场检测

- 最近30秒有数据 → 在场（显示）
- 超过30秒无数据 → 离场（不显示）
- 超过60秒无数据 → 自动删除（调用 `removeInactivePersons()`）

### 2. 智能姿态显示

- 床上姿态：Lying, SitUpBed, SitUpBedConfirm
- 地面姿态：Walking, Standing, Sitting
- 警告姿态：FallConfirm, FallSuspect, SitGroundConfirm

### 3. 轨迹可视化

- 最多保存50个历史位置点
- 蓝色虚线连接
- 自动淡化旧轨迹

---

## 🔧 高级功能

### 多雷达显示

```typescript
// 按雷达分组显示
const byDevice = radarDataStore.personsByDevice;

Object.entries(byDevice).forEach(([deviceCode, persons]) => {
  console.log(`雷达 ${deviceCode}: ${persons.length} 人`);
  persons.forEach(p => {
    console.log(`  - P${p.personIndex}: 姿态${p.posture}`);
  });
});
```

### 自定义绘制样式

修改 `drawPersonLabel` 函数：

```typescript
// 根据姿态改变标签颜色
const drawPersonLabel = (ctx: CanvasRenderingContext2D, person: any) => {
  const pos = person.position;
  
  ctx.save();
  ctx.font = `${10 * scale.value}px Arial`;
  
  // 警告姿态用红色
  if ([5, 7, 8].includes(person.posture)) {
    ctx.fillStyle = '#ff0000';
  } else {
    ctx.fillStyle = '#333';
  }
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  
  const label = `P${person.personIndex}`;
  ctx.fillText(label, pos.x * scale.value, (pos.y - 30) * scale.value);
  
  ctx.restore();
};
```

---

## ✅ 完成的修改

### 1. RadarCanvas.vue

✅ **导入**：`drawPosture` 函数
✅ **新增函数**：
- `drawPersons()` - 绘制所有在场人员
- `drawPersonLabel()` - 绘制人员标签
- `drawPersonTrajectory()` - 绘制移动轨迹

✅ **新增监听器**：
- 监听 `radarDataStore.persons` - 人员数据变化
- 监听 `radarDataStore.lastUpdate` - 数据更新时间

✅ **绘制流程**：
```
redrawCanvas()
  ├─ drawCoordinateSystem()
  ├─ drawAllObjects()
  ├─ drawRadarBoundaries()
  ├─ drawPersons()  ← 新增
  ├─ drawTempShape()
  └─ drawStatusPanel()
```

---

## 🎉 效果预览

现在当您：

1. **启动 MockRadarService**
   ```typescript
   mockService.startMockDataStream(...)
   ```

2. **数据自动生成**
   - 每1秒更新人员位置和姿态
   - 每2秒更新生理数据（Lying姿态时）

3. **Canvas 自动显示**
   - 人员图标随位置移动
   - 姿态自动切换（Walking → Sitting → Lying...）
   - 轨迹实时绘制
   - 多人同时显示

---

## 📁 相关文件

| 文件 | 功能 | 状态 |
|------|------|------|
| `src/utils/drawPosture.ts` | 人员姿态绘制 | ✅ 现有 |
| `src/utils/postureIcons.ts` | 姿态图标配置 | ✅ 现有 |
| `src/components/RadarCanvas.vue` | Canvas 显示 | ✅ 已添加人员绘制 |
| `src/stores/radarData.ts` | 数据状态管理 | ✅ 已优化 |
| `src/utils/mockRadarData.ts` | 数据仿真/回放 | ✅ 已修复 |

---

## 🎮 测试建议

### 测试仿真模式

```typescript
// 创建服务并启动
const service = new MockRadarService();
service.loadCanvasLayout(objectsStore.objects);
service.startMockDataStream(
  (persons) => radarDataStore.updatePersons(persons),
  (vital) => console.log(vital)
);

// 观察 Canvas，应该看到：
// - 人员图标在移动
// - 姿态自动变化
// - 轨迹实时绘制
```

### 测试历史回放

```typescript
// 确保 src/assets/Data/sample.txt 存在
// MockRadarService 会自动检测并切换到回放模式

// 控制台应该显示：
// "Using real data mode"

// Canvas 会按照历史数据的时间戳回放
```

---

## 🐛 故障排查

### 问题1：看不到人员

**检查：**
```typescript
// 1. 检查是否有数据
console.log('人员数据:', radarDataStore.persons);
console.log('在场人数:', radarDataStore.presentCount);

// 2. 检查数据是否新鲜
const now = Date.now() / 1000;
radarDataStore.persons.forEach(p => {
  console.log(`P${p.personIndex}: ${now - p.timestamp} 秒前`);
});

// 3. 检查位置是否在可见范围
radarDataStore.persons.forEach(p => {
  console.log(`P${p.personIndex}: (${p.position.x}, ${p.position.y})`);
});
```

### 问题2：图标不显示

**检查：**
```typescript
// 确保姿态值有效
console.log('姿态值:', person.posture);
console.log('姿态配置:', POSTURE_CONFIGS[person.posture]);
```

### 问题3：轨迹不显示

**检查：**
```typescript
// 轨迹需要至少2个点
const trajectory = radarDataStore.getPersonTrajectory(deviceCode, personIndex);
console.log('轨迹点数:', trajectory.length);
```

---

## 🔧 自定义选项

### 隐藏轨迹

```typescript
// 在 drawPersons 中注释掉轨迹绘制
// drawPersonTrajectory(ctx, person.deviceCode, person.personIndex);
```

### 隐藏标签

```typescript
// 注释掉标签绘制
// drawPersonLabel(ctx, person);
```

### 只显示特定区域的人

```typescript
const drawPersons = (ctx: CanvasRenderingContext2D) => {
  const persons = radarDataStore.currentPersons
    .filter(p => p.areaId === 1);  // 只显示床区域的人
  
  // ...
};
```

---

## 📊 性能说明

- **数据更新频率**：1秒/次（可配置）
- **Canvas 重绘**：数据变化时自动触发
- **轨迹长度**：最多50个点（可配置 `maxTrajectoryLength`）
- **自动清理**：超过60秒的数据自动删除

---

## ✅ 完成！

现在您的 Canvas 已经支持完整的人员显示功能：

1. ✅ 实时数据仿真或历史数据回放
2. ✅ 自动显示人员姿态图标
3. ✅ 人员标签和轨迹
4. ✅ 多人、多雷达支持
5. ✅ 自动更新和清理

只需启动 `MockRadarService`，Canvas 会自动显示所有内容！🎉

