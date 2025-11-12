import { ref } from 'vue'
import { defineStore } from 'pinia'
// 【【【修改】】】: 导入我们新的 apiClient
import apiClient from '@/api' 
// (不再需要导入 authStore 或原始 axios)

export const useCourseStore = defineStore('courses', () => {
  
  const courses = ref([])
  const categories = ref([])
  
  const isLoading = ref(false)
  const error = ref(null)
  
  // 缓存状态标志
  const isStale = ref(true)

  async function fetchCourses(params = {}) {
    // (只在数据陈旧或搜索时才获取)
    if (!isStale.value && courses.value.length > 0 && !params.search) {
      console.log('Pinia: 课程列表缓存命中, 跳过 fetch。');
      isLoading.value = false;
      error.value = null;
      return;
    }

    isLoading.value = true
    error.value = null
    try {
      console.log('Pinia: 正在从 Django 获取课程, 查询参数:', params)
      // 【【【修改】】】: 使用 apiClient (它会自动附加 token)
      const response = await apiClient.get('/api/courses/', { params }) 
      
      if (response.data.results) {
        courses.value = response.data.results
      } else {
        courses.value = response.data
      }

      isStale.value = false 
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
    const existingCourse = courses.value.find(c => c.id == courseId);
    
    // (缓存检查逻辑)
    if (
        !isStale.value && 
        existingCourse && 
        existingCourse.modules
    ) {
        console.log(`Pinia: 课程 ${courseId} 的“完整”详情已在缓存中, 跳过 fetch。`);
        return existingCourse;
    }

    try {
      console.log(`Pinia: 正在为课程 ${courseId} 获取“完整”详情...`)
      
      // 【【【修改】】】: 使用 apiClient (不再需要手动添加 config)
      const response = await apiClient.get(`/api/courses/${courseId}/`) 
      
      const detailedCourse = response.data
      const index = courses.value.findIndex(c => c.id == detailedCourse.id)
      
      // 【【【 🛑 关键修复: 强制替换数组 🛑 】】】
      if (index !== -1) {
        const newCourses = [...courses.value];
        newCourses[index] = detailedCourse;
        courses.value = newCourses;
      } else {
        const newCourses = [...courses.value, detailedCourse];
        courses.value = newCourses;
      }
      
      console.log(`Pinia: 成功获取课程 ${courseId} 的“完整”详情。`)
      return detailedCourse
      
    } catch (error) {
      console.error(`Pinia: 获取课程 ${courseId} 详情失败:`, error)
      throw error; 
    }
  }

  async function fetchCategories() {
    if (categories.value.length > 0) {
      return
    }
    try {
      console.log('Pinia: 正在获取课程分类...')
      // 【【【修改】】】: 使用 apiClient
      const response = await apiClient.get('/api/categories/')
      categories.value = response.data
    } catch (error) {
      console.error('Pinia: 获取分类失败:', error)
    }
  }

  // (markAsStale 逻辑)
  function markAsStale() {
    console.log('Pinia: 课程数据已被标记为“陈旧”(Stale)。')
    isStale.value = true
  }

  // 【【【 🛑 关键修复: 强制替换数组 🛑 】】】
  function updateCourseLikeStatus(courseId, isLiked, likeCount) {
    const index = courses.value.findIndex(c => c.id == courseId);
    if (index !== -1) {
      console.log(`Pinia: 正在响应式地更新课程 ${courseId} (强制替换数组)`);
      
      const updatedCourse = { 
        ...courses.value[index], 
        is_liked: isLiked, 
        like_count: likeCount 
      };
      
      const newCourses = [...courses.value];
      newCourses[index] = updatedCourse;
      courses.value = newCourses; // 强制触发响应式
      
      isStale.value = true;
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