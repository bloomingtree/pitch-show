import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../views/MainView.vue'
import InfoView from '../views/InfoView.vue'
import RegisterView from '@/views/auth/RegisterView.vue';
import LoginView from '@/views/auth/LoginView.vue';
import EmailLoginView from '@/views/auth/EmailLoginView.vue';
import SeparateView from '@/views/SeparateView.vue';
import TestView from '@/views/TestView.vue';
import ProfileView from '@/views/user/ProfileView.vue';
import { setupRouterGuard } from './guards'

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
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
      meta: {
        description: '关于音频音高分析工具的信息，采用Spotify开源技术Basic-Pitch，提供免费精准的音符识别服务'
      }
    // },{
    //   path: '/register',
    //   name: 'Register',
    //   component: RegisterView
    // },{
    //   path: '/login',
    //   name: 'Login',
    //   component: LoginView
    },
    {
      path: '/auth/login',
      name: 'login',
      component: EmailLoginView,
      meta: {
        title: '登录 - 识音',
        description: '使用邮箱验证码登录识音',
        guest: true
      }
    },
    {
      path: '/user/profile',
      name: 'userProfile',
      component: ProfileView,
      meta: {
        title: '个人资料 - 识音',
        description: '管理您的个人资料',
        requiresAuth: true
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
    // {
    //   path: '/test',
    //   name: 'Test',
    //   component: TestView
    // }
  ]
})

// 应用路由守卫
setupRouterGuard(router)

// Update meta tags on route change
router.afterEach((to) => {
  // Update page title
  const title = to.meta.title || '识音 - 免费AI扒谱神器 | 歌曲音高分析工具'
  document.title = title

  // Update meta description
  const description = to.meta.description || '免费音频音高分析工具，上传音频即可获取音符信息，采用Spotify Basic-Pitch技术'
  updateMetaTag('description', description)

  // Update Open Graph tags
  updateMetaTag('og:title', title)
  updateMetaTag('og:description', description)
  updateMetaTag('og:url', window.location.href)

  // Update Twitter Card tags
  updateMetaTag('twitter:title', title)
  updateMetaTag('twitter:description', description)

  // Update canonical URL
  updateCanonicalUrl(window.location.href)
})

// Helper function to update meta tags
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

// Helper function to update canonical URL
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

export default router
