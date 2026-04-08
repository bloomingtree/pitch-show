<template>
  <div class="toggle-control">
    <!-- 左侧标签区域 -->
    <div class="toggle-label">
      <label class="toggle-label-text">{{ label }}</label>
      <p v-if="helpText" class="toggle-help-text">{{ helpText }}</p>
    </div>

    <!-- 右侧开关 -->
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      class="toggle-switch"
      :class="{ active: modelValue }"
      @click="$emit('update:modelValue', !modelValue)">
      <span class="toggle-thumb" />
    </button>
  </div>
</template>

<script>
export default {
  name: 'ToggleControl',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    helpText: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue']
}
</script>

<style scoped>
.toggle-control {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 12px 0;
}

.toggle-label {
  width: 100%;
  margin-bottom: 10px;
}

.toggle-label-text {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  display: block;
  text-align: left;
}

.toggle-help-text {
  font-size: 12px;
  color: #6b7280;
  margin: 4px 0 0 0;
  line-height: 1.4;
  text-align: left;
}

.toggle-switch {
  position: relative;
  width: 48px;
  height: 26px;
  border-radius: 13px;
  background: rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.toggle-switch:hover {
  background: rgba(0, 0, 0, 0.12);
  border-color: rgba(0, 0, 0, 0.18);
}

.toggle-switch.active {
  background: linear-gradient(135deg, #f97316, #fb923c);
  border-color: transparent;
}

.toggle-switch.active:hover {
  background: linear-gradient(135deg, #ea580c, #f97316);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  pointer-events: none;
}

.toggle-switch:hover .toggle-thumb {
  background: #fff;
}

.toggle-switch.active .toggle-thumb {
  transform: translateX(22px);
  background: #fff;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.4);
}

/* 焦点状态 */
.toggle-switch:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.25);
}
</style>
