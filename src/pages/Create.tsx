import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import BeatGenerator from '@/components/BeatGenerator';
import BeatVisualizer from '@/components/BeatVisualizer';
import MixerControls from '@/components/MixerControls';
import WaveformVisualizer from '@/components/WaveformVisualizer';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { saveBeat, getBeats } from '@/services/beatsService';
import { auth } from '@/firebase';
import type { BeatPattern } from '@/types/beat';
import { Loader2 } from 'lucide-react';
import AudioEngine from '@/lib/AudioEngine';

const Create = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentBeat, setCurrentBeat] = useState<BeatPattern | null>(null);
  const [isLoadingBeat, setIsLoadingBeat] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const engineRef = useRef<AudioEngine | null>(null);
  const [engineReady, setEngineReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); toast.error('Please log in to create beats'); }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const engine = new AudioEngine();
    engine.init().then(() => { engineRef.current = engine; setEngineReady(true); });
    return () => { engine.destroy(); };
  }, []);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id && isAuthenticated) {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      setIsLoadingBeat(true);
      getBeats(currentUser.uid)
        .then(beats => { const found = beats.find(b => b.id === id); if (found) setCurrentBeat(found); })
        .catch(() => toast.error('Could not load beat'))
        .finally(() => setIsLoadingBeat(false));
    }
  }, [searchParams, isAuthenticated]);

  useEffect(() => {
    if (!currentBeat || !engineRef.current) return;
    const numeric: Record<string, number[]> = {};
    for (const [k, v] of Object.entries(currentBeat.patterns)) {
      numeric[k] = (v as any[]).map((x: any) => (x ? 1 : 0));
    }
    engineRef.current.setPatterns(numeric, currentBeat.bpm);
  }, [currentBeat]);

  const handleBeatChange = (updated: BeatPattern) => setCurrentBeat(updated);

  const handleSaveBeat = async (beat: BeatPattern): Promise<BeatPattern> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error('User not authenticated');
      throw new Error('User not authenticated');
    }
    
    try {
      const beatData = {
        ...beat,
        userId: currentUser.uid,
        patterns: {
          kick: beat.patterns.kick.map(x => x ? 1 : 0),
          snare: beat.patterns.snare.map(x => x ? 1 : 0),
          hihat: beat.patterns.hihat.map(x => x ? 1 : 0),
          percussion: beat.patterns.percussion.map(x => x ? 1 : 0),
        },
      };
      
      const id = await saveBeat(currentUser.uid, beatData);
      const saved = { ...beat, id };
      setCurrentBeat(saved);
      toast.success('Beat saved successfully');
      return saved;
    } catch (error) {
      console.error('Failed to save beat', error);
      toast.error('Failed to save beat. Please try again.');
      throw error;
    }
  };

  const handleMasterVolume = useCallback((volume: number) => {
    engineRef.current?.setMasterVolume(volume);
  }, []);

  const handleTempoChange = useCallback((bpm: number) => {
    engineRef.current?.setBpm(bpm);
    setCurrentBeat(prev => prev ? { ...prev, bpm } : prev);
  }, []);

  const handleTogglePlay = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (isPlaying) { engine.stop(); setIsPlaying(false); }
    else { engine.play(); setIsPlaying(true); }
  }, [isPlaying]);

  if (!isAuthenticated) return null;

  return (
    <Layout fullWidth>
      <div className="max-w-screen-xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Beat</h1>
          <p className="text-muted-foreground mt-1">Generate and customize your beat using AI</p>
        </div>

        {isLoadingBeat ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <BeatGenerator onBeatGenerated={(beat) => {
                  setCurrentBeat(beat);
                  setIsPlaying(false);
                  engineRef.current?.stop();
                }} />
                {currentBeat && (
                  <MixerControls
                    beat={currentBeat}
                    onSave={handleSaveBeat}
                    onMasterVolumeChange={handleMasterVolume}
                    onTempoChange={handleTempoChange}
                  />
                )}
              </div>

              <div className="lg:col-span-2 flex flex-col gap-4">
                {currentBeat ? (
                  <>
                    <BeatVisualizer
                      beat={currentBeat}
                      isPlaying={isPlaying}
                      engine={engineRef.current}
                      onBeatChange={handleBeatChange}
                      onTogglePlay={handleTogglePlay}
                    />
                    {engineReady && (
                      <div className="flex-1 min-h-[300px]">
                        <WaveformVisualizer
                          engine={engineRef.current}
                          isPlaying={isPlaying}
                          onTogglePlay={handleTogglePlay}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full min-h-[300px] flex items-center justify-center rounded-xl border border-white/10 bg-black/40 text-center p-8">
                    <div className="max-w-md space-y-2">
                      <h3 className="text-xl font-semibold">No beat yet</h3>
                      <p className="text-muted-foreground text-sm">
                        Describe your beat on the left — the AI will generate a full 16-step pattern for you.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Create;
