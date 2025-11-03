# 人员移动平滑动画系统

## ❌ 之前的问题

### 被动式渲染的缺陷

```typescript
// 问题代码：
watch(() => radarDataStore.persons, () => {
  redrawCanvas();  // 只在数据变化时重绘
});
```

**问题：**
1. 📊 **数据频率**：1秒1次更新
2. 🎬 **渲染频率**：也是1秒1次（跟随数据）
3. 😖 **视觉效果**：人员"跳跃"式移动，卡顿明显
4. ⚠️ **无法插值**：没有中间帧，无法平滑过渡

---

## ✅ 新的解决方案

### 双驱动渲染系统

```
数据驱动（1秒/次）     动画驱动（60fps）
      ↓                      ↓
  设置动画参数          requestAnimationFrame
      ↓                      ↓
  startPosition           计算插值位置
  targetPosition           ↓
  moveStartTime          连续重绘
  moveDuration             ↓
                      平滑移动效果
```

---

## 🎯 核心机制

### 1. 数据更新时设置动画参数

```typescript
// radarData.ts - updatePersons()
if (distance > 2) {  // 位置变化超过2cm
  existing.startPosition = existing.position;    // 起点
  existing.targetPosition = newPerson.position;  // 终点
  existing.moveStartTime = Date.now();           // 开始时间
  existing.moveDuration = 1000;                  // 1秒完成
  existing.isMoving = true;                      // 标记移动中
}
```

### 2. 每帧计算插值位置

```typescript
// RadarCanvas.vue - getInterpolatedPosition()
const elapsed = Date.now() - person.moveStartTime;
const progress = elapsed / person.moveDuration;  // 0.0 ~ 1.0

// 使用缓动函数（easeOutQuad）
const eased = 1 - Math.pow(1 - progress, 2);

// 线性插值
const currentX = startX + (targetX - startX) * eased;
const currentY = startY + (targetY - startY) * eased;
```

### 3. 独立的动画循环

```typescript
// RadarCanvas.vue - startAnimationLoop()
const animate = () => {
  redrawCanvas();  // 重绘（60fps）
  
  if (hasMoving) {
    requestAnimationFrame(animate);  // 继续下一帧
  } else {
    stopAnimationLoop();  // 动画完成，停止
  }
};
```

---

## 📊 时间轴示例

```
时间：10:00:00
  数据：position = (100, 100)
  显示：(100, 100)

时间：10:00:01
  数据更新：position = (200, 200)
  触发：
    - startPosition = (100, 100)
    - targetPosition = (200, 200)
    - moveStartTime = t0
    - isMoving = true
  启动 requestAnimationFrame 循环

时间：10:00:01.000 (0ms)
  进度：0%
  显示：(100, 100) ← 起点

时间：10:00:01.016 (16ms, 1帧)
  进度：1.6%
  显示：(101.6, 101.6)

时间：10:00:01.033 (33ms, 2帧)
  进度：3.3%
  显示：(103.3, 103.3)

...每16ms一帧（60fps）...

时间：10:00:01.500 (500ms)
  进度：50%
  显示：(150, 150) ← 中点

时间：10:00:01.900 (900ms)
  进度：90%
  显示：(190, 190)

时间：10:00:02.000 (1000ms)
  进度：100%
  显示：(200, 200) ← 终点
  动画完成，停止循环

总共约60帧，流畅过渡！
```

---

## 🎨 缓动函数

### easeOutQuad（减速缓动）

```typescript
const eased = 1 - Math.pow(1 - progress, 2);
```

**效果曲线：**
```
1.0 |           ___----
    |       _--
0.5 |    _-
    |  _/
0.0 |_/________________
    0   0.25  0.5  0.75  1.0
        progress →
```

**特点：**
- 开始快，结束慢
- 更自然的移动感觉
- 适合人员移动

### 其他可选缓动函数

