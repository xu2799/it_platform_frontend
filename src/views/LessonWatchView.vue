<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useCourseStore } from '@/stores/courseStore'
import { useAuthStore } from '@/stores/authStore' 
import axios from 'axios'
import BackButton from '@/components/BackButton.vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const resolveMediaUrl = (url) => {
  if (!url) {
    console.log('⚠️ [URL解析] url 为空')
    return null
  }
  
  let resolvedUrl = null
  if (url.startsWith('http://') || url.startsWith('https://')) {
    resolvedUrl = url
    console.log('✅ [URL解析] 完整URL:', resolvedUrl)
  } else if (url.startsWith('/')) {
    resolvedUrl = `${API_URL}${url}`
    console.log('✅ [URL解析] 相对路径(/) -> 完整URL:', resolvedUrl)
  } else {
    resolvedUrl = `${API_URL}/${url}`
    console.log('✅ [URL解析] 相对路径 -> 完整URL:', resolvedUrl)
  }
  
  return resolvedUrl
}

// 激活
const router = useRouter()
const courseStore = useCourseStore()
const authStore = useAuthStore() 

// 接收来自路由的 props
const props = defineProps({
  courseId: { type: String, required: true },
  lessonId: { type: String, required: true }
})

// 状态
const currentCourse = ref(null)
const videoPlayer = ref(null)
const videoError = ref(null)

// 点赞和评论的状态
const isLiked = ref(false)
const likeCount = ref(0)
const comments = ref([])
const newComment = ref('')

// 动画状态
const isLiking = ref(false)
const isFavoriting = ref(false)
const likeAnimation = ref(false)
const favoriteAnimation = ref(false)
const countAnimation = ref(false)

// 标记是否已初始化（防止 watch 监听器覆盖手动更新）
const isInitialized = ref(false)

// 【【【新增】】】: 收藏状态 (来自 authStore)
const isFavorited = computed(() => authStore.isCourseFavorited(props.courseId))

// 页面加载时, 确保我们有这门课程的"完整"数据
onMounted(async () => {
  console.log('🌐 [调试] API_URL:', API_URL)
  console.log('🌐 [调试] 课程ID:', props.courseId)
  console.log('🌐 [调试] 课时ID:', props.lessonId)
  try {
    const detail = await courseStore.fetchCourseDetail(props.courseId)
    if (detail) {
      currentCourse.value = detail
    }
  } catch (error) {
    console.error('❌ [课程详情] 获取失败:', error)
  }

  fetchComments(props.lessonId) 
})

// 监听 Pinia 仓库中的课程数据，保持 currentCourse 同步
watch(
  () => courseStore.courses.find(c => c.id == props.courseId),
  (storeCourse) => {
    if (storeCourse) {
      // 如果已经初始化，保留当前的点赞状态
      if (isInitialized.value && currentCourse.value) {
        const savedLiked = isLiked.value
        const savedCount = likeCount.value
        currentCourse.value = storeCourse
        // 恢复点赞状态（不依赖 store 中的数据）
        currentCourse.value.is_liked = savedLiked
        currentCourse.value.like_count = savedCount
      } else {
        // 未初始化时，直接更新
        currentCourse.value = storeCourse
      }
    }
  },
  { immediate: true }
)

// 视频错误处理
const handleVideoError = (event) => {
  const video = event.target
  videoError.value = `视频加载失败: ${video.error?.message || '未知错误'}`
  console.error('❌ [视频错误]', {
    error: video.error,
    errorCode: video.error?.code,
    errorMessage: video.error?.message,
    networkState: video.networkState,
    readyState: video.readyState,
    src: video.src,
    currentSrc: video.currentSrc
  })
}

// 视频加载成功
const handleVideoLoaded = () => {
  videoError.value = null
  console.log('✅ [视频加载] 视频加载成功')
}

// 视频可以播放
const handleVideoCanPlay = () => {
  console.log('✅ [视频就绪] 视频可以播放')
}

