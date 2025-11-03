# 雷达旋转角度实现说明

## 📋 概述

实现了雷达设备的旋转角度功能，支持 Ceiling、Wall 和 Corn 三种安装模式的不同旋转表现。

---

## 🎯 功能特性

### 旋转角度 (Rotation)

- **默认值**：0°
- **范围**：0-360°（可循环）
- **步长**：5° (可自定义)
- **来源**：`BaseObject.angle` 属性

---

## 🔧 实现细节

### 1. Ceiling 模式（顶装）

**绘制形式**：圆形 + 中心点指示器

**旋转效果**：
```
- 整个雷达图标旋转
- 中心点指示器跟随旋转
- 扫描波纹跟随旋转
```

**物理含义**：
- 雷达在天花板上的水平旋转
- Rotation = 0°：默认朝向
- Rotation = 90°：顺时针旋转90度

**代码实现**：
```typescript
// Ceiling 模式
drawCircle(ctx, position, size, {...});           // 主体圆形
drawCircle(ctx, position, size * 1.5, {...});     // 扫描波纹
drawCircle(ctx, position, size * 0.3, {...});     // 中心点指示器
```

---

### 2. Wall 模式（壁装）

**绘制形式**：140度扇形 + 绿色圆心指示器

**默认方向（Rotation = 0°）**：
```
- 扇形沿Y轴向下对称
- 左边界：20° (从+Y逆时针70°)
- 右边界：160° (从+Y顺时针70°)
- 中轴：90° (+Y方向，向下)
- +H在左(-X方向)，-H在右(+X方向)
```

**旋转效果**：
```
- 整个扇形绕圆心旋转
- 绿色圆心指示器位置不变
```

**物理含义**：
- **Wall模式**：雷达紧贴墙壁，扇形140度覆盖范围
- Rotation：雷达波垂直于墙面的旋转（相当于人站立时在原地转圈）
- Rotation = 0°：雷达朝向正前方（+Y方向，向下）
- Rotation = 90°：雷达朝向右侧（+X方向）

**代码实现**：
```typescript
// Wall 模式：140度扇形
const halfAngle = (70 * Math.PI) / 180;     // 左右各70度
const centerAngle = Math.PI / 2;            // 90度，Y轴向下
const startAngle = centerAngle - halfAngle; // 20°
const endAngle = centerAngle + halfAngle;   // 160°

drawSector(ctx, position, size * 2.0, startAngle, endAngle, {...}); // 主体扇形
ctx.arc(position.x, position.y, size * 2.5, startAngle, endAngle);  // 扫描波纹
drawCircle(ctx, position, size * 0.3, { fillColor: '#00ff00' });    // 绿色圆心指示器
```

---

### 3. Corn 模式（角装）

**绘制形式**：90度扇形 + 绿色圆心指示器

**默认方向（Rotation = 0°）**：
```
- 扇形沿Y轴向下对称
- 左边界：45° (从+Y逆时针45°)
- 右边界：135° (从+Y顺时针45°)
- 中轴：90° (+Y方向，向下)
- +H在左(-X方向)，-H在右(+X方向)
```

**旋转效果**：
```
- 整个扇形绕圆心旋转
- 绿色圆心指示器位置不变
```

**物理含义**：
- **Corn模式**：雷达在墙角，扇形90度覆盖范围
- Rotation：雷达波垂直于墙面的旋转（相当于人站立时在原地转圈）
- Rotation = 0°：雷达朝向正前方（+Y方向，向下）
- Rotation = 90°：雷达朝向右侧（+X方向）

**代码实现**：
```typescript
// Corn 模式：90度扇形
const halfAngle = (45 * Math.PI) / 180;     // 左右各45度
const centerAngle = Math.PI / 2;            // 90度，Y轴向下
const startAngle = centerAngle - halfAngle; // 45°
const endAngle = centerAngle + halfAngle;   // 135°

drawSector(ctx, position, size * 2.0, startAngle, endAngle, {...}); // 主体扇形
ctx.arc(position.x, position.y, size * 2.5, startAngle, endAngle);  // 扫描波纹
drawCircle(ctx, position, size * 0.3, { fillColor: '#00ff00' });    // 绿色圆心指示器
```

