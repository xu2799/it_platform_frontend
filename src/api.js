// src/api.js
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
})

// 添加一个请求拦截器 (Interceptor)
apiClient.interceptors.request.use(
  (config) => {
    // 在每个请求发送之前，都从 localStorage 读取 token
    // 这避免了所有 Pinia 的初始化和循环依赖问题
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

export default apiClient