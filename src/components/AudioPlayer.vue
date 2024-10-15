<template>
    <div class="w-full h-full flex flex-col">
        <audio controls ref="audio" preload="auto" @timeupdate="timeUpdate"/>
        <div class="w-full h-2">
            <div :style="'width: '+playTime/totalTime*100+'%;'" class="bg-red-300"></div>
        </div>
        <div>
            <div>{{playTime/60}}:{{playTime%60}}/{{totalTime/60}}:{{totalTime%60}}</div>
            
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
            } else if (event.key === '.') {
                // 向后移动3秒
                this.$refs.audio.currentTime += 2;
            }else if (event.keyCode === 32) {
                // 空格
                if (this.$refs.audio.paused) {
                    // 如果音频暂停，则播放音频
                    this.$refs.audio.play()
                } else {
                    // 如果音频正在播放，则暂停音频
                    this.$refs.audio.pause()
                }
            }
            this.$emit('timeupdate', this.$refs.audio.currentTime)
        },
        setSrc(srcUrl) {
            this.$refs.audio.src = srcUrl
        },
        timeUpdate() {
            this.$emit('timeupdate', this.$refs.audio.currentTime)
        },
        start() {
            this.$refs.audio.play()
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