/**
 * noteFilter.js - 音符过滤模块
 * 根据用户设置的参数过滤音符
 */

/**
 * 过滤音符
 * @param {Array} notes - 原始音符数组
 * @param {Object} settings - 过滤设置
 * @param {number} settings.minDuration - 最短音符时长（秒）
 * @returns {Array} 过滤后的音符数组（新数组，不修改原数组）
 */
export function filterNotes(notes, settings) {
  if (!notes || notes.length === 0) {
    return []
  }

  const { minDuration } = settings

  return notes.filter(note => {
    // 过滤短音符
    const duration = note.durationSeconds || 0
    if (duration < minDuration) {
      return false
    }

    return true
  })
}

// 从 configManager 重新导出默认设置，保持向后兼容
export { DEFAULT_FILTER_SETTINGS } from './configManager.js'
