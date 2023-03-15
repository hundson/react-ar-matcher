import React from 'react';
import { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import * as cameraUtils from '@mediapipe/camera_utils';
import * as selfieSeg from '@mediapipe/selfie_segmentation';
import './App.css';

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [backgroundImageURL, setBackgroundImageURL] = useState(null);

  var camBackgroundBlur = false;

  function onResults(results) {
    const backgroundImage = document.getElementById('imageBG');
    // const videoWidth = webcamRef.current.video.videoWidth;
    // const videoHeight = webcamRef.current.video.videoHeight;
    canvasRef.current.width = webcamRef.current.video.videoWidth;
    canvasRef.current.height = webcamRef.current.video.videoHeight;

    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext('2d');

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // For drawing color
    // canvasCtx.globalCompositeOperation = 'source-in';
    // canvasCtx.fillStyle = '#00FF00';
    // canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // Draw background
    canvasCtx.globalCompositeOperation = 'source-over';
    canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);

    // Draw original image
    canvasCtx.globalCompositeOperation = 'source-in';
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // Draw background
    canvasCtx.globalCompositeOperation = 'destination-over';
    canvasCtx.drawImage(
      backgroundImage, 0, 0, canvasElement.width, canvasElement.height);

    // Draw original image
    canvasCtx.globalCompositeOperation = 'destination-over';
    if (camBackgroundBlur === true) {
      canvasCtx.filter = 'blur(10px)'; // Work on this next
    }
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.restore();
  }

  // Function to upload image
  const backgroundImageHandler = (e) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) {
        setBackgroundImageURL(reader.result);
      }
    }
    reader.readAsDataURL(e.target.files[0])
  }

  // Function to remove background image
  const backgroundImageDisable = (e) => {
    setBackgroundImageURL(null);
  }

  // Function to toggle background blur
  const camBackgroundBlurToggle = (e) => {
    if (camBackgroundBlur === false) {
      camBackgroundBlur = true;
    } else {
      camBackgroundBlur = false;
    }
  }

  useEffect(() => {
    const selfieSegmentation = new selfieSeg.SelfieSegmentation({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
      },
    });

    selfieSegmentation.setOptions({
      modelSelection: 1,
      // selfieMode: true, // Enables/disables mirroring
    });

    selfieSegmentation.onResults(onResults);

    const camera = new cameraUtils.Camera(webcamRef.current.video, {
      onFrame: async () => {
        await selfieSegmentation.send({ image: webcamRef.current.video });
      },
      width: 1920,
      height: 1080
    });

    camera.start();
  }, []);

  return (
    <div className='App'>
      <img id='imageBG' src={backgroundImageURL} />

      <div className='videoContainer'>
        <div className='video'>
          <Webcam
            ref={webcamRef}
            style={{
              display: "none",
              width: "100%",
              height: "100%"
            }}
          />

          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "100%"
            }}
          ></canvas>
        </div>
      </div>

      <div className='controlsContainer'>
        <input type='file' accept='image/*' multiple onChange={backgroundImageHandler} />
        <button onClick={backgroundImageDisable}>Remove Background</button>
        <button onClick={camBackgroundBlurToggle}>Blur Background</button>
      </div>

      <div className='devNotes'>
        <p><ul>Known Issues:</ul></p>
        <p>
          <ul>
            <li>Background blur not working after image uploaded and removed.</li>
            <li>Warning: do not use on mobile devices (heavy issues).</li>
            <li>Works best on Chrome.</li>
          </ul>
        </p>
      </div>
    </div>
  )
}

export default App;