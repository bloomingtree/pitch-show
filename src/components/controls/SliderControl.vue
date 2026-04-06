<template>
  <div class="slider-control">
    <!-- 标签和数值显示 -->
    <div class="slider-header">
      <label class="slider-label">{{ label }}</label>
      <div class="slider-value-group">
        <input
          type="number"
          :value="displayValue"
          @input="handleInput($event.target.value)"
          class="slider-input"
          :min="min"
          :max="max"
          :step="step"
        />
        <span v-if="unit" class="slider-unit">{{ unit }}</span>
      </div>
    </div>

    <!-- 滑动条 -->
    <div class="slider-track-container">
      <div class="slider-track-fill" :style="{ width: fillPercent + '%' }"></div>
      <input
        type="range"
        :value="modelValue"
        @input="handleInput($event.target.value)"
        :min="min"
        :max="max"
        :step="step"
        class="slider-track"
      />
    </div>

    <!-- 帮助文本 -->
    <p v-if="helpText" class="slider-help">{{ helpText }}</p>
  </div>
</template>

<script>
export default {
  name: 'SliderControl',
  props: {
    modelValue: {
      type: Number,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
    step: {
      type: Number,
      default: 1
    },
    unit: {
      type: String,
      default: ''
    },
    helpText: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  computed: {
    fillPercent() {
      if (this.max === this.min) return 0
      return ((this.modelValue - this.min) / (this.max - this.min)) * 100
    },
    displayValue() {
      // 显示时保留合理的小数位数
      if (this.step < 0.1) {
        return this.modelValue.toFixed(2)
      } else if (this.step < 1) {
        return this.modelValue.toFixed(1)
      }
      return this.modelValue
    }
  },
  methods: {
    handleInput(val) {
      const num = parseFloat(val)
      if (!isNaN(num)) {
        const clamped = Math.max(this.min, Math.min(this.max, num))
        this.$emit('update:modelValue', clamped)
      }
    }
  }
}
</script>

<style scoped>
.slider-control {
  margin-bottom: 16px;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.slider-label {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.slider-value-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.slider-input {
  width: 60px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  color: #1f2937;
  font-size: 14px;
  text-align: center;
  outline: none;
  transition: all 0.15s ease;
}

.slider-input:focus {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
}

.slider-unit {
  font-size: 12px;
  color: #6b7280;
  min-width: 20px;
}

/* 滑动条容器 */
.slider-track-container {
  position: relative;
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.slider-track-fill {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, #f97316, #fb923c);
  border-radius: 3px;
  pointer-events: none;
  transition: width 0.1s ease;
}

.slider-track {
  position: absolute;
  width: 100%;
  height: 100%;
  background: transparent;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  top: 0;
  left: 0;
}

.slider-track::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.slider-track::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
}

.slider-track::-webkit-slider-thumb:active {
  transform: scale(1.1);
}

.slider-track::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 帮助文本 */
.slider-help {
  font-size: 12px;
  color: #6b7280;
  margin: 8px 0 0 0;
  line-height: 1.4;
}

/* 隐藏 number 输入框的上下箭头 */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
