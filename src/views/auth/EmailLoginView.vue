<template>
  <div class="min-h-screen bg-gradient-to-br from-[#fcd34d] via-[#e7e5e4] to-[#fef9c3] flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-gradient-to-br from-[#6dd9d1] via-[#92400e] to-[#fca269] rounded-3xl p-8 shadow-2xl">
      <!-- 声波图标 -->
      <div class="flex justify-center mb-8">
        <div class="flex items-end space-x-1">
          <div class="w-1 h-4 bg-white rounded-full"></div>
          <div class="w-1 h-6 bg-white rounded-full"></div>
          <div class="w-1 h-8 bg-white rounded-full"></div>
          <div class="w-1 h-6 bg-white rounded-full"></div>
          <div class="w-1 h-4 bg-white rounded-full"></div>
        </div>
      </div>

      <!-- 标题 -->
      <h1 class="text-white text-3xl font-bold text-center mb-4">
        进入音乐工作室
      </h1>
      <p class="text-white/80 text-center text-sm mb-8">
        使用邮箱验证码登录
      </p>

      <!-- 步骤1：输入邮箱 -->
      <div v-if="step === 1">
        <div class="mb-4">
          <div class="bg-yellow-100 rounded-2xl px-4 pt-3 shadow-lg">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <input
                v-model="email"
                type="email"
                @blur="validateEmail"
                placeholder="请输入电子邮箱"
                class="flex-1 bg-transparent text-gray-700 placeholder-gray-500 outline-none text-sm"
              />
            </div>
            <p v-if="emailError" class="text-red-500 text-sm ml-2 mt-1">{{ emailError }}</p>
            <div v-else class="text-red-100 text-sm pt-4 pl-2"></div>
          </div>
        </div>

        <button
          @click="handleSendOTP"
          :disabled="loading || countdown > 0"
          class="w-full bg-yellow-100 text-gray-800 font-semibold py-4 rounded-2xl mb-8 shadow-lg hover:bg-yellow-200 transition-colors text-lg disabled:opacity-50"
        >
          {{ loading ? '发送中...' : countdown > 0 ? `${countdown}秒后重试` : '发送验证码' }}
        </button>
      </div>

      <!-- 步骤2：输入验证码 -->
      <div v-if="step === 2">
        <div class="mb-4">
          <div class="bg-yellow-100 rounded-2xl px-4 pt-3 shadow-lg">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <input
                v-model="otp"
                type="text"
                maxlength="6"
                placeholder="请输入6位验证码"
                class="flex-1 bg-transparent text-gray-700 placeholder-gray-500 outline-none text-sm text-center text-xl tracking-widest"
              />
            </div>
            <p v-if="otpError" class="text-red-500 text-sm ml-2 mt-1">{{ otpError }}</p>
          </div>
        </div>

        <div class="text-center mb-6">
          <p class="text-white/80 text-sm">验证码已发送至 {{ email }}</p>
          <button
            @click="step = 1"
            class="text-white text-sm underline mt-2"
          >
            修改邮箱
          </button>
        </div>

        <button
          @click="handleVerifyOTP"
          :disabled="loading || otp.length !== 6"
          class="w-full bg-yellow-100 text-gray-800 font-semibold py-4 rounded-2xl mb-8 shadow-lg hover:bg-yellow-200 transition-colors text-lg disabled:opacity-50"
        >
          {{ loading ? '验证中...' : '登录' }}
        </button>
      </div>

      <!-- 底部声波 -->
      <div class="flex justify-center space-x-1">
        <div class="w-1 h-2 bg-white opacity-60 rounded-full"></div>
        <div class="w-1 h-3 bg-white opacity-80 rounded-full"></div>
        <div class="w-1 h-4 bg-white rounded-full"></div>
        <div class="w-1 h-3 bg-white opacity-80 rounded-full"></div>
        <div class="w-1 h-2 bg-white opacity-60 rounded-full"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'

const router = useRouter()
const authStore = useAuthStore()

const step = ref(1)
const email = ref('')
const otp = ref('')
const emailError = ref('')
const otpError = ref('')
const countdown = ref(0)
const loading = ref(false)

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email.value) {
    emailError.value = '请输入电子邮箱'
  } else if (!emailRegex.test(email.value)) {
    emailError.value = '邮箱格式不正确'
  } else {
    emailError.value = ''
  }
}

const handleSendOTP = async () => {
  validateEmail()
  if (emailError.value) return

  loading.value = true
  const success = await authStore.sendOTP(email.value)
  loading.value = false

  if (success) {
    step.value = 2
    // 开始倒计时
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  }
}

const handleVerifyOTP = async () => {
  if (otp.value.length !== 6) {
    otpError.value = '请输入6位验证码'
    return
  }

  loading.value = true
  const success = await authStore.verifyOTP(email.value, otp.value)
  loading.value = false

  if (success) {
    const redirect = router.currentRoute.value.query.redirect || '/'
    router.push(redirect)
  }
}
</script>
