<template>
  <div class="collapsible-panel">
    <button
      @click="toggle"
      class="panel-header"
      type="button">
      <span class="panel-title">{{ title }}</span>
      <svg
        :class="['chevron-icon', { 'rotated': isOpen }]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
    </button>
    <transition name="collapse">
      <div v-show="isOpen" class="panel-content">
        <slot />
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'CollapsiblePanel',
  props: {
    title: {
      type: String,
      required: true
    },
    defaultOpen: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isOpen: this.defaultOpen
    }
  },
  methods: {
    toggle() {
      this.isOpen = !this.isOpen
    }
  }
}
</script>

<style scoped>
.collapsible-panel {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  overflow: hidden;
  margin-top: 16px;
}

.panel-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.panel-header:hover {
  background: rgba(0, 0, 0, 0.03);
}

.panel-title {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

.chevron-icon {
  width: 16px;
  height: 16px;
  color: #6b7280;
  transition: transform 0.2s ease;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

.panel-content {
  padding: 0 16px 16px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
