import { useState, useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Play, Square, Volume2, BarChart2, Shuffle, Circle, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BeatPattern } from '@/types/beat';
import type AudioEngine from '@/lib/AudioEngine';

type Props = {
  beat: BeatPattern;
  isPlaying: boolean;
  onBeatChange?: (beat: BeatPattern) => void;
  onTogglePlay: () => void;
  engine?: AudioEngine | null;
};

const INSTRUMENTS = ['kick', 'snare', 'hihat', 'percussion'] as const;
type Instrument = typeof INSTRUMENTS[number];

const INSTRUMENT_COLORS: Record<Instrument, string> = {
  kick: 'bg-violet-500', snare: 'bg-cyan-400',
  hihat: 'bg-amber-400', percussion: 'bg-rose-400',
};
const INSTRUMENT_ACTIVE: Record<Instrument, string> = {
  kick:       'bg-violet-500/90 shadow-[0_0_8px_2px_rgba(139,92,246,0.6)]',
  snare:      'bg-cyan-400/90 shadow-[0_0_8px_2px_rgba(34,211,238,0.6)]',
  hihat:      'bg-amber-400/90 shadow-[0_0_8px_2px_rgba(251,191,36,0.6)]',
  percussion: 'bg-rose-400/90 shadow-[0_0_8px_2px_rgba(251,113,133,0.6)]',
};

const BeatVisualizer = ({ beat, isPlaying, onBeatChange, onTogglePlay, engine }: Props) => {
  const [currentBeat, setCurrentBeat] = useState<BeatPattern>(beat);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [volumes, setVolumes] = useState<Record<Instrument, number>>({
    kick: 1, snare: 1, hihat: 0.8, percussion: 0.9,
  });
  const [swing, setSwing] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!engine) return;
    engine.onStep((step) => setActiveStep(step));
  }, [engine]);

  useEffect(() => { if (!isPlaying) setActiveStep(-1); }, [isPlaying]);
  useEffect(() => { setCurrentBeat(beat); }, [beat]);

  const handleVolumeChange = (inst: Instrument, value: number[]) => {
    setVolumes(prev => ({ ...prev, [inst]: value[0] }));
    engine?.setVolume(inst, value[0]);
  };

  const handleSwingChange = (value: number[]) => {
    setSwing(value[0]);
    engine?.setSwing(value[0]);
  };

  const toggleStep = (inst: Instrument, step: number) => {
    const pattern = [...(currentBeat.patterns[inst] || Array(16).fill(false))];
    pattern[step] = !pattern[step];
    const newBeat: BeatPattern = { ...currentBeat, patterns: { ...currentBeat.patterns, [inst]: pattern } };
    setCurrentBeat(newBeat);
    onBeatChange?.(newBeat);
  };

  const randomizePattern = (inst: Instrument) => {
    const density: Record<Instrument, number> = { kick: 0.25, snare: 0.2, hihat: 0.5, percussion: 0.2 };
    const pattern = Array.from({ length: 16 }, () => Math.random() < density[inst]);
    const newBeat: BeatPattern = { ...currentBeat, patterns: { ...currentBeat.patterns, [inst]: pattern } };
    setCurrentBeat(newBeat);
    onBeatChange?.(newBeat);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setRecordSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordSeconds(prev => prev + 1);
    }, 1000);
  };

  const handlePauseRecording = () => {
    setIsPaused(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    setRecordSeconds(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full rounded-xl p-4 space-y-5 border border-white/10 bg-black/40 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{currentBeat.name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span className="uppercase tracking-wide">{currentBeat.genre}</span>
            <span>•</span>
            <span>{currentBeat.bpm} BPM</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Swing</span>
            <Slider value={[swing]} min={0} max={0.45} step={0.05} className="w-20" onValueChange={handleSwingChange} />
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={handleStartRecording}
              disabled={isRecording && !isPaused}
              size="icon"
              className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700"
            >
              <Circle className="h-3 w-3 fill-current" />
            </Button>
            <Button
              onClick={handlePauseRecording}
              disabled={!isRecording || isPaused}
              size="icon"
              variant="outline"
              className="h-8 w-8 p-0 border-white/20 hover:bg-white/10"
            >
              <Pause className="h-3 w-3" />
            </Button>
            <Button
              onClick={handleStopRecording}
              disabled={!isRecording}
              size="icon"
              variant="outline"
              className="h-8 w-8 p-0 border-white/20 hover:bg-white/10"
            >
              <Square className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-sm font-mono text-muted-foreground w-12 text-right">
            {formatTime(recordSeconds)}
          </div>
          <Button variant={isPlaying ? 'destructive' : 'default'} size="icon" onClick={onTogglePlay} className="h-10 w-10">
            {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {INSTRUMENTS.map((inst) => (
          <div key={inst} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${INSTRUMENT_COLORS[inst]}`} />
                <span className="text-xs font-medium capitalize">{inst}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5 opacity-40 hover:opacity-100"
                  title="Randomize" onClick={() => randomizePattern(inst)}>
                  <Shuffle className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-1.5">
                <Volume2 className="h-3 w-3 text-muted-foreground" />
                <Slider value={[volumes[inst]]} min={0} max={1} step={0.01} className="w-20"
                  onValueChange={(v) => handleVolumeChange(inst, v)} />
              </div>
            </div>
            <div className="flex gap-1">
              {[0,1,2,3].map(group => (
                <div key={group} className="flex gap-0.5 flex-1">
                  {[0,1,2,3].map(offset => {
                    const step = group * 4 + offset;
                    const active = currentBeat.patterns[inst]?.[step];
                    const isCurrent = activeStep === step;
                    return (
                      <button key={step} onClick={() => toggleStep(inst, step)}
                        className={`flex-1 h-9 rounded transition-all duration-75 border ${
                          active ? `${INSTRUMENT_ACTIVE[inst]} border-white/20`
                          : isCurrent ? 'bg-white/20 border-white/30'
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                        } ${isCurrent && !active ? 'ring-1 ring-white/40' : ''}`}
                        aria-label={`${inst} step ${step + 1}`}>
                        {active && <BarChart2 className="h-3 w-3 mx-auto text-black/50" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-0.5 h-1">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className={`flex-1 rounded-full transition-all duration-75 ${activeStep === i ? 'bg-primary' : 'bg-white/10'}`} />
        ))}
      </div>
    </div>
  );
};

export default BeatVisualizer;
