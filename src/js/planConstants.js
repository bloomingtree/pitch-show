/**
 * 套餐等级常量 — 供全站显示使用
 * 与后端 PLAN_DEFAULTS 保持一致
 */

export const PLAN_LABELS = {
  free: '免费版',
  basic: '基础版',
  pro: '专业版',
  studio: '工作室版',
  custom: '自定义'
}

export const PLAN_COLORS = {
  free: { bg: 'rgba(34, 197, 94, 0.12)', text: '#166534' },
  basic: { bg: 'rgba(59, 130, 246, 0.12)', text: '#1e40af' },
  pro: { bg: 'rgba(245, 158, 11, 0.12)', text: '#92400e' },
  studio: { bg: 'rgba(139, 92, 246, 0.12)', text: '#5b21b6' },
  custom: { bg: 'rgba(107, 114, 128, 0.12)', text: '#374151' }
}

export const PLAN_DEFAULTS = {
  free: {
    label: '免费版',
    price: 0,
    priceLabel: '¥0',
    pricePeriod: '/永久',
    storageLimit: 1,
    monthlyLimit: 1,
    maxDuration: 180,
    dailyLimit: -1,
    features: { midi_export: false, api_access: false }
  },
  basic: {
    label: '基础版',
    price: 9.9,
    priceLabel: '¥9.9',
    pricePeriod: '/月',
    storageLimit: 15,
    monthlyLimit: 15,
    maxDuration: 420,
    dailyLimit: -1,
    features: { midi_export: false, api_access: false }
  },
  pro: {
    label: '专业版',
    price: 29,
    priceLabel: '¥29',
    pricePeriod: '/月',
    storageLimit: 50,
    monthlyLimit: 50,
    maxDuration: 900,
    dailyLimit: -1,
    features: { midi_export: true, api_access: false }
  },
  studio: {
    label: '工作室版',
    price: 99,
    priceLabel: '¥99',
    pricePeriod: '/月',
    storageLimit: 200,
    monthlyLimit: -1,
    maxDuration: 1800,
    dailyLimit: 100,
    features: { midi_export: true, api_access: true }
  }
}

/**
 * 判断是否为付费用户
 */
export function isPaidPlan(planLevel) {
  return !!planLevel && planLevel !== 'free'
}

/**
 * 格式化时长（秒 → "X分钟"）
 */
export function formatDuration(seconds) {
  return Math.round(seconds / 60) + '分钟'
}

/**
 * 格式化配额值（-1 表示"无限"）
 */
export function formatQuotaValue(value, unit = '') {
  if (value === -1 || value === null || value === undefined) return '无限'
  return value + unit
}
