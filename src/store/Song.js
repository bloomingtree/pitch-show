import DateUtils from '@/utils/DateUtils'

const SQL_NAME = "pitch-show"
const DB_NAME = "song"
let request
let db

// 初始化数据库
function init() {
    return new Promise((resolve, reject) => {
      request = window.indexedDB.open(SQL_NAME);
      request.onerror = (event) => {
        reject(event)
      };
      request.onsuccess = (event) => {
        db = event.target.result
        let objectStore
        if (!db.objectStoreNames.contains(DB_NAME)) {
          // 创建数据库
          objectStore = db.createObjectStore(DB_NAME, {
            keyPath: "name",
            unique: true, // 使用name名称作为主键，且不允许重复
          })
          objectStore.createIndex("song", "song", { unique: false }) // 建立索引
          objectStore.createIndex("notes", "notes", { unique: false }) // 建立索引
          objectStore.createIndex("date", "date", { unique: false }) // 建立索引
        }
        resolve(event.target.result)
        db = event.target.result
      }
      request.onupgradeneeded = () => {
        
      }
    })
}
  
// add操作，添加数据
async function add(name, song, notes) {
    return new Promise((resolve, reject) => {
        const now = new Date()
        const dateStr = DateUtils.formatDate(now)
        const notesStr = JSON.stringify(notes)
        const select = db
        .transaction([DB_NAME], "readwrite")
        .objectStore(DB_NAME)
        .add({ name: name, song, notesStr, dateStr})

        select.onsuccess = (event) => {
        resolve(event.target.result)
    }
    select.onerror = reject
  })
}

async function get(name) {
    return new Promise((resolve, reject) => {
    const select = db
      .transaction([DB_NAME], "readonly")
      .objectStore(DB_NAME)
      .get(name)
  
    select.onsuccess = function () {
      resolve(select.result)
    }
    select.onerror = reject
  })
}

async function getAll() {
    return new Promise((resolve, reject) => {
      if(!db) {
        return
      }
    const select = db
      .transaction([DB_NAME], "readonly")
      .objectStore(DB_NAME)
      .getAll()
    select.onsuccess = function () {
      resolve(select.result)
    }
    select.onerror = reject
  })
}

// remove操作，删除数据
async function remove(name) {
    return new Promise((resolve, reject) => {
    const select = db
      .transaction([DB_NAME], "readwrite")
      .objectStore(DB_NAME)
      .delete(name)
  
    select.onsuccess = (event) => {
      resolve(event.target.result)
    }
    select.onerror = reject
  })
}

export default {
    init,
    get,
    getAll,
    add,
    remove
}