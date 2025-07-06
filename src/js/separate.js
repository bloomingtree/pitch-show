import { encodeWavFileFromAudioBuffer } from './WavFileEncoder.js';
import 'fflate';

let dlModelBuffers;
const DEMUCS_SAMPLE_RATE = 44100;
const DEMUCS_OVERLAP_S = 0.75;
const DEMUCS_OVERLAP_SAMPLES = Math.floor(DEMUCS_SAMPLE_RATE * DEMUCS_OVERLAP_S);
const dl_prefix = "/static";
let NUM_WORKERS = 4;
let workers;
let processedSegments = new Array(NUM_WORKERS);
let selectedModel;
let processingMode = 'stems';
let isSingleMode = true;    // 单文件模式true
let workerProgress;
let demucsAudioContext = new (window.AudioContext || window.webkitAudioContext)({sampleRate: DEMUCS_SAMPLE_RATE});
let downloadLinks = []

let completedSegments = 0; // Counter for processed segments
let completedSongsBatch = 0; // Counter for processed songs in batch mode
let batchNextFileResolveCallback = null; // Callback for resolving the next file in batch mode
const modelStemMapping = {
    'demucs-free-4s': ['bass', 'drums', 'melody', 'vocals'],
    'demucs-free-6s': ['bass', 'drums', 'other_melody', 'vocals', 'guitar', 'piano'],
    'demucs-free-v3': ['bass', 'drums', 'melody', 'vocals'],
    'demucs-karaoke': ['vocals', 'instrum'],
    'demucs-pro-ft': ['bass', 'drums', 'melody', 'vocals'],
    'demucs-pro-cust': ['bass', 'drums', 'other_melody', 'vocals', 'guitar', 'piano', 'melody'],
    'demucs-pro-deluxe': ['bass', 'drums', 'melody', 'vocals']
};
// 新增测试进度更新函数
function updateTestProgress(percentage) {
    document.getElementById('test-progress-bar').style.width = `${percentage}%`;
    document.getElementById('test-status').textContent = 
        `处理中：${percentage.toFixed(1)}% 已完成`;
}

