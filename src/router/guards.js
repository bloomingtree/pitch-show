import { useAuthStore } from '@/store/modules/auth'

export function setupRouterGuard(router) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // 已有 token 但未加载用户信息时，自动获取
    if (authStore.isAuthenticated && !authStore.user && !authStore.userInitialized) {
      authStore.userInitialized = true
      await authStore.fetchUser()
    }

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
