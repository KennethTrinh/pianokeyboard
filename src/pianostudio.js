import $ from 'jquery';
/**
 * Initialize variables, draw piano, connect audio nodes, load buffers, and register event listeners.
 */
export function init() {
    // Drawing variables
    var pianoCanvas = document.getElementById('pianoCanvas');
    var visualizationCanvas = document.getElementById('visualizationCanvas');
    var pianoCanvasContext = pianoCanvas.getContext('2d');
    var visualizationCanvasContext = visualizationCanvas.getContext('2d');
    var whiteKeyWidth = pianoCanvas.width / 28, blackKeyWidth = 2 * whiteKeyWidth / 3;
    var whiteKeyHeight = pianoCanvas.height, blackKeyHeight = 2 * whiteKeyHeight / 3;

    // Setup variables
    const NUMBER_OF_KEYS = 48;
    var notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    var whiteKeys = [], blackKeys = [];
    var customTrackFile = '';

    // Web audio variables
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var audioContext = new AudioContext();
    var analyzer = audioContext.createAnalyser();
    var pianoGain = audioContext.createGain(), trackGain = audioContext.createGain();
    var keySources = [],
        sampleTrackSource = audioContext.createBufferSource(),
        customTrackSource = audioContext.createBufferSource();
    var bufferLoader = new BufferLoader(
        audioContext,
        [
            './sounds/C2.mp3', './sounds/C-sharp2.mp3', './sounds/D2.mp3', './sounds/D-sharp2.mp3',
            './sounds/E2.mp3', './sounds/F2.mp3', './sounds/F-sharp2.mp3', './sounds/G2.mp3',
            './sounds/G-sharp2.mp3', './sounds/A2.mp3', './sounds/A-sharp2.mp3', './sounds/B2.mp3',
            './sounds/C3.mp3', './sounds/C-sharp3.mp3', './sounds/D3.mp3', './sounds/D-sharp3.mp3',
            './sounds/E3.mp3', './sounds/F3.mp3', './sounds/F-sharp3.mp3', './sounds/G3.mp3',
            './sounds/G-sharp3.mp3', './sounds/A3.mp3', './sounds/A-sharp3.mp3', './sounds/B3.mp3',
            './sounds/C4.mp3', './sounds/C-sharp4.mp3', './sounds/D4.mp3', './sounds/D-sharp4.mp3',
            './sounds/E4.mp3', './sounds/F4.mp3', './sounds/F-sharp4.mp3', './sounds/G4.mp3',
            './sounds/G-sharp4.mp3', './sounds/A4.mp3', './sounds/A-sharp4.mp3', './sounds/B4.mp3',
            './sounds/C5.mp3', './sounds/C-sharp5.mp3', './sounds/D5.mp3', './sounds/D-sharp5.mp3',
            './sounds/E5.mp3', './sounds/F5.mp3', './sounds/F-sharp5.mp3', './sounds/G5.mp3',
            './sounds/G-sharp5.mp3', './sounds/A5.mp3', './sounds/A-sharp5.mp3', './sounds/B5.mp3',
            './sounds/sampletrack.mp3'
        ]
    );
    // console.log($(document).width());
    // console.log($(document). height());
    // console.log(window.innerWidth);
    // console.log(window.innerHeight);
    drawPiano(pianoCanvasContext,  pianoCanvas.width, pianoCanvas.height, whiteKeyWidth, blackKeyWidth);
    window.requestAnimationFrame(function () {
        drawVisualizer(visualizationCanvasContext, visualizationCanvas.width, visualizationCanvas.height, analyzer);
    });

    for (var i = 0, keyIndex = 0; i < NUMBER_OF_KEYS; i++) {
        var noteName = notes[i % notes.length];
        var x = keyIndex * whiteKeyWidth;

        if (noteName.length === 1) {
            whiteKeys.push([x, i]);
            keyIndex++;
        }
        else {
            x -= blackKeyWidth / 2;
            blackKeys.push([x, i]);
        }
    }

    analyzer.connect(audioContext.destination);
    pianoGain.connect(analyzer);
    trackGain.connect(analyzer);
    sampleTrackSource.loop = true;
    // bufferLoader.load();

    // Register event listeners


    $('#pianoCanvas').on({
        mousedown: function (event) {
            var rect = this.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            var key;

            pianoCanvasContext.fillStyle = '#777777';

            for (i = 0; key = blackKeys[i++];) {
                pianoCanvasContext.beginPath();
                pianoCanvasContext.rect(key[0], 0, blackKeyWidth, blackKeyHeight);
                if (pianoCanvasContext.isPointInPath(x, y)) {
                    pianoCanvasContext.fill();
                    playKey(keySources, key[1], audioContext, pianoGain, bufferLoader);
                    return;
                }
            }

            for (i = 0; key = whiteKeys[i++];) {
                pianoCanvasContext.beginPath();
                pianoCanvasContext.rect(key[0], 0, whiteKeyWidth, whiteKeyHeight);
                if (pianoCanvasContext.isPointInPath(x, y)) {
                    pianoCanvasContext.fill();
                    drawBlackKeys(pianoCanvasContext, whiteKeyWidth, blackKeyWidth);
                    playKey(keySources, key[1], audioContext, pianoGain, bufferLoader);
                    return;
                }
            }
        }, mouseup: function () {
            drawPiano(pianoCanvasContext, this.width, this.height, whiteKeyWidth, blackKeyWidth);
        }
    });

    $('#sampleTrackToggle').on('change', function () {
        if (this.checked)
            playTrack(sampleTrackSource, trackGain, bufferLoader, NUMBER_OF_KEYS);
        else
            stopSound(sampleTrackSource);
    });

    $('#customTrackToggle').on('change', function () {
        if (this.checked)
            playTrack(customTrackSource, trackGain, bufferLoader, NUMBER_OF_KEYS + 1);
        else
            stopSound(customTrackSource);
    });

    $('#customTrackBtn').on('click', function () {
        $('#customTrackFile').trigger('click');
    });

    $('#customTrackFile').on('change', function () {
        if ($(this).val() !== '') {
            // reset custom track
            stopSound(customTrackSource);
            customTrackSource = audioContext.createBufferSource();
            customTrackSource.loop = true;
            // load new file
            customTrackFile = URL.createObjectURL(this.files[0]);
            bufferLoader.urlList[NUMBER_OF_KEYS + 1] = customTrackFile;
            bufferLoader.loadBuffer(customTrackFile, NUMBER_OF_KEYS + 1);
        }
    });

    $('#pianoVolume').on('change', function () {
        var fraction = parseInt(this.value) / parseInt(this.max);
        pianoGain.gain.value = fraction * fraction;
    });

    $('#trackVolume').on('change', function () {
        var fraction = parseInt(this.value) / parseInt(this.max);
        trackGain.gain.value = fraction * fraction;
    });
    
    $(window).on("resize", () => {
        // var rect = pianoCanvas.parentNode.getBoundingClientRect();
        // console.log(rect);
        // pianoCanvas.width = rect.width;
        whiteKeyWidth = window.innerWidth / 28;
        blackKeyWidth = 2 * whiteKeyWidth / 3;
        // console.log(document.innerWidth / 28);
        // console.log(2 * document.innerWidth / 28 / 3);
        drawPiano(pianoCanvasContext, window.innerWidth, pianoCanvas.height, whiteKeyWidth, blackKeyWidth);
    });
}