**与Wall模式的差异**：
- ✅ Wall：140度扇形（左右各70度）
- ✅ Corn：90度扇形（左右各45度）
- ✅ 两者都使用绿色圆心指示器

---

## 🎨 视觉效果

### Ceiling 模式

```
    Rotation = 0°         Rotation = 90°
       ⬆                      ➡
      ╱●╲                    ╱●╲
     ●───●                  ●───●
      ╲●╱                    ╲●╱
   (白色中心点)            (白色中心点)
```

### Wall 模式（140度扇形）

```
    Rotation = 0°              Rotation = 90°
        
      ╱──╲                      ╱╲
     ╱  ●  ╲                   ╱  ╲
    ╱   🟢  ╲                 ╱ 🟢 ●╲
   ────140°────              ─────────
     (向下)                    (向右)
     
   扇形沿Y轴向下对称          扇形旋转90度
   +H在左，-H在右             指向+X方向
```

### Corn 模式（90度扇形）

```
    Rotation = 0°              Rotation = 90°
        
       ╱─╲                       ╱╲
      ╱ ● ╲                     ╱  ╲
     ╱  🟢 ╲                   ╱ 🟢╲
    ────90°────                ──────
     (向下)                    (向右)
     
   扇形沿Y轴向下对称          扇形旋转90度
   +H在左，-H在右             指向+X方向
```

**关键特征**：
- **Ceiling**：圆形（360°全向），白色中心点
- **Wall**：140度扇形（左右各70度），绿色🟢圆心指示器
- **Corn**：90度扇形（左右各45度），绿色🟢圆心指示器
- **扫描波纹**：外层扇形边界

---

## 🔧 代码位置

### 1. 绘制函数

**文件**：`src/utils/drawDevices.ts`

**函数签名**：
```typescript
export function drawRadarDevice(
  ctx: CanvasRenderingContext2D,
  position: Point,
  visual: BaseObject['visual'],
  setupModel: 'ceiling' | 'wall' | 'corn' = 'ceiling',
  rotation: number = 0  // 新增参数
): void
```

**旋转实现**：
```typescript
// 应用旋转（如果有）
if (rotation !== 0) {
  ctx.translate(position.x, position.y);
  ctx.rotate((rotation * Math.PI) / 180); // 角度转弧度
  ctx.translate(-position.x, -position.y);
}
```

---

### 2. 调用位置

**文件**：`src/utils/drawObjects.ts`

**调用代码**：
```typescript
case 'Radar':
  const setupModel = device.iot?.setupModel || 'ceiling';
  const rotation = obj.angle || 0; // 从对象获取旋转角度
  drawRadarDevice(ctx, position, visual, setupModel, rotation);
  break;
```

---

### 3. UI 控制

**文件**：`src/components/Toolbar.vue`

#### 显示当前角度
```vue
<div class="status-item">
  <span>角度:</span>
  <span class="status-value">{{ rotationAngle }}°</span>
</div>
```

#### 输入框（IoT配置区）
```vue
<div class="prop-row">
  <span>旋转:</span>
  <input 
    type="number" 
    v-model.number="rotationAngle" 
    @change="updateRotation"
    class="prop-num-sm" 
    step="5"
    title="雷达旋转角度（0-360°）"
  />
  <span>°</span>
</div>
```

#### 旋转按钮
```vue
<div class="rotation-controls">
  <button class="rotate-btn" @click="rotateObject(-15)">↶ -15°</button>
  <button class="rotate-btn" @click="rotateObject(15)">↷ +15°</button>
</div>
```

