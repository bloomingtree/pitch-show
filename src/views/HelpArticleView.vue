<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <!-- 返回按钮 -->
      <router-link
        to="/help"
        class="inline-flex items-center text-gray-500 hover:text-gray-700 mb-8 transition-colors text-sm"
      >
        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        {{ $t('helpView.backToHelp') }}
      </router-link>

      <!-- 文章内容 -->
      <article v-if="article" class="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <!-- 文章头部 -->
        <header class="px-6 sm:px-8 py-6 sm:py-8 border-b border-gray-100">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{{ article.title }}</h1>
          <div class="flex items-center text-sm text-gray-400">
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ $t('helpView.lastUpdated') }}: {{ article.lastUpdated }}
          </div>
        </header>

        <!-- 文章正文 -->
        <div class="px-6 sm:px-8 py-6 sm:py-8 article-content">
          <component :is="article.component" />
        </div>
      </article>

      <!-- 文章不存在 -->
      <div v-else class="text-center py-16">
        <p class="text-gray-400 mb-4">{{ $t('helpView.noResults') }}</p>
        <router-link to="/help" class="text-blue-600 hover:text-blue-700 text-sm">
          {{ $t('helpView.backToHelp') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: 'HelpArticleView',
  data() {
    return {
      articles: {
        'gpu-rendering': {
          slug: 'gpu-rendering',
          titleKey: 'helpView.articles.gpu-rendering.title',
          lastUpdated: '2026-03-14',
          component: defineAsyncComponent(() => import('@/components/help/GpuRenderingArticle.vue'))
        },
        'developer-note': {
          slug: 'developer-note',
          titleKey: 'helpView.articles.developer-note.title',
          lastUpdated: '2026-03-15',
          component: defineAsyncComponent(() => import('@/components/help/DeveloperNoteArticle.vue'))
        }
      }
    }
  },
  computed: {
    article() {
      const slug = this.$route.params.slug
      const articleData = this.articles[slug]
      if (!articleData) return null

      return {
        ...articleData,
        title: this.$t(articleData.titleKey)
      }
    }
  },
  watch: {
    '$route.params.slug': {
      immediate: true,
      handler(slug) {
        if (slug && this.articles[slug]) {
          document.title = `${this.$t(this.articles[slug].titleKey)} - 识音帮助中心`
        }
      }
    }
  }
}
</script>

<style scoped>
.article-content {
  @apply text-gray-700 leading-relaxed;
}

.article-content :deep(h2) {
  @apply text-xl font-semibold text-gray-900 mt-8 mb-4 first:mt-0;
}

.article-content :deep(h3) {
  @apply text-lg font-medium text-gray-900 mt-6 mb-3;
}

.article-content :deep(h4) {
  @apply text-base font-medium text-gray-800 mt-4 mb-2;
}

.article-content :deep(p) {
  @apply mb-4 text-gray-600 leading-7;
}

.article-content :deep(ul) {
  @apply list-disc list-inside mb-4 space-y-1.5 text-gray-600;
}

.article-content :deep(ol) {
  @apply list-decimal list-inside mb-4 space-y-2 text-gray-600;
}

.article-content :deep(li) {
  @apply pl-1;
}

.article-content :deep(li ul) {
  @apply mt-2 ml-2;
}

.article-content :deep(code) {
  @apply px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-sm font-mono;
}

.article-content :deep(kbd) {
  @apply px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono border border-gray-200 shadow-sm;
}

.article-content :deep(strong) {
  @apply font-semibold text-gray-800;
}

/* 提示框样式 - 更清新简洁 */
.article-content :deep(.note) {
  @apply bg-slate-50 border-l-4 border-slate-400 p-4 my-4 rounded-r-lg;
}

.article-content :deep(.note-title) {
  @apply font-medium text-slate-700 mb-1 text-sm;
}

.article-content :deep(.note-content) {
  @apply text-slate-600 text-sm leading-relaxed;
}

.article-content :deep(.tip) {
  @apply bg-emerald-50 border-l-4 border-emerald-400 p-4 my-4 rounded-r-lg;
}

.article-content :deep(.tip-title) {
  @apply font-medium text-emerald-700 mb-1 text-sm;
}

.article-content :deep(.tip-content) {
  @apply text-emerald-600 text-sm leading-relaxed;
}

.article-content :deep(.warning) {
  @apply bg-amber-50 border-l-4 border-amber-400 p-4 my-4 rounded-r-lg;
}

.article-content :deep(.warning-title) {
  @apply font-medium text-amber-700 mb-1 text-sm;
}

.article-content :deep(.warning-content) {
  @apply text-amber-600 text-sm leading-relaxed;
}

/* 截图样式 */
.article-content :deep(img.screenshot) {
  @apply rounded-lg border border-gray-200 my-6 w-full shadow-sm;
}
</style>
