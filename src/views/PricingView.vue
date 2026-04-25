<template>
  <div class="min-h-screen py-8 px-4" style="background-color: #FAF6EE;">
    <div class="max-w-2xl mx-auto">

      <!-- 返回按钮 -->
      <button @click="$router.back()" class="back-btn">
        <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
          <path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/>
        </svg>
        返回
      </button>

      <!-- 标题区 -->
      <div class="header-section">
        <div class="header-badge">Pro</div>
        <h1 class="header-title">识音 Pro</h1>
        <p class="header-desc">解锁全部功能，让 AI 帮你听懂每一首歌</p>
      </div>

      <!-- 套餐对比 -->
      <div class="plans-grid">
        <!-- 免费版 -->
        <div class="plan-card">
          <div class="plan-badge free">免费版</div>
          <div class="plan-price">
            <span class="price-amount">¥0</span>
            <span class="price-period">/永久</span>
          </div>
          <ul class="plan-features">
            <li>
              <svg viewBox="0 0 20 20" fill="currentColor" class="feature-icon"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
              <span>5 首歌存储空间</span>
            </li>
            <li>
              <svg viewBox="0 0 20 20" fill="currentColor" class="feature-icon"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
              <span>每月 2 次 Pro 分析</span>
            </li>
            <li>
              <svg viewBox="0 0 20 20" fill="currentColor" class="feature-icon"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
              <span>本地 AI 音符检测</span>
            </li>
            <li>
              <svg viewBox="0 0 20 20" fill="currentColor" class="feature-icon"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
              <span>动态/平稳双色显示</span>
            </li>
          </ul>
        </div>

        <!-- Pro 版 -->
        <div class="plan-card pro">
          <div class="plan-recommend">推荐</div>
          <div class="plan-badge pro-badge">Pro</div>
          <div class="plan-price">
            <span class="price-amount">¥29</span>
            <span class="price-period">/月</span>
          </div>
          <ul class="plan-features">
            <li>
              <svg viewBox="0 0 20 20" fill="currentColor" class="feature-icon pro-check"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
              <span><strong>30 首</strong>歌存储空间</span>
            </li>
            <li>
              <svg viewBox="0 0 20 20" fill="currentColor" class="feature-icon pro-check"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
              <span><strong>无限次</strong> Pro 分析</span>
            </li>
            <li>
              <svg viewBox="0 0 20 20" fill="currentColor" class="feature-icon pro-check"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
              <span>AI 四轨分离（人声/贝斯/鼓/伴奏）</span>
            </li>
            <li>
              <svg viewBox="0 0 20 20" fill="currentColor" class="feature-icon pro-check"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
              <span>和弦 + 节拍检测</span>
            </li>
            <li>
              <svg viewBox="0 0 20 20" fill="currentColor" class="feature-icon pro-check"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
              <span>鼓件分类</span>
            </li>
            <li>
              <svg viewBox="0 0 20 20" fill="currentColor" class="feature-icon pro-check"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
              <span>多套配色方案</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 开通引导 -->
      <div class="activate-card">
        <div class="activate-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="activate-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          <div>
            <div class="activate-title">扫码添加微信开通</div>
            <div class="activate-desc">添加管理员微信，完成付款后即可立即开通 Pro 权限</div>
          </div>
        </div>
        <div class="qr-area">
          <!-- 二维码占位区域，后续替换为真实图片 -->
          <div class="qr-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="qr-placeholder-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
            <span>微信二维码</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  name: 'PricingView'
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
.header-badge {
  display: inline-block;
  padding: 3px 14px;
  border-radius: 20px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: white;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
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

/* 套餐对比 */
.plans-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 28px;
}

.plan-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 18px;
  border-radius: 16px;
  background: white;
  border: 1.5px solid #f3f4f6;
  transition: border-color 0.15s;
}
.plan-card:hover { border-color: #e5e7eb; }
.plan-card.pro {
  border-color: #fed7aa;
  background: #fffbf5;
}

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
.plan-badge.pro-badge { background: rgba(245, 158, 11, 0.12); color: #92400e; }

.plan-price {
  display: flex;
  align-items: baseline;
  gap: 2px;
}
.price-amount { font-size: 28px; font-weight: 800; color: #1e293b; }
.price-period { font-size: 13px; color: #9ca3af; }

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.plan-features li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #4b5563;
  line-height: 1.4;
}
.plan-features li strong { color: #1e293b; }

.feature-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #d1d5db;
}
.feature-icon.pro-check { color: #f59e0b; }

/* 开通引导 */
.activate-card {
  margin-top: 20px;
  padding: 20px;
  border-radius: 16px;
  background: white;
  border: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
.qr-placeholder {
  width: 160px;
  height: 160px;
  border-radius: 12px;
  border: 2px dashed #e5e7eb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #d1d5db;
}
.qr-placeholder-icon { width: 40px; height: 40px; }
.qr-placeholder span { font-size: 11px; color: #9ca3af; }

/* 响应式 */
@media (max-width: 480px) {
  .plans-grid {
    grid-template-columns: 1fr;
  }
}
</style>