#### 函数实现
```typescript
// 监听选中对象，同步角度显示
watch(
  () => objectsStore.selectedObject,
  (newObj) => {
    if (newObj) {
      rotationAngle.value = newObj.angle || 0;
    } else {
      rotationAngle.value = 0;
    }
  },
  { immediate: true }
);

// 增量旋转（按钮）
const rotateObject = (angle: number) => {
  if (selectedObject.value) {
    const currentAngle = selectedObject.value.angle || 0;
    rotationAngle.value = currentAngle + angle;
    objectsStore.updateObject(selectedObject.value.id, {
      angle: rotationAngle.value
    });
  }
};

// 直接设置角度（输入框）
const updateRotation = () => {
  if (selectedObject.value) {
    objectsStore.updateObject(selectedObject.value.id, {
      angle: rotationAngle.value
    });
  }
};
```

---

## 📐 数据结构

### BaseObject 接口

**文件**：`src/utils/types.ts`

```typescript
export interface BaseObject {
  // ... 其他属性
  
  // 旋转角度（度数）
  angle?: number;  // 0-360°，默认0
}
```

---

## 🧪 使用示例

### 示例1：添加 Ceiling 模式雷达

```typescript
const radar = {
  typeName: 'Radar',
  geometry: { type: 'point', data: { x: 0, y: 10, z: 280 } },
  device: {
    category: 'iot',
    iot: {
      setupModel: 'ceiling',
      // ...
    }
  },
  angle: 45  // 旋转45度
};
```

**绘制结果**：圆形雷达图标顺时针旋转45度

---

### 示例2：添加 Wall 模式雷达

```typescript
const radar = {
  typeName: 'Radar',
  geometry: { type: 'point', data: { x: 0, y: 10, z: 170 } },
  device: {
    category: 'iot',
    iot: {
      setupModel: 'wall',
      // ...
    }
  },
  angle: 90  // 旋转90度
};
```

**绘制结果**：140度扇形雷达朝向右侧（+X方向）

---

## 🎮 操作方式

### 方式1：按钮增量调整

```
1. 选中雷达设备
2. 点击 ↶ -15° 按钮 → 逆时针旋转15度
3. 点击 ↷ +15° 按钮 → 顺时针旋转15度
4. 实时更新显示
```

### 方式2：输入框精确设置

```
1. 选中雷达设备
2. 在 IoT 配置区找到"旋转"输入框
3. 输入目标角度（如 90）
4. 回车或失焦 → 更新角度
```

### 方式3：查看当前角度

```
1. 选中雷达设备
2. 查看视图控制区的"角度"显示
   角度: 45°
```

---

## 📊 旋转角度与坐标系

### Ceiling 模式（俯视图）

```
        Y(+V)
         ↑
         │     Rotation = 0°
         │    ↑ (雷达朝向)
         │
  ───────┼───────→ X(+H)
         │
         │
```

### Wall 模式（侧视图 + 俯视图）

#### 侧视图（垂直视角）
```
    Z
    ↑
    │   📡 (雷达在墙上)
    │  ╱│╲
    │ ●──●  (扇形向前)
────┼────────→ Y
  墙面
```

#### 俯视图（水平旋转）
```
        Y(前)
         ↑
         │     Rotation = 0°
         │    ↑ (扇形朝向)
         │   ●  (雷达位置)
  ───────┼───────→ X(右)
  (墙面) │
         │
```

**ReflectionV 旋转**：
- 0°：扇形朝向 +Y（正前方）
- 90°：扇形朝向 +X（右侧）
- 180°：扇形朝向 -Y（正后方）
- 270°：扇形朝向 -X（左侧）

---

## 🔍 与之前项目的对比

| 特性 | 旧实现 | 新实现 |
|------|--------|--------|
| Ceiling 图形 | 圆形 + 白色中心点 | ✅ 保持不变 |
| Wall 图形 | 圆形 + 60度扇形指示器 | ✅ 140度扇形（左右各70度）+ 绿色圆心 |
| Corn 图形 | 与Wall相同 | ✅ 90度扇形（左右各45度）+ 绿色圆心 |
| 扇形方向 | - | ✅ 默认沿Y轴向下对称，+H在左 |
| 指示器颜色 | 白色 | ✅ Ceiling白色，Wall/Corn绿色 |
| 旋转参数 | 可能没有统一实现 | ✅ `angle` 属性统一管理 |
| 旋转含义 | - | ✅ 明确定义各模式含义 |
| UI 控制 | - | ✅ 输入框 + 按钮双控制 |

