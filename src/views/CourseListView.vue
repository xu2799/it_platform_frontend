<script setup>
import { ref, watch, onMounted } from 'vue' // <-- 【【【导入 watch】】】
import { RouterLink, useRoute } from 'vue-router'
import { useCourseStore } from '@/stores/courseStore'
import { useAuthStore } from '@/stores/authStore' 

const courseStore = useCourseStore()
const authStore = useAuthStore() 
const route = useRoute() 

const hoveredCourseId = ref(null) 

onMounted(() => {
  if (authStore.token && !authStore.user) {
      authStore.fetchUser()
  }
})

// 【【【核心 BUG 修复】】】
// 替换 watchEffect, 使用更明确的 watch 来监听路由 query 的变化
// 这能确保在搜索、点击分类、或清除筛选时都重新获取数据
watch(() => route.query, (newQuery) => {
  console.log('路由查询已更改, 正在获取新课程:', newQuery);
  courseStore.fetchCourses(newQuery);
}, {
  immediate: true, // 立即执行一次 (替代 onMounted)
  deep: true // 确保 query 对象的更改被检测到
})


// --- (辅助函数) ---
const getFullCoverImagePath = (relativePath) => {
    if (relativePath) {
        return relativePath;
    }
    return 'https://via.placeholder.com/300x150.png?text=No+Cover'
}

const isCourseOwner = (course) => {
    if (!authStore.isAuthenticated || !authStore.user) return false
    if (authStore.user.role === 'admin') return true
    if (authStore.user.role === 'instructor') {
        return course.instructor?.id === authStore.user.id
    }
    return false
}
</script>

<template>
  <div class="course-list-container">
    
    <div v-if="route.query.search" class="search-result-header">
        正在搜索: "<strong>{{ route.query.search }}</strong>"
        <RouterLink :to="{ name: 'courses', query: { ...route.query, search: undefined } }" class="clear-search">
            (清除搜索)
        </RouterLink>
    </div>

    <section class="course-grid">
      
      <div 
        v-for="course in courseStore.courses" 
        :key="course.id" 
        class="course-card"
      >
        <RouterLink :to="`/courses/${course.id}`" class="course-link-wrapper">
          <div class="course-thumbnail">
            <img 
                :src="getFullCoverImagePath(course.cover_image)" 
                :alt="course.title + '封面'" 
                class="cover-image"
            >
            <span v-if="course.category" class="category-tag">
                {{ course.category.name }}
            </span>
            <span class="price-tag">¥{{ course.price }}</span>
          </div>
          
          <div class="card-content">
            <h3>{{ course.title }}</h3>
            <p class="instructor-name">
              讲师: {{ course.instructor?.username || '平台认证' }}
            </p>
          </div>
        </RouterLink>

        <div v-if="isCourseOwner(course)" class="card-admin-actions">
            <RouterLink 
                :to="{ name: 'course-edit', params: { id: course.id } }"
                class="edit-button"
            >
                编辑课程
            </RouterLink>
        </div>

      </div>
      
    </section>
    
    <div v-if="!courseStore.courses || courseStore.courses.length === 0" class="no-results">
        <p>没有找到符合条件的课程。</p>
    </div>
  </div>
</template>

<style scoped>
/* 容器现在有 padding, 因为它在导航栏正下方 */
.course-list-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.search-result-header {
    text-align: center;
    margin: 10px 0 30px 0;
    font-size: 1.1rem;
    color: #555;
}
.clear-search {
    margin-left: 10px;
    font-size: 0.9rem;
    color: #007bff;
}

/* --- (其余样式均不变) --- */
.course-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 30px; 
}
.course-link-wrapper {
    text-decoration: none;
    color: inherit;
    display: flex; 
    flex-direction: column;
    flex-grow: 1; 
}
.course-card {
    background-color: #ffffff;
    border-radius: 10px;
    overflow: hidden; 
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08); 
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s;
    display: flex; 
    flex-direction: column; 
}
.course-card:hover {
    transform: translateY(-8px); 
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2); 
}
.course-thumbnail {
    width: 100%;
    height: 150px;
    background-color: #3498db;
    position: relative;
    flex-shrink: 0;
}
.cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover; 
}
.price-tag {
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: bold;
    z-index: 10; 
    position: absolute;
    bottom: 8px;
    right: 8px;
}
.category-tag {
    background-color: #3498db;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: bold;
    z-index: 10;
    position: absolute;
    top: 8px;
    left: 8px;
}
.card-content {
    padding: 15px;
    flex-grow: 1; 
    display: flex; 
    flex-direction: column; 
    justify-content: space-between; 
}
.card-content h3 {
    font-size: 1.1rem;
    margin-top: 0;
    margin-bottom: 8px;
    color: #2c3e50;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    white-space: normal;
    line-height: 1.5em;
    max-height: 3em; 
}
.instructor-name {
    font-size: 0.85rem;
    color: #7f8c8d;
    margin: 0;
    margin-top: auto; 
}
.card-admin-actions {
    padding: 0 15px 15px 15px; 
    margin-top: auto; 
}
.edit-button {
    display: block;
    width: 100%;
    padding: 10px;
    background-color: #007bff;
    color: white;
    text-align: center;
    text-decoration: none;
    border-radius: 5px;
    font-weight: bold;
    transition: background-color 0.2s;
}
.edit-button:hover {
    background-color: #0056b3;
}
.no-results {
    text-align: center;
    padding: 50px;
    font-size: 1.2rem;
    color: #777;
}
</style>