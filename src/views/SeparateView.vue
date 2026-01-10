<template>
    <div class="h-full overflow-hidden">
      <div class="absolute top-0 left-0 w-full h-full" v-show="processNum < 1">
        <div class="flex flex-col items-center justify-center h-full w-1/2 mx-auto">
            <!-- 新增文字描述 -->
            <div class="mb-6 text-center">
                <h1 class="text-5xl font-bold text-gray-800 mb-4">{{ $t('mainView.separateView.title') }}</h1>
                <p class="text-gray-600 mb-2">{{ $t('mainView.separateView.subtitle') }}</p>
                <p class="text-gray-500 text-sm">
                    <span class="block">• {{ $t('mainView.separateView.feature1') }}</span>
                    <span class="block">• {{ $t('mainView.separateView.feature2') }}</span>
                    <span class="block">• {{ $t('mainView.separateView.feature3') }}</span>
                    <span class="block">• {{ $t('mainView.separateView.feature4') }}</span>
                </p>
            </div>

            <!-- 原有上传组件 -->
            <div class="h-18 flex items-center justify-center">
                <label for="dropzone-file" class="flex flex-col items-center justify-center py-10 px-14 w-full h-16 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                    <div class="flex flex-col items-center justify-center pt-5 pb-6 w-full">
                        <svg class="w-8 h-8 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p class="text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">{{ $t('mainView.separateView.uploadText[0]') }}</span>{{ $t('mainView.separateView.uploadText[1]') }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('mainView.separateView.uploadText[2]') }}</p>
                    </div>
                    <input id="dropzone-file" type="file" class="hidden" @change="chooseMusicFile" accept=".mp3, .wav" />
                </label>
            </div> 
            <div class="my-1"><p class="text-sm text-gray-600 dark:text-gray-400">{{songFile !== null ? songFile.name : ''}}</p></div>
            <div class="mt-3 flex flex-col items-center justify-center">
                <button
                class="px-5 py-1 rounded shadow-lg hover:shadow active:shadow-inner transition-all font-bold active:bg-slate-100" 
                @click="startAnanlyze">{{ $t('mainView.separateView.startAnalysis') }}</button>

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
          :title="$t('mainView.separateView.separationResult')"
          :subtitle="$t('mainView.separateView.separationSubtitle')"
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
              <h3 class="text-lg font-medium text-gray-900">{{ downloadFailed ? $t('mainView.separateView.modelDownloadFailed') : $t('mainView.separateView.modelDownloadTitle') }}</h3>
            </div>
          </div>

          <div class="mb-6">
            <p class="text-sm text-gray-600">
              {{ downloadFailed ? $t('mainView.separateView.modelDownloadFailed') + '，' + $t('mainView.separateView.modelDownloadDescription') : $t('mainView.separateView.modelDownloadDescription') }}
            </p>
          </div>

          <div class="flex justify-end space-x-3">
            <button
              @click="hideDownloadConfirm"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              {{ $t('mainView.separateView.cancel') }}
            </button>
            <button
              @click="downloadModelFile"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {{ downloadFailed ? $t('mainView.separateView.retryDownload') : $t('mainView.separateView.startDownload') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 自定义进度通知组件 -->
      <CustomProgressNotification
        v-if="showProgressDialog"
        :title="isDownloadingModel ? $t('mainView.separateView.downloadingModelTitle') : (isExtractingModel ? $t('mainView.separateView.downloadingModelTitle') : $t('mainView.separateView.processingTitle'))"
        :message="isDownloadingModel ? $t('mainView.separateView.modelDownloading') : (isExtractingModel ? $t('mainView.separateView.extractingModel') : $t('mainView.separateView.processingMessage'))"
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
import DemucsWorker from '../js/demucs-worker.js?worker'
import { gunzipSync } from 'fflate'
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
      modelPath: '/shiyin_downloads/htdemucs-CGDK2CS7bfETmY3cfdyDf1isz4JQyB.onnx.gz',
      uncompressedModelPath: '/shiyin_downloads/htdemucs-CGDK2CS7bfETmY3cfdyDf1isz4JQyB.onnx',
      isDownloadingModel: false,
      isExtractingModel: false,
      downloadStartTime: null,
      downloadElapsedTime: 0,
      downloadFailed: false
    }
  },
  computed: {
    waveNameMap() {
      return {
        'drums': this.$t('mainView.separateView.tracks.drums'),
        'bass': this.$t('mainView.separateView.tracks.bass'),
        'other': this.$t('mainView.separateView.tracks.other'),
        'vocals': this.$t('mainView.separateView.tracks.vocals')
      }
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
          that.progressMessage = this.$t('mainView.separateView.processingAudio');
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
            title: this.$t('mainView.separateView.processingResultFailed') + '，请反馈至kecsun@163.com',
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
          alert(this.$t('mainView.separateView.pleaseSelectValidAudio'));
          push.error({
            title: this.$t('mainView.separateView.onlyAudioFilesAllowed'),
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
        // 首先检查缓存（检查解压后的模型）
        const cache = await caches.open('model-cache');
        const cachedResponse = await cache.match(this.uncompressedModelPath);
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

    // 删除模型缓存
    async clearModelCache() {
      try {
        const cache = await caches.open('model-cache');
        // 删除压缩和解压后的模型缓存
        await cache.delete(this.modelPath);
        await cache.delete(this.uncompressedModelPath);
        console.log('模型缓存已清除');
        return true;
      } catch (error) {
        console.error('清除模型缓存失败:', error);
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
      this.downloadFailed = false;
    },

    // 下载模型文件
    async downloadModelFile() {
      this.hideDownloadConfirm();
      this.showProgressDialog = true;
      this.downloadProgress = 0;
      this.isDownloadingModel = true;
      this.isExtractingModel = false;
      this.progressMessage = this.$t('mainView.separateView.modelDownloading');
      this.progressCurrentTime = '0:00';
      this.progressTotalTime = '0:00';
      this.downloadStartTime = Date.now();

      // 启动时间更新计时器
      const timeUpdateInterval = setInterval(() => {
        if (this.isDownloadingModel) {
          this.downloadElapsedTime = Math.floor((Date.now() - this.downloadStartTime) / 1000);
          this.progressCurrentTime = this.formatTime(this.downloadElapsedTime);
        } else {
          clearInterval(timeUpdateInterval);
        }
      }, 1000);

      try {
        const response = await fetch(this.modelPath);
        if (!response.ok) {
          throw new Error(this.$t('mainView.separateView.modelDownloadFailed'));
        }
        // 尝试从响应头获取实际文件大小，否则使用估计值
        const contentLength = response.headers.get('Content-Length');
        const total = contentLength ? parseInt(contentLength) : 97*1024*1024;
        const reader = response.body.getReader();
        const chunks = [];

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          chunks.push(value);

          // 计算下载进度
          const downloaded = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
          this.downloadProgress = total ? (downloaded / total) * 100 : 0;

          // 更新进度消息，显示已下载量和总量
          this.progressMessage = `${this.$t('mainView.separateView.modelDownloading')} ${this.formatBytes(downloaded)} / ${this.formatBytes(total)}`;
        }

        // 下载完成，开始解压
        this.isDownloadingModel = false;
        this.isExtractingModel = true;
        this.downloadProgress = 0;
        this.progressMessage = this.$t('mainView.separateView.extractingModel');

        // 合并所有chunks
        const compressedData = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressedData.set(new Uint8Array(chunk), offset);
          offset += chunk.length;
        }

        // 使用 setTimeout 让 UI 有机会更新
        await new Promise(resolve => setTimeout(resolve, 100));

        // 解压模型文件
        let decompressedData;
        try {
          decompressedData = gunzipSync(compressedData);
        } catch (decompressError) {
          console.error('解压模型文件失败:', decompressError);
          throw new Error('模型文件解压失败，文件可能已损坏');
        }

        // 解压完成
        this.downloadProgress = 100;

        // 保存解压后的模型到缓存
        const blob = new Blob([decompressedData]);
        const cache = await caches.open('model-cache');
        await cache.put(this.uncompressedModelPath, new Response(blob, {
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        }));

        // 清理计时器
        clearInterval(timeUpdateInterval);

        // 隐藏进度对话框
        this.showProgressDialog = false;
        this.isDownloadingModel = false;
        this.isExtractingModel = false;

        push.success({
          title: this.$t('mainView.separateView.extractingModelComplete'),
          duration: 3000,
        });

        // 重新加载模型并继续分析流程
        // 注意：initializeModel 内部已经处理了错误情况，包括清除缓存和显示重试对话框
        try {
          await this.initializeModel();
          // 只有模型加载成功才继续分析
          this.continueAnalysis();
        } catch (error) {
          // 错误已在 handleModelLoadError 中处理，这里不需要再做任何事
          console.log('模型加载失败，已提示用户重新下载');
        }
      } catch (error) {
        console.error('下载模型文件失败:', error);
        clearInterval(timeUpdateInterval);
        this.showProgressDialog = false;
        this.isDownloadingModel = false;
        this.isExtractingModel = false;
        this.downloadFailed = true;

        // 显示重试对话框
        this.showDownloadConfirm();

        push.error({
          title: this.$t('mainView.separateView.modelDownloadFailed'),
          description: error.message,
          duration: 5000,
        });
      }
    },

    // 格式化时间显示
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    },

    // 格式化字节显示
    formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // 继续分析流程
    async continueAnalysis() {
      this.processNum = 0;
      this.showProgressDialog = true;
      this.downloadProgress = 0;
      this.progressCurrent = 0;
      this.progressTotal = 0;
      this.progressMessage = this.$t('mainView.separateView.loadingAudio');
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
                // 模型加载失败，清除缓存并提示重新下载
                this.handleModelLoadError(error);
                reject(new Error(error));
              }
            }
          };

          that.worker.addEventListener('message', messageHandler);
          that.worker.postMessage({
            command: 'loadModel',
            data: { modelPath: that.uncompressedModelPath },
            id: 'load-model-1'
          });
        });
      }
    },

    // 处理模型加载错误
    async handleModelLoadError(error) {
      // 清除损坏的模型缓存
      await this.clearModelCache();

      // 设置下载失败状态，这样对话框会显示重试按钮
      this.downloadFailed = true;

      // 显示下载对话框让用户重新下载
      this.showDownloadConfirm();

      // 显示错误提示
      push.error({
        title: this.$t('mainView.separateView.modelLoadFailedClearCache'),
        description: error,
        duration: 5000,
      });
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
          title: this.$t('mainView.separateView.audioSeparationComplete'),
          description: this.$t('mainView.separateView.audioSeparationDescription'),
          duration: 3000,
        });
      } catch (error) {
        console.error('处理音频结果失败:', error);
        push.error({
          title: this.$t('mainView.separateView.processingResultFailed'),
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
          this.worker = new DemucsWorker({ type: 'module' });
          this.setupWorkerHandlers();
          // 重新初始化模型
          this.initializeModel();
        } catch (error) {
          console.error('Worker重新初始化失败:', error);
          push.error({
            title: this.$t('mainView.separateView.workerReinitFailed'),
            description: this.$t('mainView.separateView.workerReinitFailedDescription'),
            duration: 5000,
          });
        }
      });
    },

    // 修改startAnanlyze方法中的回调处理
    async startAnanlyze() {
      if (!this.songFile) {
        push.warning({
            title: this.$t('mainView.separateView.pleaseUploadAudio'),
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
      this.worker = new DemucsWorker({ type: 'module' });
      this.setupWorkerHandlers();
      
      // 初始化时尝试加载模型
      this.initializeModel();
    } catch (error) {
      console.error('Worker初始化失败:', error);
      push.error({
        title: this.$t('mainView.separateView.workerInitFailed'),
        description: this.$t('mainView.separateView.workerInitFailedDescription'),
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