---

## 💡 设计原因

### 为什么 Wall 用140度扇形？

1. **符合实际雷达波束角度**
   - 实际毫米波雷达的水平视场角通常在 120-140 度
   - 140度是常见的设计值

2. **视觉效果更直观**
   - 清晰表达雷达的监测范围
   - 与圆形（360度）区分明显

3. **与 Ceiling 模式区分**
   - Ceiling：全向监测（圆形，360度）
   - Wall：定向监测（扇形，140度）
   - Corn：角落监测（扇形，90度）

### 为什么 Corn 用90度扇形？

1. **墙角安装的实际情况**
   - 雷达安装在墙角时，监测范围受限于两面墙的夹角
   - 90度正好覆盖一个直角区域

2. **与 Wall 模式区分**
   - Wall：壁装，140度广角
   - Corn：角装，90度窄角

3. **实际应用场景**
   - 墙角位置通常用于监测特定区域（如门口、床边）
   - 不需要太广的角度

### 为什么使用绿色圆心指示器？

1. **颜色区分**
   - Ceiling：白色中心点（全向雷达）
   - Wall/Corn：绿色圆心（定向雷达）
   - 不同颜色表示不同的安装模式

2. **视觉层次更清晰**
   - 扇形：主体（雷达波束范围）
   - 绿色圆点：指示雷达位置和状态
   - 绿色通常表示"工作中"、"就绪"

3. **符合直觉**
   - 绿色：安全、正常工作
   - 清晰标记雷达的实际安装位置

### 为什么扇形沿Y轴向下对称？

1. **符合雷达坐标系定义**
   - +V方向：雷达前方
   - Canvas中+Y向下，对应雷达+V方向
   - 扇形自然沿着前方方向展开

2. **+H在左，-H在右**
   - 符合雷达坐标系的H轴定义
   - H轴：水平方向，+H指向左侧
   - Canvas中+X向右，对应雷达-H方向

3. **旋转逻辑更自然**
   - Rotation = 0°：雷达朝向前方（+V，向下）
   - Rotation = 90°：雷达朝向右侧（-H，向右）
   - 符合人的直觉：在原地转圈

---

## 🐛 注意事项

### 1. 角度归一化

```typescript
// 可能需要将角度归一化到 0-360 范围
function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}
```

### 2. Canvas 旋转坐标系

```typescript
// 注意：Canvas 旋转是顺时针为正（与数学坐标系相反）
ctx.rotate((rotation * Math.PI) / 180);
```

### 3. 旋转后坐标变换

```typescript
// 使用 translate 确保绕中心点旋转
ctx.translate(position.x, position.y);
ctx.rotate(angle);
ctx.translate(-position.x, -position.y);
```

### 4. 性能考虑

- 每次旋转都会触发 Canvas 重绘
- 避免频繁的小角度调整
- 考虑使用防抖 (debounce) 优化输入框

---

## 🔄 未来优化

1. **拖动旋转**
   - 鼠标拖动雷达周围进行旋转
   - 类似 Photoshop 的旋转工具

2. **角度吸附**
   - 接近 0°、90°、180°、270° 时自动吸附
   - 方便精确定位

3. **旋转动画**
   - 旋转时添加平滑动画
   - 提升视觉体验

4. **键盘快捷键**
   - 方向键微调角度
   - Shift + 方向键大幅调整

---

## 📚 参考资料

- Canvas 旋转API：`CanvasRenderingContext2D.rotate()`
- 雷达坐标系统：`src/utils/radarUtils.ts`
- 对象类型定义：`src/utils/types.ts`

---

**版本**：v1.0  
**更新时间**：2025-10-29  
**状态**：✅ 已实现  
**作者**：AI Assistant

