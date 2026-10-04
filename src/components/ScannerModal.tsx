import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Check, RefreshCw, Search } from 'lucide-react';
import Tesseract from 'tesseract.js';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
};

type Word = {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

const JUNK_PATTERNS = [
  /^compresse?$/i,
  /^capsule?$/i,
  /^soluzione$/i,
  /^sciroppo$/i,
  /^uso\s+orale$/i,
  /^uso$/i,
  /^orale$/i,
  /^scatola$/i,
  /^scatola\s+da$/i,
  /^a\.?i\.?c\.?$/i,
  /^aic$/i,
  /^mg$/i,
  /^g$/i,
  /^ml$/i,
  /^mcg$/i,
  /^\d+\s*(?:mg|g|ml|mcg)$/i,
  /^comp$/i,
  /^cpr$/i,
  /^rivestita$/i,
  /^rivestite$/i,
  /^gastroresistenti$/i,
  /^gastroresistente$/i,
  /^a\s+rilascio$/i,
  /^prolungato$/i,
  /^modificato$/i,
  /^eccipienti$/i,
  /^principio$/i,
  /^attivo$/i,
  /^s\.p\.a\.?$/i,
  /^farmaceutica$/i,
  /^produzione$/i,
  /^distributore$/i,
  /^laboratori$/i,
  /^[®™]+$/,
];

export default function ScannerModal({ open, onClose, onConfirm }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [editableName, setEditableName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError('Impossibile accedere alla fotocamera. Verifica i permessi del browser.');
    }
  }, []);

  useEffect(() => {
    if (open) {
      setResult(null);
      setEditableName('');
      void startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setScanning(true);
    setError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setScanning(false);
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const { data } = await Tesseract.recognize(canvas, 'ita+eng', {
        logger: () => {},
      });

      const words = (data.words as unknown as Word[] | undefined) ?? [];
      if (words.length === 0) {
        setError('Nessun testo rilevato. Riprova avvicinando la confezione.');
        setScanning(false);
        return;
      }

      const candidates = words
        .map((w) => {
          const text = w.text.trim();
          const height = w.bbox.y1 - w.bbox.y0;
          const width = w.bbox.x1 - w.bbox.x0;
          return { text, height, width, bbox: w.bbox };
        })
        .filter((w) => {
          if (w.text.length < 2) return false;
          if (JUNK_PATTERNS.some((p) => p.test(w.text))) return false;
          if (/^\d+$/.test(w.text)) return false;
          return true;
        });

      if (candidates.length === 0) {
        setError('Nessun nome valido rilevato. Assicurati che il nome commerciale sia ben visibile.');
        setScanning(false);
        return;
      }

      candidates.sort((a, b) => b.height - a.height);

      const tallest = candidates[0];
      const lineHeight = tallest.height * 0.7;
      const sameLine = candidates.filter(
        (w) =>
          Math.abs(w.bbox.y0 - tallest.bbox.y0) < lineHeight &&
          Math.abs(w.bbox.y1 - tallest.bbox.y1) < lineHeight
      );
      sameLine.sort((a, b) => a.bbox.x0 - b.bbox.x0);
      const mergedName = sameLine.map((w) => w.text).join(' ').trim();

      const cleaned = mergedName
        .replace(/\s*(?:mg|g|ml|mcg)\s*$/i, '')
        .replace(/\s*\d+\s*(?:mg|g|ml|mcg)\s*$/i, '')
        .trim();

      setResult(cleaned || mergedName);
      setEditableName(cleaned || mergedName);
    } catch {
      setError('Errore durante la lettura OCR. Riprova.');
    }
    setScanning(false);
  };

  const handleConfirm = () => {
    if (editableName.trim()) {
      onConfirm(editableName.trim());
      onClose();
    }
  };

  const handleRetry = () => {
    setResult(null);
    setEditableName('');
    void startCamera();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg p-6 animate-slide-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Scanner Farmaco</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!result && (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span className="text-sm text-white">Lettura in corso...</span>
                  </div>
                </div>
              )}
              <div className="pointer-events-none absolute inset-4 border-2 border-teal-400/60 rounded-lg" />
            </div>
            <p className="text-sm text-slate-600 text-center">
              Inquadra la confezione. Lo scanner leggera il nome commerciale (il testo piu grande in grassetto).
            </p>
            <button
              onClick={captureAndScan}
              disabled={scanning}
              className="btn-primary w-full"
            >
              {scanning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Lettura...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Acquisisci e leggi
                </>
              )}
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
              <p className="text-xs text-teal-600 font-medium mb-1">Nome rilevato (modificabile):</p>
              <div className="relative">
                <input
                  type="text"
                  value={editableName}
                  onChange={(e) => setEditableName(e.target.value)}
                  className="input pr-10 text-lg font-semibold"
                  autoFocus
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Se il nome non e corretto, puoi correggerlo qui prima di confermare.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleRetry} className="btn-secondary flex-1">
                <RefreshCw className="h-4 w-4" />
                Riprova
              </button>
              <button onClick={handleConfirm} className="btn-primary flex-1">
                <Check className="h-4 w-4" />
                Conferma
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
