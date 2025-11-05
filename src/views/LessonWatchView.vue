<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/courseStore'

// 激活
const router = useRouter()
const courseStore = useCourseStore()

// 接收来自路由的 props
const props = defineProps({
  courseId: { type: String, required: true },
  lessonId: { type: String, required: true }
})

// 状态
const videoPlayer = ref(null) // 用于 <video> 元素的引用

// 页面加载时, 确保我们有这门课程的“完整”数据 (包括 modules)
onMounted(() => {
  courseStore.fetchCourseDetail(props.courseId)
})

// --- 计算属性 ---

// 1. 查找当前课程
const course = computed(() => {
  return courseStore.courses.find(c => c.id == props.courseId)
})

// 2. 查找当前课时
const lesson = computed(() => {
  if (!course.value || !course.value.modules) return null
  
  for (const module of course.value.modules) {
    if (module.lessons) {
      const found = module.lessons.find(l => l.id == props.lessonId)
      if (found) return found
    }
  }
  return null
})

// 3. 获取视频 URL (优先使用 HLS, 其次 MP4)
// (在真实的生产环境中, 你应该使用 HLS.js 库来播放 m3u8)
const videoUrl = computed(() => {
  if (!lesson.value) return null
  if (lesson.value.video_m3u8_url) {
    return lesson.value.video_m3u8_url
  }
  if (lesson.value.video_mp4_file) {
    return lesson.value.video_mp4_file
  }
  return null
})

// --- 监听器 ---

// 4. 当 videoUrl 变化时 (即用户切换了课时)
//    我们必须手动加载新视频源, 否则 <video> 标签不会更新
watch(videoUrl, (newUrl) => {
  if (newUrl && videoPlayer.value) {
    videoPlayer.value.load() // 告诉 <video> 元素重新加载
  }
})

// --- 辅助函数 (用于“下一课”) ---
const getNextLesson = () => {
    if (!course.value || !course.value.modules) return null;

    let foundCurrent = false;
    for (const module of course.value.modules) {
        if (module.lessons) {
            for (const l of module.lessons) {
                if (foundCurrent) {
                    // 这是紧随“当前”之后的下一课
                    return l;
                }
                if (l.id == props.lessonId) {
                    foundCurrent = true;
                }
            }
        }
    }
    return null; // 已经是最后一课
}

const goToNextLesson = () => {
    const nextLesson = getNextLesson();
    if (nextLesson) {
        router.push({
            name: 'lesson-watch',
            params: { courseId: props.courseId, lessonId: nextLesson.id }
        });
    } else {
        alert('恭喜你，已学完所有课程！');
        router.push({ name: 'course-detail', params: { id: props.courseId } });
    }
}

// 导航回课程详情页
const goToCourseHome = () => {
    router.push({ name: 'course-detail', params: { id: props.courseId } });
}

</script>

<template>
  <div class="watch-layout">
    
    <nav class="sidebar-nav">
      <h3 @click="goToCourseHome" class="sidebar-title">
        &laquo; 返回课程
      </h3>
      <div v-if="!course">加载中...</div>
      <div v-else v-for="module in course.modules" :key="module.id" class="module-group">
        <h4>{{ module.title }}</h4>
        <ul>
          <li 
            v-for="l in module.lessons" 
            :key="l.id"
            :class="{ 'active-lesson': l.id == props.lessonId }"
            @click="router.push({ name: 'lesson-watch', params: { courseId: courseId, lessonId: l.id } })"
          >
            {{ l.title }}
          </li>
        </ul>
      </div>
    </nav>
    
    <main class="main-content">
      <div v-if="!lesson">
        <p>正在加载课时...</p>
      </div>
      
      <div v-else>
        <h2>{{ lesson.title }}</h2>
        
        <div v-if="videoUrl" class="video-container">
          <video
            ref="videoPlayer"
            :src="videoUrl"
            controls
            autoplay
            playsinline
            class="video-player"
          >
            你的浏览器不支持 Video 标签。
            (提示: m3u8 格式在生产环境中需要 HLS.js 库来播放)
          </video>
          
          <button @click="goToNextLesson" class="next-lesson-btn">
            学习完毕，下一课 &raquo;
          </button>
        </div>
        
        <div v-else-if="lesson.lesson_type === 'text'">
           <div class="text-content" v-html="lesson.content"></div>
           <button @click="goToNextLesson" class="next-lesson-btn">
            阅读完毕，下一课 &raquo;
          </button>
        </div>
        
        <div v-else-if="lesson.lesson_type === 'text' && lesson.video_mp4_file">
           <p>视频正在处理中，请稍后再试...</p>
        </div>

        <div v-else>
            <p>无法加载此课时。</p>
        </div>
        
      </div>
    </main>
    
  </div>
</template>

<style scoped>
.watch-layout {
  display: flex;
  /* 假设你的 Header 高度为 60px */
  height: calc(100vh - 60px); 
  width: 100%;
  max-width: 100%; /* 覆盖 app-main 的 max-width */
}

/* --- 1. 侧边栏 --- */
.sidebar-nav {
  width: 300px;
  flex-shrink: 0;
  background-color: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  padding: 20px;
  overflow-y: auto;
}
.sidebar-title {
  font-size: 1.2rem;
  margin-top: 0;
  margin-bottom: 15px;
  border-bottom: 2px solid #007bff;
  padding-bottom: 5px;
  cursor: pointer;
}
.sidebar-title:hover {
    color: #0056b3;
}

.module-group {
  margin-bottom: 15px;
}
.module-group h4 {
  font-size: 1.1rem;
  margin-bottom: 8px;
}
.sidebar-nav ul {
  list-style: none;
  padding-left: 10px;
  margin: 0;
}
.sidebar-nav li {
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.95rem;
}
.sidebar-nav li:hover {
  background-color: #e9ecef;
}
.sidebar-nav li.active-lesson {
  background-color: #007bff;
  color: white;
  font-weight: bold;
}

/* --- 2. 主内容区 --- */
.main-content {
  flex-grow: 1;
  padding: 30px;
  overflow-y: auto;
  background-color: #ffffff;
}
.main-content h2 {
  margin-top: 0;
  font-size: 2rem;
  margin-bottom: 20px;
}

.video-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}
.video-player {
  width: 100%;
  border-radius: 8px;
  background-color: #000;
  /* 确保视频有最大高度, 避免撑满屏幕 */
  max-height: 70vh; 
}

.text-content {
  font-size: 1.1rem;
  line-height: 1.7;
  max-width: 900px;
}

.next-lesson-btn {
    display: block;
    margin: 20px auto 0 auto;
    padding: 12px 25px;
    font-size: 1.1rem;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.2s;
}
.next-lesson-btn:hover {
    background-color: #218838;
}
</style>