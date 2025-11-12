import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
// 【【【修复】】】: 导入 authStore，因为 fetchCourseDetail 需要它
import { useAuthStore } from '@/stores/authStore'

const API_URL = import.meta.env.VITE_API_URL

export const useCourseStore = defineStore('courses', () => {
  
  const courses = ref([])
  const categories = ref([])
  
  const isLoading = ref(false)
  const error = ref(null)

  async function fetchCourses(params = {}) {
    isLoading.value = true
    error.value = null
    try {
      console.log('Pinia: 正在从 Django 获取课程, 查询参数:', params)
      const response = await axios.get(`${API_URL}/api/courses/`, { params })
      // 处理分页响应（如果启用分页）
      if (response.data.results) {
        courses.value = response.data.results
      } else {
        courses.value = response.data
      }
      console.log('Pinia: 成功获取数据并存入"仓库"。')
    } catch (error) {
      console.error('Pinia: 获取课程失败:', error)
      error.value = error.response?.data?.detail || '获取课程失败，请稍后重试'
      courses.value = []
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCourseDetail(courseId) {
    try {
      console.log(`Pinia: 正在为课程 ${courseId} 获取“完整”详情...`)
      
      // 【【【修复】】】: 初始化 authStore
      const authStore = useAuthStore()
      
      let config = {}
      if (authStore.token) {
        config.headers = {
            'Authorization': `Token ${authStore.token}`
        }
      }

      // 【【【修复】】】: 传递 config (包含 token)
      const response = await axios.get(`${API_URL}/api/courses/${courseId}/`, config)
      
      const detailedCourse = response.data
      const index = courses.value.findIndex(c => c.id == detailedCourse.id)
      
      if (index !== -1) {
        courses.value[index] = detailedCourse
      } else {
        courses.value.push(detailedCourse)
      }
      
      console.log(`Pinia: 成功获取课程 ${courseId} 的“完整”详情。`)
      return detailedCourse
      
    } catch (error) {
      console.error(`Pinia: 获取课程 ${courseId} 详情失败:`, error)
    }
  }

  async function fetchCategories() {
    if (categories.value.length > 0) {
      return
    }
    try {
      console.log('Pinia: 正在获取课程分类...')
      const response = await axios.get(`${API_URL}/api/categories/`)
      categories.value = response.data
    } catch (error) {
      console.error('Pinia: 获取分类失败:', error)
    }
  }


  function markAsStale() {
    console.log('Pinia: 课程数据已被标记为“陈旧”。')
  }

  // 【【【新增】】】: 用于同步点赞状态
  function updateCourseLikeStatus(courseId, isLiked, likeCount) {
    const course = courses.value.find(c => c.id == courseId);
    if (course) {
      console.log(`Pinia: 正在更新课程 ${courseId} 的点赞状态`);
      course.is_liked = isLiked;
      course.like_count = likeCount;
    }
  }

  return { 
    courses, 
    categories,
    isLoading,
    error,
    fetchCourses, 
    fetchCourseDetail, 
    fetchCategories, 
    markAsStale,
    updateCourseLikeStatus
  }
})