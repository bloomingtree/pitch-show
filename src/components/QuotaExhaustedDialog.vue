<template>
  <Transition name="fade" appear>
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center"
      @click.self="$emit('close')">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div class="dialog-container" @click.stop>
        <!-- 标题栏 -->
        <div class="dialog-header">
          <div class="dialog-header-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="header-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span class="dialog-title">{{ $t('quotaExhausted.title') }}</span>
          </div>
          <button @click="$emit('close')" class="close-btn" :aria-label="$t('quotaExhausted.close')">
            <CloseIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- 主体 -->
        <div class="dialog-body">
          <div class="info-text">
            <template v-if="quotaType === 'daily'">
              <p>{{ $t('quotaExhausted.dailyExhausted', { limit: quota.daily_limit }) }}</p>
              <p>{{ $t('quotaExhausted.dailyUpgrade') }}</p>
            </template>
            <template v-else>
              <p>{{ $t('quotaExhausted.monthlyExhausted', { limit: formatLimit(quota.monthly_limit) }) }}</p>
              <p>{{ $t('quotaExhausted.monthlyUpgrade') }}</p>
            </template>
          </div>

          <div class="quota-visual">
            <div class="quota-bar-track">
              <div class="quota-bar-fill used" :style="{ width: '100%' }"></div>
            </div>
            <div class="quota-label">
              <template v-if="quotaType === 'daily'">
                <span>{{ $t('quotaExhausted.dailyUsed', { used: quota.daily_used }) }}</span>
              </template>
              <template v-else>
                <span>{{ $t('quotaExhausted.monthlyUsed', { used: quota.monthly_used }) }}</span>
              </template>
            </div>
          </div>

          <div class="action-buttons">
            <button @click="$emit('close')" class="action-btn cancel">{{ $t('quotaExhausted.gotIt') }}</button>
            <button @click="goPricing" class="action-btn confirm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="btn-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              {{ $t('quotaExhausted.upgrade') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CloseIcon from '@/components/icons/CloseIcon.vue'

export default {
  name: 'QuotaExhaustedDialog',
  components: { CloseIcon },
  props: {
    show: { type: Boolean, default: false },
    quotaType: { type: String, default: 'monthly' },
    quota: { type: Object, default: () => ({ monthly_used: 0, monthly_limit: 1, daily_used: 0, daily_limit: -1, plan_level: 'free' }) }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const router = useRouter()
    const { t } = useI18n()

    const goPricing = () => {
      emit('close')
      router.push('/pricing')
    }

    const formatLimit = (value) => {
      if (value === -1) return t('quotaExhausted.unlimited')
      return value
    }

    return { goPricing, formatLimit }
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
  width: 380px;
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
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.dialog-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.header-icon { width: 20px; height: 20px; color: #f59e0b; flex-shrink: 0; }
.dialog-title { font-size: 14px; font-weight: 600; color: #1e293b; }
.close-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; padding: 0; border-radius: 8px;
  background: transparent; border: none; color: #6b7280; cursor: pointer;
  transition: all 0.15s ease;
}
.close-btn:hover { background: rgba(0, 0, 0, 0.05); color: #374151; }

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}

.info-text {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.7;
}
.info-text p { margin: 0; }
.info-text p + p { margin-top: 6px; }
.info-text strong { color: #1e293b; }

.quota-visual {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.quota-bar-track {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}
.quota-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}
.quota-bar-fill.used { background: #ef4444; }
.quota-label {
  font-size: 11px;
  color: #9ca3af;
}

.action-buttons {
  display: flex;
  gap: 8px;
}
.action-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}
.action-btn:active { transform: scale(0.97); }
.action-btn.cancel {
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
}
.action-btn.cancel:hover { background: rgba(0, 0, 0, 0.08); }
.action-btn.confirm {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: white;
}
.action-btn.confirm:hover { opacity: 0.9; }
.btn-icon { width: 16px; height: 16px; }
</style>
