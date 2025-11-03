# Vue 雷达配置系统 - 集成指南

## 📋 概述

本 Vue 应用是一个**雷达设备配置管理系统**，可以作为独立模块集成到其他应用中。

**适用场景：**
- 集成到管理后台系统
- 嵌入到桌面应用（Electron）
- 作为微前端模块
- 通过 iframe 嵌入

---

## 🔌 集成方式

### 方式 1：通过 Props 和 Events（推荐）

将 Vue 应用封装为可配置的组件，通过 Props 传入配置，通过 Events 回调通知。

#### 1.1 封装入口组件

创建 `RadarConfigApp.vue` 作为对外暴露的入口：

```vue
<!-- src/RadarConfigApp.vue -->
<template>
  <div class="radar-config-app">
    <RadarCanvas />
    <Toolbar />
  </div>
</template>

<script setup lang="ts">
import { provide, onMounted } from 'vue';
import RadarCanvas from '@/components/RadarCanvas.vue';
import Toolbar from '@/components/Toolbar.vue';

// Props：外部传入的配置和回调
interface Props {
  // MQTT 命令发送回调
  onSendCommand?: (deviceId: string, command: any) => Promise<any>;
  // Query 命令回调
  onQueryDevice?: (deviceId: string) => Promise<any>;
  // 初始 Canvas 数据
  initialData?: any;
  // 产品 ID
  productId?: string;
}

const props = defineProps<Props>();

// 提供给子组件使用
provide('mqttCallbacks', {
  sendCommand: props.onSendCommand,
  queryDevice: props.onQueryDevice,
});

provide('productId', props.productId);

// Emit：向外部发送事件
const emit = defineEmits<{
  configChanged: [config: any];
  commandSent: [command: any];
  error: [error: Error];
}>();

// 暴露给外部的方法
defineExpose({
  // 获取当前配置
  getConfig: () => {
    // 从 store 获取配置
    return {};
  },
  // 加载配置
  loadConfig: (config: any) => {
    // 加载到 store
  },
  // 保存配置
  saveConfig: async () => {
    // 触发保存
  },
});

onMounted(() => {
  // 初始化加载数据
  if (props.initialData) {
    // loadConfig(props.initialData);
  }
});
</script>
```

#### 1.2 修改 Toolbar.vue，使用外部回调

```typescript
// src/components/Toolbar.vue
import { inject } from 'vue';

// 注入外部提供的回调
const mqttCallbacks = inject<{
  sendCommand?: (deviceId: string, command: any) => Promise<any>;
  queryDevice?: (deviceId: string) => Promise<any>;
}>('mqttCallbacks', {});

// 修改 WriteRadar，使用外部回调
const WriteRadar = async (command: RadarCommand): Promise<MqttResponse> => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const mqttCommand = buildMqttUpdateCommand(command.mqttKeyValues, requestId);
  
  console.log(`   设备ID: ${command.deviceId}`);
  console.log(`   RequestID: ${requestId}`);
  
  // 使用外部提供的回调函数
  if (mqttCallbacks.sendCommand) {
    try {
      const response = await mqttCallbacks.sendCommand(command.deviceId, mqttCommand);
      console.log(`   ← 服务器响应 (code: ${response.code})`);
      return response;
    } catch (error) {
      console.error(`   ❌ 发送失败:`, error);
      throw error;
    }
  } else {
    // 如果没有提供回调，使用模拟数据
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      cmd: 'update',
      code: '200',
      requestId: requestId,
      data: command.mqttKeyValues.reduce((acc, kv) => {
        acc[kv.key] = kv.value;
        return acc;
      }, {} as Record<string, any>)
    };
  }
};

// 修改 QueryRadar
const QueryRadar = async (deviceId: string) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const keysToRead = getAllRadarConfigKeys();
  const mqttReadCommand = buildMqttReadCommand(keysToRead, requestId);
  
  console.log('   📡 发送Query命令:', { deviceId, requestId });
  
  if (mqttCallbacks.queryDevice) {
    try {
      const response = await mqttCallbacks.queryDevice(deviceId);
      
      if (response.code === '200') {
        const config = parseMqttReadResponse(response.data);
        console.log('   ✅ Query完成:', config);
        return config;
      } else {
        throw new Error(`Query失败: code=${response.code}`);
      }
    } catch (error) {
      console.error('   ❌ Query失败:', error);
      throw error;
    }
  } else {
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      installModel: 'wall',
      height: 170,
      boundary: { leftH: 300, rightH: 300, frontV: 400, rearV: 0 },
      areas: [],
    };
  }
};
```

