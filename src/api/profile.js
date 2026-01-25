import request from './index'

export default {
  // 获取用户资料
  getProfile() {
    return request({
      url: '/v1/profile',
      method: 'get'
    })
  },

  // 更新用户资料
  updateProfile(data) {
    return request({
      url: '/v1/profile',
      method: 'put',
      data
    })
  }
}
