import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createWorker } from 'tesseract.js';

// --- Helper Components ---

const Spinner = () => (
  <div className="flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
  </div>
);

const UploadIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const CameraIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CaptureIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const ResultDisplay = ({ plateText, rawText, confidence, isLoading, progress }) => {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="text-center">
          <Spinner />
          <p className="mt-3 text-blue-600 font-medium">Processing image...</p>
          {progress > 0 && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{progress}% complete</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Detection Result</h3>
        <div className="bg-white rounded-lg p-4 mb-4 border-2 border-dashed border-green-300">
          <p className="text-sm text-gray-600 mb-2">Detected Number Plate:</p>
          <p className="text-2xl font-bold tracking-widest text-green-700 uppercase font-mono">
            {plateText || 'No plate detected'}
          </p>
        </div>
        
        {confidence !== null && (
          <div className="text-sm text-gray-600 mb-3">
            OCR Confidence: <span className="font-semibold text-green-600">{confidence.toFixed(1)}%</span>
          </div>
        )}
        
        {rawText && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm text-gray-700 hover:text-gray-900 mb-2">
              📄 View Raw OCR Text
            </summary>
            <pre className="text-xs text-gray-600 bg-gray-100 p-3 rounded-lg whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
              {rawText || '(empty)'}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

const Tips = () => (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
    <h4 className="font-medium text-blue-900 mb-3">💡 Tips for Better Results</h4>
    <ul className="text-sm text-blue-800 space-y-2">
      <li>• Use a clear photo of a <strong>real, printed</strong> number plate.</li>
      <li>• Ensure good lighting and avoid shadows.</li>
      <li>• Hold the camera steady and avoid blur.</li>
      <li>• High-contrast plates (dark on light) give the best results.</li>
    </ul>
  </div>
);


// --- Main OCR Component ---
export default function OCRScanner() {
  const [image, setImage] = useState(null);
  const [plateText, setPlateText] = useState('');
  const [rawText, setRawText] = useState('');
  const [confidence, setConfidence] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [stream, setStream] = useState(null);
  const workerRef = useRef(null);
  const [workerReady, setWorkerReady] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize Tesseract worker on component mount
  useEffect(() => {
    const initTesseract = async () => {
      try {
        console.log('Initializing Tesseract worker...');
        const worker = await createWorker({
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          },
        });
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        await worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        });
        workerRef.current = worker;
        setWorkerReady(true);
        console.log('Tesseract worker initialized successfully');
      } catch (err) {
        console.error('Failed to initialize Tesseract:', err);
        setError('Failed to initialize OCR engine. Please check your network connection and refresh the page.');
      }
    };
    
    initTesseract();

    // Cleanup function to terminate worker and camera stream
    return () => {
      workerRef.current?.terminate();
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []); // Empty dependency array ensures this runs only once

  const extractLikelyPlate = useCallback((text) => {
    if (!text) return '';
    const cleanedText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const patterns = [
      /^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}$/, // Indian: MH12AB1234, DL3CAB1234
      /^[A-Z]{3}\d{4}$/,                   // US: ABC1234
      /^[A-Z]{2}\d{2}[A-Z]{3}$/,           // UK: AB12CDE
    ];
    for (const pattern of patterns) {
        const match = cleanedText.match(pattern);
        if (match) return match[0];
    }
    return cleanedText.length > 5 ? cleanedText : ''; // Fallback for other formats
  }, []);

  const preprocessImage = useCallback((canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const color = gray > 128 ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = color;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }, []);

  const performOCR = useCallback(async (imageSource) => {
    if (!workerRef.current || !workerReady) {
      setError('OCR engine not ready. Please wait.');
      return;
    }

    setIsLoading(true);
    setError('');
    setPlateText('');
    setRawText('');
    setConfidence(null);
    setProgress(0);

    try {
      const { data } = await workerRef.current.recognize(imageSource);
      
      setRawText(data.text);
      setConfidence(data.confidence);
      const extractedPlate = extractLikelyPlate(data.text);
      setPlateText(extractedPlate);
      
      if (!extractedPlate) {
        setError('No valid license plate pattern detected.');
      }
      
    } catch (err) {
      console.error('OCR Error:', err);
      setError('Failed to process the image. Please try a clearer image.');
    } finally {
      setIsLoading(false);
    }
  }, [workerReady, extractLikelyPlate]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (stream) stopCamera();

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageDataUrl = event.target.result;
      setImage(imageDataUrl);
      performOCR(imageDataUrl);
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [stream, stopCamera, performOCR]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setImage(null);
      setError('');
    } catch (err) {
      console.error('Camera Error:', err);
      setError('Could not access camera. Please check permissions.');
    }
  };

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    preprocessImage(canvas);
    
    const imageDataUrl = canvas.toDataURL('image/png');
    setImage(imageDataUrl);
    stopCamera();
    performOCR(imageDataUrl);
  }, [stopCamera, performOCR, preprocessImage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              🚗 Car Number Plate Scanner
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Use AI to detect and read license plates from your camera or an image.
            </p>
            {!workerReady && !error && (
              <div className="mt-4 text-orange-600 flex items-center justify-center">
                <Spinner />
                <p className="ml-2">Initializing OCR engine...</p>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-blue-500 text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 font-medium disabled:opacity-50">
                    <UploadIcon />
                    Upload Image
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isLoading || !workerReady}
                  />
                </label>
                <button
                  onClick={stream ? stopCamera : startCamera}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-medium disabled:opacity-50"
                  disabled={isLoading || !workerReady}
                >
                  <CameraIcon />
                  {stream ? 'Close Camera' : 'Open Camera'}
                </button>
              </div>

              <div className="relative">
                <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden border-4 border-gray-200 shadow-lg">
                  {stream ? (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  ) : image ? (
                    <img src={image} alt="For analysis" className="w-full h-full object-contain bg-gray-800" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-400">
                        <div className="mx-auto mb-4"><CaptureIcon /></div>
                        <p>Camera feed or image will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
                {stream && workerReady && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <button
                      onClick={captureImage}
                      className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 font-bold shadow-lg hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                      disabled={isLoading}
                    >
                      <CaptureIcon />
                      {isLoading ? 'Processing...' : 'Capture & Scan'}
                    </button>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">❌</span>
                    <p className="text-red-700 font-medium">Error</p>
                  </div>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              )}
              {(isLoading || plateText || rawText) && !error && (
                <ResultDisplay
                  plateText={plateText}
                  rawText={rawText}
                  confidence={confidence}
                  isLoading={isLoading}
                  progress={progress}
                />
              )}
              <Tips />
            </div>
          </div>

          <div className="text-center mt-12 text-sm text-gray-500">
            <p>Powered by Tesseract.js • All processing is done on your device.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
