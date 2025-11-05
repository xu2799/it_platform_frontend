<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter, RouterLink } from 'vue-router'

// 【建议 4】: 从 .env 文件读取 API 基础 URL
const API_URL = import.meta.env.VITE_API_URL

const router = useRouter()
const username = ref('')
const password = ref('')
const registerError = ref('')

const handleRegister = async () => {
    registerError.value = ''
    
    if (!username.value || !password.value) {
        registerError.value = '用户名和密码不能为空！'
        return
    }

    const userData = {
        username: username.value,
        password: password.value,
        role: 'student' 
    }

    try {
        // 【建议 4】: 替换硬编码 URL
        const response = await axios.post(`${API_URL}/api/register/`, userData)
        
        if (response.status === 201) {
            alert('注册成功！请使用你的新账号登录。')
            router.push('/login')
        }
        
    } catch (error) {
        console.error('注册失败:', error)
        registerError.value = error.response?.data?.detail || '注册失败，请检查网络连接或更换用户名。'
    }
}
</script>

<template>
  <div class="auth-view-container">
    <div class="auth-card register-panel">
      
      <div class="auth-promo-panel">
        <div class="panel-content">
            <h2 class="panel-heading large-brand">IT 技能在线培训平台</h2>
            <p class="panel-subheading">即刻开始，在线点亮你的技术树...</p>
        </div>
      </div>

      <div class="auth-form-area">
        <form @submit.prevent="handleRegister" class="auth-form">
            <h2 class="title">注册新账号</h2>
            
            <div class="form-group">
                <label for="reg-username">用户名:</label>
                <input 
                    type="text" 
                    id="reg-username" 
                    v-model="username" 
                    placeholder="输入用户名"
                    required
                >
            </div>
            
            <div class="form-group">
                <label for="reg-password">密码:</label>
                <input 
                    type="password" 
                    id="reg-password" 
                    v-model="password" 
                    placeholder="设置密码"
                    required
                >
            </div>
            
            <p v-if="registerError" class="error-message">{{ registerError }}</p>
            
            <button type="submit" class="submit-button primary">完成注册</button>
            
        </form>
        
        <div class="auth-footer-links">
            已有账号？<RouterLink :to="{ name: 'login' }">立即登录</RouterLink>
        </div>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
/* (Style 保持不变) */
.auth-view-container {
    display: flex;
    justify-content: center;
    align-items: flex-start; 
    width: 100%;
    min-height: calc(100vh - 60px); 
    padding: 60px 20px 40px 20px; 
    box-sizing: border-box;
    background-image: none; 
}
.auth-card {
    display: flex;
    width: 100%;
    max-width: 900px; 
    background-color: #ffffff;
    border-radius: 10px;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
    overflow: hidden; 
    position: relative;
}
.auth-promo-panel {
    width: 45%;
    padding: 40px;
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center; 
    padding-top: 40px; 
    text-align: center;
    position: relative;
    background: linear-gradient(135deg, #007bff, #0056b3);
    min-height: 500px; 
}
.panel-heading { font-size: 2rem; margin-bottom: 10px; }
.panel-subheading { 
    font-size: 1.1rem;
    margin-bottom: 30px; 
    line-height: 1.5;
}
.large-brand { 
    font-size: 2.2rem; 
    font-weight: 900; 
    margin-bottom: 50px; 
    line-height: 1.3;
}
.auth-form-area {
    width: 55%;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center; 
    padding-top: 20px;
    align-items: center;
    min-height: 500px; 
}
.auth-form { padding: 20px; width: 100%; }
.title { font-size: 2rem; color: #333; margin-bottom: 30px; text-align: center; font-weight: 700; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-weight: bold; color: #555; }
.form-group input { width: 100%; padding: 12px; box-sizing: border-box; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem; }
.submit-button { 
    width: 100%; 
    padding: 12px; 
    border: none; 
    border-radius: 5px; 
    cursor: pointer; 
    font-size: 1.1rem; 
    font-weight: bold; 
    margin-top: 20px;
    background-color: #007bff;
    color: white;
}
.submit-button:hover { background-color: #0056b3; }
.error-message { color: #dc3545; font-size: 0.9rem; text-align: center; margin-top: 10px; }
.auth-footer-links { margin-top: 20px; font-size: 0.9rem; }
.auth-footer-links a { color: #007bff; text-decoration: none; font-weight: bold; }
@media (max-width: 768px) {
    .auth-card { flex-direction: column; max-width: 100%; height: auto; min-height: calc(100vh - 60px); border-radius: 0; }
    .auth-promo-panel, .auth-form-area { width: 100%; padding: 30px 20px; min-height: auto; }
    .auth-promo-panel { order: 2; }
    .auth-form-area { order: 1; }
}
</style>