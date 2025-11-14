// src/api.js
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
})

// --- 请求拦截器 (你已经有了，保持不变) ---
// 在每个请求发送之前，都从 localStorage 读取 token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Token ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// --- 【【【新增改进】】】: 响应拦截器 (用于集中处理错误) ---
apiClient.interceptors.response.use(
  
  // 1. 如果请求成功 (状态码 2xx), 直接返回响应
  (response) => {
    return response
  },

  // 2. 如果请求失败 (状态码 4xx, 5xx), 在这里集中处理
  async (error) => {
    const status = error.response ? error.response.status : null

    // 检查是否是 401 (未授权) 或 403 (禁止访问)
    // 这通常意味着 Token 过期或无效
    if (status === 401 || status === 403) {
      
      console.error('API 拦截器: 检测到 401/403 错误，自动退出登录。', error.response.data)

      // 为了避免循环依赖 (store 导入 api, api 导入 store)
      // 我们在这里“懒加载” authStore
      try {
        const { useAuthStore } = await import('@/stores/authStore')
        const authStore = useAuthStore()
        
        // 调用 logout, 清除本地 token 和 user 状态
        authStore.logout()

        // 强制刷新页面并跳转到登录页，清除所有残留状态
        // 使用 window.location.href 可以确保所有 Vue 状态被重置
        if (window.location.pathname !== '/login') {
            window.location.href = '/login'
        }

      } catch (e) {
        console.error('API 拦截器: 在强制退出时发生错误', e)
        // 极端情况，如果 Pinia 失败，也强制清除 token
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/login') {
            window.location.href = '/login'
        }
      }
    }

    // 将错误继续抛出，以便组件中的 .catch() 仍然可以接收到它
    return Promise.reject(error)
  }
)

export default apiClient