<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/courseStore' // 导入课程仓库

const router = useRouter()
const courseStore = useCourseStore() // 激活仓库
    
const title = ref('')
const description = ref('')
const price = ref(0.00)

// 【新增】: 用于绑定封面图文件对象
const coverImageFile = ref(null) 
    
const errorMessage = ref('')
const successMessage = ref('')

// 【新增】: 处理文件变化
const handleFileChange = (event) => {
  // 获取用户选择的第一个文件
  coverImageFile.value = event.target.files ? event.target.files[0] : null
}


const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // 【核心修改】: 必须使用 FormData 来封装数据 (因为有文件上传)
  const formData = new FormData()
  formData.append('title', title.value)
  formData.append('description', description.value)
  formData.append('price', price.value)
  
  // 只有在用户选择了文件时才将其添加到 FormData
  if (coverImageFile.value) {
    formData.append('cover_image', coverImageFile.value)
  }

  try {
    console.log('正在提交课程数据 (FormData)...')
    
    // 【关键】: 发送 POST 请求。
    const response = await axios.post('http://127.0.0.1:8000/api/courses/', formData)
    
    // 【【【数据同步修复】】】
    // 告诉“中央仓库”, 课程数据已经“陈旧”了
    courseStore.markAsStale() 

    successMessage.value = `课程"${response.data.title}" 创建成功!`
    
    // 跳转到新创建的课程详情页
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
    <h1>创建新课程</h1>
    
    <p v-if="successMessage" class="message success">{{ successMessage }}</p>
    <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>

    <form @submit.prevent="handleSubmit" class="course-form" enctype="multipart/form-data">
      
      <div class="form-group">
        <label for="title">课程标题:</label>
        <input type="text" id="title" v-model="title" required>
      </div>

      <div class="form-group">
        <label for="description">课程描述:</label>
        <textarea id="description" v-model="description" required rows="5"></textarea>
      </div>

      <div class="form-group">
        <label for="price">价格 (¥):</label>
        <input type="number" id="price" v-model="price" required min="0.00" step="0.01">
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
.create-course-page { max-width: 600px; margin: 0 auto; padding: 20px; }
.course-form { display: flex; flex-direction: column; gap: 15px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
.form-group input, .form-group textarea { width: 100%; padding: 10px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
.submit-button { padding: 12px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
.submit-button:hover { background-color: #1e7e34; }
.message { padding: 10px; border-radius: 4px; margin-bottom: 15px; }
.success { background-color: #d4edda; color: #155724; border-color: #c3e6cb; }
.error { background-color: #f8d7da; color: #721c24; border-color: #f5c6cb; }
</style>