// --- 计算属性 ---

// 1. 查找当前课程
const course = computed(() => {
  if (currentCourse.value) {
    return currentCourse.value
  }
  return courseStore.courses.find(c => c.id == props.courseId) || null
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

// 3. 获取视频 URL (不变)
const videoUrl = computed(() => {
  if (!lesson.value) {
    console.log('❌ [视频URL调试] lesson.value 为空')
    return null
  }
  
  console.log('📹 [视频URL调试] 课时数据:', {
    id: lesson.value.id,
    title: lesson.value.title,
    lesson_type: lesson.value.lesson_type,
    video_m3u8_url: lesson.value.video_m3u8_url,
    video_mp4_file: lesson.value.video_mp4_file,
    content: lesson.value.content?.substring(0, 50) + '...'
  })
  
  // 优先使用 video_mp4_file（真实文件）
  // 只有当 video_m3u8_url 存在且不是假的（不包含 example.com）时才使用它
  const m3u8Url = lesson.value.video_m3u8_url
  const isFakeM3u8Url = m3u8Url && (
    m3u8Url.includes('example.com') || 
    m3u8Url.includes('localhost') && m3u8Url.includes('hls')
  )
  
  if (lesson.value.video_mp4_file) {
    const url = resolveMediaUrl(lesson.value.video_mp4_file)
    console.log('✅ [视频URL调试] 使用 video_mp4_file (真实文件):', url)
    return url
  }
  
  // 如果 video_mp4_file 不存在，且 video_m3u8_url 不是假的，才使用它
  if (m3u8Url && !isFakeM3u8Url) {
    const url = resolveMediaUrl(m3u8Url)
    console.log('✅ [视频URL调试] 使用 video_m3u8_url (HLS):', url)
    return url
  }
  
  // 如果 video_m3u8_url 是假的，警告用户
  if (isFakeM3u8Url) {
    console.warn('⚠️ [视频URL调试] video_m3u8_url 是假URL，已忽略:', m3u8Url)
  }
  
  console.log('❌ [视频URL调试] 没有找到有效的视频URL')
  return null
})

// --- 监听器 ---

// 4. 当 videoUrl 变化时 (即用户切换了课时)
watch(videoUrl, (newUrl) => {
  if (newUrl && videoPlayer.value) {
    videoPlayer.value.load() 
  }
})

// 5. 监听课程加载, 仅在初始化时设置点赞状态（不覆盖手动更新）
watch(course, (newCourse) => {
  if (newCourse && !isInitialized.value) {
    // 只在第一次加载时设置初始状态
    isLiked.value = newCourse.is_liked ?? false
    likeCount.value = newCourse.like_count ?? 0
    isInitialized.value = true
    console.log('✅ [初始化] 设置初始点赞状态:', {
      isLiked: isLiked.value,
      likeCount: likeCount.value
    })
  }
}, { immediate: true })

// 6. 监听课时 ID 变化, 重新加载评论
watch(() => props.lessonId, (newLessonId) => {
    if (newLessonId) {
        fetchComments(newLessonId)
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
    // 返回到课程详情页
    router.push({ name: 'course-detail', params: { id: props.courseId } });
}


// --- 点赞和评论功能 ---

// 1. 加载评论 (不变)
const fetchComments = async (lessonId) => {
  if (!lessonId) return;
  try {
    const response = await axios.get(`${API_URL}/api/comments/`, {
      params: { lesson_id: lessonId }
    });
    comments.value = response.data;
  } catch (error) {
    console.error('加载评论失败:', error);
  }
}

// 2. 提交评论 (不变)
const handlePostComment = async () => {
  if (!newComment.value.trim()) return;
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login' });
    return;
  }
  try {
    const response = await axios.post(`${API_URL}/api/comments/`, {
      lesson: props.lessonId,
      content: newComment.value
    });
    comments.value.unshift(response.data); 
    newComment.value = ''; 
  } catch (error) {
    console.error('发表评论失败:', error);
    alert('发表评论失败。');
  }
}

// 3. 切换点赞 (添加动画效果)
const handleLikeToggle = async () => {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login' });
    return;
  }
  
  if (isLiking.value) return; // 防止重复点击
  
  isLiking.value = true
  likeAnimation.value = true
  
  // 保存当前状态（用于回退）
  const previousLiked = isLiked.value
  const previousCount = likeCount.value
  
  // 🎯 乐观更新：立即更新UI，给用户即时反馈（这是关键！）
  isLiked.value = !previousLiked
  likeCount.value = previousLiked 
    ? Math.max(0, previousCount - 1) 
    : previousCount + 1
  countAnimation.value = true
  
  console.log('👍 [点赞] 乐观更新 - 立即显示:', {
    之前: { liked: previousLiked, count: previousCount },
    现在: { liked: isLiked.value, count: likeCount.value }
  })
  
  try {
    // 发送请求到服务器
    const response = await axios.post(`${API_URL}/api/courses/${props.courseId}/toggle-like/`);
    console.log('👍 [点赞] 服务器响应:', response.data)
    
    // 使用服务器返回的真实数据（确保数据同步）
    const serverLiked = response.data.liked !== undefined ? response.data.liked : isLiked.value
    const serverCount = response.data.count !== undefined ? response.data.count : likeCount.value
    
    // 🎯 更新本地状态（使用服务器数据，但通常与乐观更新一致）
    isLiked.value = serverLiked
    likeCount.value = serverCount
    
    console.log('👍 [点赞] 服务器同步后:', {
      liked: isLiked.value,
      count: likeCount.value
    })
    
    // 更新 store 中的状态（用于其他页面）
    if (courseStore.updateCourseLikeStatus) {
      courseStore.updateCourseLikeStatus(props.courseId, serverLiked, serverCount)
    }

    // 🎯 重要：不更新 currentCourse，因为这会触发 watch，可能覆盖状态
    // 点赞状态完全由 isLiked 和 likeCount 管理，不依赖 course 对象
  } catch (error) {
    console.error('👍 [点赞] 失败:', error);
    // 如果失败，回退到之前的状态
    isLiked.value = previousLiked
    likeCount.value = previousCount
    alert('操作失败，请稍后再试。');
  } finally {
    isLiking.value = false
    // 动画结束后重置
    setTimeout(() => {
      likeAnimation.value = false
      countAnimation.value = false
    }, 600)
  }
}

// 4. 切换收藏 (添加动画效果)
const handleFavoriteToggle = async () => {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login' });
    return;
  }
  
  if (isFavoriting.value) return; // 防止重复点击
  
  isFavoriting.value = true
  favoriteAnimation.value = true
  
  try {
    // 调用 authStore 中的 action
    await authStore.toggleFavorite(props.courseId);
    // 'isFavorited' 计算属性会自动更新
  } catch (error) {
    console.error('收藏失败:', error);
    alert('操作失败，请稍后再试。');
  } finally {
    isFavoriting.value = false
    // 动画结束后重置
    setTimeout(() => {
      favoriteAnimation.value = false
    }, 600)
  }
}

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
              loading: isFavoriting
            }]"
            :disabled="isFavoriting"
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
    
  </div>
</template>

<style scoped>
.watch-layout {
  display: flex;
  height: calc(100vh - 60px); 
  width: 100%;
  max-width: 100%; 
}

/* --- 1. 侧边栏 (播放列表) [右] (不变) --- */
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

/* --- 2. 主内容区 (视频 + 评论) [左] (不变) --- */
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

/* 【【【已修改】】】: 视频操作栏 */
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
    margin-left: auto; /* 【【【修改】】】: 将 "下一课" 推到最右边 */
}
.next-lesson-btn:hover { background-color: #218838; }

/* 点赞按钮样式 */
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

/* 收藏按钮样式 */
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

/* 动画定义 */
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


/* 评论区 (不变) */
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