<script setup>
// 1. 导入 Carousel 组件及其样式
import 'vue3-carousel/dist/carousel.css'
import { Carousel, Slide, Pagination, Navigation } from 'vue3-carousel'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()

// 2. 定义轮播图数据
const slides = ref([
  {
    id: 1,
    heading: 'IT 技能在线培训平台',
    subheading: '即刻开始，在线点亮你的技术树...',
    ctaText: '探索所有课程',
    ctaAction: () => router.push({ name: 'login' }), // 未登录跳转到登录页
    background: 'linear-gradient(135deg, #3498db 0%, #0056b3 100%)',
  },
  {
    id: 2,
    heading: '告别理论，实战为王',
    subheading: '深入项目实战，掌握企业所需的核心技能。',
    ctaText: '查看实战项目',
    ctaAction: () => router.push({ name: 'login' }), // 占位函数，同样跳到登录页
    background: 'linear-gradient(135deg, #2ecc71 0%, #1e7e34 100%)',
  },
  {
    id: 3,
    heading: '全球专家，为你授课',
    subheading: '跟随行业顶尖讲师，站在技术前沿。',
    ctaText: '了解讲师团队',
    ctaAction: () => router.push({ name: 'login' }), // 占位函数，同样跳到登录页
    background: 'linear-gradient(135deg, #f0ad4e 0%, #c0802b 100%)',
  },
])
</script>

<template>
  <div class="home-view-wrapper">
    
    <Carousel :autoplay="3000" :wrap-around="true" class="hero-carousel">
      
      <Slide v-for="slide in slides" :key="slide.id">
        <section class="hero-section" :style="{ background: slide.background }">
          <div class="hero-content">
            <h1>{{ slide.heading }}</h1>
            <p>{{ slide.subheading }}</p>
            
            <button 
                @click="slide.ctaAction"
                class="hero-button" 
            >
                {{ slide.ctaText }}
            </button>
          </div>
        </section>
      </Slide>

      <template #addons>
        <Navigation />
        <Pagination />
      </template>
    </Carousel>


    <section class="promotional-content">
      <h2>为什么选择我们？</h2>
      <div class="features-grid">
        <div class="feature-card">
          <h3>行业专家</h3>
          <p>由资深 IT 专家设计和教授的课程。</p>
        </div>
        <div class="feature-card">
          <h3>实践驱动</h3>
          <p>大量的实战项目和案例研究。</p>
        </div>
        <div class="feature-card">
          <h3>灵活学习</h3>
          <p>随时随地，按自己的节奏学习。</p>
        </div>
      </div>
    </section>
    
  </div>
</template>

<style scoped>
/* 容器样式 */
.home-view-wrapper {
  padding: 0; 
  width: 100%;
  min-height: 100vh;
}

/* --- 轮播图和封面容器样式 --- */
.hero-carousel {
    /* 确保轮播图占据整个宽度 */
    width: 100%;
}
.hero-section {
  width: 100%; /* 确保每个 slide 占满宽度 */
  color: white;
  text-align: center;
  padding: 80px 20px; 
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  position: relative; 
  /* 🎯 关键：设置高度，确保内容可见 */
  min-height: 400px; 
  display: flex;
  justify-content: center;
  align-items: center;
}
.hero-content {
    position: relative; 
    z-index: 20; 
}
.hero-content h1 {
  font-size: 4rem; 
  margin-bottom: 15px;
  font-weight: 900;
}
.hero-content p {
  font-size: 1.6rem;
  margin-bottom: 40px;
  font-weight: 300;
}
.hero-button {
  background-color: #2ecc71; 
  color: white;
  border: none;
  padding: 15px 40px; 
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  z-index: 30; 
}
.hero-button:hover { background-color: #27ae60; }


/* --- 宣传内容样式 --- */
.promotional-content {
  padding: 40px 20px;
  text-align: center;
}
.promotional-content h2 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 40px;
}
.features-grid {
  display: flex;
  justify-content: space-around;
  gap: 20px;
  max-width: 900px;
  margin: 0 auto;
}
.feature-card {
  flex: 1;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}
.feature-card h3 {
  color: #3498db;
  margin-bottom: 10px;
}

/* 可选：自定义 vue3-carousel 的样式，例如箭头颜色 */
.carousel__prev,
.carousel__next {
  color: white; 
}
</style>