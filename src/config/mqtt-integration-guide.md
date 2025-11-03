# Vue 雷达配置系统 - MQTT 对接方案

## 📋 概述

本 Vue 应用提供完整的雷达设备配置管理功能，需要与外部 MQTT 服务对接。

**核心要求：**
- ✅ MQTT 协议通信
- ✅ code 为 String 类型（"200" = 成功，"500" = 失败）
- ✅ 同步模式，命令执行 5-8 秒
- ✅ requestId 匹配机制

---

## 🔌 对接方式

### 方式 1：注入 MQTT 客户端（推荐）

在应用初始化时，将 MQTT 客户端注入到 Vue 应用中。

#### 步骤 1：创建 MQTT 服务

```typescript
// src/services/mqttService.ts
import mqtt, { MqttClient } from 'mqtt';

interface MqttConfig {
  brokerUrl: string;
  username?: string;
  password?: string;
  productId: string;
}

class MqttService {
  private client: MqttClient | null = null;
  private productId: string = '';
  private responseHandlers: Map<string, (response: any) => void> = new Map();

  // 连接到 MQTT Broker
  connect(config: MqttConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this.productId = config.productId;

      this.client = mqtt.connect(config.brokerUrl, {
        username: config.username,
        password: config.password,
        clientId: `vue_radar_${Date.now()}`,
        clean: true,
        reconnectPeriod: 5000,
      });

      this.client.on('connect', () => {
        console.log('✅ MQTT 连接成功');
        // 订阅所有设备的 post 主题
        this.client!.subscribe(`prop/${this.productId}/+/post`, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log(`✅ 已订阅: prop/${this.productId}/+/post`);
            resolve();
          }
        });
      });

      this.client.on('error', (error) => {
        console.error('❌ MQTT 连接错误:', error);
        reject(error);
      });

      // 监听所有消息
      this.client.on('message', (topic, payload) => {
        this.handleMessage(topic, payload);
      });
    });
  }

  // 处理接收到的消息
  private handleMessage(topic: string, payload: Buffer) {
    try {
      const message = JSON.parse(payload.toString());
      const requestId = message.requestId;

      // 根据 requestId 找到对应的处理函数
      if (requestId && this.responseHandlers.has(requestId)) {
        const handler = this.responseHandlers.get(requestId);
        handler!(message);
        // 调用后删除，避免内存泄漏
        this.responseHandlers.delete(requestId);
      }
    } catch (error) {
      console.error('解析 MQTT 消息失败:', error);
    }
  }

  // 发送命令并等待响应
  async sendCommand(
    deviceId: string,
    command: any,
    timeout: number = 10000
  ): Promise<any> {
    if (!this.client) {
      throw new Error('MQTT 客户端未连接');
    }

    const topic = `prop/${this.productId}/${deviceId}/get`;
    const requestId = command.requestId;

    return new Promise((resolve, reject) => {
      // 设置超时
      const timer = setTimeout(() => {
        this.responseHandlers.delete(requestId);
        reject(new Error(`等待服务器响应超时（${timeout / 1000}秒）`));
      }, timeout);

      // 注册响应处理器
      this.responseHandlers.set(requestId, (response) => {
        clearTimeout(timer);
        resolve(response);
      });

      // 发送命令
      this.client!.publish(topic, JSON.stringify(command), (error) => {
        if (error) {
          clearTimeout(timer);
          this.responseHandlers.delete(requestId);
          reject(new Error(`发送 MQTT 消息失败: ${error.message}`));
        }
      });
    });
  }

  // 断开连接
  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
      console.log('MQTT 连接已断开');
    }
  }

  // 获取连接状态
  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

// 导出单例
export const mqttService = new MqttService();
```

#### 步骤 2：在 main.ts 中初始化

```typescript
// src/main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { mqttService } from './services/mqttService';

const app = createApp(App);

// MQTT 配置（从环境变量或配置文件读取）
const mqttConfig = {
  brokerUrl: import.meta.env.VITE_MQTT_BROKER || 'ws://localhost:8083/mqtt',
  username: import.meta.env.VITE_MQTT_USERNAME,
  password: import.meta.env.VITE_MQTT_PASSWORD,
  productId: import.meta.env.VITE_MQTT_PRODUCT_ID || 'your-product-id',
};

// 连接 MQTT
mqttService
  .connect(mqttConfig)
  .then(() => {
    console.log('✅ MQTT 服务已启动');
    
    // 将 mqttService 挂载到 globalProperties，供全局使用
    app.config.globalProperties.$mqtt = mqttService;
    
    // 挂载应用
    app.mount('#app');
  })
  .catch((error) => {
    console.error('❌ MQTT 连接失败:', error);
    // 可以选择仍然挂载应用（离线模式）
    app.mount('#app');
  });
```

