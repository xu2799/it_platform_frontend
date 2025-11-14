import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import CourseDetailView from '@/views/CourseDetailView.vue'
import CreateCourseView from '@/views/CreateCourseView.vue'
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
      meta: { simpleHeader: true } 
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { simpleHeader: true } 
    },
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
    // --- 【【【新增】】】: 重新添加收藏夹路由 ---
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/FavoritesView.vue'), // 我们将在下一步创建这个文件
      meta: { requiresAuth: true }
    },
    // --- 【【【修改结束】】】 ---
  ]
})


// 全局路由守卫 (不变)
router.beforeEach(async (to, from, next) => {
    
    const authStore = useAuthStore()
    const requiresAuth = to.meta.requiresAuth
    const requiredRole = to.meta.requiredRole
    
    // 【【【已修改】】】:
    // 检查 authStore.user 是否包含 favorited_courses，如果不包含，则强制刷新
    // (这确保了在登录后或刷新页面后，收藏数据总是最新的)
    if (requiresAuth && authStore.token && (!authStore.user || authStore.user.favorited_courses === undefined)) {
        console.log('路由守卫: Token 存在但用户数据(或收藏夹)缺失, 强制刷新...');
        try {
            await authStore.fetchUser();
        } catch (error) {
            authStore.logout();
            return next({ name: 'login' });
        }
    }

    // 2. 检查是否需要登录
    if (requiresAuth && !authStore.isAuthenticated) {
        console.log('路由守卫: 拒绝访问 (未登录)');
        return next({ name: 'login' });
    }

    // 3. 检查角色权限
    if (requiresAuth && requiredRole && authStore.user && !requiredRole.includes(authStore.user.role)) {
        console.log('路由守卫: 拒绝访问 (权限不足)');
        alert('你没有访问此页面的权限。');
        return next({ name: 'home' });
    }

    // 4. 阻止已登录用户访问登录/注册页
    if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
        return next({ name: 'courses' }); 
    }

    // 5. 放行
    next();
})

export default router