import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import songDB from './store/Song'
import { createNotivue } from 'notivue'
import 'notivue/notification.css'
import 'notivue/animations.css' 

const app = createApp(App)
const notivue = createNotivue()

app.use(router)
app.use(notivue)
const res = songDB.init()
res.then(()=> {
    app.mount('#app')
})

