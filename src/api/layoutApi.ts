/**
 * Canvas Layout API 服务
 * 与后端 PostgreSQL 进行通信
 */

// API 基础 URL（根据实际后端地址修改）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/canvas';

// 统一响应格式
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    details: string;
  };
}

// Layout 数据结构
export interface CanvasLayoutData {
  canvasId: string;      // UUID 格式
  canvasName: string;    // Canvas名称（房间名）
  params: any;
  objects: any[];
  timestamp: string;
}

/**
 * 保存 Layout 到服务器（LaySave - 保存到数据库）
 */
export async function saveLayoutToServer(
  canvasId: string,
  canvasName: string,
  layoutData: CanvasLayoutData,
  userId?: string
): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 如果需要认证，添加 Authorization header
        // 'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        canvasId,
        canvasName,
        layoutData,
        userId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: ApiResponse = await response.json();
    
    if (result.success) {
      console.log(`💾 Layout已保存到服务器: ${canvasId}, version=${result.data?.version}`);
    } else {
      console.error('❌ 保存失败:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ 保存到服务器失败:', error);
    return {
      success: false,
      message: '网络错误，无法连接到服务器',
      error: {
        code: 'NETWORK_ERROR',
        details: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * 从服务器加载 Layout（从数据库加载）
 */
export async function loadLayoutFromServer(canvasId: string): Promise<ApiResponse<{
  canvasId: string;
  canvasName: string;
  layoutData: CanvasLayoutData;
  version: number;
  updatedAt: string;
}>> {
  try {
    const response = await fetch(`${API_BASE_URL}/load/${canvasId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (response.status === 404) {
      return {
        success: false,
        message: 'Layout 不存在',
        data: undefined
      };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log(`📥 从服务器加载 Layout: ${canvasId}, version=${result.data?.version}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ 从服务器加载失败:', error);
    return {
      success: false,
      message: '网络错误，无法连接到服务器',
      error: {
        code: 'NETWORK_ERROR',
        details: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * 删除 Layout（可选）
 */
export async function deleteLayoutFromServer(canvasId: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/delete/${canvasId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ 删除失败:', error);
    return {
      success: false,
      message: '删除失败',
      error: {
        code: 'NETWORK_ERROR',
        details: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * 获取版本历史（可选）
 */
export async function getLayoutHistory(canvasId: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/history/${canvasId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ 获取历史失败:', error);
    return {
      success: false,
      message: '获取历史失败',
      error: {
        code: 'NETWORK_ERROR',
        details: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

