// 在文件顶部添加Tensor导入
import { InferenceSession, Tensor } from 'onnxruntime-web';
import * as ort from 'onnxruntime-web';
import * as tf from '@tensorflow/tfjs';
import { fft, ifft } from 'fft-js'
import {saveTensorToIndexedDB, loadTensorFromIndexedDB, 
    convertToTFTensor, convertFromTFTensor
} from "./tensorUtils.js"

let modelSession
let inputTensor
let refMean
let refStd
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
    let audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
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
    refMean = ref.reduce((a, b) => a + b, 0) / samples;
    refStd = Math.sqrt(ref.reduce((a, b) => a + (b - refMean) ** 2, 0) / samples) + 1e-8;

    // 标准化处理
    const processed = new Float32Array(wav.length);
    for (let i = 0; i < wav.length; i++) {
        processed[i] = (wav[i] - refMean) / refStd;
    }
    // 修改Tensor的创建方式
    console.log('length:', processed.length)
    inputTensor = new Tensor('float32', processed, [1, 2, samples]);
}

// 在文件顶部添加新的辅助函数
function padChunk(tensor, offset, targetLength) {
    const [B, C, T] = tensor.dims;
    const totalLength = T;

    // 计算当前窗口需要覆盖的范围
    const start = targetLength - (tensor.dims[2] || 0); // 注意：这里才是以 offset 为起点的扩展
    const end = start + targetLength;

    // 调整有效范围
    const correctStart = Math.max(0, start);
    const correctEnd = Math.min(totalLength, end);

    // 填充量
    const padLeft = correctStart - start;
    const padRight = end - correctEnd;

    // 创建新数组并填充
    const paddedData = new Float32Array(B * C * targetLength);
    const sourceData = tensor.data.subarray(correctStart * C, correctEnd * C);

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
        console.log(offset, length)
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
        debugger
        // 应用权重合并结果
        const chunkArray = chunkOut.dataSync()
        const effectiveWeight = weight.slice(0, chunkLength);
        for (let i = 0; i < chunkLength; i++) {
            sumWeight[chunkStart + i] += effectiveWeight[i];
        }
        for (let b = 0; b < batch; b++) {
            for (let s = 0; s < lenModelSources; s++) {
                for (let c = 0; c < channels; c++) {
                    for (let i = 0; i < chunkLength; i++) {
                        // 计算4维张量的索引 [batch, source, channel, sample]
                        const outIdx = (
                            (b * lenModelSources * channels * length) +
                            (s * channels * length) +
                            (c * length) +
                            chunkStart + i
                        );
                        
                        // 计算输入块的索引 [batch, source, channel, sample]
                        const inIdx = (
                            (b * lenModelSources * channels * chunkLength) +
                            (s * channels * chunkLength) +
                            (c * chunkLength) +
                            i
                        );
                        
                        output[outIdx] += chunkArray[inIdx] * effectiveWeight[i];
                    }
                }
            }
        }
    }
    
    // 归一化处理 - 修改索引计算
    for (let b = 0; b < batch; b++) {
        for (let s = 0; s < lenModelSources; s++) {
            for (let c = 0; c < channels; c++) {
                for (let i = 0; i < length; i++) {
                    const idx = (
                        (b * lenModelSources * channels * length) +
                        (s * channels * length) +
                        (c * length) +
                        i
                    );
                    output[idx] /= sumWeight[i];
                }
            }
        }
    }
    const outputTensor = await loadTensorFromIndexedDB('output')
    const resBlobs = postProcess(inputTensor, outputTensor.dataSync(), refMean, refStd)
    return resBlobs
}

