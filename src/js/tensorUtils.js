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
 * 将包含 Tensor 的数组保存到 IndexedDB
 * @param {Array<{future: tf.Tensor, offset: number}>} array - 要保存的数组
 * @param {string} name - 存储名称
 */
async function saveTensorArrayToIndexedDB(array, name) {
    const db = await openTensorDatabase();

    const storageArray = await Promise.all(array.map(async (item) => {
        const tensor = item.future;
        const arrayData = await tensor.array();
        return {
            type: 'TensorWrapper',
            data: arrayData,
            shape: tensor.shape,
            dtype: tensor.dtype,
            offset: item.offset
        };
    }));

    const storeData = {
        name,
        type: 'TensorArray',
        data: storageArray,
        timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction('tensors', 'readwrite');
        const store = transaction.objectStore('tensors');
        const request = store.put(storeData);

        request.onsuccess = () => {
            console.log(`Tensor array saved to IndexedDB with name "${name}"`);
            resolve();
        };

        request.onerror = (event) => {
            console.error(`Failed to save tensor array to IndexedDB:`, event.target.error);
            reject(event.target.error);
        };
    });
}
/**
 * 从 IndexedDB 加载包含 Tensor 的数组
 * @param {string} name - 存储名称
 * @returns {Promise<Array<{future: tf.Tensor, offset: number}> | null>}
 */
async function loadTensorArrayFromIndexedDB(name) {
    const db = await openTensorDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction('tensors', 'readonly');
        const store = transaction.objectStore('tensors');
        const request = store.get(name); // 假设 name 是主键

        request.onsuccess = (event) => {
            const storedData = event.target.result;

            if (!storedData || storedData.type !== 'TensorArray') {
                console.warn(`No tensor array found in IndexedDB with name "${name}"`);
                return resolve(null);
            }

            const { data: storageArray } = storedData;

            const resultArray = storageArray.map(item => {
                const { data, shape, dtype, offset } = item;
                const tensor = tf.tensor(data, shape, dtype);
                return {
                    future: tensor,
                    offset
                };
            });

            resolve(resultArray);
        };

        request.onerror = (event) => {
            console.error(`Failed to load tensor array from IndexedDB:`, event.target.error);
            reject(event.target.error);
        };
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
    saveTensorArrayToIndexedDB,
    loadTensorArrayFromIndexedDB,
    convertFromTFTensor,
    convertToTFTensor
}