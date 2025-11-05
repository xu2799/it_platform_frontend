<script setup>
// --- 1. 导入 ---
import { ref, onMounted, computed } from 'vue'
import { useCourseStore } from '@/stores/courseStore'
import { useAuthStore } from '@/stores/authStore'
import axios from 'axios'
// 【建议 3】: 导入 RouterLink
import { useRouter, RouterLink } from 'vue-router'

// 【建议 4】: 获取 API 基础 URL
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

// --- 5. 计算属性 (Computed) ---

// 查找当前课程
const course = computed(() => {
  // 从仓库中查找已加载的课程
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

// 【【【建议 1 修复】】】: 检查是否已购买 (不再硬编码)
const isEnrolled = computed(() => {
  // 讲师/管理员 视为“已购买”
  if (isInstructorOfCourse.value) {
    return true; 
  }
  
  // 检查 authStore.user.enrollments 数组 (在 authStore 启动时或支付成功时获取)
  if (!authStore.user?.enrollments) {
    return false;
  }
  
  // props.id 是字符串, authStore.user.enrollments 存的是数字 ID
  const courseIdAsNumber = parseInt(props.id);
  return authStore.user.enrollments.includes(courseIdAsNumber);
})

// --- 6. 生命周期函数 ---
onMounted(() => {
  // 【【【修复】】】:
  // 不再调用 fetchCourses() (它只获取列表)
  // 而是调用新的 fetchCourseDetail() 来获取“完整”数据
  // (后端会检查用户是否已购买, 并决定是否返回 modules)
  courseStore.fetchCourseDetail(props.id)
})

// --- 7. 核心功能函数 ---

// (A) 处理支付 (建议 4: 替换 URL)
const handleCheckout = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login') 
    return
  }
  if (course.value.price <= 0) {
    alert('此课程为免费课程，无需支付！')
    return
  }
  
  const checkoutData = { course_id: props.id }
  try {
    // 【建议 4】: 替换硬编码 URL
    const response = await axios.post(`${API_URL}/api/checkout/`, checkoutData)
    window.location.href = response.data.url 
  } catch (error) {
    console.error('发起支付失败:', error)
    if (error.response?.data?.detail) {
      alert(`发起支付失败: ${error.response.data.detail}`)
    } else {
      alert('发起支付失败，请检查 Stripe 密钥或网络连接。')
    }
  }
}

// (B) 处理文件选择 (不变)
const handleFileChange = (event) => {
  videoFile.value = event.target.files ? event.target.files[0] : null
}

// (C) 添加新章节 (建议 4: 替换 URL)
const handleAddModule = async () => {
  if (!newModuleTitle.value.trim()) return 
  
  try {
    const moduleData = { course: props.id, title: newModuleTitle.value }
    // 【建议 4】: 替换硬编码 URL
    const response = await axios.post(`${API_URL}/api/modules/`, moduleData)
    
    // (逻辑不变)
    if (course.value.modules) {
      course.value.modules.push(response.data)
      targetModuleId.value = response.data.id
    }
    courseStore.markAsStale() // 标记列表页“陈旧”
    newModuleTitle.value = ''
    
  } catch (error) {
    console.error('创建章节失败:', error)
    alert('创建章节失败！请确保你已登录且具有讲师权限。')
  }
}

// (D) 添加新课时 (建议 4: 替换 URL)
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
    // 【建议 4】: 替换硬编码 URL
    const response = await axios.post(`${API_URL}/api/lessons/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data' 
      }
    })
    
    // (逻辑不变)
    const targetModule = course.value.modules.find(m => m.id == targetModuleId.value)
    if (targetModule) {
        targetModule.lessons = targetModule.lessons || []
        targetModule.lessons.push(response.data)
    }
    courseStore.markAsStale() // 标记列表页“陈旧”
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
      <p>价格: ¥{{ course.price }}</p>
      <p v-if="course.instructor">讲师: {{ course.instructor.username }}</p>

      <div class="checkout-area">
        <button v-if="!authStore.isAuthenticated" @click="router.push('/login')" class="checkout-button">
          请登录以购买 (¥{{ course.price }})
        </button>
        <button v-else-if="!isEnrolled" @click="handleCheckout" class="checkout-button primary">
          立即购买 (¥{{ course.price }})
        </button>
        <button v-else class="checkout-button enrolled" disabled>
          已购买 - 开始学习
        </button>
      </div>

      <hr>

      <h2>课程内容:</h2>
      
      <div v-if="(isEnrolled || isInstructorOfCourse) && course.modules">
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

      <div v-else class="locked-content">
        <h3>🔒 课程内容已锁定</h3>
        <p>请先购买课程以查看所有章节和课时。</p>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
/* (你原有的样式保持不变) */
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
.checkout-area { margin-top: 20px; }
.checkout-button { padding: 15px 30px; font-size: 1.2rem; border: none; border-radius: 8px; cursor: pointer; transition: background-color 0.3s; background-color: #f0ad4e; color: white; }
.checkout-button.primary { background-color: #007bff; }
.checkout-button.enrolled { background-color: #5cb85c; cursor: not-allowed; }
.checkout-button.primary:hover { background-color: #0056b3; }

/* 【【【建议 3 修复】】】: 新增样式 */
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

.locked-content {
  border: 1px dashed #ccc;
  background-color: #f9f9f9;
  padding: 20px;
  text-align: center;
  border-radius: 8px;
  margin-top: 20px;
}
.locked-content h3 {
  color: #555;
}
</style>