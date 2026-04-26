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
            <span class="dialog-title">{{ $t('settings.title') }}</span>
          </div>
          <button @click="$emit('close')" class="close-btn" :aria-label="$t('settings.close')">
            <CloseIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- 双栏主体 -->
        <div class="dialog-body">
          <!-- 左栏菜单 -->
          <div class="sidebar">
            <div class="sidebar-group">
              <div class="sidebar-heading">{{ $t('settings.show') }}</div>
              <button
                v-for="item in displayMenuItems"
                :key="item.key"
                @click="scrollToSection(item.key)"
                :class="['menu-item', { active: activeSection === item.key }]">
                <component :is="item.icon" class="menu-icon" />
                <span class="menu-text">{{ item.label }}</span>
              </button>
            </div>
            <div v-if="hasTracks" class="sidebar-group">
              <div class="sidebar-heading">{{ $t('settings.pro') }}</div>
              <button
                @click="scrollToSection('tracks')"
                :class="['menu-item', { active: activeSection === 'tracks' }]">
                <TrackIcon class="menu-icon" />
                <span class="menu-text">{{ $t('settings.trackDisplay') }}</span>
              </button>
            </div>
            <div class="sidebar-group">
              <div class="sidebar-heading">{{ $t('settings.account') }}</div>
              <button
                @click="scrollToSection('account')"
                :class="['menu-item', { active: activeSection === 'account' }]">
                <UserIcon class="menu-icon" />
                <span class="menu-text">{{ $t('settings.accountInfo') }}</span>
              </button>
            </div>
          </div>

          <!-- 右栏：所有设置纵向排列，可滚动 -->
          <div ref="scrollContainer" class="content-area" @scroll="onContentScroll">
            <!-- 外观设置 -->
            <div ref="section-appearance" class="panel">
              <div class="panel-title">{{ $t('settings.appearance') }}</div>
              <p class="panel-desc">{{ $t('settings.appearanceDesc') }}</p>

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
                  <span class="stat-label">{{ $t('settings.totalNotes') }}</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item highlight">
                  <span class="stat-value">{{ stats.byType.dynamic ? ((stats.byType.dynamic / stats.total) * 100).toFixed(1) : '0.0' }}%</span>
                  <span class="stat-label">{{ $t('settings.techniqueNotes') }}</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                  <span class="stat-value">{{ stats.byType.dynamic || 0 }}</span>
                  <span class="stat-label">{{ $t('settings.techniqueNotesCount') }}</span>
                </div>
              </div>
            </div>

            <hr class="section-divider" />

            <!-- 过滤设置 -->
            <div ref="section-filter" class="panel">
              <div class="panel-title">{{ $t('settings.filterSettings') }}</div>
              <p class="panel-desc">{{ $t('settings.filterDesc') }}</p>

              <!-- 自动连接断音 -->
              <div class="toggle-item">
                <div class="toggle-header">
                  <label class="toggle-label">
                    <MergeIcon class="label-icon" />
                    {{ $t('settings.autoMerge') }}
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
                <p class="toggle-help">{{ $t('settings.autoMergeDesc') }}</p>
              </div>

              <!-- 连接间隔 -->
              <div v-if="localFilterSettings.enableMerge" class="slider-item collapsible">
                <div class="slider-header">
                  <label class="slider-label">
                    <GapIcon class="label-icon" />
                    {{ $t('settings.mergeGap') }}
                  </label>
                  <span class="slider-value">{{ localFilterSettings.mergeGap.toFixed(2) }}{{ $t('settings.seconds') }}</span>
                </div>
                <div class="slider-track-wrapper">
                  <div class="slider-track">
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
                <p class="slider-help">{{ $t('settings.mergeGapDesc') }}</p>
              </div>

              <!-- 最短显示时长 -->
              <div class="slider-item">
                <div class="slider-header">
                  <label class="slider-label">
                    <ClockIcon class="label-icon" />
                    {{ $t('settings.minDuration') }}
                  </label>
                  <span class="slider-value">{{ localFilterSettings.minDuration.toFixed(2) }}{{ $t('settings.seconds') }}</span>
                </div>
                <div class="slider-track-wrapper">
                  <div class="slider-track">
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
                <p class="slider-help">{{ $t('settings.minDurationDesc', { n: localFilterSettings.minDuration }) }}</p>
              </div>

              <hr class="section-divider" />

              <div class="action-buttons">
                <button @click="resetFilterSettings" class="action-btn secondary">
                  <ResetIcon class="btn-icon" />
                  {{ $t('settings.resetDefault') }}
                </button>
              </div>
            </div>

            <!-- 音轨显示（pro） -->
            <template v-if="hasTracks">
              <hr class="section-divider" />
              <div ref="section-tracks" class="panel">
                <div class="panel-title">{{ $t('settings.trackDisplay') }}</div>
                <p class="panel-desc">{{ $t('settings.trackDisplayDesc') }}</p>

                <div class="track-list">
                  <div
                    v-for="track in tracks"
                    :key="track.key"
                    class="track-item"
                    @click="toggleTrack(track.key)">
                    <div class="track-color" :style="{ background: trackColors[track.key] || track.color }"></div>
                    <div class="track-info">
                      <div class="track-name">{{ track.name }}</div>
                      <div class="track-desc">{{ track.desc }}</div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      :aria-checked="localTrackFilters[track.key]"
                      :class="['toggle-switch', { active: localTrackFilters[track.key] }]">
                      <span class="toggle-thumb" />
                    </button>
                  </div>
                </div>

                <div class="action-buttons">
                  <button @click="selectAllTracks" class="action-btn secondary">{{ $t('settings.selectAll') }}</button>
                  <button @click="selectNoTracks" class="action-btn secondary">{{ $t('settings.deselectAll') }}</button>
                </div>
              </div>
            </template>

            <!-- 账号信息 -->
            <hr class="section-divider" />
            <div ref="section-account" class="panel">
              <div class="panel-title">{{ $t('settings.accountInfo') }}</div>

              <!-- 已登录 -->
              <template v-if="currentUser">
                <div class="account-card">
                  <div class="account-avatar">
                    <img v-if="currentUser.avatar_url" :src="currentUser.avatar_url" :alt="$t('settings.account')" class="avatar-img" />
                    <svg v-else class="avatar-placeholder" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <div class="account-meta">
                    <div class="account-name">{{ currentUser.username || currentUser.email }}</div>
                    <div class="account-email">{{ currentUser.email }}</div>
                    <span :class="['account-badge', planLevel !== 'free' ? 'pro' : 'free']">
                      {{ planLevel !== 'free' ? planLabel : $t('settings.freePlan') }}
                    </span>
                  </div>
                </div>

                <button class="account-action-btn" @click="$emit('navigate-profile')">
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  {{ $t('settings.profile') }}
                  <svg class="btn-icon btn-chevron" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/>
                  </svg>
                </button>
                <button class="account-action-btn logout" @click="$emit('logout')">
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  {{ $t('settings.logout') }}
                </button>
              </template>

              <!-- 未登录 -->
              <template v-else>
                <p class="panel-desc">{{ $t('settings.loginPrompt') }}</p>
                <button class="account-action-btn login" @click="$emit('login')">
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  {{ $t('settings.login') }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { reactive, watch, computed, h } from 'vue'
import MusicNoteDotIcon from '@/components/icons/MusicNoteDotIcon.vue'
import CloseIcon from '@/components/icons/CloseIcon.vue'
import CheckIcon from '@/components/icons/CheckIcon.vue'
import ResetIcon from '@/components/icons/ResetIcon.vue'
import { DEFAULT_FILTER_SETTINGS } from '@/js/configManager'
import { PLAN_LABELS } from '@/js/planConstants'

// 内联图标
const ClockIcon = {
  render() { return h('svg', { stroke: 'currentColor', fill: 'currentColor', 'stroke-width': '0', viewBox: '0 0 24 24', class: 'w-3.5 h-3.5' }, [h('path', { 'fill-rule': 'evenodd', d: 'M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z', 'clip-rule': 'evenodd' })]) }
}
const MergeIcon = {
  render() { return h('svg', { stroke: 'currentColor', fill: 'currentColor', 'stroke-width': '0', viewBox: '0 0 24 24', class: 'w-3.5 h-3.5' }, [h('path', { d: 'M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z' })]) }
}
const GapIcon = {
  render() { return h('svg', { stroke: 'currentColor', fill: 'currentColor', 'stroke-width': '0', viewBox: '0 0 24 24', class: 'w-3.5 h-3.5' }, [h('path', { 'fill-rule': 'evenodd', d: 'M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75V19.5a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z', 'clip-rule': 'evenodd' })]) }
}

// 左栏菜单图标
const PaletteIcon = {
  render() { return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', class: 'w-4 h-4' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z' })]) }
}
const FilterIcon = {
  render() { return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', class: 'w-4 h-4' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z' })]) }
}
const TrackIcon = {
  render() { return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', class: 'w-4 h-4' }, [h('path', { d: 'M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z' })]) }
}
const UserIcon = {
  render() { return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', class: 'w-4 h-4' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' })]) }
}

