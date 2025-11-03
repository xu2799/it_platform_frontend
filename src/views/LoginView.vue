<script setup>
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router' 
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router = useRouter() 

const username = ref('')
const password = ref('')
const errorMessage = ref('') 

const handleSubmit = async () => {
  errorMessage.value = '' 
  const loginSuccess = await authStore.login(username.value, password.value)
  if (loginSuccess) {
    router.push({ name: 'courses' }) 
  } else {
    errorMessage.value = '用户名或密码错误。'
  }
}
</script>

<template>
  <div class="auth-view-container"> 
    
    <div class="auth-card login-panel">
      
      <div class="auth-promo-panel">
        <div class="panel-content">
            <h2 class="panel-heading large-brand">IT 技能在线培训平台</h2> 
            <p class="panel-subheading">即刻开始，在线点亮你的技术树...</p>
        </div>
      </div>

      <div class="auth-form-area">
        <form @submit.prevent="handleSubmit" class="auth-form">
            <h2 class="title">登录</h2>
            
            <div class="form-group">
              <label for="username">用户名:</label>
              <input type="text" id="username" v-model="username" required>
            </div>

            <div class="form-group">
              <label for="password">密码:</label>
              <input type="password" id="password" v-model="password" required>
            </div>

            <p v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </p>

            <button type="submit" class="submit-button primary">登录</button>
        </form>
        
        <div class="auth-footer-links">
            <RouterLink :to="{ name: 'courses' }">跳过 &raquo;</RouterLink> 
            还没有账号？<RouterLink :to="{ name: 'register' }">立即注册</RouterLink>
        </div>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
/* 容器和卡片样式 */
.auth-view-container {
    display: flex;
    justify-content: center;
    /* 保持卡片“中上”对齐 */
    align-items: flex-start; 
    width: 100%;
    min-height: calc(100vh - 60px); 
    /* 保持顶部 60px padding */
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

/* --- 左侧: 推广面板 (统一尺寸) --- */
.auth-promo-panel {
    width: 45%;
    padding: 40px;
    color: white;
    display: flex;
    flex-direction: column;
    /* 🎯 关键修复 1：恢复垂直居中 */
    justify-content: center; 
    /* 🎯 关键修复 1：移除顶部 padding */
    padding-top: 40px; /* 恢复默认的 40px */
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
    /* 🎯 关键修复 2：增加底部外边距，增加间距 */
    margin-bottom: 50px; 
    line-height: 1.3;
}

/* --- 右侧: 表单区域 (统一尺寸) --- */
.auth-form-area {
    width: 55%;
    padding: 20px;
    display: flex;
    flex-direction: column;
    /* 🎯 关键修复 3：恢复垂直居中 */
    justify-content: center; 
    /* 🎯 关键修复 3：移除顶部 padding */
    padding-top: 20px; /* 恢复默认的 20px */
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
.auth-footer-links a:first-child { 
    margin-right: 15px; 
}
.auth-footer-links a { color: #007bff; text-decoration: none; font-weight: bold; }

/* 移动端适配 */
@media (max-width: 768px) {
    .auth-card { flex-direction: column; max-width: 100%; height: auto; min-height: calc(100vh - 60px); border-radius: 0; }
    .auth-promo-panel, .auth-form-area { width: 100%; padding: 30px 20px; min-height: auto; }
    .auth-promo-panel { order: 2; }
    .auth-form-area { order: 1; }
}
</style>