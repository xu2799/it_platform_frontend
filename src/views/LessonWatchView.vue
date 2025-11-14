<script setup>
import { ref, computed, onMounted, watch } from 'vue' // <-- 移除了 nextTick
import { useRouter, RouterLink } from 'vue-router'
import { useCourseStore } from '@/stores/courseStore'
import { useAuthStore } from '@/stores/authStore' 
import apiClient from '@/api'
import BackButton from '@/components/BackButton.vue'

// 激活
const router = useRouter()
const courseStore = useCourseStore()
const authStore = useAuthStore() 

// Props
const props = defineProps({
  courseId: { type: String, required: true },
  lessonId: { type: String, required: true }
})

// 状态
const videoPlayer = ref(null)
const videoError = ref(null)
const comments = ref([])
const newComment = ref('')

// --- 【【【已删除】】】 ---
// (所有点赞/收藏相关的 ref 已被移除)
// --- (修复结束) ---

const resolveMediaUrl = (url) => {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const baseUrl = apiClient.defaults.baseURL || ''
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`
  }
  return `${baseUrl}/${url}`
}

// OnMounted
onMounted(async () => {
  console.log('🌐 [调试] 课程ID:', props.courseId)
  console.log('🌐 [调试] 课时ID:', props.lessonId)
  try {
    await courseStore.fetchCourseDetail(props.courseId)
  } catch (error) {
    console.error('❌ [课程详情] 获取失败:', error)
  }
  fetchComments(props.lessonId) 
})

// 视频事件
const handleVideoError = (event) => {
  videoError.value = `视频加载失败: ${event.target.error?.message || '未知错误'}`
}
const handleVideoLoaded = () => {
  videoError.value = null
}
const handleVideoCanPlay = () => {
  console.log('✅ [视频就绪] 视频可以播放')
}

// --- 计算属性 (用于侧边栏和视频 URL) ---
const course = computed(() => {
  return courseStore.courses
    .filter(Boolean) 
    .find(c => c.id == props.courseId) || null
})

// --- 【【【已删除】】】 ---
// (isLiked, likeCount, isFavorited computed 属性已被移除)

const lesson = computed(() => {
  if (!course.value || !course.value.modules) return null
  for (const module of (course.value.modules || []).filter(Boolean)) {
    if (module.lessons) {
      const found = (module.lessons || [])
        .filter(Boolean) 
        .find(l => l.id == props.lessonId)
      if (found) return found
    }
  }
  return null
})

const videoUrl = computed(() => {
  if (!lesson.value) return null
  
  const m3u8Url = lesson.value.video_m3u8_url
  const isFakeM3u8Url = m3u8Url && (
    m3u8Url.includes('example.com') || 
    m3u8Url.includes('localhost') && m3u8Url.includes('hls')
  )
  
  if (lesson.value.video_mp4_file) {
    return resolveMediaUrl(lesson.value.video_mp4_file)
  }
  if (m3u8Url && !isFakeM3u8Url) {
    return resolveMediaUrl(m3u8Url)
  }
  return null
})

// --- 监听器 ---
watch(videoUrl, (newUrl) => {
  if (newUrl && videoPlayer.value) {
    videoPlayer.value.load() 
  }
})

watch(() => props.lessonId, async (newLessonId, oldLessonId) => {
    if (newLessonId && newLessonId !== oldLessonId) {
        fetchComments(newLessonId)
        await courseStore.fetchCourseDetail(props.courseId)
    }
})

// --- 辅助函数 ---
const getNextLesson = () => {
    if (!course.value || !course.value.modules) return null;
    let foundCurrent = false;
    for (const module of (course.value.modules || []).filter(Boolean)) {
        if (module.lessons) {
            for (const l of (module.lessons || []).filter(Boolean)) {
                if (foundCurrent) return l;
                if (l.id == props.lessonId) foundCurrent = true;
            }
        }
    }
    return null; 
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
        router.push({ name: 'courses' });
    }
}
const goToCourseHome = () => {
    router.push({ name: 'course-detail', params: { id: props.courseId } });
}


// --- 评论功能 (点赞和收藏已删除) ---
const fetchComments = async (lessonId) => {
  if (!lessonId) return;
  try {
    const response = await apiClient.get('/api/comments/', {
      params: { lesson_id: lessonId }
    });
    comments.value = response.data;
  } catch (error) {
    console.error('加载评论失败:', error);
  }
}

const handlePostComment = async () => {
  if (!newComment.value.trim()) return;
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login' });
    return;
  }
  try {
    const response = await apiClient.post('/api/comments/', {
      lesson: Number(props.lessonId),
      content: newComment.value
    });
    comments.value.unshift(response.data); 
    newComment.value = ''; 
  } catch (error) {
    console.error('发表评论失败:', error);
    alert('发表评论失败。');
  }
}

// --- 【【【已删除】】】 ---
// (handleLikeToggle 函数已被移除)
// (handleFavoriteToggle 函数已被移除)

</script>

<template>
  <div class="watch-layout">
    
    <main class="main-content">
      <div class="lesson-header">
        <BackButton 
          :fallback-route="{ name: 'course-detail', params: { id: props.courseId } }" 
          text="返回课程"
          small
          inline
        />
      </div>
      
      <div v-if="!course">
        <p>正在加载课程数据...</p>
      </div>
      
      <div v-else>
        <h2 v-if="lesson">{{ lesson.title }}</h2>
        <h2 v-else>正在加载课时...</h2>
        
        <div v-if="videoUrl" class="video-container">
          <video
            ref="videoPlayer"
            :src="videoUrl"
            controls
            autoplay
            playsinline
            class="video-player"
            @error="handleVideoError"
            @loadeddata="handleVideoLoaded"
            @canplay="handleVideoCanPlay"
          >
            你的浏览器不支持 Video 标签。
          </video>
          <div v-if="videoError" class="video-error">
            <p style="color: red; margin: 10px 0;">{{ videoError }}</p>
            <p style="color: #666; font-size: 0.9em;">视频URL: {{ videoUrl }}</p>
            <button @click="videoPlayer?.load()" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
              重试加载
            </button>
          </div>
        </div>
        
        <div v-else-if="lesson && lesson.lesson_type === 'text'">
           <div class="text-content" v-html="lesson.content"></div>
        </div>
        
        <div v-else-if="!lesson">
            </div>

        <div v-else>
            <p>无法加载此课时。</p>
        </div>

        <div class="video-actions">
          <button @click="goToNextLesson" class="action-btn next-lesson-btn">
            下一课 &raquo;
          </button>
        </div>

        <div class="comments-section">
          <h3>评论 ({{ comments.length }})</h3>
          
          <div class="comment-form" v-if="authStore.isAuthenticated">
            <textarea v-model="newComment" placeholder="发表你的看法..."></textarea>
            <button @click="handlePostComment" class="action-btn">发表评论</button>
          </div>
          <div v-else class="comment-login-prompt">
            <p><RouterLink :to="{ name: 'login' }">登录</RouterLink>后发表评论</p>
          </div>
          
          <ul class="comment-list">
            <li v-for="comment in comments" :key="comment.id" class="comment-item">
              <div class="comment-header">
                <strong>{{ comment.user?.username || '未知用户' }}</strong>
                <small>{{ comment.created_at ? new Date(comment.created_at).toLocaleString('zh-CN') : '' }}</small>
              </div>
              <p class="comment-content">{{ comment.content || '' }}</p>
            </li>
          </ul>
        </div>
        
      </div>
    </main>

    <nav class="sidebar-nav">
      <h3 @click="goToCourseHome" class="sidebar-title" title="返回课程详情">
        &laquo; 返回课程
      </h3>
      
      <div v-if="!course || !course.modules">加载中...</div>
      
      <div 
        v-else 
        v-for="module in (course.modules || []).filter(Boolean)" 
        :key="module.id" 
        class="module-group"
      >
        <h4>{{ module.title }}</h4>
        <ul>
          <li 
            v-for="l in (module.lessons || []).filter(Boolean)" 
            :key="l.id"
            :class="{ 'active-lesson': l.id == props.lessonId }"
            @click="router.push({ 
              name: 'lesson-watch', 
              params: { courseId: props.courseId, lessonId: l.id } 
            })"
          >
            {{ l.title }}
          </li>
        </ul>
      </div>
    </nav>
    
  </div>
</template>

<style scoped>
/* (样式未更改) */
.watch-layout {
  display: flex;
  height: calc(100vh - 60px); 
  width: 100%;
  max-width: 100%; 
}
.sidebar-nav {
  width: 350px;
  flex-shrink: 0;
  background-color: #f8f9fa;
  border-left: 1px solid #e0e0e0;
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
.sidebar-title:hover { color: #0056b3; }
.module-group { margin-bottom: 15px; }
.module-group h4 { font-size: 1.1rem; margin-bottom: 8px; }
.sidebar-nav ul { list-style: none; padding-left: 10px; margin: 0; }
.sidebar-nav li {
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.95rem;
}
.sidebar-nav li:hover { background-color: #e9ecef; }
.sidebar-nav li.active-lesson {
  background-color: #007bff;
  color: white;
  font-weight: bold;
}
.main-content {
  flex-grow: 1;
  padding: 30px;
  overflow-y: auto;
  background-color: #ffffff;
}
.lesson-header {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
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
  max-height: 70vh; 
}
.text-content {
  font-size: 1.1rem;
  line-height: 1.7;
  max-width: 900px;
}
.video-actions {
  display: flex;
  gap: 15px;
  margin: 20px auto 0 auto;
  max-width: 900px;
}
.action-btn {
  padding: 12px 25px;
  font-size: 1.1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}
.action-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.action-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
.action-btn:not(:disabled):active {
  transform: translateY(0);
}
.next-lesson-btn {
    background-color: #28a745;
    color: white;
    margin-left: auto; /* <-- 让"下一课"按钮保持在最右边 */
}
.next-lesson-btn:hover { background-color: #218838; }

/* --- 【【【已删除】】】 --- */
/* (所有 .like-btn, .favorite-btn, 和 @keyframes 动画样式均已移除) */

.comments-section {
  max-width: 900px;
  margin: 40px auto 0 auto;
  border-top: 1px solid #eee;
  padding-top: 20px;
}
.comments-section h3 {
  font-size: 1.5rem;
  margin-bottom: 20px;
}
.comment-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
.comment-form textarea {
  width: 100%;
  height: 80px;
  padding: 10px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box; 
}
.comment-form button {
  align-self: flex-end; 
  background-color: #007bff;
  color: white;
}
.comment-login-prompt {
  padding: 20px;
  text-align: center;
  background-color: #f8f8f8;
  border-radius: 5px;
}
.comment-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.comment-item {
  border-bottom: 1px solid #eee;
  padding: 15px 0;
}
.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}
.comment-header strong {
  font-size: 1rem;
  color: #333;
}
.comment-header small {
  font-size: 0.85rem;
  color: #777;
}
.comment-content {
  font-size: 1rem;
  color: #555;
  margin: 0;
  white-space: pre-wrap; 
}
</style>