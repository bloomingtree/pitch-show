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
            <MusicNoteDotIcon class="header-icon" />
            <span class="dialog-title">音符显示设置</span>
          </div>
          <button @click="$emit('close')" class="close-btn" aria-label="关闭设置">
            <CloseIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- 主体内容 -->
        <div class="dialog-body">
          <!-- 外观设置 -->
          <div class="settings-group">
            <div class="group-title">外观设置</div>
            <p class="group-desc">选择音符的配色方案。动态音符是指有颤音或揉弦等技巧的音符。</p>

            <!-- 颜色方案列表 -->
            <div class="color-scheme-list">
              <button
                v-for="(scheme, key) in colorSchemes"
                :key="key"
                @click="selectColorScheme(key)"
                :class="['color-scheme-card', { selected: localColorScheme === key }]">
                <div class="color-preview">
                  <div class="color-dot" :style="{ background: scheme.dynamic }"></div>
                  <div class="color-dot" :style="{ background: scheme.stable }"></div>
                </div>
                <div class="color-info">
                  <div class="color-name">{{ scheme.name }}</div>
                  <div class="color-desc">{{ scheme.desc }}</div>
                </div>
                <div v-if="localColorScheme === key" class="check-indicator">
                  <CheckIcon class="w-4 h-4" />
                </div>
              </button>
            </div>

            <!-- 统计信息 -->
            <div v-if="stats" class="stats-bar">
              <div class="stat-item">
                <span class="stat-value">{{ stats.total }}</span>
                <span class="stat-label">总音符数</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item highlight">
                <span class="stat-value">{{ stats.byType.dynamic ? ((stats.byType.dynamic / stats.total) * 100).toFixed(1) : '0.0' }}%</span>
                <span class="stat-label">技巧音符</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-value">{{ stats.byType.dynamic || 0 }}</span>
                <span class="stat-label">技巧音符数</span>
              </div>
            </div>
          </div>

          <!-- 分隔线 -->
          <hr class="section-divider" />

          <!-- 过滤设置 -->
          <div class="settings-group">
            <div class="group-title">过滤设置</div>
            <p class="group-desc">隐藏不需要的音符，让谱面更清晰。</p>

            <!-- 自动连接断音（优先级高于最短显示时长） -->
            <div class="toggle-item">
              <div class="toggle-header">
                <label class="toggle-label">
                  <MergeIcon class="label-icon" />
                  自动连接断音
                </label>
                <button
                  type="button"
                  role="switch"
                  :aria-checked="localFilterSettings.enableMerge"
                  :class="['toggle-switch', { active: localFilterSettings.enableMerge }]"
                  @click="toggleMerge">
                  <span class="toggle-thumb" />
                </button>
              </div>
              <p class="toggle-help">把同一音高的断续音连接成一条长音符</p>
            </div>

            <!-- 连接间隔（更多选项） -->
            <div v-if="localFilterSettings.enableMerge" class="slider-item collapsible">
              <div class="slider-header">
                <label class="slider-label">
                  <GapIcon class="label-icon" />
                  连接间隔
                </label>
                <span class="slider-value">{{ localFilterSettings.mergeGap.toFixed(2) }}秒</span>
              </div>
              <div class="slider-track-wrapper">
                <div class="slider-track" :style="{ '--fill-percent': (localFilterSettings.mergeGap / 0.5) * 100 + '%' }">
                  <div class="slider-fill secondary" :style="{ width: (localFilterSettings.mergeGap / 0.5) * 100 + '%' }"></div>
                  <input
                    type="range"
                    :value="localFilterSettings.mergeGap"
                    @input="handleSliderInput('mergeGap', $event.target.value)"
                    :min="0"
                    :max="0.5"
                    :step="0.01"
                    class="slider-input"
                  />
                </div>
              </div>
              <p class="slider-help">两个音之间最多隔多久还能连起来</p>
            </div>

            <!-- 最短显示时长 -->
            <div class="slider-item">
              <div class="slider-header">
                <label class="slider-label">
                  <ClockIcon class="label-icon" />
                  最短显示时长
                </label>
                <span class="slider-value">{{ localFilterSettings.minDuration.toFixed(2) }}秒</span>
              </div>
              <div class="slider-track-wrapper">
                <div class="slider-track" :style="{ '--fill-percent': (localFilterSettings.minDuration / 1) * 100 + '%' }">
                  <div class="slider-fill" :style="{ width: (localFilterSettings.minDuration / 1) * 100 + '%' }"></div>
                  <input
                    type="range"
                    :value="localFilterSettings.minDuration"
                    @input="handleSliderInput('minDuration', $event.target.value)"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    class="slider-input"
                  />
                </div>
              </div>
              <p class="slider-help">隐藏短于 {{ localFilterSettings.minDuration }} 秒的音符（通常是杂音）</p>
            </div>
          </div>

          <!-- 分隔线 -->
          <hr class="section-divider" />

          <!-- 底部按钮 -->
          <div class="action-buttons">
            <button @click="resetFilterSettings" class="action-btn secondary">
              <ResetIcon class="btn-icon" />
              恢复默认
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import MusicNoteDotIcon from '@/components/icons/MusicNoteDotIcon.vue'
import CloseIcon from '@/components/icons/CloseIcon.vue'
import CheckIcon from '@/components/icons/CheckIcon.vue'
import ResetIcon from '@/components/icons/ResetIcon.vue'
import { DEFAULT_FILTER_SETTINGS } from '@/js/configManager'

