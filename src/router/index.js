import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import CourseDetailView from '@/views/CourseDetailView.vue'
import CreateCourseView from '@/views/CreateCourseView.vue'
import PaymentSuccessView from '@/views/PaymentSuccessView.vue'
import PaymentCancelView from '@/views/PaymentCancelView.vue'
import CourseListView from '@/views/CourseListView.vue' 

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { hideHeader: true } // 主页仍然完全隐藏导航栏
    },
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
    
    // --- 【【【核心修复】】】 ---
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { simpleHeader: true } // <-- 告诉 App.vue 显示“简化版”导航栏
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { simpleHeader: true } // <-- 告诉 App.vue 显示“简化版”导航栏
    },
    // --- 【【【修复结束】】】 ---
    
    {
      path: '/courses/:id',
      name: 'course-detail',
      component: CourseDetailView,
      props: true
    },
    {
      path: '/courses/:courseId/lessons/:lessonId',
      name: 'lesson-watch',
      component: () => import('@/views/LessonWatchView.vue'),
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/create-course',
      name: 'create-course',
      component: CreateCourseView,
      meta: { requiresAuth: true, requiredRole: ['instructor', 'admin'] }
    },
    {
      path: '/courses/:id/edit',
      name: 'course-edit',
      component: () => import('@/views/CourseEditView.vue'), 
      props: true,
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
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'), 
      meta: { requiresAuth: true }
    },
    {
      path: '/instructor-dashboard',
      name: 'instructor-dashboard',
      component: () => import('@/views/InstructorDashboardView.vue'), 
      meta: { requiresAuth: true, requiredRole: ['instructor', 'admin'] }
    },
    {
      path: '/become-instructor',
      name: 'become-instructor',
      component: () => import('@/views/BecomeInstructorView.vue'), 
      meta: { requiresAuth: true, requiredRole: ['student'] } 
    },
    {
      path: '/admin/applications',
      name: 'admin-applications',
      component: () => import('@/views/AdminApplicationsView.vue'), 
      meta: { requiresAuth: true, requiredRole: ['admin'] } 
    },
  ]
})


// 全局路由守卫 (不变)
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    const requiresAuth = to.meta.requiresAuth
    const requiredRole = to.meta.requiredRole

    // (获取用户信息, 确保 authStore.user 已加载)
    // 修复: 检查 authStore.user 是否为 null
    if (requiresAuth && authStore.token && !authStore.user) {
        await authStore.fetchUser();
    }

    if (requiresAuth && !authStore.isAuthenticated) {
        return next({ name: 'login' })
    }

    if (requiresAuth && requiredRole && !requiredRole.includes(authStore.user?.role)) {
        alert('你没有访问此页面的权限。')
        return next({ name: 'home' })
    }

    if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
        return next({ name: 'courses' }) 
    }

    next()
})

export default router