<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useCourseStore } from '@/stores/courseStore'
import { useAuthStore } from '@/stores/authStore' 
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

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
const videoPlayer = ref(null)

// 点赞和评论的状态
const isLiked = ref(false)
const likeCount = ref(0)
const comments = ref([])
const newComment = ref('')

// 【【【新增】】】: 收藏状态 (来自 authStore)
const isFavorited = computed(() => authStore.isCourseFavorited(props.courseId))

// 页面加载时, 确保我们有这门课程的“完整”数据
onMounted(() => {
  courseStore.fetchCourseDetail(props.courseId)
  fetchComments(props.lessonId) 
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

// 3. 获取视频 URL (不变)
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
watch(videoUrl, (newUrl) => {
  if (newUrl && videoPlayer.value) {
    videoPlayer.value.load() 
  }
})

// 5. 监听课程加载, 更新点赞状态
watch(course, (newCourse) => {
  if (newCourse) {
    isLiked.value = newCourse.is_liked
    likeCount.value = newCourse.like_count
    // (收藏状态 'isFavorited' 由 authStore 自动管理)
  }
})

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
    router.push({ name: 'courses' });
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

// 3. 切换点赞 (不变)
const handleLikeToggle = async () => {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login' });
    return;
  }
  try {
    const response = await axios.post(`${API_URL}/api/courses/${props.courseId}/toggle-like/`);
    isLiked.value = response.data.liked;
    likeCount.value = response.data.count;
    courseStore.updateCourseLikeStatus(props.courseId, response.data.liked, response.data.count);
  } catch (error) {
    console.error('点赞失败:', error);
    alert('操作失败，请稍后再试。');
  }
}

// 4. 【【【新增】】】: 切换收藏
const handleFavoriteToggle = async () => {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login' });
    return;
  }
  // 调用 authStore 中的 action
  await authStore.toggleFavorite(props.courseId);
  // 'isFavorited' 计算属性会自动更新
}

</script>

<template>
  <div class="watch-layout">
    
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
          </video>
        </div>
        
        <div v-else-if="lesson.lesson_type === 'text'">
           <div class="text-content" v-html="lesson.content"></div>
        </div>
        
        <div v-else>
            <p>无法加载此课时。</p>
        </div>

        <div class="video-actions">
          <button @click="handleLikeToggle" :class="['action-btn', 'like-btn', { liked: isLiked }]">
            ❤️ {{ isLiked ? '已点赞' : '点赞' }} ({{ likeCount }})
          </button>
          
          <button @click="handleFavoriteToggle" :class="['action-btn', 'favorite-btn', { favorited: isFavorited }]">
            ⭐ {{ isFavorited ? '已收藏' : '收藏' }}
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
                <strong>{{ comment.user.username }}</strong>
                <small>{{ new Date(comment.created_at).toLocaleString('zh-CN') }}</small>
              </div>
              <p class="comment-content">{{ comment.content }}</p>
            </li>
          </ul>
        </div>
        
      </div>
    </main>

    <nav class="sidebar-nav">
      <h3 @click="goToCourseHome" class="sidebar-title">
        &laquo; 返回课程列表
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
  transition: background-color 0.2s;
  font-weight: bold;
}
.next-lesson-btn {
    background-color: #28a745;
    color: white;
    margin-left: auto; /* 【【【修改】】】: 将 "下一课" 推到最右边 */
}
.next-lesson-btn:hover { background-color: #218838; }

.like-btn {
  background-color: #f0f0f0;
  color: #333;
}
.like-btn.liked {
  background-color: #007bff;
  color: white;
}

/* 【【【新增】】】: 收藏按钮样式 */
.favorite-btn {
  background-color: #f0f0f0;
  color: #333;
}
.favorite-btn.favorited {
  background-color: #f0ad4e; /* 收藏用橙色 */
  color: white;
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