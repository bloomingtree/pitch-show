<template>
  <nav class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center h-12">
        <!-- Logo和品牌名称 -->
        <router-link to="/" class="flex items-center mr-6 cursor-pointer">
          <div class="flex items-center space-x-2">
            <div class="w-6 h-6 flex items-center justify-center">
              <img src="/icon-192.png" alt="Logo" class="w-6 h-6 object-contain">
            </div>
            <span class="text-lg font-bold text-gray-800">{{ $t('navigationBar.name') }}</span>
            <span class="text-xs text-gray-500 hidden sm:inline">{{ $t('navigationBar.nameDescription') }}</span>
          </div>
        </router-link>

        <!-- 导航链接 -->
        <div class="hidden md:flex items-center space-x-6 flex-1">
          <router-link
            to="/"
            class="nav-link"
            :class="{ 'active': $route.name === 'info' }"
          >
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            {{ $t('navigationBar.first') }}
          </router-link>

          <router-link
            to="/main"
            class="nav-link"
            :class="{ 'active': $route.name === 'main' }"
          >
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
            </svg>
            {{ $t('navigationBar.main') }}
          </router-link>

          <router-link
            to="/separate"
            class="nav-link"
            :class="{ 'active': $route.name === 'Separate' }"
          >
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            {{ $t('navigationBar.separate') }}
          </router-link>

          <router-link
            to="/pricing"
            class="nav-link"
            :class="{ 'active': $route.name === 'pricing' }"
          >
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ $t('navigationBar.pricing') }}
          </router-link>

          <a
            href="https://notalabs.cn"
            target="_blank"
            class="nav-link"
          >
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ $t('navigationBar.about') }}
          </a>

          <router-link
            to="/help"
            class="nav-link"
            :class="{ 'active': $route.name === 'help' }"
          >
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ $t('navigationBar.help') }}
          </router-link>
        </div>

        <!-- 语言切换 -->
        <div class="relative" ref="langDropdown">
          <button
            @click="toggleLangMenu"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
            </svg>
            <span>{{ currentLangLabel }}</span>
            <svg class="w-3.5 h-3.5 transition-transform ml-1" :class="{ 'rotate-180': showLangMenu }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <!-- 下拉菜单 -->
          <div v-if="showLangMenu" class="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-xl py-1.5 z-50 border border-gray-100">
            <button
              @click="selectLanguage('zh')"
              class="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              :class="{ 'text-orange-600 bg-orange-50': language === 'zh' }"
            >
              <span class="mr-2">🇨🇳</span>
              中文
              <svg v-if="language === 'zh'" class="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </button>
            <button
              @click="selectLanguage('en')"
              class="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              :class="{ 'text-orange-600 bg-orange-50': language === 'en' }"
            >
              <span class="mr-2">🇺🇸</span>
              English
              <svg v-if="language === 'en'" class="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 用户菜单区域 -->
        <div class="flex items-center ml-2">
          <!-- 已登录状态 -->
          <div v-if="isAuthenticated" class="relative">
            <button
              @click="toggleUserMenu"
              class="flex items-center space-x-1.5 px-2 py-1 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div class="w-6 h-6 bg-gradient-to-br from-[#6dd9d1] to-[#fca269] rounded-full flex items-center justify-center">
                <span class="text-white text-xs font-bold">{{ userName.charAt(0) }}</span>
              </div>
              <span class="text-gray-700 text-sm font-medium">{{ userName }}</span>
            </button>

            <!-- 下拉菜单 -->
            <div v-if="showUserMenu" class="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl py-2 z-50">
              <router-link
                to="/user/profile"
                class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                @click="showUserMenu = false"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                个人资料
              </router-link>
              <button
                @click="handleLogout"
                class="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                退出登录
              </button>
            </div>
          </div>
          <!-- 未登录状态 -->
          <button v-else @click="showLoginDialog = true" class="login-btn">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
            </svg>
            {{ $t('navigationBar.login') }}
          </button>
        </div>

        <!-- 移动端菜单按钮 -->
        <div class="md:hidden flex items-center ml-auto">
          <button
            @click="toggleMobileMenu"
            class="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 移动端菜单 -->
      <div v-show="mobileMenuOpen" class="md:hidden">
        <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
          <router-link
            to="/"
            class="mobile-nav-link"
            :class="{ 'active': $route.name === 'info' }"
            @click="closeMobileMenu"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            {{ $t('navigationBar.first') }}
          </router-link>

          <router-link
            to="/main"
            class="mobile-nav-link"
            :class="{ 'active': $route.name === 'main' }"
            @click="closeMobileMenu"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
            </svg>
            {{ $t('navigationBar.main') }}
          </router-link>

          <router-link
            to="/separate"
            class="mobile-nav-link"
            :class="{ 'active': $route.name === 'Separate' }"
            @click="closeMobileMenu"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            {{ $t('navigationBar.separate') }}
          </router-link>

          <router-link
            to="/pricing"
            class="mobile-nav-link"
            :class="{ 'active': $route.name === 'pricing' }"
            @click="closeMobileMenu"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ $t('navigationBar.pricing') }}
          </router-link>

          <router-link
            to="/about"
            class="mobile-nav-link"
            :class="{ 'active': $route.name === 'about' }"
            @click="closeMobileMenu"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ $t('navigationBar.about') }}
          </router-link>

          <router-link
            to="/help"
            class="mobile-nav-link"
            :class="{ 'active': $route.name === 'help' }"
            @click="closeMobileMenu"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ $t('navigationBar.help') }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- 登录弹窗 -->
    <LoginDialog
      :show="showLoginDialog"
      @close="showLoginDialog = false"
      @loggedIn="onLoginSuccess"
    />
  </nav>
