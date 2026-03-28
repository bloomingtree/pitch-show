import { defineStore } from 'pinia'
import authApi from '@/api/auth'
import { push } from 'notivue'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: localStorage.getItem('access_token') || null,
    refreshToken: localStorage.getItem('refresh_token') || null,
    loading: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    userName: (state) => state.user?.username || state.user?.email || '未登录',
    userAvatar: (state) => state.user?.avatar_url || null
  },

  actions: {
    // 发送OTP邮件
    async sendOTP(email) {
      this.loading = true
      try {
        await authApi.sendEmailOTP(email)
        push.success({
          title: '验证码已发送',
          description: '请检查您的邮箱',
          duration: 3000
        })
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

    // 验证OTP并登录
    async verifyOTP(email, token) {
      this.loading = true
      try {
        const res = await authApi.verifyEmailOTP(email, token)

        // 保存token（根据实际返回格式调整）
        if (res.access_token) {
          this.accessToken = res.access_token
          this.refreshToken = res.refresh_token
          localStorage.setItem('access_token', res.access_token)
          localStorage.setItem('refresh_token', res.refresh_token)
        }

        // 获取用户信息
        await this.fetchUser()

        push.success({
          title: '登录成功',
          duration: 2000
        })

        return true
      } catch (error) {
        push.error({
          title: '验证失败',
          description: error.message || '验证码错误或已过期',
          duration: 3000
        })
        return false
      } finally {
        this.loading = false
      }
    },

    // 获取用户信息
    async fetchUser() {
      try {
        const user = await authApi.getCurrentUser()
        this.user = user
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    },

    // 登出
    async logout() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      push.success({
        title: '已退出登录',
        duration: 2000
      })
    },

    // 删除账户
    async deleteAccount() {
      try {
        await authApi.deleteAccount()
        await this.logout()
        push.success({
          title: '账户已删除',
          duration: 2000
        })
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
