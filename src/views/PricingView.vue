<template>
  <div class="min-h-screen py-8 px-4" style="background-color: #FAF6EE;">
    <div class="max-w-3xl mx-auto">

      <!-- 返回按钮 -->
      <button @click="$router.back()" class="back-btn">
        <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
          <path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/>
        </svg>
        {{ $t('pricing.back') }}
      </button>

      <!-- 标题区 -->
      <div class="header-section">
        <h1 class="header-title">{{ $t('pricing.title') }}</h1>
        <p class="header-desc">{{ $t('pricing.subtitle') }}</p>
      </div>

      <!-- 周期切换 -->
      <div class="period-switch-wrapper">
        <div class="period-switch">
          <button class="period-btn" :class="{ active: isAnnual }" @click="isAnnual = true">{{ $t('pricing.yearly') }}</button>
          <button class="period-btn" :class="{ active: !isAnnual }" @click="isAnnual = false">{{ $t('pricing.monthly') }}</button>
        </div>
        <span v-if="isAnnual" class="period-save">{{ $t('pricing.saveYearly') }}</span>
      </div>

      <!-- 套餐对比 -->
      <div class="plans-grid">
        <div v-for="plan in currentPlans" :key="plan.key"
          class="plan-card"
          :class="[plan.key, { recommended: plan.recommended }]">
          <div v-if="plan.recommended" class="plan-recommend">{{ $t('pricing.recommended') }}</div>
          <div class="plan-badge" :class="plan.key">{{ plan.label }}</div>
          <div class="plan-price">
            <span class="price-amount">{{ plan.priceLabel }}</span>
            <span class="price-period">{{ plan.pricePeriod }}</span>
          </div>
          <div v-if="plan.annualNote" class="annual-note">{{ plan.annualNote }}</div>
          <ul class="plan-features">
            <li v-for="feature in plan.displayFeatures" :key="feature">
              <svg viewBox="0 0 20 20" fill="currentColor" class="feature-icon" :class="{ active: plan.key !== 'free' }">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/>
              </svg>
              <span v-html="feature"></span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 功能对比表 -->
      <div class="compare-section">
        <h3 class="compare-title">{{ $t('pricing.compareTitle') }}</h3>
        <div class="compare-table-wrap">
          <table class="compare-table">
            <thead>
              <tr>
                <th>{{ $t('pricing.compareFeature') }}</th>
                <th>{{ $t('pricing.plans.free.label') }}</th>
                <th>{{ $t('pricing.plans.basic.label') }}</th>
                <th class="highlight-col">{{ $t('pricing.plans.pro.label') }}</th>
                <th>{{ $t('pricing.plans.studio.label') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in compareRows" :key="row.label">
                <td class="row-label">{{ row.label }}</td>
                <td><span v-html="row.free"></span></td>
                <td><span v-html="row.basic"></span></td>
                <td class="highlight-col"><span v-html="row.pro"></span></td>
                <td><span v-html="row.studio"></span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 开通引导 -->
      <div class="activate-card">
        <div class="activate-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="activate-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          <div>
            <div class="activate-title">{{ $t('pricing.scanQr') }}</div>
            <div class="activate-desc">{{ $t('pricing.scanQrDesc') }}</div>
          </div>
        </div>
        <div class="qr-area">
          <img src="/wechat_code.webp" alt="WeChat QR Code" class="qr-image" />
        </div>
      </div>

    </div>
  </div>
</template>

<script>
const checkSvg = '<svg viewBox="0 0 20 20" fill="currentColor" style="width:12px;height:12px;color:#22c55e;flex-shrink:0"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>'
const crossSvg = '<svg viewBox="0 0 20 20" fill="currentColor" style="width:12px;height:12px;color:#d1d5db;flex-shrink:0"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/></svg>'

export default {
  name: 'PricingView',
  data() {
    return {
      isAnnual: true
    }
  },
  computed: {
    annualPlans() {
      const t = this.$t.bind(this)
      const tm = this.$tm.bind(this)
      return [
        {
          key: 'free',
          label: t('pricing.plans.free.label'),
          priceLabel: t('pricing.plans.free.price'),
          pricePeriod: t('pricing.plans.free.pricePeriod'),
          recommended: false,
          displayFeatures: tm('pricing.features.free')
        },
        {
          key: 'basic',
          label: t('pricing.plans.basic.label'),
          priceLabel: t('pricing.plans.basic.price'),
          pricePeriod: t('pricing.plans.basic.pricePeriod'),
          annualNote: t('pricing.plans.basic.annualNote'),
          recommended: false,
          displayFeatures: tm('pricing.features.basic')
        },
        {
          key: 'pro',
          label: t('pricing.plans.pro.label'),
          priceLabel: t('pricing.plans.pro.price'),
          pricePeriod: t('pricing.plans.pro.pricePeriod'),
          annualNote: t('pricing.plans.pro.annualNote'),
          recommended: true,
          displayFeatures: tm('pricing.features.pro')
        },
        {
          key: 'studio',
          label: t('pricing.plans.studio.label'),
          priceLabel: t('pricing.plans.studio.price'),
          pricePeriod: t('pricing.plans.studio.pricePeriod'),
          annualNote: t('pricing.plans.studio.annualNote'),
          recommended: false,
          displayFeatures: tm('pricing.features.studio')
        }
      ]
    },
    monthlyPlans() {
      const t = this.$t.bind(this)
      const tm = this.$tm.bind(this)
      return [
        {
          key: 'free',
          label: t('pricing.plans.free.label'),
          priceLabel: t('pricing.plans.free.price'),
          pricePeriod: t('pricing.plans.free.pricePeriod'),
          recommended: false,
          displayFeatures: tm('pricing.features.free')
        },
        {
          key: 'basic',
          label: t('pricing.plans.basic.label'),
          priceLabel: t('pricing.plans.basic.priceMonthly'),
          pricePeriod: t('pricing.plans.basic.pricePeriodMonthly'),
          recommended: false,
          displayFeatures: tm('pricing.features.basic')
        },
        {
          key: 'pro',
          label: t('pricing.plans.pro.label'),
          priceLabel: t('pricing.plans.pro.priceMonthly'),
          pricePeriod: t('pricing.plans.pro.pricePeriodMonthly'),
          recommended: true,
          displayFeatures: tm('pricing.features.pro')
        },
        {
          key: 'studio',
          label: t('pricing.plans.studio.label'),
          priceLabel: t('pricing.plans.studio.price'),
          pricePeriod: t('pricing.plans.studio.pricePeriod'),
          recommended: false,
          annualNote: t('pricing.plans.studio.annualOnly'),
          displayFeatures: tm('pricing.features.studio')
        }
      ]
    },
    currentPlans() {
      return this.isAnnual ? this.annualPlans : this.monthlyPlans
    },
    compareRows() {
      const t = this.$t.bind(this)
      return [
        { label: t('pricing.compare.monthlyAnalysis'), free: '1', basic: '15', pro: '50', studio: t('pricing.compare.unlimited') },
        { label: t('pricing.compare.storageLimit'), free: t('pricing.compare.freeStorage'), basic: t('pricing.compare.basicStorage'), pro: t('pricing.compare.proStorage'), studio: t('pricing.compare.studioStorage') },
        { label: t('pricing.compare.durationLimit'), free: t('pricing.compare.freeDuration'), basic: t('pricing.compare.basicDuration'), pro: t('pricing.compare.proDuration'), studio: t('pricing.compare.studioDuration') },
        { label: t('pricing.compare.dailyLimit'), free: '-', basic: '-', pro: '-', studio: t('pricing.compare.studioDaily') },
        { label: t('pricing.compare.localAI'), free: checkSvg, basic: checkSvg, pro: checkSvg, studio: checkSvg },
        { label: t('pricing.compare.trackSeparation'), free: crossSvg, basic: checkSvg, pro: checkSvg, studio: checkSvg },
        { label: t('pricing.compare.chordBeat'), free: crossSvg, basic: checkSvg, pro: checkSvg, studio: checkSvg },
        { label: t('pricing.compare.midiExport'), free: crossSvg, basic: crossSvg, pro: checkSvg, studio: checkSvg },
        { label: t('pricing.compare.apiAccess'), free: crossSvg, basic: crossSvg, pro: crossSvg, studio: checkSvg },
      ]
    }
  }
}
</script>

<style scoped>
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.back-btn:hover { background: rgba(0,0,0,0.05); color: #374151; }

/* 标题区 */
.header-section {
  text-align: center;
  padding: 24px 0 8px;
}
.header-title {
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.02em;
}
.header-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 8px 0 0;
}

/* 周期切换 */
.period-switch-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
}
.period-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}
.period-btn {
  padding: 6px 20px;
  border: 1.5px solid #e5e7eb;
  background: white;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.period-btn:first-child { border-radius: 8px 0 0 8px; }
.period-btn:last-child { border-radius: 0 8px 8px 0; border-left: none; }
.period-btn.active {
  background: #1e293b;
  color: white;
  border-color: #1e293b;
}
.period-save {
  font-size: 11px;
  font-weight: 600;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

/* 年付折合提示 */
.annual-note {
  font-size: 11px;
  color: #9ca3af;
  margin-top: -4px;
}

/* 套餐卡片 */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 28px;
}

.plan-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 14px;
  border-radius: 14px;
  background: white;
  border: 1.5px solid #f3f4f6;
  transition: border-color 0.15s;
}
.plan-card:hover { border-color: #e5e7eb; }
.plan-card.basic { border-color: #bfdbfe; background: #f8faff; }
.plan-card.pro { border-color: #fed7aa; background: #fffbf5; }
.plan-card.studio { border-color: #ddd6fe; background: #faf5ff; }

.plan-recommend {
  position: absolute;
  top: -1px;
  right: 16px;
  padding: 2px 10px;
  border-radius: 0 0 8px 8px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: white;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.plan-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  width: fit-content;
}
.plan-badge.free { background: rgba(34, 197, 94, 0.12); color: #166534; }
.plan-badge.basic { background: rgba(59, 130, 246, 0.12); color: #1e40af; }
.plan-badge.pro { background: rgba(245, 158, 11, 0.12); color: #92400e; }
.plan-badge.studio { background: rgba(139, 92, 246, 0.12); color: #5b21b6; }

.plan-price {
  display: flex;
  align-items: baseline;
  gap: 2px;
}
.price-amount { font-size: 24px; font-weight: 800; color: #1e293b; }
.price-period { font-size: 12px; color: #9ca3af; }

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}
.plan-features li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #4b5563;
  line-height: 1.4;
}
.plan-features li strong { color: #1e293b; }

.feature-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: #d1d5db;
}
.feature-icon.active { color: #f59e0b; }

/* 功能对比 */
.compare-section {
  margin-top: 28px;
}
.compare-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px;
}
.compare-table-wrap {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  background: white;
}
.compare-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.compare-table th,
.compare-table td {
  padding: 10px 14px;
  text-align: center;
  border-bottom: 1px solid #f3f4f6;
  white-space: nowrap;
  vertical-align: middle;
}
.compare-table td span {
  display: inline-flex;
  justify-content: center;
  align-items: center;
}
.compare-table th {
  font-weight: 600;
  color: #6b7280;
  background: #fafaf9;
  font-size: 11px;
}
.compare-table th:first-child,
.compare-table td:first-child {
  text-align: left;
  font-weight: 500;
  color: #374151;
}
.compare-table .row-label {
  color: #4b5563;
  font-weight: 500;
}
.compare-table .highlight-col {
  background: #fffbeb;
  font-weight: 600;
  color: #92400e;
}
.compare-table tbody tr:last-child td {
  border-bottom: none;
}

/* 开通引导 */
.activate-card {
  margin-top: 24px;
  padding: 28px 24px;
  border-radius: 16px;
  background: white;
  border: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.activate-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.activate-icon {
  width: 24px;
  height: 24px;
  color: #06b6d4;
  flex-shrink: 0;
  margin-top: 1px;
}
.activate-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}
.activate-desc {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
  line-height: 1.5;
}

.qr-area {
  display: flex;
  justify-content: center;
}
.qr-image {
  width: 200px;
  height: auto;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

/* 响应式 */
@media (max-width: 640px) {
  .plans-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 400px) {
  .plans-grid {
    grid-template-columns: 1fr;
  }
}
</style>
