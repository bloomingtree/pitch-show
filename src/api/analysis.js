import request from './index'

/**
 * 上传音频并启动 AI 分析流水线
 * POST /songs (multipart/form-data)
 * @param {File} file - 音频文件
 * @param {Object} options - 可选参数 { name, truncate }
 * @returns {Promise<Object>} { id, status, cached, audio, analysis, title }
 */
export function startAnalysis(file, options = {}) {
  const formData = new FormData()
  formData.append('file', file)

  const params = {}
  if (options.name) params.name = options.name
  // truncate 默认 true，仅在显式设为 false 时才发送（query string 无法传布尔值）
  if (options.truncate === false) params.truncate = false

  return request({
    url: '/songs',
    method: 'post',
    data: formData,
    params,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000
  })
}

/**
 * 获取分析进度（轮询接口）
 * GET /analysis/:songId/progress
 * @param {string} songId - 歌曲 ID
 * @returns {Promise<Object>} { song_id, status, stage, label, percent, estimated_remaining_seconds }
 */
export function getAnalysisProgress(songId) {
  return request({
    url: `/analysis/${songId}/progress`,
    method: 'get'
  })
}

/**
 * 获取当前用户配额信息
 * GET /analysis/quota/me
 * @returns {Promise<Object>} { storage_limit, storage_used, monthly_limit, monthly_used, is_premium }
 */
export function getAnalysisQuota() {
  return request({
    url: '/analysis/quota/me',
    method: 'get',
    _skipAuthError: true
  })
}

/**
 * 获取歌曲详情（含完整分析结果）
 * GET /songs/:id
 * @param {string} songId - 歌曲 ID
 * @returns {Promise<Object>} { id, title, status, audio, analysis, created_at, updated_at }
 */
export function getSong(songId) {
  return request({
    url: `/songs/${songId}`,
    method: 'get'
  })
}

/**
 * 获取歌曲列表（分页）
 * GET /songs
 * @param {Object} params - { page, limit, status, search }
 * @returns {Promise<Object>} { data: [...songs], pagination: {...}, quota: {...} }
 */
export function getSongList(params = {}) {
  return request({
    url: '/songs',
    method: 'get',
    params
  })
}

/**
 * 更新歌曲信息（仅标题）
 * PUT /songs/:id
 * @param {string} songId - 歌曲 ID
 * @param {Object} data - { title }
 */
export function updateSong(songId, data) {
  return request({
    url: `/songs/${songId}`,
    method: 'put',
    data
  })
}

/**
 * 删除歌曲
 * DELETE /songs/:id
 * @param {string} songId - 歌曲 ID
 */
export function deleteSong(songId) {
  return request({
    url: `/songs/${songId}`,
    method: 'delete'
  })
}

/**
 * 批量删除歌曲
 * DELETE /songs/batch
 * @param {string[]} songIds - 歌曲 ID 数组
 */
export function batchDeleteSongs(songIds) {
  return request({
    url: '/songs/batch',
    method: 'delete',
    data: { song_ids: songIds }
  })
}

/**
 * 重试分析失败的歌曲
 * POST /songs/:id/retry
 * @param {string} songId - 歌曲 ID
 */
export function retryAnalysis(songId) {
  return request({
    url: `/songs/${songId}/retry`,
    method: 'post'
  })
}

// ─── 数据转换 ────────────────────────────────────

/** 四轨颜色映射（经典配色，作为后端未返回时的 fallback） */
const TRACK_COLORS = {
  vocals: '#06b6d4',
  bass: '#f59e0b',
  drums: '#57534e',
  other: '#84cc16'
}

/**
 * 将后端分析结果转换为 Canvas 渲染数据
 * @param {Object} analysis - 后端 analysis 字段（tracks, beats, chords, tempo, key）
 * @param {number} audioDuration - 音频时长（秒），来自 song.audio.duration
 * @returns {{ notes: Array, beats: Object, chords: Array, duration: number }}
 */
export function convertBackendResult(analysis, audioDuration = 0) {
  if (!analysis || !analysis.tracks) {
    return { notes: [], beats: null, chords: [], duration: 0 }
  }

  const notes = []
  for (const [trackName, track] of Object.entries(analysis.tracks)) {
    const trackColor = track.color || TRACK_COLORS[trackName] || '#999999'
    for (const n of track.notes) {
      notes.push({
        pitchMidi: n.pitch,
        startTimeSeconds: n.onset,
        durationSeconds: n.offset - n.onset,
        amplitude: n.velocity,
        trackName,
        trackColor,
        drumName: n.drum_name || null
      })
    }
  }
  notes.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)

  return {
    notes,
    beats: analysis.beats || null,
    chords: analysis.chords || [],
    duration: audioDuration
  }
}

/**
 * 轮询分析进度直到完成
 * @param {string} songId - 歌曲 ID
 * @param {Function} onProgress - 进度回调 ({ status, stage, label, percent, estimated_remaining_seconds })
 * @param {number} interval - 轮询间隔（毫秒），默认 5000
 * @returns {Promise<Object>} 完成后的歌曲数据
 */
export function pollAnalysisUntilComplete(songId, onProgress, interval = 5000) {
  return new Promise((resolve, reject) => {
    let stopped = false
    let retryCount = 0
    const MAX_RETRIES = 3

    const poll = async () => {
      if (stopped) return

      try {
        const progress = await getAnalysisProgress(songId)

        // 防御：progress 可能为 null（如已完成的分析不再返回进度）
        if (!progress) {
          // 尝试直接获取歌曲数据
          const song = await getSong(songId)
          if (song && song.status === 'completed') {
            resolve(song)
            return
          }
          // 否则继续轮询
          setTimeout(poll, interval)
          return
        }

        if (onProgress) {
          onProgress(progress)
        }

        if (progress.status === 'completed') {
          const song = await getSong(songId)
          resolve(song)
          return
        }

        if (progress.status === 'failed') {
          reject(new Error(progress.label || '分析失败'))
          return
        }

        retryCount = 0 // 成功请求后重置重试计数
        // 继续轮询
        setTimeout(poll, interval)
      } catch (error) {
        retryCount++
        if (retryCount >= MAX_RETRIES) {
          reject(error)
        } else {
          // 网络抖动等临时错误，继续重试
          console.warn(`进度查询失败 (${retryCount}/${MAX_RETRIES})，继续轮询...`, error.message)
          setTimeout(poll, interval)
        }
      }
    }

    poll()

    // 返回一个取消函数，让调用方可以中止轮询
    poll.cancel = () => {
      stopped = true
      reject(new Error('分析已取消'))
    }
  })
}
