<template>
  <div class="h-full flex flex-col" style="background-color: #f8f7f4; min-height: 0;">
    <!-- 分析歌曲选项栏 -->
    <div class="group fixed right-5 -top-96 min-w-72 shadow-lg shadow-inner p-3 bg-white rounded-md h-96 transition-all duration-300 z-10
    hover:top-0 hover:z-20" ref="analysisArea"
    :class="{ 'hover-state': isHovered }">
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
      <div class="my-1"><p class="text-sm text-gray-600 dark:text-gray-400">{{songFile !== null ? songFile.name : ''}}</p></div>
      <div class="mt-3 flex items-center justify-center gap-2">
        <button
        class="px-5 py-1 rounded shadow-lg hover:shadow active:shadow-inner transition-all font-bold active:bg-slate-100"
        @click="startAnanlyze" :disabled="songFile === null">{{ $t('mainView.listBar.analyzeButton') }}</button>
        <span v-show="processStr !== ''" class="text-xs text-gray-600">{{ processStr }}</span>
      </div>
      <div class="h-48 mt-4 bg-amber-100 flex flex-col z-20">
        <div class="text-left bg-white">
          <span class="bg-orange-300 rounded-t px-2 pt-2 font-bold">{{ $t('mainView.listBar.listName') }}</span>
        </div>
        <div class="px-3 rounded overflow-y-scroll flex1">
          <div v-for="(song, index) in analyzedSong" :key="index" class="border-b py-1">
            {{song.name}}
            <button @click="showSong(song)"
            class="ml-1 p-1 rounded shadow-lg bg-amber-300 hover:shadow active:shadow-inner transition-all font-bold active:bg-slate-100">{{ $t('mainView.listBar.showButton') }}</button>
            <button @click="deleteSong(song.name, index)"
            class="ml-1 p-1 rounded shadow-lg bg-stone-300 hover:shadow active:shadow-inner transition-all font-bold active:bg-slate-100">{{ $t('mainView.listBar.deleteButton') }}</button>
          </div>
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
      <div class="absolute -bottom-16 left-2 h-16 w-1/3 group-hover:scale-y-0 group-hover:-bottom-8 transition-all delay-200">
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
          <div class="font-bold text-purple-300 mb-2">音符信息 (Dev)</div>
          <div class="space-y-1">
            <div><span class="text-gray-400">MIDI:</span> {{ hoveredNote.pitchMidi }}</div>
            <div><span class="text-gray-400">起始时间:</span> {{ hoveredNote.startTimeSeconds.toFixed(3) }}s</div>
            <div><span class="text-gray-400">持续时间:</span> {{ hoveredNote.durationSeconds.toFixed(3) }}s</div>
            <div><span class="text-gray-400">音量:</span> {{ (hoveredNote.amplitude * 100).toFixed(1) }}%</div>
            <div v-if="hoveredNote.isDynamic !== undefined">
              <span class="text-gray-400">类型:</span>
              <span :class="hoveredNote.isDynamic ? 'text-cyan-400' : 'text-gray-400'">
                {{ hoveredNote.isDynamic ? '动态' : '平稳' }}
              </span>
            </div>
            <div v-if="hoveredNote.pitchBends && hoveredNote.pitchBends.length > 0">
              <span class="text-gray-400">弯音数:</span> {{ hoveredNote.pitchBends.length }}
            </div>
            <div v-if="hoveredNote.pitchBends && hoveredNote.pitchBends.length > 0" class="mt-2">
              <div class="text-gray-400 mb-1">弯音数组:</div>
              <div class="bg-gray-800 rounded px-2 py-1 text-xs font-mono break-all max-h-20 overflow-y-auto">
                {{ formatPitchBendsArray(hoveredNote.pitchBends) }}
              </div>
            </div>
            <div v-if="getPitchBendEndValue(hoveredNote) !== null" class="mt-1">
              <span class="text-gray-400">弯音终值:</span>
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
    <div class="absolute bottom-44 left-4 z-20 flex flex-col gap-2">
      <button
        @click="showDynamicInfoDialog = !showDynamicInfoDialog"
        class="bg-orange-300 w-14 h-14 text-white rounded-full border-[3.5px] border-[#6e6e96]  shadow-lg hover:drop-shadow-xl transition-all duration-300 flex items-center justify-center">
        <MusicNote class="w-8 h-8 text-stone-600" />
      </button>
    </div>

    <!-- 动态音符分析弹窗 -->
    <DynamicInfoDialog
      :show="showDynamicInfoDialog"
      :stats="dynamicStats"
      :current-scheme="colorScheme"
      :filter-settings="filterSettings"
      @close="showDynamicInfoDialog = false"
      @update:currentScheme="updateColorScheme"
      @update:filterSettings="updateFilterSettings" />

    <!-- 分析进度对话框 -->
    <CustomProgressNotification
      :show="showProgressDialog"
      :title="progressTitle"
      :message="progressMessage"
      :progress="analysisProgress"
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
import { MusicAnalysis, MusicNote } from '@/components/icons'
import { filterNotes } from '@/js/noteFilter.js'
import { mergeNotes } from '@/js/noteMerger.js'
import { loadConfig, saveConfig, DEFAULT_FILTER_SETTINGS } from '@/js/configManager.js'
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
        return this.$t('mainView.listBar.analyzingTitle') || '正在分析音频'
      } else {
        return this.$t('mainView.listBar.processingTitle') || '正在处理音符'
      }
    },

    /**
     * 根据进度返回当前阶段的消息
     */
    progressMessage() {
      if (this.analysisProgress < 80) {
        return this.$t('mainView.listBar.analyzingMessage') || 'AI 正在识别音符，请稍候...'
      } else {
        return this.$t('mainView.listBar.processingMessage') || '正在整理和优化音符数据...'
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
      colorScheme: loadConfig().colorScheme || 'sunset', // 颜色方案
      colorSchemes: { // 颜色方案配置
        ocean: {
          dynamic: '#0EA5E9',
          stable: '#64748B'
        },
        sunset: {
          dynamic: '#FF6B35',
          stable: '#F472B6'
        },
        forest: {
          dynamic: '#10B981',
          stable: '#8B5CF6'
        }
      },
      hoveredNote: null, // 当前悬停的音符
      tooltipX: 0,
      tooltipY: 0,
      audioContext: null, // 音频上下文
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
          title: '分析失败',
          message: error.message || '音高分析过程中发生错误'
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

      // 获取当前颜色方案
      const scheme = this.colorSchemes[this.colorScheme] || this.colorSchemes.sunset;

      // 根据是否为动态音符选择颜色
      let color;
      if (singleNote.isDynamic) {
        // 动态音符
        const hex = scheme.dynamic.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        color = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      } else {
        // 平稳音符
        const hex = scheme.stable.replace('#', '');
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
    chooseMusicFile(event) {
      // 获取文件列表
      this.chosenFile = false
      const files = event.target.files
      if (files.length > 0) {
        this.chosenFile = true
        // 创建一个URL对象，指向选择的文件
        this.setAudioFile(files[0])

        // 让分析面板持续显示3秒，方便用户点击"开始分析"
        this.isHovered = true
        if (this._hoverTimeout) {
          clearTimeout(this._hoverTimeout)
        }
        this._hoverTimeout = setTimeout(() => {
          this.isHovered = false
        }, 3000)
      }
    },
    setAudioFile(file) {
      if (!file) return
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
      }
      const notes = JSON.parse(song.notesStr)

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
        const { DEMO_NOTES } = await notesPromise
        this.analysisProgress = 85

        this.rawNotes = DEMO_NOTES.map(n => ({ ...n }))
        this.updateDisplayNotes()
        this.analysisProgress = 92

        // 设置音频文件
        const audioBlob = new Blob(chunks, { type: 'audio/mpeg' })
        const audioFile = new File([audioBlob], 'demo-song.mp3', { type: 'audio/mpeg' })
        this.setAudioFile(audioFile)
        this.analysisProgress = 96

        // 保存到 IndexedDB
        const demoName = this.$t('infoView.demoSongName')
        await songDB.add(demoName, this.songFile, this.decodedNotes)
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
</style>
