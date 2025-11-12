import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
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
      // 【【【修改】】】: 抛出错误, 让路由守卫知道失败了
      throw new Error("No token found");
    }
    try {
      console.log('AuthStore: 正在从 /api/users/me/ 获取真实用户数据...')
      const response = await axios.get(`${API_URL}/api/users/me/`)
      const realUserData = response.data 
      user.value = realUserData
      localStorage.setItem('user', JSON.stringify(realUserData))
      console.log('AuthStore: 真实用户数据已获取:', realUserData)
    } catch (error) {
      console.error('AuthStore: (fetchUser) 获取用户失败!', error)
      logout() // 失败时登出
      // 【【【修改】】】: 抛出错误
      throw error; 
    }
  }

  async function login(username, password) {
    try {
      console.log('AuthStore: 正在尝试登录...')
      const response = await axios.post(`${API_URL}/api/token-auth/`, {
        username: username,
        password: password
      })
      const receivedToken = response.data.token
      if (!receivedToken) {
        throw new Error('未收到认证令牌')
      }
      token.value = receivedToken
      localStorage.setItem('token', receivedToken)
      axios.defaults.headers.common['Authorization'] = `Token ${receivedToken}`
      
      // 登录后立即获取用户数据
      await fetchUser() 
      
      console.log('AuthStore: 登录成功!')
      return { success: true, error: null }
    } catch (error) {
      console.error('AuthStore: 登录失败!', error)
      let errorMessage = '登录失败，请稍后重试'
      if (error.response) {
        // 服务器返回了错误响应
        if (error.response.status === 400 || error.response.status === 401) {
          errorMessage = '用户名或密码错误'
        } else if (error.response.status >= 500) {
          errorMessage = '服务器错误，请稍后重试'
        }
      } else if (error.request) {
        // 请求已发出但没有收到响应
        errorMessage = '网络错误，请检查网络连接'
      }
      return { success: false, error: errorMessage }
    }
  }

  function logout() {
    console.log('AuthStore: 正在退出登录...')
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
  }

  async function toggleFavorite(courseId) {
    if (!isAuthenticated.value) return false
    
    // 确保数组存在
    if (!user.value.favorited_courses) {
        user.value.favorited_courses = []
    }

    try {
        const response = await axios.post(`${API_URL}/api/courses/${courseId}/toggle-favorite/`)
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
    }
  }

  
  // 【【【修改】】】: 仅在 token 存在时设置 axios 默认值
  // 但不在 store 初始化时调用 fetchUser()
  // 我们把这个责任完全交给 router.beforeEach
  if (token.value) {
    console.log('AuthStore: 启动时发现令牌, 自动设置为登录模式。')
    axios.defaults.headers.common['Authorization'] = `Token ${token.value}`
    // fetchUser() // <-- 【【【已移除】】】
  }

  return { 
    token, user, isAuthenticated, 
    login, logout, fetchUser,
    isCourseFavorited, 
    toggleFavorite
  }
})