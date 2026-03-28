<template>
  <div class="min-h-screen bg-gradient-to-br from-[#fcd34d] via-[#e7e5e4] to-[#fef9c3] py-8 px-4">
    <div class="max-w-2xl mx-auto">
      <!-- 返回按钮 -->
      <button
        @click="$router.back()"
        class="flex items-center text-gray-700 mb-6 hover:text-gray-900"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        返回
      </button>

      <!-- 用户资料卡片 -->
      <div class="bg-gradient-to-br from-[#6dd9d1] via-[#92400e] to-[#fca269] rounded-3xl p-8 shadow-2xl">
        <h1 class="text-white text-2xl font-bold mb-6">个人资料</h1>

        <!-- 头像区域 -->
        <div class="flex items-center mb-8">
          <div class="relative">
            <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden">
              <img
                v-if="user.avatar_url"
                :src="user.avatar_url"
                alt="头像"
                class="w-full h-full object-cover"
              />
              <svg v-else class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
              </svg>
            </div>
            <button
              @click="showAvatarUpload = true"
              class="absolute bottom-0 right-0 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-500"
            >
              <svg class="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
              </svg>
            </button>
          </div>
          <div class="ml-4">
            <h2 class="text-white text-xl font-semibold">{{ user.username || '未设置用户名' }}</h2>
            <p class="text-white/80 text-sm">{{ user.email }}</p>
          </div>
        </div>

        <!-- 编辑表单 -->
        <div class="space-y-4">
          <div>
            <label class="block text-white/80 text-sm mb-2">用户名</label>
            <input
              v-model="form.username"
              type="text"
              placeholder="请输入用户名"
              class="w-full bg-yellow-100 rounded-2xl px-4 py-3 text-gray-700 placeholder-gray-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-white/80 text-sm mb-2">头像URL</label>
            <input
              v-model="form.avatar_url"
              type="url"
              placeholder="请输入头像图片链接"
              class="w-full bg-yellow-100 rounded-2xl px-4 py-3 text-gray-700 placeholder-gray-500 outline-none"
            />
          </div>

          <button
            @click="handleSave"
            :disabled="loading"
            class="w-full bg-yellow-100 text-gray-800 font-semibold py-4 rounded-2xl shadow-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
          >
            {{ loading ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </div>

      <!-- 危险操作区域 -->
      <div class="mt-6 bg-white rounded-3xl p-6 shadow-lg">
        <h3 class="text-gray-800 font-semibold mb-4">危险操作</h3>
        <button
          @click="showDeleteConfirm = true"
          class="w-full border-2 border-red-500 text-red-500 font-semibold py-3 rounded-2xl hover:bg-red-50 transition-colors"
        >
          删除账户
        </button>
      </div>
    </div>

    <!-- 头像上传对话框 -->
    <div v-if="showAvatarUpload" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-3xl p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold text-gray-800 mb-4">上传头像</h3>
        <input
          ref="avatarInput"
          type="file"
          accept="image/*"
          @change="handleAvatarUpload"
          class="hidden"
        />
        <div class="grid grid-cols-2 gap-4">
          <button
            @click="$refs.avatarInput?.click()"
            class="bg-yellow-100 text-gray-800 font-semibold py-3 rounded-2xl"
          >
            选择图片
          </button>
          <button
            @click="showAvatarUpload = false"
            class="bg-gray-200 text-gray-800 font-semibold py-3 rounded-2xl"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-3xl p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold text-red-600 mb-4">确认删除账户？</h3>
        <p class="text-gray-600 mb-6">此操作不可逆，您的所有数据将被永久删除。</p>
        <div class="grid grid-cols-2 gap-4">
          <button
            @click="handleDeleteAccount"
            class="bg-red-500 text-white font-semibold py-3 rounded-2xl"
          >
            确认删除
          </button>
          <button
            @click="showDeleteConfirm = false"
            class="bg-gray-200 text-gray-800 font-semibold py-3 rounded-2xl"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'
import profileApi from '@/api/profile'
import { push } from 'notivue'

const router = useRouter()
const authStore = useAuthStore()

const user = ref({
  username: '',
  email: '',
  avatar_url: ''
})

const form = ref({
  username: '',
  avatar_url: ''
})

const loading = ref(false)
const showAvatarUpload = ref(false)
const showDeleteConfirm = ref(false)

onMounted(async () => {
  await loadProfile()
})

const loadProfile = async () => {
  try {
    const profile = await profileApi.getProfile()
    user.value = profile
    form.value = {
      username: profile.username || '',
      avatar_url: profile.avatar_url || ''
    }
  } catch (error) {
    console.error('获取用户资料失败:', error)
  }
}

const handleSave = async () => {
  loading.value = true
  try {
    await profileApi.updateProfile(form.value)
    await loadProfile()
    push.success({
      title: '保存成功',
      duration: 2000
    })
  } catch (error) {
    push.error({
      title: '保存失败',
      description: error.message,
      duration: 3000
    })
  } finally {
    loading.value = false
  }
}

const handleAvatarUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // TODO: 实现图片上传到服务器获取URL
  // 这里暂时使用本地预览URL
  const url = URL.createObjectURL(file)
  form.value.avatar_url = url
  showAvatarUpload.value = false
}

const handleDeleteAccount = async () => {
  const success = await authStore.deleteAccount()
  if (success) {
    router.push('/')
  }
  showDeleteConfirm.value = false
}
</script>