#### 1.3 外部系统使用示例

```vue
<!-- 外部系统的页面 -->
<template>
  <div>
    <h1>设备配置管理</h1>
    <RadarConfigApp
      :product-id="productId"
      :on-send-command="handleSendCommand"
      :on-query-device="handleQueryDevice"
      @config-changed="onConfigChanged"
      @error="onError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import RadarConfigApp from '@/radar-config/RadarConfigApp.vue';
import { mqttClient } from '@/services/mqtt';  // 外部系统自己的 MQTT 客户端

const productId = ref('your-product-id');

// 实现发送命令的回调
const handleSendCommand = async (deviceId: string, command: any) => {
  const topic = `prop/${productId.value}/${deviceId}/get`;
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('超时'));
    }, 10000);
    
    // 监听响应
    const handler = (topic: string, payload: Buffer) => {
      const response = JSON.parse(payload.toString());
      if (response.requestId === command.requestId) {
        clearTimeout(timeout);
        mqttClient.off('message', handler);
        resolve(response);
      }
    };
    
    mqttClient.on('message', handler);
    mqttClient.publish(topic, JSON.stringify(command));
  });
};

// 实现查询设备的回调
const handleQueryDevice = async (deviceId: string) => {
  // 同样的 MQTT 通信逻辑
  // ...
};

// 监听配置变化
const onConfigChanged = (config: any) => {
  console.log('配置已变化:', config);
};

const onError = (error: Error) => {
  console.error('错误:', error);
};
</script>
```

---

### 方式 2：通过全局 API 注入

外部系统在初始化时注入 MQTT API，Vue 应用直接调用。

#### 2.1 创建 API 接口定义

```typescript
// src/types/externalApi.ts
export interface RadarMqttApi {
  // 发送命令
  sendCommand(deviceId: string, command: any): Promise<{
    cmd: string;
    code: string;
    requestId: string;
    data: Record<string, any>;
  }>;
  
  // 查询设备
  queryDevice(deviceId: string, keys: string[]): Promise<{
    cmd: string;
    code: string;
    requestId: string;
    data: Record<string, any>;
  }>;
  
  // 获取 Product ID
  getProductId(): string;
}

// 全局 API 实例
export let radarMqttApi: RadarMqttApi | null = null;

// 注入 API
export function injectRadarMqttApi(api: RadarMqttApi) {
  radarMqttApi = api;
}
```

#### 2.2 在 Toolbar.vue 中使用

```typescript
// src/components/Toolbar.vue
import { radarMqttApi } from '@/types/externalApi';

const WriteRadar = async (command: RadarCommand): Promise<MqttResponse> => {
  if (!radarMqttApi) {
    throw new Error('MQTT API 未初始化，请先调用 injectRadarMqttApi()');
  }
  
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const mqttCommand = buildMqttUpdateCommand(command.mqttKeyValues, requestId);
  
  const response = await radarMqttApi.sendCommand(command.deviceId, mqttCommand);
  return response;
};
```

#### 2.3 外部系统使用

```typescript
// 外部系统的初始化代码
import { injectRadarMqttApi } from '@/radar-config/types/externalApi';
import { mqttClient } from '@/services/mqtt';

// 实现 API
const radarApi = {
  async sendCommand(deviceId: string, command: any) {
    const topic = `prop/${productId}/${deviceId}/get`;
    // ... MQTT 通信逻辑
    return response;
  },
  
  async queryDevice(deviceId: string, keys: string[]) {
    // ... MQTT 通信逻辑
    return response;
  },
  
  getProductId() {
    return 'your-product-id';
  },
};

// 注入 API
injectRadarMqttApi(radarApi);

// 然后挂载 Vue 应用
app.mount('#app');
```