function fetchAndCacheFiles(model) {
    let modelFiles = [];
    if (model === 'demucs-free-4s') {
        // append ggml-model-htdemucs-4s-f16.bin to modelFiles
        modelFiles.push('ggml-model-htdemucs-4s-f16.bin');
    } else if (model === 'demucs-free-6s') {
        modelFiles.push('ggml-model-htdemucs-6s-f16.bin');
    } else if (model === 'demucs-karaoke') {
        modelFiles.push('ggml-model-custom-2s-f32.bin');
    } else if (model === 'demucs-pro-ft') {
        modelFiles.push('ggml-model-htdemucs_ft_bass-4s-f16.bin');
        modelFiles.push('ggml-model-htdemucs_ft_drums-4s-f16.bin');
        modelFiles.push('ggml-model-htdemucs_ft_other-4s-f16.bin');
        modelFiles.push('ggml-model-htdemucs_ft_vocals-4s-f16.bin');
    } else if (model === 'demucs-pro-cust') {
        modelFiles.push('ggml-model-htdemucs_ft_vocals-4s-f16.bin');
        modelFiles.push('ggml-model-htdemucs-4s-f16.bin');
        modelFiles.push('ggml-model-htdemucs-6s-f16.bin');
    } else if (model === 'demucs-pro-deluxe') {
        modelFiles.push('ggml-model-htdemucs_ft_bass-4s-f16.bin');
        modelFiles.push('ggml-model-htdemucs_ft_drums-4s-f16.bin');
        modelFiles.push('ggml-model-htdemucs_ft_other-4s-f16.bin');
        modelFiles.push('ggml-model-custom-2s-f32.bin');
    } else if (model === 'demucs-free-v3') {
        modelFiles.push('ggml-model-hdemucs_mmi-f16.bin');
    }

    // prepend raw gh url to all modelFiles
    modelFiles = modelFiles.map(file =>
            `${dl_prefix}/${file}`
    )
    console.log(modelFiles)
    // Map each file to a fetch request and then process the response
    const fetchPromises = modelFiles.map(file =>
        fetch(file).then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch ${file}`);
            }
            return response.arrayBuffer(); // Or another appropriate method depending on the file type
        })
    );
    return Promise.all(fetchPromises);
}

async function processFiles(files, midiOnlyMode) {
    console.log(`Processing ${files.length} files; midi-only mode?: ${midiOnlyMode}`);
    if (!files || files.length === 0) return;

    globalProgressIncrement = 100 / files.length; // Progress increment per file
    let completedMidiFiles = 0; // Track completed MIDI files

    if (midiOnlyMode && !midiWorker) {
        initializeMidiWorker();
    }

    for (const file of files) {
        const reader = new FileReader();

        await new Promise(resolve => {
            reader.onload = async function(event) {
                const arrayBuffer = event.target.result;
                const filenameWithoutExt = file.name.slice(0, file.name.lastIndexOf('.'));

                if (midiOnlyMode) {
                    // Directly queue for MIDI processing in MIDI-only mode
                    queueMidiRequest(arrayBuffer, filenameWithoutExt, false, true);

                    // Update the progress bar for each MIDI file
                    waitForMidiProcessing().then(() => {
                        completedMidiFiles++;
                        const midiProgress = (completedMidiFiles / files.length) * 100;
                        document.getElementById('midi-progress-bar').style.width = `${midiProgress}%`;

                        // Resolve the current file’s processing
                        resolve();
                    });
                } else {
                    // For non-MIDI-only mode, decode and process with stem separation
                    demucsAudioContext.decodeAudioData(arrayBuffer, decodedData => {
                        let leftChannel, rightChannel;
                        if (decodedData.numberOfChannels === 1) {
                            leftChannel = decodedData.getChannelData(0);
                            rightChannel = decodedData.getChannelData(0);
                        } else {
                            leftChannel = decodedData.getChannelData(0);
                            rightChannel = decodedData.getChannelData(1);
                        }

                        let originalLength = leftChannel.length;
                        processBatchSegments(leftChannel, rightChannel, NUM_WORKERS, filenameWithoutExt, originalLength);
                        batchNextFileResolveCallback = resolve;
                    });
                }
            };

            reader.readAsArrayBuffer(file);
        });
    }

    // Reset progress tracking after all files are processed
    if (midiOnlyMode) {
        console.log("All MIDI files processed.");

        // Iterate over each completed MIDI file in midiBuffers and append links
        for (const filename in midiBuffers) {
            const midiBlob = midiBuffers[filename];
            if (midiBlob) {
                const midiUrl = URL.createObjectURL(midiBlob);
                const link = document.createElement('a');
                link.href = midiUrl;
                link.textContent = `${filename}.mid`;
                link.download = `${filename}.mid`;

                document.getElementById('output-links').appendChild(link);
            }
        }


        prevStep3Btn.disabled = false;
        nextStep3Btn.disabled = false;
    }

    // for all modes that have midi, increment usage here
    if (processingMode != 'stems') {
        incrementUsage(); // Increment the weekly usage counter
    }
}

async function initModel() {
    try {
        const buffers = await fetchAndCacheFiles(selectedModel);
        // WASM module is ready, enable the buttons

        dlModelBuffers = buffers;
        console.log('Model files downloaded:', buffers);
    } catch (error) {
        // Handle errors, maybe keep the overlay visible or show an error message
        console.log('Failed to fetch model files:', error);
    }
}

function sumSegments(segments, desiredLength) {
    const totalLength = desiredLength;
    const segmentLengthWithPadding = segments[0][0].length;
    const actualSegmentLength = segmentLengthWithPadding - 2 * DEMUCS_OVERLAP_SAMPLES;
    const output = new Array(segments[0].length).fill().map(() => new Float32Array(totalLength));

    // Create weights for the segment
    const weight = new Float32Array(actualSegmentLength);
    for (let i = 0; i < actualSegmentLength; i++) {
        weight[i] = (i + 1);
        weight[actualSegmentLength - 1 - i] = (i + 1);
    }
    // normalize by its max coefficient
    const maxWeight = weight.reduce((max, x) => Math.max(max, x), -Infinity);
    const ramp = weight.map(x => x / maxWeight);

    const sumWeight = new Float32Array(totalLength).fill(0);

    segments.forEach((segment, index) => {
        const start = index * actualSegmentLength;

        for (let target = 0; target < segment.length; target++) {
            const channelSegment = segment[target];

            for (let i = 0; i < channelSegment.length; i++) {
                const segmentPos = i - DEMUCS_OVERLAP_SAMPLES;
                const outputIndex = start + segmentPos;

                if (outputIndex >= 0 && outputIndex < totalLength) {
                    output[target][outputIndex] += ramp[i % actualSegmentLength] * channelSegment[i];
                    // accumulate weight n_targets times
                    sumWeight[outputIndex] += ramp[i % actualSegmentLength];
                }
            }
        }
    });

    // Normalize the output by the sum of weights
    for (let target = 0; target < output.length; target++) {
        for (let i = 0; i < totalLength; i++) {
            if (sumWeight[i] !== 0) {
                // divide by sum of weights with 1/n_targets adjustment
                output[target][i] /= (sumWeight[i]/(output.length));
            }
        }
    }

    return output;
}


function initWorkers(progressCallback) { // 添加回调参数
    // replace empty global workers with NUM_WORKERS new workers
    // if workers has already been initialized, loop over and terminate
    // old workers
    if (workers) {
         workers.forEach(worker => {
              worker.terminate();
         });
         workerProgress = null;
    }
 
    workers = new Array(NUM_WORKERS);
    workerProgress = new Array(NUM_WORKERS).fill(0);
 
    for (let i = 0; i < NUM_WORKERS; i++) {
         // push new worker onto workers array
        workers[i] = new Worker('/public/worker.js');
        workers[i].onmessage = function(e) {
            if (e.data.msg == 'WASM_READY') {
            } else if (e.data.msg === 'PROGRESS_UPDATE') {
                // Update the progress bar
                // adjust for total number of workers2
                workerProgress[i] = e.data.data;
                // sum up all the progress for total progress
                const totalProgress = workerProgress.reduce((a, b) => a + b, 0) / NUM_WORKERS;
                if(progressCallback) {
                  progressCallback(totalProgress, null, null); // 将进度回传给页面
                }
            } else if (e.data.msg === 'PROGRESS_UPDATE_BATCH') {
                workerProgress[i] = e.data.data;
                const averageProgressPerWorker = workerProgress.reduce((a, b) => a + b, 0) / NUM_WORKERS;
                const totalProgressForCurrentSong = averageProgressPerWorker * globalProgressIncrement; // Now in percentage
                const startingPointForCurrentSong = (completedSongsBatch * globalProgressIncrement);
                const newBatchWidth = startingPointForCurrentSong + totalProgressForCurrentSong;
                console.log('batch updated: ', newBatchWidth)
            } else if (e.data.msg === 'PROCESSING_DONE') {
                // Handle the processed segment
                // Collect and stitch segments
                processedSegments[i] = e.data.waveforms;
                let originalLength = e.data.originalLength;
                completedSegments +=1;
                workers[i].terminate();
                // if all segments are complete, stitch them together
                if (completedSegments === NUM_WORKERS) {
                // 状态变更为完成，可通过localStorage.setItem控制调用
                    const retSummed = sumSegments(processedSegments, originalLength);
                    packageAndDownload(retSummed, progressCallback);
                    // reset globals etc.
                    processedSegments = null; // this one will be recreated with appropriate num_workers next time
                    completedSegments = 0;
                }
            } else if (e.data.msg === 'PROCESSING_DONE_BATCH') {
                // 状态 对一个文件夹进行处理
                // similar global bs here
                const filename = e.data.filename;
                processedSegments[i] = e.data.waveforms;
                completedSegments += 1;
                let originalLength = e.data.originalLength;
                if (completedSegments === NUM_WORKERS) {
                    // 状态变更为完成
                    const retSummed = sumSegments(processedSegments, originalLength);
                    packageAndZip(retSummed, filename);
                    // reset globals per-song in the batch process
                    completedSegments = 0;

                    // full song is done
                    completedSongsBatch += 1;

                    // reset workerProgress
                    workerProgress = new Array(NUM_WORKERS).fill(0);

                    // promise resolve to move onto the next file
                    if (batchNextFileResolveCallback) {
                        batchNextFileResolveCallback(); // Resolve the Promise for the current file
                        batchNextFileResolveCallback = null; // Reset the callback
                    }

                    // if all songs are done, reset completedSongsBatch
                    // 文件长度需要重新确认 
                    if (completedSongsBatch === document.getElementById('batch-upload').files.length) {
                        completedSongsBatch = 0;
                        // re-enable the buttons
                        // enable the buttons to leave the final wizard step
                        //prevStep3Btn.disabled = false;
                        //nextStep3Btn.disabled = false;

                        // terminate the workers
                        workers.forEach(worker => {
                            worker.terminate();
                        });
                        // reset batch globals
                        processedSegments = null;
                    }
                }
            }
        };
 
        // Assuming 'selectedModel' is a global variable that is set to the model name prefix
        // such as 'demucs_free', 'demucs_karaoke', or 'demucs_pro'
        console.log(`Selected model: ${selectedModel}`);

        // assign wasm module name based on selected model, which is not
        // an exact mapping
        let wasmModuleName = "";

        if (selectedModel === 'demucs-free-4s' || selectedModel === 'demucs-free-6s') {
            wasmModuleName = 'demucs_free';
        } else if (selectedModel === 'demucs-free-v3') {
            wasmModuleName = 'demucs_free_v3';
        } else if (selectedModel === 'demucs-karaoke') {
            wasmModuleName = 'demucs_karaoke';
        } else if (selectedModel === 'demucs-pro-ft' || selectedModel === 'demucs-pro-cust') {
            wasmModuleName = 'demucs_pro';
        } else if (selectedModel === 'demucs-pro-deluxe') {
            wasmModuleName = 'demucs_deluxe';
        }
        let jsBlobName = `${wasmModuleName}.js`;
        // Post the blob URLs to the worker
        workers[i].postMessage({
            msg: 'LOAD_WASM',
            scriptName: jsBlobName,
            model: selectedModel,
            modelBuffers: dlModelBuffers
        });
     }
 };
 

// 修改现有的startProcessing函数
async function startProcessing(songFile, progressCallback) { 
    console.log('starting')
    selectedModel = 'demucs-free-4s'
    initModel().then(() => {
        console.log("Starting demix job");

        // 修改状态

        // Parse the selected memory option from the radio buttons
        const selectedMemory = 4
        const numWorkers = parseInt(selectedMemory) / 4;

        // Set the global NUM_WORKERS variable directly
        NUM_WORKERS = numWorkers;

        // we only enable the next/back buttons after the job returns

        // reset some globals e.g. progress
        processedSegments = new Array(NUM_WORKERS).fill(undefined);
        if (isSingleMode) {
            initWorkers(progressCallback); // 传递回调函数
            const reader = new FileReader();

            reader.onload = function(event) {
                const arrayBuffer = event.target.result;

                demucsAudioContext.decodeAudioData(arrayBuffer, function(decodedData) {
                    let leftChannel, rightChannel;
                    // decodedData is an AudioBuffer
                    if (decodedData.numberOfChannels == 1) {
                        // Mono case
                        leftChannel = decodedData.getChannelData(0); // Float32Array representing left channel data
                        rightChannel = decodedData.getChannelData(0); // Float32Array representing right channel data
                    } else {
                        // Stereo case
                        leftChannel = decodedData.getChannelData(0); // Float32Array representing left channel data
                        rightChannel = decodedData.getChannelData(1); // Float32Array representing right channel data
                    }

                    // set original length of track
                    let originalLength = leftChannel.length;

                    processAudioSegments(leftChannel, rightChannel, NUM_WORKERS, originalLength);
                })
            };

            reader.readAsArrayBuffer(songFile);
        } else {
            const files = folderInput.files;

            // track the start of the job
            trackProductEvent('Start Job', { mode: 'batch', numWorkers: numWorkers });

            // write log of how many workers are being used
            if (processingMode != 'midi') {
                // else we are in midi mode and don't need to init workers
                initWorkers();
            }

            document.getElementById('inference-progress-bar').style.width = '0%';
            document.getElementById('midi-progress-bar').style.width = '0%';

            // delete the previous download links
            let downloadLinksDiv = document.getElementById('output-links');
            while (downloadLinksDiv.firstChild) {
                downloadLinksDiv.removeChild(downloadLinksDiv.firstChild);
            }

            processFiles(files, processingMode === 'midi');
        }
    }).catch((error) => {
        console.error("Model initialization failed:", error);
    });
}

// -------------------以下为Utils函数--------------------

function packageAndDownload(targetWaveforms, progressCallback) {
    // create the worker

    console.log(targetWaveforms)

    const stemNames = modelStemMapping[selectedModel] || [];
    const buffers = {};

    stemNames.forEach((name, index) => {
        const buffer = demucsAudioContext.createBuffer(2, targetWaveforms[0].length, DEMUCS_SAMPLE_RATE);
        buffer.copyToChannel(targetWaveforms[index * 2], 0); // Left channel
        buffer.copyToChannel(targetWaveforms[index * 2 + 1], 1); // Right channel
        buffers[name] = buffer;
    });

    // 状态 涉及到音频的混合
     // Handle instrumental mix based on model specifics
    if (selectedModel !== 'demucs-karaoke') {
        // Define stems to include in the instrumental mix
        let instrumentalStems = stemNames.filter(name => name !== 'vocals');
        if (selectedModel === 'demucs-pro-cust') {
            // For demucs-pro-cust, use only specified stems for instrumental
            instrumentalStems = ['drums', 'bass', 'melody']; // Omitting 'guitar', 'piano', 'other_melody'
        }

        // Sum specified stems for instrumental
        const instrumentalBuffer = demucsAudioContext.createBuffer(2, targetWaveforms[0].length, DEMUCS_SAMPLE_RATE);
        instrumentalStems.forEach(name => {
            for (let i = 0; i < targetWaveforms[0].length; i++) {
                instrumentalBuffer.getChannelData(0)[i] += buffers[name].getChannelData(0)[i] || 0;
                instrumentalBuffer.getChannelData(1)[i] += buffers[name].getChannelData(1)[i] || 0;
            }
        });
        buffers['instrum'] = instrumentalBuffer; // Add instrumental buffer
    }
    const downloadLinks = createDownloadLinks(buffers)
    if(progressCallback) {
        progressCallback(null, buffers, downloadLinks)
    }
}

function packageAndZip(targetWaveforms, filename) {

    console.log(targetWaveforms);
    const stemNames = modelStemMapping[selectedModel] || [];
    const directoryName = `${filename}_stems/`;
    let zipFiles = {}; // Accumulate all files in this object

    stemNames.forEach((stemName, index) => {
        const buffer = demucsAudioContext.createBuffer(2, targetWaveforms[0].length, DEMUCS_SAMPLE_RATE);
        buffer.copyToChannel(targetWaveforms[index * 2], 0); // Left channel
        buffer.copyToChannel(targetWaveforms[index * 2 + 1], 1); // Right channel

        // Encode WAV and add to zipFiles
        const wavData = encodeWavFileFromAudioBuffer(buffer, 0);
        zipFiles[`${directoryName}${stemName}.wav`] = new Uint8Array(wavData);
    });

    // Handle instrumental mix if model type requires it
    if (selectedModel !== 'demucs-karaoke') {
        const instrumentalStems = stemNames.filter(name => name !== 'vocals');
        const instrumentalBuffer = demucsAudioContext.createBuffer(2, targetWaveforms[0].length, DEMUCS_SAMPLE_RATE);

        instrumentalStems.forEach(stemName => {
            if (!(selectedModel === 'demucs-pro-cust' && ['guitar', 'piano', 'other_melody'].includes(stemName))) {
                for (let i = 0; i < targetWaveforms[0].length; i++) {
                    instrumentalBuffer.getChannelData(0)[i] += targetWaveforms[stemNames.indexOf(stemName) * 2][i];
                    instrumentalBuffer.getChannelData(1)[i] += targetWaveforms[stemNames.indexOf(stemName) * 2 + 1][i];
                }
            }
        });
        const instrumentalWavData = encodeWavFileFromAudioBuffer(instrumentalBuffer, 0);
        zipFiles[`${directoryName}instrum.wav`] = new Uint8Array(instrumentalWavData);
    }

    
    // Once all files are in zipFiles, create the zip and append download link
    const zipData = fflate.zipSync(zipFiles, { level: 0 }); // Disable compression for speed
    const zipBlob = new Blob([zipData.buffer], { type: 'application/zip' });

    // Create a download link for the zip file
    const zipUrl = URL.createObjectURL(zipBlob);
    const zipLink = document.createElement('a');
    zipLink.href = zipUrl;
    zipLink.textContent = `${filename}_stems.zip`;
    zipLink.download = `${filename}_stems.zip`;
    document.getElementById('output-links').appendChild(zipLink);

}

function processAudioSegments(leftChannel, rightChannel, numSegments, originalLength) {
    let segments = segmentWaveform(leftChannel, rightChannel, numSegments);
    segments.forEach((segment, index) => {
        workers[index].postMessage({
            msg: 'PROCESS_AUDIO',
            leftChannel: segment[0],
            rightChannel: segment[1],
            originalLength: originalLength
        });
    });
}

// 不懂
function segmentWaveform(left, right, n_segments) {
    const totalLength = left.length;
    const segmentLength = Math.ceil(totalLength / n_segments);
    const segments = [];

    for (let i = 0; i < n_segments; i++) {
        const start = i * segmentLength;
        const end = Math.min(totalLength, start + segmentLength);
        const leftSegment = new Float32Array(end - start + 2 * DEMUCS_OVERLAP_SAMPLES);
        const rightSegment = new Float32Array(end - start + 2 * DEMUCS_OVERLAP_SAMPLES);

        // Overlap-padding for the left and right channels
        // For the first segment, no padding at the start
        if (i === 0) {
            leftSegment.fill(left[0], 0, DEMUCS_OVERLAP_SAMPLES);
            rightSegment.fill(right[0], 0, DEMUCS_OVERLAP_SAMPLES);
        } else {
            leftSegment.set(left.slice(start - DEMUCS_OVERLAP_SAMPLES, start), 0);
            rightSegment.set(right.slice(start - DEMUCS_OVERLAP_SAMPLES, start), 0);
        }

        // For the last segment, no padding at the end
        if (i === n_segments - 1) {
            const remainingSamples = totalLength - end;
            leftSegment.set(left.slice(end, end + Math.min(DEMUCS_OVERLAP_SAMPLES, remainingSamples)), end - start + DEMUCS_OVERLAP_SAMPLES);
            rightSegment.set(right.slice(end, end + Math.min(DEMUCS_OVERLAP_SAMPLES, remainingSamples)), end - start + DEMUCS_OVERLAP_SAMPLES);
        } else {
            leftSegment.set(left.slice(end, end + DEMUCS_OVERLAP_SAMPLES), end - start + DEMUCS_OVERLAP_SAMPLES);
            rightSegment.set(right.slice(end, end + DEMUCS_OVERLAP_SAMPLES), end - start + DEMUCS_OVERLAP_SAMPLES);
        }

        // Assign the original segment data
        leftSegment.set(left.slice(start, end), DEMUCS_OVERLAP_SAMPLES);
        rightSegment.set(right.slice(start, end), DEMUCS_OVERLAP_SAMPLES);

        segments.push([leftSegment, rightSegment]);
    }

    return segments;
}

function createDownloadLinks(buffers) {
    downloadLinks = []

    Object.keys(buffers).forEach(stemName => {
        // Create WAV file link
        const wavBlob = new Blob([encodeWavFileFromAudioBuffer(buffers[stemName], 0)], {type: 'audio/wav'});
        const wavUrl = URL.createObjectURL(wavBlob);
        downloadLinks.push({url: wavUrl, name: `${stemName}.wav`});
    });
    return downloadLinks
}

export default {
    startProcessing
}