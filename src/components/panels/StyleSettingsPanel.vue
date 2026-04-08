<template>
  <div class="style-settings-panel">
    <!-- 功能说明 -->
    <p class="text-xs text-gray-500 mb-4 leading-relaxed">
      动态音符指音高有明显变化的音符，如颤音、揉弦等技巧。
    </p>

    <!-- 颜色方案选择 -->
    <div class="space-y-2">
      <button
        v-for="(scheme, key) in colorSchemes"
        :key="key"
        @click="selectColorScheme(key)"
        :class="[
          'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
          currentScheme === key
            ? 'border-orange-300 bg-orange-50'
            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
        ]">
        <div class="flex gap-1.5">
          <div
            class="w-5 h-5 rounded"
            :style="{ background: `linear-gradient(135deg, ${scheme.dynamic} 0%, ${scheme.dynamicEnd || scheme.dynamic} 100%)` }">
          </div>
          <div
            class="w-5 h-5 rounded"
            :style="{ background: `linear-gradient(135deg, ${scheme.stable} 0%, ${scheme.stableEnd || scheme.stable} 100%)` }">
          </div>
        </div>
        <div class="flex-1 text-left">
          <div class="text-sm font-medium text-gray-700">{{ scheme.name }}</div>
          <div class="text-xs text-gray-400">{{ scheme.desc }}</div>
        </div>
        <div
          v-if="currentScheme === key"
          class="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
          <CheckIcon class="w-3 h-3 text-white" />
        </div>
      </button>
    </div>

    <!-- 统计信息 -->
    <div v-if="stats" class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
      <div class="text-center">
        <div class="text-lg font-bold text-gray-800">{{ stats.total }}</div>
        <div class="text-xs text-gray-400">总音符</div>
      </div>
      <div class="h-8 w-px bg-gray-100"></div>
      <div class="text-center">
        <div class="text-lg font-bold text-orange-600">
          {{ stats.byType.dynamic ? ((stats.byType.dynamic / stats.total) * 100).toFixed(1) : '0.0' }}%
        </div>
        <div class="text-xs text-gray-400">动态占比</div>
      </div>
      <div class="h-8 w-px bg-gray-100"></div>
      <div class="text-center">
        <div class="text-lg font-bold text-gray-600">{{ stats.byType.dynamic || 0 }}</div>
        <div class="text-xs text-gray-400">动态音符</div>
      </div>
    </div>
  </div>
</template>

<script>
import CheckIcon from '@/components/icons/CheckIcon.vue'

export default {
  name: 'StyleSettingsPanel',
  components: {
    CheckIcon
  },
  props: {
    currentScheme: {
      type: String,
      default: 'sunset'
    },
    stats: {
      type: Object,
      default: null
    }
  },
  emits: ['update:currentScheme'],
  data() {
    return {
      colorSchemes: {
        ocean: {
          name: '海洋清新',
          desc: '蓝灰配色',
          dynamic: '#0EA5E9',
          dynamicEnd: '#0284C7',
          stable: '#64748B',
          stableEnd: '#475569'
        },
        sunset: {
          name: '落日余晖',
          desc: '橙粉配色',
          dynamic: '#FF6B35',
          dynamicEnd: '#E85D2A',
          stable: '#F472B6',
          stableEnd: '#EC4899'
        },
        forest: {
          name: '森林秘境',
          desc: '绿紫配色',
          dynamic: '#10B981',
          dynamicEnd: '#059669',
          stable: '#8B5CF6',
          stableEnd: '#7C3AED'
        }
      }
    }
  },
  methods: {
    selectColorScheme(scheme) {
      this.$emit('update:currentScheme', scheme)
    }
  }
}
</script>
