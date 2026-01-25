import request from './index'

export default {
  // 发送登录邮件
  sendEmailOTP(email) {
    return request({
      url: '/v1/auth/email',
      method: 'post',
      data: { email }
    })
  },

  // 验证邮箱OTP
  verifyEmailOTP(email, token) {
    return request({
      url: '/v1/auth/verify-email',
      method: 'post',
      data: { email, token }
    })
  },

  // 获取当前用户信息
  getCurrentUser() {
    return request({
      url: '/v1/auth/me',
      method: 'get'
    })
  },

  // 刷新Token
  refreshToken(refreshToken) {
    return request({
      url: '/v1/auth/refresh',
      method: 'post',
      data: { refreshToken }
    })
  },

  // 删除账户
  deleteAccount() {
    return request({
      url: '/v1/auth/account',
      method: 'delete'
    })
  }
}
