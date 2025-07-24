import { Tensor } from 'onnxruntime-web';
const target_sr = 44100
let refMean
let refStd
let inputTensor
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
    inputTensor = new Tensor('float32', processed, [1, 2, samples]);
    return {
        "inputTensor": inputTensor,
        "refMean": refMean,
        "refStd": refStd
    }
}

function postProcess(out, target_sr = 44100) {
    const wav = inputTensor
    // 1. 恢复原始音频范围
    // 分离音轨恢复
    const outArray = new Float32Array(out.length);
    for (let i = 0; i < out.length; i++) {
        outArray[i] = out[i] * refStd + refMean;
    }
    
    // 原始音频恢复（如果需要）
    const wavArray = new Float32Array(wav.length);
    for (let i = 0; i < wav.length; i++) {
        wavArray[i] = wav[i] * refStd + refMean;
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
    loadAudio,
    postProcess,
}