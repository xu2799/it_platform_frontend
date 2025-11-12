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
    
    // 缓存检查：仅当数据不是陈旧的、没有搜索、也没有按分类筛选时，才使用缓存
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
      
      const response = await apiClient.get(`/api/courses/${courseId}/`) 
      
      const detailedCourse = response.data
      const index = courses.value.findIndex(c => c.id == detailedCourse.id)
      
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
      // (我引入的语法错误已删除)
      console.log('Pinia: 正在获取课程分类...')
      const response = await apiClient.get('/api/categories/')
      
      if (response.data.results) {
        categories.value = response.data.results
      } else {
        categories.value = response.data
      }

    } catch (error) {
      console.error('Pinia: 获取分类失败:', error)
    }
  }

  function markAsStale() {
    console.log('Pinia: 课程数据已被标记为“陈旧”(Stale)。')
    isStale.value = true
  }

  function updateCourseLikeStatus(courseId, isLiked, likeCount) {
    // 修复点赞响应式：直接修改 Pinia state 中的对象属性
    const courseToUpdate = courses.value.find(c => c.id == courseId);
    
    if (courseToUpdate) {
      console.log(`Pinia: 正在响应式地更新课程 ${courseId} (直接修改属性)`);
      
      courseToUpdate.is_liked = isLiked;
      courseToUpdate.like_count = likeCount;
      
      isStale.value = true;
    } else {
       console.warn(`Pinia: (updateCourseLikeStatus) 未能在 store 中找到 courseId ${courseId}`);
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