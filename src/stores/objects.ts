/**
 * 对象管理 Store
 * 管理雷达、设备、家具、结构等所有对象
 */

import { defineStore } from 'pinia';
import type { BaseObject } from '@/utils/types';
import { FURNITURE_CONFIGS } from '@/utils/types';
import { updateRadarAreas } from '@/utils/radarUtils';

export const useObjectsStore = defineStore('objects', {
  state: () => ({
    // 所有对象列表
    objects: [] as BaseObject[],
    
    // 当前选中的对象ID
    selectedId: null as string | null,
    
    // 对象计数器（用于生成唯一ID）
    objectCounter: 0
  }),
  
  getters: {
    /**
     * 获取所有雷达设备
     */
    radars: (state) => 
      state.objects.filter(obj => obj.typeName === 'Radar'),
    
    /**
     * 获取所有IoT设备（雷达、睡眠监测、传感器）
     */
    iotDevices: (state) => 
      state.objects.filter(obj => obj.device.category === 'iot'),
    
    /**
     * 获取所有家具
     */
    furniture: (state) => 
      state.objects.filter(obj => obj.device.category === 'furniture'),
    
    /**
     * 获取所有结构（墙、门等）
     */
    structures: (state) => 
      state.objects.filter(obj => obj.device.category === 'structure'),
    
    /**
     * 获取选中的对象
     */
    selectedObject: (state) => 
      state.objects.find(obj => obj.id === state.selectedId) || null,
    
    /**
     * 获取按层级排序的对象（用于绘制顺序）
     */
    orderedObjects: (state) => 
      [...state.objects].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)),
    
    /**
     * 对象总数
     */
    totalCount: (state) => state.objects.length,
    
    /**
     * 是否有选中对象
     */
    hasSelection: (state) => state.selectedId !== null
  },
  
  actions: {
    /**
     * 生成唯一ID
     */
    generateId(prefix: string = 'obj'): string {
      this.objectCounter++;
      return `${prefix}_${Date.now()}_${this.objectCounter}`;
    },
    
    /**
     * 添加对象
     */
    addObject(obj: BaseObject) {
      // 确保有ID
      if (!obj.id) {
        obj.id = this.generateId(obj.typeName.toLowerCase());
      }
      
      // 先清除其他对象的选中状态
      this.objects.forEach(o => {
        if (o.interactive) o.interactive.selected = false;
      });

      // 加入列表并标记为选中
      if (obj.interactive) {
        obj.interactive.selected = true;
      } else {
        (obj as any).interactive = { selected: true, locked: false };
      }

      this.objects.push(obj);

      // 自动选中新添加的对象
      this.selectedId = obj.id;
      
      console.log(`✅ Added object: ${obj.typeName} (${obj.id})`);
      
      // 如果是雷达或家具，更新区域
      if (obj.typeName === 'Radar' || obj.device.category === 'furniture') {
        this.updateAllRadarAreas();
      }
    },
    
    /**
     * 删除对象
     */
    removeObject(id: string) {
      const index = this.objects.findIndex(obj => obj.id === id);
      if (index !== -1) {
        const obj = this.objects[index];
        const isRadar = obj.typeName === 'Radar';
        const isFurniture = obj.device.category === 'furniture';
        
        this.objects.splice(index, 1);
        
        // 如果删除的是选中对象，清除选中
        if (this.selectedId === id) {
          this.selectedId = null;
        }
        
        console.log(`🗑️ Deleted object: ${obj.typeName} (${id})`);
        
        // 如果删除的是雷达或家具，更新区域
        if (isRadar || isFurniture) {
          this.updateAllRadarAreas();
        }
      }
    },
    
    /**
     * 更新对象
     */
    updateObject(id: string, updates: Partial<BaseObject>) {
      const obj = this.objects.find(o => o.id === id);
      if (obj) {
        const isRadar = obj.typeName === 'Radar';
        const isFurniture = obj.device.category === 'furniture';
        const geometryChanged = updates.geometry !== undefined;
        const boundaryChanged = updates.device?.iot?.radar?.boundary !== undefined;
        const angleChanged = updates.angle !== undefined;
        
        // 调试：输出检测结果
        console.log(`📝 updateObject: ${obj.name}`, {
          isRadar,
          isFurniture,
          geometryChanged,
          boundaryChanged,
          angleChanged,
          updates: Object.keys(updates)
        });
        
        Object.assign(obj, updates);
        
        // 如果是几何/边界/角度变化，更新区域
        const shouldUpdate = (isRadar && (geometryChanged || boundaryChanged || angleChanged)) || (isFurniture && geometryChanged);
        console.log(`  shouldUpdate = ${shouldUpdate}`);
        
        if (shouldUpdate) {
          console.log('🔄 Triggered area update');
          this.updateAllRadarAreas();
        }
      }
    },
    
    /**
     * 选中对象
     */
    selectObject(id: string | null) {
      this.selectedId = id;

      // 同步设置每个对象的 interactive.selected 标志
      this.objects.forEach(obj => {
        if (!obj.interactive) (obj as any).interactive = { selected: false, locked: false };
        obj.interactive.selected = id !== null && obj.id === id;
      });

      // 如果选中的是雷达，输出区域信息
      if (id) {
        const obj = this.objects.find(o => o.id === id);
        if (obj && obj.typeName === 'Radar') {
          this.logRadarAreas(id);
        }
      }
    },
    
    /**
     * 清除选中
     */
    clearSelection() {
      this.selectedId = null;
      this.objects.forEach(obj => {
        if (obj.interactive) obj.interactive.selected = false;
      });
    },
    
    /**
     * 切换对象选中状态
     */
    toggleSelection(id: string) {
      if (this.selectedId === id) {
        this.clearSelection();
      } else {
        this.selectObject(id);
      }
    },
    
    /**
     * 根据ID获取对象
     */
    getObjectById(id: string): BaseObject | undefined {
      return this.objects.find(obj => obj.id === id);
    },
    
    /**
     * 清空所有对象
     */
    clearAll() {
      this.objects = [];
      this.selectedId = null;
      console.log('🧹 Cleared all objects');
    },
    
    /**
     * 删除选中的对象
     */
    removeSelected() {
      if (this.selectedId) {
        this.removeObject(this.selectedId);
      }
    },
    
    /**
     * 复制对象
     */
    duplicateObject(id: string) {
      const obj = this.getObjectById(id);
      if (!obj) return;
      
      // 深拷贝对象
      const newObj = JSON.parse(JSON.stringify(obj)) as BaseObject;
      
      // 生成新ID
      newObj.id = this.generateId(obj.typeName.toLowerCase());
      
      // 稍微偏移位置
      if (newObj.geometry.type === 'point') {
        newObj.geometry.data.x += 20;
        newObj.geometry.data.y += 20;
      }
      
      this.addObject(newObj);
    },
    
    /**
     * 更新所有雷达的区域列表
     * 1. 计算每个雷达边界内的家具
     * 2. 根据区域类型，自动转换床的状态和颜色
     */
    updateAllRadarAreas() {
      const radars = this.radars;
      console.log(`\n🔄 Updating all radar areas (${radars.length} radars total)`);
      
      // 为每个雷达计算区域
      radars.forEach(radar => {
        const areas = updateRadarAreas(radar, this.objects);
        console.log(`  📡 ${radar.name}: ${areas.length} areas`);
        if (radar.device.iot?.radar) {
          radar.device.iot.radar.areas = areas;
        }
      });
      
      // 根据所有雷达的区域列表，更新床的状态
      const bedStatusMap = new Map<string, { shouldBeMonitor: boolean, inAnyBoundary: boolean }>();
      
      // 初始化所有床的状态
      this.objects.forEach(obj => {
        if (obj.typeName === 'Bed' || obj.typeName === 'MonitorBed') {
          bedStatusMap.set(obj.id, { shouldBeMonitor: false, inAnyBoundary: false });
        }
      });
      
      // 检查每个雷达的区域
      radars.forEach(radar => {
        const areas = radar.device.iot?.radar?.areas || [];
        areas.forEach(area => {
          const bedStatus = bedStatusMap.get(area.objectId);
          if (bedStatus) {
            bedStatus.inAnyBoundary = true;
            if (area.areaType === 5) {
              bedStatus.shouldBeMonitor = true;
            }
          }
        });
      });
      
      // 更新床的状态
      bedStatusMap.forEach((status, bedId) => {
        const bed = this.objects.find(o => o.id === bedId);
        if (!bed) return;
        
        if (status.shouldBeMonitor && bed.typeName !== 'MonitorBed') {
          // 转换为监护床
          bed.typeName = 'MonitorBed';
          bed.visual.color = FURNITURE_CONFIGS['MonitorBed'].color;
        } else if (!status.shouldBeMonitor && bed.typeName === 'MonitorBed') {
          // 恢复为普通床
          bed.typeName = 'Bed';
          bed.visual.color = FURNITURE_CONFIGS['Bed'].color;
        }
      });
    },
    
    /**
     * 输出雷达的区域信息（用于调试）
     */
    logRadarAreas(radarId: string) {
      const radar = this.objects.find(o => o.id === radarId && o.typeName === 'Radar');
      if (!radar) {
        console.log('❌ Radar not found');
        return;
      }
      
      const areas = radar.device.iot?.radar?.areas || [];
      
      // Console output
      console.log(`\n📡 Radar Area Info: ${radar.name}`);
      console.log(`   Objects in boundary: ${areas.length}`);
      console.log(`   ================`);
      
      // Build statusMessage content
      const statusLines: string[] = [];
      statusLines.push(`Radar Areas: ${areas.length} objects`);
      
      areas.forEach(area => {
        const obj = this.objects.find(o => o.id === area.objectId);
        const v = area.vertices;
        
        // Console detailed output
        console.log(`\n   Area #${area.areaId}:`);
        console.log(`     Object: ${obj?.name} (${area.objectType})`);
        console.log(`     Type: area-type=${area.areaType} (${this.getAreaTypeName(area.areaType)})`);
        console.log(`     Radar coordinates:`);
        console.log(`       v1: (h=${v[0].h}, v=${v[0].v})`);
        console.log(`       v2: (h=${v[1].h}, v=${v[1].v})`);
        console.log(`       v3: (h=${v[2].h}, v=${v[2].v})`);
        console.log(`       v4: (h=${v[3].h}, v=${v[3].v})`);
        
        // statusMessage: compact single-line format
        // Format: name(AreaID, AreaType, h1,v1, h2,v2, h3,v3, h4,v4)
        const coordStr = `${v[0].h},${v[0].v}, ${v[1].h},${v[1].v}, ${v[2].h},${v[2].v}, ${v[3].h},${v[3].v}`;
        statusLines.push(`${obj?.name}(${area.areaId}, ${area.areaType}, ${coordStr})`);
      });
      
      console.log(`\n   ================\n`);
      
      // Update radar statusMessage
      if (radar.device.iot) {
        radar.device.iot.statusMessage = statusLines.join('\n');
      }
    },
    
    /**
     * 获取区域类型名称
     */
    getAreaTypeName(areaType: number): string {
      const typeNames: Record<number, string> = {
        0: 'Invalid',
        1: 'Custom',
        2: 'Bed',
        3: 'Interfere',
        4: 'Enter',
        5: 'MonitorBed'
      };
      return typeNames[areaType] || 'Unknown';
    },
    
    /**
     * 保存当前 Canvas 布局到 localStorage
     */
    saveCanvas(canvasKey: string) {
      // 从 canvasStore 获取参数
      const canvasStore = (window as any).__canvasStore || { params: null };
      
      const canvasData = {
        params: canvasStore.params,  // 保存Canvas参数（包含设备列表）
        objects: this.objects,       // 保存所有对象
        timestamp: new Date().toISOString()
      };
      
      try {
        localStorage.setItem(canvasKey, JSON.stringify(canvasData));
        console.log(`💾 Canvas saved: ${canvasKey}, ${this.objects.length} objects`);
        return true;
      } catch (error) {
        console.error('❌ Failed to save Canvas:', error);
        return false;
      }
    },
    
    /**
     * 从 localStorage 加载 Canvas 布局
     */
    loadCanvas(canvasKey: string): boolean {
      try {
        const data = localStorage.getItem(canvasKey);
        if (!data) {
          console.log(`📭 Canvas does not exist: ${canvasKey}, using empty layout`);
          this.objects = [];
          this.selectedId = null;
          return false;
        }
        
        const canvasData = JSON.parse(data);
        this.objects = canvasData.objects || [];
        this.selectedId = null;
        
        console.log(`📂 Canvas已加载: ${canvasKey}, ${this.objects.length}个对象`);
        
        // 加载后更新所有雷达区域
        this.updateAllRadarAreas();
        
        return true;
      } catch (error) {
        console.error('❌ 加载Canvas失败:', error);
        this.objects = [];
        this.selectedId = null;
        return false;
      }
    },
    
    /**
     * 清空当前 Canvas
     */
    clearCanvas() {
      this.objects = [];
      this.selectedId = null;
      console.log('🗑️ Canvas已清空');
    },
    
    /**
     * 直接设置布局（从服务器加载的布局数据）
     */
    setLayout(layout: { objects?: any[] }) {
      if (layout.objects) {
        this.objects = layout.objects;
        this.selectedId = null;
        // 加载后更新所有雷达区域
        this.updateAllRadarAreas();
        console.log(`📂 Layout loaded: ${this.objects.length} objects`);
      }
    },
    
    /**
     * 生成临时设备ID（找到第一个可用的序号）
     */
    generateTempDeviceId(deviceType: 'Radar' | 'Sleepad' | 'Sensor'): { deviceId: string; deviceName: string } {
      // 获取该类型已使用的序号
      const usedNumbers = new Set<number>();
      
      this.objects.forEach(obj => {
        if (obj.typeName === deviceType && obj.device?.iot?.deviceId) {
          const match = obj.device.iot.deviceId.match(new RegExp(`^${deviceType}(\\d+)$`));
          if (match) {
            usedNumbers.add(parseInt(match[1]));
          }
        }
      });
      
      // 找到第一个可用的序号（从01开始）
      let number = 1;
      while (usedNumbers.has(number)) {
        number++;
      }
      
      const paddedNumber = number.toString().padStart(2, '0');
      const deviceId = `${deviceType}${paddedNumber}`;
      const deviceName = `${deviceType}${paddedNumber}`;
      
      return { deviceId, deviceName };
    }
  }
});

