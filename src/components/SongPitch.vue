<template>
  <div class="h-full flex flex-col justify-between" style="background-color: #f8f7f4;">
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
      <div class="mt-3 flex flex-col items-center justify-center">
        <button
        class="px-5 py-1 rounded shadow-lg hover:shadow active:shadow-inner transition-all font-bold active:bg-slate-100" 
        @click="startAnanlyze" :disabled="songFile === null">{{ $t('mainView.listBar.analyzeButton') }}</button>
        <div v-show="processStr !== ''">{{ $t('mainView.listBar.progress') }}:{{ processStr }}</div>
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
    <div class="flex1 h-full relative" id="canvasDiv" style="transform: rotateX(180deg);">
      <canvas
        id="note-canvas"
        width="300"
        height="300"
        @mousemove="handleCanvasMouseMove"
        @mouseleave="handleCanvasMouseLeave"
        @click="handleCanvasClick">
      </canvas>

      <!-- 音符信息悬浮框 (Dev功能) -->
      <transition name="tooltip">
        <div
          v-if="hoveredNote"
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
    <div class="w-full h-20 flex flex-row">
      <div class="flex-1 h-full flex flex-row relative" v-for="(octave, octaveIndex) in octaveNum" :key="octaveIndex">
        <!-- 白键 -->
        <div
          v-for="(scale, scaleIndex) in [0, 2, 4, 5, 7, 9, 11]"
          :key="`white-${octaveIndex}-${scaleIndex}`"
          class="key-white bg-black cursor-pointer hover:bg-gray-200 transition-colors"
          @mousedown="playPianoNote(lowestPitch + octave * 12 + scale)">
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
          :style="'left: '+blackScale.left+'%;'"
          @mousedown="playPianoNote(lowestPitch + octave * 12 + blackScale.scale)">
        </div>
      </div>
    </div>
    <!-- 歌曲播放栏 -->
    <div>
      <audio-player ref="audioPlayer" @timeupdate="timeUpdate"></audio-player>
    </div>

    <!-- 动态音符分析按钮 -->
    <div class="absolute bottom-44 left-4 z-20">
      <button
        @click="showDynamicInfoDialog = !showDynamicInfoDialog"
        class="bg-violet-500 w-14 h-14 text-white rounded-full shadow-lg hover:drop-shadow-xl transition-all duration-300 flex items-center justify-center">
        <MusicAnalysis class="w-8 h-8" />
      </button>
    </div>

    <!-- 动态音符分析弹窗 -->
    <DynamicInfoDialog
      :show="showDynamicInfoDialog"
      :stats="dynamicStats"
      :current-scheme="colorScheme"
      @close="showDynamicInfoDialog = false"
      @update:currentScheme="updateColorScheme" />
     
  </div>
</template>

<script>
import AudioPlayer from './AudioPlayer.vue'
import { BasicPitch, noteFramesToTime, addPitchBendsToNoteEvents, outputToNotesPoly } from '@spotify/basic-pitch';
import * as tf from '@tensorflow/tfjs';
import songDB from '@/store/Song'
import ShortcutHelp from '@/components/ShortcutHelp.vue'
import SoundTagger from '@/js/SoundTagger.js'
import DynamicInfoDialog from '@/components/DynamicInfoDialog.vue'
import { MusicAnalysis } from '@/components/icons'

