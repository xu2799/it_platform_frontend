<script setup>
import { onMounted, ref } from 'vue' 
import { RouterLink } from 'vue-router'
import { useCourseStore } from '@/stores/courseStore'

// 激活 Pinia 仓库
const courseStore = useCourseStore()

// 🎯 移除：不再需要 BACKEND_URL
// const BACKEND_URL = 'http://127.0.0.1:8000'

// 用于存储当前悬停的课程 ID (用于视频预览)
const hoveredCourseId = ref(null) 

// 页面加载时，获取课程数据
onMounted(() => {
  courseStore.fetchCourses() 
})

// --- 视频预览逻辑 ---
const handleMouseEnter = (course) => {
    if (course.modules && getFirstLessonVideo(course)) {
        hoveredCourseId.value = course.id
    }
}
const handleMouseLeave = () => {
    hoveredCourseId.value = null
}
const getFirstLessonVideo = (course) => {
    if (!course.modules) return null; 
    for (const module of course.modules) {
        if (module.lessons) {
            for (const lesson of module.lessons) {
                // 🎯 关键修复 1：假设视频路径也已经是完整的 URL
                if (lesson.video_mp4_file) {
                    return lesson.video_mp4_file 
                }
            }
        }
    }
    return null
}

// 🎯 关键修复 2：直接返回从数据库获取的 URL
const getFullCoverImagePath = (relativePath) => {
    if (relativePath) {
        // 你的数据库已经提供了完整的 URL (http://...)
        return relativePath;
    }
    // 如果课程没有封面图，使用一个公开的占位符
    return 'https://via.placeholder.com/300x150.png?text=No+Cover'
}
// --- 视频预览逻辑结束 ---
</script>

<template>
  <h1 class="section-title">所有课程</h1>
  
  <section class="course-grid">
    
    <RouterLink 
      v-for="course in courseStore.courses" 
      :key="course.id" 
      :to="`/courses/${course.id}`"
      class="course-link"
      @mouseenter="handleMouseEnter(course)"
      @mouseleave="handleMouseLeave"
    >
      <div class="course-card">
        
        <div class="course-thumbnail">
          
          <video 
              v-if="hoveredCourseId === course.id && getFirstLessonVideo(course)"
              :src="getFirstLessonVideo(course)"
              autoplay 
              loop 
              muted 
              class="video-preview"
              playsinline
          ></video>
          
          <img 
              v-else 
              :src="getFullCoverImagePath(course.cover_image)" 
              :alt="course.title + '封面'" 
              class="cover-image"
          >

          <span class="price-tag">¥{{ course.price }}</span>
        </div>
        
        <div class="card-content">
          <h3>{{ course.title }}</h3>
          <p class="instructor-name">
            讲师: {{ course.instructor?.username || '平台认证' }}
          </p>
        </div>
      </div>
    </RouterLink>
    
  </section>
</template>

<style scoped>
/* 🎯 关键修复 4：移除了 .course-list-view-container 样式 */

.section-title {
    font-size: 2.2rem;
    color: #333;
    margin-bottom: 30px;
    text-align: center;
    /* 🎯 关键修复 5：添加内边距，以匹配 App.vue 的容器 */
    padding: 20px 20px 0 20px;
}
.course-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 30px; 
    /* 🎯 关键修复 5：添加内边距，以匹配 App.vue 的容器 */
    padding: 0 20px 20px 20px;
}
.course-link {
    text-decoration: none;
    color: inherit;
    display: flex; 
}
.course-card {
    background-color: #ffffff;
    border-radius: 10px;
    overflow: hidden; 
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08); 
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s;
    flex-grow: 1; 
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
    display: flex;
    align-items: flex-end; 
    justify-content: flex-end;
    padding: 8px;
    box-sizing: border-box;
    position: relative;
    flex-shrink: 0;
}
.video-preview, .cover-image {
    position: absolute;
    top: 0;
    left: 0;
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
</style>