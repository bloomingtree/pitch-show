<template>
    <div class="w-full h-full flex flex-col">
        <audio ref="audio" preload="auto" />
        <div class="w-full h-2 cursor-pointer" @click="seekToTime">
            <div :style="'width: '+playTime/totalTime*100+'%;'" class="bg-red-300"></div>
        </div>
        <div class="relative">
            <div>{{Math.floor(playTime/60)}}:{{Math.floor(playTime%60)}}/{{Math.floor(totalTime/60)}}:{{Math.floor(totalTime%60)}}</div>
            <div class="absolute w-full h-full top-0 left-0 overflow-hidden">
                <div class="w-1 h-full relative top-0 bg-slate-400" :style="'left: '+playTime/totalTime*100+'%;'"></div>
            </div>
        </div>
         <!-- 控制按钮 -->
        <div class="absolute bottom-28 left-4 flex gap-2 z-20">
        <button 
            @click="togglePlay"
            class="bg-blue-500 w-14 h-14 text-white rounded-full hover:drop-shadow-xl transition-colors">
            <svg v-if="!isPlaying" class="w-14 h-14" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1304" width="200" height="200"><path d="M505.806452 509.935484m-476.775226 0a476.775226 476.775226 0 1 0 953.550451 0 476.775226 476.775226 0 1 0-953.550451 0Z" fill="#D2F095" p-id="1305"></path><path d="M422.247226 368.59871c0-22.709677 15.215484-30.625032 33.808516-17.585549l199.824516 140.106323c18.597161 13.035355 18.597161 34.374194 0 47.409548l-199.824516 140.102194c-18.593032 13.039484-33.808516 5.12-33.808516-17.589678V368.59871z" fill="#FFFFFF" p-id="1306"></path><path d="M439.320774 705.560774c-18.167742 0-37.71871-13.931355-37.718709-44.519226V368.59871c0-30.583742 19.550968-44.515097 37.718709-44.515097 9.480258 0 19.100903 3.373419 28.585291 10.02529l199.820387 140.106323c14.451613 10.128516 22.74271 24.931097 22.742709 40.604903 0 15.677935-8.291097 30.480516-22.742709 40.613161l-199.820387 140.098065c-9.484387 6.656-19.100903 10.029419-28.585291 10.029419z m3.612903-338.485677c-0.024774 0.462452-0.04129 0.970323-0.04129 1.523613v292.442838c0 0.557419 0.012387 1.06529 0.04129 1.527742 0.392258-0.247742 0.813419-0.524387 1.267613-0.842322l199.828645-140.102194c3.179355-2.229677 5.153032-4.835097 5.153033-6.800516s-1.977806-4.570839-5.153033-6.796387l-199.824516-140.110452a27.883355 27.883355 0 0 0-1.271742-0.842322z" fill="#6E6E96" p-id="1307"></path><path d="M502.511484 967.461161c-263.349677 0-477.601032-215.613935-477.601032-480.635871S239.161806 6.193548 502.511484 6.193548s477.601032 215.609806 477.601032 480.631742-214.251355 480.635871-477.601032 480.635871z m0-919.97729c-240.582194 0-436.31071 197.086968-436.31071 439.341419 0 242.254452 195.728516 439.345548 436.31071 439.345549s436.31071-197.086968 436.31071-439.345549c0-242.254452-195.728516-439.341419-436.31071-439.341419z" opacity=".1" p-id="1308"></path><path d="M1007.351742 536.369548h-41.290323c0-242.250323-204.618323-439.33729-456.125935-439.33729S53.809548 294.119226 53.809548 536.369548h-41.290322C12.519226 271.351742 235.660387 55.741935 509.935484 55.741935s497.416258 215.609806 497.416258 480.627613z" fill="#FFFFFF" opacity=".49" p-id="1309"></path><path d="M505.806452 53.809548c251.507613 0 456.125935 204.618323 456.125935 456.125936 0 251.511742-204.618323 456.130065-456.125935 456.130064S49.680516 761.447226 49.680516 509.935484 254.298839 53.809548 505.806452 53.809548zM8.390194 509.935484c0 274.279226 223.141161 497.420387 497.416258 497.420387S1003.22271 784.21471 1003.22271 509.935484c0-274.275097-223.141161-497.416258-497.416258-497.416258S8.390194 235.660387 8.390194 509.935484z" fill="#6E6E96" p-id="1310"></path></svg>
            <svg v-else class="w-14 h-14" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1304" width="200" height="200"><path d="M505.806452 509.935484m-476.775226 0a476.775226 476.775226 0 1 0 953.550451 0 476.775226 476.775226 0 1 0-953.550451 0Z" fill="#FFA1B5" p-id="1305"></path><path d="M502.511484 967.461161c-263.349677 0-477.601032-215.613935-477.601032-480.635871S239.161806 6.193548 502.511484 6.193548s477.601032 215.609806 477.601032 480.631742-214.251355 480.635871-477.601032 480.635871z m0-919.97729c-240.582194 0-436.31071 197.086968-436.31071 439.341419 0 242.254452 195.728516 439.345548 436.31071 439.345549s436.31071-197.086968 436.31071-439.345549c0-242.254452-195.728516-439.341419-436.31071-439.341419z" opacity=".1" p-id="1306"></path><path d="M1007.351742 536.369548h-41.290323c0-242.250323-204.618323-439.33729-456.125935-439.33729S53.809548 294.119226 53.809548 536.369548h-41.290322C12.519226 271.351742 235.660387 55.741935 509.935484 55.741935s497.416258 215.609806 497.416258 480.627613z" fill="#FFFFFF" opacity=".49" p-id="1307"></path><path d="M505.806452 53.809548c251.507613 0 456.125935 204.618323 456.125935 456.125936 0 251.511742-204.618323 456.130065-456.125935 456.130064S49.680516 761.447226 49.680516 509.935484 254.298839 53.809548 505.806452 53.809548zM8.390194 509.935484c0 274.283355 223.141161 497.420387 497.416258 497.420387S1003.22271 784.218839 1003.22271 509.935484c0-274.275097-223.141161-497.416258-497.416258-497.416258S8.390194 235.660387 8.390194 509.935484z" fill="#6E6E96" p-id="1308"></path><path d="M683.354839 633.806452c0 22.709677-18.580645 41.290323-41.290323 41.290322h-247.741935c-22.709677 0-41.290323-18.580645-41.290323-41.290322v-247.741936c0-22.709677 18.580645-41.290323 41.290323-41.290322h247.741935c22.709677 0 41.290323 18.580645 41.290323 41.290322v247.741936z" fill="#FFFFFF" p-id="1309"></path><path d="M662.709677 633.806452c0 11.383742-9.261419 20.645161-20.645161 20.645161h-247.741935c-11.383742 0-20.645161-9.261419-20.645162-20.645161v-247.741936c0-11.383742 9.261419-20.645161 20.645162-20.645161h247.741935c11.383742 0 20.645161 9.261419 20.645161 20.645161v247.741936z m41.290323-247.741936c0-34.151226-27.784258-61.935484-61.935484-61.935484h-247.741935c-34.151226 0-61.935484 27.784258-61.935484 61.935484v247.741936c0 34.151226 27.784258 61.935484 61.935484 61.935483h247.741935c34.151226 0 61.935484-27.784258 61.935484-61.935483v-247.741936z" fill="#6E6E96" p-id="1310"></path></svg>
        </button>
        </div>
    </div>
