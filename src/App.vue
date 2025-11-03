<script setup>
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore' 
import { computed } from 'vue' 

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// 计算属性：根据路由元信息决定是否显示导航栏
const shouldShowHeader = computed(() => !route.meta.hideHeader) 

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div id="app">
    
    <header v-if="shouldShowHeader" class="app-header">
      <div class="navbar-left">
        <div class="navbar-brand">
          <RouterLink :to="{ name: 'home' }">IT 技能在线培训平台</RouterLink>
        </div>
      </div>

      <nav class="navbar-links">
        <ul v-if="!authStore.isAuthenticated">
          <li>
            <RouterLink to="/login">登录</RouterLink>
          </li>
          <li>
            <RouterLink to="/register" class="nav-button">注册</RouterLink>
          </li>
        </ul>

        <ul v-if="authStore.isAuthenticated">
          <li v-if="authStore.user?.role === 'instructor' || authStore.user?.role === 'admin'">
            <RouterLink to="/create-course" class="nav-button">创建课程</RouterLink>
          </li>
          <li class="user-greeting">
            欢迎, {{ authStore.user?.username }} ({{ authStore.user?.role }})
          </li>
          <li>
            <button @click="handleLogout" class="logout-button">退出登录</button>
          </li>
        </ul>
      </nav>
    </header>

    <main class="app-main" :class="{ 'no-header': !shouldShowHeader }">
      <RouterView />
    </main>
  </div>
</template>

<style>
/* ... (全局样式 base.css/main.css 位于 assets 目录，此处省略) */

/* Header/Navbar 样式 */
.app-header {
  background-color: #3498db; 
  padding: 0 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navbar-left {
    display: flex;
    align-items: center;
    gap: 20px; 
}

.navbar-brand a { 
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  transition: opacity 0.3s;
}
.navbar-brand a:hover {
    opacity: 0.8;
}

/* 右侧链接 */
.navbar-links ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
}

.navbar-links li {
  margin-left: 20px;
}
.navbar-links a {
  color: white;
  text-decoration: none;
  font-size: 1rem;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}
.navbar-links a:hover {
  background-color: #2980b9;
}
.nav-button {
  background-color: #2ecc71;
  padding: 8px 15px !important;
  border-radius: 5px;
  font-weight: bold;
}
.nav-button:hover {
  background-color: #27ae60;
}
.user-greeting {
  color: #ecf0f1;
  font-size: 1rem;
}
.logout-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}
.logout-button:hover {
  background-color: #c0392b;
}

/* 主内容区样式 */
.app-main {
  padding: 60px 0 0 0; 
  flex-grow: 1; 
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
  /* 🎯 关键修复：将灰色背景改为白色 */
  background-color: #ffffff; 
}

/* 隐藏导航栏时的特殊样式 */
.app-main.no-header {
    padding-top: 0 !important; 
    padding: 0; 
    max-width: 100%; 
    margin: 0;
}
</style>