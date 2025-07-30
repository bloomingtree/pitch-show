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
              <p class="text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">上传</span>分析音频</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">MP3 WAV</p>
          </div>
          <input id="dropzone-file" type="file" class="hidden" @change="chooseMusicFile" accept=".mp3, .wav" />
        </label>
      </div> 
      <div class="my-1"><p class="text-sm text-gray-600 dark:text-gray-400">{{songFile !== null ? songFile.name : ''}}</p></div>
      <div class="mt-3 flex flex-col items-center justify-center">
        <button
        class="px-5 py-1 rounded shadow-lg hover:shadow active:shadow-inner transition-all font-bold active:bg-slate-100" 
        @click="startAnanlyze" :disabled="songFile === null">开始分析</button>
        <div v-show="processStr !== ''">进度：{{ processStr }}</div>
      </div>
      <div class="h-48 mt-4 bg-amber-100 flex flex-col z-20">
        <div class="text-left bg-white">
          <span class="bg-orange-300 rounded-t px-2 pt-2 font-bold">已分析歌曲</span>
        </div>
        <div class="px-3 rounded overflow-y-scroll flex1">
          <div v-for="(song, index) in analyzedSong" :key="index" class="border-b py-1">
            {{song.name}}
            <button @click="showSong(song)" 
            class="ml-1 p-1 rounded shadow-lg bg-amber-300 hover:shadow active:shadow-inner transition-all font-bold active:bg-slate-100">显示</button>
            <button @click="deleteSong(song.name, index)"
            class="ml-1 p-1 rounded shadow-lg bg-stone-300 hover:shadow active:shadow-inner transition-all font-bold active:bg-slate-100">删除</button>
          </div>
        </div>
      </div>
      <div class="mt-2 space-x-2">
        <router-link 
            to="/separate" 
            class="ml-1 p-1 bg-slate-200 rounded hover:shadow active:shadow-inner transition-all font-bold active:bg-slate-100">
            / 音频分离 /
          </router-link>
          <router-link 
            to="/" 
            class="ml-1 p-1 bg-slate-200 rounded hover:shadow active:shadow-inner transition-all font-bold active:bg-slate-100">
            / 首页 /
          </router-link>
      </div>
      <div class="absolute -bottom-16 left-2 h-16 w-1/3 group-hover:scale-y-0 group-hover:-bottom-8 transition-all delay-200">
        <div class="h-16 w-full bg-slate-500 transition w-16 rounded-b"></div>
      </div>
    </div>
    <!-- 快捷键说明选项栏 -->
    <ShortcutHelp />
    <!-- 音符显示区 -->
    <div class="flex1 h-full" id="canvasDiv" style="transform: rotateX(180deg);">
      <!-- <div v-for="(singleNote, index) in decodedNotes" :key="index" class="absolute bg-black transition-transform ease-linear" 
        v-show="singleNote.x && (singleNote.y-playTime < 20 && singleNote.durationSeconds+singleNote.y+2 >= playTime)"
        :style="'left: '+singleNote.x*100+'%; top: '+singleNote.y*magnification+'px; transform: translate(0, '+playTime*magnification*(-1)+'px); width: '+singleNote.width*100+'%; height: '+singleNote.height*magnification+'px;opacity: '+singleNote.amplitude+';transition-duration: 50ms;'">
      </div> -->
      <canvas id="note-canvas" width="300" height="300"></canvas>
    </div>
    <div class="w-full h-20 flex flex-row">
      <div class="flex-1 h-full flex flex-row relative" v-for="(num, index) in octaveNum" :key="index">
        <div class="key-white bg-black">
          <div class="w-full h-full px-px bg-white bg-clip-content"></div>
        </div>
        <div class="key-black bg-black absolute z-99 h-1/2" :style="'left: '+firstBlack+'%;'"></div>
        <div class="key-white bg-black">
          <div class="w-full h-full px-px bg-white bg-clip-content"></div>
        </div>
        <div class="key-black bg-black absolute z-99 h-1/2" :style="'left: '+secondBlack+'%;'"></div>
        <div class="key-white bg-black">
          <div class="w-full h-full px-px bg-white bg-clip-content"></div>
        </div>
        <div class="key-white bg-black">
          <div class="w-full h-full px-px bg-white bg-clip-content"></div>
        </div>
        <div class="key-black bg-black absolute z-99 h-1/2" :style="'left: '+thirdBlack+'%;'"></div>
        <div class="key-white bg-black">
          <div class="w-full h-full px-px bg-white bg-clip-content"></div>
        </div>
        <div class="key-black bg-black absolute z-99 h-1/2" :style="'left: '+forthBlack+'%;'"></div>
        <div class="key-white bg-black">
          <div class="w-full h-full px-px bg-white bg-clip-content"></div>
        </div>
        <div class="key-black bg-black absolute z-99 h-1/2" :style="'left: '+fifthBlack+'%;'"></div>
        <div class="key-white bg-black">
          <div class="w-full h-full px-px bg-white bg-clip-content"></div>
        </div>
      </div>
    </div>
    <!-- 歌曲播放栏 -->
    <div>
      <audio-player ref="audioPlayer" @timeupdate="timeUpdate"></audio-player>
    </div>
     
  </div>
</template>

<script>
import AudioPlayer from './AudioPlayer.vue'
import { BasicPitch, noteFramesToTime, addPitchBendsToNoteEvents, outputToNotesPoly } from '@spotify/basic-pitch';
import * as tf from '@tensorflow/tfjs';
import songDB from '@/store/Song'
import ShortcutHelp from '@/components/ShortcutHelp.vue'
export default {
  name: 'SongPitch',
  props: {
    msg: String
  },
  components: {
    AudioPlayer,
    ShortcutHelp
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
      this.noteCtx.fillStyle=`rgba(236, 44, 100,${singleNote.amplitude})`;
      this.noteCtx.fillRect(singleNote.x * this.noteAreaWidth, (singleNote.y-this.playTime)*this.secondLength, 
      singleNote.width * this.noteAreaWidth, singleNote.height*this.secondLength);
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
    }
  },
  mounted() {
    this.getAnalysizedSongList()
    
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
</style>
