import { defineStore } from 'pinia'
import authApi from '@/api/auth'
import { push } from 'notivue'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user_info') || 'null'),
    accessToken: localStorage.getItem('access_token') || null,
    refreshToken: localStorage.getItem('refresh_token') || null,
    loading: false,
    userInitialized: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    userName: (state) => state.user?.username || state.user?.name || state.user?.email || '未登录',
    userAvatar: (state) => state.user?.avatar_url || null
  },

  actions: {
    // 内部方法：清除所有认证状态（不弹提示）
    clearAuth() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      this.userInitialized = false
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_info')
    },

    // 发送OTP邮件
    async sendOTP(email) {
      this.loading = true
      try {
        await authApi.sendEmailOTP(email)
        push.success({ title: '已发送', duration: 1500 })
        return true
      } catch (error) {
        push.error({
          title: '发送失败',
          description: error.message || '请稍后重试',
          duration: 3000
        })
        return false
      } finally {
        this.loading = false
      }
    },

    // 验证OTP并登录（统一入口）
    async verifyOTP(email, token) {
      this.loading = true
      try {
        const res = await authApi.verifyEmailOTP(email, token)

        // auth 服务器返回 { user, session: { access_token, refresh_token } }
        const session = res.session || res
        if (session.access_token) {
          this.accessToken = session.access_token
          this.refreshToken = session.refresh_token || null
          localStorage.setItem('access_token', session.access_token)
          if (session.refresh_token) {
            localStorage.setItem('refresh_token', session.refresh_token)
          }
        }

        // 优先使用 verify 返回的 user，避免额外请求
        const user = res.user
        if (user) {
          this.user = user
          localStorage.setItem('user_info', JSON.stringify(user))
        } else {
          await this.fetchUser()
        }

        push.success({ title: '登录成功', duration: 1500 })
        return this.user
      } finally {
        this.loading = false
      }
    },

    // 获取用户信息
    async fetchUser() {
      try {
        const user = await authApi.getCurrentUser()
        this.user = user
        localStorage.setItem('user_info', JSON.stringify(user))
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    },

    // 由外部组件调用，同步用户数据到 store
    setUser(user) {
      this.user = user
      if (user) {
        localStorage.setItem('user_info', JSON.stringify(user))
      } else {
        localStorage.removeItem('user_info')
      }
    },

    // 登出
    async logout() {
      this.clearAuth()
      push.success({ title: '已退出登录', duration: 2000 })
    },

    // 删除账户
    async deleteAccount() {
      try {
        await authApi.deleteAccount()
        await this.logout()
        push.success({ title: '账户已删除', duration: 2000 })
        return true
      } catch (error) {
        push.error({
          title: '删除失败',
          description: error.message,
          duration: 3000
        })
        return false
      }
    }
  }
})
