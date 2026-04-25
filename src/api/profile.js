import request from './index'

export default {
  // 获取用户资料
  getProfile() {
    return request({
      url: '/users/me',
      method: 'get'
    })
  },

  // 更新用户资料
  // PUT /users/me
  updateProfile(data) {
    return request({
      url: '/users/me',
      method: 'put',
      data
    })
  },

  // 更新用户设置（合并更新，只传需要修改的字段）
  // PUT /users/me/settings
  updateSettings(data) {
    return request({
      url: '/users/me/settings',
      method: 'put',
      data
    })
  }
}
