import React, { useState, useRef, useCallback } from 'react';
// Import Tesseract.js directly from a CDN
import Tesseract from 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js';

// --- Helper Components (Spinner, Icons, ResultDisplay) ---

const Spinner = () => (
  <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-sky-500"></div>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mr-2 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mr-2 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ResultDisplay = ({ text }) => (
  <div className="p-4 mt-4 text-center bg-gray-100 border-2 border-dashed rounded-lg">
    <p className="mb-2 text-lg font-semibold text-gray-700">Detected Number Plate:</p>
    <p className="text-2xl font-bold tracking-widest text-sky-600 uppercase">{text || 'No text detected.'}</p>
  </div>
);


// --- Main OCR Component ---
export default function OcrNumber() {
  const [image, setImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [text, setText] = useState('');
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  /**
   * Pre-processes the image on the canvas to improve OCR accuracy.
   * Converts the image to grayscale and applies a high-contrast threshold.
   * @param {CanvasRenderingContext2D} ctx - The 2D context of the canvas.
   * @param {number} width - The width of the canvas.
   * @param {number} height - The height of the canvas.
   */
  const preprocessImage = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale using the luminosity method (more accurate)
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      // Apply a high-contrast threshold
      const color = gray > 128 ? 255 : 0;
      data[i] = color;     // Red
      data[i + 1] = color; // Green
      data[i + 2] = color; // Blue
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const performOCR = useCallback(async (imageSource) => {
    if (!imageSource) return;

    setIsLoading(true);
    setText('');
    setError('');
    setProgress(0);

    try {
      const { data: { text: recognizedText } } = await Tesseract.recognize(
        imageSource,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          },
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        }
      );
      setText(recognizedText.replace(/\n/g, '').trim());
    } catch (err) {
      console.error('OCR Error:', err);
      setError('Could not read the number plate. Please try a clearer image.');
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (stream) stopCamera();
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        setImage(dataUrl);
        setProcessedImage(null); // Clear processed image when new one is uploaded
        performOCR(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setImage(null);
      setProcessedImage(null);
      setText('');
      setError('');
    } catch (err) {
      console.error("Camera Error:", err);
      setError("Could not access the camera. Please check permissions.");
    }
  };

  const captureAndRecognize = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      const { videoWidth, videoHeight } = video;
      
      // Add a check to ensure video dimensions are available before processing
      if (videoWidth === 0 || videoHeight === 0) {
        console.error("Video dimensions are not available yet.");
        setError("Camera not ready. Please try again.");
        return;
      }

      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      // 1. Draw the original image from the video feed onto the canvas
      context.drawImage(video, 0, 0, videoWidth, videoHeight);
      
      // 2. Pre-process the image on the canvas to improve OCR accuracy
      preprocessImage(context, videoWidth, videoHeight);
      const processedImageDataUrl = canvas.toDataURL('image/png');
      
      // 3. Set the processed image for display and stop the camera
      setProcessedImage(processedImageDataUrl);
      stopCamera();
      
      // 4. Perform OCR on the processed image
      performOCR(processedImageDataUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans p-4">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Car Number Plate Scanner</h1>
          <p className="text-gray-500 mt-2">For best results, ensure the plate is well-lit and fills the frame.</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
          <label className="w-full sm:w-auto cursor-pointer bg-white border-2 border-sky-500 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-sky-50 transition-all duration-300 flex items-center justify-center">
            <UploadIcon />
            <span>Upload Image</span>
            <input type='file' className="hidden" onChange={handleFileChange} accept="image/*" />
          </label>
          <button
            onClick={stream ? stopCamera : startCamera}
            className="w-full sm:w-auto bg-white border-2 border-sky-500 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-sky-50 transition-all duration-300 flex items-center justify-center"
          >
            <CameraIcon />
            <span>{stream ? 'Close Camera' : 'Open Camera'}</span>
          </button>
        </div>

        <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed">
          {stream && (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          )}
          {/* Show the processed image if available, otherwise show the original uploaded image */}
          {(processedImage || image) && !stream && (
            <img src={processedImage || image} alt="Number plate" className="object-contain w-full h-full" />
          )}
          {!image && !stream && (
            <p className="text-gray-400">Image or camera preview will appear here</p>
          )}
        </div>
         <canvas ref={canvasRef} style={{ display: 'none' }} />

        {stream && (
          <div className="mt-4 text-center">
            <button
              onClick={captureAndRecognize}
              className="px-8 py-3 bg-sky-500 text-white font-bold rounded-lg hover:bg-sky-600 transition-transform transform hover:scale-105"
              disabled={isLoading}
            >
              {isLoading ? 'Scanning...' : 'Capture & Scan Plate'}
            </button>
          </div>
        )}

        <div className="mt-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center">
              <Spinner />
              <p className="text-gray-600 mt-2">Recognizing text... {progress}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}
          {error && <p className="text-red-500 text-center font-semibold">{error}</p>}
          {!isLoading && (text || image || processedImage) && <ResultDisplay text={text} />}
        </div>
      </div>
       <footer className="text-center text-gray-500 mt-8 text-sm">
          <p>Powered by Tesseract.js</p>
        </footer>
    </div>
  );
}
