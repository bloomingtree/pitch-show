/**
 * noteMerger.js - 音符合并模块
 * 将相邻的同音高音符合并，减少碎片
 */

/**
 * 合并相邻音符
 * @param {Array} notes - 过滤后的音符数组
 * @param {number} mergeGap - 合并间隔（秒），两个音符之间最大允许的静音间隔
 * @returns {Array} 合并后的音符数组（新数组，不修改原数组）
 */
export function mergeNotes(notes, mergeGap = 0.05) {
  if (!notes || notes.length === 0) {
    return []
  }

  // 1. 按音高分组（只合并相同音高）
  const pitchGroups = groupNotesByPitch(notes)

  // 2. 每组内合并相邻音符
  const mergedNotes = []

  for (const group of pitchGroups.values()) {
    // 按开始时间排序
    group.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)

    let current = null

    for (const note of group) {
      if (current === null) {
        // 开始新分组
        current = { ...note }
        continue
      }

      const currentEnd = current.startTimeSeconds + current.durationSeconds
      const gap = note.startTimeSeconds - currentEnd

      // 检查是否可以合并：间隔在允许范围内
      if (gap <= mergeGap) {
        // 合并
        current = mergeTwoNotes(current, note)
      } else {
        // 保存当前音符，开始新分组
        mergedNotes.push(current)
        current = { ...note }
      }
    }

    // 保存最后一个
    if (current !== null) {
      mergedNotes.push(current)
    }
  }

  // 3. 按时间排序返回
  return mergedNotes.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
}

/**
 * 按音高分组（精确匹配）
 * @param {Array} notes - 音符数组
 * @returns {Map<number, Array>} 分组后的音符
 */
function groupNotesByPitch(notes) {
  const groups = new Map()

  for (const note of notes) {
    const pitch = note.pitchMidi
    if (!groups.has(pitch)) {
      groups.set(pitch, [])
    }
    groups.get(pitch).push(note)
  }

  return groups
}

/**
 * 合并两个音符
 * @param {Object} note1 - 第一个音符（时间较早）
 * @param {Object} note2 - 第二个音符
 * @returns {Object} 合并后的音符
 */
function mergeTwoNotes(note1, note2) {
  const startTime = Math.min(note1.startTimeSeconds, note2.startTimeSeconds)
  const end1 = note1.startTimeSeconds + note1.durationSeconds
  const end2 = note2.startTimeSeconds + note2.durationSeconds
  const endTime = Math.max(end1, end2)

  // 合并 pitchBends
  const pitchBends = []
  if (note1.pitchBends && note1.pitchBends.length > 0) {
    pitchBends.push(...note1.pitchBends)
  }
  if (note2.pitchBends && note2.pitchBends.length > 0) {
    pitchBends.push(...note2.pitchBends)
  }

  // 计算新的振幅（取平均）
  const amplitude = (note1.amplitude + note2.amplitude) / 2

  // 取较高的置信度
  const confidence = Math.max(
    note1.confidence ?? 0.7,
    note2.confidence ?? 0.7
  )

  // 取平均音高（四舍五入）
  const pitchMidi = Math.round((note1.pitchMidi + note2.pitchMidi) / 2)

  // 判断是否为动态音符
  const isDynamic = calculateIsDynamic(pitchBends)

  return {
    ...note1,
    startTimeSeconds: startTime,
    durationSeconds: endTime - startTime,
    pitchMidi,
    amplitude,
    confidence,
    pitchBends: pitchBends.length > 0 ? pitchBends : undefined,
    isDynamic
  }
}

/**
 * 根据 pitchBends 判断是否为动态音符
 * @param {Array} pitchBends - 弯音数组
 * @returns {boolean} 是否为动态音符
 */
function calculateIsDynamic(pitchBends) {
  if (!pitchBends || pitchBends.length < 2) {
    return false
  }

  // 提取弯音值
  const bendValues = pitchBends.map(b => {
    if (typeof b === 'number') return b
    if (b && typeof b === 'object' && 'pitchBend' in b) return b.pitchBend
    return 0
  })

  // 计算方差
  const avg = bendValues.reduce((a, b) => a + b, 0) / bendValues.length
  const variance = bendValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / bendValues.length

  // 方差大于 0.05 认为是动态音符
  return variance > 0.05
}
