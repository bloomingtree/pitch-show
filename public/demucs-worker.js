// 在文件顶部添加Tensor导入
import { InferenceSession, Tensor } from 'onnxruntime-web';
import * as ort from 'onnxruntime-web';
import * as tf from '@tensorflow/tfjs';
import { default as FFT } from 'fft.js';

let modelSession
let inputTensor
let refMean
let refStd
const target_sr = 44100

// 监听主线程消息
self.onmessage = async (event) => {
    const { command, data, id } = event.data;
    
    try {
      switch (command) {
        case 'loadModel':
          await loadONNXModel(data.modelPath);
          self.postMessage({ id, status: 'model_loaded' });
          break;
          
        case 'loadAudio':
          loadAudio(data.inputTensor, data.refMean, data.refStd);
          self.postMessage({ id, status: 'audio_loaded' });
          break;
          
        case 'applyModel':
          const outData = await applyModel();
          self.postMessage({
            id,
            status: 'complete',
            result: outData
          });
          break;
          
        default:
          throw new Error(`未知命令: ${command}`);
      }
    } catch (error) {
      self.postMessage({ id, status: 'error', error: error.message });
    }
  };
  

async function loadONNXModel(modelPath) {
    try {
        // 添加跨域和MIME类型配置
        const response = await fetch(modelPath, {
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/octet-stream'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        // 显式转换为ArrayBuffer
        const modelBuffer = await response.arrayBuffer();
        
        // 创建推理会话
        const session = await InferenceSession.create(modelBuffer, {
            executionProviders: ['webgpu', 'webgl', 'wasm'],
            graphOptimizationLevel: 'all',
            executionMode: 'parallel',
            wasm: {
                worker: true
            }
        });
        
        modelSession = session
    } catch (error) {
        console.error('Failed to load ONNX model:', error);
        throw new Error(`模型加载失败: ${error.message}`);
    }
}

function loadAudio(tensor, mean, std) {
    refMean = mean;
    refStd = std;
    inputTensor = tensor;
}

function padChunk(tensor, offset, length, targetLength) {
    // 解构张量属性
    const { cpuData, dims, type } = tensor;
    const data = cpuData
    const totalLength = dims[dims.length - 1]; // 最后一维是时间轴长度
    
    // 1. 计算填充参数
    const delta = targetLength - length;
    const start = offset - Math.floor(delta / 2);
    const end = start + targetLength;
    
    // 2. 计算实际可截取的范围（防止越界）
    const correctStart = Math.max(0, start);
    const correctEnd = Math.min(totalLength, end);
    
    // 4. 计算新张量的形状
    const newDims = [...dims];
    newDims[newDims.length - 1] = targetLength; // 最后一维更新为目标长度
    const totalSize = newDims.reduce((a, b) => a !== 0 ? a * b : b, 0);
    
    // 5. 创建新数据数组（初始化为0）
    const newData = new Float32Array(totalSize);
    
    const segment = data.subarray(2*correctStart, 2*correctEnd);
    newData.set(segment, 0);
    // 8. 返回新的 ORT 格式张量
    return {
        cpuData: newData,
        data: newData,
        dims: newDims,
        type: type,
        size: totalSize,
        dataLocation: "cpu"
    };
}
// 修改applyModel函数中的分块处理部分
async function applyModel() {
    const mixTensor = inputTensor;
    const overlap = 0.25
    const transitionPower = 1
    const samplerate = 44100;
    const segment = 5;
    const lenModelSources = 4;
    const [batch, channels, length] = mixTensor.dims;
    // 计算分块参数
    const segmentLength = Math.floor(samplerate * segment);
    const stride = Math.floor((1 - overlap) * segmentLength);
    

    // 创建权重窗口
    const weight = new Float32Array(segmentLength);
    let maxWeight = 0; // 改为边填充边计算最大值
    const half = Math.floor(segmentLength / 2);
    for (let i = 0; i < half; i++) {
        weight[i] = (i + 1) / half;
        maxWeight = Math.max(maxWeight, weight[i]);
    }
    for (let i = half; i < segmentLength; i++) {
        weight[i] = (segmentLength - i) / half;
        maxWeight = Math.max(maxWeight, weight[i]);
    }
    // 移除原来的Math.max(...weight)

    for (let i = 0; i < weight.length; i++) {
        weight[i] = Math.pow(weight[i] / maxWeight, transitionPower);
    }
    let futures = []
    const targetLength = Math.floor(segment * samplerate)
    // 分块处理
    for (let offset = 0; offset < length; offset += stride) {
        console.log(offset, length)
        const chunkStart = offset;
        const chunkEnd = Math.min(offset + segmentLength, length);
        const chunkLength = chunkEnd - chunkStart;
        const chunkTensor = padChunk(mixTensor, chunkStart, chunkLength, targetLength);
        
        // 调用runModel处理分块
        const chunkOut = await runModel(chunkTensor, segment, samplerate, chunkLength);
        futures.push({'future': chunkOut, 'offset': offset})
        console.log('进度：', chunkEnd / length*100, '%')
    }
    // 初始化输出缓冲和权重缓冲（使用 buffer 避免大张量 concat）
    const outShape = [batch, lenModelSources, channels, length];
    const outBuffer = tf.buffer(outShape);
    const sumWeightBuffer = tf.buffer([length]);

    // 处理所有分块结果
    for (const future of futures) {
        const chunkOut = future.future;
        const offset = future.offset;
        const chunkLength = chunkOut.shape[chunkOut.shape.length - 1];
        const actualEnd = Math.min(offset + chunkLength, length);
        const actualChunkLength = actualEnd - offset;
        
        // 创建权重切片
        const weightSlice = weight.slice(0, actualChunkLength);
        
        // 获取分块数据（同步读取到 CPU）
        const weightedChunkData = await chunkOut.array();
        const weightData = new Float32Array(weightSlice);
        
        // 直接更新缓冲区（避免 concat 操作）
        for (let b = 0; b < batch; b++) {
            for (let s = 0; s < lenModelSources; s++) {
                for (let c = 0; c < channels; c++) {
                    for (let t = 0; t < actualChunkLength; t++) {
                        const globalIndex = offset + t;
                        const currentValue = outBuffer.get(b, s, c, globalIndex);
                        const chunkValue = weightedChunkData[b][s][c][t] * weightData[t];
                        outBuffer.set(currentValue + chunkValue, b, s, c, globalIndex);
                    }
                }
            }
        }
        
        // 更新权重累加
        for (let t = 0; t < actualChunkLength; t++) {
            const globalIndex = offset + t;
            const currentWeight = sumWeightBuffer.get(globalIndex);
            sumWeightBuffer.set(currentWeight + weightData[t], globalIndex);
        }
        
        // 清理不再需要的张量
        tf.dispose(chunkOut);
    }

    // 从缓冲区创建张量
    let out = outBuffer.toTensor();
    const sumWeight = sumWeightBuffer.toTensor();

    // 归一化处理
    out = out.div(sumWeight.reshape([1, 1, 1, length]));
    return out.dataSync()
}

function normalizeInputs(paddedMix, mag) {
    return tf.tidy(() => {
        // 标准化paddedMix (input1)
        const input1 = paddedMix;
        const input1Mean = input1.mean();
        const input1Std = input1.sub(input1Mean).square().mean().sqrt();
        const input1Temp = input1.sub(input1Mean).div(input1Std.add(1e-5));
        
        // 标准化mag (input2)
        const meanMag = mag.mean();
        const stdMag = mag.sub(meanMag).square().mean().sqrt();
        const normalizedInput2 = mag.sub(meanMag).div(stdMag.add(1e-5));
        const originalShape = input1Temp.shape
        const normalizedInput1 = input1Temp.reshape([1, ...originalShape])
        
        return {
            normalizedInput1,  // 对应Python中的input1
            normalizedInput2,
            meanMag,
            stdMag
        };
    });
}

async function processModelOutput(x, xt, mean_mag, std_mag, input2Shape) {
    return tf.tidy(() => {
        // 1. 将 ONNX Tensor 转换为 TensorFlow.js 张量
        let xTensor = tf.tensor(x.data, x.dims, x.type);
        let xtTensor = tf.tensor(xt.data, xt.dims, xt.type);
        // 2. 获取形状参数
        const S = 4;  // 源的数量
        const [B, C, Fq, T] = input2Shape;  // 从原始 mag 输入获取形状
        
        // 3. 重塑 x 张量
        const reshapedX = xTensor.reshape([B, S, -1, Fq, T]);
        
        // 4. 反标准化
        const denormalizedX = reshapedX.mul(std_mag).add(mean_mag);
        
        return {
            x: denormalizedX,
            xt: xtTensor,
            B: B,
            S: S
        };
    });
}

// 修改后的运行ONNX模型函数
async function runONNXModel(session, normalizedInput1, normalizedInput2) {
    try {
        // 使用异步数据获取避免阻塞GPU
        const [input1Data, input2Data] = await Promise.all([
            normalizedInput1.data(),
            normalizedInput2.data()
        ]);
        
        // 创建ONNX输入张量
        const input1Tensor = new ort.Tensor('float32', input1Data, normalizedInput1.shape);
        const input2Tensor = new ort.Tensor('float32', input2Data, normalizedInput2.shape);
        
        // 准备输入
        const feeds = {
            mix: input1Tensor,
            mag: input2Tensor
        };
        
        // 运行模型
        const results = await session.run(feeds);
        
        // 返回结果并标记需要释放
        return {
            x: results.x,
            xt: results.xt,
            toDispose: [input1Tensor, input2Tensor]
        };
    } finally {
        // 确保释放TF资源，即使出错
        tf.dispose([normalizedInput1, normalizedInput2]);
    }
}

async function runModel(mixTensor, segment, samplerate, realLength) {
    // 创建资源释放列表
    const toDispose = [];
    
    try {
        const length = mixTensor.dims[2];
        const validLength = Math.floor(segment * samplerate);
        
        // 填充音频到有效长度
        const paddedMix = mixTensor;
        toDispose.push(paddedMix);
        
        // 生成频谱特征
        const z = computeSpectrogram(paddedMix);
        toDispose.push(z);
        
        const mag = demucsMagnitude(z);
        toDispose.push(mag);
        
        const { normalizedInput1, normalizedInput2, meanMag, stdMag } = normalizeInputs(
            convertOnnxTensorToTf(paddedMix),
            mag
        );
        toDispose.push(normalizedInput1, normalizedInput2);
        
        console.time('run');
        const results = await runONNXModel(modelSession, normalizedInput1, normalizedInput2);
        console.timeEnd('run');
        
        // 添加ONNX资源到释放列表
        if (results.toDispose) {
            toDispose.push(...results.toDispose);
        }
        
        const { x, xt, B, S } = await processModelOutput(
            results.x, 
            results.xt, 
            meanMag, 
            stdMag, 
            normalizedInput2.shape
        );
        
        // 添加输出资源到释放列表
        toDispose.push(x, xt);
        
        const out = demucsPostProcess(x, xt, paddedMix, segment, samplerate, B, S);
        toDispose.push(out);
        
        return centerTrim(out, realLength);
    } finally {
        // 确保所有资源最终被释放
        await tf.nextFrame(); // 给GPU喘息机会
        tf.dispose(toDispose.filter(t => t));
        
        // 额外内存清理
        if (tf.memory().numTensors > 100) {
            tf.engine().startScope();
            tf.engine().endScope();
        }
    }
}
function convertOnnxTensorToTf(onnxTensor) {
    const data = onnxTensor.data;
    const dims = onnxTensor.dims;
    
    // 检查维度是否符合预期结构 [batch_size, num_channels, length]
    if (dims.length !== 3 || dims[0] !== 1) {
        throw new Error("Expected dims format: [1, num_channels, length]");
    }
    
    const numChannels = dims[1];
    const length = dims[2];
    const totalElements = numChannels * length;
    
    // 创建通道分离后的新数组
    const separatedData = [];
    for (let channel = 0; channel < numChannels; channel++) {
        separatedData[channel] = [];
    }
    
    // 将交错数据分配到对应通道
    for (let i = 0; i < totalElements; i++) {
        const channel = i % numChannels;  // 确定当前元素所属的通道
        const index = Math.floor(i / numChannels);  // 确定在通道内的位置
        separatedData[channel][index] = data[i];
    }
    
    // 创建TensorFlow张量 (形状 [num_channels, length])
    return tf.tensor(separatedData, [numChannels, length]);
}
/**
 * 在 TensorFlow.js 中模拟 PyTorch 的 pad1d 功能，仅对最后一个维度进行填充
 *
 * @param {tf.Tensor} x - 输入张量，shape: [... , length]
 * @param {[number, number]} paddings - [left_pad, right_pad]
 * @param {string} mode - 支持 'constant', 'reflect'
 * @param {number} value - 填充值，仅用于 'constant' 模式
 * @returns {tf.Tensor}
 */
function pad1d(x, paddings, mode = 'constant', value = 0) {
    const shape = x.shape;
    const rank = shape.length;
    const length = shape[rank - 1];

    let [paddingLeft, paddingRight] = paddings;

    // 如果是 reflect 模式，并且长度小于最大 padding，需要先扩展
    if (mode === 'reflect') {
        const maxPad = Math.max(paddingLeft, paddingRight);
        if (length <= maxPad) {
            const extraPad = maxPad - length + 1;
            const extraPadRight = Math.min(paddingRight, extraPad);
            const extraPadLeft = extraPad - extraPadRight;

            // 先做一次小的扩展
            x = tf.mirrorPad(
                x,
                Array(rank - 1).fill([0, 0]).concat([[extraPadLeft, extraPadRight]]),
                'reflect'
            );

            paddingLeft -= extraPadLeft;
            paddingRight -= extraPadRight;
        }
    }

    // 构造 padding 参数：其他维度不填充，只对最后一个维度填充
    const padding = Array(rank - 1).fill([0, 0]).concat([[paddingLeft, paddingRight]]);

    let out;
    if (mode === 'constant') {
        out = tf.pad(x, padding, value);
    } else if (mode === 'reflect') {
        out = tf.mirrorPad(x, padding, 'reflect');
    } else if (mode === 'symmetric') {
        out = tf.mirrorPad(x, padding, 'symmetric');
    } else {
        throw new Error(`Unsupported mode: ${mode}`);
    }

    // 可选：添加断言检查
    tf.tidy(() => {
        const expectedLength = length + paddingLeft + paddingRight;
        const actualLength = out.shape[out.shape.length - 1];
        if (actualLength !== expectedLength) {
            throw new Error(`Padding failed: expected length ${expectedLength}, got ${actualLength}`);
        }

        // 注意：无法直接比较张量内容是否一致，除非运行在 eager 模式下
        // 所以这个 assert 只能在调试时启用
        // const slice = out.slice([0], out.shape.slice(0, -1).concat([length]));
        // const original = x.reshape(slice.shape);
        // if (!tf.allEqual(slice, original).dataSync()[0]) {
        //     throw new Error('Original data mismatch in padded tensor');
        // }
    });

    return out;
}

function processSpectro(z, le) {
    return tf.tidy(() => {
        const real = tf.real(z);
        const imag = tf.imag(z)
        const rank = z.rank;
        // 步骤1: 裁剪频率维度（倒数第二维去掉最后一个元素）
        const realCropped = tf.slice(
            real,
            Array(rank).fill(0), // [0,0,...]
            real.shape.map((d, i) => (i === rank - 2) ? d - 1 : d) // [..., :-1, :]
        );
        const imagCropped = tf.slice(
            imag,
            Array(rank).fill(0), // [0,0,...]
            imag.shape.map((d, i) => (i === rank - 2) ? d - 1 : d) // [..., :-1, :]
        );

        // 步骤2: 检查时间维度长度（Python中的assert）
        const timeDim = realCropped.shape[rank - 1];
        if (timeDim !== le + 4) {
            console.warn("Shape mismatch warning:", {
                expected: le + 4,
                got: timeDim,
                fullShape: realCropped.shape
            });
        }

        // 步骤3: 切片时间维度（最后维度的2:2+le部分）
        const begin = Array(rank).fill(0);
        begin[rank - 1] = 2; // 时间维度起始索引
        
        const size = [...realCropped.shape];
        size[rank - 1] = le; // 时间维度切片长度
        const realPart = tf.slice(realCropped, begin, size)
        const imagPart = tf.slice(imagCropped, begin, size)
        return tf.complex(realPart, imagPart);
    });
}

const spectro = (audioData, nfft = 4096, hl = 1024) => {
    const inputShape = audioData.shape;
    const otherDims = inputShape.slice(0, -1);
    const length = inputShape[inputShape.length - 1];
    const totalBatch = otherDims.reduce((acc, dim) => acc * dim, 1);
    
    let x = audioData.reshape([totalBatch, length]).toFloat();
    
    const padStart = Math.floor(nfft / 2);
    const padEnd = Math.ceil(nfft / 2);
    
    return tf.tidy(() => {
        const padded = tf.mirrorPad(x, [[0, 0], [padStart, padEnd]], 'reflect');
        const paddedLength = padded.shape[1];
        const numFrames = Math.floor((paddedLength - nfft) / hl) + 1;
        const hannWindow = tf.signal.hannWindow(nfft);
        const normFactor = 1 / Math.sqrt(nfft);
        const numFreqs = Math.floor(nfft / 2) + 1;
        
        // 预分配内存
        const realPart = new Float32Array(totalBatch * numFrames * numFreqs);
        const imagPart = new Float32Array(totalBatch * numFrames * numFreqs);
        
        // 创建FFT实例（复用提高性能）
        const fft = new FFT(nfft);
        const fftInput = new Array(nfft);
        const fftOutput = new Array(nfft * 2); // 输出是复数（实部+虚部）
        
        console.time('fft_compute');
        
        // 逐批次处理
        for (let b = 0; b < totalBatch; b++) {
            // 预提取批次数据
            const batchData = [];
            for (let t = 0; t < numFrames; t++) {
                const start = t * hl;
                const frame = padded.slice([b, start], [1, nfft]);
                const windowed = frame.mul(hannWindow.reshape([1, nfft]));
                batchData.push(windowed.dataSync());
            }
            
            // 逐帧处理
            for (let t = 0; t < numFrames; t++) {
                const frameData = batchData[t];
                
                // 准备FFT输入数据
                for (let i = 0; i < nfft; i++) {
                    fftInput[i] = frameData[i];
                }
                
                // 执行FFT计算
                fft.realTransform(fftOutput, fftInput);
                
                // 提取正频率部分（前numFreqs个点）
                const baseIndex = (b * numFrames + t) * numFreqs;
                for (let f = 0; f < numFreqs; f++) {
                    const real = fftOutput[2 * f];
                    const imag = fftOutput[2 * f + 1];
                    
                    realPart[baseIndex + f] = real * normFactor;
                    imagPart[baseIndex + f] = imag * normFactor;
                }
            }
        }
        
        console.timeEnd('fft_compute');
        
        // 创建复数张量 [batch, frames, freqs]
        const complexSpectrum = tf.complex(
            tf.tensor2d(realPart, [totalBatch * numFrames, numFreqs]),
            tf.tensor2d(imagPart, [totalBatch * numFrames, numFreqs])
        ).reshape([totalBatch, numFrames, numFreqs]);
        
        // 手动转置避免TensorFlow.js的WebGL bug
        const transposedData = new Float32Array(totalBatch * numFreqs * numFrames * 2);
        const complexData = complexSpectrum.dataSync();
        for (let b = 0; b < totalBatch; b++) {
            for (let f = 0; f < numFreqs; f++) {
                for (let t = 0; t < numFrames; t++) {
                    const srcIndex = (b * numFrames * numFreqs + t * numFreqs + f) * 2;
                    const dstIndex = (b * numFreqs * numFrames + f * numFrames + t) * 2;
                    
                    transposedData[dstIndex] = complexData[srcIndex];
                    transposedData[dstIndex + 1] = complexData[srcIndex + 1];
                }
            }
        }
        
        // 创建转置后的张量 [batch, freqs, frames]
        const transposed = tf.complex(
            tf.tensor(transposedData.filter((_, i) => i % 2 === 0), [totalBatch, numFreqs, numFrames]),
            tf.tensor(transposedData.filter((_, i) => i % 2 === 1), [totalBatch, numFreqs, numFrames])
        );
        
        // 恢复原始维度
        const outputShape = [...otherDims, numFreqs, numFrames];
        return transposed.reshape(outputShape);
    });
};
function computeSpectrogram(audioData) {
    const nfft = 4096
    const hop_length = Math.floor(nfft / 4);
    const hl = hop_length
    if(hl !== nfft / 4) {
        throw new Error('hop_length must be nfft / 4')
    }
    const le = Math.ceil(audioData.dims[2] / hl)
    let pad = Math.floor(hl / 2) * 3
    audioData = pad1d(convertOnnxTensorToTf(audioData), [pad, pad + le * hl - audioData.dims[2]], "reflect")
    const z = spectro(audioData, nfft, hl);
    const result = processSpectro(z, le)
    
    const shape = result.shape;
    return result.reshape([1, ...shape])
}


function demucsMagnitude(z, cac = true) {
    return tf.tidy(() => {
        // 确保z是有效的张量
        if (!z || !z.shape) {
            throw new Error("Invalid input tensor for demucsMagnitude");
        }
        
        if (cac) {
            // 处理复数张量：分离实部和虚部并重组维度
            const shape = z.shape;
            if (shape.length !== 4) {
                throw new Error(`Expected 4D tensor, got ${shape.length}D tensor`);
            }
            
            const [B, C, Fr, T] = shape;
            
            // 确保是复数张量
            if (z.dtype !== 'complex64') {
                console.warn("demucsMagnitude: Expected complex64 tensor for cac=true");
                // 如果不是复数，转换为复数（实部=z，虚部=0）
                z = tf.complex(z, tf.zerosLike(z));
            }
            // 将复数张量转换为实部虚部分离的形式 [B, C, Fr, T, 2]
            const complexTemp = tf.stack([tf.real(z), tf.imag(z)], -1);
            const complexParts = complexTemp.reshape([B, C, Fr, T, 2]);
            // 调整维度顺序: [B, C, Fr, T, 2] => [B, C, 2, Fr, T]
            const permuted = complexParts.transpose([0, 1, 4, 2, 3]);
            
            // 合并通道维度: [B, C, 2, Fr, T] => [B, C*2, Fr, T]
            return permuted.reshape([B, C * 2, Fr, T]);
        } else {
            // 直接取幅度谱
            if (z.dtype === 'complex64') {
                return tf.abs(z);
            }
            // 已经是实数张量，直接返回
            return z;
        }
    });
}

/**
 * 中心裁剪张量，使其最后一维与参考长度匹配
 * @param {tf.Tensor} tensor - 要裁剪的张量
 * @param {tf.Tensor|number} reference - 参考张量或目标长度
 * @returns {tf.Tensor} 裁剪后的张量
 * @throws {Error} 如果输入张量小于参考长度
 */
function centerTrim(tensor, reference) {
    // 1. 确定目标长度
    let refSize;
    if (reference instanceof tf.Tensor) {
        refSize = reference.shape[reference.shape.length - 1];
    } else if (typeof reference === 'number') {
        refSize = Math.floor(reference);
    } else {
        throw new Error('reference 必须是 tf.Tensor 或数字');
    }
    // 2. 计算需要裁剪的长度
    const tensorSize = tensor.shape[tensor.shape.length - 1];
    const delta = tensorSize - refSize;

    // 3. 错误检查
    if (delta < 0) {
        throw new Error(`输入张量必须大于参考长度。当前差值: ${delta}`);
    }

    // 4. 如果不需要裁剪，直接返回
    if (delta === 0) {
        return tensor.clone(); // 保持不可变性
    }

    // 5. 计算裁剪范围
    const start = Math.floor(delta / 2);
    const end = tensorSize - Math.ceil(delta / 2);

    // 6. 执行裁剪
    const rank = tensor.shape.length;
    const begin = new Array(rank).fill(0);
    const size = [...tensor.shape];
    
    begin[rank - 1] = start; // 最后一维的开始位置
    size[rank - 1] = end - start; // 最后一维的新长度
    return tf.tidy(() => {
        return tensor.slice(begin, size);
    });
}

function demucsPostProcess(m, xt, padded_m, segment, samplerate, B, S) {
    return tf.tidy(() => {
        // 1. 计算训练长度
        const training_length = Math.floor(segment * samplerate);
        
        // 2. 应用掩码转换（内联demucsMask）
        const [batchSize, numSources, numChannels, freqs, frames] = m.shape;
        if (numChannels % 2 !== 0) throw new Error(`通道数必须是偶数，当前为: ${numChannels}`);
        
        const reshaped = m.reshape([batchSize, numSources, numChannels/2, 2, freqs, frames]);
        const permuted = reshaped.transpose([0, 1, 2, 4, 5, 3]);
        let real = permuted.slice([0,0,0,0,0,0], [-1,-1,-1,-1,-1,1]).squeeze([5]);
        let imag = permuted.slice([0,0,0,0,0,1], [-1,-1,-1,-1,-1,1]).squeeze([5]);
        const zout = tf.complex(real, imag);
        // 3. 执行逆频谱转换（内联demucsIspec/demucsIspectro）
        const nfft = 4096;
        const scale = 0;
        const hopLength = Math.floor(nfft / 4);
        const hl = Math.floor(hopLength / Math.pow(4, scale));
        const pad = Math.floor(hl / 2) * 3;
        const le = hl * Math.ceil(training_length / hl) + 2 * pad;
        
        // 处理复数张量
        const [B1, S1, C1, F, T] = zout.shape;
        const reshapedZ = zout.reshape([B1*S1*C1, F, T]);
        const cpuReal = tf.real(reshapedZ).reshape([B1*S1*C1, F, T]).arraySync();
        const cpuImag = tf.imag(reshapedZ).reshape([B1*S1*C1, F, T]).arraySync();
        // 创建CPU张量
        real = tf.tensor(cpuReal, reshapedZ.shape, 'float32');
        imag = tf.tensor(cpuImag, reshapedZ.shape, 'float32');

        // 执行填充操作
        let paddedReal = tf.pad(real, [[0,0], [0,1], [0,0]]);
        paddedReal = tf.pad(paddedReal, [[0,0], [0,0], [2,2]]);
        let paddedImag = tf.pad(imag, [[0,0], [0,1], [0,0]]);
        paddedImag = tf.pad(paddedImag, [[0,0], [0,0], [2,2]]);

        
        // 重新组合为复数张量（在原始后端执行）
        const padded = tf.complex(paddedReal, paddedImag);
        // 执行逆STFT
        console.time('istft_compute')
        const x = istft(padded, nfft, hl);
        console.timeEnd('istft_compute')
        // 裁剪信号
        const start = pad;
        const end = start + training_length;
        
        const cropped = x.slice([0,start], [-1,end-start]);
        const x_time = cropped.reshape([B1, S1, C1, end-start]);
        // 4. 计算均值和标准差
        console.time('average_compute')
        const reductionIndices = [1, 2];
        const padded_t = tf.tensor(padded_m.cpuData, padded_m.dims, 'float32');
        const meant = padded_t.mean(reductionIndices, true);
        const tempt = padded_t.sub(meant).square().mean().sqrt();
        const stdt = tempt.reshape(meant.shape)
        // 5. 处理xt张量
        let processed_xt = xt.reshape([B, S, -1, training_length]);
        // 6. 反标准化
        const expanded_stdt = stdt.expandDims(1);
        const expanded_meant = meant.expandDims(1);
        
        processed_xt = processed_xt.mul(expanded_stdt).add(expanded_meant);
        console.timeEnd('average_compute')
        // 7. 合并结果
        return processed_xt.add(x_time);
    });
}
function istft(input, n_fft, hop_length, win_length, window, center = true, normalized = true, length = null) {
    return tf.tidy(() => {
        // 1. 处理输入张量形状
        const inputShape = input.shape;
        const otherDims = inputShape.slice(0, -2);
        const freqs = inputShape[inputShape.length - 2];
        const frames = inputShape[inputShape.length - 1];
        
        const totalBatch = otherDims.reduce((acc, dim) => acc * dim, 1);
        const reshaped = input.reshape([totalBatch, freqs, frames]);
        
        // 2. 计算实际FFT大小（如果未提供）
        if (!n_fft) {
            n_fft = 2 * (freqs - 1);
        }
        
        // 3. 设置默认参数
        hop_length = hop_length || Math.floor(n_fft / 4);
        win_length = win_length || n_fft;
        
        // 4. 创建窗函数（汉宁窗）
        let winTensor;
        if (window) {
            winTensor = window;
        } else {
            winTensor = tf.signal.hannWindow(win_length);
            // 如果窗长度小于FFT大小，进行零填充
            if (win_length < n_fft) {
                const padStart = Math.floor((n_fft - win_length) / 2);
                const padEnd = n_fft - win_length - padStart;
                winTensor = tf.pad(winTensor, [[padStart, padEnd]]);
            }
        }
        const winData = winTensor.dataSync();
        const winNorm = tf.sum(tf.square(winTensor)).sqrt().dataSync()[0];
        
        // 5. 计算填充参数
        const padStart = center ? Math.floor(n_fft / 2) : 0;
        const padEnd = center ? Math.ceil(n_fft / 2) : 0;
        const outputLength = (frames - 1) * hop_length + n_fft;
        
        // 6. 初始化输出缓冲区和权重
        const outputData = new Float32Array(totalBatch * outputLength).fill(0);
        const weightData = new Float32Array(totalBatch * outputLength).fill(0);
        
        // 7. 处理复数输入数据
        const complexData = reshaped.dataSync();
        const batchSize = totalBatch;
        
        // 8. 创建FFT实例（重用实例提高性能）
        const fft = new FFT(n_fft);
        const ifftInput = new Array(n_fft * 2);
        const ifftOutput = new Array(n_fft * 2);
        console.time('istft')
        // 9. 处理每个批次
        for (let b = 0; b < batchSize; b++) {
            // 10. 处理每一帧
            for (let t = 0; t < frames; t++) {
                // 11. 构建单边谱
                const frameSpectrum = new Array(freqs);
                for (let f = 0; f < freqs; f++) {
                    const index = (b * freqs * frames + f * frames + t) * 2;
                    frameSpectrum[f] = [
                        complexData[index],
                        complexData[index + 1]
                    ];
                }
                
                // 12. 重建完整频谱（双边谱）
                // 直接使用预分配的 ifftInput 数组
                // 正频率部分
                for (let f = 0; f < freqs; f++) {
                    ifftInput[f * 2] = frameSpectrum[f][0];     // 实部
                    ifftInput[f * 2 + 1] = frameSpectrum[f][1]; // 虚部
                }
                
                // 负频率部分（共轭对称）
                // 注意：f=0 和 f=nyquist 频率没有对称部分
                for (let f = 1; f < freqs - 1; f++) {
                    const negIndex = (n_fft - f) * 2;
                    ifftInput[negIndex] = frameSpectrum[f][0];      // 实部不变
                    ifftInput[negIndex + 1] = -frameSpectrum[f][1]; // 虚部取负（共轭）
                }
                
                // 填充中间部分为零（如果有）
                if (n_fft > freqs * 2 - 2) {
                    for (let f = freqs; f < n_fft - freqs + 2; f++) {
                        ifftInput[f * 2] = 0;
                        ifftInput[f * 2 + 1] = 0;
                    }
                }
                
                // 13. 执行IFFT
                fft.inverseTransform(ifftOutput, ifftInput);
                
                // 14. 归一化处理
                const normFactor = normalized ? Math.sqrt(n_fft) : n_fft;
                
                // 15. 加窗处理并直接累加到输出
                const start = t * hop_length;
                
                // 16. 重叠相加（同时应用归一化和加窗）
                for (let i = 0; i < n_fft; i++) {
                    const pos = b * outputLength + start + i;
                    const real = ifftOutput[i * 2] * normFactor;
                    const winValue = winData[i];
                    const winSq = winValue * winValue;
                    
                    outputData[pos] += real * winValue;
                    weightData[pos] += winSq;
                }
            }
        }
        console.timeEnd('istft')
        // 17. 归一化输出信号
        for (let i = 0; i < outputData.length; i++) {
            if (weightData[i] > 1e-10) {  // 避免除以零
                outputData[i] /= weightData[i];
            }
        }
        
        // 18. 创建输出张量
        let outputTensor = tf.tensor(outputData, [totalBatch, outputLength]);
        
        // 19. 移除填充部分
        if (center) {
            const start = padStart;
            const end = outputLength - padEnd;
            outputTensor = outputTensor.slice([0, start], [-1, end - start]);
        }
        
        // 20. 处理指定长度
        if (length !== null) {
            outputTensor = outputTensor.slice([0, 0], [-1, length]);
        }
        
        // 21. 恢复原始形状
        const finalShape = [...otherDims, outputTensor.shape[1]];
        return outputTensor.reshape(finalShape);
    });
}
