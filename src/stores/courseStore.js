import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export const useCourseStore = defineStore('courses', () => {
  
  const courses = ref([])
  const categories = ref([])
  
  // 【【【Bug 修复】】】:
  // 我们移除了 isStale 状态，因为它导致了缓存逻辑错误。
  // CourseListView.vue 中的 'watch' 会在需要时自动调用 fetchCourses，
  // 我们不需要在这里进行额外的缓存检查。
  // const isStale = ref(true) 

  async function fetchCourses(params = {}) {
    // 【【【Bug 修复】】】: 移除了 if (!hasQueries && !isStale.value) 的检查
    try {
      console.log('Pinia: 正在从 Django 获取课程, 查询参数:', params)
      const response = await axios.get(`${API_URL}/api/courses/`, { params })
      courses.value = response.data
      console.log('Pinia: 成功获取数据并存入“仓库”。')
    } catch (error) {
      console.error('Pinia: 获取课程失败:', error)
      courses.value = [] // 失败时清空, 避免显示旧数据
    }
  }

  // (fetchCourseDetail 不变)
  async function fetchCourseDetail(courseId) {
    try {
      console.log(`Pinia: 正在为课程 ${courseId} 获取“完整”详情...`)
      const response = await axios.get(`${API_URL}/api/courses/${courseId}/`)
      
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

  // (fetchCategories 不变)
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
    // 这个函数现在只是一个占位符，因为我们移除了 fetchCourses 的缓存。
    // 如果其他地方需要, 仍然可以保留它。
    console.log('Pinia: 课程数据已被标记为“陈旧”。')
    // isStale.value = true
  }

  // 移除了 isStale 的暴露
  return { courses, categories, fetchCourses, fetchCourseDetail, fetchCategories, markAsStale }
})