import { useEffect, useRef } from 'react';
import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type AudioEngine from '@/lib/AudioEngine';

type Props = {
  engine: AudioEngine | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
};

const INSTRUMENT_COLORS = ['#8b5cf6', '#22d3ee', '#fbbf24', '#fb7185'];
const BAR_COUNT = 64;

const WaveformVisualizer = ({ engine, isPlaying, onTogglePlay }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!engine) return;
    analyserRef.current = engine.getAnalyser();
  }, [engine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      const analyser = analyserRef.current;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (!analyser || !isPlaying) {
        const t = Date.now() / 1000;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const y = h / 2 + Math.sin(x * 0.04 + t * 1.5) * 2;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(139,92,246,0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const barW = w / BAR_COUNT;
      for (let i = 0; i < BAR_COUNT; i++) {
        const idx = Math.floor((i / BAR_COUNT) * bufferLength);
        const value = dataArray[idx] / 255;
        const barH = value * h * 0.85;
        const x = i * barW;
        const color = INSTRUMENT_COLORS[Math.min(3, Math.floor((i / BAR_COUNT) * 4))];
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        const grad = ctx.createLinearGradient(x, h - barH, x, h);
        grad.addColorStop(0, color);
        grad.addColorStop(1, `${color}33`);
        ctx.fillStyle = grad;
        ctx.fillRect(x + 0.5, h - barH, barW - 1.5, barH);
        const grad2 = ctx.createLinearGradient(x, 0, x, barH * 0.4);
        grad2.addColorStop(0, `${color}11`);
        grad2.addColorStop(1, `${color}55`);
        ctx.fillStyle = grad2;
        ctx.fillRect(x + 0.5, 0, barW - 1.5, barH * 0.4);
      }
      ctx.shadowBlur = 0;

      analyser.getByteTimeDomainData(dataArray);
      ctx.beginPath();
      for (let i = 0; i < w; i++) {
        const idx = Math.floor((i / w) * bufferLength);
        const y = ((dataArray[idx] - 128) / 128) * (h * 0.35) + h / 2;
        i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#ffffff';
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying]);

  return (
    <div className="w-full rounded-xl border border-white/10 bg-black/60 backdrop-blur-sm overflow-hidden">
      <canvas
        ref={canvasRef}
        width={900}
        height={100}
        className="w-full h-[100px] block"
      />
      <div className="flex items-center gap-4 px-4 py-3 border-t border-white/5">
        <Button
          variant={isPlaying ? 'destructive' : 'default'}
          size="sm"
          onClick={onTogglePlay}
          className="flex items-center gap-2 min-w-[90px]"
        >
          {isPlaying
            ? <><Square className="h-3.5 w-3.5" /> Stop</>
            : <><Play className="h-3.5 w-3.5" /> Play</>}
        </Button>
        <div className="flex-1 flex items-center gap-0.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full bg-white/10" />
          ))}
        </div>
        <span className="text-xs text-muted-foreground select-none">
          {isPlaying ? 'Live' : 'Ready'}
        </span>
      </div>
    </div>
  );
};

export default WaveformVisualizer;
