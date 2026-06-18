'use client';

import React, { useState, useCallback, useRef } from 'react';
import { FileUploader } from '../FileUploader';
import { ProcessingProgress, ProcessingStatus } from '../ProcessingProgress';
import { DownloadButton } from '../DownloadButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { addBackgroundColor } from '@/lib/pdf/processors/background-color';
import type { ProcessOutput } from '@/types/pdf';

export interface BackgroundColorToolProps { className?: string; }

export function BackgroundColorTool({ className = '' }: BackgroundColorToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [color, setColor] = useState('#fffde7');
  const cancelledRef = useRef(false);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 } : { r: 1, g: 1, b: 0.9 };
  };

  const handleProcess = useCallback(async () => {
    if (!file) return;
    cancelledRef.current = false;
    setStatus('processing'); setProgress(0); setError(null); setResult(null);
    try {
      const output: ProcessOutput = await addBackgroundColor(file, { color: hexToRgb(color), pages: 'all' }, (prog) => { if (!cancelledRef.current) setProgress(prog); });
      if (output.success && output.result) { setResult(output.result as Blob); setStatus('complete'); }
      else { setError(output.error?.message || 'Failed.'); setStatus('error'); }
    } catch (err) { setError(err instanceof Error ? err.message : 'Error'); setStatus('error'); }
  }, [file, color]);

  const isProcessing = status === 'processing';

  return (
    /* Main container ko screen-size kiya aur relative banaya */
    <div className={`relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden ${className}`.trim()}>
      
      {/* 1. Live Video Background Layer */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0 pointer-events-none"
      >
        {/* Aapne jo live video download ki hogi, uska path yahan aayega */}
        <source src="/videos/car-bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* 2. Dark Overlay taake background zyada bright na lage aur text saaf dikhe */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/40 z-10 pointer-events-none" />

      {/* 3. Original Content Card (With Glassmorphism Effect for better contrast) */}
      <div className="relative z-20 w-full max-w-2xl bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl space-y-6 text-white">
        
        {!file && (
          <FileUploader 
            accept={['application/pdf', '.pdf']} 
            multiple={false} 
            maxFiles={1} 
            onFilesSelected={(files) => { if (files.length > 0) { setFile(files[0]); setError(null); setResult(null); } }} 
            onError={setError} 
            disabled={isProcessing} 
            label="Upload PDF File" 
            description="Drag and drop a PDF file here." 
          />
        )}
        
        {error && (
          <div className="p-4 rounded bg-red-500/20 border border-red-500/40 text-red-200">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {file && (
          <>
            <Card variant="outlined" className="bg-white/5 border-white/10">
              <div className="flex items-center justify-between">
                <p className="font-medium text-white">{file.name}</p>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={() => { setFile(null); setResult(null); }} disabled={isProcessing}>
                  Remove
                </Button>
              </div>
            </Card>
            
            <Card variant="outlined" size="lg" className="bg-white/5 border-white/10">
              <label className="block text-sm font-medium mb-2 text-white">Background Color</label>
              <div className="flex items-center gap-4">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-16 h-10 border rounded cursor-pointer bg-transparent" disabled={isProcessing} />
                <input type="text" value={color} onChange={(e) => setColor(e.target.value)} className="px-3 py-2 border rounded w-32 bg-white/10 text-white border-white/20 focus:outline-none" disabled={isProcessing} />
              </div>
            </Card>
          </>
        )}
        
        {isProcessing && <ProcessingProgress progress={progress} status={status} onCancel={() => { cancelledRef.current = true; setStatus('idle'); }} showPercentage />}
        
        {file && (
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" size="lg" onClick={handleProcess} disabled={!file || isProcessing} loading={isProcessing}>
              {isProcessing ? 'Processing...' : 'Add Background'}
            </Button>
            {result && <DownloadButton file={result} filename={file.name.replace('.pdf', '_background.pdf')} variant="secondary" size="lg" showFileSize />}
          </div>
        )}
        
        {status === 'complete' && result && (
          <div className="p-4 rounded bg-green-500/20 border border-green-500/40 text-green-200">
            <p className="text-sm font-medium">Background color added!</p>
          </div>
        )}
      </div>
    </div>
  );
}
