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
            <div class="header-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="header-icon">
                <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
              </svg>
            </div>
            <span class="dialog-title">{{ $t('loginDialog.title') }}</span>
          </div>
          <button @click="$emit('close')" class="close-btn" :aria-label="$t('loginDialog.close')">
            <CloseIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- 主体 -->
        <div class="dialog-body">
          <p class="login-desc">{{ $t('loginDialog.subtitle') }}</p>

          <!-- 邮箱 -->
          <div class="input-group">
            <label class="input-label">{{ $t('loginDialog.emailLabel') }}</label>
            <div class="input-row">
              <input
                v-model="email"
                type="email"
                :placeholder="$t('loginDialog.emailPlaceholder')"
                class="input-field"
                @keyup.enter="sendCode"
                :disabled="sendingCode"
              />
              <button
                @click="sendCode"
                :disabled="!isEmailValid || sendingCode || cooldown > 0"
                class="send-code-btn">
                {{ sendCodeText }}
              </button>
            </div>
          </div>

          <!-- 验证码 -->
          <div class="input-group">
            <label class="input-label">{{ $t('loginDialog.otpLabel') }}</label>
            <div class="otp-inputs">
              <input
                v-for="(_, i) in 6"
                :key="i"
                :ref="el => otpRefs[i] = el"
                v-model="otpChars[i]"
                type="text"
                maxlength="1"
                inputmode="numeric"
                pattern="[0-9]"
                class="otp-input"
                :disabled="verifying"
                @input="onOtpInput(i)"
                @keydown.backspace="onOtpBackspace(i, $event)"
                @paste="onOtpPaste"
              />
            </div>
          </div>

          <!-- 错误信息 -->
          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

          <!-- 登录按钮 -->
          <button
            @click="verifyAndLogin"
            :disabled="!isOtpComplete || verifying"
            class="login-btn">
            <span v-if="verifying" class="spinner"></span>
            {{ verifying ? $t('loginDialog.verifying') : $t('loginDialog.loginRegister') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { ref, computed, reactive, watch } from 'vue'
import { push } from 'notivue'
import CloseIcon from '@/components/icons/CloseIcon.vue'
import authApi from '@/api/auth'
import { useAuthStore } from '@/store/modules/auth'
import { useI18n } from 'vue-i18n'

export default {
  name: 'LoginDialog',
  components: { CloseIcon },
  props: {
    show: { type: Boolean, default: false }
  },
  emits: ['close', 'loggedIn'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const email = ref('')
    const otpChars = reactive(['', '', '', '', '', ''])
    const otpRefs = reactive([])
    const sendingCode = ref(false)
    const verifying = ref(false)
    const cooldown = ref(0)
    const errorMsg = ref('')
    let cooldownTimer = null

    const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
    const isOtpComplete = computed(() => otpChars.every(c => /^[0-9]$/.test(c)))

    const sendCodeText = computed(() => {
      if (sendingCode.value) return t('loginDialog.sending')
      if (cooldown.value > 0) return `${cooldown.value}s`
      return t('loginDialog.sendOTP')
    })

    const sendCode = async () => {
      if (!isEmailValid.value || sendingCode.value || cooldown.value > 0) return
      sendingCode.value = true
      errorMsg.value = ''
      try {
        await authApi.sendEmailOTP(email.value)
        push.success({ title: t('loginDialog.sentSuccess'), duration: 1500 })
        cooldown.value = 60
        cooldownTimer = setInterval(() => {
          cooldown.value--
          if (cooldown.value <= 0) clearInterval(cooldownTimer)
        }, 1000)
      } catch (e) {
        errorMsg.value = e?.message || t('loginDialog.sendFailed')
      } finally {
        sendingCode.value = false
      }
    }

    const onOtpInput = (i) => {
      errorMsg.value = ''
      const val = otpChars[i].replace(/[^0-9]/g, '')
      otpChars[i] = val
      if (val && i < 5) {
        otpRefs[i + 1]?.focus()
      }
      if (isOtpComplete.value) {
        verifyAndLogin()
      }
    }

    const onOtpBackspace = (i, event) => {
      if (!otpChars[i] && i > 0) {
        otpChars[i - 1] = ''
        otpRefs[i - 1]?.focus()
      }
    }

    const onOtpPaste = (event) => {
      event.preventDefault()
      const text = (event.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '')
      for (let k = 0; k < Math.min(text.length, 6); k++) {
        otpChars[k] = text[k]
      }
      const nextEmpty = otpChars.findIndex(c => !c)
      if (nextEmpty >= 0) otpRefs[nextEmpty]?.focus()
      else otpRefs[5]?.focus()
      if (isOtpComplete.value) {
        verifyAndLogin()
      }
    }

    const verifyAndLogin = async () => {
      if (!isOtpComplete.value || verifying.value) return
      verifying.value = true
      errorMsg.value = ''
      const code = otpChars.join('')
      try {
        const authStore = useAuthStore()
        const user = await authStore.verifyOTP(email.value, code)
        emit('loggedIn', user)
      } catch (e) {
        errorMsg.value = e?.message || e?.response?.data?.message || t('loginDialog.verifyFailed')
      } finally {
        verifying.value = false
      }
    }

    // 关闭时重置
    watch(() => props.show, (val) => {
      if (!val) {
        email.value = ''
        otpChars.splice(0, 6, '', '', '', '', '', '')
        errorMsg.value = ''
        if (cooldownTimer) clearInterval(cooldownTimer)
        cooldown.value = 0
      }
    })

    return {
      email, otpChars, otpRefs,
      sendingCode, verifying, cooldown, errorMsg,
      isEmailValid, isOtpComplete, sendCodeText,
      sendCode, verifyAndLogin,
      onOtpInput, onOtpBackspace, onOtpPaste
    }
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
  width: 360px;
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

.close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s ease;
}
.close-btn:hover { background: rgba(0, 0, 0, 0.05); }

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}

.login-desc {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.input-row {
  display: flex;
  gap: 8px;
}

.input-field {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  color: #1e293b;
  outline: none;
  transition: border-color 0.15s;
}
.input-field:focus { border-color: #06b6d4; }
.input-field:disabled { opacity: 0.5; }

.send-code-btn {
  flex-shrink: 0;
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  background: rgba(6, 182, 212, 0.12);
  border: none;
  font-size: 12px;
  font-weight: 600;
  color: #0e7490;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.send-code-btn:hover:not(:disabled) { background: rgba(6, 182, 212, 0.22); }
.send-code-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.otp-inputs {
  display: flex;
  gap: 6px;
}

.otp-input {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.7);
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  outline: none;
  transition: border-color 0.15s;
}
.otp-input:focus { border-color: #06b6d4; }
.otp-input:disabled { opacity: 0.5; }

.error-msg {
  font-size: 12px;
  color: #ef4444;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.08);
}

.login-btn {
  width: 100%;
  height: 40px;
  border-radius: 10px;
  background: #06b6d4;
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.login-btn:hover:not(:disabled) { background: #0891b2; }
.login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.login-btn:active:not(:disabled) { transform: scale(0.97); }

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
