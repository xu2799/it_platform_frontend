<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter, useRoute } from 'vue-router'
import { useCourseStore } from '@/stores/courseStore' 

const API_URL = import.meta.env.VITE_API_URL

const router = useRouter()
const route = useRoute() 
const courseStore = useCourseStore() 

const courseId = route.params.id 

const title = ref('')
const description = ref('')
// const price = ref(0.00) // <-- 【【【已移除】】】
const categoryId = ref(null) 
const coverImageFile = ref(null) 
    
const errorMessage = ref('')
const successMessage = ref('')
const loading = ref(true)

// 页面加载时, 获取课程详情和分类
onMounted(async () => {
  // 确保分类已加载
  if (courseStore.categories.length === 0) {
    await courseStore.fetchCategories()
  }
  
  try {
    // 从 store 获取课程详情
    const course = await courseStore.fetchCourseDetail(courseId)
    if (course) {
      // 填充表单
      title.value = course.title
      description.value = course.description
      // price.value = course.price // <-- 【【【已移除】】】
      categoryId.value = course.category?.id || null
    } else {
        errorMessage.value = "无法加载课程数据。"
    }
  } catch (error) {
     errorMessage.value = "加载课程失败。"
  } finally {
     loading.value = false
  }
})

const handleFileChange = (event) => {
  coverImageFile.value = event.target.files ? event.target.files[0] : null
}

// 提交更新
const handleUpdate = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!categoryId.value) {
      errorMessage.value = '请选择一个课程分类。'
      return
  }

  const formData = new FormData()
  formData.append('title', title.value)
  formData.append('description', description.value)
  // formData.append('price', price.value) // <-- 【【【已移除】】】
  formData.append('category', categoryId.value)
  
  if (coverImageFile.value) {
    formData.append('cover_image', coverImageFile.value)
  }

  try {
    console.log('正在更新课程数据 (FormData)...')
    
    // 使用 PATCH 请求 (只发送修改过的字段)
    const response = await axios.patch(`${API_URL}/api/courses/${courseId}/`, formData)
    
    courseStore.markAsStale() // 标记列表为“陈旧”

    successMessage.value = `课程"${response.data.title}" 更新成功!`
    
    // 2秒后跳转回讲师面板
    setTimeout(() => {
        router.push({ name: 'instructor-dashboard' })
    }, 2000)
    
  } catch (error) {
    console.error('更新课程失败:', error)
    if (error.response) {
      if (error.response.status === 403) {
        errorMessage.value = '权限不足! 只有本课程讲师和管理员才能编辑。'
      } else {
        errorMessage.value = '更新失败: ' + JSON.stringify(error.response.data)
      }
    } else {
      errorMessage.value = '网络错误或服务器连接失败。'
    }
  }
}
</script>

<template>
  <div class="edit-course-page">
    <h1>编辑课程</h1>
    
    <div v-if="loading">正在加载课程数据...</div>
    
    <p v-if="successMessage" class="message success">{{ successMessage }}</p>
    <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>

    <form @submit.prevent="handleUpdate" class="course-form" v-if="!loading && !successMessage">
      
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
        <label for="cover_image">更新课程封面图 (推荐 16:9):</label>
        <p class="small-text">(如果不选择新文件, 将保留原封面图)</p>
        <input type="file" id="cover_image" @change="handleFileChange" accept="image/*">
      </div>

      <button type="submit" class="submit-button">保存更改</button>
    </form>
  </div>
</template>

<style scoped>
.edit-course-page { max-width: 600px; margin: 20px auto; padding: 20px; }
.course-form { display: flex; flex-direction: column; gap: 15px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
.form-group .small-text { font-size: 0.9rem; color: #777; margin: -5px 0 5px 0; }
.form-group input, .form-group textarea, .form-group select { 
    width: 100%; 
    padding: 10px; 
    box-sizing: border-box; 
    border: 1px solid #ccc; 
    border-radius: 4px; 
    font-size: 1rem;
    font-family: inherit;
}
.submit-button { padding: 12px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
.submit-button:hover { background-color: #0056b3; }
.message { padding: 10px; border-radius: 4px; margin-bottom: 15px; }
.success { background-color: #d4edda; color: #155724; border-color: #c3e6cb; }
.error { background-color: #f8d7da; color: #721c24; border-color: #f5c6cb; }
</style>