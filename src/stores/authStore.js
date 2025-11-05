import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

// 【建议 4】: 从 .env 文件读取 API 基础 URL
const API_URL = import.meta.env.VITE_API_URL

export const useAuthStore = defineStore('auth', () => {

  // ... (state 不变) ...
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)

  const isAuthenticated = computed(() => !!token.value)

  async function fetchUser() {
    if (!token.value) {
      console.log('AuthStore: (fetchUser) 没有令牌, 无法获取用户。')
      return
    }

    try {
      console.log('AuthStore: 正在从 /api/users/me/ 获取真实用户数据...')

      // 【建议 4】: 替换硬编码 URL
      const response = await axios.get(`${API_URL}/api/users/me/`)

      const realUserData = response.data 
      user.value = realUserData
      localStorage.setItem('user', JSON.stringify(realUserData))

      console.log('AuthStore: 真实用户数据已获取:', realUserData)

    } catch (error) {
      console.error('AuthStore: (fetchUser) 获取用户失败!', error)
      logout() 
    }
  }

  async function login(username, password) {
    try {
      console.log('AuthStore: 正在尝试登录...')

      // 【建议 4】: 替换硬编码 URL
      const response = await axios.post(`${API_URL}/api/token-auth/`, {
        username: username,
        password: password
      })

      const receivedToken = response.data.token
      token.value = receivedToken
      localStorage.setItem('token', receivedToken)
      axios.defaults.headers.common['Authorization'] = `Token ${receivedToken}`

      await fetchUser() 

      console.log('AuthStore: 登录成功!')
      return true 

    } catch (error) {
      console.error('AuthStore: 登录失败!', error)
      return false
    }
  }

  // ... (logout 和启动逻辑不变) ...
  function logout() {
    console.log('AuthStore: 正在退出登录...')
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
  }

  if (token.value) {
    console.log('AuthStore: 启动时发现令牌, 自动设置为登录模式。')
    axios.defaults.headers.common['Authorization'] = `Token ${token.value}`
    fetchUser() 
  }

  return { token, user, isAuthenticated, login, logout, fetchUser }
})