---

### 方式 3：作为独立应用（iframe）

将 Vue 应用打包为独立应用，通过 iframe 嵌入，使用 postMessage 通信。

#### 3.1 Vue 应用监听消息

```typescript
// src/main.ts
window.addEventListener('message', (event) => {
  // 验证来源
  if (event.origin !== 'https://your-parent-domain.com') {
    return;
  }
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'MQTT_RESPONSE':
      // 处理 MQTT 响应
      handleMqttResponse(data);
      break;
    case 'LOAD_CONFIG':
      // 加载配置
      loadConfig(data);
      break;
  }
});

// 向父窗口发送消息
function sendToParent(type: string, data: any) {
  window.parent.postMessage({ type, data }, 'https://your-parent-domain.com');
}

// 在需要发送 MQTT 命令时
const WriteRadar = async (command: RadarCommand): Promise<MqttResponse> => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const mqttCommand = buildMqttUpdateCommand(command.mqttKeyValues, requestId);
  
  return new Promise((resolve, reject) => {
    // 注册响应处理器
    pendingRequests.set(requestId, { resolve, reject });
    
    // 发送到父窗口
    sendToParent('MQTT_SEND_COMMAND', {
      deviceId: command.deviceId,
      command: mqttCommand,
    });
    
    // 超时处理
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error('超时'));
      }
    }, 10000);
  });
};
```

#### 3.2 父应用处理

```html
<!-- 父应用 -->
<iframe id="radarConfig" src="http://localhost:5173" />

<script>
const iframe = document.getElementById('radarConfig');

// 监听来自 iframe 的消息
window.addEventListener('message', async (event) => {
  if (event.origin !== 'http://localhost:5173') {
    return;
  }
  
  const { type, data } = event.data;
  
  if (type === 'MQTT_SEND_COMMAND') {
    // 通过 MQTT 发送命令
    const response = await sendMqttCommand(data.deviceId, data.command);
    
    // 发送响应回 iframe
    iframe.contentWindow.postMessage({
      type: 'MQTT_RESPONSE',
      data: response,
    }, 'http://localhost:5173');
  }
});

async function sendMqttCommand(deviceId, command) {
  // 实际的 MQTT 通信
  // ...
  return response;
}
</script>
```

---

### 方式 4：作为 NPM 包

将 Vue 应用打包为 NPM 包，供其他项目安装使用。

#### 4.1 配置打包

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'RadarConfig',
      fileName: (format) => `radar-config.${format}.js`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
});
```

#### 4.2 导出入口

```typescript
// src/index.ts
export { default as RadarConfigApp } from './RadarConfigApp.vue';
export { injectRadarMqttApi } from './types/externalApi';
export type { RadarMqttApi } from './types/externalApi';
```

#### 4.3 外部项目使用

```bash
npm install @your-org/radar-config
```

```vue
<template>
  <RadarConfigApp
    :on-send-command="handleSendCommand"
    :on-query-device="handleQueryDevice"
  />
</template>

<script setup>
import { RadarConfigApp } from '@your-org/radar-config';
import '@your-org/radar-config/dist/style.css';

