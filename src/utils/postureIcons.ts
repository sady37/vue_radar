//src/utils/postureIcons.ts

// 首先定义接口
import type { 
	PostureIconConfig
   } from './types';

   


// 批量导入所有SVG（注意：import.meta.glob 不支持 @ 别名，必须用相对路径）
const icons = import.meta.glob("../assets/icons/*.svg", { eager: true });

// 映射文件名到图标路径
const iconMap = Object.entries(icons).reduce(
  (acc, [path, module]) => {
    const name = path.split("/").pop()?.replace(".svg", "");
    if (name) {
      acc[name] = (module as { default: string }).default;
    }
    return acc;
  },
  {} as Record<string, string>,
);

// 调试：输出iconMap
console.log('📦 IconMap loaded:', Object.keys(iconMap));
console.log('  FallConfirm path:', iconMap['FallConfirm']);

export const POSTURE_CONFIGS: Record<number, PostureIconConfig> = {
	0: {
	  // Init
	  type: "png",
	  iconPath: new URL("../assets/icons/Init.png", import.meta.url).href,
	  size: 50,
	  showLabel: false,
	},
	1: {
	  // Walking
	  type: "png",
	  iconPath: new URL("../assets/icons/Walking.png", import.meta.url).href,
	  size: 50,
	  showLabel: false,
	},
	2: {
	  // FallSuspect
	  type: "png",
	  iconPath: new URL("../assets/icons/FallSuspect.png", import.meta.url).href,
	  size: 50,
	  showLabel: false,
	},
	3: {
	  // Sitting
	  type: "png",
	  iconPath: new URL("../assets/icons/Sitting.png", import.meta.url).href,
	  size: 50,
	  showLabel: false,
	},
	4: {
	  // Standing
	  type: "png",
	  iconPath: new URL("../assets/icons/Standing.png", import.meta.url).href,
	  size: 50,
	  showLabel: false,
	},
	5: {
	  // FallConfirm
	  type: "png",
	  iconPath: new URL("../assets/icons/FallConfirm.png", import.meta.url).href,
	  size: 50,
	  showLabel: false,
	},
	6: {
	  // Lying (在床上躺着)
	  type: "png",
	  iconPath: new URL("../assets/icons/LyingBed-back.png", import.meta.url).href,
	  size: 50,
	  showLabel: false,
	},
	7: {
	  // SitGroundSuspect
	  type: "png",
	  iconPath: new URL("../assets/icons/SitGroundSuspect.png", import.meta.url).href,
	  size: 60,
	  showLabel: false,
	},
	8: {
	  // SitGroundConfirm
	  type: "png",
	  iconPath: new URL("../assets/icons/SitGroundConfirm.png", import.meta.url).href,
	  size: 60,
	  showLabel: false,
	},
	9: {
	  // SitUpBed
	  type: "png",
	  iconPath: new URL("../assets/icons/SitUpBed.png", import.meta.url).href,
	  size: 60,
	  showLabel: false,
	},
	10: {
	  // SitUpBedSuspect
	  type: "png",
	  iconPath: new URL("../assets/icons/SitUpBedSuspect.png", import.meta.url).href,
	  size: 60,
	  showLabel: false,
	},
	11: {
	  // SitUpBedConfirm
	  type: "png",
	  iconPath: new URL("../assets/icons/SitUpBedConfirm.png", import.meta.url).href,
	  size: 60,
	  showLabel: false,
	},
  };


// 生理状态图标配置
export const VITAL_SIGN_CONFIGS = {
	heart: {
	  undefined: { type: "svg" as const, iconPath: iconMap["heartrate-gray"], size: 24, showLabel: false },
	  normal: { type: "svg" as const, iconPath: iconMap["heartrate-green"], size: 24, showLabel: false },
	  warning: { type: "svg" as const, iconPath: iconMap["heartrate-yellow"], size: 24, showLabel: false },
	  danger: { type: "svg" as const, iconPath: iconMap["heartrate-red"], size: 24, showLabel: false }
	},
	breathing: {
	  undefined: { type: "svg" as const, iconPath: iconMap["breathe-gray"], size: 24, showLabel: false },
	  normal: { type: "svg" as const, iconPath: iconMap["breathe-green"], size: 24, showLabel: false },
	  warning: { type: "svg" as const, iconPath: iconMap["breathe-yellow"], size: 24, showLabel: false },
	  danger: { type: "svg" as const, iconPath: iconMap["breathe-red"], size: 24, showLabel: false }
	},
	sleep: {
	  undefined: { type: "svg" as const, iconPath: iconMap["AwakeUnknow"], size: 24, showLabel: false },
	  light: { type: "svg" as const, iconPath: iconMap["LightSleep"], size: 24, showLabel: false },
	  deep: { type: "svg" as const, iconPath: iconMap["DeepSleep"], size: 24, showLabel: false },
	  awake: { type: "svg" as const, iconPath: iconMap["Awake"], size: 24, showLabel: false }
	}
   } as const;


// 导出状态判断函数
export const getHeartRateStatus = (rate: number) => {
	if (rate === undefined || rate === null || isNaN(rate)||rate ===0||rate ===-255) return 'undefined';
	if (rate >= 60 && rate <= 95) return 'normal';
	if ((rate >= 45 && rate <= 59) || (rate >= 96 && rate <= 105)) return 'warning';
	return 'danger';
   };
   
   export const getBreathingStatus = (rate: number) => {
	if (rate === undefined || rate === null || isNaN(rate)||rate ===0||rate ===-255) return 'undefined';
	if (rate >= 12 && rate <= 20) return 'normal';
	if ((rate >= 8 && rate <= 11) || (rate >= 21 && rate <= 26)) return 'warning';
	return 'danger';
   };
   
   export const getSleepStatus = (state: number) => {
	if (state === undefined || state === null) return 'undefined';
	switch (state >> 6) {
	  case 1: return 'light';
	  case 2: return 'deep';
	  case 3: return 'awake';
	  default: return 'undefined';
	}
   };

   export const getPostureLevel = (posture: number) => {
	// L1 级别
	if (posture === 5 || posture === 8|| posture === 11) { // FallConfirm, SitGroundConfirm,SitUpBedConfirm
	  return 'danger';
	}
	// L2 级别
	if (posture === 11 ) { // SitUpBedConfirm,FallSuspect,SitUpBedSuspect
	  return 'warning';
	}
	return 'normal';
  };