<template>
  <Transition name="fade" appear>
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center"
      @click.self="$emit('close')">
      <!-- 背景遮罩 -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <!-- 弹窗内容 -->
      <div class="progress-dialog">
        <!-- 图标和标题 -->
        <div class="dialog-header">
          <div class="vinyl-container">
            <div class="vinyl">
              <div class="vinyl-label"></div>
              <div class="vinyl-center"></div>
            </div>
          </div>
          <div class="header-text">
            <h3 class="dialog-title">{{ title || '音频分析中' }}</h3>
            <p class="dialog-message">{{ message || '正在识别音符，请稍候...' }}</p>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="progress-section">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :class="{ 'completed': progress >= 100 }"
              :style="{ width: Math.min(progress, 100) + '%' }"
            ></div>
          </div>

          <!-- 进度信息 -->
          <div class="progress-info">
            <div class="progress-percent">
              <span class="percent-value" :class="{ 'completed': progress >= 100 }">
                {{ Math.round(progress) }}
              </span>
              <span class="percent-sign">%</span>
            </div>
            <div class="progress-time">
              <svg class="time-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="time-text">{{ displayTimeInfo }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
export default {
  name: 'CustomProgressNotification',
  props: {
    show: {
      type: Boolean,
      default: false
    },
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
  emits: ['close'],
  data() {
    return {
      internalElapsedTime: 0,
      timerInterval: null
    }
  },
  computed: {
    useInternalTiming() {
      return this.currentTime === '0:00' && this.totalTime === '0:00'
    },
    displayCurrentTime() {
      if (!this.useInternalTiming) {
        return this.currentTime
      }
      return this.formatTime(this.internalElapsedTime)
    },
    displayTotalTime() {
      if (!this.useInternalTiming) {
        return this.totalTime
      }
      if (this.progress <= 0) {
        return '--:--'
      }
      const estimatedTotal = this.internalElapsedTime / (this.progress / 100)
      return this.formatTime(Math.round(estimatedTotal))
    },
    displayTimeInfo() {
      if (this.useInternalTiming) {
        return `${this.displayCurrentTime} / ${this.displayTotalTime}`
      }
      if (this.currentTime && this.totalTime) {
        return `${this.currentTime} / ${this.totalTime}`
      }
      return ''
    }
  },
  watch: {
    show(newVal) {
      if (newVal && this.useInternalTiming) {
        this.startTimer()
      } else if (!newVal) {
        this.stopTimer()
      }
    }
  },
  mounted() {
    if (this.show && this.useInternalTiming) {
      this.startTimer()
    }
  },
  beforeUnmount() {
    this.stopTimer()
  },
  methods: {
    formatTime(seconds) {
      if (seconds < 0 || !isFinite(seconds)) {
        return '--:--'
      }
      const m = Math.floor(seconds / 60)
      const s = Math.floor(seconds % 60)
      return `${m}:${s.toString().padStart(2, '0')}`
    },
    startTimer() {
      this.internalElapsedTime = 0
      this.timerInterval = setInterval(() => {
        this.internalElapsedTime++
      }, 1000)
    },
    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }
    }
  }
}
</script>

<style scoped>
/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .progress-dialog,
.fade-leave-active .progress-dialog {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.fade-enter-from .progress-dialog,
.fade-leave-to .progress-dialog {
  transform: scale(0.95);
  opacity: 0;
}

/* 弹窗容器 - 浅色毛玻璃风格 */
.progress-dialog {
  position: relative;
  border-radius: 16px;
  padding: 20px;
  max-width: 320px;
  width: 100%;
  margin: 16px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(248, 247, 244, 0.85);
  box-shadow: 0 16px 40px -30px rgba(15, 23, 42, 0.25);
  backdrop-filter: blur(12px);
}

/* 头部区域 */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

/* 唱片动画 */
.vinyl-container {
  flex-shrink: 0;
}

.vinyl {
  width: 44px;
  height: 44px;
  background: conic-gradient(
    from 0deg,
    #1a1a1a 0deg,
    #333 30deg,
    #1a1a1a 60deg,
    #333 90deg,
    #1a1a1a 120deg,
    #333 150deg,
    #1a1a1a 180deg,
    #333 210deg,
    #1a1a1a 240deg,
    #333 270deg,
    #1a1a1a 300deg,
    #333 330deg,
    #1a1a1a 360deg
  );
  border-radius: 50%;
  animation: spin 2s linear infinite;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.vinyl-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #22c55e, #4ade80);
  border-radius: 50%;
}

.vinyl-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 5px;
  height: 5px;
  background: #f8f7f4;
  border-radius: 50%;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 文字区域 */
.header-text {
  flex: 1;
  min-width: 0;
}

.dialog-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 3px 0;
}

.dialog-message {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

/* 进度区域 */
.progress-section {
  margin-bottom: 12px;
}

.progress-bar {
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #4ade80);
  border-radius: 3px;
  transition: width 0.3s ease-out;
  position: relative;
}

.progress-fill.completed {
  background: linear-gradient(90deg, #22c55e, #4ade80);
}

/* 进度条光泽动画 */
.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shine 2s ease-in-out infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-fill.completed::after {
  animation: none;
}

/* 进度信息 */
.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.progress-percent {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.percent-value {
  font-size: 22px;
  font-weight: 700;
  color: #22c55e;
  font-variant-numeric: tabular-nums;
}

.percent-value.completed {
  color: #22c55e;
}

.percent-sign {
  font-size: 13px;
  color: #6b7280;
}

.progress-time {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #6b7280;
}

.time-icon {
  width: 13px;
  height: 13px;
}

.time-text {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
</style>
