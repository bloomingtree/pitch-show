<template>
    <div class="w-full h-full flex flex-col">
        <audio ref="audio" preload="auto" />
        <div class="w-full h-2">
            <div :style="'width: '+playTime/totalTime*100+'%;'" class="bg-red-300"></div>
        </div>
        <div>
            <div>{{Math.floor(playTime/60)}}:{{Math.floor(playTime%60)}}/{{Math.floor(totalTime/60)}}:{{Math.floor(totalTime%60)}}</div>
            
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
        }
    },
    methods: {
        handleKeyboard(event) {
            if(this.$refs.audio.readyState <= 2) {
                return
            }
            // 检查是否按下了左箭头键（keyCode 37）或右箭头键（keyCode 39）
            if (event.key === ',') {
                // 向前移动3秒
                this.$refs.audio.currentTime -= 2;
                this.timeUpdate()
            } else if (event.key === '.') {
                // 向后移动3秒
                this.$refs.audio.currentTime += 2
                this.timeUpdate()
            }else if (event.key === 'b') {
                // 回到最开始
                this.$refs.audio.currentTime = 0
                this.timeUpdate()
            }else if (event.keyCode === 32) {
                // 空格
                event.preventDefault()
                if (this.$refs.audio.paused) {
                    // 如果音频暂停，则播放音频
                    this.start()
                } else {
                    // 如果音频正在播放，则暂停音频
                    this.pause()
                }
            }
            this.$emit('timeupdate', this.$refs.audio.currentTime)
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
        timeUpdate() {
            this.playTime = this.$refs.audio.currentTime
            this.$emit('timeupdate', this.$refs.audio.currentTime)
            if(!this.$refs.audio.paused) {
                window.requestAnimationFrame(this.timeUpdate)
            }
        },
        start() {
            this.$refs.audio.play()
            this.timeUpdate()
        },
        pause() {
            if (!this.$refs.audio.paused) {
                this.$refs.audio.pause()
            }
        },
    },
    mounted() {
        window.addEventListener('keydown', this.handleKeyboard)
    },
    beforeUnmount() {
        // 组件销毁前移除事件监听
        window.removeEventListener('keydown', this.handleKeyboard)
    },
}
</script>
>