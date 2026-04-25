<template>
  <div class="min-h-screen py-8 px-4" style="background-color: #FAF6EE;">
    <div class="max-w-2xl mx-auto">
      <!-- 返回按钮 -->
      <button
        @click="$router.back()"
        class="flex items-center text-gray-500 mb-6 hover:text-gray-800 transition-colors"
      >
        <svg class="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        <span class="text-sm">返回</span>
      </button>

      <!-- 用户资料卡 -->
      <div class="profile-card">
        <template v-if="!isEditing">
          <div class="flex items-center gap-4">
            <div class="avatar-ring">
              <div class="avatar-inner">
                <img v-if="user.avatar_url" :src="user.avatar_url" alt="头像" class="w-full h-full object-cover" />
                <svg v-else class="w-7 h-7 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-semibold text-gray-800 truncate">{{ user.username || '未设置用户名' }}</h2>
                <span v-if="isPremium" class="badge-pro">Pro</span>
              </div>
              <p class="text-sm text-gray-400 truncate mt-0.5">{{ user.email }}</p>
            </div>
            <button @click="isEditing = true"
              class="flex-shrink-0 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
              编辑
            </button>
          </div>
        </template>

        <template v-else>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">用户名</label>
              <input v-model="form.username" type="text" placeholder="请输入用户名"
                class="w-full bg-gray-50 text-gray-800 placeholder-gray-400 rounded-xl px-4 py-2.5 outline-none border border-gray-200 focus:border-orange-300 focus:ring-1 focus:ring-orange-200 transition-colors" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">头像 URL</label>
              <input v-model="form.avatar_url" type="url" placeholder="请输入头像图片链接"
                class="w-full bg-gray-50 text-gray-800 placeholder-gray-400 rounded-xl px-4 py-2.5 outline-none border border-gray-200 focus:border-orange-300 focus:ring-1 focus:ring-orange-200 transition-colors" />
            </div>
            <div class="flex gap-2 pt-1">
              <button @click="handleSave" :disabled="loading"
                class="flex-1 py-2.5 font-medium text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50">
                {{ loading ? '保存中...' : '保存' }}
              </button>
              <button @click="cancelEdit"
                class="flex-1 py-2.5 font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                取消
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- 数据概览 -->
      <section class="mt-8">
        <h3 class="section-title">数据概览</h3>

        <div v-if="!quotaLoaded" class="text-center text-gray-400 text-sm py-6">加载中...</div>

        <template v-else>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ localSongCount + cloudProjectCount }}</div>
              <div class="stat-label">总歌曲</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: #06b6d4;">{{ cloudProjectCount }}</div>
              <div class="stat-label">云端项目</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" :style="{ color: monthlyPercent > 80 ? '#ef4444' : '#f59e0b' }">
                {{ quota ? quota.monthly_used : 0 }}
              </div>
              <div class="stat-label">本月已用</div>
            </div>
          </div>

          <div v-if="quota" class="space-y-4 mt-4">
            <div>
              <div class="flex justify-between text-xs mb-1.5">
                <span class="text-gray-500">云端存储</span>
                <span class="text-gray-400">{{ isPremium ? '无限' : quota.storage_used + ' / ' + quota.storage_limit + ' 首' }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: isPremium ? '100%' : Math.min(storagePercent, 100) + '%', background: storagePercent > 80 && !isPremium ? '#ef4444' : '#06b6d4' }"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-xs mb-1.5">
                <span class="text-gray-500">本月配额</span>
                <span class="text-gray-400">{{ isPremium ? '无限' : quota.monthly_used + ' / ' + quota.monthly_limit + ' 次' }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: isPremium ? '100%' : Math.min(monthlyPercent, 100) + '%', background: monthlyPercent > 80 && !isPremium ? '#ef4444' : '#f59e0b' }"></div>
              </div>
            </div>
            <router-link v-if="!isPremium && monthlyPercent > 60" to="/pricing" class="upgrade-tip">
              升级 Pro 获取更多存储和无限分析次数 →
            </router-link>
          </div>
        </template>
      </section>

      <!-- 我的歌曲 -->
      <section class="mt-8">
        <div class="flex items-center justify-between mb-3">
          <h3 class="section-title" style="margin-bottom: 0;">我的歌曲</h3>
          <div class="flex gap-0.5 rounded-lg p-0.5" style="background: rgba(0,0,0,0.05);">
            <button v-for="tab in songTabs" :key="tab.key"
              @click="activeSongTab = tab.key"
              :class="['tab-btn', { active: activeSongTab === tab.key }]">
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div v-if="songsLoading" class="text-center text-gray-400 text-sm py-8">加载中...</div>
        <div v-else-if="filteredSongs.length === 0" class="text-center text-gray-400 text-sm py-8">
          暂无{{ activeSongTab === 'local' ? '本地' : activeSongTab === 'cloud' ? '云端' : '' }}歌曲
        </div>
        <div v-else class="space-y-1.5">
          <div v-for="song in filteredSongs" :key="song.id" class="song-item">
            <div class="song-icon">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-700 truncate">{{ song.name }}</div>
              <div class="flex items-center gap-2 mt-0.5">
                <span :class="['song-tag', song.source]">{{ song.source === 'local' ? '本地' : '云端' }}</span>
                <span class="text-xs text-gray-400">{{ song.date }}</span>
              </div>
            </div>
            <div class="flex gap-1.5">
              <button @click="openSong(song)" class="song-btn open">打开</button>
              <button @click="deleteSong(song)" class="song-btn delete">删除</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 账户设置 -->
      <section class="mt-8 pb-8">
        <h3 class="section-title">账户</h3>
        <div class="space-y-2">
          <button @click="handleLogout"
            class="action-row">
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/>
            </svg>
            <span>退出登录</span>
          </button>
          <button @click="showDeleteConfirm = true"
            class="action-row danger">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
            </svg>
            <span>删除账户</span>
          </button>
        </div>
      </section>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="dialog-box">
        <h3 class="text-lg font-bold text-gray-800 mb-2">确认删除账户？</h3>
        <p class="text-gray-500 text-sm mb-6">此操作不可逆，您的所有数据将被永久删除。</p>
        <div class="flex gap-3">
          <button @click="handleDeleteAccount" class="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors">确认删除</button>
          <button @click="showDeleteConfirm = false" class="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'
