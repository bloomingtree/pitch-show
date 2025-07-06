// 在文件顶部添加Tensor导入
import { InferenceSession, Tensor } from 'onnxruntime-web';
import * as ort from 'onnxruntime-web';
import * as tf from '@tensorflow/tfjs';
import { fft } from 'fft-js'
const { decode: decodeWav } = require('wav-decoder');

let modelSession
let inputTensor
let result
let spectroRes
const target_sr = 44100

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
            executionProviders: ['wasm'],
            graphOptimizationLevel: 'all',
            executionMode: 'parallel',
            wasm: {
                worker: false // 禁用worker模式避免CORS问题
            }
        });
        
        modelSession = session
    } catch (error) {
        console.error('Failed to load ONNX model:', error);
        throw new Error(`模型加载失败: ${error.message}`);
    }
}

async function loadAudio(audioFile) {
    // 加载音频
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await audioFile.arrayBuffer();
    
    const audioBuffer = await decodeWav(arrayBuffer);
    
    // 重采样到目标采样率
    if (audioBuffer.sampleRate !== target_sr) {
        const offlineCtx = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            Math.ceil(audioBuffer.duration * target_sr),
            target_sr
        );
        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineCtx.destination);
        source.start();
        audioBuffer = await offlineCtx.startRendering();
    }

    // 获取原始音频数据
    const channels = audioBuffer.numberOfChannels;
    const samples = audioBuffer.length;
    const wav = new Float32Array(samples * 2); // 预分配双声道空间

    // 填充数据遵循Python的(samples, 2)布局
    if (channels === 1) {
        // 单声道转双声道
        for (let i = 0; i < samples; i++) {
            const sample = audioBuffer.getChannelData(0)[i];
            wav[i * 2] = sample;     // 左声道
            wav[i * 2 + 1] = sample; // 右声道
        }
    } else {
        // 多声道取前两个声道
        const chan0 = audioBuffer.getChannelData(0);
        const chan1 = channels > 1 ? audioBuffer.getChannelData(1) : chan0;
        for (let i = 0; i < samples; i++) {
            wav[i * 2] = chan0[i];   // 左声道
            wav[i * 2 + 1] = chan1[i]; // 右声道
        }
    }
    // 计算均值和标准差（基于双声道数据）
    const ref = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        ref[i] = (wav[i * 2] + wav[i * 2 + 1]) / 2;
    }
    const refMean = ref.reduce((a, b) => a + b, 0) / samples;
    const refStd = Math.sqrt(ref.reduce((a, b) => a + (b - refMean) ** 2, 0) / samples) + 1e-8;

    // 标准化处理
    const processed = new Float32Array(wav.length);
    for (let i = 0; i < wav.length; i++) {
        processed[i] = (wav[i] - refMean) / refStd;
    }
    // 修改Tensor的创建方式
    inputTensor = new Tensor('float32', processed, [1, 2, samples]);
}

// 在文件顶部添加新的辅助函数
function padChunk(tensor, offset, targetLength) {
    const [B, C, T] = tensor.dims;
    const totalLength = T;
    
    // 计算需要填充的长度
    const delta = targetLength - (tensor.dims[2] || 0);
    const start = offset - Math.floor(delta / 2);
    const end = start + targetLength;

    // 计算有效范围
    const correctStart = Math.max(0, start);
    const correctEnd = Math.min(totalLength, end);
    
    // 计算填充量
    const padLeft = correctStart - start;
    const padRight = end - correctEnd;

    // 创建新数组并填充
    const paddedData = new Float32Array(B * C * targetLength);
    const sourceData = tensor.data.subarray(
        correctStart * C,
        correctEnd * C
    );
    
    // 填充左侧
    if (padLeft > 0) {
        paddedData.set(new Float32Array(padLeft * C), 0);
    }
    // 填充主数据
    paddedData.set(sourceData, padLeft * C);
    // 填充右侧
    if (padRight > 0) {
        const rightStart = (padLeft + (correctEnd - correctStart)) * C;
        paddedData.set(new Float32Array(padRight * C), rightStart);
    }

    return new ort.Tensor('float32', paddedData, [B, C, targetLength]);
}

