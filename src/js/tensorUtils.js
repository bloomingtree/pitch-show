import * as tf from '@tensorflow/tfjs';

/**
 * 打开或创建 IndexedDB 数据库
 * @returns {Promise<IDBDatabase>}
 */
function openTensorDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('TensorDB', 1);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('tensors')) {
                db.createObjectStore('tensors', { keyPath: 'name' });
            }
        };
        
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * 将 Tensor 保存到 IndexedDB
 * @param {tf.Tensor} tensor - 要保存的 Tensor
 * @param {string} name - 存储名称
 */
async function saveTensorToIndexedDB(tensor, name) {
    const data = await tensor.array();
    const tensorData = {
        name,
        data,
        shape: tensor.shape,
        dtype: tensor.dtype,
        timestamp: Date.now()
    };
    
    const db = await openTensorDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('tensors', 'readwrite');
        const store = transaction.objectStore('tensors');
        
        const request = store.put(tensorData);
        
        request.onsuccess = () => {
            console.log(`Tensor saved to IndexedDB with name "${name}"`);
            resolve();
        };
        
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * 从 IndexedDB 加载 Tensor
 * @param {string} name - 存储名称
 * @returns {Promise<tf.Tensor>}
 */
async function loadTensorFromIndexedDB(name) {
    const db = await openTensorDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('tensors', 'readonly');
        const store = transaction.objectStore('tensors');
        
        const request = store.get(name);
        
        request.onsuccess = (event) => {
            const tensorData = event.target.result;
            if (!tensorData) {
                reject(new Error(`No tensor found with name "${name}"`));
                return;
            }
            
            const tensor = tf.tensor(tensorData.data, tensorData.shape, tensorData.dtype);
            console.log(`Tensor loaded from IndexedDB with name "${name}"`);
            resolve(tensor);
        };
        
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * 将 paddedMix 格式的数据转换为 TensorFlow.js Tensor
 * @param {Object} tensorData - paddedMix 格式的数据
 * @returns {tf.Tensor}
 */
function convertToTFTensor(tensorData) {
    if (!tensorData.cpuData || !tensorData.dims) {
        throw new Error('Invalid tensor data format');
    }
    
    // 确保数据是 Float32Array
    const data = tensorData.cpuData instanceof Float32Array 
        ? tensorData.cpuData 
        : new Float32Array(tensorData.cpuData);
    
    // 创建 Tensor
    return tf.tensor(data, tensorData.dims, tensorData.type);
}

/**
 * 将 TensorFlow.js Tensor 转换为 paddedMix 格式
 * @param {tf.Tensor} tensor - TensorFlow.js Tensor
 * @returns {Promise<Object>} paddedMix 格式的数据
 */
async function convertFromTFTensor(tensor) {
    const cpuData = await tensor.data();
    
    return {
        cpuData: cpuData,
        dataLocation: 'cpu',
        dims: tensor.shape,
        size: tensor.size,
        type: tensor.dtype
    };
}

export {
    loadTensorFromIndexedDB,
    saveTensorToIndexedDB,
    convertFromTFTensor,
    convertToTFTensor
}