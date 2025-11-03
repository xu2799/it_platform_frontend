import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import CourseDetailView from '@/views/CourseDetailView.vue'
import CreateCourseView from '@/views/CreateCourseView.vue'
import PaymentSuccessView from '@/views/PaymentSuccessView.vue'
import PaymentCancelView from '@/views/PaymentCancelView.vue'
// 🎯 关键：导入新的课程列表视图
import CourseListView from '@/views/CourseListView.vue' 

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { hideHeader: true } 
    },
    // 🎯 关键修改：/courses 路由指向 CourseListView
    {
      path: '/courses',
      name: 'courses',
      component: CourseListView, 
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/courses/:id',
      name: 'course-detail',
      component: CourseDetailView,
      props: true
    },
    {
      path: '/create-course',
      name: 'create-course',
      component: CreateCourseView,
      meta: { requiresAuth: true, requiredRole: ['instructor', 'admin'] }
    },
    {
      path: '/payment-success',
      name: 'payment-success',
      component: PaymentSuccessView
    },
    {
      path: '/payment-cancel',
      name: 'payment-cancel',
      component: PaymentCancelView
    },
  ]
})


// 全局路由守卫
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    const requiresAuth = to.meta.requiresAuth
    const requiredRole = to.meta.requiredRole

    if (requiresAuth && !authStore.isAuthenticated) {
        return next({ name: 'login' })
    }

    if (requiresAuth && requiredRole && !requiredRole.includes(authStore.user?.role)) {
        alert('你没有访问此页面的权限。')
        return next({ name: 'home' })
    }

    // 关键：登录后访问登录/注册页，重定向到课程列表页
    if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
        return next({ name: 'courses' }) 
    }

    next()
})

export default router