<template>
  <div
    class="pitch-demo"
    @mouseenter="startAnimation"
    @mouseleave="stopAnimation"
  >
    <div class="demo-container">
      <!-- 音符显示区域 -->
      <canvas ref="noteCanvas" class="note-canvas"></canvas>

      <!-- 钢琴键盘 -->
      <div class="piano-keyboard" ref="keyboardRef">
        <!-- 白键 -->
        <div
          v-for="key in whiteKeys"
          :key="key.note"
          class="white-key"
          :class="{ 'active': activeKeys.has(key.midi) }"
          :style="{ width: whiteKeyWidth + 'px' }"
        ></div>
        <!-- 黑键 -->
        <div
          v-for="key in blackKeys"
          :key="key.note"
          class="black-key"
          :class="{ 'active': activeKeys.has(key.midi) }"
          :style="{ left: getBlackKeyLeft(key.midi) + 'px', width: blackKeyWidth + 'px' }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PitchDemo',
  data() {
    return {
      isAnimating: false,
      animationId: null,
      noteCanvas: null,
      noteCtx: null,
      time: 0,
      activeKeys: new Set(),
      lastTime: 0,
      keyboardWidth: 0,
      whiteKeyWidth: 0,
      blackKeyWidth: 0,
      // 两个八度：C4 到 C6
      minPitch: 60,  // C4
      maxPitch: 84,  // C6
      // 预设的演示音符数据（丰富的和弦与旋律）
      demoNotes: [
        // 开头 - C大调和弦进行
        { pitch: 60, start: 0, duration: 0.8 },      // C4
        { pitch: 64, start: 0, duration: 0.8 },      // E4
        { pitch: 67, start: 0, duration: 0.8 },      // G4
        { pitch: 72, start: 0, duration: 0.8 },      // C5

        // 旋律线
        { pitch: 76, start: 1.0, duration: 0.4 },    // E5
        { pitch: 74, start: 1.5, duration: 0.4 },    // D5
        { pitch: 72, start: 2.0, duration: 0.6 },    // C5

        // F大调和弦
        { pitch: 65, start: 2.8, duration: 0.8 },    // F4
        { pitch: 69, start: 2.8, duration: 0.8 },    // A4
        { pitch: 72, start: 2.8, duration: 0.8 },    // C5

        // 旋律下行
        { pitch: 71, start: 3.8, duration: 0.3 },    // B4
        { pitch: 69, start: 4.2, duration: 0.3 },    // A4
        { pitch: 67, start: 4.6, duration: 0.5 },    // G4

        // G7和弦
        { pitch: 59, start: 5.3, duration: 0.8 },    // B3
        { pitch: 62, start: 5.3, duration: 0.8 },    // D4
        { pitch: 67, start: 5.3, duration: 0.8 },    // G4
        { pitch: 71, start: 5.3, duration: 0.8 },    // B4

        // 快速琶音
        { pitch: 60, start: 6.3, duration: 0.2 },    // C4
        { pitch: 64, start: 6.5, duration: 0.2 },    // E4
        { pitch: 67, start: 6.7, duration: 0.2 },    // G4
        { pitch: 72, start: 6.9, duration: 0.3 },    // C5
        { pitch: 76, start: 7.1, duration: 0.3 },    // E5
        { pitch: 79, start: 7.3, duration: 0.4 },    // G5
        { pitch: 84, start: 7.6, duration: 0.8 },    // C6

        // Am和弦
        { pitch: 57, start: 8.6, duration: 0.8 },    // A3
        { pitch: 60, start: 8.6, duration: 0.8 },    // C4
        { pitch: 64, start: 8.6, duration: 0.8 },    // E4
        { pitch: 69, start: 8.6, duration: 0.8 },    // A4

        // 旋律起伏
        { pitch: 72, start: 9.6, duration: 0.3 },    // C5
        { pitch: 71, start: 10.0, duration: 0.3 },   // B4
        { pitch: 69, start: 10.4, duration: 0.3 },   // A4
        { pitch: 67, start: 10.8, duration: 0.5 },   // G4

        // Dm和弦
        { pitch: 62, start: 11.5, duration: 0.8 },   // D4
        { pitch: 65, start: 11.5, duration: 0.8 },   // F4
        { pitch: 69, start: 11.5, duration: 0.8 },   // A4

        // 八度跳跃
        { pitch: 60, start: 12.5, duration: 0.4 },   // C4
        { pitch: 72, start: 13.0, duration: 0.4 },   // C5
        { pitch: 84, start: 13.5, duration: 0.6 },   // C6

        // 最终大和弦 - C大调全和弦
        { pitch: 48, start: 14.3, duration: 1.2 },   // C3
        { pitch: 60, start: 14.3, duration: 1.2 },   // C4
        { pitch: 64, start: 14.3, duration: 1.2 },   // E4
        { pitch: 67, start: 14.3, duration: 1.2 },   // G4
        { pitch: 72, start: 14.3, duration: 1.2 },   // C5
        { pitch: 76, start: 14.3, duration: 1.2 },   // E5
        { pitch: 79, start: 14.3, duration: 1.2 },   // G5
        { pitch: 84, start: 14.3, duration: 1.5 },   // C6
      ],
      totalDuration: 16,
      // 钢琴键盘配置 (C4 到 C6，两个八度)
      pianoKeys: []
    }
  },
  computed: {
    // 白键
    whiteKeys() {
      return this.pianoKeys.filter(k => !k.isBlack)
    },
    // 黑键
    blackKeys() {
      return this.pianoKeys.filter(k => k.isBlack)
    },
    pitchRange() {
      return this.maxPitch - this.minPitch
    },
    whiteKeyCount() {
      return this.whiteKeys.length
    }
  },
  created() {
    // 初始化钢琴键盘配置（两个八度）
    this.initPianoKeys()
  },
  mounted() {
    this.$nextTick(() => {
      this.initCanvas()
    })
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    this.stopAnimation()
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    initPianoKeys() {
      // 生成两个八度的钢琴键 (C4 到 C6)
      this.pianoKeys = []
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

      for (let octave = 4; octave <= 5; octave++) {
        for (let i = 0; i < 12; i++) {
          const midi = 12 + i + octave * 12
          const noteName = noteNames[i]
          const isBlack = noteName.includes('#')
          this.pianoKeys.push({
            note: `${noteName}${octave}`,
            midi: midi,
            isBlack: isBlack
          })
        }
      }
      // 添加 C6
      this.pianoKeys.push({
        note: 'C6',
        midi: 84,
        isBlack: false
      })
    },
    initCanvas() {
      this.noteCanvas = this.$refs.noteCanvas
      this.noteCtx = this.noteCanvas.getContext('2d')
      this.resizeCanvas()
    },
    resizeCanvas() {
      const container = this.noteCanvas.parentElement
      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()

      // 重置变换矩阵
      this.noteCtx.setTransform(1, 0, 0, 1, 0, 0)

      this.noteCanvas.width = rect.width * dpr
      this.noteCanvas.height = rect.height * dpr
      this.noteCanvas.style.width = rect.width + 'px'
      this.noteCanvas.style.height = rect.height + 'px'

      this.noteCtx.scale(dpr, dpr)
      this.canvasWidth = rect.width
      this.canvasHeight = rect.height

      // 计算键盘尺寸
      this.calculateKeyboardSize()

      // 绘制画面
      if (this.isAnimating) {
        this.draw()
      } else {
        this.drawStaticView()
      }
    },
    calculateKeyboardSize() {
      // 计算白键宽度，确保与音符对齐
      const keyboardHeight = this.canvasHeight * 0.25
      const noteAreaHeight = this.canvasHeight - keyboardHeight

      // 白键数量（两个八度 + C6 = 15个白键）
      const whiteKeyCount = this.whiteKeys.length

      // 每个白键的宽度 = 画布宽度 / 白键数量
      this.whiteKeyWidth = this.canvasWidth / whiteKeyCount
      this.blackKeyWidth = this.whiteKeyWidth * 0.6

      this.keyboardWidth = this.canvasWidth
    },
    handleResize() {
      this.resizeCanvas()
    },
    startAnimation() {
      if (this.isAnimating) return
      this.isAnimating = true
      this.time = 0
      this.lastTime = performance.now()
      this.animate()
    },
    stopAnimation() {
      this.isAnimating = false
      if (this.animationId) {
        cancelAnimationFrame(this.animationId)
        this.animationId = null
      }
      this.time = 0
      this.activeKeys.clear()
      this.drawStaticView()
    },
    animate() {
      if (!this.isAnimating) return

      const currentTime = performance.now()
      const deltaTime = (currentTime - this.lastTime) / 1000
      this.lastTime = currentTime

      this.time += deltaTime
      if (this.time >= this.totalDuration) {
        this.time = 0
      }

      this.updateActiveKeys()
      this.draw()

      this.animationId = requestAnimationFrame(this.animate)
    },
    updateActiveKeys() {
      this.activeKeys.clear()
      const currentTime = this.time
      const previewTime = 0.15

      for (const note of this.demoNotes) {
        const noteStart = note.start
        const noteEnd = note.start + note.duration

        if (currentTime >= noteStart - previewTime && currentTime <= noteEnd) {
          this.activeKeys.add(note.pitch)
        }
      }
    },
    // 获取音符的X位置（与键盘对齐）
    getNoteX(pitch) {
      // 找到对应的白键索引
      const whiteKeyIndex = this.getWhiteKeyIndex(pitch)
      // 返回白键中心位置
      return whiteKeyIndex * this.whiteKeyWidth + this.whiteKeyWidth * 0.1
    },
    // 获取白键索引
    getWhiteKeyIndex(pitch) {
      // 计算从 minPitch 开始有多少个白键
      let count = 0
      for (let p = this.minPitch; p < pitch; p++) {
        if (!this.isBlackKey(p)) {
          count++
        }
      }
      return count
    },
    // 判断是否是黑键
    isBlackKey(pitch) {
      const noteInOctave = pitch % 12
      return [1, 3, 6, 8, 10].includes(noteInOctave) // C#, D#, F#, G#, A#
    },
    // 获取黑键的left位置
    getBlackKeyLeft(midi) {
      // 找到前一个白键的位置，然后向右偏移
      const whiteKeyIndex = this.getWhiteKeyIndex(midi)
      // 黑键位于前一个白键的右半部分
      return (whiteKeyIndex * this.whiteKeyWidth) - (this.blackKeyWidth / 2)
    },
    draw() {
      const ctx = this.noteCtx
      const width = this.canvasWidth
      const height = this.canvasHeight

      // 清空画布
      ctx.clearRect(0, 0, width, height)

      // 绘制背景
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, width, height)

      // 绘制网格线
      this.drawGrid(ctx, width, height)

      // 计算参数
      const keyboardHeight = height * 0.25
      const noteAreaHeight = height - keyboardHeight
      const pixelsPerSecond = 50
      const timeOffset = this.time
      const playLineY = noteAreaHeight - 10
      const fadeZone = 60 // 淡出区域高度（像素）

      // 绘制音符
      for (const note of this.demoNotes) {
        const timeUntilPlay = note.start - timeOffset
        const noteBottomY = playLineY - timeUntilPlay * pixelsPerSecond
        const noteHeight = note.duration * pixelsPerSecond
        const noteTopY = noteBottomY - noteHeight

        // 扩大可见范围，让淡出动画可见
        if (noteBottomY < -fadeZone || noteTopY > noteAreaHeight) continue

        const x = this.getNoteX(note.pitch)
        const noteWidth = this.whiteKeyWidth * 0.8

        // 计算透明度和发光效果
        let opacity = 0.9
        let glowIntensity = 0

        // 接近播放线时增加发光效果
        if (noteBottomY > playLineY - 30 && noteBottomY <= playLineY) {
          glowIntensity = 1 - (playLineY - noteBottomY) / 30
        }

        // 通过播放线后淡出
        if (noteBottomY > playLineY) {
          opacity = Math.max(0, 0.9 - (noteBottomY - playLineY) / fadeZone)
        }

        const hue = this.getPitchHue(note.pitch)

        // 绘制发光效果
        if (glowIntensity > 0) {
          ctx.shadowColor = `hsla(${hue}, 100%, 70%, ${glowIntensity * 0.8})`
          ctx.shadowBlur = 15 * glowIntensity
        } else {
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
        }

        // 绘制音符
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${opacity})`
        const cornerRadius = Math.max(2, Math.min(noteHeight * 0.2, noteWidth * 0.3))
        this.drawRoundedRect(ctx, x, noteTopY, noteWidth, noteHeight, cornerRadius)

        // 重置阴影
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
      }

      // 绘制播放线
      ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, playLineY)
      ctx.lineTo(width, playLineY)
      ctx.stroke()
    },
    drawStaticView() {
      const ctx = this.noteCtx
      const width = this.canvasWidth
      const height = this.canvasHeight

      // 清空画布
      ctx.clearRect(0, 0, width, height)

      // 绘制背景
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, width, height)

      // 绘制网格线
      this.drawGrid(ctx, width, height)

      // 计算参数
      const keyboardHeight = height * 0.25
      const noteAreaHeight = height - keyboardHeight
      const pixelsPerSecond = 50
      const playLineY = noteAreaHeight - 10

      // 静态显示：显示即将播放的音符（与动画起始位置一致）
      const staticTimeOffset = 0
      for (const note of this.demoNotes) {
        const timeUntilPlay = note.start - staticTimeOffset
        const noteBottomY = playLineY - timeUntilPlay * pixelsPerSecond
        const noteHeight = note.duration * pixelsPerSecond
        const noteTopY = noteBottomY - noteHeight

        if (noteBottomY < 0 || noteTopY > noteAreaHeight) continue

        const x = this.getNoteX(note.pitch)
        const noteWidth = this.whiteKeyWidth * 0.8

        const hue = this.getPitchHue(note.pitch)
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.9)`

        const cornerRadius = Math.max(2, Math.min(noteHeight * 0.2, noteWidth * 0.3))
        this.drawRoundedRect(ctx, x, noteTopY, noteWidth, noteHeight, cornerRadius)
      }

      // 绘制播放线
      ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, playLineY)
      ctx.lineTo(width, playLineY)
      ctx.stroke()
    },
    drawGrid(ctx, width, height) {
      const keyboardHeight = height * 0.25
      const noteAreaHeight = height - keyboardHeight

      // 绘制垂直线（对应白键位置）
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1

      for (let i = 0; i <= this.whiteKeyCount; i++) {
        const x = i * this.whiteKeyWidth
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, noteAreaHeight)
        ctx.stroke()
      }
    },
    getPitchHue(pitch) {
      const baseHue = 0
      const hueRange = 60
      const normalizedPitch = (pitch - this.minPitch) / (this.maxPitch - this.minPitch)
      return baseHue + normalizedPitch * hueRange
    },
    drawRoundedRect(ctx, x, y, width, height, radius) {
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + width - radius, y)
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
      ctx.lineTo(x + width, y + height - radius)
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
      ctx.lineTo(x + radius, y + height)
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.fill()
    }
  }
}
</script>

<style scoped>
.pitch-demo {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.demo-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.note-canvas {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.piano-keyboard {
  height: 25%;
  display: flex;
  position: relative;
  padding: 0;
  background: linear-gradient(to bottom, #f5f5f5, #e0e0e0);
}

.white-key {
  height: 100%;
  background: linear-gradient(to bottom, #f5f5f5, #e0e0e0);
  border-radius: 0 0 4px 4px;
  transition: background 0.1s ease;
  border-right: 1px solid #bbb;
  box-sizing: border-box;
}

.white-key:last-child {
  border-right: none;
}

.white-key.active {
  background: linear-gradient(to bottom, #ffd700, #ffb700);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.black-key {
  position: absolute;
  height: 60%;
  background: linear-gradient(to bottom, #333, #111);
  border-radius: 0 0 3px 3px;
  z-index: 2;
  transition: background 0.1s ease;
}

.black-key.active {
  background: linear-gradient(to bottom, #ff8c00, #ff6600);
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.5);
}
</style>