#### 步骤 3：在 Toolbar.vue 中使用

```typescript
// src/components/Toolbar.vue
import { getCurrentInstance } from 'vue';
import { mqttService } from '@/services/mqttService';

// 在 setup 中
const instance = getCurrentInstance();
const mqtt = instance?.appContext.config.globalProperties.$mqtt || mqttService;

// 修改 WriteRadar 函数
const WriteRadar = async (command: RadarCommand): Promise<MqttResponse> => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const mqttCommand = buildMqttUpdateCommand(command.mqttKeyValues, requestId);
  
  console.log(`   设备ID: ${command.deviceId}`);
  console.log(`   RequestID: ${requestId}`);
  console.log(`   Key/Value数量: ${command.mqttKeyValues.length}`);
  command.mqttKeyValues.forEach(kv => {
    console.log(`   - ${kv.key}: ${kv.value}`);
  });
  
  try {
    // 使用 mqttService 发送命令
    const response = await mqtt.sendCommand(
      command.deviceId,
      mqttCommand,
      10000  // 10秒超时
    );
    
    console.log(`   ← 服务器响应 (code: ${response.code})`);
    return response;
    
  } catch (error) {
    console.error(`   ❌ 发送失败:`, error);
    throw error;
  }
};

// QueryRadar 也类似修改
const QueryRadar = async (deviceId: string) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const keysToRead = getAllRadarConfigKeys();
  const mqttReadCommand = buildMqttReadCommand(keysToRead, requestId);
  
  console.log('   📡 发送Query命令:', { deviceId, requestId });
  
  try {
    const response = await mqtt.sendCommand(deviceId, mqttReadCommand, 10000);
    
    if (response.code === '200') {
      const config = parseMqttReadResponse(response.data);
      console.log('   ✅ Query完成，解析后的配置:', config);
      return config;
    } else {
      throw new Error(`Query失败: code=${response.code}`);
    }
  } catch (error) {
    console.error('   ❌ Query失败:', error);
    throw error;
  }
};
```

---

### 方式 2：通过 Props/Provide 传递

如果不想使用全局注入，可以通过 Props 或 Provide/Inject 传递。

#### 使用 Provide/Inject

```typescript
// src/App.vue
import { provide } from 'vue';
import { mqttService } from './services/mqttService';

// 在 setup 中
provide('mqtt', mqttService);
```

```typescript
// src/components/Toolbar.vue
import { inject } from 'vue';

const mqtt = inject<typeof mqttService>('mqtt');

if (!mqtt) {
  throw new Error('MQTT 服务未提供');
}
```

---

### 方式 3：通过 Pinia Store 管理

创建一个 MQTT Store 来统一管理 MQTT 通信。

```typescript
// src/stores/mqtt.ts
import { defineStore } from 'pinia';
import { mqttService } from '@/services/mqttService';

export const useMqttStore = defineStore('mqtt', {
  state: () => ({
    connected: false,
    productId: '',
  }),

  actions: {
    async connect(config: any) {
      await mqttService.connect(config);
      this.connected = true;
      this.productId = config.productId;
    },

    async sendCommand(deviceId: string, command: any) {
      return await mqttService.sendCommand(deviceId, command);
    },

    disconnect() {
      mqttService.disconnect();
      this.connected = false;
    },
  },

  getters: {
    isConnected: (state) => state.connected,
  },
});
```

```typescript
// src/components/Toolbar.vue
import { useMqttStore } from '@/stores/mqtt';

const mqttStore = useMqttStore();

const WriteRadar = async (command: RadarCommand): Promise<MqttResponse> => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const mqttCommand = buildMqttUpdateCommand(command.mqttKeyValues, requestId);
  
  const response = await mqttStore.sendCommand(command.deviceId, mqttCommand);
  return response;
};
```

---

## 🔧 环境变量配置

创建 `.env` 文件：

```bash
# .env
VITE_MQTT_BROKER=ws://192.168.1.100:8083/mqtt
VITE_MQTT_USERNAME=your_username
VITE_MQTT_PASSWORD=your_password
VITE_MQTT_PRODUCT_ID=your_product_id
```

创建 `.env.development` 和 `.env.production` 用于不同环境。

---

## 📦 依赖安装

```bash
npm install mqtt
```

TypeScript 类型定义：

```bash
npm install --save-dev @types/mqtt
```

---

## 🔍 完整的消息流程

### Update 命令流程