// 简单的内联图标组件
const ClockIcon = {
  template: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" class="w-3.5 h-3.5"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clip-rule="evenodd"/></svg>`
}
const MergeIcon = {
  template: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" class="w-3.5 h-3.5"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>`
}
const GapIcon = {
  template: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" class="w-3.5 h-3.5"><path fill-rule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75V19.5a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd"/></svg>`
}

export default {
  name: 'DynamicInfoDialog',
  components: {
    MusicNoteDotIcon,
    CloseIcon,
    CheckIcon,
    ResetIcon,
    ClockIcon,
    MergeIcon,
    GapIcon
  },
  props: {
    show: {
      type: Boolean,
      default: false
    },
    stats: {
      type: Object,
      default: null
    },
    currentScheme: {
      type: String,
      default: 'sunset'
    },
    filterSettings: {
      type: Object,
      default: () => ({ ...DEFAULT_FILTER_SETTINGS })
    }
  },
  emits: ['close', 'update:currentScheme', 'update:filterSettings'],
  data() {
    return {
      colorSchemes: {
        ocean: {
          name: '海洋',
          desc: '蓝灰配色，清爽干净',
          dynamic: '#0EA5E9',
          stable: '#64748B'
        },
        sunset: {
          name: '落日',
          desc: '橙粉配色，温暖活力',
          dynamic: '#FF6B35',
          stable: '#F472B6'
        },
        forest: {
          name: '森林',
          desc: '绿紫配色，自然神秘',
          dynamic: '#10B981',
          stable: '#8B5CF6'
        }
      },
      localColorScheme: this.currentScheme,
      localFilterSettings: { ...this.filterSettings }
    }
  },
  watch: {
    currentScheme: {
      handler(newVal) {
        this.localColorScheme = newVal
      },
      immediate: true
    },
    filterSettings: {
      handler(newVal) {
        if (JSON.stringify(newVal) !== JSON.stringify(this.localFilterSettings)) {
          this.localFilterSettings = { ...newVal }
        }
      },
      deep: true,
      immediate: true
    },
    localColorScheme(newVal) {
      this.$emit('update:currentScheme', newVal)
    },
    localFilterSettings: {
      handler(newVal) {
        if (this._debouncedEmit) {
          clearTimeout(this._debouncedEmit)
        }
        this._debouncedEmit = setTimeout(() => {
          this.$emit('update:filterSettings', { ...newVal })
        }, 50)
      },
      deep: true
    }
  },
  methods: {
    selectColorScheme(scheme) {
      this.localColorScheme = scheme
    },
    handleSliderInput(key, value) {
      this.localFilterSettings[key] = parseFloat(value)
    },
    toggleMerge() {
      this.localFilterSettings.enableMerge = !this.localFilterSettings.enableMerge
    },
    resetFilterSettings() {
      this.localFilterSettings = { ...DEFAULT_FILTER_SETTINGS }
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

.fade-enter-active .dialog-container,
.fade-leave-active .dialog-container {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.fade-enter-from .dialog-container,
.fade-leave-to .dialog-container {
  transform: scale(0.95);
  opacity: 0;
}

/* 弹窗容器 - HeroUI 风格 */
.dialog-container {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 320px;
  max-width: calc(100vw - 32px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(248, 247, 244, 0.85);
  box-shadow: 0 16px 40px -30px rgba(15, 23, 42, 0.25);
  backdrop-filter: blur(12px);
}

/* 标题栏 */
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
  color: #22c55e;
  flex-shrink: 0;
}

.dialog-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.close-btn {
  z-index: 0;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  padding: 0;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s ease;
  transform: translateZ(0);
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #374151;
}

.close-btn:active {
  transform: scale(0.97);
}

/* 主体内容 */
.dialog-body {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: min(78vh, 500px);
  padding: 12px;
  gap: 12px;
}

.dialog-body::-webkit-scrollbar {
  width: 6px;
}

.dialog-body::-webkit-scrollbar-track {
  background: transparent;
}

.dialog-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

.dialog-body::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

/* 设置分组 */
.settings-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #6b7280;
}

.group-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
}

/* 分隔线 */
.section-divider {
  flex-shrink: 0;
  width: 100%;
  height: 1px;
  margin: 0;
  background: rgba(0, 0, 0, 0.08);
  border: none;
}

/* 颜色方案列表 */
.color-scheme-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.color-scheme-card {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.color-scheme-card:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 0, 0, 0.1);
}

.color-scheme-card.selected {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

.color-preview {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 6px;
}

.color-info {
  flex: 1;
  min-width: 0;
}

.color-name {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.color-desc {
  font-size: 11px;
  color: #6b7280;
  margin-top: 1px;
}

.check-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

/* 统计信息 */
.stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  margin-top: 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-item.highlight .stat-value {
  color: #22c55e;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 10px;
  color: #6b7280;
  margin-top: 2px;
}

.stat-divider {
  width: 1px;
  height: 28px;
  background: rgba(0, 0, 0, 0.08);
}

/* 滑动条项 */
.slider-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slider-item.collapsible {
  padding-left: 12px;
  border-left: 2px solid rgba(34, 197, 94, 0.3);
  margin-top: 4px;
}

.slider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}

.slider-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.label-icon {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.slider-value {
  min-width: 44px;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.05);
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-align: right;
}

.slider-track-wrapper {
  position: relative;
  padding: 8px 0;
}

.slider-track {
  position: relative;
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.slider-fill {
  position: absolute;
  height: 100%;
  background: #22c55e;
  border-radius: 3px;
  pointer-events: none;
  transition: width 0.1s ease;
}

.slider-fill.secondary {
  background: #0ea5e9;
}

.slider-input {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
  margin: 0;
  z-index: 2;
}

/* 滑块指示器 - 使用原生样式 */
.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  cursor: grab;
  position: relative;
  z-index: 10;
  margin-top: -6px;
}

.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
}

.slider-input::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.1);
}

.slider-input::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  cursor: grab;
  border: none;
}

.slider-input::-moz-range-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
}

.slider-input::-moz-range-track {
  background: transparent;
}

.slider-help {
  font-size: 11px;
  color: #6b7280;
  margin: 2px 0 0 0;
  line-height: 1.4;
}

/* 开关项 */
.toggle-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
}

.toggle-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.toggle-help {
  font-size: 11px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.toggle-switch {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.toggle-switch:hover {
  background: rgba(0, 0, 0, 0.15);
}

.toggle-switch.active {
  background: #22c55e;
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  pointer-events: none;
}

.toggle-switch.active .toggle-thumb {
  transform: translateX(18px);
}

/* 操作按钮 */
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
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  transform: translateZ(0);
}

.action-btn:active {
  transform: scale(0.97);
}

.action-btn.secondary {
  background: rgba(34, 197, 94, 0.15);
  color: #166534;
}

.action-btn.secondary:hover {
  background: rgba(34, 197, 94, 0.25);
}

.btn-icon {
  width: 14px;
  height: 14px;
}
</style>
