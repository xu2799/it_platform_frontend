<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import axios from 'axios'
import BackButton from '@/components/BackButton.vue'

const API_URL = import.meta.env.VITE_API_URL
const authStore = useAuthStore()

// 预填充 bio
const bio = ref(authStore.user?.bio || '')
const successMessage = ref('')
const errorMessage = ref('')

const handleProfileUpdate = async () => {
    successMessage.value = ''
    errorMessage.value = ''
    try {
        const response = await axios.patch(`${API_URL}/api/users/me/`, {
            bio: bio.value
        })
        
        // 更新 Pinia 仓库
        authStore.user.bio = response.data.bio
        successMessage.value = '个人资料更新成功！'

    } catch (error) {
        console.error('更新失败:', error)
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