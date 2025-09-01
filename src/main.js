import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import songDB from './store/Song'
import { createNotivue } from 'notivue'
import 'notivue/notification.css'
import 'notivue/animations.css' 
import { createI18n } from 'vue-i18n'
import zh from '@/i18n/langs/zh.json'
import en from '@/i18n/langs/en.json'

const app = createApp(App)
const notivue = createNotivue()

app.use(router)
app.use(notivue)
const navLang = navigator.language;    //判断当前浏览器使用的语言
const i18n = createI18n({
    locale: localStorage.getItem('language') || navLang.split('-')[0] || 'zh',
    messages: {
        zh,
        en
    }
})  
app.use(i18n)
const res = songDB.init()
res.then(()=> {
    app.mount('#app')
})

