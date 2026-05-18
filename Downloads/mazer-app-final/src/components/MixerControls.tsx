import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Volume2, Clock, Sliders, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { BeatPattern } from '@/types/beat';

type Props = {
  beat: BeatPattern;
  onSave: (beat: BeatPattern) => Promise<BeatPattern>;
  onMasterVolumeChange?: (volume: number) => void;
  onTempoChange?: (bpm: number) => void;
};

const MixerControls = ({ beat, onSave, onMasterVolumeChange, onTempoChange }: Props) => {
  const [localBeat, setLocalBeat] = useState(beat);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { setLocalBeat(beat); }, [beat]);

  const handleTempoChange = (values: number[]) => {
    const bpm = values[0];
    setLocalBeat(prev => ({ ...prev, bpm }));
    onTempoChange?.(bpm);
  };

  const handleVolumeChange = (values: number[]) => {
    const vol = values[0];
    setMasterVolume(vol);
    onMasterVolumeChange?.(vol);
  };

  const handlePreset = (bpm: number) => {
    setLocalBeat(prev => ({ ...prev, bpm }));
    onTempoChange?.(bpm);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const saved = await onSave(localBeat);
      setLocalBeat(saved);
      toast.success('Beat saved to your library!');
    } catch {
      toast.error('Failed to save. Are you logged in?');
    } finally {
      setIsSaving(false);
    }
  };

  const exportAsJSON = () => {
    const blob = new Blob([JSON.stringify(localBeat, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${localBeat.name.replace(/\s+/g, '_')}_pattern.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Pattern exported!');
  };

  return (
    <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Sliders className="h-4 w-4" /> Mixer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /><span>Tempo</span>
            </div>
            <span className="font-mono font-medium">{localBeat.bpm} BPM</span>
          </div>
          <Slider value={[localBeat.bpm]} min={60} max={200} step={1} onValueChange={handleTempoChange} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>60</span><span>130</span><span>200</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Volume2 className="h-3.5 w-3.5" /><span>Master Volume</span>
            </div>
            <span className="font-mono font-medium">{Math.round(masterVolume * 100)}%</span>
          </div>
          <Slider value={[masterVolume]} min={0} max={1} step={0.01} onValueChange={handleVolumeChange} />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">BPM Presets</p>
          <div className="flex gap-1.5 flex-wrap">
            {[
              { label: 'Lo-Fi', bpm: 85 },
              { label: 'Hip-Hop', bpm: 95 },
              { label: 'House', bpm: 128 },
              { label: 'Trap', bpm: 140 },
              { label: 'D&B', bpm: 174 },
            ].map(({ label, bpm }) => (
              <button key={label}
                onClick={() => handlePreset(bpm)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  localBeat.bpm === bpm
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
                }`}>
                {label} {bpm}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1 border-white/10" onClick={exportAsJSON}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : <><Save className="mr-2 h-4 w-4" />Save</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MixerControls;
