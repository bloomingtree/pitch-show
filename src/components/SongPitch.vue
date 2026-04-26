<template>
  <div class="h-full flex flex-col" style="background-color: #f8f7f4; min-height: 0;">
    <!-- 后台分析完成通知横幅 -->
    <Transition name="slide-down">
      <div v-if="completedNotification?.show" class="analysis-done-banner">
        <div class="banner-content">
          <svg class="banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="banner-text">{{ $t('songPitch.analysisCompleteBanner', { title: completedNotification.title }) }}</span>
          <button @click="viewCompletedSong(completedNotification.songId)" class="banner-view-btn">{{ $t('songPitch.viewResult') }}</button>
          <button @click="completedNotification = null" class="banner-close-btn">&times;</button>
        </div>
      </div>
    </Transition>

    <!-- 分析歌曲选项栏 -->
    <div class="group fixed right-5 -top-96 min-w-72 shadow-lg shadow-inner p-3 bg-white rounded-md h-96 transition-all duration-300 z-10
    hover:top-0 hover:z-20"
    ref="analysisArea"
    :class="{ 'hover-state': isHovered }"
    @mouseenter="onPanelEnter"
    @mouseleave="onPanelLeave">
      <div class="h-18 flex items-center justify-center w-full">
        <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-16 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
          <div class="flex flex-col items-center justify-center pt-5 pb-6">
              <svg class="w-8 h-8 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
              </svg>
              <p class="text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">{{ $t('mainView.listBar.uploadDescription[0]') }}</span> {{ $t('mainView.listBar.uploadDescription[1]') }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('mainView.listBar.uploadDescription[2]') }}</p>
          </div>
          <input id="dropzone-file" type="file" class="hidden" @change="chooseMusicFile" accept=".mp3, .wav" />
        </label>
      </div>
      <div v-if="songFile" class="my-0.5"><p class="text-xs text-gray-600 truncate">{{ songFile.name }}</p></div>
      <div class="mt-1 flex items-center justify-center gap-2">
        <button
        class="px-5 py-1 rounded shadow-lg hover:shadow active:shadow-inner transition-all font-bold active:bg-slate-100"
        @click="startAnanlyze" :disabled="songFile === null">{{ $t('mainView.listBar.analyzeButton') }}</button>
        <span v-show="processStr !== ''" class="text-xs text-gray-600">{{ processStr }}</span>
      </div>
      <div class="h-48 mt-2 bg-amber-100 flex flex-col z-20">
        <!-- Tab 头部（使用与已分析列表按钮一致的样式） -->
        <div class="text-left bg-white">
          <span @click="switchListTab('local')" :class="['p-1 rounded-t px-2 font-bold cursor-pointer transition-all', activeListTab === 'local' ? 'bg-amber-300 shadow' : 'text-gray-400 hover:text-gray-600']">{{ $t('songPitch.localTab') }}</span>
          <span @click="switchListTab('cloud')" :class="['p-1 rounded-t px-2 font-bold cursor-pointer transition-all', activeListTab === 'cloud' ? 'bg-amber-300 shadow' : 'text-gray-400 hover:text-gray-600']">{{ $t('songPitch.cloudTab') }}</span>
        </div>
        <!-- 本地列表 -->
        <div v-show="activeListTab === 'local'" class="px-3 flex-1 overflow-y-auto">
          <div v-for="(song, index) in analyzedSong" :key="'local-'+index" class="border-b py-1">
            {{song.name}}
            <button @click="showSong(song)"
            class="ml-1 p-1 rounded shadow-lg bg-amber-300 hover:shadow active:shadow-inner transition-all font-bold active:bg-slate-100">{{ $t('mainView.listBar.showButton') }}</button>
            <button @click="deleteSong(song.name, index)"
            class="ml-1 p-1 rounded shadow-lg bg-stone-300 hover:shadow active:shadow-inner transition-all font-bold active:bg-slate-100">{{ $t('mainView.listBar.deleteButton') }}</button>
          </div>
          <div v-if="analyzedSong.length === 0" class="text-center text-gray-400 text-xs py-4">{{ $t('songPitch.noLocalSongs') }}</div>
        </div>
        <!-- 云端列表 -->
        <div v-show="activeListTab === 'cloud'" class="px-3 flex-1 overflow-y-auto">
          <div v-if="!currentUser" class="text-center py-4">
            <p class="text-xs text-gray-500 mb-2">{{ $t('songPitch.loginToViewCloud') }}</p>
            <button @click="showLoginDialog = true" class="text-xs px-3 py-1 bg-orange-400 text-white rounded shadow hover:bg-orange-500 transition-all">{{ $t('songPitch.login') }}</button>
          </div>
          <div v-else-if="cloudSongsLoading" class="text-center text-gray-400 text-xs py-4">{{ $t('songPitch.loading') }}</div>
          <template v-else>
            <div v-for="song in cloudSongs" :key="'cloud-'+song.id" class="border-b py-1 flex items-center gap-1">
              <span class="flex-1 text-sm truncate">{{ song.title || $t('songPitch.untitled') }}</span>
              <span :class="['status-badge', song.status]">{{ statusLabel(song.status) }}</span>
              <button v-if="song.status === 'completed'" @click="loadCloudSong(song.id)"
                class="p-1 rounded shadow-lg bg-amber-300 hover:shadow active:shadow-inner transition-all font-bold active:bg-slate-100 text-xs">{{ $t('songPitch.viewResult') }}</button>
            </div>
            <div v-if="cloudSongs.length === 0" class="text-center text-gray-400 text-xs py-4">{{ $t('songPitch.noCloudSongs') }}</div>
          </template>
        </div>
      </div>
      <div class="mt-2 space-x-2">
        <router-link
            to="/separate"
            class="ml-1 p-1 bg-slate-200 rounded hover:shadow active:shadow-inner transition-all font-bold active:bg-slate-100">
            {{ $t('mainView.listBar.separateButton') }}
          </router-link>
          <router-link
            to="/"
            class="ml-1 p-1 bg-slate-200 rounded hover:shadow active:shadow-inner transition-all font-bold active:bg-slate-100">
            {{ $t('mainView.listBar.firstButton') }}
          </router-link>
      </div>
      <div class="absolute -bottom-16 left-2 h-16 w-1/3 transition-all delay-200"
        :class="isHovered ? 'scale-y-0 -bottom-8' : ''">
        <div class="h-16 w-full bg-slate-500 transition w-16 rounded-b"></div>
      </div>
    </div>
    <!-- 快捷键说明选项栏 -->
    <ShortcutHelp />
    <!-- 音符显示区 -->
    <div class="flex-1 min-h-0 overflow-auto relative" id="canvasDiv" style="transform: rotateX(180deg);">
      <canvas
        id="note-canvas"
        width="300"
        height="300"
        @mousemove="handleCanvasMouseMove"
        @mouseleave="handleCanvasMouseLeave"
        @click="handleCanvasClick">
      </canvas>

      <!-- Pro 分析信息：BPM / 拍号 / 当前和弦 -->
      <div
        v-if="beats || (chords && chords.length > 0)"
        class="absolute bottom-2 left-2 z-10 flex items-center gap-1.5"
        style="transform: rotateX(180deg);">
        <span v-if="beats?.bpm" class="text-xs bg-black/50 text-white/80 px-1.5 py-0.5 rounded font-mono">
          &#9833; {{ Math.round(beats.bpm) }}
        </span>
        <span v-if="beats?.time_signature" class="text-xs bg-black/50 text-white/80 px-1.5 py-0.5 rounded font-mono">
          {{ beats.time_signature }}
        </span>
        <span v-if="currentChord && currentChord.chord !== 'N'"
              class="text-xs bg-purple-600/80 text-white px-2 py-0.5 rounded font-bold">
          {{ formatChordName(currentChord.chord) }}
        </span>
      </div>

      <!-- 空状态引导：列表为空且未加载音符时显示 -->
      <div
        v-if="analyzedSong.length === 0 && decodedNotes.length === 0 && !showProgressDialog"
        class="empty-guide"
        @click="loadDemoSong"
        style="transform: rotateX(180deg);">
        <div class="empty-guide-staff">
          <svg viewBox="0 0 320 130" xmlns="http://www.w3.org/2000/svg">
            <g stroke="#c4a882" stroke-width="1">
              <line x1="0" y1="20" x2="320" y2="20"/>
              <line x1="0" y1="36" x2="320" y2="36"/>
              <line x1="0" y1="52" x2="320" y2="52"/>
              <line x1="0" y1="68" x2="320" y2="68"/>
              <line x1="0" y1="84" x2="320" y2="84"/>
            </g>
            <text x="6" y="68" font-size="52" font-family="serif" fill="#5a3e2b" opacity="0.7">&#119070;</text>
            <g class="empty-staff-notes">
              <ellipse cx="68" cy="52" rx="7" ry="5.5" fill="#D94E1F" transform="rotate(-15,68,52)"/>
              <line x1="74" y1="52" x2="74" y2="26" stroke="#D94E1F" stroke-width="1.8"/>
              <ellipse cx="88" cy="44" rx="7" ry="5.5" fill="#FF6B35" transform="rotate(-15,88,44)"/>
              <line x1="94" y1="44" x2="94" y2="18" stroke="#FF6B35" stroke-width="1.8"/>
              <ellipse cx="108" cy="36" rx="7" ry="5.5" fill="#D94E1F" transform="rotate(-15,108,36)"/>
              <line x1="114" y1="36" x2="114" y2="10" stroke="#D94E1F" stroke-width="1.8"/>
              <ellipse cx="128" cy="44" rx="7" ry="5.5" fill="#FF6B35" transform="rotate(-15,128,44)"/>
              <line x1="134" y1="44" x2="134" y2="18" stroke="#FF6B35" stroke-width="1.8"/>
              <ellipse cx="152" cy="52" rx="7" ry="5.5" fill="none" stroke="#D94E1F" stroke-width="2" transform="rotate(-15,152,52)"/>
              <line x1="158" y1="52" x2="158" y2="26" stroke="#D94E1F" stroke-width="1.8"/>
              <ellipse cx="176" cy="60" rx="7" ry="5.5" fill="none" stroke="#FF6B35" stroke-width="2" transform="rotate(-15,176,60)"/>
              <line x1="182" y1="60" x2="182" y2="34" stroke="#FF6B35" stroke-width="1.8"/>
              <ellipse cx="200" cy="44" rx="7" ry="5.5" fill="#D94E1F" transform="rotate(-15,200,44)"/>
              <line x1="206" y1="44" x2="206" y2="14" stroke="#D94E1F" stroke-width="1.8"/>
              <ellipse cx="218" cy="36" rx="7" ry="5.5" fill="#D94E1F" transform="rotate(-15,218,36)"/>
              <line x1="224" y1="36" x2="224" y2="10" stroke="#D94E1F" stroke-width="1.8"/>
              <line x1="206" y1="14" x2="224" y2="10" stroke="#D94E1F" stroke-width="2.5"/>
              <ellipse cx="240" cy="52" rx="7" ry="5.5" fill="#FF6B35" transform="rotate(-15,240,52)"/>
              <line x1="246" y1="52" x2="246" y2="26" stroke="#FF6B35" stroke-width="1.8"/>
              <ellipse cx="258" cy="44" rx="7" ry="5.5" fill="#FF6B35" transform="rotate(-15,258,44)"/>
              <line x1="264" y1="44" x2="264" y2="18" stroke="#FF6B35" stroke-width="1.8"/>
              <line x1="246" y1="26" x2="264" y2="18" stroke="#FF6B35" stroke-width="2.5"/>
              <ellipse cx="288" cy="52" rx="8" ry="6" fill="none" stroke="#D94E1F" stroke-width="2.5" transform="rotate(-15,288,52)"/>
            </g>
          </svg>
        </div>
        <p class="empty-guide-title">{{ $t('mainView.emptyGuide.title') }}</p>
        <p class="empty-guide-sub">{{ $t('mainView.emptyGuide.subTitle') }}</p>
      </div>

      <!-- 音符信息悬浮框 (Dev功能) -->
      <transition name="tooltip">
        <div
          v-if="false && hoveredNote"
          class="absolute z-30 bg-gray-900/95 text-white text-xs rounded-lg p-3 pointer-events-none max-w-xs"
          :style="{ transform: 'rotateX(180deg)', left: tooltipX + 'px', top: tooltipY + 'px' }">
          <div class="font-bold text-purple-300 mb-2">{{ $t('songPitch.noteInfoDev') }}</div>
          <div class="space-y-1">
            <div><span class="text-gray-400">MIDI:</span> {{ hoveredNote.pitchMidi }}</div>
            <div><span class="text-gray-400">{{ $t('songPitch.startTime') }}</span> {{ hoveredNote.startTimeSeconds.toFixed(3) }}s</div>
            <div><span class="text-gray-400">{{ $t('songPitch.duration') }}</span> {{ hoveredNote.durationSeconds.toFixed(3) }}s</div>
            <div><span class="text-gray-400">{{ $t('songPitch.volume') }}</span> {{ (hoveredNote.amplitude * 100).toFixed(1) }}%</div>
            <div v-if="hoveredNote.isDynamic !== undefined">
              <span class="text-gray-400">{{ $t('songPitch.type') }}</span>
              <span :class="hoveredNote.isDynamic ? 'text-cyan-400' : 'text-gray-400'">
                {{ hoveredNote.isDynamic ? $t('songPitch.dynamic') : $t('songPitch.steady') }}
              </span>
            </div>
            <div v-if="hoveredNote.pitchBends && hoveredNote.pitchBends.length > 0">
              <span class="text-gray-400">{{ $t('songPitch.bendAmount') }}</span> {{ hoveredNote.pitchBends.length }}
            </div>
            <div v-if="hoveredNote.pitchBends && hoveredNote.pitchBends.length > 0" class="mt-2">
              <div class="text-gray-400 mb-1">{{ $t('songPitch.bendArray') }}</div>
              <div class="bg-gray-800 rounded px-2 py-1 text-xs font-mono break-all max-h-20 overflow-y-auto">
                {{ formatPitchBendsArray(hoveredNote.pitchBends) }}
              </div>
            </div>
            <div v-if="getPitchBendEndValue(hoveredNote) !== null" class="mt-1">
              <span class="text-gray-400">{{ $t('songPitch.bendEnd') }}</span>
              <span class="text-yellow-400 font-mono">{{ getPitchBendEndValue(hoveredNote).toFixed(3) }}</span>
            </div>
          </div>
        </div>
      </transition>
    </div>
    <div class="w-full h-20 flex flex-row flex-shrink-0">
      <div class="flex-1 h-full flex flex-row relative" v-for="(octave, octaveIndex) in octaveNum" :key="octaveIndex">
        <!-- 白键 -->
        <div
          v-for="(scale, scaleIndex) in [0, 2, 4, 5, 7, 9, 11]"
          :key="`white-${octaveIndex}-${scaleIndex}`"
          class="key-white bg-black cursor-pointer hover:bg-gray-200 transition-colors"
          :class="{ 'key-active': activePitches.has(lowestPitch + octave * 12 + scale - 12) }"
          @mousedown="playPianoNote(lowestPitch + octave * 12 + scale - 12)">
          <div class="w-full h-full px-px bg-white bg-clip-content"></div>
        </div>
        <!-- 黑键 -->
        <div
          v-for="(blackScale, blackIndex) in [
            { scale: 1, left: firstBlack },
            { scale: 3, left: secondBlack },
            { scale: 6, left: thirdBlack },
            { scale: 8, left: forthBlack },
            { scale: 10, left: fifthBlack }
          ]"
          :key="`black-${octaveIndex}-${blackIndex}`"
          class="key-black bg-black absolute z-99 h-1/2 cursor-pointer hover:bg-gray-600 transition-colors"
          :class="{ 'key-black-active': activePitches.has(lowestPitch + octave * 12 + blackScale.scale - 12) }"
          :style="'left: '+blackScale.left+'%;'"
          @mousedown="playPianoNote(lowestPitch + octave * 12 + blackScale.scale - 12)">
        </div>
      </div>
    </div>
    <!-- 歌曲播放栏 -->
    <div class="flex-shrink-0">
      <audio-player ref="audioPlayer" @timeupdate="timeUpdate"></audio-player>
    </div>

    <!-- 动态音符分析按钮 -->
    <div class="absolute bottom-44 left-4 z-20">
      <button
        @click="showDynamicInfoDialog = !showDynamicInfoDialog"
        class="bg-orange-300 w-14 h-14 text-white rounded-full border-[3.5px] border-[#6e6e96] shadow-lg hover:drop-shadow-xl transition-all duration-300 flex items-center justify-center">
        <MusicNote class="w-8 h-8 text-stone-600" />
      </button>
    </div>

    <!-- 动态音符分析弹窗 -->
    <DynamicInfoDialog
      :show="showDynamicInfoDialog"
      :stats="dynamicStats"
      :current-scheme="colorScheme"
      :filter-settings="filterSettings"
      :analysis-mode="analysisMode"
      :has-tracks="hasTracks"
      :track-filters="trackFilters"
      :track-colors="trackColors"
      :current-user="currentUser"
      :is-premium-user="isPremium"
      :plan-level="planLevel"
      @close="showDynamicInfoDialog = false"
      @update:currentScheme="updateColorScheme"
      @update:filterSettings="updateFilterSettings"
      @update:trackFilters="updateTrackFilters"
      @navigate-profile="goToProfile"
      @logout="logoutFromSettings"
      @login="loginFromSettings" />

    <!-- 分析进度对话框 -->
    <CustomProgressNotification
      :show="showProgressDialog"
      :title="progressTitle"
      :message="progressMessage"
      :progress="analysisProgress"
    />

    <!-- 云端加载进度对话框 -->
    <CustomProgressNotification
      :show="showCloudLoading"
      :title="$t('songPitch.loadCloudProject')"
      :message="$t('songPitch.downloadingData')"
      :progress="cloudLoadingProgress"
      @close="showCloudLoading = false"
    />

    <!-- 分析模式选择弹窗 -->
    <AnalysisModeDialog
      :show="showModeDialog"
      :quota-exhausted="!isPremium && storageQuota.monthly_limit > 0 && storageQuota.monthly_used >= storageQuota.monthly_limit"
      :quota="storageQuota"
      @close="showModeDialog = false"
      @selectLocal="startLocalAnalysis"
      @selectPro="startProAnalysis"
    />

    <!-- 登录弹窗 -->
    <LoginDialog
      :show="showLoginDialog"
      @close="showLoginDialog = false"
      @loggedIn="onLoginSuccess"
    />

    <!-- 专业版分析进度弹窗 -->
    <ProAnalysisProgressDialog
      :show="showProProgress"
      :stage="proProgressStage"
      :stage-label="proProgressStageLabel"
      :percent="proProgressPercent"
      :estimated-seconds="proProgressEstimated"
      :is-completed="proProgressCompleted"
      :is-failed="proProgressFailed"
      :error-msg="proProgressError"
      @cancel="cancelProAnalysis"
      @close="showProProgress = false"
      @background="sendToBackground"
    />

    <!-- 存储配额管理弹窗 -->
    <StorageQuotaDialog
      :show="showStorageQuota"
      :quota="storageQuota"
      :projects="serverProjects"
      @close="showStorageQuota = false"
      @freed="onStorageFreed"
    />

    <QuotaExhaustedDialog
      :show="showQuotaExhausted"
      :quota-type="quotaExhaustedType"
      :quota="storageQuota"
      @close="showQuotaExhausted = false"
    />

  </div>
