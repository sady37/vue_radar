// src/utils/mockRadarData.ts

  import { 
	type PersonData, 
	type VitalSignData,
	type BaseObject,
	PersonPosture,
  } from "./types";
  import { 
	toRadarCoordinate,
	getRadarBoundaryVertices,
	isPointInPolygon,
	getObjectVertices
  } from "./radarUtils";

  
  // 配置接口定义
  interface RadarServiceConfig {
	vitalSignProbability?: {
	  danger: number;    
	  warning: number;   
	  normal: number;    
	  undefined: number; 
	};
	areaProbability?: {
	  bed: number;      // 床区域概率，默认0.6
	};
	duration?: {
	  bed: { min: number; max: number; };     
	  normal: { min: number; max: number; };   
	};
  }
  

  export class MockRadarService {
	// ================ 属性定义 ================
	// private roomLayout: RoomLayout | null = null;  // 暂未使用
	private radarObjects: BaseObject[] = [];  
	private config: Required<RadarServiceConfig>;
	private timer: number | null = null;
	private vitalTimer: number | null = null;
	private vital: VitalSignData | null = null;
	private lastVitalData: VitalSignData | null = null; // 用于生理指标渐变
	//private movementState: MovementState | null = null;
	private lastPostureChangeTime = Date.now();
	private currentPosture: number | null = null;
	private currentPosition: { x: number; y: number } | null = null;  // Canvas坐标
	private postureDuration = 0;
	// private bedPostureDuration = 0;  // 暂未使用
	private RadarBoundaryMargin = 20;    // 雷达边界余量
	//private BedMargin = 10;              // 床位边界余量
	private vitalStateStartTime = 0;
	private currentVitalState: string | null = null;

	constructor(config: RadarServiceConfig = {}, canvasObjects?: BaseObject[]) {
	  // 默认配置初始化
	  this.config = {
		vitalSignProbability: {
		  danger: 0.3,    // 降低危险概率
		  warning: 0.2,   // 降低警告概率
		  normal: 0.4,    // 提高正常概率
		  undefined: 0.1,
		  ...config.vitalSignProbability
		},
		areaProbability: { 
		  bed: 0.5,    // 50%概率在确保床上,+50%概率在雷达范围内随机位置，仍有可能在床，总概率为0.6
		  ...config.areaProbability 
		},
		duration: {
		  bed: { min: 8000, max: 15000 },
		  normal: { min: 5000, max: 10000 },
		  ...config.duration
		}
	  };
  
	  // 如果提供了 Canvas 对象，加载并转换坐标系
	  if (canvasObjects && canvasObjects.length > 0) {
		this.loadCanvasLayout(canvasObjects);
	  }
	}

	// 加载 Canvas 布局并转换为雷达坐标系
	loadCanvasLayout(objects: BaseObject[]): void {
	  // this.roomLayout = { objects };  // 保留供将来使用
	  
	  const radar = objects.find(obj => obj.typeName === 'Radar');
	  if (!radar) {
		console.warn('未找到雷达对象，无法转换坐标');
		this.radarObjects = objects;
		return;
	  }

	  // 将所有物体坐标转换为雷达坐标系
	  this.radarObjects = objects.map(obj => {
		if (obj.typeName === 'Radar') {
		  // 雷达本身位于原点
		  return {
			...obj,
			// 保持雷达对象不变
		  };
		} else if (obj.geometry.type === 'rectangle' || obj.geometry.type === 'polygon') {
		  // 家具对象：转换中心点到雷达坐标系
		  const center = obj.geometry.type === 'rectangle' 
			? {
				x: (obj.geometry.data.vertices[0].x + obj.geometry.data.vertices[2].x) / 2,
				y: (obj.geometry.data.vertices[0].y + obj.geometry.data.vertices[2].y) / 2
			  }
			: obj.geometry.data.vertices[0];  // 多边形使用第一个点
			
		  const radarPos = toRadarCoordinate(center.x, center.y, radar);
		  return {
			...obj,
			// 添加雷达坐标系位置（用于区域判断）
			radarPosition: radarPos
		  };
		} else {
		  return obj;
		}
	  });
	}

// ================ 区域管理系统 ================
private areaSystem = {
    // 获取雷达对象
    getRadar: (): BaseObject | null => {
      return this.radarObjects.find(obj => obj.typeName === 'Radar') || null;
    },

    // 获取有效位置：床中心或雷达范围内随机位置（Canvas坐标系）
    getValidPosition: (): { x: number; y: number } | null => {
      const radar = this.areaSystem.getRadar();
      if (!radar) return null;
      
      const boundary = radar.device?.iot?.radar?.boundary;
      if (!boundary) return null;

      // 获取雷达边界顶点（Canvas坐标系）
      const boundaryVertices = getRadarBoundaryVertices(radar);
      
      // 0.6 概率使用床位置
      if (Math.random() < this.config.areaProbability.bed) {
        const bed = this.radarObjects.find(obj => obj.typeName === 'Bed');
        if (bed) {
          const bedVertices = getObjectVertices(bed);
          if (bedVertices.length >= 4) {
            // 返回床的中心点
            const centerX = bedVertices.reduce((sum, v) => sum + v.x, 0) / bedVertices.length;
            const centerY = bedVertices.reduce((sum, v) => sum + v.y, 0) / bedVertices.length;
            return { x: centerX, y: centerY };
          }
        }
      }
      
      // 0.4 概率在雷达范围内随机生成位置
      let attempts = 0;
      const maxAttempts = 50;
      
      // 计算边界的包围盒
      const xs = boundaryVertices.map(v => v.x);
      const ys = boundaryVertices.map(v => v.y);
      const minX = Math.min(...xs) + this.RadarBoundaryMargin;
      const maxX = Math.max(...xs) - this.RadarBoundaryMargin;
      const minY = Math.min(...ys) + this.RadarBoundaryMargin;
      const maxY = Math.max(...ys) - this.RadarBoundaryMargin;
      
      do {
        const position = {
          x: Math.random() * (maxX - minX) + minX,
          y: Math.random() * (maxY - minY) + minY
        };
      
        // 检查是否在边界内且不在障碍物内
        if (isPointInPolygon(position, boundaryVertices) && 
            !this.areaSystem.isInForbiddenArea(position)) {
          return position;
        }
      
        attempts++;
      } while (attempts < maxAttempts);
      
      return null;
    },

    // 检查Canvas坐标点是否在床区域
    isInBedArea: (canvasPoint: { x: number; y: number }): boolean => {
      const beds = this.radarObjects.filter(obj => 
        obj.typeName === 'Bed' || obj.typeName === 'Chair'
      );
      
      return beds.some(bed => {
        const vertices = getObjectVertices(bed);
        if (vertices.length === 0) return false;
        return isPointInPolygon(canvasPoint, vertices);
      });
    },
   
    // 检查Canvas坐标点是否在障碍物区域
    isInForbiddenArea: (canvasPoint: { x: number; y: number }): boolean => {
      const obstacles = this.radarObjects.filter(obj => 
        obj.typeName === 'Wall' || obj.typeName === 'Interfere' || obj.typeName === 'Furniture'
      );
      
      return obstacles.some(obstacle => {
        const vertices = getObjectVertices(obstacle);
        if (vertices.length === 0) return false;
        return isPointInPolygon(canvasPoint, vertices);
      });
    }
  };
// ================ 行为生成系统 ================
private behaviorSystem = {
    // 根据位置生成对应的姿态（Canvas坐标）
    generatePosture: (canvasPosition: { x: number; y: number }): number => {
      const inBed = this.areaSystem.isInBedArea(canvasPosition);
      
      if (inBed) {
        // 床上姿势集合及其权重
        const bedPostures = [
          { posture: PersonPosture.Lying, weight: 60 },        // 躺卧主要姿势
          { posture: PersonPosture.SitUpBed, weight: 15 },     // 普通床上坐起
          { posture: PersonPosture.SitUpBedSuspect, weight: 10 }, // 可疑床上坐起
          { posture: PersonPosture.SitUpBedConfirm, weight: 15 }  // 确认床上坐起
        ];
        return this.behaviorSystem.getWeightedRandomPosture(bedPostures);
      } else {
        // 地面姿势集合及其权重
        const roomPostures = [
          { posture: PersonPosture.Walking, weight: 10 },
          { posture: PersonPosture.Standing, weight: 15 },
          { posture: PersonPosture.SitGroundSuspect, weight: 10 },
          { posture: PersonPosture.SitGroundConfirm, weight: 20 },
          { posture: PersonPosture.FallSuspect, weight: 10 },
          { posture: PersonPosture.FallConfirm, weight: 20 },
          { posture: PersonPosture.Sitting, weight: 15 }
        ];
        return this.behaviorSystem.getWeightedRandomPosture(roomPostures);
      }
    },
   
    // 只在Lying姿态时生成生理指标
    generateVitalData: (posture: number): VitalSignData | null => {
      if (posture !== PersonPosture.Lying) return null;
   
      const vitalState = this.behaviorSystem.generateVitalState();
      const newVital = (() => {
        switch(vitalState) {
          case 'normal':
            return {
              type: 0,
              heartRate: Math.floor(Math.random() * (95 - 60) + 60),
              breathing: Math.floor(Math.random() * (20 - 12) + 12),
              sleepState: 128
            };
          case 'warning':
            return {
              type: 0,
              heartRate: Math.random() < 0.5 ? 
                Math.floor(Math.random() * (59 - 45) + 45) :
                Math.floor(Math.random() * (105 - 96) + 96),
              breathing: Math.random() < 0.5 ?
                Math.floor(Math.random() * (11 - 8) + 8) :
                Math.floor(Math.random() * (26 - 21) + 21),
              sleepState: 64
            };
          case 'danger':
            return {
              type: 0,
              heartRate: Math.random() < 0.5 ? 
                Math.floor(Math.random() * 45) :
                Math.floor(Math.random() * (150 - 105) + 105),
              breathing: Math.random() < 0.5 ?
                Math.floor(Math.random() * 8) :
                Math.floor(Math.random() * (40 - 26) + 26),
              sleepState: 192
            };
          default:
            return null;
        }
      })();

	  // 生理指标渐变处理
      if (!this.lastVitalData || !newVital) {
        this.lastVitalData = newVital;
        return newVital;
      }
   
      const smoothVital: VitalSignData = {
        type: 0,
        heartRate: Math.floor(this.lastVitalData.heartRate + 
          (newVital.heartRate - this.lastVitalData.heartRate) * 0.3),
        breathing: Math.floor(this.lastVitalData.breathing + 
          (newVital.breathing - this.lastVitalData.breathing) * 0.3),
        sleepState: newVital.sleepState
      };
   
      this.lastVitalData = smoothVital;
      return smoothVital;
    },
   
    // 生成生理指标状态，包含状态持续时间控制
    generateVitalState: (): string => {
      const now = Date.now();

      // 检查现有状态是否需要继续保持
      if (this.currentVitalState) {
        const duration = now - this.vitalStateStartTime;
        
        if (this.currentVitalState === 'danger' && duration < 10000) {  // danger持续10秒
          return 'danger';
        }
        if (this.currentVitalState === 'warning' && duration < 5000) {  // warning持续5秒
          return 'warning';
        }
      }

      // 生成新状态
      const rand = Math.random();
      const newState = (() => {
        if (rand < 0.3) return 'danger';     // 30%危险
        if (rand < 0.5) return 'warning';    // 20%警告
        if (rand < 0.9) return 'normal';     // 40%正常
        return 'undefined';                  // 10%未定义
      })();

      // 新状态记录开始时间
      if (newState !== this.currentVitalState) {
        this.currentVitalState = newState;
        this.vitalStateStartTime = now;
      }
      return newState;
    },
   
    // 根据权重随机选择姿势
    getWeightedRandomPosture: (postures: Array<{ posture: number; weight: number; }>): number => {
      const totalWeight = postures.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;
      
      for (const item of postures) {
        random -= item.weight;
        if (random <= 0) {
          return item.posture;
        }
      }
      return postures[0].posture;
    }
  };

  // ================ 主要逻辑部分 ================
  generateMockTrackData(): PersonData[] {
    // 样本数据模式：使用历史数据回放
    if (this.realDataMode && this.realData.length > 0) {
		const currentData = this.realData[this.realDataIndex % this.realData.length];
		this.realDataIndex++;
		// 直接返回历史数据，所有字段都已解析好
		return [currentData];
	  }
	
    // 仿真模式：生成模拟数据
    const currentTime = Date.now();
    
    // 初始化位置或位置无效时重新生成
    if (!this.currentPosition) {
      this.currentPosition = this.areaSystem.getValidPosition();
      if (!this.currentPosition) return [];
    }
   
    const inBed = this.areaSystem.isInBedArea(this.currentPosition);
    
    // 姿态更新检查：姿态为空、持续时间到期时
    if (this.currentPosture === null || 
		(currentTime - this.lastPostureChangeTime) >= (this.postureDuration * 1000)) {
      
      // 生成新的位置（Canvas坐标）
      this.currentPosition = this.areaSystem.getValidPosition();
      if (!this.currentPosition) return [];

      // 根据最终位置判断区域并生成对应姿态
      this.currentPosture = this.behaviorSystem.generatePosture(this.currentPosition);
      this.lastPostureChangeTime = currentTime;
      
      // 设置不同姿态的持续时间
      if (this.currentPosture === PersonPosture.Lying) {
        this.postureDuration = 30;     // 躺卧持续30秒，期间生成生理指标
      } else if (this.currentPosture === PersonPosture.FallConfirm || 
                 this.currentPosture === PersonPosture.SitGroundConfirm) {
        this.postureDuration = 15;     // 跌倒和坐地确认持续15秒
      } else {
        this.postureDuration = 5;      // 其他姿态持续5秒
      }
    }
   
    // 计算剩余时间
    const remainTime = Math.floor(
      (this.postureDuration * 1000 - (currentTime - this.lastPostureChangeTime)) / 1000
    );
   
    // 获取雷达设备编码
    const radar = this.areaSystem.getRadar();
    const deviceCode = radar?.device?.iot?.deviceId || 'SIMULATION';
    
    // 构建人员数据（坐标使用Canvas系统）
    const personData: PersonData = {
      // 核心标识
      id: Math.floor(Math.random() * 1000000),  // 随机生成ID
      deviceCode: deviceCode,                    // 雷达设备编码
      personIndex: 0,                            // 仿真模式默认只有1个人，索引为0
      
      // 位置和姿态
      position: this.currentPosition,  // Canvas坐标（cm）
      posture: this.currentPosture,
      
      // 状态信息
      remainTime,
      event: 0,
      areaId: inBed ? 1 : 0,  // 1=床区域，0=其他区域
	  timestamp: Math.floor(currentTime / 1000) // UNIX秒级时间戳
    };
   
    // 生理指标生成：只在Lying姿态时生成
    if (this.currentPosture === PersonPosture.Lying) {
      this.vital = this.behaviorSystem.generateVitalData(this.currentPosture);
    } else {
      this.vital = null;
      this.lastVitalData = null;
    }
   
    return [personData];
  }

  // ================ 时间序列控制 ================
  // private playSampleData(onTrackData: (data: PersonData[]) => void) {
  // 	const pushNext = () => {
  // 		const trackData = this.generateMockTrackData();
  // 		onTrackData(trackData);
  // 		
  // 		// 直接调用无参版本
  // 		const interval = this.calculateSampleInterval();
  // 		this.timer = window.setTimeout(pushNext, interval);
  // 	  };
  // 	  pushNext();
  // }

  private calculateSampleInterval(): number {
	if (this.realData.length === 0 || this.realDataIndex === 0) {
	  return 1000; // 默认1秒间隔
	}
  
	// 自动计算当前和上一条数据的时间差
	const currentIndex = this.realDataIndex % this.realData.length;
	const prevIndex = (currentIndex === 0) 
	  ? this.realData.length - 1 
	  : currentIndex - 1;
  
	const current = this.realData[currentIndex];
	const previous = this.realData[prevIndex];
	
	return Math.max(
	  (current.timestamp - previous.timestamp) * 1000, // 转换为毫秒
	  100 // 最小间隔100ms
	);
  }

  // private startSimulationMode(
  //   onTrackData: (data: PersonData[]) => void,
  //   onVitalData: (data: VitalSignData) => void
  // ) {
  //   // 原有模拟模式逻辑
  //   this.timer = window.setInterval(() => {
  //     onTrackData(this.generateMockTrackData());
  //   }, 1000);

  //   this.vitalTimer = window.setInterval(() => {
  //     if (this.vital) onVitalData(this.vital);
  //   }, 2000);
  // }
  
  // ================ 数据流控制 ================
  startMockDataStream(
	  onTrackData: (data: PersonData[]) => void,
	  onVitalData: (data: VitalSignData) => void,
	): void {
	  this.stopDataStream();

	  if (this.realDataMode) {
	    this.realDataIndex = 0; // 重置索引
	    const playNext = () => {
	      const data = this.generateMockTrackData();
	      onTrackData(data);
	      
	      // 统一使用无参调用
	      const interval = this.calculateSampleInterval();
	      this.timer = window.setTimeout(playNext, interval);
	    };
	    playNext();
	  } else {

	    // 每秒更新人员数据
	    this.timer = window.setInterval(() => {
	      const trackData = this.generateMockTrackData();
	      onTrackData(trackData);
	    }, 1000);
	   
	    // 每2秒更新生理指标
	    this.vitalTimer = window.setInterval(() => {
	      if (this.vital) {
	        onVitalData(this.vital);
	      }
	    }, 2000);
	  }
	}
   
  // 停止数据流并清理状态
  stopDataStream(): void {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (this.vitalTimer) {
      window.clearInterval(this.vitalTimer);
      this.vitalTimer = null;
    }
    // 清理所有状态
    this.vital = null;
    this.lastVitalData = null;
    this.currentPosition = null;
    this.currentPosture = null;
    this.lastPostureChangeTime = Date.now();
    this.currentVitalState = null;
    this.vitalStateStartTime = 0;
  }

  // 获取历史数据（用于回放）- 生成仿真数据
  getHistoricalData(durationSeconds: number = 60): any[] {
    console.log(`🎲 生成 ${durationSeconds} 秒的仿真历史数据...`);
    console.log(`📦 雷达对象数量: ${this.radarObjects.length}`);
    
    const radar = this.radarObjects.find(obj => obj.typeName === 'Radar');
    if (!radar) {
      console.error('❌ 未找到雷达对象，无法生成仿真数据');
      return [];
    }
    console.log(`✅ 找到雷达: ${radar.name || radar.id}`);
    
    const baseTimestamp = Math.floor(Date.now() / 1000);
    const historicalData: any[] = [];
    
    // 每秒生成一次新的数据（模拟人员移动）
    for (let i = 0; i < durationSeconds; i++) {
      // 每次调用 generateMockTrackData() 都会生成新的位置/姿态
      const mockData = this.generateMockTrackData();
      
      if (mockData.length === 0) {
        if (i === 0) {
          console.error(`❌ 第 ${i} 秒无法生成仿真数据，可能是雷达配置问题`);
        }
        continue;
      }
      
      // 将第一个人员的数据转换为回放格式
      const personData = mockData[0];
      
      historicalData.push({
        timestamp: baseTimestamp + i,
        persons: [{
          id: personData.id,
          personIndex: personData.personIndex || 0,
          posture: personData.posture,
          position: personData.position,
          heartRate: personData.heartRate,
          breathingRate: personData.breathingRate,
          sleepStatus: personData.sleepStatus,
          deviceCode: personData.deviceCode,
          timestamp: baseTimestamp + i
        }]
      });
      
      if (i < 3) {
        console.log(`  📍 Frame ${i}: posture=${personData.posture}, pos=(${personData.position.x.toFixed(1)}, ${personData.position.y.toFixed(1)})`);
      }
    }
    
    console.log(`✅ 生成了 ${historicalData.length} 条仿真历史记录`);
    return historicalData;
  }
}


	