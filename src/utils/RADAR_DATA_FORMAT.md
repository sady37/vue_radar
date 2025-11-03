# 雷达数据格式说明

## 📋 PersonData 数据结构

### 核心标识字段

```typescript
{
  id: number;           // 数据记录ID（数据库记录的唯一标识）
  deviceCode: string;   // 雷达设备编码（必填，用于多雷达场景）
  personIndex: number;  // 人员索引（必填，0-N，区分同一雷达识别的多人）
}
```

**重要说明：**

#### 1. id - 数据记录ID
- 数据库记录的唯一标识
- 用于数据存储和查询
- 示例：7372203, 7372204...

#### 2. deviceCode - 雷达设备编码
- **用途**：区分数据来自哪个雷达（多雷达场景）
- **格式**：设备MAC地址或唯一编码
- **示例**：`9D8A326309E7`, `RADAR_001`, `device-uuid-001`
- **必填**：是（即使单雷达场景也需要）

#### 3. personIndex - 人员索引
- **用途**：区分同一雷达识别出的多个人
- **范围**：0-N（0表示第1个人，1表示第2个人...）
- **示例**：一个雷达同时识别3个人 → personIndex = 0, 1, 2
- **必填**：是

---

## 🎯 多人场景示例

### 场景1：单雷达识别多人

```json
[
  {
    "id": 7372203,
    "deviceCode": "9D8A326309E7",
    "personIndex": 0,  // 第1个人
    "position": { "x": 220, "y": 170, "z": 80 },
    "posture": 4,
    "timestamp": 1743269335
  },
  {
    "id": 7372204,
    "deviceCode": "9D8A326309E7",  // 同一个雷达
    "personIndex": 1,               // 第2个人
    "position": { "x": 150, "y": 300, "z": 90 },
    "posture": 6,
    "timestamp": 1743269335
  },
  {
    "id": 7372205,
    "deviceCode": "9D8A326309E7",  // 同一个雷达
    "personIndex": 2,               // 第3个人
    "position": { "x": 300, "y": 250, "z": 100 },
    "posture": 1,
    "timestamp": 1743269335
  }
]
```

---

### 场景2：多雷达多人

```json
[
  {
    "id": 7372203,
    "deviceCode": "9D8A326309E7",  // 雷达1
    "personIndex": 0,               // 雷达1的第1个人
    "position": { "x": 220, "y": 170, "z": 80 },
    "posture": 4,
    "timestamp": 1743269335
  },
  {
    "id": 7372204,
    "deviceCode": "9D8A326309E7",  // 雷达1
    "personIndex": 1,               // 雷达1的第2个人
    "position": { "x": 150, "y": 300, "z": 90 },
    "posture": 6,
    "timestamp": 1743269335
  },
  {
    "id": 7372205,
    "deviceCode": "8B7C215208D6",  // 雷达2（不同设备）
    "personIndex": 0,               // 雷达2的第1个人
    "position": { "x": 500, "y": 400, "z": 85 },
    "posture": 3,
    "timestamp": 1743269335
  }
]
```

---

## 🔑 唯一标识组合

### 人员的唯一标识

在实时系统中，人员的唯一标识由 **两个字段组合** 确定：

```typescript
uniqueKey = `${deviceCode}_${personIndex}`
```

**示例：**
- 雷达1的第1个人：`9D8A326309E7_0`
- 雷达1的第2个人：`9D8A326309E7_1`
- 雷达2的第1个人：`8B7C215208D6_0`

### 数据关联

```typescript
// 判断两条数据是否属于同一个人
function isSamePerson(data1: PersonData, data2: PersonData): boolean {
  return data1.deviceCode === data2.deviceCode && 
         data1.personIndex === data2.personIndex;
}

// 生成人员唯一标识
function getPersonKey(data: PersonData): string {
  return `${data.deviceCode}_${data.personIndex}`;
}
```

---

## 📊 数据流场景

### 场景1：房间内有2个人

**雷达数据流（每秒）：**

```
时间: 10:00:00
[
  { deviceCode: "9D8A326309E7", personIndex: 0, posture: 6 },  // 人1躺床上
  { deviceCode: "9D8A326309E7", personIndex: 1, posture: 4 }   // 人2站立
]

时间: 10:00:01
[
  { deviceCode: "9D8A326309E7", personIndex: 0, posture: 6 },  // 人1仍躺床上
  { deviceCode: "9D8A326309E7", personIndex: 1, posture: 1 }   // 人2开始走动
]

时间: 10:00:02
[
  { deviceCode: "9D8A326309E7", personIndex: 0, posture: 9 },  // 人1坐起
  { deviceCode: "9D8A326309E7", personIndex: 1, posture: 1 }   // 人2继续走动
]
```

---

### 场景2：多房间多雷达