import profileApi from '@/api/profile'
import { getAnalysisQuota, getSongList, deleteSong as deleteSongApi } from '@/api/analysis'
import songDB from '@/store/Song'
import { push } from 'notivue'

const router = useRouter()
const authStore = useAuthStore()

const user = ref({ username: '', email: '', avatar_url: '' })
const form = ref({ username: '', avatar_url: '' })
const isEditing = ref(false)
const loading = ref(false)
const showDeleteConfirm = ref(false)

const quota = ref(null)
const quotaLoaded = ref(false)

const localSongs = ref([])
const cloudProjects = ref([])
const songsLoading = ref(true)
const activeSongTab = ref('all')

const songTabs = [
  { key: 'all', label: '全部' },
  { key: 'local', label: '本地' },
  { key: 'cloud', label: '云端' }
]

const isPremium = computed(() => quota.value?.is_premium ?? false)
const localSongCount = computed(() => localSongs.value.length)
const cloudProjectCount = computed(() => cloudProjects.value.length)
const storagePercent = computed(() =>
  quota.value ? (quota.value.storage_used / quota.value.storage_limit * 100) : 0
)
const monthlyPercent = computed(() =>
  quota.value ? (quota.value.monthly_used / quota.value.monthly_limit * 100) : 0
)

const filteredSongs = computed(() => {
  const all = []
  if (activeSongTab.value !== 'cloud') {
    localSongs.value.forEach(s => {
      all.push({ id: 'local-' + s.name, name: s.name, source: 'local', date: s.dateStr || '', rawData: s })
    })
  }
  if (activeSongTab.value !== 'local') {
    cloudProjects.value.forEach(p => {
      all.push({
        id: 'cloud-' + p.id,
        name: p.title || '未命名歌曲',
        source: 'cloud',
        date: p.created_at ? new Date(p.created_at).toLocaleDateString('zh-CN') : '',
        rawData: p
      })
    })
  }
  return all
})

onMounted(async () => {
  await Promise.all([loadProfile(), loadQuota(), loadSongs()])
})

const loadProfile = async () => {
  try {
    const profile = await profileApi.getProfile()
    user.value = profile
    form.value = { username: profile.username || '', avatar_url: profile.avatar_url || '' }
  } catch (e) {
    console.error('获取用户资料失败:', e)
  }
}

