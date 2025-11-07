<script setup>
import { ref, onMounted, computed } from 'vue' 
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL
const authStore = useAuthStore()

const courses = ref([])
const loading = ref(true)
const errorMessage = ref('')

// 获取该讲师的课程
const fetchInstructorCourses = async () => {
    loading.value = true
    errorMessage.value = ''
    try {
        const response = await axios.get(`${API_URL}/api/instructor/courses/`)
        courses.value = response.data
    } catch (error) {
        console.error('获取讲师课程失败:', error)
        errorMessage.value = '无法加载你的课程。'
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchInstructorCourses()
})

// (辅助函数)
const getFullCoverImagePath = (relativePath) => {
    if (relativePath) {
        return relativePath;
    }
    return 'https://via.placeholder.com/300x150.png?text=No+Cover'
}

</script>

<template>
  <div class="dashboard-container">
    
    <h1 class="section-title">讲师面板 - 我的课程</h1>
    
    <div v-if="loading">正在加载课程...</div>
    <div v-if="errorMessage" class="message error">{{ errorMessage }}</div>

    <section class="course-grid" v-if="courses.length > 0">
      
      <div 
        v-for="course in courses" 
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
          </div>
          <div class="card-content">
            <h3>{{ course.title }}</h3>
          </div>
        </RouterLink>

        <div class="card-admin-actions">
            <RouterLink 
                :to="{ name: 'course-detail', params: { id: course.id } }"
                class="action-button manage-button"
            >
                管理课时
            </RouterLink>
            
            <RouterLink 
                :to="{ name: 'course-edit', params: { id: course.id } }"
                class="action-button edit-button"
            >
                编辑课程
            </RouterLink>
        </div>

      </div>
      
    </section>
    
    <div v-if="!loading && courses.length === 0" class="no-results">
        <p>你还没有创建任何课程。</p>
        <RouterLink to="/create-course" class="nav-button create-course-btn">
            创建你的第一门课程
        </RouterLink>
    </div>
  </div>
</template>

<style scoped>
/* 【【【核心修改】】】: 移除 max-width 和 margin, 调整 padding */
.dashboard-container {
    padding: 20px 40px; /* 顶部/底部 20px, 左/右 40px */
    /* max-width: 1200px; */ /* <-- 已移除 */
    /* margin: 0 auto; */    /* <-- 已移除 */
}
.section-title {
    font-size: 2.2rem;
    color: #333;
    margin-bottom: 30px;
    text-align: center;
}
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
    transition: box-shadow 0.3s;
    display: flex; 
    flex-direction: column;
}
.course-card:hover {
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
    position: absolute;
    top: 8px;
    left: 8px;
}
.card-content {
    padding: 15px;
    flex-grow: 1; 
}
.card-content h3 {
    font-size: 1.1rem;
    margin: 0;
    color: #2c3e50;
}
.card-admin-actions {
    padding: 15px;
    margin-top: auto;
    display: flex;
    gap: 10px;
}
.action-button {
    display: block;
    flex: 1; 
    padding: 10px;
    color: white;
    text-align: center;
    text-decoration: none;
    border-radius: 5px;
    font-weight: bold;
    transition: background-color 0.2s;
}
.manage-button {
    background-color: #28a745; 
}
.manage-button:hover {
    background-color: #218838;
}
.edit-button {
    background-color: #007bff; 
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
.no-results .nav-button {
    margin-top: 20px;
    font-size: 1.1rem;
    background-color: #2ecc71;
    color: white;
    text-decoration: none;
    padding: 12px 20px;
}
.message { padding: 15px; border-radius: 4px; font-size: 1.1rem; text-align: center; }
.error { background-color: #f8d7da; color: #721c24; border-color: #f5c6cb; }
</style>