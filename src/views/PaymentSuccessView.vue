<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  // 真实项目中, 这里会调用后端 API 验证 session_id, 
  // 并在数据库中创建 Enrollment 记录。
});
</script>

<template>
  <div class="payment-result success">
    <h1>支付成功！🎉</h1>
    <p>感谢您购买本课程。您的学习之旅即将开始。</p>
    <p class="small-text">（注意：订单创建将在后端 Webhook 验证后完成）</p>
    <button @click="router.push('/')" class="btn">返回主页</button>
  </div>
</template>

<style scoped>
.payment-result { max-width: 600px; margin: 50px auto; padding: 40px; text-align: center; border-radius: 8px; }
.success { background-color: #e6ffe6; border: 1px solid #5cb85c; }
h1 { color: #5cb85c; }
.small-text { margin-top: 20px; font-style: italic; color: #555; }
.btn { padding: 10px 20px; margin-top: 20px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
</style>