import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../views/MainView.vue'
import InfoView from '../views/InfoView.vue'
import RegisterView from '@/views/auth/RegisterView.vue';
import LoginView from '@/views/auth/LoginView.vue';

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
    },{
      path: '/register',
      name: 'Register',
      component: RegisterView
    },{
      path: '/login',
      name: 'Login',
      component: LoginView
    }
  ]
})

// Update meta tags on route change
router.afterEach((to) => {
  // Update page title
  document.title = to.meta.title || '识音~免费AI扒谱神器 歌曲音高分析工具'

  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription) {
    metaDescription.setAttribute('content', to.meta.description ||
      '免费音频音高分析工具，上传音频即可获取音符信息，采用Spotify Basic-Pitch技术')
  } else {
    const meta = document.createElement('meta')
    meta.name = 'description'
    meta.content = to.meta.description ||
      '免费音频音高分析工具，上传音频即可获取音符信息，采用Spotify Basic-Pitch技术'
    document.head.appendChild(meta)
  }
})

export default router
