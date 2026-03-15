<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <!-- 页面标题 -->
      <header class="mb-10">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ $t('helpView.title') }}</h1>
        <p class="text-gray-500">{{ $t('helpView.subtitle') }}</p>
      </header>

      <!-- 搜索框 -->
      <div class="mb-8">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('helpView.searchPlaceholder')"
            class="w-full px-4 py-3 pl-11 text-base border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
          <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
      </div>

      <!-- 文章列表 -->
      <section>
        <h2 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">{{ $t('helpView.allArticles') }}</h2>

        <div v-if="filteredArticles.length === 0" class="text-center py-12">
          <p class="text-gray-400">{{ $t('helpView.noResults') }}</p>
        </div>

        <div v-else class="space-y-3">
          <router-link
            v-for="article in filteredArticles"
            :key="article.slug"
            :to="`/help/${article.slug}`"
            class="block bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 hover:shadow-sm transition-all duration-150"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <h3 class="text-base font-medium text-gray-900 mb-1">{{ article.title }}</h3>
                <p class="text-sm text-gray-500 truncate">{{ article.description }}</p>
              </div>
              <svg class="flex-shrink-0 w-5 h-5 text-gray-300 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelpView',
  data() {
    return {
      searchQuery: '',
      articles: [
        {
          slug: 'gpu-rendering',
          titleKey: 'helpView.articles.gpu-rendering.title',
          descriptionKey: 'helpView.articles.gpu-rendering.description',
          lastUpdated: '2026-03-14'
        },
        {
          slug: 'developer-note',
          titleKey: 'helpView.articles.developer-note.title',
          descriptionKey: 'helpView.articles.developer-note.description',
          lastUpdated: '2026-03-15'
        }
      ]
    }
  },
  computed: {
    filteredArticles() {
      if (!this.searchQuery.trim()) {
        return this.articles.map(article => ({
          ...article,
          title: this.$t(article.titleKey),
          description: this.$t(article.descriptionKey)
        }))
      }

      const query = this.searchQuery.toLowerCase()
      return this.articles
        .map(article => ({
          ...article,
          title: this.$t(article.titleKey),
          description: this.$t(article.descriptionKey)
        }))
        .filter(article =>
          article.title.toLowerCase().includes(query) ||
          article.description.toLowerCase().includes(query)
        )
    }
  }
}
</script>
