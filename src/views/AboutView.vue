<script setup>
import BackButton from '@/components/BackButton.vue'
</script>

<template>
  <div class="about">
    <BackButton 
      :fallback-route="{ name: 'courses' }" 
      text="返回课程列表"
      small
    />
    <h1>关于我们</h1>
    <p>这是IT技能在线培训平台，致力于提供优质的在线教育服务。</p>
  </div>
</template>

<style scoped>
.about {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
}

.about h1 {
  margin-top: 0;
  font-size: 2.2rem;
  color: #333;
}

.about p {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #555;
  margin-top: 20px;
}

@media (min-width: 1024px) {
  .about {
    padding: 40px;
  }
}
</style>
