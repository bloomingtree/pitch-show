// WAV文件编码器
export function encodeWAV(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // 实现WAV头写入逻辑
    // ...参考python的sf.write实现...
    
    // 返回Blob对象
    return new Blob([view], { type: 'audio/wav' });
}