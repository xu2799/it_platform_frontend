import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

export const useCourseStore = defineStore('courses', () => {
  
  const courses = ref([])
  
  // 状态标记，用于判断数据是否“陈旧”
  // (我们默认为 true, 这样应用启动时总会获取一次)
  const isStale = ref(true) 

  async function fetchCourses() {
    // 只有在数据“陈旧” (isStale = true) 时才重新获取
    if (!isStale.value) { 
      console.log('Pinia: 课程数据未“陈旧”, 从本地“仓库”读取。')
      return
    }
    
    try {
      console.log('Pinia: 正在从 Django“打电话”获取课程...')
      const response = await axios.get('http://127.0.0.1:8000/api/courses/')
      
      courses.value = response.data
      isStale.value = false // 获取成功, 标记为“新鲜”
      console.log('Pinia: 成功获取数据并存入“仓库”。')

    } catch (error) {
      console.error('Pinia: 获取课程失败:', error)
    }
  }

  // 暴露一个“标记”函数
  // 任何组件 (如 CreateCourseView 或 CourseDetailView) 
  // 在“修改”了课程/课时后，都应该调用这个函数。
  function markAsStale() {
    console.log('Pinia: 课程数据已被标记为“陈旧”。')
    isStale.value = true
  }

  return { courses, fetchCourses, markAsStale }
})