import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, Square, Mic, Download, Save } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Synthesize tones with Web Audio API — no sample files needed
function createAudioContext() {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
}

type Note = { note: string; freq: number };

const PIANO_NOTES: Note[] = [
  { note: 'C4', freq: 261.63 }, { note: 'D4', freq: 293.66 },
  { note: 'E4', freq: 329.63 }, { note: 'F4', freq: 349.23 },
  { note: 'G4', freq: 392.00 }, { note: 'A4', freq: 440.00 },
  { note: 'B4', freq: 493.88 }, { note: 'C5', freq: 523.25 },
];

const BASS_NOTES: Note[] = [
  { note: 'E2', freq: 82.41 }, { note: 'A2', freq: 110.00 },
  { note: 'D3', freq: 146.83 }, { note: 'G3', freq: 196.00 },
];

const SYNTH_PADS = ['Pad 1', 'Pad 2', 'Pad 3', 'Pad 4'];
const SYNTH_FREQS = [220, 330, 440, 550];

const DRUM_PADS = ['Kick', 'Snare', 'Hi-Hat', 'Clap'];

const InstrumentsCluster = () => {
  const { user } = useAuth();
  const [volumes, setVolumes] = useState({ piano: 0.7, drums: 0.8, bass: 0.7, synth: 0.6 });
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [recordingTitle, setRecordingTitle] = useState('');
  const [recordingDescription, setRecordingDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = createAudioContext();
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  };

  const playTone = useCallback((
    type: OscillatorType,
    freq: number,
    volume: number,
    duration = 0.5,
    keyId?: string
  ) => {
    const ctx = getCtx();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    if (destRef.current) gain.connect(destRef.current);
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (type === 'sine' && freq < 200) {
      // Bass sweep
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + duration);
    }
    osc.connect(gain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
    if (keyId) {
      setActiveKey(keyId);
      setTimeout(() => setActiveKey(null), duration * 400);
    }
  }, []);

  const playDrum = useCallback((pad: string, vol: number) => {
    const ctx = getCtx();
    const keyId = `drum-${pad}`;
    setActiveKey(keyId);
    setTimeout(() => setActiveKey(null), 150);

    if (pad === 'Kick') {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      env.gain.setValueAtTime(vol * 1.5, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      if (destRef.current) env.connect(destRef.current);
      osc.connect(env); env.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.5);
    } else if (pad === 'Snare' || pad === 'Clap') {
      const len = Math.floor(ctx.sampleRate * 0.15);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass'; filter.frequency.value = pad === 'Clap' ? 1500 : 800;
      const env = ctx.createGain();
      env.gain.setValueAtTime(vol, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      if (destRef.current) env.connect(destRef.current);
      noise.connect(filter); filter.connect(env); env.connect(ctx.destination);
      noise.start(); noise.stop(ctx.currentTime + 0.15);
    } else {
      // Hi-Hat
      const len = Math.floor(ctx.sampleRate * 0.06);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = 8000;
      const env = ctx.createGain();
      env.gain.setValueAtTime(vol * 0.7, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      if (destRef.current) env.connect(destRef.current);
      noise.connect(filter); filter.connect(env); env.connect(ctx.destination);
      noise.start(); noise.stop(ctx.currentTime + 0.06);
    }
  }, []);

  const handleRecord = async () => {
    if (isRecording) {
      recorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const ctx = getCtx();
    destRef.current = ctx.createMediaStreamDestination();
    recorderRef.current = new MediaRecorder(destRef.current.stream);
    chunksRef.current = [];
    recorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setRecordedUrl(URL.createObjectURL(blob));
      toast.success('Recording saved!');
    };
    recorderRef.current.start();
    setIsRecording(true);
    toast.info('Recording started — play some notes!');
  };

  const handleSaveRecording = async () => {
    if (!user || !recordedUrl) {
      toast.error('You must be logged in to save recordings');
      return;
    }
    if (!recordingTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      setIsSaving(true);
      // Convert blob URL to actual blob
      const response = await fetch(recordedUrl);
      const blob = await response.blob();

      // In a real app, you'd upload the blob to Firebase Storage
      // For now, we'll save the metadata to Firestore
      const recordingData = {
        title: recordingTitle,
        description: recordingDescription,
        type: 'instrument',
        createdAt: serverTimestamp(),
        userId: user.id,
        // In production: audioUrl would be the Firebase Storage URL
        audioUrl: recordedUrl, // This is temporary, won't persist across sessions
      };

      await addDoc(collection(db, 'users', user.id, 'recordings'), recordingData);
      toast.success('Recording saved to your library!');
      setRecordingTitle('');
      setRecordingDescription('');
      setRecordedUrl(null);
    } catch (error) {
      console.error('Error saving recording:', error);
      toast.error('Failed to save recording');
    } finally {
      setIsSaving(false);
    }
  };

  const setVol = (inst: keyof typeof volumes, v: number[]) =>
    setVolumes(prev => ({ ...prev, [inst]: v[0] }));

  return (
    <Card className="w-full border-border bg-card/40 backdrop-blur-sm">
      <CardContent className="p-5 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Live Instruments</h3>
          <Button variant={isRecording ? 'destructive' : 'outline'} size="sm"
            onClick={handleRecord} className="gap-1.5 border-border">
            {isRecording ? <><Square className="h-3.5 w-3.5" />Stop Rec</> : <><Mic className="h-3.5 w-3.5" />Record</>}
          </Button>
        </div>

        {/* Piano */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Piano</span>
            <div className="flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
              <Slider value={[volumes.piano]} min={0} max={1} step={0.01} className="w-20"
                onValueChange={(v) => setVol('piano', v)} />
            </div>
          </div>
          <div className="flex gap-1">
            {PIANO_NOTES.map(({ note, freq }) => {
              const isBlack = note.includes('#');
              const isActive = activeKey === `piano-${note}`;
              return (
                <button key={note}
                  onMouseDown={() => playTone('triangle', freq, volumes.piano, 0.8, `piano-${note}`)}
                  className={`flex-1 rounded-b-md transition-colors ${
                    isBlack ? 'h-14 bg-zinc-900 border border-zinc-600' : 'h-20 bg-white border border-zinc-300'
                  } ${isActive ? 'opacity-60' : ''} hover:opacity-80 active:opacity-60 flex items-end justify-center pb-1`}
                  aria-label={note}>
                  <span className={`text-[10px] ${isBlack ? 'text-zinc-400' : 'text-zinc-500'}`}>{note}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drums */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Drums</span>
            <div className="flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
              <Slider value={[volumes.drums]} min={0} max={1} step={0.01} className="w-20"
                onValueChange={(v) => setVol('drums', v)} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {DRUM_PADS.map((pad) => {
              const isActive = activeKey === `drum-${pad}`;
              const colors: Record<string, string> = {
                Kick: 'bg-violet-600 hover:bg-violet-500',
                Snare: 'bg-cyan-600 hover:bg-cyan-500',
                'Hi-Hat': 'bg-amber-600 hover:bg-amber-500',
                Clap: 'bg-rose-600 hover:bg-rose-500',
              };
              return (
                <button key={pad}
                  onMouseDown={() => playDrum(pad, volumes.drums)}
                  className={`${colors[pad]} ${isActive ? 'scale-95 brightness-150' : ''} 
                    h-16 rounded-xl font-medium text-sm text-white transition-all duration-75 
                    active:scale-95 select-none shadow-lg`}>
                  {pad}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bass */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Bass</span>
            <div className="flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
              <Slider value={[volumes.bass]} min={0} max={1} step={0.01} className="w-20"
                onValueChange={(v) => setVol('bass', v)} />
            </div>
          </div>
          <div className="flex gap-2">
            {BASS_NOTES.map(({ note, freq }) => {
              const isActive = activeKey === `bass-${note}`;
              return (
                <button key={note}
                  onMouseDown={() => playTone('sawtooth', freq, volumes.bass, 0.6, `bass-${note}`)}
                  className={`flex-1 h-20 rounded-lg bg-emerald-900 border border-emerald-600 
                    text-sm font-medium text-emerald-200 transition-all duration-75
                    hover:bg-emerald-800 active:scale-95 ${isActive ? 'bg-emerald-700 scale-95' : ''}`}
                  aria-label={note}>
                  {note}
                </button>
              );
            })}
          </div>
        </div>

        {/* Synth */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Synth</span>
            <div className="flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
              <Slider value={[volumes.synth]} min={0} max={1} step={0.01} className="w-20"
                onValueChange={(v) => setVol('synth', v)} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {SYNTH_PADS.map((pad, i) => {
              const isActive = activeKey === `synth-${pad}`;
              return (
                <button key={pad}
                  onMouseDown={() => playTone('sawtooth', SYNTH_FREQS[i], volumes.synth, 1.0, `synth-${pad}`)}
                  className={`h-14 rounded-xl bg-purple-900/60 border border-purple-500/40 
                    text-xs font-medium text-purple-200 transition-all duration-75
                    hover:bg-purple-800/60 active:scale-95 
                    ${isActive ? 'bg-purple-700/80 shadow-[0_0_12px_rgba(168,85,247,0.6)] scale-95' : ''}`}>
                  {pad}
                </button>
              );
            })}
          </div>
        </div>

        {/* Playback */}
        {recordedUrl && (
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">Recording</p>
            <audio controls src={recordedUrl} className="w-full h-8" />
            <div className="space-y-2">
              <Input
                placeholder="Recording title"
                value={recordingTitle}
                onChange={(e) => setRecordingTitle(e.target.value)}
                className="h-8 text-sm"
              />
              <Textarea
                placeholder="Description (optional)"
                value={recordingDescription}
                onChange={(e) => setRecordingDescription(e.target.value)}
                className="min-h-[60px] text-sm resize-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveRecording}
                  disabled={isSaving || !recordingTitle.trim()}
                  className="flex-1"
                >
                  {isSaving ? 'Saving...' : <><Save className="mr-2 h-3.5 w-3.5" />Save to Library</>}
                </Button>
                <a href={recordedUrl} download="mazer-recording.webm"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline px-2">
                  <Download className="h-3.5 w-3.5" />Download
                </a>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InstrumentsCluster;
