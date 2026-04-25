import axios from 'axios'
import { push } from 'notivue'

// 认证服务器专用 axios 实例（auth.notalabs.cn）
// dev 环境通过 Vite 代理 /auth-api → https://auth.notalabs.cn 避免 CORS
const authRequest = axios.create({
  baseURL: import.meta.env.DEV ? '/auth-api' : 'https://auth.notalabs.cn',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'x-app-identifier': 'shiyin'
  }
})

// 请求拦截器：附加 token
authRequest.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器：auth 服务器即使错误也返回 HTTP 200，需检查 success 字段
authRequest.interceptors.response.use(
  response => {
    const res = response.data
    if (res.success === false) {
      // 业务错误（HTTP 200 但 success: false）
      const error = new Error(res.message || '认证服务错误')
      error.response = { data: res }
      push.error({ title: res.message || '认证服务错误', duration: 3000 })
      return Promise.reject(error)
    }
    // 成功：解包 data 字段
    return res.data !== undefined ? res.data : res
  },
  async error => {
    const message = error.response?.data?.message || error.message || '认证服务错误'
    push.error({
      title: message,
      duration: 3000
    })
    return Promise.reject(error)
  }
)

export default authRequest
