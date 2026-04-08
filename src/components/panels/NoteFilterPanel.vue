<template>
  <div class="note-filter-panel space-y-4">
    <!-- 最短音符时长 -->
    <SliderControl
      v-model="localSettings.minDuration"
      label="最短音符时长"
      :min="0"
      :max="1"
      :step="0.01"
      unit="秒"
      help-text="隐藏持续时间太短的音符（通常是杂音）"
    />

    <!-- 自动合并开关 -->
    <ToggleControl
      v-model="localSettings.enableMerge"
      label="自动合并短音符"
      help-text="将相邻或重叠的同音高音符连接起来"
    />

    <!-- 高级选项 -->
    <CollapsiblePanel title="高级选项" :default-open="false">
      <SliderControl
        v-model="localSettings.mergeGap"
        label="合并间隔"
        :min="0"
        :max="0.5"
        :step="0.01"
        unit="秒"
        help-text="两个音符之间最大允许的静音间隔"
      />
    </CollapsiblePanel>

    <!-- 重置按钮 -->
    <button
      @click="resetSettings"
      class="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors flex items-center justify-center gap-2">
      <ResetIcon class="w-4 h-4" />
      <span>重置默认</span>
    </button>
  </div>
</template>

<script>
import SliderControl from '@/components/controls/SliderControl.vue'
import ToggleControl from '@/components/controls/ToggleControl.vue'
import CollapsiblePanel from '@/components/controls/CollapsiblePanel.vue'
import ResetIcon from '@/components/icons/ResetIcon.vue'
import { DEFAULT_FILTER_SETTINGS } from '@/js/noteFilter.js'

export default {
  name: 'NoteFilterPanel',
  components: {
    SliderControl,
    ToggleControl,
    CollapsiblePanel,
    ResetIcon
  },
  props: {
    settings: {
      type: Object,
      required: true
    }
  },
  emits: ['update:settings'],
  data() {
    return {
      localSettings: { ...this.settings }
    }
  },
  watch: {
    settings: {
      handler(newVal) {
        this.localSettings = { ...newVal }
      },
      deep: true
    },
    localSettings: {
      handler(newVal) {
        this.$emit('update:settings', { ...newVal })
      },
      deep: true
    }
  },
  methods: {
    resetSettings() {
      this.localSettings = { ...DEFAULT_FILTER_SETTINGS }
    }
  }
}
</script>
