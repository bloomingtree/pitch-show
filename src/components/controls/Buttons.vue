<template>
  <button :class="buttonClasses" :disabled="disabled || loading" @click="handleClick">
    <span v-if="loading" class="btn-loading-indicator">
      <svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.3" />
        <path d="M12 2a10 10 0 1 0 10 10 0 0-6.14" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
    <slot v-else>
      <component v-if="$slots.icon" :is="$slots.icon" class="btn-icon-slot" />
      <span v-else class="btn-text"><slot /></span>
    </slot>
  </button>
</template>

<script>
export default {
  name: 'Buttons',
  props: {
    variant: {
      type: String,
      default: 'primary',
      validator: (v) => ['primary', 'secondary', 'outline', 'text', 'glass', 'play', 'success', 'danger', 'warning'].includes(v)
    },
    size: {
      type: String,
      default: 'md',
      validator: (v) => ['sm', 'md', 'lg'].includes(v)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    iconOnly: {
      type: Boolean,
      default: false
    },
    ripple: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click'],
  computed: {
    buttonClasses() {
      const classes = ['btn']

      // 变体
      classes.push(`btn-${this.variant}`)

      // 尺寸
      if (this.size !== 'md') {
        classes.push(`btn-${this.size}`)
      }

      // 图标按钮
      if (this.iconOnly) {
        classes.push('btn-icon')
      }

      // 加载状态
      if (this.loading) {
        classes.push('btn-loading')
      }

      // 波纹效果
      if (this.ripple) {
        classes.push('ripple')
      }

      // 禁用状态
      if (this.disabled) {
        classes.push('disabled')
      }

      return classes.join(' ')
    }
  },
  methods: {
    handleClick(e) {
      if (!this.disabled && !this.loading) {
        this.$emit('click', e)

        // 波纹效果
        if (this.ripple) {
          this.createRipple(e)
        }
      }
    },
    createRipple(e) {
      const button = e.currentTarget
      const ripple = button.querySelector('.ripple-effect') || document.createElement('span')
      ripple.className = 'ripple-effect'

      const rect = button.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2

      ripple.style.width = ripple.style.height = `${size}px`
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`

      if (!button.contains(ripple)) {
        button.appendChild(ripple)
      }

      // 动画结束后移除
      setTimeout(() => {
        ripple.remove()
      }, 600)
    }
  }
}
</script>

<style scoped>
/* ========== 基础按钮 ========== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease-out;
  outline: none;
  user-select: none;
  position: relative;
  overflow: hidden;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* ========== 主要按钮 ========== */
.btn-primary {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(249, 115, 22, 0.3);
}

/* ========== 次要按钮 ========== */
.btn-secondary {
  background: rgba(255, 255, 255, 0.9);
  color: #374151;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(0, 0, 0, 0.15);
}

.btn-secondary:active:not(:disabled) {
  background: rgba(255, 255, 255, 0.8);
}

/* ========== 轮廓按钮 ========== */
.btn-outline {
  background: transparent;
  color: #f97316;
  border: 2px solid #f97316;
}

.btn-outline:hover:not(:disabled) {
  background: rgba(249, 115, 22, 0.1);
}

.btn-outline:active:not(:disabled) {
  background: rgba(249, 115, 22, 0.2);
}

/* ========== 文字按钮 ========== */
.btn-text {
  background: transparent;
  color: #f97316;
  padding: 10px 12px;
}

.btn-text:hover:not(:disabled) {
  background: rgba(249, 115, 22, 0.1);
}

/* ========== 图标按钮 ========== */
.btn-icon {
  padding: 0;
  border-radius: 50%;
}

.btn-sm.btn-icon {
  width: 32px;
  height: 32px;
}

.btn-md.btn-icon,
.btn-icon {
  width: 40px;
  height: 40px;
}

.btn-lg.btn-icon {
  width: 48px;
  height: 48px;
}

/* ========== 玻璃态按钮 ========== */
.btn-glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-glass:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

/* ========== 播放按钮 ========== */
.btn-play {
  width: 56px;
  height: 56px;
  padding: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: white;
  box-shadow: 0 4px 20px rgba(249, 115, 22, 0.4);
}

.btn-play:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 6px 24px rgba(249, 115, 22, 0.5);
}

.btn-play:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-play svg {
  width: 24px;
  height: 24px;
  margin-left: 3px;
}

/* ========== 颜色变体 ========== */
.btn-success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.btn-warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

/* ========== 尺寸变体 ========== */
.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 6px;
}

.btn-lg {
  padding: 14px 28px;
  font-size: 16px;
  border-radius: 10px;
}

/* ========== 按钮组 ========== */
.btn-group {
  display: inline-flex;
}

.btn-group .btn {
  border-radius: 0;
}

.btn-group .btn:first-child {
  border-radius: 8px 0 0 8px;
}

.btn-group .btn:last-child {
  border-radius: 0 8px 8px 0;
}

.btn-group .btn:not(:last-child) {
  border-right: 1px solid rgba(0, 0, 0, 0.1);
}

/* ========== 加载状态 ========== */
.btn-loading {
  color: transparent !important;
  pointer-events: none;
}

.btn-loading-indicator {
  position: absolute;
  width: 16px;
  height: 16px;
}

.btn-loading-indicator .spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ========== 波纹效果 ========== */
.ripple {
  position: relative;
  overflow: hidden;
}

.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transform: scale(0);
  animation: ripple-animation 0.6s ease-out;
  pointer-events: none;
}

@keyframes ripple-animation {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* ========== 图标槽 ========== */
.btn-icon-slot {
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon-slot svg {
  width: 1em;
  height: 1em;
}
</style>