/**
 * Clear the canvas, draw the white keys of the piano, and then the black keys on top.
 * @param {CanvasRenderingContext2D} canvasContext - The piano canvas's 2D rendering context.
 * @param {number} canvasWidth - The canvas's width.
 * @param {number} canvasHeight - The canvas's height.
 * @param {number} whiteKeyWidth - The width of an individual white key.
 * @param {number} blackKeyWidth - The width of an individual black key.
 */
function drawPiano(canvasContext, canvasWidth, canvasHeight, whiteKeyWidth, blackKeyWidth) {
    canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
    drawWhiteKeys(canvasContext, whiteKeyWidth);
    drawBlackKeys(canvasContext, whiteKeyWidth, blackKeyWidth);
}

/**
 * Draw the white keys of the piano.
 * @param {CanvasRenderingContext2D} pianoCanvasContext - The piano canvas's 2D rendering context.
 * @param {number} whiteKeyWidth - The width of an individual white key.
 */
function drawWhiteKeys(pianoCanvasContext, whiteKeyWidth) {
    for (var i = 0; i < 28; i++) {
        pianoCanvasContext.rect(i * whiteKeyWidth, 0, whiteKeyWidth, 300);
        pianoCanvasContext.stroke();
    }
}

/**
 * Draw the black keys of the piano.
 * @param {CanvasRenderingContext2D} pianoCanvasContext - The piano canvas's 2D rendering context.
 * @param {number} whiteKeyWidth - The width of an individual white key.
 * @param {number} blackKeyWidth - The width of an individual black key.
 */
