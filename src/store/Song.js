import DateUtils from '@/utils/DateUtils'

const SQL_NAME = "pitch-show"
const DB_NAME = "song"
let request
let db

// 初始化数据库
function init() {
    return new Promise((resolve, reject) => {
      request = window.indexedDB.open(SQL_NAME,2);
      request.onerror = (event) => {
        reject(event)
      };
      request.onupgradeneeded = (event) => {
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

      request.onsuccess = (event) => {
        db = event.target.result
        resolve(event.target.result)
      }
    })
}
  
// add操作，添加数据（重名时自动加序号）
async function add(name, song, notes, proMeta = null) {
    return new Promise((resolve, reject) => {
        const now = new Date()
        const dateStr = DateUtils.formatDate(now)
        const notesStr = JSON.stringify(notes)
        const proMetaStr = proMeta ? JSON.stringify(proMeta) : null
        // 重名检测：查找不重复的名称
        findAvailableName(name).then(uniqueName => {
            const select = db
            .transaction([DB_NAME], "readwrite")
            .objectStore(DB_NAME)
            .add({ name: uniqueName, song, notesStr, proMetaStr, dateStr, originalName: name })

            select.onsuccess = (event) => {
            resolve(event.target.result)
        }
        select.onerror = reject
        }).catch(reject)
    })
}

// 查找可用的不重复名称，重名时加序号如 (2) (3)
async function findAvailableName(name) {
    // 先尝试原始名称
    const existing = await get(name)
    if (!existing) return name

    // 名称已被占用，递增序号查找
    let seq = 2
    while (true) {
        const candidate = `${name} (${seq})`
        const exists = await get(candidate)
        if (!exists) return candidate
        seq++
    }
}

// put操作，更新或添加数据（如果存在则覆盖）
async function put(name, song, notes, proMeta = null) {
    return new Promise((resolve, reject) => {
        const now = new Date()
        const dateStr = DateUtils.formatDate(now)
        const notesStr = JSON.stringify(notes)
        const proMetaStr = proMeta ? JSON.stringify(proMeta) : null
        const select = db
        .transaction([DB_NAME], "readwrite")
        .objectStore(DB_NAME)
        .put({ name, song, notesStr, proMetaStr, dateStr })

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