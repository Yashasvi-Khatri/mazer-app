import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Wand2, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { BeatPattern } from '@/types/beat';

const EXAMPLE_PROMPTS = [
  'A dark trap beat with heavy 808s and fast hi-hats',
  'Classic boom bap hip-hop with swinging drums',
  'Four-on-the-floor house beat with an offbeat hi-hat',
  'Reggaeton dembow with syncopated percussion',
  'Afrobeats groove with intricate percussion patterns',
  'Lo-fi chill hip-hop with a relaxed swing feel',
];

type Props = {
  onBeatGenerated: (beat: BeatPattern) => void;
  onStop?: () => void;
};

const BeatGenerator = ({ onBeatGenerated, onStop }: Props) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState('');

  const STAGES = [
    'Analyzing your prompt…',
    'Composing kick pattern…',
    'Layering snare and hi-hats…',
    'Adding percussion groove…',
    'Finalizing beat…',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Describe the beat you want');
      return;
    }
    try {
      setIsGenerating(true);

      // Animate stage messages while waiting
      let stageIdx = 0;
      setGenerationStage(STAGES[0]);
      const stageInterval = setInterval(() => {
        stageIdx = (stageIdx + 1) % STAGES.length;
        setGenerationStage(STAGES[stageIdx]);
      }, 900);

      const beat = await api.generateBeat(prompt);
      clearInterval(stageInterval);
      setGenerationStage('');
      toast.success('Beat generated!');
      onBeatGenerated(beat);
    } catch (err) {
      console.error(err);
      toast.error('Generation failed. Try again.');
    } finally {
      setIsGenerating(false);
      setGenerationStage('');
    }
  };

  return (
    <Card className="w-full border-border bg-card/40 backdrop-blur-sm">
      <CardContent className="pt-5 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Describe your beat</label>
          <Textarea
            placeholder="e.g. A dark trap beat with heavy 808s and fast hi-hats at 140 BPM…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="resize-none min-h-[80px] bg-accent/5 border-border"
            disabled={isGenerating}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleGenerate(); }}
          />
        </div>

        {/* Generation stage indicator */}
        {isGenerating && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="animate-pulse">{generationStage}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="flex-1">
            {isGenerating
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</>
              : <><Wand2 className="mr-2 h-4 w-4" />Generate Beat</>
            }
          </Button>
          {onStop && (
            <Button variant="outline" onClick={onStop} className="border-white/10">
              Stop
            </Button>
          )}
        </div>

        {/* Quick prompts */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3" /> Quick prompts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                className="text-xs px-2.5 py-1 rounded-full border border-border bg-accent/5 hover:bg-accent/10 transition-colors text-muted-foreground hover:text-foreground"
                disabled={isGenerating}
              >
                {p.length > 35 ? p.slice(0, 35) + '…' : p}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BeatGenerator;