</template>

<script>
import { useAuthStore } from '@/store/modules/auth'
import { loadConfig, saveConfig } from '@/js/configManager.js'
import LoginDialog from '@/components/LoginDialog.vue'

export default {
  name: 'NavigationBar',
  components: { LoginDialog },
  data() {
    return {
      mobileMenuOpen: false,
      language: 'zh',
      showUserMenu: false,
      showLangMenu: false,
      showLoginDialog: false
    }
  },
  computed: {
    isAuthenticated() {
      const authStore = useAuthStore()
      return authStore.isAuthenticated
    },
    userName() {
      const authStore = useAuthStore()
      return authStore.userName
    },
    currentLangLabel() {
      return this.language === 'zh' ? '中文' : 'EN'
    }
  },
  methods: {
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen
    },
    closeMobileMenu() {
      this.mobileMenuOpen = false
    },
    toggleLangMenu() {
      this.showLangMenu = !this.showLangMenu
    },
    selectLanguage(lang) {
      this.language = lang
      this.$i18n.locale = lang
      // 保存到配置
      const config = loadConfig()
      config.language = lang
      saveConfig(config)
      this.showLangMenu = false
    },
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu
    },
    async handleLogout() {
      const authStore = useAuthStore()
      await authStore.logout()
      this.showUserMenu = false
      this.$router.push('/')
    },
    onLoginSuccess(user) {
      this.showLoginDialog = false
      useAuthStore().setUser(user)
    },
    handleClickOutside(event) {
      // 关闭用户菜单
      if (!event.target.closest('.relative')) {
        this.showUserMenu = false
      }
      // 关闭语言菜单
      if (this.$refs.langDropdown && !this.$refs.langDropdown.contains(event.target)) {
        this.showLangMenu = false
      }
    }
  },
  mounted() {
    // 从配置加载语言设置
    const config = loadConfig()
    this.language = config.language || 'zh'

    // 点击外部关闭菜单
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside)
  }
}
</script>

<style scoped>
.nav-link {
  @apply flex items-center px-2.5 py-1.5 text-sm font-medium text-gray-600 rounded-md transition-colors duration-200 hover:text-gray-900 hover:bg-gray-50;
}

.nav-link.active {
  @apply text-orange-600 bg-orange-50;
}

.mobile-nav-link {
  @apply flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md transition-colors duration-200 hover:text-amber-900 hover:bg-amber-50;
}

.mobile-nav-link.active {
  @apply text-amber-600 bg-amber-50;
}

.login-btn {
  display: inline-flex;
  align-items: center;
  padding: 4px 14px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: white;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.login-btn:hover { opacity: 0.9; transform: scale(1.02); }
.login-btn:active { transform: scale(0.97); }
</style>
