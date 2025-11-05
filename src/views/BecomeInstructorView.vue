<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const API_URL = import.meta.env.VITE_API_URL
const router = useRouter()
const authStore = useAuthStore()

const justification = ref('')
const errorMessage = ref('')
const successMessage = ref('')

const handleSubmitApplication = async () => {
    errorMessage.value = ''
    successMessage.value = ''
    
    if (justification.value.trim().length < 50) {
        errorMessage.value = '申请理由不能少于 50 个字符。'
        return
    }

    try {
        const response = await axios.post(`${API_URL}/api/applications/`, {
            justification: justification.value
        })
        
        successMessage.value = '申请提交成功！管理员将会审核您的请求。'
        
        // (可选) 刷新用户信息, 也许 authStore 需要跟踪申请状态
        // authStore.fetchUser() 
        
        // 2秒后跳转回首页
        setTimeout(() => {
            router.push({ name: 'courses' })
        }, 2000)

    } catch (error) {
        console.error('申请失败:', error)
        if (error.response?.data?.detail) {
             errorMessage.value = error.response.data.detail
        } else {
            errorMessage.value = '提交失败，请稍后再试。'
        }
    }
}
</script>

<template>
  <div class="application-page">
    <h1>申请成为讲师</h1>
    <p class="subtitle">
        分享你的知识，创建自己的课程。请告诉我们你为什么适合成为一名讲师。
    </p>

    <div v-if="successMessage" class="message success">{{ successMessage }}</div>
    <div v-if="errorMessage" class="message error">{{ errorMessage }}</div>

    <form @submit.prevent="handleSubmitApplication" class="application-form" v-if="!successMessage">
      <div class="form-group">
        <label for="justification">申请理由:</label>
        <p class="small-text">
            请详细描述你的专业背景、教学经验以及你希望创建的课程类型。(不少于50字)
        </p>
        <textarea 
            id="justification" 
            v-model="justification" 
            rows="10"
            required
        ></textarea>
      </div>
      <button type="submit" class="submit-button">提交申请</button>
    </form>
  </div>
</template>

<style scoped>
.application-page { max-width: 700px; margin: 20px auto; padding: 20px; }
.subtitle { font-size: 1.1rem; color: #555; }
.application-form { display: flex; flex-direction: column; gap: 15px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin-top: 20px;}
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 1.2rem; }
.form-group .small-text { font-size: 0.9rem; color: #777; margin-top: 0; }
.form-group textarea { width: 100%; padding: 10px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; font-family: inherit; }
.submit-button { padding: 12px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1.1rem; }
.submit-button:hover { background-color: #0056b3; }
.message { padding: 15px; border-radius: 4px; margin-bottom: 15px; font-size: 1.1rem; text-align: center; }
.success { background-color: #d4edda; color: #155724; border-color: #c3e6cb; }
.error { background-color: #f8d7da; color: #721c24; border-color: #f5c6cb; }
</style>