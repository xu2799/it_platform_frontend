<script setup>
import { ref, computed, onMounted, watch } from 'vue'
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

// --- (Bug 2 修复: 点赞/收藏状态) ---
// 我们使用本地 ref 作为 UI 的“事实来源”，以解决命名冲突
const isLiked = ref(false)
const likeCount = ref(0)
const isFavorited = ref(false)

// API 加载锁
const isLiking = ref(false) 
const isFavoritingLoading = ref(false) 

// 动画状态
const likeAnimation = ref(false)
const favoriteAnimation = ref(false)
const countAnimation = ref(false)
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
    const courseData = await courseStore.fetchCourseDetail(props.courseId)
    
    // --- (Bug 2 修复: 填充本地 ref) ---
    if (courseData) {
      isLiked.value = courseData.is_liked
      likeCount.value = courseData.like_count
      isFavorited.value = courseData.is_favorited
    }
    // --- (修复结束) ---

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
  return courseStore.courses.find(c => c.id == props.courseId) || null
})

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

// (冲突的 isLiked 和 likeCount 的 computed 已被【删除】)

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
        // 切换课时后，也必须重新填充本地 ref
        const courseData = await courseStore.fetchCourseDetail(props.courseId)
        if (courseData) {
          isLiked.value = courseData.is_liked
          likeCount.value = courseData.like_count
          isFavorited.value = courseData.is_favorited
        }
    }
})

// --- 辅助函数 (不变) ---
const getNextLesson = () => {
    if (!course.value || !course.value.modules) return null;
    let foundCurrent = false;
    for (const module of course.value.modules) {
        if (module.lessons) {
            for (const l of module.lessons) {
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


// --- 点赞和评论功能 ---
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

// --- (Bug 3 修复: 评论) ---
const handlePostComment = async () => {
  if (!newComment.value.trim()) return;
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login' });
    return;
  }
  try {
    const response = await apiClient.post('/api/comments/', {
      // 修复：将 lessonId 从字符串转换为数字
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

// --- (Bug 2 修复: 点赞) ---
const handleLikeToggle = async () => {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login' });
    return;
  }
  if (isLiking.value) return; 
  
  isLiking.value = true
  likeAnimation.value = true
  countAnimation.value = true 
  
  try {
    const response = await apiClient.post(`/api/courses/${props.courseId}/toggle-like/`);
    
    // (A) 更新 Pinia store（为了让其他页面保持同步）
    courseStore.updateCourseLikeStatus(
      props.courseId, 
      response.data.liked, 
      response.data.count
    )
    
    // (B) ！！！直接更新本地 ref，强制 UI 刷新！！！
    isLiked.value = response.data.liked
    likeCount.value = response.data.count
    
  } catch (error) {
    console.error('👍 [点赞] 失败:', error.response?.data || error.message);
    alert('操作失败，请稍后再试。');
  } finally {
    isLiking.value = false
    setTimeout(() => {
      likeAnimation.value = false
      countAnimation.value = false
    }, 600)
  }
}

// --- (Bug 2 修复: 收藏) ---
const handleFavoriteToggle = async () => {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login' });
    return;
  }
  if (isFavoritingLoading.value) return; 
  
  isFavoritingLoading.value = true
  favoriteAnimation.value = true
  
  try {
    // (A) 更新 Auth store
    const newFavoriteStatus = await authStore.toggleFavorite(props.courseId);

    // (B) ！！！直接更新本地 ref，强制 UI 刷新！！！
    isFavorited.value = newFavoriteStatus

  } catch (error) {
    console.error('收藏失败:', error);
    alert('操作失败，请稍后再试。');
  } finally {
    isFavoritingLoading.value = false
    setTimeout(() => {
      favoriteAnimation.value = false
    }, 600)
  }
}
// --- (修复结束) ---

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
      
      <div v-else-if="!course.modules || !lesson">
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
        
        <div v-else-if="lesson.lesson_type === 'text'">
           <div class="text-content" v-html="lesson.content"></div>
        </div>
        
        <div v-else>
            <p>无法加载此课时。</p>
        </div>

        <div class="video-actions">
          <button 
            @click="handleLikeToggle" 
            :class="['action-btn', 'like-btn', { 
              liked: isLiked, 
              animating: likeAnimation,
              loading: isLiking
            }]"
            :disabled="isLiking"
          >
            <span class="like-icon" :class="{ 'bounce': likeAnimation }">
              {{ isLiked ? '❤️' : '♡' }}
            </span>
            <span class="like-text">{{ isLiked ? '已点赞' : '点赞' }}</span>
            <span class="like-count" :class="{ 'count-bounce': countAnimation }">
              ({{ likeCount }})
            </span>
          </button>
          
          <button 
            @click="handleFavoriteToggle" 
            :class="['action-btn', 'favorite-btn', { 
              favorited: isFavorited,
              animating: favoriteAnimation,
              loading: isFavoritingLoading
            }]"
            :disabled="isFavoritingLoading"
          >
            <span class="favorite-icon" :class="{ 'spin': favoriteAnimation }">
              {{ isFavorited ? '⭐' : '☆' }}
            </span>
            <span class="favorite-text">{{ isFavorited ? '已收藏' : '收藏' }}</span>
          </button>

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
    
  </div>
</template>

<style scoped>
/* 样式部分 (完全不变) */
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
    margin-left: auto;
}
.next-lesson-btn:hover { background-color: #218838; }
.like-btn {
  background-color: #f0f0f0;
  color: #333;
  transition: all 0.3s ease;
}
.like-btn.liked {
  background-color: #ff1744;
  color: white;
  box-shadow: 0 2px 8px rgba(255, 23, 68, 0.3);
}
.like-btn.animating {
  animation: like-pulse 0.6s ease;
}
.like-icon {
  display: inline-block;
  font-size: 1.2em;
  transition: transform 0.3s ease;
}
.like-icon.bounce {
  animation: like-bounce 0.6s ease;
}
.like-text {
  font-weight: 500;
}
.like-count {
  font-weight: bold;
  transition: transform 0.3s ease;
}
.like-count.count-bounce {
  animation: count-bounce 0.6s ease;
}
.favorite-btn {
  background-color: #f0f0f0;
  color: #333;
  transition: all 0.3s ease;
}
.favorite-btn.favorited {
  background-color: #ffa726;
  color: white;
  box-shadow: 0 2px 8px rgba(255, 167, 38, 0.3);
}
.favorite-btn.animating {
  animation: favorite-pulse 0.6s ease;
}
.favorite-icon {
  display: inline-block;
  font-size: 1.2em;
  transition: transform 0.3s ease;
}
.favorite-icon.spin {
  animation: favorite-spin 0.6s ease;
}
.favorite-text {
  font-weight: 500;
}
@keyframes like-bounce {
  0%, 100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.3) rotate(-5deg);
  }
  50% {
    transform: scale(1.2) rotate(5deg);
  }
  75% {
    transform: scale(1.1);
  }
}
@keyframes like-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
@keyframes count-bounce {
  0%, 100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.3) translateY(-5px);
  }
  50% {
    transform: scale(1.2) translateY(0);
  }
  75% {
    transform: scale(1.1);
  }
}
@keyframes favorite-spin {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.3);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}
@keyframes favorite-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
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