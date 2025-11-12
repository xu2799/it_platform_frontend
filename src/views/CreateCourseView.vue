<script setup>
import { ref, onMounted } from 'vue' // <-- 导入 onMounted
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/courseStore'
import BackButton from '@/components/BackButton.vue' 

const API_URL = import.meta.env.VITE_API_URL

const router = useRouter()
const courseStore = useCourseStore() 
    
const title = ref('')
const description = ref('')
// const price = ref(0.00) // <-- 【【【已移除】】】
const coverImageFile = ref(null) 
// 【【【新增】】】: 存储分类 ID
const categoryId = ref(null) 
    
const errorMessage = ref('')
const successMessage = ref('')

// 【【【新增】】】: 页面加载时获取分类
onMounted(() => {
  courseStore.fetchCategories()
})

const handleFileChange = (event) => {
  coverImageFile.value = event.target.files ? event.target.files[0] : null
}

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // 【【【修改】】】: 检查分类
  if (!categoryId.value) {
      errorMessage.value = '请选择一个课程分类。'
      return
  }

  const formData = new FormData()
  formData.append('title', title.value)
  formData.append('description', description.value)
  // formData.append('price', price.value) // <-- 【【【已移除】】】
  formData.append('category', categoryId.value) // <-- 【【【新增】】】
  
  if (coverImageFile.value) {
    formData.append('cover_image', coverImageFile.value)
  }

  try {
    console.log('正在提交课程数据 (FormData)...')
    
    const response = await axios.post(`${API_URL}/api/courses/`, formData)
    
    courseStore.markAsStale() 

    successMessage.value = `课程"${response.data.title}" 创建成功!`
    
    router.push(`/courses/${response.data.id}`)
    
  } catch (error) {
    console.error('创建课程失败:', error)
    if (error.response) {
      if (error.response.status === 403) {
        errorMessage.value = '权限不足! 只有讲师和管理员才能创建课程。'
      } else {
        errorMessage.value = '创建失败: ' + JSON.stringify(error.response.data)
      }
    } else {
      errorMessage.value = '网络错误或服务器连接失败。'
    }
  }
}
</script>

<template>
  <div class="create-course-page">
    <BackButton 
      :fallback-route="{ name: 'instructor-dashboard' }" 
      text="返回讲师面板"
    />
    <h1>创建新课程</h1>
    
    <p v-if="successMessage" class="message success">{{ successMessage }}</p>
    <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>

    <form @submit.prevent="handleSubmit" class="course-form" enctype="multipart/form-data">
      
      <div class="form-group">
        <label for="title">课程标题:</label>
        <input type="text" id="title" v-model="title" required>
      </div>

      <div class="form-group">
        <label for="category">课程分类:</label>
        <select id="category" v-model="categoryId" required>
            <option :value="null" disabled>-- 请选择分类 --</option>
            <option 
                v-for="category in courseStore.categories" 
                :key="category.id" 
                :value="category.id"
            >
                {{ category.name }}
            </option>
        </select>
      </div>

      <div class="form-group">
        <label for="description">课程描述:</label>
        <textarea id="description" v-model="description" required rows="5"></textarea>
      </div>

      <div class="form-group">
        <label for="cover_image">课程封面图 (推荐 16:9):</label>
        <input type="file" id="cover_image" @change="handleFileChange" accept="image/*">
      </div>

      <button type="submit" class="submit-button">提交课程</button>
    </form>
  </div>
</template>

<style scoped>
.create-course-page { 
  max-width: 600px; 
  margin: 0 auto; 
  padding: 20px; 
}

.create-course-page h1 {
  margin-top: 0;
}
.course-form { display: flex; flex-direction: column; gap: 15px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
/* 【【【修改】】】: 为 <select> 添加样式 */
.form-group input, .form-group textarea, .form-group select { 
    width: 100%; 
    padding: 10px; 
    box-sizing: border-box; 
    border: 1px solid #ccc; 
    border-radius: 4px; 
    font-size: 1rem; /* 确保字体大小一致 */
    font-family: inherit; /* 确保字体一致 */
}
.submit-button { padding: 12px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
.submit-button:hover { background-color: #1e7e34; }
.message { padding: 10px; border-radius: 4px; margin-bottom: 15px; }
.success { background-color: #d4edda; color: #155724; border-color: #c3e6cb; }
.error { background-color: #f8d7da; color: #721c24; border-color: #f5c6cb; }
</style>