import axios from 'axios'
import { push } from 'notivue'
import router from '@/router'

// 创建 axios 实例 — API 服务器（shiyin.notalabs.cn）
// dev 环境通过 Vite 代理 /shiyin-api → https://shiyin.notalabs.cn 避免 CORS
const request = axios.create({
  baseURL: import.meta.env.DEV ? '/shiyin-api/api' : 'https://shiyin.notalabs.cn/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'x-app-identifier': 'shiyin'
  }
})

// Token刷新状态锁
let isRefreshing = false
let refreshSubscribers = []

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb)
}

function onTokenRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token))
  refreshSubscribers = []
}

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    // 业务错误（HTTP 200 但 success: false）
    if (res.success === false) {
      const message = res.message || '操作失败'
      push.error({ title: message, duration: 3000 })
      const error = new Error(message)
      error.response = { data: res }
      return Promise.reject(error)
    }
    // 成功：解包 data 字段
    if (res.data !== undefined) {
      return res.data
    }
    return res
  },
  async error => {
    const originalRequest = error.config

    // Token过期处理
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(request(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        // dev 环境通过代理避免 CORS
        const refreshBaseURL = import.meta.env.DEV ? '/auth-api' : 'https://auth.notalabs.cn'
        const res = await axios.post(`${refreshBaseURL}/v1/auth/refresh`, {
          refreshToken: refreshToken
        }, {
          headers: {
            'x-app-identifier': 'shiyin'
          }
        })

        // auth 服务器返回 {success: true, data: {access_token, refresh_token}}
        const tokenData = res.data?.data || res.data
        const newToken = tokenData.access_token
        const newRefreshToken = tokenData.refresh_token
        localStorage.setItem('access_token', newToken)
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken)
        }

        // 同步到 Pinia store（延迟导入避免循环依赖）
        try {
          const { useAuthStore } = await import('@/store/modules/auth')
          const store = useAuthStore()
          store.accessToken = newToken
          if (newRefreshToken) store.refreshToken = newRefreshToken
        } catch (_) {}

        onTokenRefreshed(newToken)

        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return request(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_info')

        // 清除 Pinia store（延迟导入避免循环依赖）
        try {
          const { useAuthStore } = await import('@/store/modules/auth')
          useAuthStore().clearAuth()
        } catch (_) {}

        // 若请求标记了 _skipAuthError，则静默拒绝，由调用方自行处理 401
        if (!originalRequest._skipAuthError) {
          router.push('/')
          push.error({
            title: '登录已过期，请重新登录',
            duration: 3000
          })
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // 对标记 _skipAuthError 的请求，401 静默处理
    if (error.response?.status === 401 && originalRequest._skipAuthError) {
      return Promise.reject(error)
    }

    const message = error.response?.data?.message || error.message || '网络错误'
    push.error({
      title: message,
      duration: 3000
    })

    return Promise.reject(error)
  }
)

export default request