// 实现回调...
</script>
```

---

## ⚠️ 重要：单位转换说明

**Canvas 使用 cm（厘米），雷达设备使用 dm（分米）**

### 自动转换规则

Vue 会自动处理单位转换：

| 方向 | 转换规则 | 示例 |
|------|---------|------|
| **发送到雷达** | cm ÷ 10（取整） | Canvas: 300cm → 雷达: 30dm |
| **从雷达接收** | dm × 10 | 雷达: 30dm → Canvas: 300cm |

### 适用范围

以下配置项需要单位转换：
- ✅ `height` (高度)
- ✅ `boundary_left`, `boundary_right`, `boundary_front`, `boundary_rear` (边界)
- ✅ `area_x1`, `area_y1`, `area_x2`, `area_y2`, `area_x3`, `area_y3`, `area_x4`, `area_y4` (区域坐标)

### 不需要转换的项

- ❌ `install_model` (枚举值)
- ❌ `area_id` (区域编号)
- ❌ `area_type` (区域类型字符串)

---

## 📡 外部系统需要实现的接口

Vue 应用**不关心通信细节**，只需要外部系统实现以下 2 个简单函数：

### 1. 写入配置（sendCommand）

```typescript
async function sendCommand(
  deviceId: string,
  commandData: Record<string, any>  // Vue 生成的 key/value 数据
): Promise<{
  success: boolean;
  data?: Record<string, any>;  // 可选：服务器返回的实际值
  error?: string;              // 可选：失败原因
}>
```

**参数说明：**
- `deviceId`: 设备 ID
- `commandData`: Vue 生成的配置数据，格式如：
  ```json
  {
    "install_model": 1,
    "height": 30,        // ⚠️ dm单位（Canvas 300cm / 10 = 30dm）
    "boundary_left": 30,    // ⚠️ dm单位（Canvas 300cm / 10 = 30dm）
    "boundary_right": 30,   // ⚠️ dm单位（Canvas 300cm / 10 = 30dm）
    "boundary_front": 40,   // ⚠️ dm单位（Canvas 400cm / 10 = 40dm）
    "boundary_rear": 0,     // ⚠️ dm单位
    "area_0_id": 0,
    "area_0_type": "bed",
    "area_0_x1": 20,   // 右上 X (200cm/10=20dm)
    "area_0_y1": 5,    // 右上 Y (50cm/10=5dm)
    "area_0_x2": 10,   // 左上 X (100cm/10=10dm)
    "area_0_y2": 5,    // 左上 Y (50cm/10=5dm)
    "area_0_x3": 20,   // 右下 X (200cm/10=20dm)
    "area_0_y3": 25,   // 右下 Y (250cm/10=25dm)
    "area_0_x4": 10,   // 左下 X (100cm/10=10dm)
    "area_0_y4": 25    // 左下 Y (250cm/10=25dm)
  }
  ```

**⚠️ 重要单位说明：**
- **Canvas 使用 cm（厘米）**
- **雷达使用 dm（分米）**
- **Vue 自动转换**：发送时 cm÷10，接收时 dm×10

**注意：**
- 区域由 **4个顶点的坐标** 定义，**顺序固定：右上、左上、右下、左下**（与边界4顶点顺序相同）
- 顶点顺序：
  ```
  (x2,y2)左上 --- (x1,y1)右上
     |              |
  (x4,y4)左下 --- (x3,y3)右下
  ```
- 可以定义矩形、平行四边形或任意四边形区域
- 删除区域时，设置 `area_{id}_id = -1`

**返回说明：**
- `success`: true = 成功，false = 失败
- `data`: 可选，服务器返回的实际值（用于验证）
- `error`: 可选，失败时的错误信息

### 2. 查询配置（queryDevice）

```typescript
async function queryDevice(
  deviceId: string
): Promise<{
  success: boolean;
  data?: {
    install_model?: number;
    height?: number;           // dm单位（雷达设备）
    boundary_left?: number;    // dm单位
    boundary_right?: number;   // dm单位
    boundary_front?: number;   // dm单位
    boundary_rear?: number;    // dm单位
    // 区域配置（4个点定义，dm单位）
    area_0_id?: number;
    area_0_type?: string;
    area_0_x1?: number;        // dm单位
    area_0_y1?: number;        // dm单位
    area_0_x2?: number;        // dm单位
    area_0_y2?: number;        // dm单位
    area_0_x3?: number;        // dm单位
    area_0_y3?: number;        // dm单位
    area_0_x4?: number;        // dm单位
    area_0_y4?: number;        // dm单位
    // ... 其他区域（0-15）
  };
  error?: string;
}>
```

**参数说明：**
- `deviceId`: 设备 ID

**返回说明：**
- `success`: true = 成功，false = 失败
- `data`: 设备当前配置（key/value 格式）
- `error`: 可选，失败时的错误信息

---

## 🔄 数据流图

```
┌─────────────────────────────────────────┐
│         外部应用（父系统）                 │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      MQTT Client                │   │
│  │  - 连接 Broker                   │   │
│  │  - 订阅 post 主题                │   │
│  │  - 发布 get 主题                 │   │
│  └────────┬───────────────▲─────────┘   │
│           │               │             │
│        publish          response        │
│           │               │             │
│  ┌────────▼───────────────┴─────────┐   │
│  │    API 实现                      │   │
│  │  - sendCommand()                 │   │
│  │  - queryDevice()                 │   │
│  └────────┬───────────────▲─────────┘   │
│           │               │             │
│        callback         return          │
│           │               │             │
│  ┌────────▼───────────────┴─────────┐   │
│  │   Vue 雷达配置系统                │   │
│  │                                   │   │
│  │  - 配置差异对比                    │   │
│  │  - 命令生成                       │   │
│  │  - UI 交互                        │   │
│  │  - Canvas 绘制                    │   │
│  └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 📋 集成检查清单

