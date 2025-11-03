import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
// (我们不再需要 router 了, 所有的跳转都由 .vue 组件自己负责)

export const useAuthStore = defineStore('auth', () => {

  // 1. “状态” (State): 
  //    我们仍然从“硬盘” (localStorage) 初始化, 
  //    这样页面在“等待” API 响应时不会“闪烁”
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)

  // 2. “计算属性” (Getter):
  const isAuthenticated = computed(() => !!token.value)

  // 3. 【新】“动作” (Action): 获取“真实”用户数据
  //    (这个动作“假设”令牌已经设置好了)
  async function fetchUser() {
    if (!token.value) {
      console.log('AuthStore: (fetchUser) 没有令牌, 无法获取用户。')
      return
    }

    try {
      console.log('AuthStore: 正在从 /api/users/me/ 获取真实用户数据...')

      // 这就是“我是谁”接口
      const response = await axios.get('http://127.0.0.1:8000/api/users/me/')

      // 这就是“真实”的用户数据 (包含 id, username, email, role 等)
      const realUserData = response.data 

      // 把“真实”数据存入“仓库”和“硬盘”
      user.value = realUserData
      localStorage.setItem('user', JSON.stringify(realUserData))

      console.log('AuthStore: 真实用户数据已获取:', realUserData)

    } catch (error) {
      console.error('AuthStore: (fetchUser) 获取用户失败!', error)
      // 如果令牌“过期”了, API 会返回 401 错误
      // 这时我们应该“强制”用户退出登录
      logout() 
    }
  }

  // 4. “动作” (Action): 登录
  async function login(username, password) {
    try {
      console.log('AuthStore: 正在尝试登录...')

      // A. “打电话”换令牌
      const response = await axios.post('http://127.0.0.1:8000/api/token-auth/', {
        username: username,
        password: password
      })

      // B. 存令牌, 并设置“电话机” (Axios)
      const receivedToken = response.data.token
      token.value = receivedToken
      localStorage.setItem('token', receivedToken)
      axios.defaults.headers.common['Authorization'] = `Token ${receivedToken}`

      // C. 【修改】
      //    不再使用“假”数据, 而是立刻调用“新动作”
      await fetchUser() 

      console.log('AuthStore: 登录成功!')
      return true 

    } catch (error) {
      console.error('AuthStore: 登录失败!', error)
      return false
    }
  }

  // 5. “动作” (Action): 退出登录
  function logout() {
    console.log('AuthStore: 正在退出登录...')
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
  }

  // 6. 【修改】“应用启动”时的逻辑
  if (token.value) {
    console.log('AuthStore: 启动时发现令牌, 自动设置为登录模式。')
    axios.defaults.headers.common['Authorization'] = `Token ${token.value}`

    // 并且, 在每次“刷新”页面时,
    // 都去“重新”获取最新的用户信息
    // (这能防止“硬盘”里的数据“过时”)
    fetchUser() 
  }

  // 7. 暴露所有接口
  return { token, user, isAuthenticated, login, logout, fetchUser }
})