<template>
  <Transition name="fade" appear>
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center"
      @click.self="$emit('close')">
      <!-- 背景遮罩 -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <!-- 弹窗内容 -->
      <div class="dialog-container" @click.stop>
        <!-- 标题栏 -->
        <div class="dialog-header">
          <div class="dialog-header-left">
            <MusicAnalysisIcon class="header-icon" />
            <span class="dialog-title">选择分析模式</span>
          </div>
          <button @click="$emit('close')" class="close-btn" aria-label="关闭">
            <CloseIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- 主体内容 -->
        <div class="dialog-body">
          <!-- 普通版 -->
          <div
            class="mode-card"
            :class="{ selected: hoveredMode === 'local' }"
            @mouseenter="hoveredMode = 'local'"
            @mouseleave="hoveredMode = null"
            @click="$emit('selectLocal')">
            <div class="mode-badge free">免费</div>
            <div class="mode-icon local">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"/>
              </svg>
            </div>
            <div class="mode-info">
              <div class="mode-name">普通版</div>
              <div class="mode-desc">浏览器内音符检测，速度快，精度一般</div>
            </div>
            <ul class="mode-features">
              <li>本地 AI 音符检测</li>
              <li>动态/平稳音符双色显示</li>
              <li>无需登录</li>
            </ul>
            <button class="mode-btn local-btn">开始</button>
          </div>

          <!-- 专业版 -->
          <div
            class="mode-card pro"
            :class="{ selected: hoveredMode === 'pro' }"
            @mouseenter="hoveredMode = 'pro'"
            @mouseleave="hoveredMode = null"
            @click="$emit('selectPro')">
            <div class="mode-badge pro-badge">免费 2次/月</div>
            <div class="mode-icon pro-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
              </svg>
            </div>
            <div class="mode-info">
              <div class="mode-name">专业版</div>
              <div class="mode-desc">后端 AI 分析，高精度多轨分离</div>
            </div>
            <ul class="mode-features">
              <li>AI 音轨分离（人声/贝斯/鼓/伴奏）</li>
              <li>四色音符显示</li>
              <li>和弦 + 节拍检测</li>
              <li>鼓件分类</li>
            </ul>
            <button class="mode-btn pro-btn">开始分析</button>
            <div v-if="quotaExhausted" class="quota-hint">
              本月额度已用完，<router-link to="/pricing" class="quota-link" @click.stop="$emit('close')">升级 Pro</router-link> 无限使用
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import CloseIcon from '@/components/icons/CloseIcon.vue'
import { MusicAnalysis as MusicAnalysisIcon } from '@/components/icons'

export default {
  name: 'AnalysisModeDialog',
  components: { CloseIcon, MusicAnalysisIcon },
  props: {
    show: { type: Boolean, default: false },
    quotaExhausted: { type: Boolean, default: false }
  },
  emits: ['close', 'selectLocal', 'selectPro'],
  data() {
    return { hoveredMode: null }
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

.header-icon {
  width: 20px;
  height: 20px;
  color: #f59e0b;
  flex-shrink: 0;
}

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

.close-btn:hover { background: rgba(0, 0, 0, 0.05); color: #374151; }

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
}

.mode-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  border: 1.5px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-card:hover { background: rgba(255, 255, 255, 0.95); }
.mode-card.selected { border-color: #f59e0b; }
.mode-card.pro.selected { border-color: #06b6d4; }

.mode-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
}

.mode-badge.free { background: rgba(34, 197, 94, 0.15); color: #166534; }
.mode-badge.pro-badge { background: rgba(6, 182, 212, 0.15); color: #0e7490; }

.mode-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-icon.local { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.mode-icon.pro-icon { background: rgba(6, 182, 212, 0.12); color: #06b6d4; }
.mode-icon svg { width: 20px; height: 20px; }

.mode-info { margin-top: 2px; }
.mode-name { font-size: 15px; font-weight: 600; color: #1e293b; }
.mode-desc { font-size: 12px; color: #6b7280; margin-top: 2px; }

.mode-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mode-features li {
  font-size: 12px;
  color: #4b5563;
  padding-left: 14px;
  position: relative;
}

.mode-features li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d1d5db;
}

.mode-card.pro .mode-features li::before { background: #06b6d4; }

.mode-btn {
  margin-top: 4px;
  width: 100%;
  height: 34px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mode-btn.local-btn { background: rgba(34, 197, 94, 0.15); color: #166534; }
.mode-btn.local-btn:hover { background: rgba(34, 197, 94, 0.25); }
.mode-btn.pro-btn { background: rgba(6, 182, 212, 0.15); color: #0e7490; }
.mode-btn.pro-btn:hover { background: rgba(6, 182, 212, 0.25); }

.mode-btn:active { transform: scale(0.97); }

.quota-hint {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  margin-top: 2px;
}
.quota-link {
  color: #f59e0b;
  font-weight: 600;
  text-decoration: none;
}
.quota-link:hover { text-decoration: underline; }
</style>