```
Vue App                    MQTT Broker               Server/Device
   |                            |                          |
   |-- publish --------------->|                          |
   |  topic: prop/pid/uid/get  |                          |
   |  {cmd:"update",           |                          |
   |   requestId:"req_xxx",    |                          |
   |   data:{key:value}}       |                          |
   |                            |-- forward ------------->|
   |                            |                          |
   |                            |                  [执行5-8秒]
   |                            |                          |
   |                            |<-- publish -------------|
   |                            |  topic: prop/pid/uid/post|
   |                            |  {cmd:"update",         |
   |                            |   code:"200",           |
   |                            |   requestId:"req_xxx",  |
   |<-- message ----------------|   data:{key:value}}     |
   |                            |                          |
   [匹配requestId]              |                          |
   [检查code="200"]             |                          |
   [更新baseline]               |                          |
```

### Read 命令流程

```
Vue App                    MQTT Broker               Server/Device
   |                            |                          |
   |-- publish --------------->|                          |
   |  topic: prop/pid/uid/get  |                          |
   |  {cmd:"read",             |                          |
   |   requestId:"req_xxx",    |                          |
   |   data:{key:[...]}}       |                          |
   |                            |-- forward ------------->|
   |                            |                          |
   |                            |                  [查询配置]
   |                            |                          |
   |                            |<-- publish -------------|
   |                            |  topic: prop/pid/uid/post|
   |                            |  {cmd:"read",           |
   |                            |   code:"200",           |
   |<-- message ----------------|   requestId:"req_xxx",  |
   |                            |   data:{key:value,...}} |
   [匹配requestId]              |                          |
   [解析data]                   |                          |
   [更新UI]                     |                          |
```

---

## 📝 服务器端响应格式要求

### 成功响应

```json
{
  "cmd": "update",
  "code": "200",
  "requestId": "req_1730534567895_abc123xyz",
  "data": {
    "install_model": 1,
    "height": 300,
    "boundary_left": 300,
    "boundary_right": 300,
    "boundary_front": 400,
    "boundary_rear": 0
  }
}
```

### 失败响应

```json
{
  "cmd": "update",
  "code": "500",
  "requestId": "req_1730534567895_abc123xyz",
  "data": {
    "error": "参数验证失败",
    "message": "height 超出允许范围 (50-500cm)"
  }
}
```

**关键要求：**
1. ✅ `code` 必须是 **String** 类型
2. ✅ `code` 为 `"200"` 表示成功
3. ✅ `code` 为 `"500"` 或其他表示失败
4. ✅ `requestId` 必须与请求中的完全一致
5. ✅ 响应时间：5-8 秒（同步模式）

---

## 🧪 测试建议

### 1. 使用 MQTT 测试工具

推荐使用 MQTTX 或 Mosquitto 客户端进行测试：

```bash
# 订阅响应主题
mosquitto_sub -h localhost -t "prop/+/+/post" -v

# 模拟发送命令
mosquitto_pub -h localhost -t "prop/pid/uid/get" -m '{"cmd":"read","requestId":"test123","data":{"key":["install_model","height"]}}'
```

### 2. 模拟服务器响应

在开发阶段，可以创建一个简单的 Node.js 脚本模拟服务器：

```javascript
// mock-server.js
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  console.log('Mock server connected');
  client.subscribe('prop/+/+/get');
});

client.on('message', (topic, message) => {
  const request = JSON.parse(message.toString());
  const parts = topic.split('/');
  const postTopic = `prop/${parts[1]}/${parts[2]}/post`;

  // 模拟5秒延迟
  setTimeout(() => {
    const response = {
      cmd: request.cmd,
      code: '200',
      requestId: request.requestId,
      data: request.data,
    };

    client.publish(postTopic, JSON.stringify(response));
    console.log('Response sent:', response);
  }, 5000);
});
```

---

## 🚀 部署注意事项

1. **WebSocket 支持**
   - 浏览器中的 MQTT 需要 WebSocket 支持
   - Broker 需要开启 WebSocket 端口（通常是 8083）

2. **SSL/TLS**
   - 生产环境建议使用 wss:// (WebSocket Secure)
   - 配置 SSL 证书

3. **跨域问题**
   - 确保 MQTT Broker 配置允许跨域连接

4. **认证**
   - 使用用户名/密码认证
   - 或者使用 Token 认证

---

## 📞 技术支持

如果有任何问题，请联系技术支持团队，并提供：
- MQTT Broker 地址和端口
- Product ID
- 设备 ID 示例
- 错误日志

---

## ✅ 快速检查清单

在对接前，请确认：

- [ ] MQTT Broker 已部署并可访问
- [ ] WebSocket 端口已开放（通常 8083）
- [ ] Product ID 已配置
- [ ] 设备 ID 格式已确认
- [ ] 响应格式符合规范（code 为 String 类型）
- [ ] 响应时间在 5-8 秒范围内
- [ ] requestId 能正确匹配
- [ ] 已安装 mqtt npm 包
- [ ] 环境变量已配置

