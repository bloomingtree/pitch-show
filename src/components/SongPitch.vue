<template>
  <div class="h-full flex flex-col justify-between" style="background-color: #f8f7f4;">
    <div class="group fixed right-5 -top-96 min-w-72 shadow-lg shadow-inner p-3 bg-white rounded-md h-96 transition-all duration-300
    hover:top-0 hover:z-20">
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
      <div class="absolute -bottom-16 left-2 h-16 w-1/3 group-hover:scale-y-0 group-hover:-bottom-8 transition-all delay-200">
        <div class="h-16 w-full bg-slate-500 transition w-16 rounded-b"></div>
      </div>
    </div>
    <div class="group fixed right-5 -top-72 min-w-72 shadow-lg shadow-inner p-3 bg-white rounded-md h-72 transition-all duration-300
    hover:top-0 hover:z-20">
      <div class="w-full h-full flex flex-col">
        <h2 class="text-left font-bold">快捷键说明</h2>
        <div class="flex justify-center items-center mt-2">
          <div class="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">&lt;</div>
          <p class="ml-2 text-sm text-gray-500 dark:text-gray-400">向左移动2秒</p>
        </div>
        <div class="flex justify-center items-center mt-2">
          <div class="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">&gt;</div>
          <p class="ml-2 text-sm text-gray-500 dark:text-gray-400">向右移动2秒</p>
        </div>
        <div class="flex justify-center items-center mt-2">
          <div class="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Spacebar</div>
          <p class="ml-2 text-sm text-gray-500 dark:text-gray-400">播放/暂停</p>
        </div>
      </div>
      <div class="absolute -bottom-16 left-1/3 h-16 w-1/3 group-hover:scale-y-0 group-hover:-bottom-8 transition-all delay-200">
        <div class="h-16 w-full bg-amber-200 transition w-16 rounded-b"></div>
      </div>
    </div>
    <div>
      <audio-player ref="audioPlayer" @timeupdate="timeUpdate"></audio-player>
    </div>
    <div class="flex1 relative h-full overflow-hidden" style="transform: rotateX(180deg);">
      <div v-for="(singleNote, index) in decodedNotes" :key="index" class="absolute bg-black transition-transform ease-linear" 
        v-show="singleNote.x && (singleNote.y-playTime < 20 && singleNote.durationSeconds+singleNote.y+2 >= playTime)"
        :style="'left: '+singleNote.x*100+'%; top: '+singleNote.y*magnification+'px; transform: translate(0, '+playTime*magnification*(-1)+'px); width: '+singleNote.width*100+'%; height: '+singleNote.height*magnification+'px;opacity: '+singleNote.amplitude+';transition-duration: 50ms;'">
      </div>
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
  </div>
</template>

<script>
import AudioPlayer from './AudioPlayer.vue'
import { BasicPitch, noteFramesToTime, addPitchBendsToNoteEvents, outputToNotesPoly } from '@spotify/basic-pitch';
import * as tf from '@tensorflow/tfjs';
import songDB from '@/store/Song'
export default {
  name: 'SongPitch',
  props: {
    msg: String
  },
  components: {
    AudioPlayer,
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
      magnification: 100,
      analyzedSong: [],
      processStatus: 'none', // none-未工作 running-正在分析 encoding-正在解析结果
      chosenFile: false, //仅用于记录当前songFile是否是上传文件
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
      if(this.chosenFile === null) {
        return
      }
      let that = this
      let fr = new FileReader()
      fr.readAsArrayBuffer(this.songFile)
      fr.addEventListener('loadend', (e)=> {
        console.log(e)
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
          that.processStr = p*100 + '%'
        }
      );
      this.processStr = ''
      const notes = noteFramesToTime(
        addPitchBendsToNoteEvents(
          contours,
          outputToNotesPoly(frames, onsets, 0.25, 0.25, 5),
        ),
      )
      this.decodedNotes = notes
      songDB.add(this.songFile.name, this.songFile, this.decodedNotes)
      this.getAnalysizedSongList()
      this.showNotes()
    },
    showNotes() {
      this.decodedNotes.forEach(singleNote=> {
        let octave = Math.floor((singleNote.pitchMidi - this.lowestPitch)/12)
        let scale = (singleNote.pitchMidi - this.lowestPitch)%12
        singleNote.x = octave/this.octaveNum + this.getScaleLeft(scale)
        singleNote.width = 1/(this.octaveNum*18)
        singleNote.y = singleNote.startTimeSeconds
        singleNote.height = singleNote.durationSeconds
        singleNote.amplitude = this.customSigmoid(singleNote.amplitude)
      })
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
    timeUpdate(val) {
      this.playTime = val
    },
    showSong(song) {
      this.setAudioFile(song.song)
      this.decodedNotes = JSON.parse(song.notesStr)
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
    }
  },
  mounted() {
    this.getAnalysizedSongList()
    this.magnification = Math.floor(window.innerHeight/7)
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
.key-white {
  width: 14.28%;
}
</style>
