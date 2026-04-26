<template>
  <Transition name="fade" appear>
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center"
      @click.self>
      <!-- 不允许点击外部关闭 -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div class="dialog-container" @click.stop>
        <!-- 标题 -->
        <div class="dialog-header">
          <div class="dialog-header-left">
            <div class="header-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="header-icon">
                <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
              </svg>
            </div>
            <span class="dialog-title">{{ $t('proProgress.title') }}</span>
          </div>
        </div>

        <!-- 主体 -->
        <div class="dialog-body">
          <!-- 进度条 -->
          <div class="progress-section">
            <div class="stage-label">{{ stageLabel }}</div>
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{ width: percent + '%' }">
                <div class="progress-shine"></div>
              </div>
            </div>
            <div class="progress-percent">{{ percent }}%</div>
          </div>

          <!-- 预估时间 -->
          <div v-if="estimatedSeconds > 0" class="time-info">
            {{ $t('proProgress.estimatedRemaining', { time: formatTime(estimatedSeconds) }) }}
          </div>

          <!-- 操作按钮 -->
          <div v-if="!isCompleted && !isFailed" class="action-buttons">
            <button @click="$emit('background')" class="background-btn">{{ $t('proProgress.runInBackground') }}</button>
            <button @click="$emit('cancel')" class="cancel-btn">{{ $t('proProgress.cancelAnalysis') }}</button>
          </div>

          <!-- 完成提示 -->
          <div v-if="isCompleted" class="status-msg success">{{ $t('proProgress.completed') }}</div>
          <div v-if="isFailed" class="status-msg failed">{{ errorMsg || $t('proProgress.failed') }}</div>

          <!-- 失败/完成时的关闭按钮 -->
          <button
            v-if="isFailed || isCompleted"
            @click="$emit('close')"
            class="close-btn">
            {{ $t('proProgress.close') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'ProAnalysisProgressDialog',
  props: {
    show: { type: Boolean, default: false },
    stage: { type: String, default: 'separating' },
    stageLabel: { type: String, default: '' },
    percent: { type: Number, default: 0 },
    estimatedSeconds: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    isFailed: { type: Boolean, default: false },
    errorMsg: { type: String, default: '' }
  },
  emits: ['cancel', 'close', 'background'],
  setup() {
    const { t } = useI18n()
    const formatTime = (seconds) => {
      if (seconds < 60) return t('proProgress.seconds', { n: Math.ceil(seconds) })
      const min = Math.floor(seconds / 60)
      const sec = Math.ceil(seconds % 60)
      return t('proProgress.minutes', { min, sec })
    }
    return { formatTime }
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-enter-active .dialog-container, .fade-leave-active .dialog-container { transition: transform 0.2s ease, opacity 0.2s ease; }
.fade-enter-from .dialog-container, .fade-leave-to .dialog-container { transform: scale(0.95); opacity: 0; }

.dialog-container {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 340px;
  max-width: calc(100vw - 32px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(248, 247, 244, 0.92);
  box-shadow: 0 16px 40px -30px rgba(15, 23, 42, 0.25);
  backdrop-filter: blur(12px);
}

.dialog-header {
  z-index: 10;
  width: 100%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.dialog-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(6, 182, 212, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-icon { width: 16px; height: 16px; color: #06b6d4; }

.dialog-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stage-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.progress-track {
  position: relative;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #06b6d4, #22d3ee);
  transition: width 0.5s ease;
  position: relative;
  overflow: hidden;
}

.progress-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shine 2s ease infinite;
}

@keyframes shine {
  0% { left: -100%; }
  100% { left: 100%; }
}

.progress-percent {
  font-size: 12px;
  font-weight: 600;
  color: #06b6d4;
  text-align: right;
}

.time-info {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}

.cancel-btn {
  flex: 1;
  height: 34px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: none;
  font-size: 12px;
  font-weight: 500;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.15s;
}

.cancel-btn:hover { background: rgba(239, 68, 68, 0.18); }
.cancel-btn:active { transform: scale(0.97); }

.action-buttons {
  display: flex;
  gap: 8px;
}

.background-btn {
  flex: 1;
  height: 34px;
  border-radius: 8px;
  background: rgba(6, 182, 212, 0.1);
  border: none;
  font-size: 12px;
  font-weight: 500;
  color: #06b6d4;
  cursor: pointer;
  transition: all 0.15s;
}

.background-btn:hover { background: rgba(6, 182, 212, 0.18); }
.background-btn:active { transform: scale(0.97); }

.status-msg {
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  padding: 8px;
  border-radius: 8px;
}

.status-msg.success {
  background: rgba(34, 197, 94, 0.1);
  color: #166534;
}

.status-msg.failed {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.close-btn {
  width: 100%;
  height: 34px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.06);
  border: none;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}

.close-btn:hover { background: rgba(0, 0, 0, 0.1); }
.close-btn:active { transform: scale(0.97); }
</style>
