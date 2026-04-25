import request from './index'
import authRequest from './authRequest'

export default {
  // 发送登录邮件验证码（auth 服务器）
  sendEmailOTP(email) {
    return authRequest({
      url: '/v1/auth/email',
      method: 'post',
      data: { email }
    })
  },

  // 验证邮箱 OTP（auth 服务器）
  verifyEmailOTP(email, token) {
    return authRequest({
      url: '/v1/auth/verify-email',
      method: 'post',
      data: { email, token }
    })
  },

  // 获取当前用户信息（API 服务器）
  // GET /users/me
  getCurrentUser() {
    return request({
      url: '/users/me',
      method: 'get',
      _skipAuthError: true
    })
  },

  // 删除账户（API 服务器）
  deleteAccount() {
    return request({
      url: '/users/me',
      method: 'delete'
    })
  }
}
