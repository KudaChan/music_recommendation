'use client';

import { useRef, useEffect, useMemo } from 'react';

interface MusicVisualizerProps {
  isPlaying: boolean;
}

export default function MusicVisualizer({ isPlaying }: MusicVisualizerProps) {
  'use memo';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    
    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);
    
    // Create audio context and analyzer
    let audioContext: AudioContext | undefined;
    let analyzer: AnalyserNode | undefined;
    let dataArray: Uint8Array | undefined;
    
    const setupAudio = async () => {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 256;
        
        const bufferLength = analyzer.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        // Connect to audio source if possible
        // This is just a demo visualization without actual audio input
      } catch (error) {
        console.error('Audio context setup failed:', error);
      }
    };
    
    setupAudio();
    
    // Animation function
    const animate = () => {
      if (!ctx || !isPlaying) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Demo visualization with random data
      const barWidth = canvas.width / 64;
      let x = 0;
      
      for (let i = 0; i < 64; i++) {
        // Generate random height for demo
        const height = isPlaying ? 
          Math.random() * (canvas.height * 0.8) + (canvas.height * 0.1) : 
          canvas.height * 0.1;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(0.5, '#8b5cf6');
        gradient.addColorStop(1, '#ec4899');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - height, barWidth - 1, height);
        
        x += barWidth;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', setCanvasDimensions);
      audioContext?.close();
    };
  }, [isPlaying]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-16 rounded-lg bg-black/5 dark:bg-white/5"
    />
  );
}