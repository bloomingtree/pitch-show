<template>
  <transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center"
      @click="$emit('close')">
      <!-- 背景遮罩 -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      <!-- 弹窗内容 -->
      <div
        class="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden transform transition-all"
        @click.stop>
        <!-- 标题栏 -->
        <div class="bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <MusicNoteIcon class="w-6 h-6 text-black" />
              </div>
              <div>
                <h2 class="text-xl font-bold text-stone-600">动态音符分析</h2>
                <p class="text-xs text-black/80 mt-0.5">Dynamic Note Analysis</p>
              </div>
            </div>
            <button
              @click="$emit('close')"
              class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center">
              <CloseIcon class="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="px-6 py-5">
          <!-- 功能说明 -->
          <div class="mb-5 p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
            <p class="text-sm text-gray-700 leading-relaxed">
              <span class="font-semibold text-orange-700">动态音符</span> 指音高有明显变化的音符，
              如人声的颤音、吉他的揉弦等技巧。这些音符通过音高变化展现音乐的表现力。
            </p>
          </div>

          <!-- 颜色方案选择 -->
          <div class="mb-5">
            <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <PaletteIcon class="w-4 h-4 text-orange-500" />
              颜色主题
            </h3>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="(scheme, key) in colorSchemes"
                :key="key"
                @click="selectColorScheme(key)"
                :class="[
                  'relative p-3 rounded-lg border-2 transition-all',
                  currentScheme === key
                    ? 'border-orange-500 shadow-md scale-105'
                    : 'border-gray-200 hover:border-orange-300'
                ]">
                <div class="flex gap-1 mb-2">
                  <div
                    class="w-6 h-6 rounded shadow-inner"
                    :style="{ background: `linear-gradient(135deg, ${scheme.dynamic} 0%, ${scheme.dynamicEnd || scheme.dynamic} 100%)` }">
                  </div>
                  <div
                    class="w-6 h-6 rounded shadow-inner"
                    :style="{ background: `linear-gradient(135deg, ${scheme.stable} 0%, ${scheme.stableEnd || scheme.stable} 100%)` }">
                  </div>
                </div>
                <div class="text-xs font-semibold text-gray-800">{{ scheme.name }}</div>
                <div
                  v-if="currentScheme === key"
                  class="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                  <CheckIcon class="w-3 h-3 text-white" />
                </div>
              </button>
            </div>
          </div>

          <!-- 当前颜色说明 -->
          <div class="mb-5">
            <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <InfoIcon class="w-4 h-4 text-orange-500" />
              颜色说明
            </h3>
            <div class="grid grid-cols-2 gap-3">
              <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div
                  class="w-8 h-8 rounded-lg shadow-inner"
                  :style="{ background: `linear-gradient(135deg, ${currentColorScheme.dynamic} 0%, ${currentColorScheme.dynamicEnd || currentColorScheme.dynamic} 100%)` }">
                </div>
                <div>
                  <div class="text-xs font-bold text-gray-800">动态音符</div>
                  <div class="text-xs text-gray-500">有音高变化</div>
                </div>
              </div>
              <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div
                  class="w-8 h-8 rounded-lg shadow-inner"
                  :style="{ background: `linear-gradient(135deg, ${currentColorScheme.stable} 0%, ${currentColorScheme.stableEnd || currentColorScheme.stable} 100%)` }">
                </div>
                <div>
                  <div class="text-xs font-bold text-gray-800">平稳音符</div>
                  <div class="text-xs text-gray-500">音高稳定</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 统计信息 -->
          <div v-if="stats" class="border-t border-gray-100 pt-4">
            <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <ChartIcon class="w-4 h-4 text-orange-500" />
              分析统计
            </h3>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="bg-orange-50 rounded-lg p-3">
                <div class="text-xs text-gray-600 mb-1">总音符数</div>
                <div class="text-xl font-bold text-orange-600">{{ stats.total }}</div>
              </div>
              <div class="bg-orange-50 rounded-lg p-3">
                <div class="text-xs text-gray-600 mb-1">动态音符占比</div>
                <div class="text-xl font-bold text-orange-600">
                  {{ stats.byType.dynamic ? ((stats.byType.dynamic / stats.total) * 100).toFixed(1) : '0.0' }}%
                </div>
              </div>
            </div>
            <div class="mt-3 text-xs text-gray-500 text-center">
              音符透明度反映音量大小
            </div>
          </div>
        </div>

        <!-- 底部装饰 -->
        <div class="h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500"></div>
      </div>
    </div>
  </transition>
</template>

<script>
import MusicNoteIcon from '@/components/icons/MusicNoteIcon.vue'
import CloseIcon from '@/components/icons/CloseIcon.vue'
import PaletteIcon from '@/components/icons/PaletteIcon.vue'
import CheckIcon from '@/components/icons/CheckIcon.vue'
import InfoIcon from '@/components/icons/InfoIcon.vue'
import ChartIcon from '@/components/icons/ChartIcon.vue'

export default {
  name: 'DynamicInfoDialog',
  components: {
    MusicNoteIcon,
    CloseIcon,
    PaletteIcon,
    CheckIcon,
    InfoIcon,
    ChartIcon
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
    }
  },
  emits: ['close', 'update:currentScheme'],
  data() {
    return {
      colorSchemes: {
        ocean: {
          name: '海洋清新',
          dynamic: '#0EA5E9',
          dynamicEnd: '#0284C7',
          stable: '#64748B',
          stableEnd: '#475569'
        },
        sunset: {
          name: '落日余晖',
          dynamic: '#F472B6',
          dynamicEnd: '#EC4899',
          stable: '#F59E0B',
          stableEnd: '#D97706'
        },
        forest: {
          name: '森林秘境',
          dynamic: '#10B981',
          dynamicEnd: '#059669',
          stable: '#8B5CF6',
          stableEnd: '#7C3AED'
        }
      }
    }
  },
  computed: {
    currentColorScheme() {
      return this.colorSchemes[this.currentScheme] || this.colorSchemes.sunset
    }
  },
  methods: {
    selectColorScheme(scheme) {
      this.$emit('update:currentScheme', scheme)
    }
  }
}
</script>

<style scoped>
/* 弹窗过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .relative,
.fade-leave-active .relative {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.fade-enter-from .relative,
.fade-leave-to .relative {
  transform: scale(0.95);
  opacity: 0;
}
</style>
