<template>
  <nav class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center h-16">
        <!-- Logo和品牌名称 -->
        <div class="flex items-center mr-8">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 flex items-center justify-center">
              <img src="/icon-192.png" alt="Logo" class="w-8 h-8 object-contain">
            </div>
            <span class="text-xl font-bold text-gray-800">{{ $t('navigationBar.name') }}</span>
            <span class="text-sm text-gray-500">{{ $t('navigationBar.nameDescription') }}</span>
          </div>
        </div>

        <!-- 导航链接 -->
        <div class="hidden md:flex items-center space-x-8 flex-1">
          <router-link
            to="/"
            class="nav-link"
            :class="{ 'active': $route.name === 'info' }"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            {{ $t('navigationBar.first') }}
          </router-link>

          <router-link
            to="/main"
            class="nav-link"
            :class="{ 'active': $route.name === 'main' }"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
            </svg>
            {{ $t('navigationBar.main') }}
          </router-link>

          <router-link
            to="/separate"
            class="nav-link"
            :class="{ 'active': $route.name === 'Separate' }"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            {{ $t('navigationBar.separate') }}
          </router-link>

          <router-link
            to="/about"
            class="nav-link"
            :class="{ 'active': $route.name === 'about' }"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ $t('navigationBar.about') }}
          </router-link>
        </div>

        <!-- 语言切换 -->
        <div class="flex items-center mr-4 cursor-pointer">
          <select class="nav-link" v-model="language" @change="changeLanguage">
            <option value="en" class="text-gray-600 px-2 py-2">English</option>
            <option value="zh" class="text-gray-600">中文</option>
            <option v-show="false" value="Language">Language</option>
          </select>
        </div>

        <!-- 用户菜单区域 -->
        <div class="flex items-center">
          <!-- 未登录状态 -->
          <!-- <div v-if="!isAuthenticated" class="flex items-center">
            <router-link
              to="/auth/login"
              class="px-4 py-2 bg-gradient-to-r from-[#fca269] to-[#fcd34d] text-gray-800 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              登录
            </router-link>
          </div> -->

          <!-- 已登录状态 -->
          <div v-if="isAuthenticated" class="relative">
            <button
              @click="toggleUserMenu"
              class="flex items-center space-x-2 px-3 py-2 rounded-2xl hover:bg-gray-100 transition-colors"
            >
              <div class="w-8 h-8 bg-gradient-to-br from-[#6dd9d1] to-[#fca269] rounded-full flex items-center justify-center">
                <span class="text-white text-sm font-bold">{{ userName.charAt(0) }}</span>
              </div>
              <span class="text-gray-700 font-medium">{{ userName }}</span>
            </button>

            <!-- 下拉菜单 -->
            <div v-if="showUserMenu" class="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl py-2 z-50">
              <router-link
                to="/user/profile"
                class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                @click="showUserMenu = false"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                个人资料
              </router-link>
              <button
                @click="handleLogout"
                class="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                退出登录
              </button>
            </div>
          </div>
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
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            {{ $t('navigationBar.separate') }}
          </router-link>

          <router-link
            to="/about"
            class="mobile-nav-link"
            :class="{ 'active': $route.name === 'about' }"
            @click="closeMobileMenu"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ $t('navigationBar.about') }}
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { useAuthStore } from '@/store/modules/auth'

export default {
  name: 'NavigationBar',
  data() {
    return {
      mobileMenuOpen: false,
      language: 'Language',
      showUserMenu: false
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
    }
  },
  methods: {
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen
    },
    closeMobileMenu() {
      this.mobileMenuOpen = false
    },
    changeLanguage() {
      this.$i18n.locale = this.language;
      localStorage.setItem('language', this.language);
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
    handleClickOutside(event) {
      if (!event.target.closest('.relative')) {
        this.showUserMenu = false
      }
    }
  },
  mounted() {
    this.language = localStorage.getItem('language') || 'Language';

    // 点击外部关闭用户菜单
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside)
  }
}
</script>

<style scoped>
.nav-link {
  @apply flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md transition-colors duration-200 hover:text-gray-900 hover:bg-gray-50;
}

.nav-link.active {
  @apply text-orange-600 bg-orange-50;
}

.mobile-nav-link {
  @apply flex items-center px-3 py-2 text-base font-medium text-gray-600 rounded-md transition-colors duration-200 hover:text-amber-900 hover:bg-amber-50;
}

.mobile-nav-link.active {
  @apply text-amber-600 bg-amber-50;
}
</style>
