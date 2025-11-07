<script setup>
// --- 1. 导入 ---
import { ref, onMounted, computed, watch } from 'vue' // <-- 【【【新增 watch】】】
import { useCourseStore } from '@/stores/courseStore'
import { useAuthStore } from '@/stores/authStore'
import axios from 'axios'
import { useRouter, RouterLink } from 'vue-router'

const API_URL = import.meta.env.VITE_API_URL

// --- 2. 激活仓库和路由 ---
const courseStore = useCourseStore()
const authStore = useAuthStore() 
const router = useRouter()

// --- 3. 接收 URL 道具 ---
const props = defineProps({
  id: {
    type: String, 
    required: true
  }
})

// --- 4. 状态 (State) ---
const newModuleTitle = ref('')
const newLessonTitle = ref('')
const videoFile = ref(null) 
const targetModuleId = ref(null) 
const uploadStatus = ref('') 
// const isEnrolling = ref(false) // <-- 【【【已移除】】】

// --- 5. 计算属性 (Computed) ---

// 查找当前课程
const course = computed(() => {
  return courseStore.courses.find(c => c.id == props.id)
})

// 检查是否为讲师/管理员
const isInstructorOfCourse = computed(() => {
  if (!authStore.isAuthenticated) return false
  if (authStore.user.role === 'admin') return true 
  if (authStore.user.role === 'instructor' && course.value) {
    return authStore.user.id === course.value.instructor?.id
  }
  return false
})

// 【【【已移除】】】: isEnrolled 不再需要
// const isEnrolled = computed(() => { ... })

// --- 6. 生命周期函数 ---
onMounted(() => {
  courseStore.fetchCourseDetail(props.id)
})

// --- 7. 【【【新增：自动跳转逻辑】】】 ---
watch(course, (newCourse) => {
  // 确保 newCourse 不是 null 并且有数据
  if (newCourse && newCourse.modules && newCourse.modules.length > 0) {
    const firstModule = newCourse.modules[0];
    if (firstModule.lessons && firstModule.lessons.length > 0) {
      const firstLesson = firstModule.lessons[0];
      
      console.log(`课程加载完毕, 自动跳转到第一节课: ${firstLesson.id}`)
      
      // 使用 replace, 这样用户按“返回”时不会回到这个空白的详情页
      router.replace({ 
        name: 'lesson-watch', 
        params: { courseId: newCourse.id, lessonId: firstLesson.id } 
      });
    }
  }
}, { 
  immediate: true // 立即检查 (如果数据已在 Pinia 仓库中)
})


// --- 8. 核心功能函数 (已移除 handleEnroll) ---

// (B) 处理文件选择 (不变)
const handleFileChange = (event) => {
  videoFile.value = event.target.files ? event.target.files[0] : null
}

// (C) 添加新章节 (不变)
const handleAddModule = async () => {
  if (!newModuleTitle.value.trim()) return 
  
  try {
    const moduleData = { course: props.id, title: newModuleTitle.value }
    const response = await axios.post(`${API_URL}/api/modules/`, moduleData)
    
    if (course.value.modules) {
      course.value.modules.push(response.data)
      targetModuleId.value = response.data.id
    }
    courseStore.markAsStale() 
    newModuleTitle.value = ''
    
  } catch (error) {
    console.error('创建章节失败:', error)
    alert('创建章节失败！请确保你已登录且具有讲师权限。')
  }
}

