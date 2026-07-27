'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Loader2 } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const readerId = 'barcode-reader';
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    const scanner = new Html5Qrcode(readerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          onScan(decodedText);
          scanner.stop().catch(() => {});
        },
        () => {} // ignore scan failures
      )
      .then(() => setStarting(false))
      .catch((err) => {
        setStarting(false);
        setError('Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.');
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Camera className="h-4 w-4 text-[#F97316]" /> Scan Barcode / QR Code
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">
          {starting && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#F97316]" />
              <span className="ml-2 text-sm text-slate-500">Membuka kamera...</span>
            </div>
          )}
          {error ? (
            <div className="py-8 text-center">
              <Camera className="h-10 w-10 mx-auto text-red-400 mb-3" />
              <p className="text-sm text-red-500">{error}</p>
              <p className="text-xs text-slate-400 mt-2">Coba gunakan browser Chrome dan aktifkan izin kamera.</p>
            </div>
          ) : (
            <div id={readerId} className="rounded-xl overflow-hidden" />
          )}
          <p className="text-xs text-slate-400 text-center mt-3">
            Arahkan kamera ke barcode atau QR Code barang
          </p>
        </div>
      </div>
    </div>
  );
}
