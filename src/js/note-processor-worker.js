/**
 * 音符后处理 Worker
 * 在后台线程中执行音符转换、弯音计算和排序，避免阻塞主线程
 */

import { noteFramesToTime, outputToNotesPoly, addPitchBendsToNoteEvents } from '@spotify/basic-pitch'

self.onmessage = function(e) {
  const { type, data } = e.data

  if (type === 'process') {
    const { frames, onsets, contours, onsetThreshold, frameThreshold, minNoteLength } = data

    try {
      // 步骤1: 音符帧转换为音符事件
      self.postMessage({ type: 'progress', step: 'convert', progress: 0 })
      const noteEvents = outputToNotesPoly(
        frames,
        onsets,
        onsetThreshold || 0.25,
        frameThreshold || 0.25,
        minNoteLength || 5
      )
      self.postMessage({ type: 'progress', step: 'convert', progress: 30 })

      // 步骤2: 计算弯音信息
      self.postMessage({ type: 'progress', step: 'pitchBend', progress: 30 })
      const notesWithBends = addPitchBendsToNoteEvents(contours, noteEvents)
      self.postMessage({ type: 'progress', step: 'pitchBend', progress: 60 })

      // 步骤3: 转换为时间格式
      self.postMessage({ type: 'progress', step: 'toTime', progress: 60 })
      const notes = noteFramesToTime(notesWithBends)
      self.postMessage({ type: 'progress', step: 'toTime', progress: 90 })

      // 步骤4: 排序
      self.postMessage({ type: 'progress', step: 'sort', progress: 90 })
      const sortedNotes = notes.sort((a, b) => {
        return (a.startTimeSeconds + a.durationSeconds) - (b.startTimeSeconds + b.durationSeconds)
      })
      self.postMessage({ type: 'progress', step: 'sort', progress: 100 })

      // 返回完整处理结果
      self.postMessage({
        type: 'complete',
        notes: sortedNotes
      })

    } catch (error) {
      self.postMessage({ type: 'error', error: error.message })
    }
  }
}
