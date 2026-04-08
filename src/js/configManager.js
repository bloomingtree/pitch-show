/**
 * configManager.js - 统一配置管理模块
 * 负责所有用户设置的持久化存储和读取
 */

// 配置存储键名
const CONFIG_KEY = 'pitch_show_settings'

/**
 * 默认配置（唯一来源）
 * 所有配置项的默认值都在这里定义
 */
export const DEFAULT_CONFIG = {
  // 颜色方案
  colorScheme: 'sunset',

  // 过滤设置
  filter: {
    minDuration: 0.05,      // 最短音符时长（秒）
    enableMerge: false,     // 是否启用合并
    mergeGap: 0.05          // 合并间隔（秒）
  },

  // 语言设置
  language: 'zh'
}

/**
 * 加载配置
 * @returns {Object} 合并后的配置对象
 */
export function loadConfig() {
  try {
    const saved = localStorage.getItem(CONFIG_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // 深度合并，保留新增的默认配置项
      return deepMerge(DEFAULT_CONFIG, parsed)
    }
  } catch (e) {
    console.warn('加载配置失败:', e)
  }
  return { ...DEFAULT_CONFIG }
}

/**
 * 保存配置
 * @param {Object} config - 完整配置对象
 */
export function saveConfig(config) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  } catch (e) {
    console.warn('保存配置失败:', e)
  }
}

/**
 * 更新部分配置
 * @param {string} path - 配置路径，如 'filter.minDuration'
 * @param {*} value - 新值
 * @returns {Object} 更新后的配置
 */
export function updateConfig(path, value) {
  const config = loadConfig()
  setNestedValue(config, path, value)
  saveConfig(config)
  return config
}

/**
 * 重置配置到默认值
 * @param {string} [path] - 可选，指定重置的配置路径
 * @returns {Object} 重置后的配置
 */
export function resetConfig(path) {
  if (path) {
    const config = loadConfig()
    setNestedValue(config, path, getNestedValue(DEFAULT_CONFIG, path))
    saveConfig(config)
    return config
  }
  saveConfig(DEFAULT_CONFIG)
  return { ...DEFAULT_CONFIG }
}

/**
 * 深度合并对象
 * @param {Object} target - 目标对象（默认值）
 * @param {Object} source - 源对象（用户配置）
 * @returns {Object} 合并后的对象
 */
function deepMerge(target, source) {
  const result = { ...target }
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}

/**
 * 获取嵌套对象的值
 * @param {Object} obj - 对象
 * @param {string} path - 路径
 * @returns {*} 值
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

/**
 * 设置嵌套对象的值
 * @param {Object} obj - 对象
 * @param {string} path - 路径
 * @param {*} value - 值
 */
function setNestedValue(obj, path, value) {
  const keys = path.split('.')
  const lastKey = keys.pop()
  const target = keys.reduce((acc, key) => {
    if (!acc[key]) acc[key] = {}
    return acc[key]
  }, obj)
  target[lastKey] = value
}

// 导出 DEFAULT_CONFIG.filter 以便其他模块直接使用过滤默认值
export const DEFAULT_FILTER_SETTINGS = DEFAULT_CONFIG.filter