</template>

<script>
import AudioPlayer from './AudioPlayer.vue'
import { BasicPitch } from '@spotify/basic-pitch';
import * as tf from '@tensorflow/tfjs';
import songDB from '@/store/Song'
import ShortcutHelp from '@/components/ShortcutHelp.vue'
import SoundTagger from '@/js/SoundTagger.js'
import DynamicInfoDialog from '@/components/DynamicInfoDialog.vue'
import CustomProgressNotification from '@/components/CustomProgressNotification.vue'
import AnalysisModeDialog from '@/components/AnalysisModeDialog.vue'
import LoginDialog from '@/components/LoginDialog.vue'
import ProAnalysisProgressDialog from '@/components/ProAnalysisProgressDialog.vue'
import StorageQuotaDialog from '@/components/StorageQuotaDialog.vue'
import QuotaExhaustedDialog from '@/components/QuotaExhaustedDialog.vue'
import { MusicAnalysis, MusicNote } from '@/components/icons'
import { filterNotes } from '@/js/noteFilter.js'
import { mergeNotes } from '@/js/noteMerger.js'
import { loadConfig, saveConfig, DEFAULT_FILTER_SETTINGS } from '@/js/configManager.js'
import authApi from '@/api/auth'
import { useAuthStore } from '@/store/modules/auth'
import { startAnalysis, getAnalysisProgress, getSong, getAnalysisQuota, getSongList, convertBackendResult, pollAnalysisUntilComplete } from '@/api/analysis'
import { isPaidPlan } from '@/js/planConstants'
import { push } from 'notivue'
export default {
  name: 'SongPitch',
  props: {
    msg: String
  },
  components: {
    AudioPlayer,
    ShortcutHelp,
    DynamicInfoDialog,
    CustomProgressNotification,
    AnalysisModeDialog,
    LoginDialog,
    ProAnalysisProgressDialog,
    StorageQuotaDialog,
    QuotaExhaustedDialog,
    MusicAnalysis,
    MusicNote
  },
  computed: {
    /**
     * 获取当前正在播放的音符的MIDI音高列表
     * @returns {Set} 当前活跃的音符MIDI集合
     */
    activePitches() {
      const activeSet = new Set()

      if (!this.decodedNotes || this.decodedNotes.length === 0) {
        return activeSet
      }

      const previewTime = 0.15 // 预览时间窗口（提前0.15秒高亮）
      const currentTime = this.playTime

      // 遍历音符，找到当前正在播放的
      for (let i = this.lastPastNoteIndex; i < this.decodedNotes.length; i++) {
        const note = this.decodedNotes[i]
        const noteStart = note.startTimeSeconds
        const noteEnd = note.startTimeSeconds + note.durationSeconds

        // 检查音符是否在播放中或即将播放
        if (currentTime >= noteStart - previewTime && currentTime <= noteEnd) {
          activeSet.add(note.pitchMidi)
        }

        // 如果音符开始时间已经超过当前时间+5秒，停止检查
        if (noteStart > currentTime + 5) {
          break
        }
      }

      return activeSet
    },

    /**
     * 根据进度返回当前阶段的标题
     */
    progressTitle() {
      if (this.analysisProgress < 80) {
        return this.$t('mainView.listBar.analyzingTitle')
      } else {
        return this.$t('mainView.listBar.processingTitle')
      }
    },

    /**
     * 根据进度返回当前阶段的消息
     */
    progressMessage() {
      if (this.analysisProgress < 80) {
        return this.$t('mainView.listBar.analyzingMessage')
      } else {
        return this.$t('mainView.listBar.processingMessage')
      }
    },

    /** 当前音符数据是否包含多音轨信息 */
    hasTracks() {
      return this.rawNotes.length > 0 && this.rawNotes.some(n => n.trackName)
    },

    /** 当前配色方案的音轨颜色（与 Canvas 渲染一致） */
    trackColors() {
      const scheme = this.colorSchemes[this.colorScheme]
      if (scheme?.tracks && this.hasTracks) return scheme.tracks
      // 回退：从音符数据提取（如从 IndexedDB 加载的旧数据）
      const colors = {}
      for (const note of this.rawNotes) {
        if (note.trackName && note.trackColor && !colors[note.trackName]) {
          colors[note.trackName] = note.trackColor
        }
      }
      return colors
    },

    /** 当前播放位置对应的和弦 */
    currentChord() {
      if (!this.chords || this.chords.length === 0) return null
      return this.chords.find(c => this.playTime >= c.start && this.playTime < c.end)
    }
  },
  watch: {
    currentUser(newVal) {
      if (!newVal) {
        this.stopBackgroundPolling()
        this.backgroundAnalysisIds = []
        this.completedNotification = null
      }
    }
  },
  data() {
    return {
      firstBlack: (1/7 - 1/28) * 100,   // c#音符的left值
      secondBlack: (2/7 - 1/28) * 100,  // d#音符的left值
      thirdBlack: (4/7 - 1/28) * 100,   // f#音符的left值
      forthBlack: (5/7 - 1/28) * 100,   // g#音符的left值
      fifthBlack: (6/7 - 1/28) * 100,   // a#音符的left值
      octaveNum: 6,     // 八度的个数
      lowestPitch: 24,  // 最低音符的工业数字
      rawNotes: [],     // 原始音符数据（不可变）
      decodedNotes: [], // 当前显示的音符（过滤/合并后）
      filterSettings: { ...DEFAULT_FILTER_SETTINGS }, // 过滤设置
      playTime: 0,
      timeInterval: null,
      songFile: null,
      processStr: '',
      magnification: 100,   //音符长度放大倍数，便于显示
      analyzedSong: [],
      processStatus: 'none', // none-未工作 running-正在分析 encoding-正在解析结果
      chosenFile: false, //仅用于记录当前songFile是否是上传文件
      noteAreaWidth: 0,
      noteAreaHeight: 0,
      showingSecond: 5,  //要在屏幕上显示从当前位置往后”多少”秒的音符
      secondLength: 1,  //每一秒对应在canvas中的长度，用于约束音符的长度
      amplitudeMag: 0,
      lastPastNoteIndex: 0, //记录已经播放过的音符中最后一个的下标
      isHovered: false, //用来提醒用户右上角可以hover上去展开
      findingLastNote: 0, //手动修改播放时间后，程序是否正在寻找最后一个已播放音符 0-未在查找 大于1-正在查找，且数字表示查找过程中被打断渲染的次数。如果次数太大说明程序出问题了，就强迫渲染
      noteCtx: null,
      soundTagger: null, // 声音标签分析器
      enableDynamicAnalysis: true, // 是否启用动态音符分析
      dynamicStats: null, // 动态音符统计信息
      showDynamicInfoDialog: false, // 是否显示动态音符信息弹窗
      showProgressDialog: false, // 是否显示分析进度对话框
      analysisProgress: 0, // 分析进度（0-100）
      colorScheme: loadConfig().colorScheme || 'classic', // 颜色方案
      colorSchemes: { // 颜色方案配置
        classic: {
          dynamic: '#84cc16',
          stable: '#f59e0b',
          tracks: { vocals: '#06b6d4', bass: '#f59e0b', drums: '#57534e', other: '#84cc16' }
        },
        ocean: {
          dynamic: '#0EA5E9',
          stable: '#64748B',
          tracks: { vocals: '#FF7675', bass: '#FBBF24', drums: '#94A3B8', other: '#0284C7' }
        },
        sunset: {
          dynamic: '#FF6B35',
          stable: '#F472B6',
          tracks: { vocals: '#FBBF24', bass: '#F472B6', drums: '#A78BFA', other: '#EA580C' }
        },
        forest: {
          dynamic: '#10B981',
          stable: '#8B5CF6',
          tracks: { vocals: '#F87171', bass: '#8B5CF6', drums: '#D97706', other: '#10B981' }
        }
      },
      hoveredNote: null, // 当前悬停的音符
      tooltipX: 0,
      tooltipY: 0,
      audioContext: null, // 音频上下文
      // ─── 专业版分析相关 ───
      analysisMode: 'none', // 'none' | 'local' | 'pro'
      showModeDialog: false, // 分析模式选择弹窗
      showLoginDialog: false, // 登录弹窗
      pendingProAnalysis: false, // 用户点击了"开始分析"但未登录，登录后继续
      showProProgress: false, // 专业版进度弹窗
      showStorageQuota: false, // 存储配额弹窗
      showQuotaExhausted: false, // 月度额度耗尽弹窗
      quotaExhaustedType: 'monthly', // 'monthly' | 'daily'
      currentUser: null, // 当前登录用户
      isPremium: false, // 是否为付费用户（兼容）
      planLevel: 'free', // 当前套餐等级 free/basic/pro/studio/custom
      proProgressPercent: 0, // 专业版进度百分比
      proProgressStage: 'separating', // 当前阶段
      proProgressStageLabel: '', // 阶段标签
      proProgressEstimated: 0, // 预估剩余时间（秒）
      proProgressCompleted: false, // 分析是否完成
      proProgressFailed: false, // 分析是否失败
      proProgressError: '', // 错误信息
      proAnalysisPollPromise: null, // 轮询 Promise（用于取消）
      storageQuota: { storage_limit: 1, storage_used: 0, monthly_limit: 1, monthly_used: 0, max_duration: 180, daily_limit: -1, daily_used: 0, features: {}, plan_level: 'free' },
      serverProjects: [], // 服务端项目列表
      beats: null, // 节拍数据
      chords: null, // 和弦数据
      trackFilters: { vocals: true, bass: true, drums: true, other: true }, // 音轨过滤
      // ─── 云端加载相关 (Feature 1) ───
      showCloudLoading: false,
      cloudLoadingProgress: 0,
      // ─── 已分析列表云端 Tab (Feature 3) ───
      activeListTab: 'local',
      cloudSongs: [],
      cloudSongsLoading: false,
      // ─── 后台分析相关 (Feature 2 & 4) ───
      currentProAnalysisId: null,
      currentProAnalysisTitle: '',
      backgroundPollingTimer: null,
      backgroundAnalysisIds: [], // [{ songId, title }]
      completedNotification: null, // { songId, title, show: true }
    }
  },
  methods: {
    /**
     * 使用 Worker 进行音符后处理（转换 + 弯音 + 排序），避免阻塞主线程
     * @param {Array} frames - 帧数据
     * @param {Array} onsets - 起始点数据
     * @param {Array} contours - 轮廓数据
     * @param {Function} onProgress - 进度回调
     * @returns {Promise<Array>} 处理后的音符数组（包含弯音信息）
     */
    processNotesWithWorker(frames, onsets, contours, onProgress = null) {
      return new Promise((resolve, reject) => {
        // 创建 Worker
        const worker = new Worker(new URL('@/js/note-processor-worker.js', import.meta.url), { type: 'module' })

        worker.onmessage = (e) => {
          const { type, step, progress, notes, error } = e.data

          if (type === 'progress') {
            if (onProgress) onProgress(step, progress)
          } else if (type === 'complete') {
            worker.terminate()
            resolve(notes)
          } else if (type === 'error') {
            worker.terminate()
            reject(new Error(error))
          }
        }

        worker.onerror = (error) => {
          worker.terminate()
          reject(error)
        }

        // 发送处理请求
        worker.postMessage({
          type: 'process',
          data: {
            frames,
            onsets,
            contours,
            onsetThreshold: 0.25,
            frameThreshold: 0.25,
            minNoteLength: 5
          }
        })
      })
    },

    //将采样率下降到22050
    async resampleAudioBuffer(songBuffer) {
      const wavBuffer = songBuffer
      const audioCtx = new AudioContext();
      let audioBuffer = undefined;
      const decodedBuffer = await audioCtx.decodeAudioData(
        wavBuffer,
        async (_audioBuffer) => {
          audioBuffer = _audioBuffer;
        },
        () => {},
      )
      const audioDuration = decodedBuffer.duration
      var offlineCtx = new OfflineAudioContext(1, 22050 * audioDuration, 22050);
      const source = new AudioBufferSourceNode(offlineCtx, {
        buffer: decodedBuffer,
      });
      source.connect(offlineCtx.destination);
      await source.start();
      const renderedBuffer = await offlineCtx.startRendering()
      while (audioBuffer === undefined) {
        await new Promise(r => setTimeout(r, 1));
      }
      return renderedBuffer
    },
    startAnanlyze() {
      if(!this.chosenFile) {
        return
      }
      if(this.processStr !== '') {
        return
      }
      // 弹出分析模式选择面板（如果还没选过）
      if (this.analysisMode === 'none') {
        this.chooseAnalysisMode()
        return
      }
      // 已经选定模式，直接执行
      let that = this
      let fr = new FileReader()
      fr.readAsArrayBuffer(this.songFile)
      fr.addEventListener('loadend', (e)=> {
        that.getPitches(e.target.result)
      })
    },
    async getPitches(songBuffer) {
      let that = this
      const frames = []
      const onsets = []
      const contours = []

      // 显示进度对话框
      this.showProgressDialog = true
      this.analysisProgress = 0

      try {
        // 步骤1: 加载模型
        const model = await tf.loadGraphModel(`/model.json`)

        // 步骤2: 重采样音频（这会 detach songBuffer）
        const renderedBuffer = await this.resampleAudioBuffer(songBuffer)

        // 步骤3: 创建 BasicPitch 实例
        const basicPitch = new BasicPitch(model);

        // 步骤4: 模型评估（0-80%）
        await basicPitch.evaluateModel(
          renderedBuffer,
          (f, o, c) => {
            frames.push(...f);
            onsets.push(...o);
            contours.push(...c);
          },
          (p) => {
            that.analysisProgress = p * 80
          }
        );

        // 步骤5: Worker 后处理（80-95%）
        this.analysisProgress = 82
        const rawNotes = await this.processNotesWithWorker(frames, onsets, contours, (step, progress) => {
          this.analysisProgress = 82 + progress * 0.13
        })

        // 步骤6: 存储原始音符数据
        this.rawNotes = rawNotes

        // 步骤7: 动态音符分析（在原始数据上）
        if (this.enableDynamicAnalysis) {
          this.rawNotes = this.analyzeDynamicNotes(this.rawNotes)
        }

        // 步骤8: 应用过滤设置并更新显示
        this.analysisProgress = 98
        this.updateDisplayNotes()

        // 显示音符并保存到数据库
        this.showProgressDialog = false
        this.showNotes()

        await songDB.add(this.songFile.name, this.songFile, this.decodedNotes)
        this.getAnalysizedSongList()

      } catch (error) {
        console.error('音高分析失败:', error)
        this.$notify?.({
          type: 'error',
          title: this.$t('songPitch.analysisFailed'),
          message: error.message || this.$t('songPitch.analysisError')
        })
      } finally {
        // 无论成功还是失败，都关闭进度对话框
        this.showProgressDialog = false
        this.analysisProgress = 0
      }
    },
    //扩大音符强度
    changeNoteAmplitude() {
      if(this.amplitudeMag !== 0) {
        return
      }
      let maxAmplitude = 0
      this.decodedNotes.forEach(singleNote=> {
        if(singleNote.amplitude > maxAmplitude) {
          maxAmplitude = singleNote.amplitude
        }
      })
      
      const  magnification = 1/maxAmplitude
      this.decodedNotes.forEach(singleNote=> {
        if(singleNote.amplitude > maxAmplitude) {
          singleNote.amplitude *= magnification
        }

        //修改其他显示参数
        let octave = Math.floor((singleNote.pitchMidi - this.lowestPitch)/12) //计算在哪个八度上
        let scale = (singleNote.pitchMidi - this.lowestPitch)%12  //计算在该八度上的具体音高
        singleNote.x = octave/this.octaveNum + this.getScaleLeft(scale) //x（单位%）离左侧的距离为多少%
        singleNote.width = 1/(this.octaveNum*18)
        singleNote.y = singleNote.startTimeSeconds
        singleNote.height = singleNote.durationSeconds
      })
      this.amplitudeMag = magnification
    },
    showNotes(isManual = true) {
      // 清空canvas
      const canvas = document.getElementById('note-canvas');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if(isManual) {
        this.findLastPlayNote()
      } else {
        if(this.findingLastNote > 0) {
          // 正在查找最后一个未播放完的音符，直接返回
          this.findingLastNote++
          if(this.findingLastNote < 80) {
            return
          }
        }
      }

      // 绘制节拍线、小节线和和弦标签（Pro 版数据）
      if (this.beats) {
        this.drawBeatsAndMeasures(ctx)
      }
      if (this.chords && this.chords.length > 0) {
        this.drawChordLabels(ctx)
      }

      // 修复：每次都从头开始遍历，避免跳过未结束的长音符
      // 因为音符是按开始时间排序的，不是按结束时间排序的
      let i = 0
      let newLastPastIndex = 0
      while(this.decodedNotes.length > i) {
        const singleNote = this.decodedNotes[i]
        const noteEndTime = singleNote.startTimeSeconds + singleNote.durationSeconds

        if(this.playTime > noteEndTime) {  // 音符已结束
          newLastPastIndex = i  // 记录最后一个已结束音符的索引
        } else {  // 音符未结束或即将开始
          if(singleNote.startTimeSeconds - this.playTime < 10) {   // 只显示当前时间往后10s范围内的音符
            this.drawNote(singleNote)
          } else {
            break  // 后面的音符都在10秒之后，停止遍历
          }
        }
        i++
      }
      // 遍历结束后更新 lastPastNoteIndex
      this.lastPastNoteIndex = newLastPastIndex
    },
    drawNote(singleNote) {
      // 计算基于音量的透明度（音量越小越淡）
      const minOpacity = 0.2;
      const maxOpacity = 1.0;
      const amplitude = singleNote.amplitude || 0.5;
      const opacity = minOpacity + (maxOpacity - minOpacity) * amplitude;

      let color;
      if (singleNote.trackName) {
        // 专业版：按音轨着色（优先使用当前配色方案的音轨色）
        const scheme = this.colorSchemes[this.colorScheme]
        const schemeColor = scheme?.tracks?.[singleNote.trackName]
        const hex = (schemeColor || singleNote.trackColor).replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        color = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      } else {
        // 普通版：根据动态/平稳双色渲染
        const scheme = this.colorSchemes[this.colorScheme] || this.colorSchemes.sunset;
        const hexStr = singleNote.isDynamic ? scheme.dynamic : scheme.stable;
        const hex = hexStr.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        color = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }

      this.noteCtx.fillStyle = color;
      this.noteCtx.fillRect(
        singleNote.x * this.noteAreaWidth,
        (singleNote.y - this.playTime) * this.secondLength,
        singleNote.width * this.noteAreaWidth,
        singleNote.height * this.secondLength
      );
    },

    /**
     * 绘制节拍线和小节线（Pro 版数据）
     */
    drawBeatsAndMeasures(ctx) {
      const { beats, downbeats } = this.beats
      if (!beats || beats.length === 0) return

      const visibleStart = this.playTime
      const visibleEnd = this.playTime + this.showingSecond

      // 绘制 beat 线（细、浅）
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)'
      ctx.lineWidth = 1
      for (const beatTime of beats) {
        if (beatTime < visibleStart) continue
        if (beatTime > visibleEnd) break
        const y = (beatTime - this.playTime) * this.secondLength
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(this.noteAreaWidth, y)
        ctx.stroke()
      }

      // 绘制 downbeat / 小节线（粗、深）+ 小节号
      if (downbeats && downbeats.length > 0) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.14)'
        ctx.lineWidth = 1.5
        for (let i = 0; i < downbeats.length; i++) {
          const dbTime = downbeats[i]
          if (dbTime < visibleStart) continue
          if (dbTime > visibleEnd) break
          const y = (dbTime - this.playTime) * this.secondLength
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(this.noteAreaWidth, y)
          ctx.stroke()

          // 小节序号（右下角，counter-rotate 修正 CSS rotateX）
          ctx.save()
          ctx.translate(this.noteAreaWidth - 4, y + 2)
          ctx.scale(1, -1)
          ctx.font = '10px system-ui, sans-serif'
          ctx.fillStyle = 'rgba(0, 0, 0, 0.22)'
          ctx.textAlign = 'right'
          ctx.textBaseline = 'top'
          ctx.fillText(String(i + 1), 0, 0)
          ctx.restore()
        }
      }
    },

    /**
     * 绘制和弦标签（Pro 版数据）
     */
    drawChordLabels(ctx) {
      if (!this.chords || this.chords.length === 0) return

      const visibleStart = this.playTime
      const visibleEnd = this.playTime + this.showingSecond

      ctx.font = 'bold 13px system-ui, sans-serif'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'left'

      for (const chord of this.chords) {
        if (chord.end < visibleStart) continue
        if (chord.start > visibleEnd) break
        if (chord.chord === 'N') continue

        const y = (chord.start - this.playTime) * this.secondLength
        if (y < 0 || y > this.noteAreaHeight) continue

        const displayChord = this.formatChordName(chord.chord)
        const textWidth = ctx.measureText(displayChord).width
        const padX = 6, padY = 4
        const bgW = textWidth + padX * 2
        const bgH = 13 + padY * 2

        // counter-rotate 修正 CSS rotateX(180deg)
        ctx.save()
        ctx.translate(8, y)
        ctx.scale(1, -1)

        // 背景
        ctx.fillStyle = 'rgba(30, 30, 50, 0.72)'
        ctx.beginPath()
        if (ctx.roundRect) {
          ctx.roundRect(0, -bgH / 2, bgW, bgH, 3)
        } else {
          ctx.rect(0, -bgH / 2, bgW, bgH)
        }
        ctx.fill()

        // 和弦文字
        ctx.fillStyle = '#fff'
        ctx.fillText(displayChord, padX, 0)
        ctx.restore()
      }
    },

    /**
     * 格式化和弦名称：'Eb:maj' → 'Ebmaj', 'Ab:min7' → 'Abm7', 'C:maj7' → 'Cmaj7'
     */
    formatChordName(name) {
      if (!name || name === 'N') return ''
      return name
        .replace(':min', 'm')
        .replace(':', '')
    },

    /**
     * 分析动态音符
     * @param {Array} notes - 音符数组
     * @returns {Array} 添加了动态标记的音符数组
     */
    analyzeDynamicNotes(notes) {
      return notes.map(note => {
        let isDynamic = false;

        // 检查是否有 pitchBends
        if (note.pitchBends && note.pitchBends.length > 0) {
          // 提取 pitchBend 值
          const bends = note.pitchBends.map(b => {
            if (typeof b === 'number') return b;
            if (b && typeof b === 'object' && 'pitchBend' in b) return b.pitchBend;
            return 0;
          });

          // 计算方差
          const mean = bends.reduce((a, b) => a + b, 0) / bends.length;
          const variance = bends.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / bends.length;

          // 如果方差大于阈值，则为动态音符
          // 阈值设为 0.05，这样可以捕捉到明显的音高变化
          isDynamic = variance > 0.05;
        }

        return {
          ...note,
          isDynamic: isDynamic
        };
      });
    },

    /**
     * 获取动态音符统计信息
     */
    getDynamicStatistics(notes) {
      const stats = {
        total: notes.length,
        byType: {
          dynamic: 0,
          stable: 0
        }
      };

      notes.forEach(note => {
        if (note.isDynamic) {
          stats.byType.dynamic++;
        } else {
          stats.byType.stable++;
        }
      });

      return stats;
    },

    /**
     * 更新颜色方案
     */
    updateColorScheme(scheme) {
      this.colorScheme = scheme;
      // 保存到配置
      const config = loadConfig();
      config.colorScheme = scheme;
      saveConfig(config);
      // 重新绘制音符
      this.showNotes(false);
    },

    /**
     * 更新过滤设置（带防抖）
     * @param {Object} settings - 新的过滤设置
     */
    updateFilterSettings(settings) {
      // 检查是否有实际变化
      if (JSON.stringify(this.filterSettings) === JSON.stringify(settings)) {
        return;
      }
      this.filterSettings = { ...settings };
      // 使用防抖避免频繁更新
      if (this._updateDisplayTimeout) {
        clearTimeout(this._updateDisplayTimeout);
      }
      this._updateDisplayTimeout = setTimeout(() => {
        this.updateDisplayNotes();
      }, 100);
    },

    /**
     * 根据过滤设置更新显示的音符
     */
    updateDisplayNotes() {
      if (!this.rawNotes || this.rawNotes.length === 0) {
        return;
      }

      // 多音轨模式走独立过滤逻辑
      if (this.hasTracks) {
        this.updateDisplayNotesForPro()
        return
      }

      let notes = [...this.rawNotes];

      // 注意处理顺序：
      // - 开启合并时：先合并，再过滤（让短音符有机会通过合并变长）
      // - 未开启合并：直接过滤
      if (this.filterSettings.enableMerge) {
        // 1. 先合并相邻音符
        notes = mergeNotes(notes, this.filterSettings.mergeGap);
        // 2. 再过滤短音符和低置信度音符
        notes = filterNotes(notes, this.filterSettings);
      } else {
        // 未开启合并，直接过滤
        notes = filterNotes(notes, this.filterSettings);
      }

      // 3. 计算显示参数
      this.decodedNotes = this.changeNoteAmplitudeForNotes(notes);

      // 4. 更新动态音符统计
      if (this.enableDynamicAnalysis) {
        this.dynamicStats = this.getDynamicStatistics(this.decodedNotes);
      }

      // 5. 重置播放索引并重新绘制
      this.lastPastNoteIndex = 0;
      this.showNotes();
    },

    /**
     * 为音符数组计算显示参数
     * @param {Array} notes - 音符数组
     * @returns {Array} 处理后的音符数组
     */
    changeNoteAmplitudeForNotes(notes) {
      if (notes.length === 0) return notes;

      // 计算最大振幅
      let maxAmplitude = 0;
      notes.forEach(note => {
        if (note.amplitude > maxAmplitude) {
          maxAmplitude = note.amplitude;
        }
      });

      const magnification = maxAmplitude > 0 ? 1 / maxAmplitude : 1;

      // 计算显示参数
      return notes.map(note => {
        const octave = Math.floor((note.pitchMidi - this.lowestPitch) / 12);
        const scale = (note.pitchMidi - this.lowestPitch) % 12;

        return {
          ...note,
          amplitude: note.amplitude * magnification,
          x: octave / this.octaveNum + this.getScaleLeft(scale),
          width: 1 / (this.octaveNum * 18),
          y: note.startTimeSeconds,
          height: note.durationSeconds
        };
      });
    },

    /**
     * 初始化音频上下文
     */
    initAudioContext() {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      // 恢复音频上下文（浏览器策略要求用户交互后才能播放）
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    },

    /**
     * 播放钢琴音符
     * @param {Number} midiNote - MIDI音符编号
     * @param {Number} duration - 持续时间（秒）
     */
    playPianoNote(midiNote, duration = 0.5) {
      this.initAudioContext();

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      // MIDI转频率
      const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);

      // 创建主振荡器（三角波，模拟钢琴基音）
      const mainOsc = ctx.createOscillator();
      mainOsc.type = 'triangle';
      mainOsc.frequency.setValueAtTime(frequency, now);

      // 创建泛音振荡器1（正弦波，模拟泛音）
      const harmonic1 = ctx.createOscillator();
      harmonic1.type = 'sine';
      harmonic1.frequency.setValueAtTime(frequency * 2, now);

      // 创建泛音振荡器2（正弦波，模拟高频泛音）
      const harmonic2 = ctx.createOscillator();
      harmonic2.type = 'sine';
      harmonic2.frequency.setValueAtTime(frequency * 3, now);

      // 创建增益节点（控制音量包络）
      const mainGain = ctx.createGain();
      const harmonic1Gain = ctx.createGain();
      const harmonic2Gain = ctx.createGain();

      // 音量包络（ADSR）
      const attackTime = 0.01; // 快速起音
      const decayTime = 0.1;   // 衰减时间
      const sustainLevel = 0.3; // 维持音量
      const releaseTime = 0.3;  // 释音时间

      // 主音量包络
      mainGain.gain.setValueAtTime(0, now);
      mainGain.gain.linearRampToValueAtTime(0.5, now + attackTime);
      mainGain.gain.exponentialRampToValueAtTime(sustainLevel * 0.6, now + attackTime + decayTime);
      mainGain.gain.exponentialRampToValueAtTime(0.01, now + duration + releaseTime);

      // 泛音1包络（较弱）
      harmonic1Gain.gain.setValueAtTime(0, now);
      harmonic1Gain.gain.linearRampToValueAtTime(0.15, now + attackTime);
      harmonic1Gain.gain.exponentialRampToValueAtTime(sustainLevel * 0.2, now + attackTime + decayTime);
      harmonic1Gain.gain.exponentialRampToValueAtTime(0.01, now + duration + releaseTime);

      // 泛音2包络（更弱）
      harmonic2Gain.gain.setValueAtTime(0, now);
      harmonic2Gain.gain.linearRampToValueAtTime(0.08, now + attackTime);
      harmonic2Gain.gain.exponentialRampToValueAtTime(sustainLevel * 0.1, now + attackTime + decayTime);
      harmonic2Gain.gain.exponentialRampToValueAtTime(0.01, now + duration + releaseTime);

      // 连接节点
      mainOsc.connect(mainGain);
      harmonic1.connect(harmonic1Gain);
      harmonic2.connect(harmonic2Gain);

      mainGain.connect(ctx.destination);
      harmonic1Gain.connect(ctx.destination);
      harmonic2Gain.connect(ctx.destination);

      // 播放和停止
      mainOsc.start(now);
      harmonic1.start(now);
      harmonic2.start(now);

      mainOsc.stop(now + duration + releaseTime);
      harmonic1.stop(now + duration + releaseTime);
      harmonic2.stop(now + duration + releaseTime);
    },

    /**
     * 处理Canvas鼠标移动（显示音符信息）
     */
    handleCanvasMouseMove(event) {
      const canvas = event.target;
      const rect = canvas.getBoundingClientRect();

      // 计算鼠标在Canvas中的位置（注意transform: rotateX(180deg)）
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // 反转Y坐标（因为Canvas被旋转了）
      const actualY = this.noteAreaHeight - y;

      // 查找鼠标位置下的音符
      const foundNote = this.findNoteAtPosition(x, actualY);

      if (foundNote) {
        this.hoveredNote = foundNote;
        // 计算tooltip位置 - 使用actualY让tooltip跟随视觉位置
        this.tooltipX = x + 15;
        this.tooltipY = actualY - 10;
      } else {
        this.hoveredNote = null;
      }
    },

    /**
     * 处理Canvas鼠标离开
     */
    handleCanvasMouseLeave() {
      this.hoveredNote = null;
    },

    /**
     * 处理Canvas点击（播放音符）
     */
    handleCanvasClick(event) {
      if (!this.hoveredNote) return;

      // 播放音符
      this.playPianoNote(this.hoveredNote.pitchMidi, this.hoveredNote.durationSeconds || 0.5);
    },

    /**
     * 查找指定位置的音符
     */
    findNoteAtPosition(x, y) {
      // 遍历当前显示的音符
      for (let i = this.lastPastNoteIndex; i < this.decodedNotes.length; i++) {
        const note = this.decodedNotes[i];

        // 计算音符在Canvas中的位置
        const noteX = note.x * this.noteAreaWidth;
        const noteY = (note.y - this.playTime) * this.secondLength;
        const noteWidth = note.width * this.noteAreaWidth;
        const noteHeight = note.height * this.secondLength;

        // 检查鼠标是否在音符范围内
        if (x >= noteX && x <= noteX + noteWidth &&
            y >= noteY && y <= noteY + noteHeight) {
          return note;
        }

        // 如果音符还没显示到屏幕上，停止查找
        if (note.y - this.playTime > this.showingSecond) {
          break;
        }
      }

      return null;
    },

    /**
     * 格式化弯音数组用于显示
     */
    formatPitchBendsArray(pitchBends) {
      return pitchBends.map(bend => {
        const value = typeof bend === 'number' ? bend : bend.pitchBend || 0;
        return value.toFixed(3);
      }).join(', ');
    },

    /**
     * 获取弯音数组的最后一个值
     */
    getPitchBendEndValue(note) {
      if (!note.pitchBends || note.pitchBends.length === 0) return null;
      const lastBend = note.pitchBends[note.pitchBends.length - 1];
      return typeof lastBend === 'number' ? lastBend : lastBend.pitchBend || null;
    },
    findLastPlayNote() {
      //二分查找，找到this.decodeNotes数组中第一个endTime大于this.playTime的下标
      this.findingLastNote = 1
      let left = 0
      let right = this.decodedNotes.length-1
      while(left <= right) {
        let mid = Math.floor((left+right)/2)
        if(this.decodedNotes[mid].startTimeSeconds+this.decodedNotes[mid].durationSeconds > this.playTime) {
          right = mid-1
        } else {
          left = mid+1
        }
      }
      this.lastPastNoteIndex = left
      this.findingLastNote = 0
    },
    customSigmoid(x) {
      // 将输入值平移0.5，使得对称中心位于x=0.5
      let res = 1 / (1 + Math.exp(-(x - 0.5)))
      if(x > 0.5) {
        res += 0.2
      }
      return  res
    },
    getScaleLeft(scale) {
      switch(scale) {
        case 1:
          return this.firstBlack/this.octaveNum/100;
        case 3:
          return this.secondBlack/this.octaveNum/100;
        case 6:
          return this.thirdBlack/this.octaveNum/100;
        case 8:
          return this.forthBlack/this.octaveNum/100;
        case 10:
          return this.fifthBlack/this.octaveNum/100;
        default:
          return scale/(this.octaveNum*12);
      }
    },
    onPanelEnter() {
      if (this._hoverTimeout) {
        clearTimeout(this._hoverTimeout)
        this._hoverTimeout = null
      }
      this.isHovered = true
    },
    onPanelLeave() {
      this._hoverTimeout = setTimeout(() => {
        this.isHovered = false
      }, 1000)
    },
    chooseMusicFile(event) {
      // 获取文件列表
      this.chosenFile = false
      const files = event.target.files
      if (files.length > 0) {
        this.chosenFile = true
        // 重置分析模式，确保每次上传新文件都弹出模式选择
        this.analysisMode = 'none'
        // 创建一个URL对象，指向选择的文件
        this.setAudioFile(files[0])
      }
    },
    setAudioFile(file) {
      if (!file) return
      // 切换歌曲时重置 Pro 版数据
      this.beats = null
      this.chords = null
      const fileURL = URL.createObjectURL(file)
      this.songFile = file
      // 设置audio元素的src属性为文件的URL
      this.$refs.audioPlayer.setSrc(fileURL)
    },
    timeUpdate(val, isManual) {
      if(this.playTime === val) {
        return
      }
      this.playTime = val
      this.showNotes(isManual)
    },
    showSong(song) {
      if (song.song) {
        this.setAudioFile(song.song)
        this.chosenFile = true
      }
      const notes = JSON.parse(song.notesStr)

      // 恢复 Pro 版元数据（节拍、和弦）
      if (song.proMetaStr) {
        try {
          const proMeta = JSON.parse(song.proMetaStr)
          this.beats = proMeta.beats || null
          this.chords = proMeta.chords || null
        } catch (e) {
          this.beats = null
          this.chords = null
        }
      }

      // 设置原始音符数据（用于过滤功能）
      this.rawNotes = notes
      this.amplitudeMag = 1 //选择已解析的歌曲，无需再进行强度放大
      this.lastPastNoteIndex = 0

      // 如果启用动态音符分析且音符还没有标记，则进行分析
      if (this.enableDynamicAnalysis && notes.length > 0 && notes[0].isDynamic === undefined) {
        try {
          this.rawNotes = this.analyzeDynamicNotes(this.rawNotes)
        } catch (error) {
          console.error('动态音符分析失败:', error)
        }
      }

      // 应用过滤设置并更新显示（会设置 decodedNotes）
      this.updateDisplayNotes()
    },
    deleteSong(songName, index) {
      let that = this
      songDB.remove(songName).then(()=> {
        that.analyzedSong.splice(index, 1)
      })
    },
    getAnalysizedSongList() {
      let that = this
      songDB.getAll().then(res=> {
      that.analyzedSong = res
    })
    },
    /**
     * 加载示例歌曲：模拟分析流程，使用预置的音符数据
     */
    async loadDemoSong() {
      this.showProgressDialog = true
      this.analysisProgress = 0

      try {
        // 并行启动下载：音符数据 + 音频文件
        const notesPromise = import('@/data/demoSongNotes.js')

        // 使用 ReadableStream 跟踪音频下载进度
        const audioResponse = await fetch('/demo-song.mp3')
        const contentLength = parseInt(audioResponse.headers.get('content-length') || '0', 10)
        const reader = audioResponse.body.getReader()
        const chunks = []
        let loaded = 0

        // 阶段1: 下载 (0-80%)，进度反映真实下载量
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
          loaded += value.length
          if (contentLength > 0) {
            this.analysisProgress = Math.floor((loaded / contentLength) * 80)
          }
        }
        this.analysisProgress = 80

        // 阶段2: 后处理 (80-100%)
        const { DEMO_NOTES, DEMO_BEATS, DEMO_CHORDS } = await notesPromise
        this.analysisProgress = 85

        // 设置音频文件（setAudioFile 会重置 beats/chords，必须先调用）
        const audioBlob = new Blob(chunks, { type: 'audio/mpeg' })
        const audioFile = new File([audioBlob], 'demo-song.mp3', { type: 'audio/mpeg' })
        this.setAudioFile(audioFile)
        this.analysisProgress = 92

        // 设置 Pro 版数据（在 setAudioFile 之后赋值，避免被重置）
        this.beats = DEMO_BEATS || null
        this.chords = DEMO_CHORDS || []
        this.analysisMode = 'pro'

        this.rawNotes = DEMO_NOTES.map(n => ({ ...n }))
        this.updateDisplayNotes()
        this.analysisProgress = 96

        // 保存到 IndexedDB（含 Pro 元数据）
        const demoName = this.$t('infoView.demoSongName')
        await songDB.add(demoName, this.songFile, this.decodedNotes, { beats: this.beats, chords: this.chords })
        this.getAnalysizedSongList()
        this.analysisProgress = 100

        await new Promise(r => setTimeout(r, 300))
        this.showProgressDialog = false
        this.analysisProgress = 0
      } catch (error) {
        console.error('加载示例歌曲失败:', error)
      } finally {
        this.showProgressDialog = false
        this.analysisProgress = 0
      }
    },

    // ─── 专业版分析方法 ──────────────────────────

    /**
     * 选择分析模式（重写 startAnanlyze 的入口）
     */
    chooseAnalysisMode() {
      if (!this.chosenFile) return
      if (this.processStr !== '') return
      this.showModeDialog = true
    },

    /**
     * 选择普通版（本地分析）— 原有流程
     */
    startLocalAnalysis() {
      this.showModeDialog = false
      this.analysisMode = 'local'
      this.startAnanlyze()
    },

    /**
     * 选择专业版（后端分析）
     */
    async startProAnalysis() {
      this.showModeDialog = false

      // 检查是否已登录
      if (!this.currentUser) {
        this.pendingProAnalysis = true
        this.showLoginDialog = true
        return
      }

      // 已登录，检查配额
      await this.checkQuotaAndAnalyze()
    },

    /**
     * 登录成功回调
     */
    async onLoginSuccess(user) {
      this.showLoginDialog = false
      this.currentUser = user
      // 同步到 auth store
      useAuthStore().setUser(user)

      // 查询配额以获取准确的 plan_level 状态
      try {
        const quota = await getAnalysisQuota()
        this.planLevel = quota.plan_level || 'free'
        this.isPremium = isPaidPlan(this.planLevel)
        this.storageQuota = quota
      } catch (e) {
        this.planLevel = user.plan_level || 'free'
        this.isPremium = isPaidPlan(this.planLevel)
      }

      // 只有在用户先点击了"开始分析"后才自动继续分析流程
      if (this.pendingProAnalysis) {
        this.pendingProAnalysis = false
        await this.checkQuotaAndAnalyze()
      }
    },

    /**
     * 检查配额并开始分析
     */
    async checkQuotaAndAnalyze() {
      try {
        const quota = await getAnalysisQuota()
        this.storageQuota = quota
        this.planLevel = quota.plan_level || 'free'
        this.isPremium = isPaidPlan(this.planLevel)

        // 检查月度分析次数
        if (quota.monthly_limit > 0 && quota.monthly_used >= quota.monthly_limit) {
          this.quotaExhaustedType = 'monthly'
          this.showQuotaExhausted = true
          return
        }

        // 检查每日分析上限
        if (quota.daily_limit > 0 && quota.daily_used >= quota.daily_limit) {
          this.quotaExhaustedType = 'daily'
          this.showQuotaExhausted = true
          return
        }

        // 检查存储配额
        if (quota.storage_used >= quota.storage_limit) {
          // 加载歌曲列表供删除
          const result = await getSongList({ limit: 50 })
          this.serverProjects = result.data || []
          this.showStorageQuota = true
          return
        }

        // 配额充足，开始分析
        this.doProAnalysis()
      } catch (error) {
        console.error('配额检查失败:', error)
        // 如果是 401，说明 token 无效，重新登录
        if (error?.response?.status === 401) {
          this.currentUser = null
          useAuthStore().setUser(null)
          this.showLoginDialog = true
        }
      }
    },

    /**
     * 存储空间释放后回调
     */
    async onStorageFreed() {
      this.showStorageQuota = false
      // 重新加载配额
      try {
        const quota = await getAnalysisQuota()
        this.storageQuota = quota
        this.planLevel = quota.plan_level || 'free'
        this.isPremium = isPaidPlan(this.planLevel)
      } catch (e) {
        console.error('刷新配额失败:', e)
      }
      // 继续分析
      this.doProAnalysis()
    },

    /**
     * 执行专业版分析
     */
    async doProAnalysis() {
      this.analysisMode = 'pro'
      this.showProProgress = true
      this.proProgressPercent = 0
      this.proProgressStage = 'separating'
      this.proProgressStageLabel = this.$t('songPitch.uploadingAudio')
      this.proProgressCompleted = false
      this.proProgressFailed = false
      this.proProgressError = ''

      try {
        // 1. 上传音频并启动分析
        this.proProgressPercent = 5
        const project = await startAnalysis(this.songFile, {
          name: this.songFile.name.replace(/\.[^/.]+$/, ''),
          truncate: true
        })

        const projectId = project.id
        this.currentProAnalysisId = projectId
        this.currentProAnalysisTitle = this.songFile ? this.songFile.name.replace(/\.[^/.]+$/, '') : this.$t('songPitch.proAnalysisDefault')

        // 如果是缓存结果（秒出）
        if (project.cached || project.status === 'completed') {
          this.proProgressPercent = 100
          this.proProgressCompleted = true
          await this.loadProAnalysisResult(projectId)
          return
        }

        // 2. 轮询进度
        this.proProgressPercent = 10
        const pollPromise = pollAnalysisUntilComplete(
          projectId,
          (progress) => {
            this.proProgressStage = progress.stage
            this.proProgressStageLabel = progress.label
            this.proProgressPercent = progress.percent
            this.proProgressEstimated = progress.estimated_remaining_seconds || 0
          },
          5000
        )

        this.proAnalysisPollPromise = pollPromise

        const completedProject = await pollPromise

        // 3. 加载结果
        this.proProgressPercent = 100
        this.proProgressCompleted = true
        await this.loadProAnalysisResult(projectId)

      } catch (error) {
        if (error.message === this.$t('songPitch.analysisCancelled')) {
          // 用户主动取消
          console.log('用户取消了分析')
        } else {
          console.error('专业版分析失败:', error)
          this.proProgressFailed = true
          const apiMsg = Array.isArray(error?.response?.data?.message)
            ? error.response.data.message.join('; ')
            : error?.response?.data?.message
          this.proProgressError = apiMsg || error.message || this.$t('songPitch.analysisFailed')
        }
      }
    },

    /**
     * 取消专业版分析
     */
    cancelProAnalysis() {
      if (this.proAnalysisPollPromise && this.proAnalysisPollPromise.cancel) {
        this.proAnalysisPollPromise.cancel()
      }
      this.showProProgress = false
      this.proProgressPercent = 0
    },

    /**
     * 加载专业版分析结果并渲染
     */
    async loadProAnalysisResult(projectId) {
      try {
        const song = await getSong(projectId)
        if (!song || !song.analysis) {
          throw new Error(this.$t('songPitch.emptyResult'))
        }

        console.log('[ProAnalysis] 加载分析结果, 音轨数:', Object.keys(song.analysis.tracks || {}).join(', '))

        // 转换数据
        const { notes, beats, chords, duration } = convertBackendResult(song.analysis, song.audio?.duration || 0)
        console.log('[ProAnalysis] 转换完成, 音符数:', notes.length, '时长:', duration)

        // 设置音频（setAudioFile 会重置 beats/chords，必须在赋值前调用）
        if (this.songFile) {
          this.setAudioFile(this.songFile)
        }

        this.beats = beats
        this.chords = chords

        // 存储 rawNotes 并更新显示
        this.rawNotes = notes
        this.updateDisplayNotes()

        // 保存到本地 IndexedDB（非阻塞，不影响主流程）
        try {
          await songDB.add(
            song.title || 'pro-analysis',
            this.songFile,
            this.decodedNotes,
            { beats, chords }
          )
          this.getAnalysizedSongList()
        } catch (saveError) {
          console.warn('[ProAnalysis] 保存到本地失败（不影响显示）:', saveError.message)
        }

        // 短暂显示完成后关闭
        await new Promise(r => setTimeout(r, 800))
        this.showProProgress = false
        this.proProgressPercent = 0

      } catch (error) {
        console.error('[ProAnalysis] 加载分析结果失败:', error)
        this.proProgressFailed = true
        this.proProgressError = error?.message || this.$t('songPitch.loadResultFailed')
      }
    },

    /**
     * 检查用户登录状态（应用启动时调用）
     */
    async checkLoginStatus() {
      const token = localStorage.getItem('access_token')
      if (!token) return

      try {
        const user = await authApi.getCurrentUser()
        this.currentUser = user
        // 从 user 或 quota 获取 plan_level
        this.planLevel = user.plan_level || 'free'
        this.isPremium = isPaidPlan(this.planLevel)
        // 同步到 auth store（供 NavigationBar 等使用）
        useAuthStore().setUser(user)
      } catch (e) {
        this.currentUser = null
        this.planLevel = 'free'
        this.isPremium = false
        // 仅在 token 确认无效时（拦截器已清除 localStorage）才清除 store
        // 网络错误等临时故障不清除，保留登录状态
        if (!localStorage.getItem('access_token')) {
          useAuthStore().clearAuth()
        }
      }
    },

    /**
     * 更新音轨过滤
     */
    updateTrackFilters(filters) {
      this.trackFilters = { ...filters }
      // 重新过滤并渲染
      this.updateDisplayNotesForPro()
    },

    /**
     * 专业版模式下的显示更新（带音轨过滤）
     */
    updateDisplayNotesForPro() {
      if (!this.hasTracks || !this.rawNotes || this.rawNotes.length === 0) {
        return
      }

      // 按音轨过滤
      let notes = this.rawNotes.filter(n => {
        if (n.trackName && this.trackFilters[n.trackName] === false) return false
        return true
      })

      // 计算显示参数
      this.decodedNotes = this.changeNoteAmplitudeForNotes(notes)

      // 更新统计
      if (this.enableDynamicAnalysis) {
        this.dynamicStats = this.getDynamicStatistics(this.decodedNotes)
      }

      this.lastPastNoteIndex = 0
      this.showNotes()
    },

    /**
     * 退出登录
     */
    logout() {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      this.currentUser = null
      this.planLevel = 'free'
      this.isPremium = false
      // 同步到 auth store
      useAuthStore().setUser(null)
      useAuthStore().accessToken = null
    },

    /**
     * 从设置弹窗跳转个人中心
     */
    goToProfile() {
      this.showDynamicInfoDialog = false
      this.$router.push('/user/profile')
    },

    /**
     * 从设置弹窗退出登录
     */
    logoutFromSettings() {
      this.logout()
      this.showDynamicInfoDialog = false
    },

    /**
     * 从设置弹窗打开登录
     */
    loginFromSettings() {
      this.showDynamicInfoDialog = false
      this.showLoginDialog = true
    },

    /**
    /**
     * 加载云端项目（共享方法，handleRouteQuery 和云端 Tab 复用）
     * 包含加载动画、音频下载进度追踪、数据转换、保存到本地
     */
    async loadCloudProject(projectId) {
      this.showCloudLoading = true
      this.cloudLoadingProgress = 5

      try {
        const song = await getSong(projectId)
        if (!song || !song.analysis) {
          throw new Error(this.$t('songPitch.emptyResult'))
        }
        this.cloudLoadingProgress = 30

        // 下载音频文件（ReadableStream 追踪进度）
        if (song.audio && song.audio.url) {
          const audioResp = await fetch(song.audio.url)
          const contentLength = parseInt(audioResp.headers.get('content-length') || '0', 10)

          if (contentLength > 0 && audioResp.body) {
            const reader = audioResp.body.getReader()
            const chunks = []
            let loaded = 0
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              chunks.push(value)
              loaded += value.length
              this.cloudLoadingProgress = 30 + Math.floor((loaded / contentLength) * 50)
            }
            this.songFile = new File([new Blob(chunks, { type: audioResp.type })], song.audio.filename || 'audio.mp3', { type: audioResp.type })
          } else {
            const audioBlob = await audioResp.blob()
            this.songFile = new File([audioBlob], song.audio.filename || 'audio.mp3', { type: audioBlob.type })
          }
        }
        this.cloudLoadingProgress = 85

        // 转换分析数据
        const { notes, beats, chords } = convertBackendResult(song.analysis, song.audio?.duration || 0)

        // 设置音频（setAudioFile 会重置 beats/chords，必须在赋值前调用）
        if (this.songFile) {
          this.setAudioFile(this.songFile)
        }
        this.beats = beats
        this.chords = chords
        this.rawNotes = notes
        this.chosenFile = true
        this.updateDisplayNotes()
        this.cloudLoadingProgress = 95

        // 保存到本地 IndexedDB
        try {
          await songDB.add(song.title || 'pro-analysis', this.songFile, this.decodedNotes, { beats, chords })
          this.getAnalysizedSongList()
        } catch (saveError) {
          console.warn('[CloudLoad] 保存到本地失败:', saveError.message)
        }

        this.cloudLoadingProgress = 100
        await new Promise(r => setTimeout(r, 300))
        this.showCloudLoading = false
      } catch (e) {
        this.showCloudLoading = false
        throw e
      }
    },

    /**
     * 切换已分析列表的 Tab（本地 / 云端）
     */
    switchListTab(tab) {
      this.activeListTab = tab
      if (tab === 'cloud' && this.currentUser && this.cloudSongs.length === 0) {
        this.loadCloudSongs()
      }
    },

    /**
     * 加载云端歌曲列表
     */
    async loadCloudSongs() {
      if (!this.currentUser) return
      this.cloudSongsLoading = true
      try {
        const resp = await getSongList({ limit: 50 })
        if (Array.isArray(resp)) {
          this.cloudSongs = resp
        } else if (resp?.data) {
          this.cloudSongs = Array.isArray(resp.data) ? resp.data : []
        } else {
          this.cloudSongs = []
        }
      } catch (e) {
        console.error('加载云端歌曲失败:', e)
        this.cloudSongs = []
      } finally {
        this.cloudSongsLoading = false
      }
    },

    /**
     * 云端歌曲状态中文映射
     */
    statusLabel(status) {
      const labels = { analyzing: this.$t('songPitch.statusAnalyzing'), completed: this.$t('songPitch.statusCompleted'), failed: this.$t('songPitch.statusFailed'), pending: this.$t('songPitch.statusPending') }
      return labels[status] || status
    },

    /**
     * 从云端 Tab 点击"查看"加载云端歌曲
     */
    async loadCloudSong(songId) {
      this.analysisMode = 'pro'
      try {
        // 先检查本地是否已缓存
        const allLocal = await songDB.getAll()
        const localMatch = allLocal.find(s => s.originalName === songId || s.name === songId)
        if (localMatch && localMatch.song) {
          this.showSong(localMatch)
          return
        }
        await this.loadCloudProject(songId)
      } catch (e) {
        console.error('加载云端歌曲失败:', e)
        push.error({ title: this.$t('songPitch.loadFailed'), description: e.message || this.$t('songPitch.pleaseRetry'), duration: 3000 })
      }
    },

    /**
     * 将当前专业版分析转至后台运行
     */
    sendToBackground() {
      if (this.currentProAnalysisId) {
        // 加入后台跟踪（去重）
        if (!this.backgroundAnalysisIds.find(b => b.songId === this.currentProAnalysisId)) {
          this.backgroundAnalysisIds.push({
            songId: this.currentProAnalysisId,
            title: this.currentProAnalysisTitle || this.$t('songPitch.proAnalysisDefault')
          })
        }
      }
      // 停止前台轮询
      if (this.proAnalysisPollPromise && this.proAnalysisPollPromise.cancel) {
        this.proAnalysisPollPromise.cancel()
      }
      // 关闭进度弹窗
      this.showProProgress = false
      this.proProgressPercent = 0

      // 启动后台轮询
      this.startBackgroundPolling()

      push.success({ title: this.$t('songPitch.movedToBackground'), description: this.$t('songPitch.willNotifyOnComplete'), duration: 3000 })
    },

    /**
     * 启动后台轮询（检查云端正在分析的项目）
     */
    async startBackgroundPolling() {
      if (this.backgroundPollingTimer) return
      if (!this.currentUser) return

      // 首次：获取云端列表，找出正在分析的歌曲
      try {
        const resp = await getSongList({ limit: 50 })
        let songs = []
        if (Array.isArray(resp)) songs = resp
        else if (resp?.data) songs = Array.isArray(resp.data) ? resp.data : []

        const analyzing = songs.filter(s => s.status === 'analyzing')
        for (const song of analyzing) {
          if (!this.backgroundAnalysisIds.find(b => b.songId === song.id)) {
            this.backgroundAnalysisIds.push({ songId: song.id, title: song.title || this.$t('songPitch.untitled') })
          }
        }
      } catch (e) {
        console.warn('[BackgroundPolling] 获取歌曲列表失败:', e.message)
      }

      if (this.backgroundAnalysisIds.length === 0) return

      this.backgroundPollingTimer = setInterval(() => {
        this.pollBackgroundAnalyses()
      }, 12000)
      this.pollBackgroundAnalyses()
    },

    /**
     * 轮询后台分析进度
     */
    async pollBackgroundAnalyses() {
      if (this.backgroundAnalysisIds.length === 0) {
        this.stopBackgroundPolling()
        return
      }

      const completedItems = []

      for (const item of [...this.backgroundAnalysisIds]) {
        try {
          const progress = await getAnalysisProgress(item.songId)

          if (!progress || progress.status === 'completed') {
            completedItems.push(item)
          } else if (progress.status === 'failed') {
            completedItems.push(item)
            push.error({ title: this.$t('songPitch.analysisFailedFor', { title: item.title }), description: progress.label || this.$t('songPitch.pleaseRetry'), duration: 5000 })
          }
        } catch (e) {
          console.warn(`[BackgroundPolling] 查询 ${item.songId} 失败:`, e.message)
        }
      }

      for (const item of completedItems) {
        this.backgroundAnalysisIds = this.backgroundAnalysisIds.filter(b => b.songId !== item.songId)

        // 显示完成横幅（带"查看"按钮）
        this.completedNotification = { songId: item.songId, title: item.title, show: true }

        // 刷新云端列表
        if (this.activeListTab === 'cloud') {
          this.loadCloudSongs()
        }

        push.success({ title: this.$t('songPitch.analysisCompleteBanner', { title: item.title }), description: this.$t('songPitch.checkTopRightBanner'), duration: 6000 })
      }

      if (this.backgroundAnalysisIds.length === 0) {
        this.stopBackgroundPolling()
      }
    },

    /**
     * 停止后台轮询
     */
    stopBackgroundPolling() {
      if (this.backgroundPollingTimer) {
        clearInterval(this.backgroundPollingTimer)
        this.backgroundPollingTimer = null
      }
    },

    /**
     * 点击完成横幅的"查看"按钮
     */
    async viewCompletedSong(songId) {
      this.completedNotification = null
      this.analysisMode = 'pro'
      try {
        const allLocal = await songDB.getAll()
        const localMatch = allLocal.find(s => s.originalName === songId || s.name === songId)
        if (localMatch && localMatch.song) {
          this.showSong(localMatch)
          return
        }
        await this.loadCloudProject(songId)
      } catch (e) {
        console.error('加载完成歌曲失败:', e)
        push.error({ title: this.$t('songPitch.loadFailed'), description: e.message || this.$t('songPitch.pleaseRetry'), duration: 3000 })
      }
    },

    /**
     * 处理路由查询参数：从个人中心"打开"按钮跳转时自动加载歌曲
     * ?song=歌曲名 → 加载本地歌曲
     * ?project=云端项目ID → 加载云端分析结果
     */
    async handleRouteQuery() {
      const query = this.$route.query
      if (!query || (!query.song && !query.project)) return

      try {
        if (query.song) {
          // 加载本地歌曲
          const songName = query.song
          const songData = await songDB.get(songName)
          if (songData) {
            this.showSong(songData)
          }
        } else if (query.project) {
          // 加载云端项目
          const projectId = query.project
          this.analysisMode = 'pro'

          // 先检查本地是否已有该云端歌曲（按 originalName 匹配）
          const allLocal = await songDB.getAll()
          const localMatch = allLocal.find(s => s.originalName === projectId || s.name === projectId)

          if (localMatch && localMatch.song) {
            this.showSong(localMatch)
          } else {
            await this.loadCloudProject(projectId)
          }
        }

        // 清除查询参数，避免刷新重复加载
        this.$router.replace({ path: '/main' }).catch(() => {})
      } catch (e) {
        console.error('加载指定歌曲失败:', e)
      }
    },

    setCanvasWH() {
      const canvasDiv = document.getElementById('canvasDiv')
      const noteCanvas = document.getElementById("note-canvas")

      // 检查元素是否存在
      if (!canvasDiv || !noteCanvas) {
        console.warn('Canvas elements not found, retrying...')
        // 如果元素不存在，延迟重试
        setTimeout(() => {
          this.setCanvasWH()
        }, 100)
        return
      }

      this.noteAreaWidth = Math.floor(canvasDiv.clientWidth)
      this.noteAreaHeight = Math.floor(canvasDiv.clientHeight)

      noteCanvas.width = this.noteAreaWidth
      noteCanvas.height = this.noteAreaHeight
      this.secondLength = this.noteAreaHeight/this.showingSecond
    }
  },
  mounted() {
    this.getAnalysizedSongList()
    this.checkLoginStatus().then(() => {
      // 登录状态确认后，检查云端是否有正在分析的项目
      if (this.currentUser) {
        this.startBackgroundPolling()
      }
    })

    // 初始化声音标签分析器
    this.soundTagger = new SoundTagger()

    // 使用 nextTick 确保 DOM 完全渲染后再设置 canvas
    this.$nextTick(() => {
      this.setCanvasWH()

      // 获取 canvas context
      const c = document.getElementById("note-canvas")
      if (c) {
        this.noteCtx = c.getContext("2d")
      }

      // 检查路由参数，加载指定歌曲或云端项目
      this.handleRouteQuery()

      // 检查是否有待加载的示例歌曲
      if (sessionStorage.getItem('pendingDemoSong') === 'true') {
        sessionStorage.removeItem('pendingDemoSong')
        this.$nextTick(() => this.loadDemoSong())
      }
    })

    window.addEventListener('resize', this.setCanvasWH)
    this.magnification = Math.floor(window.innerHeight/7)
    let that = this
    this.isHovered = true
    setTimeout(() => {
      that.isHovered = false
    }, 4000);
  },
  beforeUnmount() {
    this.stopBackgroundPolling()
    window.removeEventListener('resize', this.setCanvasWH)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
/* 空状态引导 */
.empty-guide {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center;
  margin-left: -120px;
  margin-top: -60px;
  width: 240px;
  text-align: center;
  cursor: pointer;
  padding: 24px 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid #ffd9c4;
  box-shadow: 0 8px 24px rgba(217, 78, 31, 0.1);
  transition: all 0.3s ease;
  z-index: 5;
}
.empty-guide:hover {
  transform: rotateX(180deg) scale(1.04);
  box-shadow: 0 12px 32px rgba(217, 78, 31, 0.18);
}
.empty-guide-staff {
  width: 100%;
  max-width: 280px;
  background: linear-gradient(135deg, #fefcf8 0%, #f8f0e3 100%);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e8d5be;
  margin-bottom: 12px;
}
.empty-guide-staff svg {
  display: block;
  width: 100%;
  height: auto;
}
.empty-staff-notes {
  animation: notesFadeIn 1s ease forwards;
  opacity: 0;
}
@keyframes notesFadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
.empty-guide-title {
  font-size: 15px;
  font-weight: 700;
  color: #D94E1F;
  margin: 0 0 4px 0;
}
.empty-guide-sub {
  font-size: 12px;
  color: #999;
  margin: 0;
}

h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.key-black {
  width: 7.14%;
}
.key-black:hover {
  background-color: #ccc;
}
.key-white {
  width: 14.28%;
}
.key-white:first-child:hover {
  background-color: #ccc;
}

/* 白键激活状态 */
.key-active {
  background: linear-gradient(to bottom, #fbbf24, #f59e0b) !important;
}
.key-active > div {
  background: linear-gradient(to bottom, #fef3c7, #fcd34d) !important;
}

/* 黑键激活状态 */
.key-black-active {
  background: linear-gradient(to bottom, #f59e0b, #d97706) !important;
}
.hover-state {
  top: 0 !important;
  z-index: 20 !important;
}

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

/* Tooltip过渡动画 */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}

/* 云端状态徽章 */
.status-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}
.status-badge.analyzing { background: #fef3c7; color: #92400e; }
.status-badge.completed { background: #d1fae5; color: #065f46; }
.status-badge.failed { background: #fee2e2; color: #991b1b; }
.status-badge.pending { background: #e5e7eb; color: #374151; }

/* 后台分析完成通知横幅 */
.analysis-done-banner {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 60;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  border: 1px solid rgba(5, 150, 105, 0.2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 10px 14px;
  max-width: 340px;
}
.banner-content {
  display: flex;
  align-items: center;
  gap: 8px;
}
.banner-icon {
  width: 18px;
  height: 18px;
  color: #059669;
  flex-shrink: 0;
}
.banner-text {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.banner-view-btn {
  padding: 3px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: #f59e0b;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.banner-view-btn:hover { background: #d97706; }
.banner-view-btn:active { transform: scale(0.97); }
.banner-close-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
  flex-shrink: 0;
}
.banner-close-btn:hover { background: rgba(0, 0, 0, 0.06); color: #374151; }

/* 横幅滑入动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.35s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

</style>