</template>
<script>
export default {
    name: 'AudioPlayer',
    data() {
        return {
            playTime: 0,
            totalTime: 0,
            isPlaying: false, // 播放状态
        }
    },
    methods: {
        handleKeyboard(event) {
            if(this.$refs.audio.readyState <= 2) {
                return
            }
            
            if (event.keyCode === 32) {
                // 空格
                event.preventDefault()
                if (this.$refs.audio.paused) {
                    // 如果音频暂停，则播放音频
                    this.start()
                } else {
                    // 如果音频正在播放，则暂停音频
                    this.pause()
                }
            } else {
                const isPaused = this.$refs.audio.paused
                // 检查是否按下了左箭头键（keyCode 37）或右箭头键（keyCode 39）
                if (event.key === ',') {
                    // 向前移动3秒
                    if(!isPaused) {
                        this.$refs.audio.pause()
                    }
                    this.$refs.audio.currentTime -= 3;
                    this.timeUpdate(true)
                } else if (event.key === '.') {
                    // 向后移动3秒
                    if(!isPaused) {
                        this.$refs.audio.pause()
                    }
                    this.$refs.audio.currentTime += 3
                    this.timeUpdate(true)
                }else if (event.key === 'b') {
                    // 回到最开始
                    if(!isPaused) {
                        this.$refs.audio.pause()
                    }
                    this.$refs.audio.pause()
                    this.$refs.audio.currentTime = 0
                    this.timeUpdate(true)
                }
                if(!isPaused) {
                    this.$refs.audio.play()
                }
            }
        },
        setSrc(srcUrl) {
            this.$refs.audio.src = srcUrl
            this.$refs.audio.removeEventListener('loadedmetadata', this.handleLoadedMetadata)
            this.$refs.audio.addEventListener('loadedmetadata', this.handleLoadedMetadata)
        },
        handleLoadedMetadata() {
            const duration = this.$refs.audio.duration
            this.totalTime = duration
            this.$refs.audio.removeEventListener('loadedmetadata', this.handleLoadedMetadata)
        },
        timeUpdate(isManual) {
            this.playTime = this.$refs.audio.currentTime
            this.$emit('timeupdate', this.$refs.audio.currentTime, isManual === true)   // 默认传值为数字(当前播放时间)，如果是手动的就会传值true，所以要判断一下
            
            // 同步播放状态
            this.isPlaying = !this.$refs.audio.paused
            
            if(!this.$refs.audio.paused) {
                window.requestAnimationFrame(this.timeUpdate)
            }
        },
        start() {
            this.$refs.audio.play()
            this.isPlaying = true
            this.timeUpdate(true)
        },
        pause() {
            if (!this.$refs.audio.paused) {
                this.$refs.audio.pause()
                this.isPlaying = false
            }
        },
        togglePlay() {
            if (this.$refs.audio.readyState <= 2) {
                return
            }
            
            if (this.$refs.audio.paused) {
                // 如果音频暂停，则播放音频
                this.start()
            } else {
                // 如果音频正在播放，则暂停音频
                this.pause()
            }
        },
        seekToTime(event) {
            if (this.$refs.audio.readyState <= 2) {
                return
            }
            
            const rect = event.currentTarget.getBoundingClientRect()
            const clickX = event.clientX - rect.left
            const percentage = clickX / rect.width
            const newTime = percentage * this.totalTime
            
            // 设置音频时间
            this.$refs.audio.currentTime = newTime
            this.timeUpdate(true)
        },
    },
    mounted() {
        window.addEventListener('keydown', this.handleKeyboard)
        
        // 监听音频播放结束事件
        this.$refs.audio.addEventListener('ended', () => {
            this.isPlaying = false
        })
    },
    beforeUnmount() {
        // 组件销毁前移除事件监听
        window.removeEventListener('keydown', this.handleKeyboard)
    },
}
</script>
>