const TRACKS = [
  { key: 'vocals', color: '#06b6d4' },
  { key: 'bass', color: '#f59e0b' },
  { key: 'drums', color: '#57534e' },
  { key: 'other', color: '#84cc16' }
]

export default {
  name: 'DynamicInfoDialog',
  components: { MusicNoteDotIcon, CloseIcon, CheckIcon, ResetIcon, ClockIcon, MergeIcon, GapIcon },
  props: {
    show: { type: Boolean, default: false },
    stats: { type: Object, default: null },
    currentScheme: { type: String, default: 'sunset' },
    filterSettings: { type: Object, default: () => ({ ...DEFAULT_FILTER_SETTINGS }) },
    analysisMode: { type: String, default: 'local' },
    hasTracks: { type: Boolean, default: false },
    trackFilters: { type: Object, default: () => ({ vocals: true, bass: true, drums: true, other: true }) },
    trackColors: { type: Object, default: () => ({}) },
    currentUser: { type: Object, default: null },
    isPremiumUser: { type: Boolean, default: false },
    planLevel: { type: String, default: 'free' }
  },
  emits: ['close', 'update:currentScheme', 'update:filterSettings', 'update:trackFilters', 'navigate-profile', 'logout', 'login'],
  data() {
    return {
      activeSection: 'appearance',
      isScrolling: false, // 防止手动滚动和点击滚动互相干扰
      localColorScheme: this.currentScheme,
      localFilterSettings: { ...this.filterSettings },
      localTrackFilters: reactive({ ...this.trackFilters })
    }
  },
  computed: {
    planLabel() {
      return PLAN_LABELS[this.planLevel] || this.$t('settings.freePlan')
    },
    colorSchemes() {
      return {
        classic: { name: this.$t('settings.themes.classic.name'), desc: this.$t('settings.themes.classic.desc'), dynamic: '#84cc16', stable: '#f59e0b', tracks: { vocals: '#06b6d4', bass: '#f59e0b', drums: '#57534e', other: '#84cc16' } },
        ocean: { name: this.$t('settings.themes.ocean.name'), desc: this.$t('settings.themes.ocean.desc'), dynamic: '#0EA5E9', stable: '#64748B', tracks: { vocals: '#FF7675', bass: '#64748B', drums: '#94A3B8', other: '#0EA5E9' } },
        sunset: { name: this.$t('settings.themes.sunset.name'), desc: this.$t('settings.themes.sunset.desc'), dynamic: '#FF6B35', stable: '#F472B6', tracks: { vocals: '#FBBF24', bass: '#F472B6', drums: '#A78BFA', other: '#FF6B35' } },
        forest: { name: this.$t('settings.themes.forest.name'), desc: this.$t('settings.themes.forest.desc'), dynamic: '#10B981', stable: '#8B5CF6', tracks: { vocals: '#F87171', bass: '#8B5CF6', drums: '#D97706', other: '#10B981' } }
      }
    },
    tracks() {
      return [
        { key: 'vocals', name: this.$t('settings.tracks.vocals.name'), desc: this.$t('settings.tracks.vocals.desc'), color: '#06b6d4' },
        { key: 'bass', name: this.$t('settings.tracks.bass.name'), desc: this.$t('settings.tracks.bass.desc'), color: '#f59e0b' },
        { key: 'drums', name: this.$t('settings.tracks.drums.name'), desc: this.$t('settings.tracks.drums.desc'), color: '#57534e' },
        { key: 'other', name: this.$t('settings.tracks.other.name'), desc: this.$t('settings.tracks.other.desc'), color: '#84cc16' }
      ]
    },
    displayMenuItems() {
      return [
        { key: 'appearance', label: this.$t('settings.tabs.appearance'), icon: PaletteIcon },
        { key: 'filter', label: this.$t('settings.tabs.filter'), icon: FilterIcon }
      ]
    },
    menuItems() {
      const items = [...this.displayMenuItems]
      if (this.hasTracks) {
        items.push({ key: 'tracks', label: this.$t('settings.tabs.tracks'), icon: TrackIcon })
      }
      items.push({ key: 'account', label: this.$t('settings.tabs.account'), icon: UserIcon })
      return items
    }
  },
  watch: {
    currentScheme: {
      handler(newVal) { this.localColorScheme = newVal },
      immediate: true
    },
    filterSettings: {
      handler(newVal) {
        if (JSON.stringify(newVal) !== JSON.stringify(this.localFilterSettings)) {
          this.localFilterSettings = { ...newVal }
        }
      },
      deep: true, immediate: true
    },
    trackFilters: {
      handler(newVal) { Object.assign(this.localTrackFilters, newVal) },
      deep: true, immediate: true
    },
    localColorScheme(newVal) {
      this.$emit('update:currentScheme', newVal)
    },
    localFilterSettings: {
      handler(newVal) {
        if (this._debouncedEmit) clearTimeout(this._debouncedEmit)
        this._debouncedEmit = setTimeout(() => {
          this.$emit('update:filterSettings', { ...newVal })
        }, 50)
      },
      deep: true
    },
    hasTracks(newVal) {
      if (!newVal && this.activeSection === 'tracks') {
        this.activeSection = 'appearance'
      }
    }
  },
  methods: {
    scrollToSection(key) {
      const refName = 'section-' + key
      const el = this.$refs[refName]
      const container = this.$refs.scrollContainer
      if (el && container) {
        this.isScrolling = true
        this.activeSection = key
        // 计算元素相对于滚动容器的偏移
        const top = el.offsetTop - container.offsetTop
        container.scrollTo({ top, behavior: 'smooth' })
        setTimeout(() => { this.isScrolling = false }, 500)
      }
    },
    onContentScroll() {
      if (this.isScrolling) return
      const container = this.$refs.scrollContainer
      if (!container) return
      const scrollTop = container.scrollTop
      // 遍历所有 section，找到当前可见的
      const keys = this.menuItems.map(i => i.key)
      for (let i = keys.length - 1; i >= 0; i--) {
        const el = this.$refs['section-' + keys[i]]
        if (el) {
          const top = el.offsetTop - container.offsetTop
          if (scrollTop >= top - 10) {
            this.activeSection = keys[i]
            return
          }
        }
      }
      this.activeSection = keys[0]
    },
    selectColorScheme(scheme) { this.localColorScheme = scheme },
    handleSliderInput(key, value) { this.localFilterSettings[key] = parseFloat(value) },
    toggleMerge() { this.localFilterSettings.enableMerge = !this.localFilterSettings.enableMerge },
    resetFilterSettings() { this.localFilterSettings = { ...DEFAULT_FILTER_SETTINGS } },
    toggleTrack(key) {
      this.localTrackFilters[key] = !this.localTrackFilters[key]
      this.$emit('update:trackFilters', { ...this.localTrackFilters })
    },
    selectAllTracks() {
      TRACKS.forEach(t => { this.localTrackFilters[t.key] = true })
      this.$emit('update:trackFilters', { ...this.localTrackFilters })
    },
    selectNoTracks() {
      TRACKS.forEach(t => { this.localTrackFilters[t.key] = false })
      this.$emit('update:trackFilters', { ...this.localTrackFilters })
    }
  }
}
</script>

