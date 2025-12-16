import React, { useEffect, useRef } from 'react';
import { AudioVisualizerProps } from '../types';

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, isActive, color = '#f57c00' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isActive) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) * 0.4; // Base radius

      ctx.beginPath();
      
      // Draw a circular waveform
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] * 0.5; // Scale down
        const angle = (i / bufferLength) * Math.PI * 2;
        
        // Create a seamless circle
        const r = radius + barHeight;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.stroke();

      // Glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      
      // Inner fill
      ctx.fillStyle = `${color}33`; // 20% opacity
      ctx.fill();
      
      // Reset shadow for next frame performance
      ctx.shadowBlur = 0;
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser, isActive, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={300} 
      className="w-full h-full max-w-[300px] max-h-[300px]"
    />
  );
};

export default AudioVisualizer;