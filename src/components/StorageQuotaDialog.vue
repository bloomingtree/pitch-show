<template>
  <Transition name="fade" appear>
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center"
      @click.self="$emit('close')">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div class="dialog-container" @click.stop>
        <!-- 标题栏 -->
        <div class="dialog-header">
          <div class="dialog-header-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="header-icon">
              <path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
            </svg>
            <span class="dialog-title">存储空间已满</span>
          </div>
          <button @click="$emit('close')" class="close-btn" aria-label="关闭">
            <CloseIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- 主体 -->
        <div class="dialog-body">
          <p class="quota-info">您的分析配额已用 <strong>{{ quota.storage_used }}/{{ quota.storage_limit }}</strong> 首</p>
          <p class="quota-hint">请选择不需要的项目释放空间后继续分析：</p>

          <!-- 项目列表 -->
          <div class="project-list">
            <div
              v-for="project in projects"
              :key="project.id"
              class="project-item"
              :class="{ selected: selectedIds.has(project.id) }"
              @click="toggleSelect(project.id)">
              <div class="project-checkbox">
                <svg v-if="selectedIds.has(project.id)" viewBox="0 0 20 20" fill="currentColor" class="check-icon">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="project-info">
                <div class="project-name">{{ project.title || '未命名歌曲' }}</div>
                <div class="project-date">{{ formatDate(project.created_at) }}</div>
              </div>
              <button @click.stop="removeSingle(project.id)" class="delete-btn" title="删除">
                <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- 底部操作 -->
          <div class="action-bar">
            <span class="selection-info">
              已选中 <strong>{{ selectedIds.size }}</strong> 首，释放后将有 <strong>{{ quota.storage_limit - quota.storage_used + selectedIds.size }}</strong> 个空位
            </span>
            <div class="action-buttons">
              <button @click="$emit('close')" class="action-btn cancel">取消</button>
              <button
                @click="confirmDelete"
                :disabled="selectedIds.size === 0 || deleting"
                class="action-btn confirm">
                {{ deleting ? '删除中...' : '释放空间并继续' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { ref, reactive } from 'vue'
import CloseIcon from '@/components/icons/CloseIcon.vue'
import { batchDeleteSongs } from '@/api/analysis'

export default {
  name: 'StorageQuotaDialog',
  components: { CloseIcon },
  props: {
    show: { type: Boolean, default: false },
    quota: { type: Object, default: () => ({ storage_limit: 5, storage_used: 0 }) },
    projects: { type: Array, default: () => [] }
  },
  emits: ['close', 'freed'],
  setup(props, { emit }) {
    const selectedIds = reactive(new Set())
    const deleting = ref(false)

    const toggleSelect = (id) => {
      if (selectedIds.has(id)) selectedIds.delete(id)
      else selectedIds.add(id)
    }

    const removeSingle = (id) => {
      selectedIds.add(id)
      confirmDelete()
    }

    const confirmDelete = async () => {
      if (selectedIds.size === 0 || deleting.value) return
      deleting.value = true
      try {
        await batchDeleteSongs([...selectedIds])
        emit('freed')
      } catch (e) {
        console.error('批量删除失败:', e)
      } finally {
        deleting.value = false
      }
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    }

    return { selectedIds, deleting, toggleSelect, removeSingle, confirmDelete, formatDate }
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
  width: 400px;
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
}

.header-icon {
  width: 20px;
  height: 20px;
  color: #f59e0b;
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
}
.close-btn:hover { background: rgba(0,0,0,0.05); }

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
}

.quota-info {
  font-size: 13px;
  color: #374151;
  margin: 0;
}

.quota-hint {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.project-list {
  max-height: 240px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.project-list::-webkit-scrollbar { width: 5px; }
.project-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 3px; }

.project-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.15s;
}

.project-item:hover { background: rgba(255,255,255,0.8); }
.project-item.selected { background: rgba(239, 68, 68, 0.06); border-color: rgba(239, 68, 68, 0.2); }

.project-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1.5px solid rgba(0,0,0,0.2);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.project-item.selected .project-checkbox {
  background: #ef4444;
  border-color: #ef4444;
}

.check-icon { width: 12px; height: 12px; color: white; }

.project-info { flex: 1; min-width: 0; }
.project-name { font-size: 13px; font-weight: 500; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.project-date { font-size: 11px; color: #9ca3af; }

.delete-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.delete-btn:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

.action-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(0,0,0,0.06);
}

.selection-info {
  font-size: 12px;
  color: #6b7280;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  height: 34px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:active { transform: scale(0.97); }
.action-btn.cancel { background: rgba(0,0,0,0.06); color: #6b7280; }
.action-btn.cancel:hover { background: rgba(0,0,0,0.1); }
.action-btn.confirm { background: rgba(6, 182, 212, 0.15); color: #0e7490; }
.action-btn.confirm:hover { background: rgba(6, 182, 212, 0.25); }
.action-btn.confirm:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