```
房间A（雷达1: 9D8A326309E7）
[
  { deviceCode: "9D8A326309E7", personIndex: 0, ... }  // 房间A的人1
  { deviceCode: "9D8A326309E7", personIndex: 1, ... }  // 房间A的人2
]

房间B（雷达2: 8B7C215208D6）
[
  { deviceCode: "8B7C215208D6", personIndex: 0, ... }  // 房间B的人1
]

房间C（雷达3: 7A6B104107C5）
[
  { deviceCode: "7A6B104107C5", personIndex: 0, ... }  // 房间C的人1
  { deviceCode: "7A6B104107C5", personIndex: 1, ... }  // 房间C的人2
  { deviceCode: "7A6B104107C5", personIndex: 2, ... }  // 房间C的人3
]
```

---

## 🔄 数据处理建议

### 1. 轨迹跟踪

```typescript
// 使用 deviceCode + personIndex 作为轨迹key
const trajectories: Record<string, Point[]> = {};

function updateTrajectory(personData: PersonData) {
  const key = `${personData.deviceCode}_${personData.personIndex}`;
  
  if (!trajectories[key]) {
    trajectories[key] = [];
  }
  
  trajectories[key].push(personData.position);
  
  // 限制长度
  if (trajectories[key].length > 50) {
    trajectories[key].shift();
  }
}
```

### 2. 人员离场判断

```typescript
// 如果某个人的数据超过30秒没有更新，认为已离场
function isPersonPresent(personData: PersonData): boolean {
  const now = Math.floor(Date.now() / 1000);
  return (now - personData.timestamp) < 30;
}
```

### 3. 多人展示

```typescript
// 按雷达分组展示
function groupByDevice(persons: PersonData[]) {
  return persons.reduce((acc, person) => {
    if (!acc[person.deviceCode]) {
      acc[person.deviceCode] = [];
    }
    acc[person.deviceCode].push(person);
    return acc;
  }, {} as Record<string, PersonData[]>);
}
```

---

## 📝 历史数据格式（sample.txt）

### 表格格式

```
| id      | device_code  | persion_index | coodinate_x | coodinate_y | coodinate_z | 
| remaining_time | posture | event | area_id | timestamp  | person_index |
```

### 字段说明

| 字段 | 说明 | 单位 | 示例 |
|------|------|------|------|
| id | 记录ID | - | 7372203 |
| device_code | 雷达设备编码 | - | 9D8A326309E7 |
| persion_index | （未使用） | - | NULL |
| coodinate_x | X坐标 | **dm** | 22 (=220cm) |
| coodinate_y | Y坐标 | **dm** | 17 (=170cm) |
| coodinate_z | Z坐标 | cm | 0 |
| remaining_time | 剩余时间 | 秒 | 0 |
| posture | 姿态 | 枚举 | 4 (Standing) |
| event | 事件 | 枚举 | 0 (无事件) |
| area_id | 区域ID | - | 1 |
| timestamp | 时间戳 | 秒 | 1743269335 |
| person_index | 人员索引 | - | 0 |

**注意：**
- `coodinate_x/y` 使用 **dm（分米）**，需要 ×10 转换为 cm
- `person_index` 才是真正的人员索引字段

---

## ✅ 数据完整性检查

### 必填字段验证

```typescript
function validatePersonData(data: PersonData): boolean {
  return (
    typeof data.id === 'number' &&
    typeof data.deviceCode === 'string' && data.deviceCode.length > 0 &&
    typeof data.personIndex === 'number' && data.personIndex >= 0 &&
    data.position && 
    typeof data.position.x === 'number' &&
    typeof data.position.y === 'number' &&
    typeof data.posture === 'number' &&
    typeof data.timestamp === 'number'
  );
}
```

---

## 🚀 使用示例

### 从历史数据加载

```typescript
import { MockRadarService } from '@/utils/mockRadarData';

const service = new MockRadarService();

// 启动历史数据回放
service.startMockDataStream(
  (persons: PersonData[]) => {
    persons.forEach(person => {
      console.log(
        `雷达:${person.deviceCode} 人员:${person.personIndex} ` +
        `姿态:${person.posture} 位置:(${person.position.x}, ${person.position.y})`
      );
    });
  },
  (vital) => {
    console.log('生理数据:', vital);
  }
);
```

### 多雷达数据聚合

```typescript
// 按设备分组
const byDevice = groupByDevice(persons);

// 雷达1的所有人员
const radar1Persons = byDevice['9D8A326309E7'];

// 统计每个雷达检测到的人数
Object.entries(byDevice).forEach(([deviceCode, persons]) => {
  console.log(`雷达 ${deviceCode}: ${persons.length} 人`);
});
```

---

## 🎯 关键要点

1. **deviceCode 和 personIndex 是必填字段**
   - 用于唯一标识一个人
   - 支持多雷达、多人场景

2. **唯一标识 = deviceCode + personIndex**
   - 不能单独使用 personIndex
   - 不同雷达的 personIndex 可以相同

3. **单位转换**
   - sample.txt 中 x/y 是 dm（分米）
   - PersonData 中 x/y 是 cm（厘米）
   - 转换：dm × 10 = cm

4. **在场判断**
   - 使用 timestamp 判断
   - 超过30秒无更新 → 认为已离场

5. **轨迹跟踪**
   - key = `${deviceCode}_${personIndex}`
   - 每个人独立的轨迹记录

