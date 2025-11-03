/**
 * 雷达数据 Store
 * 管理雷达实时数据、目标检测、轨迹等
 */

import { defineStore } from 'pinia';
import type { RadarPoint, PersonData, Point } from '@/utils/types';

// 雷达目标接口
export interface RadarTarget {
  id: string;
  position: RadarPoint;  // 雷达坐标系位置
  velocity: {
    h: number;  // H方向速度
    v: number;  // V方向速度
  };
  energy: number;        // 能量/信号强度
  timestamp: number;     // 时间戳
}

// 注意：PersonData 和 VitalSignData 已从 types.ts 导入，不再重复定义

export const useRadarDataStore = defineStore('radarData', {
  state: () => ({
    // 雷达连接状态
    isConnected: false,
    activeRadarId: null as string | null,
    
    // 雷达目标（原始数据）
    targets: [] as RadarTarget[],
    
    // 人员数据（处理后的数据）
    persons: [] as PersonData[],
    
    // 历史轨迹（最近N个点）
    // key 格式: `${deviceCode}_${personIndex}`
    trajectories: {} as Record<string, Point[]>,
    maxTrajectoryLength: 50,
    
    // 数据更新时间
    lastUpdate: 0,
    
    // 回放模式（禁用时间过滤）
    isPlaybackMode: false
  }),
  
  getters: {
    /**
     * 在场人数（最近30秒内有数据更新）
     */
    presentCount: (state) => {
      const now = Date.now() / 1000;
      return state.persons.filter(p => (now - p.timestamp) < 30).length;
    },
    
    /**
     * 有心率数据的人员（在场且有生理数据）
     */
    personsWithVitalSigns: (state) => {
      const now = Date.now() / 1000;
      return state.persons.filter(p => 
        (now - p.timestamp) < 30 && p.heartRate !== undefined
      );
    },
    
    /**
     * 获取指定人员的轨迹
     * @param deviceCode 雷达设备编码
     * @param personIndex 人员索引
     */
    getPersonTrajectory: (state) => (deviceCode: string, personIndex: number) => {
      const key = `${deviceCode}_${personIndex}`;
      return state.trajectories[key] || [];
    },
    
    /**
     * 是否有活动数据
     */
    hasActiveData: (state) => 
      state.targets.length > 0 || state.persons.length > 0,
    
    /**
     * 数据延迟（毫秒）
     */
    dataLatency: (state) => 
      state.lastUpdate > 0 ? Date.now() - state.lastUpdate : 0,
    
    /**
     * 当前生理数据（第一个在场人员的数据）
     */
    currentVital: (state) => {
      const now = Date.now() / 1000;
      const person = state.persons.find(p => (now - p.timestamp) < 30);
      if (!person) return null;
      return {
        heartRate: person.heartRate || 0,
        breathing: person.breathRate || 0,
        sleepState: person.sleepState || 0
      };
    },
    
    /**
     * 当前人员列表（在场且最近更新的）
     */
    currentPersons: (state) => {
      // 回放模式下，返回所有人员（不过滤时间）
      if (state.isPlaybackMode) {
        return state.persons;
      }
      
      // 实时模式下，只返回最近30秒内有更新的人员
      const now = Date.now() / 1000;  // 转换为秒
      return state.persons.filter(p => 
        // 最近30秒内有更新的认为在场
        (now - p.timestamp) < 30
      );
    },
    
    /**
     * 按雷达分组的人员列表
     */
    personsByDevice: (state) => {
      const now = Date.now() / 1000;
      const activePersons = state.persons.filter(p => (now - p.timestamp) < 30);
      
      return activePersons.reduce((acc, person) => {
        if (!acc[person.deviceCode]) {
          acc[person.deviceCode] = [];
        }
        acc[person.deviceCode].push(person);
        return acc;
      }, {} as Record<string, PersonData[]>);
    },
    
    /**
     * 获取指定雷达的人员列表
     */
    getPersonsByDevice: (state) => (deviceCode: string) => {
      const now = Date.now() / 1000;
      return state.persons.filter(p => 
        p.deviceCode === deviceCode && (now - p.timestamp) < 30
      );
    },
    
    /**
     * 获取指定人员的最新数据
     */
    getPerson: (state) => (deviceCode: string, personIndex: number) => {
      return state.persons.find(p => 
        p.deviceCode === deviceCode && p.personIndex === personIndex
      );
    }
  },
  
  actions: {
    /**
     * 设置活动雷达
     */
    setActiveRadar(radarId: string) {
      this.activeRadarId = radarId;
      console.log(`📡 激活雷达: ${radarId}`);
    },
    
    /**
     * 设置连接状态
     */
    setConnected(connected: boolean) {
      this.isConnected = connected;
      console.log(`📡 雷达连接: ${connected ? '已连接' : '已断开'}`);
    },
    
    /**
     * 更新雷达目标数据
     */
    updateTargets(targets: RadarTarget[]) {
      this.targets = targets;
      this.lastUpdate = Date.now();
    },
    
    /**
     * 更新人员数据（批量，带平滑移动动画）
     */
    updatePersons(persons: PersonData[]) {
      const now = Date.now();
      
      // 为每个人员设置移动动画
      persons.forEach(newPerson => {
        const existing = this.persons.find(p => 
          p.deviceCode === newPerson.deviceCode && 
          p.personIndex === newPerson.personIndex
        );
        
        if (existing) {
          // 计算位置变化
          const distance = Math.sqrt(
            Math.pow(newPerson.position.x - existing.position.x, 2) + 
            Math.pow(newPerson.position.y - existing.position.y, 2)
          );
          
          // 位置变化超过2cm，启动移动动画
          if (distance > 2) {
            // 动画时长：固定0.5秒（500ms），20帧/秒
            const duration = 500;
            
            Object.assign(existing, {
              ...newPerson,
              startPosition: existing.position,      // 当前位置作为起点
              targetPosition: newPerson.position,    // 新位置作为终点
              moveStartTime: now,
              moveDuration: duration,                // 固定500ms
              isMoving: true
            });
          } else {
            // 位置变化不大，直接更新
            Object.assign(existing, newPerson);
          }
        } else {
          // 新人员，直接添加（无动画）
          this.persons.push({
            ...newPerson,
            isMoving: false
          });
        }
      });
      
      this.lastUpdate = now;
      
      // 更新轨迹（使用目标位置）
      persons.forEach(person => {
        const key = `${person.deviceCode}_${person.personIndex}`;
        
        if (!this.trajectories[key]) {
          this.trajectories[key] = [];
        }
        
        const trajectory = this.trajectories[key];
        
        // 添加轨迹点（包含时间戳）
        trajectory.push({
          ...person.position,
          timestamp: Date.now()  // 添加时间戳用于5秒过期
        });
        
        // 限制轨迹长度
        if (trajectory.length > this.maxTrajectoryLength) {
          trajectory.shift();
        }
      });
    },
    
    /**
     * 添加单个目标
     */
    addTarget(target: RadarTarget) {
      this.targets.push(target);
      this.lastUpdate = Date.now();
    },
    
    /**
     * 添加或更新单个人员（带平滑移动动画）
     */
    addPerson(person: PersonData) {
      // 使用 deviceCode + personIndex 查找（而非 id）
      const index = this.persons.findIndex(p => 
        p.deviceCode === person.deviceCode && 
        p.personIndex === person.personIndex
      );
      
      const now = Date.now();
      
      if (index !== -1) {
        // 更新现有人员 - 设置移动动画
        const existing = this.persons[index];
        const oldPos = existing.position;
        const newPos = person.position;
        
        // 检查位置是否变化（距离超过2cm才触发动画）
        const distance = Math.sqrt(
          Math.pow(newPos.x - oldPos.x, 2) + 
          Math.pow(newPos.y - oldPos.y, 2)
        );
        
        if (distance > 2) {
          // 位置变化，设置移动动画
          // 动画时长：固定0.5秒（500ms），20帧/秒
          const duration = 500;
          
          this.persons[index] = {
            ...person,
            startPosition: oldPos,           // 起始位置
            targetPosition: newPos,          // 目标位置
            moveStartTime: now,              // 动画开始时间
            moveDuration: duration,          // 固定500ms
            isMoving: true                   // 正在移动
          };
        } else {
          // 位置没变化，直接更新
          this.persons[index] = person;
        }
      } else {
        // 添加新人员（首次出现，无动画）
        this.persons.push({
          ...person,
          isMoving: false
        });
      }
      
      this.lastUpdate = now;
      
      // 更新轨迹（使用目标位置）
      const key = `${person.deviceCode}_${person.personIndex}`;
      if (!this.trajectories[key]) {
        this.trajectories[key] = [];
      }
      this.trajectories[key].push(person.position);
      if (this.trajectories[key].length > this.maxTrajectoryLength) {
        this.trajectories[key].shift();
      }
    },
    
    /**
     * 清除所有数据
     */
    clearAll() {
      this.targets = [];
      this.persons = [];
      this.trajectories = {};
      this.lastUpdate = 0;
      console.log('🧹 清空雷达数据');
    },
    
    /**
     * 清除指定人员的轨迹
     */
    clearTrajectory(deviceCode: string, personIndex: number) {
      const key = `${deviceCode}_${personIndex}`;
      delete this.trajectories[key];
    },
    
    /**
     * 清除所有轨迹
     */
    clearAllTrajectories() {
      this.trajectories = {};
    },
    
    /**
     * 清除指定雷达的所有数据
     */
    clearDeviceData(deviceCode: string) {
      // 移除该雷达的所有人员
      this.persons = this.persons.filter(p => p.deviceCode !== deviceCode);
      
      // 移除该雷达的所有轨迹
      Object.keys(this.trajectories).forEach(key => {
        if (key.startsWith(`${deviceCode}_`)) {
          delete this.trajectories[key];
        }
      });
      
      console.log(`🧹 清空雷达 ${deviceCode} 的数据`);
    },
    
    /**
     * 移除离场人员（超过60秒无更新）
     */
    removeInactivePersons() {
      const now = Date.now() / 1000;
      const threshold = 60;  // 60秒
      
      // 找出离场人员
      const inactiveKeys = this.persons
        .filter(p => (now - p.timestamp) > threshold)
        .map(p => `${p.deviceCode}_${p.personIndex}`);
      
      // 移除离场人员
      this.persons = this.persons.filter(p => (now - p.timestamp) <= threshold);
      
      // 移除离场人员的轨迹
      inactiveKeys.forEach(key => {
        delete this.trajectories[key];
      });
      
      if (inactiveKeys.length > 0) {
        console.log(`🧹 移除 ${inactiveKeys.length} 个离场人员`);
      }
    },
    
    /**
     * 模拟数据（用于测试）
     */
    mockData() {
      const now = Math.floor(Date.now() / 1000);
      this.updatePersons([
        {
          // 核心标识
          id: 1,
          deviceCode: 'TEST_RADAR_001',  // 测试雷达编码
          personIndex: 0,                // 第1个人
          
          // 位置和姿态
          position: { x: 100, y: 200, z: 80 },
          posture: 6,  // Lying
          
          // 状态信息
          remainTime: 30,
          event: 0,
          areaId: 1,
          timestamp: now,
          
          // 生理数据
          heartRate: 72,
          breathRate: 16,
          sleepState: 128,  // 轻睡
          movement: 5
        }
      ]);
      
      console.log('🎲 加载模拟数据');
    },
    
    /**
     * 设置回放模式（用于历史数据回放）
     */
    setPlaybackMode(enabled: boolean) {
      this.isPlaybackMode = enabled;
      console.log(`🎬 回放模式: ${enabled ? '启用' : '禁用'}`);
    },
    
    /**
     * 清除所有轨迹和人员数据（用于停止回放）
     */
    clearAllData() {
      this.persons = [];
      this.trajectories = {};
      console.log('🧹 已清除所有人员和轨迹数据');
    }
  }
});