- [ ] 选择集成方式（Props/API注入/iframe/NPM包）
- [ ] 实现 `sendCommand()` 回调函数
- [ ] 实现 `queryDevice()` 回调函数
- [ ] 配置 Product ID
- [ ] 测试 MQTT 连接
- [ ] 测试命令发送和响应
- [ ] 测试 requestId 匹配
- [ ] 确认响应格式（code 为 String）
- [ ] 测试超时处理
- [ ] 测试错误处理

---

## 🎯 推荐方案

根据不同场景选择：

| 场景 | 推荐方式 | 优点 |
|------|---------|------|
| 同一技术栈 | Props + Events | 简单直接，类型安全 |
| 微前端架构 | API 注入 | 解耦，灵活 |
| 跨域集成 | iframe + postMessage | 隔离性好，安全 |
| 多项目复用 | NPM 包 | 版本管理，易维护 |

---

## 📞 技术支持

提供以下信息以便支持：
- 集成方式
- 错误日志
- MQTT 配置
- 响应格式示例

---

## ✅ 完整集成示例

### 最简单的方式（使用 Provide/Inject）

```vue
<!-- 外部应用的主组件 App.vue -->
<template>
  <div id="app">
    <h1>设备配置管理</h1>
    <RadarCanvas />
    <Toolbar />
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue';
import RadarCanvas from './vue-radar/components/RadarCanvas.vue';
import Toolbar from './vue-radar/components/Toolbar.vue';
import { yourMqttService } from '@/services/mqtt';  // 您的 MQTT 服务

// 实现发送命令
const sendCommand = async (
  deviceId: string,
  commandData: Record<string, any>
) => {
  try {
    // 1. 生成 requestId（您自己生成）
    const requestId = `req_${Date.now()}`;
    
    // 2. 构建完整的 MQTT 消息
    const mqttMessage = {
      cmd: 'update',
      requestId: requestId,
      data: commandData  // Vue 传来的 key/value 数据
    };
    
    // 3. 发送到 MQTT（您自己的实现）
    const topic = `prop/your-product-id/${deviceId}/get`;
    const response = await yourMqttService.sendAndWait(topic, mqttMessage, requestId);
    
    // 4. 返回简化的结果给 Vue
    return {
      success: response.code === '200',
      data: response.data,
      error: response.code !== '200' ? `错误码: ${response.code}` : undefined
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// 实现查询设备
const queryDevice = async (deviceId: string) => {
  try {
    const requestId = `req_${Date.now()}`;
    
    // 构建 read 命令
    const mqttMessage = {
      cmd: 'read',
      requestId: requestId,
      data: {
        key: [
          'install_model', 'height',
          'boundary_left', 'boundary_right', 'boundary_front', 'boundary_rear',
          // ... 其他需要查询的 key
        ]
      }
    };
    
    const topic = `prop/your-product-id/${deviceId}/get`;
    const response = await yourMqttService.sendAndWait(topic, mqttMessage, requestId);
    
    return {
      success: response.code === '200',
      data: response.data,  // key/value 格式
      error: response.code !== '200' ? `错误码: ${response.code}` : undefined
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// 提供给 Vue 雷达系统使用
provide('externalCallbacks', {
  sendCommand,
  queryDevice
});
</script>
```