function createAudioBufferFromSource(sourceIndex, output) {
    const sampleRate = 44100;
    const duration = 7; // seconds
    const channels = 2; // stereo
    const samplesPerChannel = sampleRate * duration; // 308700
    const samplesPerSource = samplesPerChannel * channels; // 617400
    const totalSources = 4;
    const startIdx = sourceIndex * samplesPerSource;
    const audioBuffer = new AudioBuffer({
        length: samplesPerChannel,
        numberOfChannels: channels,
        sampleRate: sampleRate
    });

    for (let ch = 0; ch < channels; ch++) {
        const channelData = audioBuffer.getChannelData(ch);
        for (let i = 0; i < samplesPerChannel; i++) {
            const idx = startIdx + i * channels + ch;
            channelData[i] = output[idx];
        }
    }

    return audioBuffer;
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
    let x = results.x;  // 假设输出名称为'x'
    let xt = results.xt; // 假设输出名称为'xt'
    
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
        convertOnnxTensorToTf(paddedMix),
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
    // await saveTensorToIndexedDB(x, 'x')
    // await saveTensorToIndexedDB(xt, 'xt')
    // await saveTensorToIndexedDB(convertToTFTensor(paddedMix), 'paddedMix')
    console.log(segment)
    console.log(samplerate)
    console.log(B)
    console.log(S)
    // const B = 1; // 假设B为1，因为我们处理的是单个音频
    // const S = 4; // 假设S为4，因为我们处理的是4个源
    // let x = await loadTensorFromIndexedDB('x')
    // let xt = await loadTensorFromIndexedDB('xt')
    // const temp = await loadTensorFromIndexedDB('paddedMix')
    // const paddedMix = await convertFromTFTensor(temp)
    // console.log('x:', x)
    // console.log('xt:', xt)
    // console.log('paddedMix:', paddedMix)
    const out = demucsPostProcess(x, xt, paddedMix, segment, samplerate, B, S);
    // const length = 220500
    return centerTrim(out, length)
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
        const winNorm = tf.sqrt(tf.sum(tf.square(hannWindow)));
        const normFactor = 1 / Math.sqrt(nfft)
        
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
    return tf.tidy(async () => {
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
        let x = istft(padded, hl, le)
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

function istftSync(paddedTensor, n_fft = 4096, hop_length = 1024) {
    return tf.tidy(() => {
      // 1. 分离实部和虚部（同步操作）
      const real = paddedTensor.slice([0, 0, 0, 0], [-1, -1, -1, 1]).squeeze([3]);
      const imag = paddedTensor.slice([0, 0, 0, 1], [-1, -1, -1, 1]).squeeze([3]);
      const complex = tf.complex(real, imag);
  
      // 2. 构建完整频谱（共轭对称）
      const firstHalf = complex.slice([0, 0, 0], [-1, 2049, -1]);
      const rest = firstHalf.slice([0, 1, 0], [-1, 2047, -1]);
      const conjFlip = tf.conj(rest).reverse(1);
      const fullSpectrum = tf.concat([firstHalf, conjFlip], 1);
  
      // 3. 逆FFT（同步操作）
      const permuted = fullSpectrum.transpose([0, 2, 1]); // [batch, time, n_fft]
      const ifft = tf.spectral.ifft(permuted);
      const realPart = tf.real(ifft); // [batch, time, n_fft]
  
      // 4. 窗函数（同步生成）
      const win = tf.signal.hannWindow(n_fft);
  
      // 5. 初始化输出缓冲区
      const batch = realPart.shape[0];
      const n_frames = realPart.shape[1];
      const length = (n_frames - 1) * hop_length + n_fft;
      const output = tf.buffer([batch, length]);
      const windowSum = tf.buffer([batch, length]);
  
      // 6. 同步重叠-相加
      for (let t = 0; t < n_frames; t++) {
        const start = t * hop_length;
        const frame = realPart.slice([0, t, 0], [-1, 1, -1]).squeeze([1]);
        const windowed = frame.mul(win);
  
        // 直接操作Buffer（同步写入）
        for (let b = 0; b < batch; b++) {
          for (let i = 0; i < n_fft; i++) {
            const pos = start + i;
            output.values[b * length + pos] += windowed.arraySync()[b][i];
            windowSum.values[b * length + pos] += win.arraySync()[i] ** 2;
          }
        }
      }
  
      // 7. 转换为Tensor并归一化
      const outputTensor = tf.tensor(output.values, [batch, length]);
      const windowSumTensor = tf.tensor(windowSum.values, [batch, length]);
      return outputTensor.div(windowSumTensor.add(1e-10));
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
    return tf.tidy(async () => {
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
        let x = istftSync(reshapedZ)
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
        const x = istft(padded, nfft, hl);
        // 裁剪信号
        const start = pad;
        const end = start + training_length;
        
        const cropped = x.slice([0,start], [-1,end-start]);
        const x_time = cropped.reshape([B1, S1, C1, end-start]);
        // 4. 计算均值和标准差
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
        // 7. 合并结果
        return processed_xt.add(x_time);
    });
}

function istftForDemucs(stft, hop_length, length, n_fft = 4096) {
    return tf.tidy(() => {
        const [batch, freqs, frames] = stft.shape;
        const outputLength = (frames - 1) * hop_length + n_fft;
        // 分离实部和虚部
        const real = tf.real(stft);
        const imag = tf.imag(stft);
        
        // 构建完整频谱（拆分实虚部分别处理）
        const firstReal = real.slice([0,0,0], [-1,2049,-1]);
        const firstImag = imag.slice([0,0,0], [-1,2049,-1]);
        const firstHalf = tf.complex(firstReal, firstImag);

        // 分离rest的实部和虚部后反转
        const restReal = real.slice([0,1,0], [-1,2047,-1]).reverse(1);
        const restImag = imag.slice([0,1,0], [-1,2047,-1]).reverse(1);
        const conjFlip = tf.complex(restReal, tf.mul(restImag, -1));

        const fullSpectrum = tf.concat([firstHalf, conjFlip], 1);
        // 执行逆FFT
        const permuted = fullSpectrum.transpose([0,2,1]);
        const ifft = tf.spectral.ifft(permuted);
        const realPart = tf.real(ifft);
        
        // 应用窗函数和重叠相加
        const win = tf.signal.hannWindow(n_fft);
        const outputBuf = tf.buffer([batch, outputLength]);
        const windowSumBuf = tf.buffer([batch, outputLength]);
        
        const winData = win.arraySync();
        const realData = realPart.reshape([batch, frames, n_fft]).arraySync();
        for (let b = 0; b < batch; b++) {
            for (let t = 0; t < frames; t++) {
                const start = t * hop_length;
                for (let i = 0; i < n_fft; i++) {
                    const idx = b * outputLength + start + i;
                    const value = realData[b][t][i] * winData[i];
                    
                    outputBuf.values[idx] += value;
                    windowSumBuf.values[idx] += winData[i] * winData[i];
                }
            }
        }
        
        // 归一化并裁剪
        const output = outputBuf.toTensor();
        const windowSum = windowSumBuf.toTensor();
        const result = output.div(windowSum.add(1e-10));
        
        if (length < outputLength) {
            const start = Math.floor((outputLength - length) / 2);
            return result.slice([0, start], [batch, length]);
        }
        return result;
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
        
        // 8. 处理每个批次
        for (let b = 0; b < batchSize; b++) {
            // 9. 处理每一帧
            for (let t = 0; t < frames; t++) {
                // 10. 构建单边谱
                const frameSpectrum = [];
                for (let f = 0; f < freqs; f++) {
                    const index = (b * freqs * frames + f * frames + t) * 2;
                    const real = complexData[index];
                    const imag = complexData[index + 1];
                    frameSpectrum.push([real, imag]);
                }
                
                // 11. 重建完整频谱（双边谱）
                const fullSpectrum = new Array(n_fft).fill([0, 0]);
                
                // 正频率部分
                for (let f = 0; f < freqs; f++) {
                    fullSpectrum[f] = frameSpectrum[f];
                }
                
                // 负频率部分（共轭对称）
                for (let f = 1; f < freqs - 1; f++) {
                    fullSpectrum[n_fft - f] = [
                        frameSpectrum[f][0], 
                        -frameSpectrum[f][1]  // 共轭
                    ];
                }
                
                // 12. 执行IFFT
                const frameSignal = ifft(fullSpectrum);
                
                // 13. 归一化处理
                const normFactor = normalized ? Math.sqrt(n_fft) : n_fft;
                const normalizedSignal = frameSignal.map(([real, imag]) => [
                    real * normFactor,
                    imag * normFactor
                ]);
                
                // 14. 加窗处理
                const windowedSignal = normalizedSignal.map(([real, imag], i) => [
                    real * winData[i],
                    imag * winData[i]
                ]);
                
                // 15. 计算当前帧的起始位置
                const start = t * hop_length;
                
                // 16. 重叠相加
                for (let i = 0; i < n_fft; i++) {
                    const pos = b * outputLength + start + i;
                    const winSq = winData[i] * winData[i];
                    
                    outputData[pos] += windowedSignal[i][0];  // 使用实部
                    weightData[pos] += winSq;
                }
            }
        }
        
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

function postProcess(wav, out, ref_mean, ref_std, target_sr = 44100) {
    // 1. 恢复原始音频范围
    // 分离音轨恢复
    const outArray = new Float32Array(out.length);
    for (let i = 0; i < out.length; i++) {
        outArray[i] = out[i] * ref_std + ref_mean;
    }
    
    // 原始音频恢复（如果需要）
    const wavArray = new Float32Array(wav.length);
    for (let i = 0; i < wav.length; i++) {
        wavArray[i] = wav[i] * ref_std + ref_mean;
    }
    // 2. 分离各音轨并归一化
    const sources = ['drums', 'bass', 'other', 'vocals'];
    const result = {};
    
    // 根据张量形状解析输出
    // 假设out的形状为 [batch, numSources, channels, length]
    const batch = 1; // 通常为1
    const numSources = 4;
    const channels = 2; // 立体声
    const length = wav.size / channels;
    
    for (let s = 0; s < numSources; s++) {
        const sourceData = new Float32Array(channels * length);
        
        // 找到当前音轨的最大绝对值（用于归一化）
        let maxVal = 0;
        for (let c = 0; c < channels; c++) {
            for (let i = 0; i < length; i++) {
                const idx = ((s * channels + c) * length) + i;
                const val = Math.abs(outArray[idx]);
                if (val > maxVal) maxVal = val;
            }
        }
        
        // 归一化因子（至少为1）
        const normFactor = Math.max(1.01 * maxVal, 1);
        
        // 创建交错排列的音频数据
        for (let i = 0; i < length; i++) {
            for (let c = 0; c < channels; c++) {
                const srcIdx = ((s * channels + c) * length) + i;
                const dstIdx = i * channels + c;
                sourceData[dstIdx] = outArray[srcIdx] / normFactor;
            }
        }
        
        // 创建AudioBuffer
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: target_sr
        });
        const audioBuffer = audioContext.createBuffer(channels, length, target_sr);
        
        // 复制数据到AudioBuffer
        for (let channel = 0; channel < channels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = sourceData[i * channels + channel];
            }
        }
        
        // 转换为WAV Blob
        const wavBlob = audioBufferToWav(audioBuffer);
        result[sources[s]] = wavBlob;
    }
    return result;
}

// 辅助函数：将AudioBuffer转换为WAV Blob
function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    
    // 创建WAV头部
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    
    // RIFF标识
    writeString(view, 0, 'RIFF');
    // 文件长度 (data size + 36)
    view.setUint32(4, 36 + length * blockAlign, true);
    // WAVE标识
    writeString(view, 8, 'WAVE');
    // fmt子块
    writeString(view, 12, 'fmt ');
    // fmt块长度
    view.setUint32(16, 16, true);
    // 格式类型 (1 = PCM)
    view.setUint16(20, 1, true);
    // 声道数
    view.setUint16(22, numChannels, true);
    // 采样率
    view.setUint32(24, sampleRate, true);
    // 字节率 (sampleRate * blockAlign)
    view.setUint32(28, sampleRate * blockAlign, true);
    // 块对齐 (numChannels * bytesPerSample)
    view.setUint16(32, blockAlign, true);
    // 位深度
    view.setUint16(34, bytesPerSample * 8, true);
    // data标识
    writeString(view, 36, 'data');
    // 数据长度 (numSamples * blockAlign)
    view.setUint32(40, length * blockAlign, true);
    
    // 合并头部和PCM数据
    const data = new Float32Array(length * numChannels);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            data[i * numChannels + channel] = channelData[i];
        }
    }
    
    const pcm16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
        const s = Math.max(-1, Math.min(1, data[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const wav = new Blob(
        [view, pcm16], 
        { type: 'audio/wav' }
    );
    
    return wav;
}

// 辅助函数：向DataView写入字符串
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
export default {
    loadONNXModel,
    loadAudio,
    applyModel
}