const loadQuota = async () => {
  try {
    quota.value = await getAnalysisQuota()
  } catch (e) {
    console.error('获取配额失败:', e)
  } finally {
    quotaLoaded.value = true
  }
}

const loadSongs = async () => {
  songsLoading.value = true
  try {
    const local = await songDB.getAll()
    localSongs.value = local || []
  } catch (e) {
    console.error('加载本地歌曲失败:', e)
  }

  try {
    const resp = await getSongList({ limit: 50 })
    // GET /songs 返回 { data: [...songs], pagination, quota }
    if (Array.isArray(resp)) {
      cloudProjects.value = resp
    } else if (resp?.data) {
      cloudProjects.value = Array.isArray(resp.data) ? resp.data : []
    } else {
      cloudProjects.value = []
    }
  } catch (e) {
    console.error('加载云端项目失败:', e)
    cloudProjects.value = []
  } finally {
    songsLoading.value = false
  }
}

const cancelEdit = () => {
  isEditing.value = false
  form.value = { username: user.value.username || '', avatar_url: user.value.avatar_url || '' }
}

const handleSave = async () => {
  loading.value = true
  try {
    await profileApi.updateProfile(form.value)
    await loadProfile()
    isEditing.value = false
    push.success({ title: '保存成功', duration: 2000 })
  } catch (e) {
    push.error({ title: '保存失败', description: e.message, duration: 3000 })
  } finally {
    loading.value = false
  }
}

const openSong = (song) => {
  if (song.source === 'local') {
    router.push({ path: '/', query: { song: song.name } })
  } else {
    router.push({ path: '/', query: { project: song.rawData.id } })
  }
}

const deleteSong = async (song) => {
  try {
    if (song.source === 'local') {
      await songDB.remove(song.rawData.name)
      localSongs.value = localSongs.value.filter(s => s.name !== song.rawData.name)
    } else {
      await deleteSongApi(song.rawData.id)
      cloudProjects.value = cloudProjects.value.filter(p => p.id !== song.rawData.id)
    }
    push.success({ title: '删除成功', duration: 2000 })
  } catch (e) {
    push.error({ title: '删除失败', description: e.message, duration: 3000 })
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}

const handleDeleteAccount = async () => {
  const success = await authStore.deleteAccount()
  if (success) router.push('/')
  showDeleteConfirm.value = false
}
</script>

<style scoped>
/* 用户资料卡 */
.profile-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #f3f4f6;
}

.avatar-ring {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(135deg, #f97316, #f59e0b);
  flex-shrink: 0;
}
.avatar-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.badge-pro {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: white;
}

/* 区域标题 */
.section-title {
  font-size: 10px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.stat-card {
  text-align: center;
  padding: 16px 8px;
  border-radius: 14px;
  background: white;
  border: 1px solid #f3f4f6;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}
.stat-label {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}

/* 进度条 */
.progress-track {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.upgrade-tip {
  display: block;
  font-size: 12px;
  color: #92400e;
  background: #fef3c7;
  border-radius: 10px;
  padding: 8px 12px;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s;
}
.upgrade-tip:hover { background: #fde68a; }

/* Tab */
.tab-btn {
  padding: 4px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn.active {
  background: white;
  color: #ea580c;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* 歌曲列表 */
.song-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  background: white;
  border: 1px solid #f3f4f6;
  transition: all 0.15s;
}
.song-item:hover {
  border-color: #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.song-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #fff7ed;
  color: #f97316;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.song-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
}
.song-tag.local {
  background: #dcfce7;
  color: #166534;
}
.song-tag.cloud {
  background: #e0f2fe;
  color: #075985;
}
.song-btn {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}
.song-btn.open {
  background: #fff7ed;
  color: #ea580c;
}
.song-btn.open:hover { background: #ffedd5; }
.song-btn.delete {
  background: #fef2f2;
  color: #dc2626;
}
.song-btn.delete:hover { background: #fee2e2; }

/* 操作行 */
.action-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  background: white;
  border: 1px solid #f3f4f6;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}
.action-row:hover { border-color: #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.action-row.danger { color: #dc2626; }
.action-row.danger:hover { background: #fef2f2; border-color: #fecaca; }

/* 弹窗 */
.dialog-box {
  background: white;
  border-radius: 20px;
  padding: 24px;
  max-width: 360px;
  width: calc(100% - 32px);
  box-shadow: 0 20px 50px -20px rgba(15, 23, 42, 0.2);
}
</style>
