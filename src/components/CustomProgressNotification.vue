<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
      <div class="text-center">
        <div class="mb-4">
          <svg class="w-12 h-12 text-blue-500 mx-auto animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">{{ title }}</h3>
        <p class="text-sm text-gray-600 mb-4">{{ message }}</p>

        <!-- 进度条 -->
        <div class="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
          <div
            class="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
            :style="{ width: progress + '%' }"
          ></div>
        </div>

        <!-- 进度信息 -->
        <div class="flex justify-between items-center text-sm text-gray-500 mb-2">
          <span>{{ Math.round(progress) }}%</span>
          <span>{{ displayTimeInfo }}</span>
        </div>

        <!-- 进度消息 -->
        <p v-if="progressMessage" class="text-xs text-gray-400">{{ progressMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CustomProgressNotification',
  props: {
    title: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      default: ''
    },
    progress: {
      type: Number,
      default: 0
    },
    progressMessage: {
      type: String,
      default: ''
    },
    currentTime: {
      type: String,
      default: '0:00'
    },
    totalTime: {
      type: String,
      default: '0:00'
    }
  },
  data() {
    return {
      internalElapsedTime: 0,  // 内部计时（秒）
      timerInterval: null
    }
  },
  computed: {
    /**
     * 判断是否使用内置计时
     * 如果外部传入了非默认的时间值，则使用外部传入的
     */
    useInternalTiming() {
      // 如果 currentTime 或 totalTime 不是默认值，说明外部传入了
      return this.currentTime === '0:00' && this.totalTime === '0:00'
    },

    /**
     * 显示用的当前时间
     */
    displayCurrentTime() {
      if (!this.useInternalTiming) {
        return this.currentTime
      }
      return this.formatTime(this.internalElapsedTime)
    },

    /**
     * 显示用的总时间（预估）
     */
    displayTotalTime() {
      if (!this.useInternalTiming) {
        return this.totalTime
      }
      // 进度为 0 时无法预估，显示占位符
      if (this.progress <= 0) {
        return '--:--'
      }
      // 根据当前进度和已耗时计算预估总耗时
      const estimatedTotal = this.internalElapsedTime / (this.progress / 100)
      return this.formatTime(Math.round(estimatedTotal))
    },

    /**
     * 时间信息文本
     */
    displayTimeInfo() {
      if (this.useInternalTiming) {
        return `${this.displayCurrentTime} / ${this.displayTotalTime}`
      }
      // 外部传入模式，只在有时间时显示
      if (this.currentTime && this.totalTime) {
        return `${this.currentTime} / ${this.totalTime}`
      }
      return ''
    }
  },
  mounted() {
    // 使用内置计时时启动计时器
    if (this.useInternalTiming) {
      this.startTimer()
    }
  },
  beforeUnmount() {
    this.stopTimer()
  },
  methods: {
    /**
     * 格式化时间为 M:SS 格式
     */
    formatTime(seconds) {
      if (seconds < 0 || !isFinite(seconds)) {
        return '--:--'
      }
      const m = Math.floor(seconds / 60)
      const s = Math.floor(seconds % 60)
      return `${m}:${s.toString().padStart(2, '0')}`
    },

    /**
     * 启动计时器
     */
    startTimer() {
      this.internalElapsedTime = 0
      this.timerInterval = setInterval(() => {
        this.internalElapsedTime++
      }, 1000)
    },

    /**
     * 停止计时器
     */
    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }
    },

    /**
     * 格式化字节数
     */
    formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  }
}
</script>
