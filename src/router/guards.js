import { useAuthStore } from '@/store/modules/auth'

export function setupRouterGuard(router) {
  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    // 需要登录的页面
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // 已登录用户访问登录页
    if (to.meta.guest && authStore.isAuthenticated) {
      next({ name: 'info' })
      return
    }

    next()
  })
}
