<template>
    <div class="h-full overflow-hidden">
      <div class="absolute top-0 left-0 w-full h-full" v-show="processNum < 1">
        <div class="flex flex-col items-center justify-center h-full w-1/2 mx-auto">
            <!-- 新增文字描述 -->
            <div class="mb-6 text-center">
                <h1 class="text-5xl font-bold text-gray-800 mb-4">AI本地音频分离</h1>
                <p class="text-gray-600 mb-2">基于本地CPU运算实现人声与伴奏分离</p>
                <p class="text-gray-500 text-sm">
                    <span class="block">• 无需上传云端，100%本地处理</span>
                    <span class="block">• 7分钟音频约需40分钟处理时间</span>
                    <span class="block">• 处理期间请保持页面开启，取消任务刷新页面即可</span>
                    <span class="block">• 支持MP3/WAV格式，建议时长小于10分钟</span>
                </p>
            </div>

            <!-- 原有上传组件 -->
            <div class="h-18 flex items-center justify-center">
                <label for="dropzone-file" class="flex flex-col items-center justify-center py-10 px-14 w-full h-16 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                    <div class="flex flex-col items-center justify-center pt-5 pb-6 w-full">
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
                @click="startAnanlyze">开始分析</button>

            </div>
        </div>
      </div>
      <!-- 波形显示 -->
      <div class="w-full h-full bg-slate-50">
        <AudioWaveformPlayer
          v-if="processNum === 1"
          :audioBuffers="audioBuffers"
          :waveNameMap="waveNameMap"
          :waveBgMap="waveBgMap"
          :waveColorMap="waveColorMap"
          :originalFileName="songFile ? songFile.name : ''"
          title="分离结果"
          subtitle="点击下方按钮播放或下载音轨"
          @play-start="onPlayStart"
          @play-stop="onPlayStop"
          @seek="onSeek"
          @progress="onProgress"
          @download="onDownload"
          @delete-all="onDeleteAll"
        />
      </div>

      <!-- 模型下载确认对话框 -->
      <div v-if="showDownloadDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <div class="flex items-center mb-4">
            <div class="flex-shrink-0">
              <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-gray-900">需要下载模型文件</h3>
            </div>
          </div>
          
          <div class="mb-6">
            <p class="text-sm text-gray-600">
              首次使用需要下载AI模型文件（约185MB），下载后将保存在浏览器缓存中，下次可直接使用。
            </p>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button
              @click="hideDownloadConfirm"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              取消
            </button>
            <button
              @click="downloadModelFile"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              开始下载
            </button>
          </div>
        </div>
      </div>

      <!-- 自定义进度通知组件 -->
      <CustomProgressNotification 
        v-if="showProgressDialog"
        :title="'正在处理音频文件'"
        :message="'请耐心等待，AI正在分离音频轨道'"
        :progress="downloadProgress"
        :progressMessage="progressMessage"
        :currentTime="progressCurrentTime"
        :totalTime="progressTotalTime"
      />

    </div>
</template>