// 修改applyModel函数中的分块处理部分
async function applyModel() {
    const mixTensor = inputTensor;
    debugger
    const overlap = 0.25
    const transitionPower = 1
    const samplerate = 44100;
    const segment = 5;
    const lenModelSources = 4;
    const [batch, channels, length] = mixTensor.dims;
    // 计算分块参数
    const segmentLength = Math.floor(samplerate * segment);
    const stride = Math.floor((1 - overlap) * segmentLength);
    
    // 初始化输出缓冲
    const output = new Float32Array(batch * lenModelSources * channels * length).fill(0);
    const sumWeight = new Float32Array(length).fill(0);

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

    // 分块处理
    for (let offset = 0; offset < length; offset += stride) {
        const chunkStart = offset;
        const chunkEnd = Math.min(offset + segmentLength, length);
        const chunkLength = chunkEnd - chunkStart;
        
        // 提取当前块数据并应用填充
        const rawChunk = new ort.Tensor(
            'float32', 
            mixTensor.data.slice(chunkStart * channels, chunkEnd * channels),
            [batch, channels, chunkLength]
        );
        
        // 使用新的填充逻辑
        const chunkTensor = padChunk(rawChunk, chunkStart, segmentLength);
        // 调用runModel处理分块
        const chunkOut = await runModel(chunkTensor, segment, samplerate);
        
        // 应用权重合并结果
        const effectiveWeight = weight.slice(0, chunkLength);
        for (let s = 0; s < lenModelSources; s++) {
            for (let c = 0; c < channels; c++) {
                for (let i = 0; i < chunkLength; i++) {
                    const outIdx = ((s * channels + c) * length) + chunkStart + i;
                    const inIdx = (s * channels + c) * chunkLength + i;
                    output[outIdx] += chunkOut[inIdx] * effectiveWeight[i];
                    sumWeight[chunkStart + i] += effectiveWeight[i];
                }
            }
        }
    }

    // 归一化处理
    for (let s = 0; s < lenModelSources; s++) {
        for (let c = 0; c < channels; c++) {
            for (let i = 0; i < length; i++) {
                const idx = ((s * channels + c) * length) + i;
                output[idx] /= sumWeight[i];
            }
        }
    }

    result = output;
    return result
}

