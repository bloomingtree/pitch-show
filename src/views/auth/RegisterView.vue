<template>
  <div class="min-h-screen bg-gradient-to-br from-[#fcd34d] via-[#e7e5e4] to-[#fef9c3] flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-gradient-to-br from-[#6dd9d1] via-[#92400e] to-[#fca269] rounded-3xl p-8 shadow-2xl">
      <!-- Sound Wave Icon -->
      <div class="flex justify-center mb-8">
        <div class="flex items-end space-x-1">
          <div class="w-1 h-4 bg-white rounded-full"></div>
          <div class="w-1 h-6 bg-white rounded-full"></div>
          <div class="w-1 h-8 bg-white rounded-full"></div>
          <div class="w-1 h-6 bg-white rounded-full"></div>
          <div class="w-1 h-4 bg-white rounded-full"></div>
        </div>
      </div>

      <!-- Title -->
      <h1 class="text-white text-3xl font-bold text-center mb-8">
        注册
      </h1>

      <!-- Email Input -->
      <div class="mb-4">
        <div class="bg-yellow-100 rounded-2xl px-4 pt-3 shadow-lg">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
              <svg t="1750590236426" class="emailIcon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4301" width="200" height="200"><path d="M1023.999996 243.058404 1023.999996 192.457355C1023.999996 133.350934 976.054238 85.333333 916.910148 85.333333L5.333333 85.333333 5.333333 835.815684C5.333333 895.199398 53.279091 943.15789 112.423181 943.15789L1023.999996 943.15789 1023.999996 446.546103 1023.999996 298.302321 543.765807 562.266963C534.759245 567.206035 523.722317 566.564235 515.348943 560.614513L150.648242 301.475533C138.579558 292.900098 135.747719 276.164736 144.323152 264.096051 152.898585 252.027366 169.633949 249.195529 181.702633 257.770961L532.052621 507.75001C532.052621 507.75001 538.767125 504.064926 542.12438 502.222385 691.83606 420.056992 1008.43715 251.349911 1024 243.058402Z" fill="#ffffff" p-id="4302"></path></svg>
            </div>
            <input 
              v-model="form.email"
              type="email" 
              @blur="validateEmail"
              placeholder="后台通行证（电子邮箱）"
              class="flex-1 bg-transparent text-gray-700 placeholder-gray-500 outline-none text-sm"
            />
          </div>
          <p v-if="emailError" class="text-red-500 text-sm ml-2">{{ emailError }}</p>
          <div v-else  class="text-red-100 text-sm pt-4 pl-2"></div>
        </div>
        
      </div>
      <div class="mb-4">
        <div class="bg-yellow-100 rounded-2xl px-4 pt-3 shadow-lg">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
              <svg t="1750589365193" class="passwordIcon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1501" width="100" height="100"><path d="M817.152 957.44H207.36c-18.944 0-34.304-15.36-34.304-34.304V485.376c0-18.944 15.36-34.304 34.304-34.304h24.064V374.784c-0.512-8.192-1.024-16.896-1.024-25.6 0-155.648 126.464-282.112 282.112-282.112s282.112 126.464 282.112 282.112V450.56h23.04c18.944 0 34.304 15.36 34.304 34.304v437.248c0 19.968-15.36 35.328-34.816 35.328z m-322.048-226.304v79.36h34.304v-79.36c32.768-7.68 57.344-37.376 57.344-72.704 0-41.472-33.28-74.752-74.752-74.752s-74.752 33.28-74.752 74.752c0 34.816 25.088 64.512 57.856 72.704z m224.256-379.392v-2.048c0-114.688-92.672-207.36-207.36-207.36S305.152 235.008 305.152 349.696v101.376h414.72l-0.512-99.328z" fill="#ffffff" p-id="1502"></path></svg>
            </div>
            <input 
              v-model="form.password"
              @blur="validatePassword"
              :type="showPassword ? 'text' : 'password'"
              placeholder="输入秘密旋律"
              class="flex-1 bg-transparent text-gray-700 placeholder-gray-500 outline-none text-sm"
            />
          </div>
          <p v-if="passwordError" class="text-red-500 text-sm mt-1 ml-2">{{ passwordError }}</p>
          <div v-else  class="text-red-100 text-sm pt-4 pl-2"></div>
        </div>
        
      </div>

      <!-- Show Password Link -->
      <div class="text-right mb-6">
        <button 
          @click="showPassword = !showPassword"
          class="text-white text-sm opacity-80 hover:opacity-100 transition-opacity"
        >
          显示密码
        </button>
      </div>

      <button 
        @click="handleRegister"
        class="w-full bg-yellow-100 text-gray-800 font-semibold py-4 rounded-2xl mb-8 shadow-lg hover:bg-yellow-200 transition-colors text-lg"
      >
        注册
      </button>

      <!-- Helper Links -->
      <div class="flex flex-col items-center space-x-4 w-full">
        <button 
          @click="handleJoin"
          class="text-white text-sm opacity-80 hover:opacity-100 transition-opacity space-x-2"
        >
          <span class="font-bold">欢迎回来</span>
          <span>🎧</span>
        </button>
      </div>

      <!-- Bottom Sound Wave -->
      <div class="flex justify-center mt-8 space-x-1">
        <div class="w-1 h-2 bg-white opacity-60 rounded-full"></div>
        <div class="w-1 h-3 bg-white opacity-80 rounded-full"></div>
        <div class="w-1 h-4 bg-white rounded-full"></div>
        <div class="w-1 h-3 bg-white opacity-80 rounded-full"></div>
        <div class="w-1 h-2 bg-white opacity-60 rounded-full"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { push } from 'notivue'

const router = useRouter();
const form = ref({
  email: '',
  password: ''
});
const showPassword = ref(false);
const emailError = ref('');
const passwordError = ref('');

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!form.value.email) {
    emailError.value = '请输入电子邮箱';
  } else if (!emailRegex.test(form.value.email)) {
    emailError.value = '邮箱格式不正确';
  } else {
    emailError.value = '';
  }
};

const validatePassword = () => {
  if (!form.value.password) {
    passwordError.value = '请输入密码';
  } else if (form.value.password.length < 6) {
    passwordError.value = '密码至少需要6位';
  } else {
    passwordError.value = '';
  }
};

const handleRegister = async () => {
  validateEmail();
  validatePassword();
  
  if (emailError.value || passwordError.value) {
    return;
  }
  
  try {
    const response = await axios.post('/api/register', {
      email: form.value.email,
      password: form.value.password
    });
    if (response.data.success) {
      push.success({
        title: '注册成功，即将跳转',
        duration: 2000,
        onAutoClear() {
          router.push('/seperate');
        },
        onManualClear() {
          router.push('/seperate');
        }
      })
      
    } else {
      alert('登录失败: ' + response.data.message);
    }
  } catch (error) {
    console.error('登录失败:', error);
    alert('登录请求失败: ' + error.message);
  }
};

const handleJoin = () => {
  router.push('/login');
};
</script>
<style>
    .passwordIcon { 
      width: 65%;
    }
    .emailIcon {
      width: 50%;
    }
</style>