<script>
import { push } from 'notivue'
import demucsUtils from '../js/demucsUtils.js'
import CustomProgressNotification from '../components/CustomProgressNotification.vue'
import AudioWaveformPlayer from '../components/AudioWaveformPlayer.vue'
export default {
  name: 'SeparateView',
  components: {
    CustomProgressNotification,
    AudioWaveformPlayer
  },
  data() {
    return {
      songFile: null,
      processNum: -1,
      audioBuffers: {},
      waveNameMap: {
        'drums': '鼓',
        'bass': '低音',
        'other': '其他乐器',
        'vocals': '人声'
      },
      waveBgMap: {
        'drums': '#e7e5e4',
        'bass': '#fde68a',
        'other': '#bbf7d0',
        'vocals': '#bfdbfe'
      },
      waveColorMap: {
        'drums': '#57534e',
        'bass': '#f59e0b',
        'other': '#84cc16',
        'vocals': '#06b6d4'
      },
      worker: null,
      showDownloadDialog: false,
      showProgressDialog: false,
      downloadProgress: 0,
      progressMessage: '',
      progressCurrentTime: '0:00',
      progressTotalTime: '0:00',
      modelPath: 'https://nr9uwdeyhrffuqbu.public.blob.vercel-storage.com/htdemucs-CGDK2CS7bfETmY3cfdyDf1isz4JQyB.onnx'
    }
  },
  methods: {
    // 设置worker消息处理器
    setupWorkerHandlers() {
      let that = this;
      this.worker.onmessage = (event) => {
        const { id, status, result, error } = event.data;
        if (status === 'model_loaded') {
          // 模型加载完成
        } else if (status === 'audio_loaded') {
          that.progressMessage = '正在处理音频文件...';
          that.worker.postMessage({
            command: 'applyModel',
            id: 'apply-model-1'
          });
        } else if (status === 'progress') {
          // 更新进度条
          if (this.showProgressDialog && result.percent !== undefined) {
            this.downloadProgress = result.percent;
            this.progressMessage = result.message || '';
            this.progressCurrentTime = result.currentTime || '0:00';
            this.progressTotalTime = result.totalTime || '0:00';
          }
        } else if (status === 'complete') {
          that.showProgressDialog = false;
          const blobs = demucsUtils.postProcess(result)
          // 将Blob转换为AudioBuffer用于波形显示和播放
          that.processAudioResults(blobs)
        } else if (status === 'error') {
          push.error({
            title: '处理音频文件失败，请反馈至kecsun@163.com',
            description: error,
            duration: 5000,
          });
        }
      };
    },

    chooseMusicFile(event) {
      const files = event.target.files;
      if (files.length > 0) {
        this.songFile = files[0];
        // 这里可以添加文件验证逻辑
        if (!this.songFile.type.startsWith('audio/')) {
          alert('请选择有效的音频文件');
          push.error({
            title: '只能上传音频文件',
            duration: 2000,
          })
          this.songFile = null;
          return;
        }
      }
    },


    downloadBlob(separatedTracks) {

      Object.entries(separatedTracks).forEach(([name, blob]) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.wav`;
        a.click();
      });
    },
    // 检查模型文件是否存在
    async checkModelFile() {
      try {
        // 首先检查缓存
        const cache = await caches.open('model-cache');
        const cachedResponse = await cache.match(this.modelPath);
        if (cachedResponse) {
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error('检查模型文件失败:', error);
        return false;
      }
    },

        // 显示下载确认对话框
    showDownloadConfirm() {
      this.showDownloadDialog = true;
    },

    // 隐藏下载确认对话框
    hideDownloadConfirm() {
      this.showDownloadDialog = false;
    },

    // 下载模型文件
    async downloadModelFile() {
      this.hideDownloadConfirm();
      this.showProgressDialog = true;
      this.downloadProgress = 0;
      this.progressMessage = '正在下载模型文件...';
      this.progressCurrentTime = '0:00';
      this.progressTotalTime = '0:00';
      
      try {
        const response = await fetch(this.modelPath);
        if (!response.ok) {
          throw new Error('模型文件下载失败');
        }
        const total = 186*1024*1024;
        const reader = response.body.getReader();
        const chunks = [];

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          chunks.push(value);
          
          // 计算下载进度
          const downloaded = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
          this.downloadProgress = total ? (downloaded / total) * 100 : 0;
        }

        // 保存到缓存
        const blob = new Blob(chunks);
        const cache = await caches.open('model-cache');
        await cache.put(this.modelPath, new Response(blob, {
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        }));

        // 隐藏进度对话框
        this.showProgressDialog = false;

        push.success({
          title: '模型文件下载完成',
          duration: 3000,
        });

        // 重新加载模型并继续分析流程
        try {
          await this.initializeModel();
          this.continueAnalysis();
        } catch (error) {
          console.error('模型加载失败:', error);
          push.error({
            title: '模型加载失败',
            description: error.message,
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('下载模型文件失败:', error);
        this.showProgressDialog = false;
        push.error({
          title: '模型文件下载失败',
          description: error.message,
          duration: 5000,
        });
      }
    },

    // 继续分析流程
    async continueAnalysis() {
      this.processNum = 0;
      this.showProgressDialog = true;
      this.downloadProgress = 0;
      this.progressCurrent = 0;
      this.progressTotal = 0;
      this.progressMessage = '正在加载音频文件...';
      this.progressCurrentTime = '0:00';
      this.progressTotalTime = '0:00';
      
      const audioRes = await demucsUtils.loadAudio(this.songFile);
      this.worker.postMessage({
        command: 'loadAudio',
        data: audioRes,
        id: 'load-audio-1'
      });
    },

    // 初始化模型
    async initializeModel() {
      let that = this;
      const modelExists = await this.checkModelFile();
      if (modelExists) {
        return new Promise((resolve, reject) => {
          const messageHandler = (event) => {
            const { id, status, error } = event.data;
            if (id === 'load-model-1') {
              this.worker.removeEventListener('message', messageHandler);
              if (status === 'model_loaded') {
                resolve();
              } else if (status === 'error') {
                console.error('模型加载失败:', error);
                reject(new Error(error));
              }
            }
          };
          
          that.worker.addEventListener('message', messageHandler);
          that.worker.postMessage({
            command: 'loadModel',
            data: { modelPath: that.modelPath },
            id: 'load-model-1'
          });
        });
      }
    },

    // 处理音频分离结果
    async processAudioResults(blobs) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffers = {};
        
        // 将每个音轨的Blob转换为AudioBuffer
        for (const [name, blob] of Object.entries(blobs)) {
          const arrayBuffer = await blob.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          audioBuffers[name] = audioBuffer;
        }
        
        // 更新data中的audioBuffers
        this.audioBuffers = audioBuffers;
        
        // 设置处理完成状态
        this.processNum = 1;
        
        push.success({
          title: '音频分离完成',
          description: '可以在下方播放和下载分离后的音轨',
          duration: 3000,
        });
      } catch (error) {
        console.error('处理音频结果失败:', error);
        push.error({
          title: '处理音频结果失败',
          description: error.message,
          duration: 5000,
        });
      }
    },

    // 播放开始
    onPlayStart() {
    },

    // 播放停止
    onPlayStop() {
    },

    // 跳转到时间
    onSeek(time) {
    },
    // 播放进度
    onProgress(progressData) {
    },
    // 下载完成
    onDownload() {
    },

    // 删除所有结果，重置到上传状态
    onDeleteAll() {
      // 重置所有状态
      this.songFile = null;
      this.processNum = -1;
      this.audioBuffers = {};
      
      // 清理进度对话框
      this.showProgressDialog = false;
      this.downloadProgress = 0;
      this.progressMessage = '';
      this.progressCurrentTime = '0:00';
      this.progressTotalTime = '0:00';
      
      // 清理文件输入框
      const fileInput = document.getElementById('dropzone-file');
      if (fileInput) {
        fileInput.value = '';
      }
      
      // 终止当前worker（如果存在）
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
      
      // 重新初始化worker
      this.$nextTick(() => {
        try {
          const workerPath = process.env.NODE_ENV === 'production' ? '/demucs-worker.js' : '/public/demucs-worker.js';
          this.worker = new Worker(workerPath, { type: 'module' });
          this.setupWorkerHandlers();
          // 重新初始化模型
          this.initializeModel();
        } catch (error) {
          console.error('Worker重新初始化失败:', error);
          push.error({
            title: 'Worker重新初始化失败',
            description: '请刷新页面重试',
            duration: 5000,
          });
        }
      });
    },

    // 修改startAnanlyze方法中的回调处理
    async startAnanlyze() {
      if (!this.songFile) {
        push.warning({
            title: '请先上传音频文件',
            duration: 2800,
        })
        return;
      }

      // 检查模型文件是否存在
      const modelExists = await this.checkModelFile();
      if (!modelExists) {
        this.showDownloadConfirm();
        return;
      }

              // 模型文件存在，直接开始分析
        this.continueAnalysis();
      }
    },
  mounted() {
    // 在Cloudflare Pages上，静态文件直接放在根目录下
    const workerPath = process.env.NODE_ENV === 'production' ? '/demucs-worker.js' : '/public/demucs-worker.js';
    
    try {
      this.worker = new Worker(workerPath, { type: 'module' });
      this.setupWorkerHandlers();
      
      // 初始化时尝试加载模型
      this.initializeModel();
    } catch (error) {
      console.error('Worker初始化失败:', error);
      push.error({
        title: 'Worker初始化失败',
        description: '请检查网络连接或刷新页面重试',
        duration: 5000,
      });
    }
  },
  beforeDestroy() {
    // 组件销毁时清理资源
    if (this.worker) {
      this.worker.terminate();
    }
  },
}    
</script>
<style>
  .waveform-canvas {
    background: #f3f4f6;
    border-radius: 8px;
    transition: all 0.3s ease;
  }
</style>