<style scoped>
/* 过渡动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-enter-active .dialog-container, .fade-leave-active .dialog-container { transition: transform 0.2s ease, opacity 0.2s ease; }
.fade-enter-from .dialog-container, .fade-leave-to .dialog-container { transform: scale(0.95); opacity: 0; }

/* 弹窗容器 */
.dialog-container {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 520px;
  max-width: calc(100vw - 32px);
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #FAF6EE;
  box-shadow: 0 20px 50px -20px rgba(15, 23, 42, 0.2);
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
  padding: 14px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.dialog-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.header-icon { width: 20px; height: 20px; color: #f97316; flex-shrink: 0; }
.dialog-title { font-size: 15px; font-weight: 700; color: #1e293b; letter-spacing: -0.01em; }
.close-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; min-width: 32px; padding: 0;
  border-radius: 8px; background: transparent; border: none;
  color: #9ca3af; cursor: pointer; transition: all 0.15s ease;
}
.close-btn:hover { background: rgba(0, 0, 0, 0.06); color: #6b7280; }
.close-btn:active { transform: scale(0.95); }

/* 双栏主体 */
.dialog-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左栏菜单 */
.sidebar {
  width: 130px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 10px;
  background: #FAF6EE;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}
.sidebar-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sidebar-heading {
  font-size: 10px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0 8px;
  margin-bottom: 4px;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 8px;
  border-radius: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}
.menu-item:hover { background: #F5EFE4; color: #374151; }
.menu-item.active {
  background: #FFF0E0;
  color: #ea580c;
}
.menu-icon { width: 16px; height: 16px; color: #9ca3af; flex-shrink: 0; transition: color 0.15s; }
.menu-item:hover .menu-icon { color: #6b7280; }
.menu-item.active .menu-icon { color: #ea580c; }
.menu-text { font-size: 12px; font-weight: 500; color: #6b7280; white-space: nowrap; transition: color 0.15s; }
.menu-item:hover .menu-text { color: #374151; }
.menu-item.active .menu-text { color: #ea580c; font-weight: 600; }

/* 右栏内容 */
.content-area {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  max-height: min(78vh, 520px);
  background: white;
}
.content-area::-webkit-scrollbar { width: 6px; }
.content-area::-webkit-scrollbar-track { background: transparent; }
.content-area::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 3px; }
.content-area::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.2); }

.panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 20px 16px;
}
.panel-title { font-size: 14px; font-weight: 700; color: #111827; letter-spacing: -0.01em; }
.panel-desc { font-size: 12px; color: #6b7280; line-height: 1.6; margin: 0; }

/* 分隔线 */
.section-divider { flex-shrink: 0; width: 100%; height: 1px; margin: 0; background: #f3f4f6; border: none; }

/* 颜色方案列表 */
.color-scheme-list { display: flex; flex-direction: column; gap: 6px; }
.color-scheme-card {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 10px 12px; border-radius: 10px;
  background: #fafaf9;
  border: 1px solid #f3f4f6;
  cursor: pointer; transition: all 0.15s ease; text-align: left;
}
.color-scheme-card:hover { background: white; border-color: #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.color-scheme-card.selected { background: #fff7ed; border-color: #fed7aa; }
.color-preview { display: flex; gap: 4px; flex-shrink: 0; }
.color-dot { width: 20px; height: 20px; border-radius: 6px; }
.color-info { flex: 1; min-width: 0; }
.color-name { font-size: 13px; font-weight: 500; color: #1f2937; }
.color-desc { font-size: 11px; color: #9ca3af; margin-top: 1px; }
.check-indicator {
  width: 20px; height: 20px; border-radius: 50%;
  background: #f97316; display: flex; align-items: center;
  justify-content: center; color: white; flex-shrink: 0;
}

/* 统计信息 */
.stats-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; margin-top: 4px; border-top: 1px solid #f3f4f6; }
.stat-item { flex: 1; text-align: center; }
.stat-item.highlight .stat-value { color: #f97316; }
.stat-value { font-size: 16px; font-weight: 700; color: #111827; }
.stat-label { font-size: 10px; color: #9ca3af; margin-top: 2px; }
.stat-divider { width: 1px; height: 28px; background: #f3f4f6; }

/* 滑动条 */
.slider-item { display: flex; flex-direction: column; gap: 4px; }
.slider-item.collapsible { padding-left: 12px; border-left: 2px solid #fed7aa; margin-top: 4px; }
.slider-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 4px; }
.slider-label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: #374151; }
.label-icon { width: 14px; height: 14px; opacity: 0.6; }
.slider-value { min-width: 44px; padding: 2px 6px; border-radius: 6px; background: #f3f4f6; font-size: 12px; font-weight: 600; color: #6b7280; text-align: right; }
.slider-track-wrapper { position: relative; padding: 8px 0; }
.slider-track { position: relative; width: 100%; height: 6px; background: #e5e7eb; border-radius: 3px; }
.slider-fill { position: absolute; height: 100%; background: #f97316; border-radius: 3px; pointer-events: none; transition: width 0.1s ease; }
.slider-fill.secondary { background: #0ea5e9; }
.slider-input { position: absolute; width: 100%; height: 100%; top: 0; left: 0; opacity: 0; cursor: pointer; margin: 0; z-index: 2; }
.slider-input::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; background: white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.15); cursor: grab; position: relative; z-index: 10; margin-top: -6px; }
.slider-input::-webkit-slider-thumb:hover { transform: scale(1.15); }
.slider-input::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.1); }
.slider-input::-moz-range-thumb { width: 18px; height: 18px; background: white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.15); cursor: grab; border: none; }
.slider-help { font-size: 11px; color: #9ca3af; margin: 2px 0 0 0; line-height: 1.5; }

/* 开关 */
.toggle-item { display: flex; flex-direction: column; gap: 4px; padding: 8px 0; }
.toggle-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.toggle-label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: #374151; }
.toggle-help { font-size: 11px; color: #9ca3af; margin: 0; line-height: 1.5; }
.toggle-switch {
  position: relative; width: 40px; height: 22px; border-radius: 11px;
  background: #d1d5db; border: none; cursor: pointer;
  transition: all 0.2s ease; flex-shrink: 0;
}
.toggle-switch:hover { background: #9ca3af; }
.toggle-switch.active { background: #f97316; }
.toggle-thumb {
  position: absolute; top: 2px; left: 2px; width: 18px; height: 18px;
  background: white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  transition: all 0.2s ease; pointer-events: none;
}
.toggle-switch.active .toggle-thumb { transform: translateX(18px); }

/* 音轨列表 */
.track-list { display: flex; flex-direction: column; gap: 4px; }
.track-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 10px;
  background: #fafaf9;
  border: 1px solid #f3f4f6;
  cursor: pointer; transition: all 0.15s;
}
.track-item:hover { background: white; border-color: #e5e7eb; }
.track-color { width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0; }
.track-info { flex: 1; min-width: 0; }
.track-name { font-size: 13px; font-weight: 600; color: #1f2937; }
.track-desc { font-size: 11px; color: #9ca3af; margin-top: 1px; }

/* 操作按钮 */
.action-buttons { display: flex; gap: 8px; }
.action-btn {
  flex: 1; display: inline-flex; align-items: center; justify-content: center;
  gap: 6px; height: 32px; padding: 0 12px; border-radius: 8px;
  font-size: 12px; font-weight: 500; cursor: pointer;
  transition: all 0.15s ease; border: none;
}
.action-btn:active { transform: scale(0.97); }
.action-btn.secondary { background: #fff7ed; color: #ea580c; }
.action-btn.secondary:hover { background: #ffedd5; }
.btn-icon { width: 14px; height: 14px; }

/* 账号信息 */
.account-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fafaf9;
  border: 1px solid #f3f4f6;
}
.account-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder { width: 20px; height: 20px; color: #9ca3af; }
.account-meta { flex: 1; min-width: 0; }
.account-name { font-size: 13px; font-weight: 600; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.account-email { font-size: 11px; color: #9ca3af; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
.account-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  margin-top: 4px;
}
.account-badge.pro { background: #fef3c7; color: #92400e; }
.account-badge.free { background: #f3f4f6; color: #6b7280; }

.account-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #f3f4f6;
  background: #fafaf9;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s ease;
}
.account-action-btn:hover { background: white; border-color: #e5e7eb; }
.account-action-btn:active { transform: scale(0.98); }
.account-action-btn .btn-chevron { margin-left: auto; width: 12px; height: 12px; color: #d1d5db; }
.account-action-btn.logout { color: #dc2626; }
.account-action-btn.logout:hover { background: #fef2f2; border-color: #fecaca; }
.account-action-btn.login {
  justify-content: center;
  background: #fff7ed;
  border-color: #fed7aa;
  color: #ea580c;
  font-weight: 600;
}
.account-action-btn.login:hover { background: #ffedd5; }
</style>
