import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../views/MainView.vue'
import InfoView from '../views/InfoView.vue'
import SeparateView from '../views/SeparateView.vue'
import ProfileView from '@/views/user/ProfileView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'info',
      component: InfoView,
      meta: {
        description: '免费音频音高分析工具，上传音频即可获取音符信息，采用Spotify Basic-Pitch技术，操作简单精准'
      }
    },
    {
      path: '/main',
      name: 'main',
      component: MainView,
      meta: {
        description: '专业音频音高分析工具，上传音频文件进行音符检测和音乐分析，支持本地处理'
      }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: {
        description: '关于音频音高分析工具的信息，采用Spotify开源技术Basic-Pitch，提供免费精准的音符识别服务'
      }
    },
    {
      path: '/user/profile',
      name: 'userProfile',
      component: ProfileView,
      meta: {
        title: '个人资料 - 识音',
        description: '管理您的个人资料'
      }
    },
    {
      path: '/pricing',
      name: 'pricing',
      component: () => import('../views/PricingView.vue'),
      meta: {
        title: '升级 Pro - 识音'
      }
    },
    {
      path: '/separate',
      name: 'Separate',
      component: SeparateView,
      meta: {
        title: 'AI音频分离 - 识音',
        description: 'AI本地音频分离工具，支持人声与伴奏分离，基于Demucs技术，100%本地处理，保护隐私安全'
      }
    },
    {
      path: '/help',
      name: 'help',
      component: () => import('../views/HelpView.vue'),
      meta: {
        title: '帮助中心 - 识音',
        description: '识音使用帮助和常见问题解答'
      }
    },
    {
      path: '/help/:slug',
      name: 'helpArticle',
      component: () => import('../views/HelpArticleView.vue'),
      meta: {
        description: '识音帮助文章'
      }
    }
  ]
})

// Update meta tags on route change
router.afterEach((to) => {
  const title = to.meta.title || '识音 - 免费AI扒谱神器 | 歌曲音高分析工具'
  document.title = title

  const description = to.meta.description || '免费音频音高分析工具，上传音频即可获取音符信息，采用Spotify Basic-Pitch技术'
  updateMetaTag('description', description)

  updateMetaTag('og:title', title)
  updateMetaTag('og:description', description)
  updateMetaTag('og:url', window.location.href)

  updateMetaTag('twitter:title', title)
  updateMetaTag('twitter:description', description)

  updateCanonicalUrl(window.location.href)

  updateHreflangTags(to.path)
})

function updateMetaTag(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`) ||
             document.querySelector(`meta[property="${name}"]`)

  if (meta) {
    meta.setAttribute('content', content)
  } else {
    meta = document.createElement('meta')
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      meta.setAttribute('property', name)
    } else {
      meta.setAttribute('name', name)
    }
    meta.setAttribute('content', content)
    document.head.appendChild(meta)
  }
}

function updateCanonicalUrl(url) {
  let canonical = document.querySelector('link[rel="canonical"]')
  if (canonical) {
    canonical.setAttribute('href', url)
  } else {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    canonical.setAttribute('href', url)
    document.head.appendChild(canonical)
  }
}

function updateHreflangTags(path) {
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove())

  const intlDomain = 'https://pitch.shiyin.cyou'
  const cnDomain = 'https://shiyin.notalabs.cn'

  const hreflangTags = [
    { hreflang: 'zh-CN', href: `${cnDomain}${path}` },
    { hreflang: 'en', href: `${intlDomain}${path}` },
    { hreflang: 'x-default', href: `${intlDomain}${path}` }
  ]

  hreflangTags.forEach(({ hreflang, href }) => {
    const link = document.createElement('link')
    link.setAttribute('rel', 'alternate')
    link.setAttribute('hreflang', hreflang)
    link.setAttribute('href', href)
    document.head.appendChild(link)
  })
}

export default router
