<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
// 【【【修改】】】: 导入 apiClient
import apiClient from '@/api'
import BackButton from '@/components/BackButton.vue'

// (API_URL 已移至 apiClient)
const authStore = useAuthStore()

const bio = ref(authStore.user?.bio || '')
const successMessage = ref('')
const errorMessage = ref('')

const handleProfileUpdate = async () => {
    successMessage.value = ''
    errorMessage.value = ''
    try {
        // 【【【修改】】】: 使用 apiClient
        const response = await apiClient.patch('/api/users/me/', {
            bio: bio.value
        })
        
        authStore.user.bio = response.data.bio
        // 【【【新增】】】: 同时更新 localStorage
        localStorage.setItem('user', JSON.stringify(authStore.user))
        
        successMessage.value = '个人资料更新成功！'

    } catch (error) {
        console.error('更新失败:', error.response?.data || error.message)
        errorMessage.value = '更新失败，请稍后再试。'
    }
}
</script>

<template>
  <div class="profile-page">
    <BackButton 
      :fallback-route="{ name: 'courses' }" 
      text="返回"
      small
    />
    <h1>个人资料</h1>
    <h2>欢迎, {{ authStore.user?.username }}</h2>

    <p v-if="successMessage" class="message success">{{ successMessage }}</p>
    <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>

    <form @submit.prevent="handleProfileUpdate" class="profile-form">
        <div class="form-group">
            <label for="bio">个人简介:</label>
            <textarea id="bio" v-model="bio" rows="5"></textarea>
        </div>
        
        <button type="submit" class="submit-button">保存</button>
    </form>
    
  </div>
</template>

<style scoped>
/* 样式部分 (完全不变) */
.profile-page { 
  max-width: 600px; 
  margin: 20px auto; 
  padding: 20px; 
}
.profile-page h1 {
  margin-top: 0;
}
.profile-form { display: flex; flex-direction: column; gap: 15px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
.form-group textarea { width: 100%; padding: 10px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; font-family: inherit; }
.submit-button { padding: 12px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
.message { padding: 10px; border-radius: 4px; margin-bottom: 15px; }
.success { background-color: #d4edda; color: #155724; }
.error { background-color: #f8d7da; color: #721c24; }
</style>