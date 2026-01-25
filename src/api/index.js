import axios from 'axios'
import { push } from 'notivue'
import router from '@/router'

// 创建axios实例
const request = axios.create({
  baseURL: 'http://localhost:9271', // 认证服务器地址
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'x-app-identifier': 'shiyin' // 识音应用标识
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
    // 根据实际返回格式调整
    if (res.code === 200 || res.success === true || res.data) {
      return res.data || res
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

        const res = await axios.post('http://localhost:9271/v1/auth/refresh', {
          refreshToken: refreshToken
        }, {
          headers: {
            'x-app-identifier': 'shiyin'
          }
        })

        const newToken = res.data.access_token
        localStorage.setItem('access_token', newToken)

        onTokenRefreshed(newToken)

        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return request(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        router.push('/auth/login')
        push.error({
          title: '登录已过期，请重新登录',
          duration: 3000
        })
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
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
