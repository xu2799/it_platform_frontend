// src/stores/courseStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/api' 

export const useCourseStore = defineStore('courses', () => {
  
  const courses = ref([])
  const categories = ref([])
  
  const isLoading = ref(false)
  const error = ref(null)
  
  const isStale = ref(true)

  async function fetchCourses(params = {}) {
    
    if (!isStale.value && courses.value.length > 0 && !params.search && !params.category) {
      console.log('Pinia: 课程列表缓存命中, 跳过 fetch。');
      isLoading.value = false;
      error.value = null;
      return;
    }

    isLoading.value = true
    error.value = null
    try {
      console.log('Pinia: 正在从 Django 获取课程, 查询参数:', params)
      const response = await apiClient.get('/api/courses/', { params }) 
      
      if (response.data.results) {
        courses.value = response.data.results
      } else {
        courses.value = response.data
      }

      isStale.value = false 
      console.log('Pinia: 成功获取数据并存入"仓库"。')

    } catch (err) {
      console.error('Pinia: 获取课程失败:', err)
      error.value = err.response?.data?.detail || '获取课程失败，请稍后重试'
      courses.value = []
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCourseDetail(courseId) {
    const existingCourse = courses.value.find(c => c.id == courseId);
    
    if (
        !isStale.value && 
        existingCourse && 
        existingCourse.modules &&
        existingCourse.is_liked !== undefined
    ) {
        console.log(`Pinia: 课程 ${courseId} 的"完整"详情已在缓存中, 跳过 fetch。`);
        return existingCourse;
    }

    try {
      console.log(`Pinia: 正在为课程 ${courseId} 获取"完整"详情...`)
      
      const response = await apiClient.get(`/api/courses/${courseId}/`) 
      
      const detailedCourse = response.data
      
      // 清理数据：确保模块和课时不为 null
      if (detailedCourse.modules) {
        detailedCourse.modules = detailedCourse.modules
          .filter(module => module && typeof module === 'object')
          .map(module => ({
            ...module,
            lessons: (module.lessons || [])
              .filter(lesson => lesson && typeof lesson === 'object')
          }))
      }
      
      const index = courses.value.findIndex(c => c.id == detailedCourse.id)
      
      if (index !== -1) {
        const newCourses = [...courses.value];
        newCourses[index] = detailedCourse;
        courses.value = newCourses;
      } else {
        const newCourses = [...courses.value, detailedCourse];
        courses.value = newCourses;
      }
      
      console.log(`Pinia: 成功获取课程 ${courseId} 的"完整"详情。`)
      return detailedCourse
      
    } catch (err) {
      console.error(`Pinia: 获取课程 ${courseId} 详情失败:`, err)
      throw err; 
    }
  }

  async function fetchCategories() {
    if (categories.value.length > 0) {
      return
    }
    try {
      console.log('Pinia: 正在获取课程分类...')
      const response = await apiClient.get('/api/categories/')
      
      if (response.data.results) {
        categories.value = response.data.results
      } else {
        categories.value = response.data
      }

    } catch (err) {
      console.error('Pinia: 获取分类失败:', err)
    }
  }

  function markAsStale() {
    console.log('Pinia: 课程数据已被标记为"陈旧"(Stale)。')
    isStale.value = true
  }

  function updateCourseLikeStatus(courseId, liked, like_count) {
    console.log(`🔄 [Store] 更新课程 ${courseId} 点赞状态:`, { liked, like_count })
    
    const index = courses.value.findIndex(c => c.id == courseId); 
    if (index !== -1) {
      const newCourses = [...courses.value];
      newCourses[index] = { 
        ...newCourses[index],
        is_liked: liked,
        like_count: like_count
      };
      
      courses.value = newCourses;
      console.log(`✅ [Store] 课程 ${courseId} 点赞状态已更新`)
    } else {
      console.log(`❌ [Store] 未找到课程 ${courseId}，无法更新点赞状态`)
    }
  }

  function updateCourseFavoriteStatus(courseId, favorited) {
    console.log(`🔄 [Store] 更新课程 ${courseId} 收藏状态:`, { favorited })
    
    const index = courses.value.findIndex(c => c.id == courseId);
    if (index !== -1) {
      const newCourses = [...courses.value];
      newCourses[index] = {
        ...newCourses[index],
        is_favorited: favorited
      };
      courses.value = newCourses;

      console.log(`✅ [Store] 课程 ${courseId} 收藏状态已更新`)
    } else {
      console.log(`❌ [Store] 未找到课程 ${courseId}，无法更新收藏状态`)
    }
  }

  function getCourse(courseId) {
    return courses.value.find(c => c.id == courseId)
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
    updateCourseLikeStatus,
    updateCourseFavoriteStatus,
    getCourse
  }
})

// 确保有默认导出
export default useCourseStore