function drawBlackKeys(pianoCanvasContext, whiteKeyWidth, blackKeyWidth) {
    pianoCanvasContext.fillStyle = '#000000';
    for (var i = 0; i < 27; i++) {
        if (i === 2 || i === 6 || i === 9 || i === 13 || i === 16 || i === 20 || i === 23)
            continue;
        pianoCanvasContext.fillRect((i * whiteKeyWidth) + blackKeyWidth, 0, blackKeyWidth, 200);
    }
}

/**
 * Draw onto the visualization canvas below based on the frequency of the currently playing sound.
 * Credit for this visualization goes to Boris Smus. See his implementation at
 * {@link http://chimera.labs.oreilly.com/books/1234000001552/ch05.html|this link}.
 * @param {CanvasRenderingContext2D} canvasContext - The visualization canvas's 2D rendering context.
 * @param {number} canvasWidth - The canvas's width.
 * @param {number} canvasHeight - The canvas's height.
 * @param {AnalyserNode} analyzer - The AudioNode responsible for providing real-time frequency analysis information.
 */
function drawVisualizer(canvasContext, canvasWidth, canvasHeight, analyzer) {
    canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);

    var freqDomain = new Uint8Array(analyzer.frequencyBinCount);
    analyzer.getByteFrequencyData(freqDomain);
    for (var i = 0; i < analyzer.frequencyBinCount; i++) {
        var value = freqDomain[i];
        var percent = value / 256;
        var height = canvasHeight * percent;
        var offset = canvasHeight - height - 1;
        var barWidth = canvasWidth / analyzer.frequencyBinCount;
        var hue = i / analyzer.frequencyBinCount * 360;
        canvasContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
        canvasContext.fillRect(i * barWidth, offset, barWidth, height);
    }
    window.requestAnimationFrame(function () {
        drawVisualizer(canvasContext, canvasWidth, canvasHeight, analyzer);
    });
}



/**
 * Connect the decoded piano key audio buffer to the AudioContext and play the key.
 * @param {Array} keySources - The Array of AudioBufferSourceNodes responsible for playing piano keys.
 * @param {number} index - The index of a piano key.
 * @param {AudioContext} audioContext - The audio-processing graph responsible for node creation and audio processing.
 * @param {GainNode} pianoGain - The AudioNode responsible for controlling the piano volume.
 * @param {BufferLoader} bufferLoader - The BufferLoader object holding the decoded audio buffers.
 */
function playKey(keySources, index, audioContext, pianoGain, bufferLoader) {
    keySources[index] = audioContext.createBufferSource();
    keySources[index].connect(pianoGain);
    keySources[index].buffer = bufferLoader.bufferList[index];
    keySources[index].start(0);
}

/**
 * Connect the decoded audio buffer to a GainNode (which is connected to the AudioContext) and play it.
 * @param {AudioBufferSourceNode} source - The AudioNode responsible for playing the track.
 * @param {GainNode} gain - The AudioNode responsible for controlling the track volume.
 * @param {BufferLoader} bufferLoader - The BufferLoader object holding the decoded audio buffers.
 * @param {number} index - The index of the track in the BufferLoader's buffer list Array.
 */
function playTrack(source, gain, bufferLoader, index) {
    source.connect(gain);
    source.buffer = bufferLoader.bufferList[index];
    source.start(0);
}

/**
 * Stop a sound that is playing.
 * @param {AudioBufferSourceNode} source - The AudioNode responsible for playing the track.
 */
function stopSound(source) {
    source.disconnect(0);
}
