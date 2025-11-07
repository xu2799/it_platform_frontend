<script setup>
import { ref, onMounted } from 'vue' 
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore' 
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL
const authStore = useAuthStore() 

const courses = ref([])
const loading = ref(true)
const errorMessage = ref('')

// 获取收藏的课程
const fetchFavoriteCourses = async () => {
    loading.value = true
    errorMessage.value = ''
    try {
        // 调用新的 API 端点
        const response = await axios.get(`${API_URL}/api/favorites/`)
        courses.value = response.data
    } catch (error) {
        console.error('获取收藏课程失败:', error)
        errorMessage.value = '无法加载你收藏的课程。'
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchFavoriteCourses()
})

// (辅助函数)
const getFullCoverImagePath = (relativePath) => {
    if (relativePath) {
        return relativePath;
    }
    return 'https://via.placeholder.com/300x150.png?text=No+Cover'
}

// 检查课程是否仍被收藏 (用于在取消收藏时即时移除)
const isStillFavorited = (courseId) => {
    return authStore.isCourseFavorited(courseId)
}

</script>

<template>
  <div class="favorites-container">
    
    <h1 class="section-title">我的收藏</h1>
    
    <div v-if="loading">正在加载...</div>
    <div v-if="errorMessage" class="message error">{{ errorMessage }}</div>

    <section class="course-grid" v-if="courses.length > 0">
      
      <div 
        v-for="course in courses" 
        :key="course.id" 
        class="course-card"
        v-if="isStillFavorited(course.id)" 
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
          </div>
          
          <div class="card-content">
            <h3>{{ course.title }}</h3>
            <div class="card-footer-stats">
              <span class="instructor-name">
                讲师: {{ course.instructor?.username || '平台认证' }}
              </span>
              <span class="like-stats">
                ❤️ {{ course.like_count }}
              </span>
            </div>
          </div>
        </RouterLink>
      </div>
      
    </section>
    
    <div v-if="!loading && courses.length === 0" class="no-results">
        <p>你还没有收藏任何课程。</p>
    </div>
  </div>
</template>

<style scoped>
/* 我们从 CourseListView.vue 复制粘贴样式
  (注意: .favorites-container 替换了 .course-list-container)
*/
.favorites-container {
    padding: 20px 40px; 
    /* max-width: 1200px; */ /* (已移除) */
    /* margin: 0 auto; */
}
.section-title {
    font-size: 2.2rem;
    color: #333;
    margin-bottom: 30px;
    text-align: center;
}

/* --- 卡片网格 --- */
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
.no-results {
    text-align: center;
    padding: 50px;
    font-size: 1.2rem;
    color: #777;
}
.message { padding: 15px; border-radius: 4px; font-size: 1.1rem; text-align: center; }
.error { background-color: #f8d7da; color: #721c24; border-color: #f5c6cb; }
</style>