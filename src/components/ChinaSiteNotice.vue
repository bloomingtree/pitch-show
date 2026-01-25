<template>
  <Transition name="notice">
    <div v-if="showNotice" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        <!-- 头部 -->
        <div class="bg-gradient-to-r from-pink-300 to-rose-400 px-6 py-4 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            <h2 class="text-xl font-bold text-white">欢迎使用国内站点</h2>
          </div>
          <button @click="closeNotice" class="text-white/80 hover:text-white transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- 内容区 -->
        <div class="p-6">
          <p class="text-gray-700 mb-6 text-center">
            检测到您可能来自中国大陆地区，我们为您部署了国内访问站点，
            <span class="text-pink-600 font-semibold">访问速度更快</span>，且有
            <span class="text-rose-500 font-semibold">最新版本</span>的功能更新！
          </p>

          <!-- 图片轮播 -->
          <div class="relative mb-6">
            <div class="aspect-video rounded-2xl overflow-hidden bg-gray-100">
              <Transition name="slide" mode="out-in">
                <img
                  :key="currentImage"
                  :src="images[currentImage]"
                  :alt="`预览图 ${currentImage + 1}`"
                  class="w-full h-full object-cover"
                >
              </Transition>
            </div>

            <!-- 左右切换按钮 -->
            <button
              @click="prevImage"
              class="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
            >
              <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button
              @click="nextImage"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
            >
              <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>

            <!-- 指示器 -->
            <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
              <button
                v-for="(_, index) in images"
                :key="index"
                @click="currentImage = index"
                class="w-2 h-2 rounded-full transition-all"
                :class="currentImage === index ? 'bg-white w-6' : 'bg-white/50'"
              />
            </div>
          </div>

          <!-- 按钮组 -->
          <div class="flex space-x-3">
            <a
              href="https://shiyin.notalabs.cn/"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 px-6 py-3 bg-gradient-to-r from-pink-400 to-rose-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 text-center"
            >
              访问国内站点
            </a>
            <button
              @click="closeNotice"
              class="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-all"
            >
              稍后再说
            </button>
          </div>

          <!-- 不再提示 -->
          <div class="mt-4 flex items-center justify-center">
            <label class="flex items-center space-x-2 text-sm text-gray-500 cursor-pointer">
              <input
                v-model="dontShowAgain"
                type="checkbox"
                class="w-4 h-4 text-pink-500 rounded border-gray-300 focus:ring-pink-400"
              >
              <span>不再显示此提示</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const STORAGE_KEY = 'china_site_notice_dismissed'

const showNotice = ref(false)
const dontShowAgain = ref(false)
const currentImage = ref(0)

// 预览图片
const images = ref([
  '/china-preview-1.webp',
  '/china-preview-2.webp',
  '/china-preview-3.webp'
])

// 检测是否应该显示提示
const checkShouldShow = () => {
  // 检查是否已经永久关闭
  if (localStorage.getItem(STORAGE_KEY) === 'true') {
    return false
  }

  // 检查语言设置
  const savedLang = localStorage.getItem('language')
  const browserLang = navigator.language || navigator.userLanguage
  const isChineseUser = savedLang === 'zh' || browserLang.toLowerCase().includes('zh')

  // 检查时区（中国时区是 UTC+8）
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const isChinaTimezone = timezone === 'Asia/Shanghai' ||
                         timezone === 'Asia/Chongqing' ||
                         timezone === 'Asia/Harbin' ||
                         timezone === 'Asia/Beijing'

  return isChineseUser || isChinaTimezone
}

// 切换图片
const nextImage = () => {
  currentImage.value = (currentImage.value + 1) % images.value.length
}

const prevImage = () => {
  currentImage.value = (currentImage.value - 1 + images.value.length) % images.value.length
}

// 关闭提示
const closeNotice = () => {
  if (dontShowAgain.value) {
    localStorage.setItem(STORAGE_KEY, 'true')
  }
  showNotice.value = false
}

// 自动轮播
let autoPlayInterval = null

const startAutoPlay = () => {
  autoPlayInterval = setInterval(() => {
    nextImage()
  }, 4000)
}

const stopAutoPlay = () => {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval)
    autoPlayInterval = null
  }
}

onMounted(() => {
  if (checkShouldShow()) {
    showNotice.value = true
    startAutoPlay()
  }
})

// 组件卸载时清除定时器
import { onUnmounted } from 'vue'
onUnmounted(() => {
  stopAutoPlay()
})
</script>

<style scoped>
.notice-enter-active,
.notice-leave-active {
  transition: opacity 0.3s ease;
}

.notice-enter-from,
.notice-leave-to {
  opacity: 0;
}

.notice-enter-active .bg-white,
.notice-leave-active .bg-white {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.notice-enter-from .bg-white,
.notice-leave-to .bg-white {
  transform: scale(0.9);
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}
</style>
