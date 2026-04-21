import { useEffect, useRef, useCallback } from 'react';

/**
 * usePhoneDetection
 *
 * Attaches to the student's live webcam stream (via getUserMedia),
 * pipes frames into a Web Worker running COCO-SSD, and calls
 * onDetected(score) whenever a cell phone is seen.
 *
 * @param {boolean}  enabled     — start/stop the detector
 * @param {Function} onDetected  — callback(score) when phone detected in a frame
 * @param {number}   intervalMs  — how often to sample a frame (default 2500 ms)
 */
const usePhoneDetection = (enabled, onDetected, intervalMs = 1000) => {
  const workerRef   = useRef(null);
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const timerRef    = useRef(null);
  const readyRef    = useRef(false);
  const stableRef   = useRef(0); // consecutive positive frames before alerting
  const onDetectedRef = useRef(onDetected);

  // Keep callback ref fresh without re-running effects
  useEffect(() => { onDetectedRef.current = onDetected; }, [onDetected]);

  // ── Capture one frame and send to worker ──────────────────────────────────
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !readyRef.current || video.readyState < 2) return;

    try {
      const bitmap = createImageBitmap(video);
      bitmap.then((bmp) => {
        workerRef.current?.postMessage({ type: 'detect', bitmap: bmp }, [bmp]);
      });
    } catch {
      // Ignore cross-origin / permission errors silently
    }
  }, []);

  // ── Main effect: start worker + camera when enabled ───────────────────────
  useEffect(() => {
    if (!enabled) return;

    // 1. Spin up the worker
    const worker = new Worker('/phoneDetectionWorker.js');
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, detected, score } = e.data;

      if (type === 'ready') {
        readyRef.current = true;
        // Start periodic sampling
        timerRef.current = setInterval(captureFrame, intervalMs);
      }

      if (type === 'result') {
        if (detected) {
          stableRef.current += 1;
          // Trigger after just 1 positive frame for instant detection
          if (stableRef.current >= 1) {
            onDetectedRef.current(score);
            stableRef.current = 0; // reset so we don't spam
          }
        } else {
          stableRef.current = 0;
        }
      }

      if (type === 'error') {
        console.warn('[PhoneDetection]', e.data.message);
      }
    };

    // 2. Acquire webcam (video only, no audio — mic is already handled by Stream)
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.play().catch(() => {});
        videoRef.current = video;
        // Tell the worker to load the model (starts parallel to video init)
        worker.postMessage({ type: 'init' });
      })
      .catch((err) => {
        console.warn('[PhoneDetection] Camera access denied:', err.message);
        worker.terminate();
      });

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      readyRef.current = false;
      clearInterval(timerRef.current);
      worker.terminate();
      workerRef.current = null;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current = null;
      }
    };
  }, [enabled, captureFrame, intervalMs]);
};

export default usePhoneDetection;
