document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    /**
     |--------------------------------------------------------------------------
     | video canvas size
     |--------------------------------------------------------------------------
     */
    const longSideSize  = getMeasurementSize();
    function getMeasurementSize() {
        let _o = window.orientation;
        let _orientation = _o === undefined ? 90 : _o;
        if (_orientation === 0 || _orientation === 180) {
            return window.innerHeight;
        }

        return window.innerWidth;
    }

    /**
     |--------------------------------------------------------------------------
     | setting
     |--------------------------------------------------------------------------
     */
    /**
     * clmtrackr
     */
    const ctracker = new clm.tracker();

    /**
     * tracking canvas
     */
    const trackingCanvas    = document.getElementById('tracking-canvas');
    const trackingCanvasCtx = trackingCanvas.getContext('2d');

    /**
     * 顔座標のindex
     * scaleX(-1) している場合(前面カメラ利用時)、座標が鏡のように左右入れ替わるので
     * それを補填する
     */
    const faceCoordinateIndexForMapping = [
        // 輪郭
        {'from': 0,  'to' : 14},
        {'from': 1,  'to' : 13},
        {'from': 2,  'to' : 12},
        {'from': 3,  'to' : 11},
        {'from': 4,  'to' : 10},
        {'from': 5,  'to' : 9},
        {'from': 6,  'to' : 8},
        {'from': 7,  'to' : 7},
        {'from': 8,  'to' : 6},
        {'from': 9,  'to' : 5},
        {'from': 10, 'to' : 4},
        {'from': 11, 'to' : 3},
        {'from': 12, 'to' : 2},
        {'from': 13, 'to' : 1},
        {'from': 14, 'to' : 0},
        // 左眉
        {'from': 19, 'to' : 15},
        {'from': 20, 'to' : 16},
        {'from': 21, 'to' : 17},
        {'from': 22, 'to' : 18},
        // 左目
        {'from': 24, 'to' : 29},
        {'from': 27, 'to' : 32},
        {'from': 26, 'to' : 31},
        {'from': 66, 'to' : 70},
        {'from': 23, 'to' : 28},
        {'from': 63, 'to' : 67},
        {'from': 64, 'to' : 68},
        {'from': 25, 'to' : 30},
        {'from': 65, 'to' : 69},
        // 右眉
        {'from': 18, 'to' : 22},
        {'from': 17, 'to' : 21},
        {'from': 16, 'to' : 20},
        {'from': 15, 'to' : 19},
        // 右目
        {'from': 29, 'to' : 24},
        {'from': 32, 'to' : 27},
        {'from': 31, 'to' : 26},
        {'from': 69, 'to' : 65},
        {'from': 30, 'to' : 25},
        {'from': 68, 'to' : 64},
        {'from': 67, 'to' : 63},
        {'from': 28, 'to' : 23},
        {'from': 70, 'to' : 66},
        // 鼻
        {'from': 33, 'to' : 33},
        {'from': 41, 'to' : 41},
        {'from': 62, 'to' : 62},
        {'from': 37, 'to' : 37},
        {'from': 34, 'to' : 40},
        {'from': 35, 'to' : 39},
        {'from': 36, 'to' : 38},
        {'from': 42, 'to' : 43},
        {'from': 43, 'to' : 42},
        {'from': 38, 'to' : 36},
        {'from': 39, 'to' : 35},
        {'from': 40, 'to' : 34},
        // 口
        {'from': 47, 'to' : 47},
        {'from': 46, 'to' : 48},
        {'from': 45, 'to' : 49},
        {'from': 44, 'to' : 50},
        {'from': 61, 'to' : 59},
        {'from': 60, 'to' : 60},
        {'from': 56, 'to' : 58},
        {'from': 57, 'to' : 57},
        {'from': 55, 'to' : 51},
        {'from': 54, 'to' : 52},
        {'from': 53, 'to' : 53},
        {'from': 52, 'to' : 54},
        {'from': 51, 'to' : 55},
        {'from': 50, 'to' : 44},
        {'from': 58, 'to' : 56},
        {'from': 59, 'to' : 61},
        {'from': 49, 'to' : 45},
        {'from': 48, 'to' : 46},
    ];

    /**
     * debug
     */
    const overlay  = document.getElementById('overlay');
    const forDebug = document.getElementById('for-debug');
    let isDebug = false;
    forDebug.addEventListener('change', (e) => {
        if (e.target.checked) {
            isDebug = true;
            overlay.classList.remove('fadein');
            overlay.classList.add('fadeout');
        } else {
            isDebug = false;
            overlay.classList.remove('fadeout');
            overlay.classList.add('fadein');
        }
    });

    /**
     * Switching the camera
     */
    const facingMode = document.getElementById('facing-mode');
    facingMode.addEventListener('change', (e) => v2c.switchCamera());

    /**
     |--------------------------------------------------------------------------
     | start
     |--------------------------------------------------------------------------
     */
    // v2c
    const option = {
        'longSideSize': longSideSize,
        'canvasId': 'from-camera',
        'videoId': 'camera',
        'useFrontCamera': facingMode.value !== "0",
        'callbackOnOrientationChange': callbackOnOrientationChange,
        'callbackOnLoadedmetadataVideo': callbackOnLoadedmetadataVideo,
        'callbackOnAfterVideoLoadError': callbackOnAfterVideoLoadError,
    };

    const v2c = new V2C('#video-canvas-wrapper', option);
    v2c.start((canvas) => drawLoop(canvas, v2c.useFrontCamera()));

    function callbackOnOrientationChange(video) {
        trackingCanvas.width = video.width;
        restartCtracker(video);
    }

    function callbackOnLoadedmetadataVideo(video) {
        initCtracker(video);

        trackingCanvas.width  = video.width;
        trackingCanvas.height = Math.round(video.height + (video.height / 2));

        overlay.style.display = 'block';
        overlay.style.height  = (video.height + 2) + 'px';
    };

    function callbackOnAfterVideoLoadError() {
        overlay.style.display = 'none';
    }

    function initCtracker(video) {
        ctracker.init();
        ctracker.start(video);
    }

    function restartCtracker(video) {
        ctracker.stop();
        ctracker.reset();
        ctracker.start(video);
    }

    function drawLoop(video_canvas, useFrontCamera) {
        clearCanvas(trackingCanvas, trackingCanvasCtx);

        if (isDebug === true) {
            ctracker.draw(video_canvas);
        }

        const positionsFromCtracker = ctracker.getCurrentPosition();
        const positions = swapPosition(useFrontCamera, positionsFromCtracker);

        if (positions !== false) {
            const faceWidth = faceSize(positionsFromCtracker).width;
            drawFace(trackingCanvasCtx, positions, faceWidth, useFrontCamera);
        }

        if (isDebug === true && positions !== false) {
            drawFacePosition(video_canvas.getContext('2d'), positions);
        }

        _stats();
    }

    function clearCanvas(canvas, ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function swapPosition(useFrontCamera, positions) {
        if (positions === false) {
            return false;
        }

        if (useFrontCamera === false) {
            return positions;
        }

        let afterSwappingPosition = [];
        for (let i=0;i<faceCoordinateIndexForMapping.length;i++) {
            afterSwappingPosition[faceCoordinateIndexForMapping[i].to] = positions[faceCoordinateIndexForMapping[i].from];
        }

        return afterSwappingPosition;
    }

    function faceSize(p) {
        // https://auduno.github.io/clmtrackr/examples/media/facemodel_numbering_new.png
        const indexOfMinX = [0, 1, 2, 3, 4, 5, 6, 7, 19, 20];
        const indexOfMaxX = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

        let min = {'x': 100000};
        let max = {'x': 0};

        for (let i = 0; i < indexOfMinX.length; i++) {
            let k = indexOfMinX[i];
            min.x = min.x > p[k][0] ? p[k][0] : min.x;
        }
        for (let i = 0; i < indexOfMaxX.length; i++) {
            let k = indexOfMaxX[i];
            max.x = max.x < p[k][0] ? p[k][0] : max.x;
        }

        return {"width" : max.x - min.x, "height": max.y - min.y};
    }

    function drawFacePosition(ctx, p) {
        for (let i=0;i<p.length;i++) {
            ctx.fillText(i, p[i][0], p[i][1]);
        }
    }

    function drawFace(ctx, p, faceWidth, useFrontCamera) {
        // add style
        settingBaseStyle(ctx);

        // draw
        _drawFace(ctx, p, faceWidth, useFrontCamera)

        // 輪郭 (じ)
        drawFaceLine(ctx, p, faceWidth, useFrontCamera);
    }

    function settingBaseStyle(ctx) {
        ctx.fillStyle   = 'rgba(255, 0, 0, 1)';
        ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
        ctx.lineWidth   = 2;
    }

    let forceDrawByFillText = false;
    let forMeasurementTime  = null;
    let fillTextCnt         = 0;
    function _drawFace(ctx, p, faceWidth, useFrontCamera) {
        if (forceDrawByFillText) {
            drawByFillText(ctx, p, faceWidth, useFrontCamera);

            if (forMeasurementTime === null) {
                forMeasurementTime = (new Date()).getTime();
            }

            if (((new Date()).getTime() - forMeasurementTime) / 1000 >= 5) { // 一定秒数描画し終わったらフラグを折る
                forceDrawByFillText = false;
                forMeasurementTime = null;
            }

            return;
        }

        if (Math.floor(Math.random() * 10) + 1 <= 2) {
            drawByFillText(ctx, p, faceWidth, useFrontCamera);

            if (++fillTextCnt >= 15) { // 一定回数以上切り替わったらフラグを立てる
                forceDrawByFillText = true;
                fillTextCnt = 0;
            }

            return;
        }

        drawByStroke(ctx, p, faceWidth, useFrontCamera);
    }

    function drawByFillText(ctx, p, faceWidth, useFrontCamera) {
        const cssFontFamily = '-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\",\"Noto Color Emoji\"';
        const scale = getScale(faceWidth);

        // 左眉 (へ)
        ctx.save();
        const leftEyebrowsTxt = 'へ';
        const leftEyebrowsSize = getSize(48, scale);
        ctx.font = `${leftEyebrowsSize}px ${cssFontFamily}`;
        const leftEyebrowsAdjustPosition = ctx.measureText(leftEyebrowsTxt).width / 2;
        const leftEyebrowsX = calcMeasureX(useFrontCamera, p[20][0], (p[21][0] - p[20][0]) / 2) - leftEyebrowsAdjustPosition;
        const leftEyebrowsY = p[20][1] + leftEyebrowsAdjustPosition;
        ctx.fillText(leftEyebrowsTxt, leftEyebrowsX, leftEyebrowsY);
        ctx.restore();

        // 左目 (の)
        ctx.save();
        const leftEyeTxt = 'の';
        const leftEyeSize = getSize(48, scale);
        ctx.font = `${leftEyeSize}px ${cssFontFamily}`;
        const leftEyeAdjustPosition = ctx.measureText(leftEyeTxt).width / 2;
        const leftEyeX = calcMeasureX(useFrontCamera, p[27][0]) - leftEyeAdjustPosition;
        const leftEyeY = p[27][1] + leftEyeAdjustPosition;
        ctx.fillText(leftEyeTxt, leftEyeX, leftEyeY);
        ctx.restore();

        // 右眉 (へ)
        ctx.save();
        const rightEyebrowsTxt = 'へ';
        const rightEyebrowsSize = getSize(48, scale);
        ctx.font = `${rightEyebrowsSize}px ${cssFontFamily}`;
        const rightEyebrowsAdjustPosition = ctx.measureText(rightEyebrowsTxt).width / 2;
        const rightEyebrowsX = calcMeasureX(useFrontCamera, p[17][0], (p[16][0] - p[17][0]) / 2) - rightEyebrowsAdjustPosition;
        const rightEyebrowsY = p[17][1] + rightEyebrowsAdjustPosition;
        ctx.fillText(rightEyebrowsTxt, rightEyebrowsX, rightEyebrowsY);
        ctx.restore();

        // 右目 (の)
        ctx.save();
        const rightEyeTxt = 'の';
        const rightEyeSize = getSize(48, scale);
        ctx.font = `${rightEyeSize}px ${cssFontFamily}`;
        const rightEyeAdjustPosition = ctx.measureText(rightEyeTxt).width / 2;
        const rightEyeX = calcMeasureX(useFrontCamera, p[32][0]) - rightEyeAdjustPosition;
        const rightEyeY = p[32][1] + rightEyeAdjustPosition;
        ctx.fillText(rightEyeTxt, rightEyeX, rightEyeY);
        ctx.restore();

        // 鼻 (も)
        ctx.save();
        const noseTxt = 'も';
        const noseSize = getSize(60, scale);
        ctx.font = `${noseSize}px ${cssFontFamily}`;
        const noseAdjustPosition = ctx.measureText(noseTxt).width / 2;
        const noseX = calcMeasureX(useFrontCamera, p[41][0], (p[41][0] - p[62][0]) / 2) - noseAdjustPosition;
        const noseY = p[41][1] + (p[62][1] - p[41][1]) / 2 + noseAdjustPosition;
        ctx.fillText(noseTxt, noseX, noseY);
        ctx.restore();

        // 口 (へ)
        ctx.save();
        const lipTxt = 'へ';
        const lipSize = getSize(60, scale);
        ctx.font = `${lipSize}px ${cssFontFamily}`;
        const lipAdjustPosition = ctx.measureText(lipTxt).width;
        const lipX = calcMeasureX(useFrontCamera, p[57][0]) - lipAdjustPosition / 2;
        const lipY = p[57][1] + lipAdjustPosition / 3;
        ctx.fillText(lipTxt, lipX, lipY);
        ctx.restore();
    }

    function getScale(faceWidth) {
        let scale = 1.0;

        if (faceWidth <= 180) {
            scale = 0.7;
        }
        if (faceWidth >= 330) {
            scale = 1.5;
        }
        if (faceWidth >= 420) {
            scale = 2;
        }

        return scale;
    }

    function getSize(fontSize, scale) {
        return Math.round(fontSize * scale);
    }

    function drawByStroke(ctx, p, faceWidth, useFrontCamera) {
        ctx.save();

        ctx.lineWidth = faceWidth >= 420 ? 6 : 4;

        // 左眉 (へ)
        const leftEyebrows = [19, 20, 22];
        drawLine(ctx, p, leftEyebrows, useFrontCamera);

        // 左目 (の)
        const leftEye = [24, 27, 26, 66, 23, 63, 24, 64, 25];
        drawLine(ctx, p, leftEye, useFrontCamera);

        // 右眉 (へ)
        const rightEyebrows = [18, 17, 15];
        drawLine(ctx, p, rightEyebrows, useFrontCamera);
        // 右目 (の)
        const rightEye = [29, 32, 31, 69, 30, 68, 29, 67, 28];
        drawLine(ctx, p, rightEye, useFrontCamera);

        // 鼻 (も)
        const nosePosition = [];
        const targetOfNosePositions = [41, 62, 37, 58];
        for (let i=0;i<targetOfNosePositions.length;i++) {
            nosePosition.push(p[targetOfNosePositions[i]]);
        }
        const noseLastPosition = [p[39][0] - (p[39][0] - p[38][0]) / 2, p[39][1] - (p[39][1] - p[38][1]) / 2];
        nosePosition.push(noseLastPosition);

        drawNose(ctx, nosePosition, 3, useFrontCamera);
        drawLine(ctx, p, [40, 34], useFrontCamera); // upper line.
        drawLine(ctx, p, [43, 42], useFrontCamera); // under line.

        // 口 (へ)
        const lip = [44, 45, 60, 51];
        drawLine(ctx, p, lip, useFrontCamera);

        ctx.restore();
    }

    function drawFaceLine(ctx, p, faceWidth, useFrontCamera) {
        const scale = getScale(faceWidth);

        ctx.save();

        ctx.lineWidth = faceWidth >= 420 ? 6 : 4;

        for (let i=0;i<11;i++) {
            ctx.beginPath();

            ctx.moveTo(calcMeasureX(useFrontCamera, p[i][0]), p[i][1]);
            ctx.lineTo(calcMeasureX(useFrontCamera, p[i+1][0]), p[i+1][1]);

            if (i===10) { // じの濁点
                ctx.moveTo(calcMeasureX(useFrontCamera, p[i+3][0]) + 10 * scale, p[i+3][1] + 30 * scale);
                ctx.lineTo(calcMeasureX(useFrontCamera, p[i+3][0]) + 5  * scale, p[i+3][1] + 5  * scale);

                ctx.moveTo(calcMeasureX(useFrontCamera, p[i+3][0]) + 20 * scale, p[i+3][1] + 30 * scale);
                ctx.lineTo(calcMeasureX(useFrontCamera, p[i+3][0]) + 15 * scale, p[i+3][1] + 5  * scale);
            }

            ctx.closePath();
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawNose(ctx, nosePosition, controlPointIndex, useFrontCamera) {
        for (let i = 0; i < nosePosition.length; i++) {

            let current = nosePosition[i];
            let next    = nosePosition[i+1];

            // control points
            if (i === controlPointIndex) {
                let prev = nosePosition[i-1];
                ctx.beginPath();
                ctx.moveTo(calcMeasureX(useFrontCamera, prev[0]), prev[1]);
                ctx.quadraticCurveTo(
                    calcMeasureX(useFrontCamera, current[0]), current[1],
                    calcMeasureX(useFrontCamera, next[0]), next[1]
                );
                ctx.stroke();
                continue;
            }

            if (
                i === controlPointIndex - 1
                || i === controlPointIndex + 1
                || next === undefined
            ) {
                continue;
            }

            draw(ctx, current, next, useFrontCamera);
        }
    }

    function drawLine(ctx, p, linePosition, useFrontCamera) {
        for (let i = 0; i < linePosition.length; i++) {
            let current = p[linePosition[i]];
            let next    = p[linePosition[i+1]];

            if (next === undefined) {
                break;
            }

            draw(ctx, current, next, useFrontCamera);
        }
    }

    function draw(ctx, current, next, useFrontCamera) {
        ctx.beginPath();
        ctx.moveTo(calcMeasureX(useFrontCamera, current[0]), current[1]);
        ctx.lineTo(calcMeasureX(useFrontCamera, next[0]), next[1]);
        ctx.closePath();
        ctx.stroke();
    }

    function calcMeasureX (useFrontCamera, width, adjust) {
        const _adjust = adjust === undefined ? 0 : adjust;

        if (useFrontCamera) {
            return trackingCanvas.width - width - _adjust;
        }

        return width + _adjust;
    }

    /**
     |--------------------------------------------------------------------------
     | stats
     |--------------------------------------------------------------------------
     */
    function _stats() {
        body.dispatchEvent(event);
    }
    const body = document.querySelector('body');
    // Create the event.
    const event = document.createEvent('Event');
    // Define that the event name is 'build'.
    event.initEvent('drawLoop', true, true);

    const stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top  = '1em';
    stats.domElement.style.left = '1.5em';
    body.appendChild(stats.domElement);

    // Update stats on every iteration.
    document.addEventListener('drawLoop', (e) => stats.update(), false);
});
