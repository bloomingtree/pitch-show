import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import songDB from './store/Song'

const app = createApp(App)

app.use(router)

const res = songDB.init()
res.then(()=> {
    app.mount('#app')
})