// (D) 添加新课时 (不变)
const handleAddLesson = async () => {
  if (!newLessonTitle.value.trim() || !targetModuleId.value || !videoFile.value) {
    alert('请填写课时标题，选择章节并上传文件。')
    return
  }

  uploadStatus.value = '视频上传中...'
  const formData = new FormData()
  formData.append('title', newLessonTitle.value)
  formData.append('module', targetModuleId.value) 
  formData.append('video_file', videoFile.value) 

  try {
    const response = await axios.post(`${API_URL}/api/lessons/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data' 
      }
    })
    
    const targetModule = course.value.modules.find(m => m.id == targetModuleId.value)
    if (targetModule) {
        targetModule.lessons = targetModule.lessons || []
        targetModule.lessons.push(response.data)
    }
    courseStore.markAsStale() 
    uploadStatus.value = '上传成功！视频正在后台处理中...'
    newLessonTitle.value = ''
    videoFile.value = null

  } catch (error) {
    console.error('上传课时失败:', error)
    uploadStatus.value = '上传失败！请检查文件大小或权限。'
  }
}
</script>

<template>
  <div class="course-detail">
    <div v-if="!course">
      <p>正在加载课程...</p>
    </div>
    
    <div v-else>
      
      <div v-if="isInstructorOfCourse" class="admin-panel">
        <h2>讲师管理区</h2>
        
        <form @submit.prevent="handleAddModule" class="add-module-form">
          <input 
            type="text" 
            v-model="newModuleTitle" 
            placeholder="输入新章节标题" 
            required
          >
          <button type="submit" class="admin-button">添加章节</button>
        </form>
        
        <hr>
        
        <h3>添加课时 (视频)</h3>
        <form @submit.prevent="handleAddLesson" class="add-lesson-form">
          <div class="form-group">
            <label>课时标题:</label>
            <input type="text" v-model="newLessonTitle" required>
          </div>

          <div class="form-group">
            <label>选择章节:</label>
            <select v-model="targetModuleId" required>
              <option :value="null" disabled>请选择一个章节</option>
              <option v-for="module in course.modules" :key="module.id" :value="module.id">
                {{ module.title }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>视频文件 (.mp4, .mov):</label>
            <input type="file" @change="handleFileChange" accept="video/*" required>
          </div>
          
          <button type="submit" class="admin-button upload-button" :disabled="uploadStatus.includes('中')">
            上传并开始转码
          </button>

          <p v-if="uploadStatus" class="status-msg">
            {{ uploadStatus }}
          </p>
        </form>
      </div>
      
      <h1>{{ course.title }}</h1>
      <p>{{ course.description }}</p>
      <p v-if="course.instructor">讲师: {{ course.instructor.username }}</p>

      <hr>

      <h2>课程内容:</h2>
      
      <div v-if="course.modules">
        <div v-for="module in course.modules" :key="module.id" class="module">
          <h3>{{ module.title }}</h3>
          <ul>
            <RouterLink
              v-for="lesson in module.lessons" 
              :key="lesson.id"
              :to="{ name: 'lesson-watch', params: { courseId: course.id, lessonId: lesson.id } }"
              class="lesson-link"
            >
              <li>
                {{ lesson.title }} 
                
                <span v-if="lesson.lesson_type === 'text' && lesson.video_mp4_file">
                  (视频正在处理中...)
                </span>
                <span v-if="lesson.lesson_type === 'video'">
                  (视频 ✅)
                </span>
              </li>
            </RouterLink>
          </ul>
        </div>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
/* (样式基本不变) */
.course-detail { max-width: 800px; margin: 0 auto; padding-top: 20px; }
.admin-panel { border: 2px dashed #007bff; padding: 15px; margin-bottom: 20px; border-radius: 8px; background-color: #eaf4ff; }
.admin-panel h2 { margin-top: 0; color: #007bff; font-size: 1.2rem; }
.add-module-form { display: flex; gap: 10px; margin-top: 10px; }
.add-module-form input { flex-grow: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
.add-lesson-form { display: flex; flex-direction: column; gap: 10px; }
.form-group label { font-weight: bold; margin-bottom: 5px; }
.form-group input, .form-group select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
.admin-button { padding: 8px 15px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
.admin-button:hover { background-color: #0056b3; }
.upload-button { background-color: #28a745; }
.status-msg { margin-top: 10px; font-weight: bold; }
.module { margin-left: 20px; margin-top: 15px; padding: 10px; border-left: 3px solid #ccc; }
h3 { font-size: 1.1rem; }

/* 【【【已移除】】】 .checkout-area, .locked-content */

.lesson-link {
  text-decoration: none;
  color: #333;
}
.lesson-link li {
  padding: 8px 12px;
  margin-bottom: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;
}
.lesson-link:hover li {
  background-color: #f0f0f0;
  color: #007bff;
}
</style>