function normalizeInputs(paddedMix, mag) {
    return tf.tidy(() => {
        // 标准化paddedMix (input1)
        const input1 = paddedMix;
        const input1Mean = input1.mean();
        const input1Std = input1.sub(input1Mean).square().mean().sqrt();
        const normalizedInput1 = input1.sub(input1Mean).div(input1Std.add(1e-5));
        
        // 标准化mag (input2)
        const meanMag = mag.mean();
        const stdMag = mag.sub(meanMag).square().mean().sqrt();
        const normalizedInput2 = mag.sub(meanMag).div(stdMag.add(1e-5));
        
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
        const xTensor = tf.tensor(x.data, x.dims, x.type);
        const xtTensor = tf.tensor(xt.data, xt.dims, xt.type);
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

// 运行ONNX模型的函数
async function runONNXModel(session, normalizedInput1, normalizedInput2) {
    // 将TensorFlow.js张量转换为ONNX Runtime可用的张量
    const input1Data = normalizedInput1.dataSync();
    const input2Data = normalizedInput2.dataSync();
    
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
    // 提取输出
    const x = results.x;  // 假设输出名称为'x'
    const xt = results.xt; // 假设输出名称为'xt'
    
    // 返回结果
    return { x, xt };
}

async function runModel(mixTensor, segment, samplerate) {
    const length = mixTensor.dims[2]
    console.log('length:' ,length)
    const validLength = Math.floor(segment * samplerate);
    const batchSize = 1;
    const channels = 2;

    // 填充音频到有效长度
    const paddedMix = padTensor(mixTensor, validLength);
    // 生成频谱特征
    const z = computeSpectrogram(paddedMix);
    const mag = demucsMagnitude(z);
    const { normalizedInput1, normalizedInput2, meanMag, stdMag } = normalizeInputs(
        tf.tensor(paddedMix.cpuData, paddedMix.dims),
        mag
    );
    const results = await runONNXModel(modelSession, normalizedInput1, normalizedInput2)
    const { x, xt, B, S } = await processModelOutput(
        results.x, 
        results.xt, 
        meanMag, 
        stdMag, 
        normalizedInput2.shape
    );
    // 7. 清理资源
    tf.dispose([normalizedInput1, normalizedInput2])
    const out = demucsPostProcess(x, xt, paddedMix, segment, samplerate, B, S);
    return centerTrim(out)
}

function convertOnnxTensorToTf(onnxTensor) {
    // 获取原始数据（注意：这可能是一个 TypedArray，如 Float32Array）
    const data = onnxTensor.data;
    
    // 获取维度信息
    const dims = onnxTensor.dims;

    // 创建 TensorFlow.js Tensor
    return tf.tensor(data, dims);
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
    console.log("Input tensor shape:", x.shape);
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

function padTensor(tensor, validLength) {
    const [B, C, T] = tensor.dims;
    // 修正填充量计算逻辑
    const padSize = Math.max(validLength - T, 0); // 确保不会产生负填充
    const paddedData = new Float32Array(B * C * (T + padSize));
    paddedData.set(tensor.data);
    return new ort.Tensor('float32', paddedData, [B, C, T + padSize]);
}

function demucsMask(m) {
    return tf.tidy(() => {
        // 获取输入形状
        const [B, S, C, Fr, T] = m.shape;
        
        // 确保通道数是偶数
        if (C % 2 !== 0) {
            throw new Error(`通道数C必须是偶数，当前为: ${C}`);
        }
        
        // 步骤1: 重塑张量 [B, S, C, Fr, T] -> [B, S, C/2, 2, Fr, T]
        const reshaped = m.reshape([B, S, C/2, 2, Fr, T]);
        
        // 步骤2: 维度置换 [B, S, C/2, 2, Fr, T] -> [B, S, C/2, Fr, T, 2]
        const permuted = reshaped.transpose([0, 1, 2, 4, 5, 3]);
        
        // 步骤3: 提取实部和虚部
        const real = permuted.slice([0, 0, 0, 0, 0, 0], [-1, -1, -1, -1, -1, 1]).squeeze([5]);
        const imag = permuted.slice([0, 0, 0, 0, 0, 1], [-1, -1, -1, -1, -1, 1]).squeeze([5]);
        
        // 步骤4: 创建复数张量
        return tf.complex(real, imag);
    });
}

function processSpectro(z, le) {
    return tf.tidy(() => {
        // 检查并转换复数输入为实数（幅度谱）
        if (z.dtype === 'complex64') {
            z = tf.abs(z);
        }

        const rank = z.rank;
        // 步骤1: 裁剪频率维度（倒数第二维去掉最后一个元素）
        const zCropped = tf.slice(
            z,
            Array(rank).fill(0), // [0,0,...]
            z.shape.map((d, i) => (i === rank - 2) ? d - 1 : d) // [..., :-1, :]
        );

        // 步骤2: 检查时间维度长度（Python中的assert）
        const timeDim = zCropped.shape[rank - 1];
        if (timeDim !== le + 4) {
            console.warn("Shape mismatch warning:", {
                expected: le + 4,
                got: timeDim,
                fullShape: zCropped.shape
            });
        }

        // 步骤3: 切片时间维度（最后维度的2:2+le部分）
        const begin = Array(rank).fill(0);
        begin[rank - 1] = 2; // 时间维度起始索引
        
        const size = [...zCropped.shape];
        size[rank - 1] = le; // 时间维度切片长度
        
        return tf.slice(zCropped, begin, size);
    });
}

const spectro = (audioData, nfft = 4096, hl = 1024) => {
    const inputShape = audioData.shape;
    const otherDims = inputShape.slice(0, -1);
    const length = inputShape[inputShape.length - 1];
    const totalBatch = otherDims.reduce((acc, dim) => acc * dim, 1);
    
    const x = audioData.reshape([totalBatch, length]).toFloat();
    
    const padStart = Math.floor(nfft / 2);
    const padEnd = Math.ceil(nfft / 2);
    
    return tf.tidy(() => {
        const padded = tf.pad(x, [[0, 0], [padStart, padEnd]], 'reflect');
        const paddedLength = padded.shape[1];
        
        const numFrames = Math.floor((paddedLength - nfft) / hl) + 1;
        
        const hannWindow = tf.signal.hannWindow(nfft);
        const winNorm = tf.sqrt(tf.sum(tf.square(hannWindow)));
        const normFactor = 1 / winNorm.dataSync()[0];
        
        const windowedData = [];
        
        // 逐帧处理，避免创建大张量
        for (let b = 0; b < totalBatch; b++) {
            const batchFrames = [];
            for (let t = 0; t < numFrames; t++) {
                const start = t * hl;
                // 提取单帧并加窗
                const frame = padded.slice([b, start], [1, nfft]);
                const windowed = frame.mul(hannWindow.reshape([1, nfft]));
                batchFrames.push(windowed.dataSync());
            }
            windowedData.push(batchFrames);
        }
        
        const numFreqs = Math.floor(nfft / 2) + 1;
        const realPart = new Float32Array(totalBatch * numFrames * numFreqs);
        const imagPart = new Float32Array(totalBatch * numFrames * numFreqs);
        
        let bufferIndex = 0;
        // 逐帧计算FFT
        for (let b = 0; b < totalBatch; b++) {
            for (let t = 0; t < numFrames; t++) {
                const frameData = windowedData[b][t];
                const phasors = fft(frameData);
                // 只保留正频率部分
                for (let f = 0; f < numFreqs; f++) {
                    const index = bufferIndex * numFreqs + f;
                    realPart[index] = phasors[f][0] * normFactor;
                    imagPart[index] = phasors[f][1] * normFactor;
                }
                bufferIndex++;
            }
        }
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
        spectroRes = transposed.reshape(outputShape)
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
    return result
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
            const complexParts = tf.stack([tf.real(z), tf.imag(z)], -1);
            
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
 * Demucs 逆频谱转换 (TensorFlow.js 实现)
 * 支持PyTorch风格的复数张量输入
 * 
 * @param {tf.Tensor} z - 输入复数频谱张量 [B, S, C, F, T] (PyTorch风格)
 * @param {number} length - 期望输出长度（采样点数）
 * @param {number} nfft - FFT 窗口大小（默认4096）
 * @param {number} scale - 缩放因子（默认0）
 * @returns {tf.Tensor} 时域信号
 */
async function demucsIspec(z, length = null, nfft = 4096, scale = 0) {
    return tf.tidy(() => {
        // 1. 转换PyTorch复数张量为TensorFlow.js格式
        //    [B, S, C, F, T] -> [B, S, C, F, T, 2]
        const complexTensor = convertPyTorchComplexToTFJS(z);
        
        // 2. 重塑张量为函数期望的形状 [B, S, C, F, T, 2] -> [B*S*C, F, T, 2]
        const batchSize = complexTensor.shape[0];
        const sources = complexTensor.shape[1];
        const channels = complexTensor.shape[2];
        const freqs = complexTensor.shape[3];
        const frames = complexTensor.shape[4];
        
        const reshaped = complexTensor.reshape([
            batchSize * sources * channels, 
            freqs, 
            frames, 
            2
        ]);
        
        // 3. 计算跳数长度
        const hopLength = Math.floor(nfft / 4);
        const hl = Math.floor(hopLength / Math.pow(4, scale));
        
        // 4. 填充操作 (对应 F.pad(z, (0, 0, 0, 1)))
        let padded = reshaped;
        const padBefore = [0, 0];  // 时间维度前后不填充
        const padAfter = [0, 1];   // 频率维度末尾填充1
        
        // 创建填充配置: [批次, 频率, 时间, 复数]
        const paddings = [
            [0, 0],     // 批次维度不填充
            [0, 1],     // 频率维度末尾填充1
            [0, 0],     // 时间维度不填充
            [0, 0]      // 复数维度不填充
        ];
        
        padded = tf.pad(reshaped, paddings);
        
        // 5. 再次填充 (对应 F.pad(z, (2, 2)))
        const timePad = [2, 2];
        const newPaddings = [
            [0, 0],     // 批次维度不填充
            [0, 0],     // 频率维度不填充
            [2, 2],     // 时间维度前后各填充2
            [0, 0]      // 复数维度不填充
        ];
        
        padded = tf.pad(padded, newPaddings);
        
        // 6. 计算最终长度
        const pad = Math.floor(hl / 2) * 3;
        if (!length) {
            // 如果没有提供length，则根据输入计算
            const inputFrames = frames;
            length = (inputFrames - 1) * hl;
        }
        const le = hl * Math.ceil(length / hl) + 2 * pad;
        // 7. 执行逆短时傅里叶变换
        const x = demucsIspectro(padded, hl, le);
        
        // 8. 裁剪到所需长度
        const start = pad;
        const end = start + length;
        
        // 裁剪最后一维（时间维）
        const cropped = x.slice([0, 0, start], [-1, -1, end - start]);
        
        // 9. 恢复原始形状 [B*S*C, 1, L] -> [B, S, C, L]
        const output = cropped.reshape([
            batchSize, 
            sources, 
            channels, 
            end - start
        ]);
        
        return output;
    });
}

/**
 * 将PyTorch风格的复数张量转换为TensorFlow.js格式
 * 
 * @param {tf.Tensor} tensor - PyTorch风格的复数张量 [B, S, C, F, T]
 * @returns {tf.Tensor} TF.js格式的复数张量 [B, S, C, F, T, 2]
 */
function convertPyTorchComplexToTFJS(tensor) {
    return tf.tidy(() => {
        // 分离实部和虚部
        const real = tf.real(tensor);
        const imag = tf.imag(tensor);
        
        // 在最后一个维度上堆叠实部和虚部
        return tf.stack([real, imag], -1);
    });
}

/**
 * Demucs 逆频谱转换 (TensorFlow.js 实现)
 * @param {tf.Tensor} z - 输入复数频谱张量 [..., freqs, frames]
 * @param {number} hopLength - 跳数长度
 * @param {number} length - 期望输出长度（采样点数）
 * @param {number} pad - 填充因子（默认0）
 * @returns {tf.Tensor} 时域信号
 */
async function demucsIspectro(z, hopLength = null, length = null, pad = 0) {
    return tf.tidy(() => {
        // 1. 获取输入形状
        const shape = z.shape;
        const otherDims = shape.slice(0, -2); // 除最后两个维度外的其他维度
        const freqs = shape[shape.length - 2];
        const frames = shape[shape.length - 1];
        
        // 2. 计算FFT长度
        const nFft = 2 * freqs - 2;
        
        // 3. 重塑张量 [..., freqs, frames] -> [batch, freqs, frames]
        const batchSize = otherDims.reduce((a, b) => a * b, 1);
        const reshapedZ = z.reshape([batchSize, freqs, frames]);
        
        // 4. 计算窗口长度
        const winLength = Math.floor(nFft / (1 + pad));
        
        // 5. 创建汉宁窗
        const hannWindow = tf.signal.hannWindow(winLength);
        
        // 6. 执行逆STFT
        const config = {
            window: hannWindow,
            hopLength: hopLength,
            winLength: winLength,
            fftLength: nFft,
            center: true,
            normalized: true
        };
        
        let x = tf.signal.inverse_stft(reshapedZ, config);
        
        // 7. 如果指定了长度，进行裁剪
        if (length !== null) {
            const currentLength = x.shape[x.shape.length - 1];
            if (length < currentLength) {
                const start = Math.floor((currentLength - length) / 2);
                x = x.slice([0, start], [-1, length]);
            }
        }
        
        // 8. 恢复原始形状 [batch, length] -> [...otherDims, length]
        const outputShape = [...otherDims, x.shape[1]];
        x = x.reshape(outputShape);
        
        return x;
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

/**
 * 实现与PyTorch istft兼容的逆短时傅里叶变换
 * @param {Array} z - 复数频谱 [frames, freq_bins, time_frames]
 * @param {Object} params - 参数对象
 * @param {number} params.n_fft - FFT点数 (默认4096)
 * @param {number} params.hop_length - 跳数长度 (默认1024)
 * @param {number} params.win_length - 窗口长度 (默认n_fft)
 * @param {Array} params.window - 窗口函数 (默认汉宁窗)
 * @param {boolean} params.normalized - 是否归一化 (默认true)
 * @param {number} params.length - 输出长度 (可选)
 * @param {boolean} params.center - 是否中心化 (默认true)
 * @returns {Array} 时域信号
 */
function inverseSTFT(z, params = {}) {
    // 设置默认参数
    const {
        n_fft = 4096,
        hop_length = 1024,
        win_length = n_fft,
        window = null,
        normalized = true,
        length = null,
        center = true
    } = params;

    // 1. 准备窗口函数
    const hannWindow = window || createHannWindow(win_length);
    
    // 2. 计算频率bins (对称的FFT结果)
    const freq_bins = n_fft / 2 + 1;
    
    // 3. 检查输入形状
    if (z.length !== freq_bins) {
        throw new Error(`输入频率bins数量不匹配，预期${freq_bins}，得到${z.length}`);
    }

    // 4. 计算输出长度
    const expected_length = length || (z[0].length - 1) * hop_length;
    
    // 5. 初始化输出信号
    const output_length = center ? expected_length + n_fft : expected_length;
    const signal = new Array(output_length).fill(0);
    const window_sum = new Array(output_length).fill(0);

    // 6. 处理每一帧
    for (let t = 0; t < z[0].length; t++) {
        // 6.1 获取当前帧的频谱
        const frame_fft = [];
        for (let f = 0; f < freq_bins; f++) {
            frame_fft.push(z[f][t]);
        }
        
        // 6.2 补全对称部分 (Hermitian对称)
        const full_fft = completeHermitian(frame_fft, n_fft);
        
        // 6.3 执行IFFT
        const frame_signal = fftjs.ifft(full_fft);
        
        // 6.4 应用窗口函数
        const windowed_frame = applyWindow(frame_signal, hannWindow);
        
        // 6.5 计算帧的位置
        const position = t * hop_length;
        
        // 6.6 重叠相加
        for (let i = 0; i < windowed_frame.length; i++) {
            const pos = position + i;
            if (pos < output_length) {
                signal[pos] += windowed_frame[i][0]; // 实部
                window_sum[pos] += hannWindow[i];
            }
        }
    }

    // 7. 归一化处理
    let final_signal;
    if (normalized) {
        final_signal = signal.map((val, i) => val / window_sum[i]);
    } else {
        final_signal = signal.map((val, i) => val / (n_fft / hop_length));
    }

    // 8. 中心化处理
    if (center) {
        const pad_size = Math.floor(n_fft / 2);
        return final_signal.slice(pad_size, pad_size + expected_length);
    }

    return final_signal.slice(0, expected_length);
}

/**
 * 创建汉宁窗
 * @param {number} length - 窗口长度
 * @returns {Array} 汉宁窗数组
 */
function createHannWindow(length) {
    const window = [];
    for (let i = 0; i < length; i++) {
        window.push(0.5 * (1 - Math.cos(2 * Math.PI * i / (length - 1))));
    }
    return window;
}

/**
 * 补全Hermitian对称部分
 * @param {Array} frame_fft - 前半部分FFT结果
 * @param {number} n_fft - FFT点数
 * @returns {Array} 完整的FFT结果
 */
function completeHermitian(frame_fft, n_fft) {
    const full_fft = [...frame_fft];
    
    // 补全对称部分 (忽略直流分量和Nyquist频率)
    for (let k = frame_fft.length - 2; k > 0; k--) {
        const [re, im] = frame_fft[k];
        full_fft.push([re, -im]); // 共轭对称
    }
    
    return full_fft;
}

/**
 * 应用窗口函数
 * @param {Array} frame - 帧信号
 * @param {Array} window - 窗口函数
 * @returns {Array} 加窗后的信号
 */
function applyWindow(frame, window) {
    return frame.map((val, i) => {
        const win_val = i < window.length ? window[i] : 1;
        return [val[0] * win_val, val[1] * win_val];
    });
}

/**
 * Demucs 后处理函数 (TensorFlow.js 实现)
 * @param {tf.Tensor} m - 模型输出的掩码张量 [B, S, C, Fr, T]
 * @param {tf.Tensor} xt - 模型输出的时域信号 [B, S, T]
 * @param {tf.Tensor} padded_m - 原始填充的输入信号 [B, C, T]
 * @param {number} segment - 音频段长度（秒）
 * @param {number} samplerate - 采样率（Hz）
 * @param {number} B - 批大小
 * @param {number} S - 源数量
 * @returns {tf.Tensor} 处理后的时域信号 [B, S, T]
 */
async function demucsPostProcess(m, xt, padded_m, segment, samplerate, B, S) {
    return tf.tidy(async () => {
        // 1. 计算训练长度（采样点数）
        const training_length = Math.floor(segment * samplerate);
        
        // 2. 应用掩码转换（复数频谱）
        const zout = demucsMask(m);
        debugger
        // 3. 执行逆频谱转换
        const x = await demucsIspec(zout, training_length);
        
        // 4. 计算原始输入的均值和标准差
        const reductionIndices = [1, 2]; // 对应dim=(1,2)
        const keepDims = true;
        
        const meant = padded_m.mean(reductionIndices, keepDims);
        const stdt = padded_m.std(reductionIndices, keepDims);
        
        // 5. 处理xt张量
        let processed_xt = xt.reshape([B, S, -1, training_length]);
        
        // 6. 反标准化xt (xt = xt * stdt + meant)
        const expanded_stdt = stdt.expandDims(1); // 添加S维度
        const expanded_meant = meant.expandDims(1); // 添加S维度
        
        processed_xt = processed_xt.mul(expanded_stdt).add(expanded_meant);
        
        // 7. 合并结果 (out = xt + x)
        // 需要确保x的形状与processed_xt匹配
        const expanded_x = x.expandDims(1); // 添加S维度 [B,1,T] -> [B,S,T]
        
        const out = processed_xt.add(expanded_x);
        
        return out;
    });
}


export default {
    loadONNXModel,
    loadAudio,
    applyModel
}