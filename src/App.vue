<script setup>
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore' 
import { useCourseStore } from '@/stores/courseStore' 
import { computed, ref, onMounted } from 'vue' 

const authStore = useAuthStore()
const courseStore = useCourseStore() 
const router = useRouter()
const route = useRoute()

const searchQuery = ref('')

const shouldShowHeader = computed(() => !route.meta.hideHeader) 
const shouldShowSimpleHeader = computed(() => !!route.meta.simpleHeader) 
const shouldShowFullHeader = computed(() => shouldShowHeader.value && !shouldShowSimpleHeader.value) 

onMounted(() => {
  courseStore.fetchCategories()
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const handleSearchSubmit = () => {
  if (searchQuery.value.trim()) {
    router.push({ name: 'courses', query: { search: searchQuery.value.trim() } })
    searchQuery.value = ''
  }
}

const API_URL = import.meta.env.VITE_API_URL
const adminUrl = computed(() => `${API_URL}/admin/`)

</script>

<template>
  <div id="app">
    
    <header v-if="shouldShowSimpleHeader" class="app-header">
      <div class="navbar-left">
        <div class="navbar-brand">
          <RouterLink :to="{ name: 'home' }">IT 技能在线培训平台</RouterLink>
        </div>
      </div>
      <nav class="navbar-main"></nav>
      <nav class="navbar-user">
        <ul>
          <li>
            <RouterLink to="/login">登录</RouterLink>
          </li>
          <li>
            <RouterLink to="/register" class="nav-button">注册</RouterLink>
          </li>
        </ul>
      </nav>
    </header>
    
    <header v-if="shouldShowFullHeader" class="app-header">
      
      <div class="navbar-left">
        <div class="navbar-brand">
          <RouterLink :to="{ name: 'home' }">IT 技能在线培训平台</RouterLink>
        </div>
      </div>

      <nav class="navbar-main">
        <ul>
          <li class="category-menu">
            <a class="category-menu-trigger">
              课程分类
              <span class="caret">&#9662;</span>
            </a>
            <div class="dropdown-content category-dropdown-content">
                <RouterLink
                    :to="{ name: 'courses', query: {} }"
                    class="dropdown-item"
                >
                    全部
                </RouterLink>
                <RouterLink
                    v-for="category in courseStore.categories"
                    :key="category?.id || Math.random()"
                    :to="{ name: 'courses', query: { category: category?.slug || '' } }"
                    class="dropdown-item"
                >
                    {{ category.name || '未知分类' }}
                </RouterLink>
            </div>
          </li>
          
          <li>
            <RouterLink :to="{ name: 'about' }">关于我们</RouterLink>
          </li>
        </ul>
      </nav>

      <div class="navbar-right">
        
        <form @submit.prevent="handleSearchSubmit" class="search-form">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索课程..." 
            class="search-input"
          >
          <button type="submit" class="search-button">搜索</button>
        </form>

        <nav class="navbar-user">
          <ul v-if="!authStore.isAuthenticated">
            <li>
              <RouterLink to="/login">登录</RouterLink>
            </li>
            <li>
              <RouterLink to="/register" class="nav-button">注册</RouterLink>
            </li>
          </ul>

          <ul v-if="authStore.isAuthenticated" class="user-menu-container">
            <li v-if="authStore.user?.role === 'instructor' || authStore.user?.role === 'admin'">
              <RouterLink to="/create-course" class="nav-button create-course-btn">创建课程</RouterLink>
            </li>
            <li class="user-menu">
              <a class="user-menu-trigger">
                {{ authStore.user?.username }} ({{ authStore.user?.role }})
                <span class="caret">&#9662;</span>
              </a>
              <div class="dropdown-content">
                <RouterLink :to="{ name: 'profile' }" class="dropdown-item">
                  个人资料
                </RouterLink>

                <RouterLink :to="{ name: 'favorites' }" class="dropdown-item">
                  我的收藏
                </RouterLink>
                <RouterLink 
                  v-if="authStore.user?.role === 'instructor' || authStore.user?.role === 'admin'"
                  :to="{ name: 'instructor-dashboard' }" 
                  class="dropdown-item">
                  讲师面板
                </RouterLink>
                <RouterLink 
                  v-if="authStore.user?.role === 'student'"
                  :to="{ name: 'become-instructor' }" 
                  class="dropdown-item">
                  成为讲师
                </RouterLink>
                <RouterLink 
                  v-if="authStore.user?.role === 'admin'"
                  :to="{ name: 'admin-applications' }" 
                  class="dropdown-item">
                  管理申请
                </RouterLink>
                <a v-if="authStore.user?.role === 'admin'" 
                   :href="adminUrl" 
                   target="_blank" 
                   class="dropdown-item">
                  后台管理
                </a>
                <a @click="handleLogout" class="dropdown-item logout-item">
                  退出登录
                </a>
              </div>
              </li>
          </ul>
        </nav>
      </div>
    </header>

    <main class="app-main" :class="{ 'no-header': !shouldShowHeader }">
      <RouterView :key="route.fullPath" />
    </main>
  </div>
</template>

<style>
/* (样式不变, 此处省略) */
/* 顶部导航栏 (不变) */
.app-header {
  background-color: #3498db; 
  padding: 0 30px;
  display: flex;
  justify-content: space-between; 
  align-items: center;
  height: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  gap: 20px;
}
.navbar-left {
  display: flex;
  align-items: center;
  flex-shrink: 0; 
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
.navbar-main {
  flex-grow: 1; 
  margin: 0 20px; 
  display: flex;
  justify-content: flex-start; 
}
.navbar-main ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 25px;
  align-items: center; 
}
.navbar-main > ul > li > a {
  color: #ecf0f1; 
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: 500;
  padding: 5px 0;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
  white-space: nowrap; 
}
.navbar-main > ul > li > a:hover,
.navbar-main > ul > li > a.router-link-exact-active { 
  color: white;
  border-bottom-color: #f0ad4e;
}
.category-menu {
  position: relative; 
  cursor: pointer;
}
.category-menu-trigger {
  color: #ecf0f1; 
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: 500;
  padding: 5px 0;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
  white-space: nowrap; 
  display: block; 
}
.category-menu-trigger .caret {
  font-size: 0.8rem;
  margin-left: 5px;
  transition: transform 0.2s;
}
.category-menu:hover .category-menu-trigger {
  color: white;
}
.category-menu:hover .caret {
  transform: rotate(180deg);
}
.category-dropdown-content {
  display: none;
  position: absolute;
  left: 0; 
  top: 100%;
  background-color: white;
  min-width: 200px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
  border-radius: 8px;
  overflow: hidden;
  z-index: 100;
  margin-top: 0;
}
.category-menu:hover .category-dropdown-content {
  display: block;
}
.navbar-right {
  display: flex;
  align-items: center;
  flex-shrink: 0; 
  gap: 20px; 
}
.search-form {
  display: flex;
  width: 300px; 
}
.search-input {
  padding: 8px 12px;
  border: none;
  border-radius: 4px 0 0 4px; 
  font-size: 0.9rem;
  width: 100%; 
  outline: none;
}
.search-button {
  padding: 8px 15px;
  border: none;
  background-color: #f0ad4e; 
  color: white;
  border-radius: 0 4px 4px 0; 
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
}
.search-button:hover {
  background-color: #c0802b;
}
.navbar-user {
  display: flex;
  align-items: center;
  flex-shrink: 0; 
}
.navbar-user ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
}
.navbar-user li {
  margin-left: 20px;
}
.navbar-user a {
  color: white;
  text-decoration: none;
  font-size: 1rem;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
  white-space: nowrap; 
}
.navbar-user a:hover {
  background-color: #2980b9;
}
.nav-button {
  background-color: #f0ad4e; 
  padding: 8px 15px !important;
  border-radius: 5px;
  font-weight: bold;
}
.nav-button:hover {
  background-color: #c0802b;
}
.nav-button.create-course-btn {
  background-color: #2ecc71; 
}
.nav-button.create-course-btn:hover {
  background-color: #27ae60;
}
.user-menu-container {
  gap: 20px;
}
.user-menu {
  position: relative; 
  cursor: pointer;
  margin-left: 0; 
}
.navbar-user ul {
  gap: 20px;
}
.navbar-user li {
  margin-left: 0; 
}
.user-menu-trigger {
  display: block;
  font-weight: bold;
  font-size: 1rem;
  padding: 8px 12px; 
  border-radius: 5px;
  transition: background-color 0.3s;
  white-space: nowrap; 
}
.user-menu-trigger:hover {
  background-color: #2980b9; 
}
.caret {
  font-size: 0.8rem;
  margin-left: 5px;
  transition: transform 0.2s;
}
.user-menu:hover .caret {
  transform: rotate(180deg); 
}
.dropdown-content {
  display: none; 
  position: absolute;
  right: 0;
  top: 100%; 
  margin-top: 0; 
  background-color: white;
  min-width: 200px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
  border-radius: 8px;
  overflow: hidden; 
  z-index: 100;
}
.user-menu:hover .dropdown-content {
  display: block;
}
.dropdown-content .dropdown-item {
  display: block;
  padding: 12px 16px;
  text-decoration: none;
  color: #333 !important; 
  font-size: 1rem;
  background-color: white; 
}
.dropdown-content .dropdown-item:hover {
  background-color: #f1f1f1 !important; 
  color: #007bff !important;
}
.dropdown-content .dropdown-item.logout-item {
  color: #e74c3c !important; 
  border-top: 1px solid #eee;
}
.dropdown-content .dropdown-item.logout-item:hover {
  color: #a94442 !important;
}
.app-main {
  padding: 0; 
  flex-grow: 1; 
  width: 100%;
  box-sizing: border-box;
  background-color: #ffffff; 
}
.app-main.no-header {
    padding-top: 0 !important; 
    padding: 0; 
    max-width: 100%; 
    margin: 0;
}
</style>