export default {
  name: 'SongPitch',
  props: {
    msg: String
  },
  components: {
    AudioPlayer,
    ShortcutHelp,
    DynamicInfoDialog,
    MusicAnalysis
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
      decodedNotes: [],
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
      showingSecond: 5,  //要在屏幕上显示从当前位置往后“多少”秒的音符
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
      colorScheme: localStorage.getItem('colorScheme') || 'sunset', // 颜色方案
      colorSchemes: { // 颜色方案配置
        ocean: {
          dynamic: '#0EA5E9',
          stable: '#64748B'
        },
        sunset: {
          dynamic: '#F472B6',
          stable: '#F59E0B'
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
      const model = await tf.loadGraphModel(`/model.json`)
      let renderedBuffer = await this.resampleAudioBuffer(songBuffer)
      const basicPitch = new BasicPitch(model);
      await basicPitch.evaluateModel(
        renderedBuffer,
        (f, o, c) => {
          frames.push(...f);
          onsets.push(...o);
          contours.push(...c);
        },
        (p) => {
          p *= 100
          p = p.toFixed(2)
          that.processStr = p + '%'
        }
      );
      this.processStr = '正在获取音符，请耐心等待'
      const notes = noteFramesToTime(
        addPitchBendsToNoteEvents(
          contours,
          outputToNotesPoly(frames, onsets, 0.25, 0.25, 5),
        ),
      )
      this.decodedNotes = notes.sort((a,b)=> {
        return (a.startTimeSeconds+a.durationSeconds) - (b.startTimeSeconds+b.durationSeconds)  //按照结束时间由前到后排序
      })
      
      
      this.amplitudeMag = 0 // 修改强度扩大倍数为默认值
      this.pastNoteIndex = 0

      this.changeNoteAmplitude()
      
      // 动态音符分析
      if (this.enableDynamicAnalysis) {
        this.processStr = '正在进行动态音符分析...'
        try {
          if (!this.soundTagger) {
            this.soundTagger = new SoundTagger()
          }
          this.decodedNotes = this.analyzeDynamicNotes(this.decodedNotes)
          this.dynamicStats = this.getDynamicStatistics(this.decodedNotes)
          console.log('动态音符统计:', this.dynamicStats)
        } catch (error) {
          console.error('动态音符分析失败:', error)
        }
      }
      
      this.processStr = ''
      songDB.add(this.songFile.name, this.songFile, this.decodedNotes)
      this.getAnalysizedSongList()      
      this.showNotes()
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
      
      let i=this.lastPastNoteIndex
      while(this.decodedNotes.length > i) {
        const singleNote = this.decodedNotes[i]
        if(this.playTime > (singleNote.startTimeSeconds+singleNote.durationSeconds)) {  //得到目前最后一个显示完毕的音符的下标
          this.lastPastNoteIndex = i
        } else {  //得到那些在当前时间时未播放完的音符
          if(singleNote.startTimeSeconds-this.playTime < 10) {   //只显示当前时间往后10s范围内的音符
            this.drawNote(singleNote)
          } else {
            break
          }
        }
        i++
      }
    },
    drawNote(singleNote) {
      // 计算基于音量的透明度（音量越小越淡）
      const minOpacity = 0.3;
      const maxOpacity = 1.0;
      const amplitude = singleNote.amplitude || 0.5;
      const opacity = minOpacity + (maxOpacity - minOpacity) * Math.sqrt(amplitude);

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
      localStorage.setItem('colorScheme', scheme);
      // 重新绘制音符
      this.showNotes(false);
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
      }
    },
    setAudioFile(file) {
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
      this.setAudioFile(song.song)
      this.decodedNotes = JSON.parse(song.notesStr)
      this.amplitudeMag = 1 //选择已解析的歌曲，无需再进行强度放大
      this.pastNoteIndex = 0
      
      // 如果启用动态音符分析且音符还没有标记，则进行分析
      if (this.enableDynamicAnalysis && this.decodedNotes.length > 0 && this.decodedNotes[0].isDynamic === undefined) {
        try {
          this.decodedNotes = this.analyzeDynamicNotes(this.decodedNotes)
          this.dynamicStats = this.getDynamicStatistics(this.decodedNotes)
        } catch (error) {
          console.error('动态音符分析失败:', error)
        }
      } else if (this.decodedNotes.length > 0 && this.decodedNotes[0].isDynamic !== undefined) {
        // 如果已有标记，更新统计信息
        this.dynamicStats = this.getDynamicStatistics(this.decodedNotes)
      }
      
      this.showNotes()
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
      
      // 重新初始化渲染器（如果已存在）
      if (this.canvasRenderer) {
        this.initCanvasRenderer();
      }
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
