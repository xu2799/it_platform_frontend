import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
// 【【【修改】】】: 导入我们新的 apiClient
import apiClient from '@/api'
// 【【【修改】】】: 导入原始 axios 仅用于 *登录*
import axios from 'axios' 

const API_URL = import.meta.env.VITE_API_URL

export const useAuthStore = defineStore('auth', () => {

  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)

  const isAuthenticated = computed(() => !!token.value)
  
  const isCourseFavorited = computed(() => {
    return (courseId) => {
        if (!user.value || !user.value.favorited_courses) {
            return false
        }
        return user.value.favorited_courses.includes(Number(courseId))
    }
  })


  async function fetchUser() {
    if (!token.value) {
      console.log('AuthStore: (fetchUser) 没有令牌, 无法获取用户。')
      throw new Error("No token found");
    }
    try {
      console.log('AuthStore: 正在从 /api/users/me/ 获取真实用户数据...')
      // 【【【修改】】】: 使用 apiClient (它会自动从 localStorage 读取 token)
      const response = await apiClient.get('/api/users/me/')
      const realUserData = response.data 
      user.value = realUserData
      localStorage.setItem('user', JSON.stringify(realUserData))
      console.log('AuthStore: 真实用户数据已获取:', realUserData)
    } catch (error) {
      console.error('AuthStore: (fetchUser) 获取用户失败!', error)
      logout() 
      throw error; 
    }
  }

  async function login(username, password) {
    try {
      console.log('AuthStore: 正在尝试登录...')
      
      // 【【【修改】】】: 登录请求使用 *原始* axios，因为它不需要 token
      const response = await axios.post(`${API_URL}/api/token-auth/`, {
        username: username,
        password: password
      })
      
      const receivedToken = response.data.token
      if (!receivedToken) {
        throw new Error('未收到认证令牌')
      }

      // 【【【 🛑 关键修复 🛑 】】】
      // 1. 先把 token 存入 localStorage
      localStorage.setItem('token', receivedToken)
      // 2. 再更新 Pinia 状态
      token.value = receivedToken
      
      // 3. 现在才调用 fetchUser()。
      //    此时，apiClient 的拦截器将能从 localStorage 读到新 token
      await fetchUser() 
      
      console.log('AuthStore: 登录成功!')
      return { success: true, error: null }
      
    } catch (error) {
      console.error('AuthStore: 登录失败!', error)
      let errorMessage = '登录失败，请稍后重试'
      if (error.response) {
        if (error.response.status === 400 || error.response.status === 401) {
          errorMessage = '用户名或密码错误'
        } else if (error.response.status >= 500) {
          // 你看到的错误在这里
          errorMessage = '服务器错误，请稍后再试'
        }
      } else if (error.request) {
        errorMessage = '网络错误，请检查网络连接'
      }
      return { success: false, error: errorMessage }
    }
  }

  function logout() {
    console.log('AuthStore: 正在退出登录...')
    token.value = null
    user.value = null
    // 【【【修改】】】: 确保 token 从 localStorage 移除
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function toggleFavorite(courseId) {
    if (!isAuthenticated.value) return false
    
    if (!user.value.favorited_courses) {
        user.value.favorited_courses = []
    }

    try {
        // 【【【修改】】】: 使用 apiClient (它会自动附加 token)
        const response = await apiClient.post(`/api/courses/${courseId}/toggle-favorite/`)
        const favorited = response.data.favorited
        
        if (favorited) {
            user.value.favorited_courses.push(Number(courseId))
        } else {
            user.value.favorited_courses = user.value.favorited_courses.filter(
                id => id !== Number(courseId)
            )
        }
        localStorage.setItem('user', JSON.stringify(user.value))
        return favorited
    } catch (error) {
        console.error("Favorite toggle failed:", error)
        throw error;
    }
  }

  return { 
    token, user, isAuthenticated, 
    login, logout, fetchUser,
    isCourseFavorited, 
    toggleFavorite
  }
})