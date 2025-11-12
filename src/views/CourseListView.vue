<script setup>
import { watch, onMounted } from 'vue' // <-- 【【【已修改】】】: 移除了 ref
import { RouterLink, useRoute } from 'vue-router'
import { useCourseStore } from '@/stores/courseStore'
import { useAuthStore } from '@/stores/authStore' 

const courseStore = useCourseStore()
const authStore = useAuthStore() 
const route = useRoute() 

// 【【【已移除】】】: hoveredCourseId (未被使用)

onMounted(() => {
  if (authStore.token && !authStore.user) {
      authStore.fetchUser()
  }
})

watch(() => route.query, (newQuery) => {
  console.log('路由查询已更改, 正在获取新课程:', newQuery);
  courseStore.fetchCourses(newQuery);
}, {
  immediate: true,
  deep: true 
})


// --- (辅助函数) ---
const getFullCoverImagePath = (relativePath) => {
    if (relativePath) {
        // 如果是完整URL，直接返回
        if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
            return relativePath
        }
        // 如果是相对路径，添加API URL前缀
        const API_URL = import.meta.env.VITE_API_URL
        return `${API_URL}${relativePath}`
    }
    return 'https://via.placeholder.com/300x150.png?text=No+Cover'
}

const handleImageError = (event) => {
    // 图片加载失败时使用占位符
    event.target.src = 'https://via.placeholder.com/300x150.png?text=No+Cover'
}

// 【【【已移除】】】: isCourseOwner (此页面不再需要)
</script>

<template>
  <div class="course-list-container">
    
    <div v-if="route.query.search" class="search-result-header">
        正在搜索: "<strong>{{ route.query.search }}</strong>"
        <RouterLink :to="{ name: 'courses', query: { ...route.query, search: undefined } }" class="clear-search">
            (清除搜索)
        </RouterLink>
    </div>

    <!-- 加载状态 -->
    <div v-if="courseStore.isLoading" class="loading-container">
      <p>正在加载课程...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="courseStore.error" class="error-container">
      <p class="error-message">{{ courseStore.error }}</p>
      <button @click="courseStore.fetchCourses(route.query)" class="retry-button">重试</button>
    </div>

    <!-- 课程列表 -->
    <section v-else class="course-grid">
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
                @error="handleImageError"
            >
            <span v-if="course.category" class="category-tag">
                {{ course.category.name }}
            </span>
          </div>
          
          <div class="card-content">
            <h3>{{ course.title }}</h3>
            <div class="card-footer-stats">
              <span class="instructor-name">
                讲师: {{ course.instructor?.username || '平台认证' }}
              </span>
              <span class="like-stats">
                ❤️ {{ course.like_count || 0 }}
              </span>
            </div>
          </div>
        </RouterLink>
      </div>
    </section>
    
    <div v-if="!courseStore.isLoading && !courseStore.error && (!courseStore.courses || courseStore.courses.length === 0)" class="no-results">
        <p>没有找到符合条件的课程。</p>
    </div>
  </div>
</template>

<style scoped>
/* (容器样式不变) */
.course-list-container {
    padding: 20px 40px; 
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

/* (卡片网格样式不变) */
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

/* (底部信息栏样式不变) */
.card-footer-stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
}
.instructor-name {
    font-size: 0.85rem;
    color: #7f8c8d;
    margin: 0;
}
.like-stats {
    font-size: 0.9rem;
    color: #555;
    font-weight: bold;
}

/* 【【【已移除】】】: .card-admin-actions 和 .edit-button 的样式 */

/* 加载和错误状态 */
.loading-container {
    text-align: center;
    padding: 50px;
    font-size: 1.2rem;
    color: #555;
}

.error-container {
    text-align: center;
    padding: 50px;
}

.error-message {
    color: #dc3545;
    font-size: 1.1rem;
    margin-bottom: 20px;
}

.retry-button {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1rem;
}

.retry-button:hover {
    background-color: #0056b3;
}

/* (无结果样式不变) */
.no-results {
    text-align: center;
    padding: 50px;
    font-size: 1.2rem;
    color: #777;
}
</style>