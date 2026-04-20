/**
 * phoneDetectionWorker.js
 * Runs in a Web Worker — loads TensorFlow.js + COCO-SSD from CDN
 * and detects "cell phone" in frames sent by the main thread.
 *
 * Message protocol:
 *   IN  { type: 'init' }                   — load models
 *   IN  { type: 'detect', bitmap: ImageBitmap } — run detection
 *   OUT { type: 'ready' }                  — model loaded
 *   OUT { type: 'result', detected: bool, score: number }
 *   OUT { type: 'error', message: string }
 */

let model = null;

// ── Load TF.js + COCO-SSD via importScripts (CDN) ──────────────────────────
async function loadModel() {
  try {
    importScripts(
      'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js',
      'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js'
    );
    // Use WebGL backend for speed; fall back to CPU
    await tf.setBackend('webgl');
    await tf.ready();
    model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
    postMessage({ type: 'ready' });
  } catch (err) {
    postMessage({ type: 'error', message: err.message });
  }
}

// ── Handle messages from main thread ────────────────────────────────────────
self.onmessage = async (e) => {
  const { type, bitmap } = e.data;

  if (type === 'init') {
    await loadModel();
    return;
  }

  if (type === 'detect') {
    if (!model || !bitmap) return;

    try {
      // Create an OffscreenCanvas and draw the bitmap for inference
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close(); // free memory

      const predictions = await model.detect(canvas);

      const phoneHit = predictions.find(
        (p) => p.class === 'cell phone' && p.score >= 0.45
      );

      postMessage({
        type: 'result',
        detected: !!phoneHit,
        score: phoneHit ? phoneHit.score : 0,
      });
    } catch (err) {
      postMessage({ type: 'error', message: err.message });
    }
  }
};
