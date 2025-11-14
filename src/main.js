import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 【【【改进】】】: 封装一个异步启动函数
async function initializeApp() {
  
  const app = createApp(App)

  // 1. 优先安装 Pinia, 这样 store 才能被使用
  app.use(createPinia())

  // --- 【【【新增改进】】】: 预加载用户信息 ---
  // 在路由启动和 App 挂载之前，尝试获取用户信息
  // 这可以防止页面加载后才“闪烁”登录状态
  
  // 动态导入 authStore (此时 Pinia 已激活)
  const { useAuthStore } = await import('@/stores/authStore')
  const authStore = useAuthStore()
  const token = localStorage.getItem('token')

  if (token) {
    console.log('Main.js: 检测到 Token, 正在尝试获取用户信息...')
    try {
      // 尝试获取用户
      await authStore.fetchUser()
      console.log('Main.js: 用户信息获取成功。')
    } catch (error) {
      // 如果 fetchUser 失败 (例如 Token 过期)
      console.error('Main.js: 获取用户信息失败 (Token 可能已过期), 自动退出。', error)
      // 自动登出，清除无效 token
      authStore.logout()
    }
  }
  // --- 【【【新增改进结束】】】 ---

  // 3. 安装路由 (此时 authStore 已经是最新状态)
  app.use(router)

  // 4. 挂载应用
  app.mount('#app')
}

// 执行启动
initializeApp()