### 您的 MQTT 服务示例

```typescript
// services/mqtt.ts
import mqtt, { MqttClient } from 'mqtt';

class MqttService {
  private client: MqttClient;
  private pendingRequests = new Map();

  constructor() {
    // 连接 MQTT Broker
    this.client = mqtt.connect('ws://your-broker:8083/mqtt');
    
    // 订阅所有响应主题
    this.client.on('connect', () => {
      this.client.subscribe('prop/+/+/post');
    });
    
    // 处理响应
    this.client.on('message', (topic, payload) => {
      const response = JSON.parse(payload.toString());
      const requestId = response.requestId;
      
      if (this.pendingRequests.has(requestId)) {
        const { resolve } = this.pendingRequests.get(requestId);
        resolve(response);
        this.pendingRequests.delete(requestId);
      }
    });
  }

  // 发送并等待响应
  async sendAndWait(topic: string, message: any, requestId: string) {
    return new Promise((resolve, reject) => {
      // 设置超时
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('超时'));
      }, 10000);
      
      // 注册响应处理
      this.pendingRequests.set(requestId, { 
        resolve: (response: any) => {
          clearTimeout(timeout);
          resolve(response);
        }
      });
      
      // 发送消息
      this.client.publish(topic, JSON.stringify(message));
    });
  }
}

export const yourMqttService = new MqttService();
```

---

## 📊 数据流示例

### 场景：修改边界配置

```
用户在 Vue 界面上修改：
  frontV: 400cm → 500cm

Vue 自动转换并生成数据（cm → dm）：
  {
    "boundary_front": 50  // 500cm / 10 = 50dm
  }

↓ 调用 sendCommand()

外部系统处理：
  {
    "cmd": "update",
    "requestId": "req_1730534567890",
    "data": {
      "boundary_front": 50  // 雷达使用 dm
    }
  }

↓ 发送到 MQTT
  
  Topic: prop/your-product-id/device-001/get

↓ 等待 5-8 秒

↓ 收到响应

  Topic: prop/your-product-id/device-001/post
  {
    "cmd": "update",
    "code": "200",
    "requestId": "req_1730534567890",
    "data": {
      "boundary_front": 50  // 雷达返回 dm
    }
  }

↓ 返回给 Vue

  {
    "success": true,
    "data": {
      "boundary_front": 50  // dm单位
    }
  }

↓ Vue 自动转换（dm → cm）

  boundary_front: 50dm × 10 = 500cm

✅ Vue 更新 baseline (500cm)
```

---

## 🎯 核心要点

1. **Vue 不关心通信细节**
   - 不知道 MQTT topic
   - 不知道 requestId
   - 不知道 MQTT Broker 地址

2. **Vue 只负责**
   - UI 交互
   - 配置管理
   - 生成 key/value 数据
   - **自动单位转换**（cm ↔ dm）

3. **外部系统负责**
   - MQTT 连接和通信
   - requestId 生成和匹配
   - 错误处理和重试
   - **无需关心单位**（Vue 已转换好）

4. **接口超简单**
   - 输入：`deviceId` + `commandData`（已转换为 dm）
   - 输出：`success` + `data`（dm单位） + `error`

5. **单位转换（自动）**
   - 发送时：Vue 自动 cm → dm（除以10）
   - 接收时：Vue 自动 dm → cm（乘以10）
   - 外部系统只需要处理 dm 单位的数据

就这么简单！🎉