```typescript
// 线性（无缓动）
const eased = progress;

// easeInQuad（加速）
const eased = progress * progress;

// easeInOutQuad（先加速后减速）
const eased = progress < 0.5
  ? 2 * progress * progress
  : 1 - Math.pow(-2 * progress + 2, 2) / 2;
```

---

## 🔄 完整流程

```
1. 数据源（MockRadarService）
   每1秒生成新位置
       ↓
2. 数据更新（radarDataStore.updatePersons）
   检测位置变化
   设置动画参数：
     - startPosition
     - targetPosition
     - moveStartTime
     - moveDuration
     - isMoving = true
       ↓
3. 触发渲染（watch lastUpdate）
   立即重绘一次
   检测到 isMoving = true
   启动 requestAnimationFrame 循环
       ↓
4. 动画循环（startAnimationLoop）
   每16ms（60fps）：
     - 计算插值位置
     - 重绘整个 Canvas
     - 检查动画是否完成
       ↓
5. 动画完成
   elapsed >= duration
   停止 requestAnimationFrame
   isMoving = false
```

---

## 🎮 性能优化

### 1. 按需启动动画

```typescript
// 只在有移动时启动循环
if (hasMoving && !isAnimating.value) {
  startAnimationLoop();
}

// 动画完成自动停止
if (!hasMoving) {
  stopAnimationLoop();
}
```

### 2. 距离阈值

```typescript
// 只有位置变化超过2cm才触发动画
if (distance > 2) {
  // 启动动画
} else {
  // 直接更新，无动画
}
```

### 3. 资源清理

```typescript
onUnmounted(() => {
  stopAnimationLoop();  // 组件卸载时停止动画
});
```

---

## 📊 性能对比

| 场景 | 旧方式 | 新方式 |
|------|--------|--------|
| 人员静止 | 1次/秒重绘 | 1次/秒重绘 ✅ |
| 人员移动 | 1次/秒跳变 | 60次/秒平滑 ✅ |
| 多人移动 | 卡顿严重 | 流畅丝滑 ✅ |
| CPU占用 | 低 | 移动时较高⚠️ |
| 视觉效果 | ⭐ | ⭐⭐⭐⭐⭐ |

---

## 🔧 可配置参数

### 动画持续时间

```typescript
moveDuration: 1000  // 默认1秒

// 可以根据距离动态调整
const duration = Math.min(Math.max(distance * 5, 500), 2000);
// 距离近：500ms
// 距离中：1000ms
// 距离远：2000ms
```

### 距离阈值

```typescript
if (distance > 2) {  // 默认2cm

// 调整灵敏度
if (distance > 5) {  // 5cm才触发
if (distance > 1) {  // 1cm就触发
```

---

## ✅ 关键改进点

### 1. 独立的渲染循环

❌ **旧方式**：数据驱动渲染（被动）
```typescript
watch(data) → redrawCanvas()
```

✅ **新方式**：双驱动系统（主动）
```typescript
watch(data) → 设置动画 → requestAnimationFrame 循环
```

### 2. 位置插值计算

❌ **旧方式**：直接跳变
```
pos1 ──────跳变────→ pos2
```

✅ **新方式**：60帧平滑过渡
```
pos1 → → → → → → → → pos2
(60个中间帧)
```

### 3. 智能性能管理

❌ **旧方式**：总是1秒1次
```
静止：1次/秒  ✅
移动：1次/秒  ❌ 卡顿
```

✅ **新方式**：按需调整
```
静止：1次/秒  ✅
移动：60次/秒 ✅ 平滑
```

---

## 🎉 最终效果

- ✅ **丝滑移动**：60fps 流畅动画
- ✅ **智能性能**：静止时节能，移动时全速
- ✅ **自然过渡**：缓动函数让移动更真实
- ✅ **多人支持**：每个人独立动画
- ✅ **资源清理**：组件卸载时自动停止

---

**现在人员移动就像真实世界一样流畅了！** 🎊

