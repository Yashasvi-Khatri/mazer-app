import { useState, useRef, useEffect } from 'react';
import { X, Upload, Play, Pause, Square, Repeat, Music, Volume2, Trash2, Mic } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/firebase';
import { getBeats, type BeatData } from '@/services/beatsService';
import { useAuth } from '@/context/AuthContext';

type Track = {
  id: string;
  name: string;
  type: 'audio' | 'beat';
  audioBuffer?: AudioBuffer;
  duration: number;
  waveform: number[];
  trimStart: number;
  trimEnd: number;
  volume: number;
  muted: boolean;
  solo: boolean;
  beatId?: string;
  bpm?: number;
};

const StudioMixer = () => {
  const { isAuthenticated } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [isDragging, setIsDragging] = useState(false);
  const [showBeatsDropdown, setShowBeatsDropdown] = useState(false);
  const [savedBeats, setSavedBeats] = useState<BeatData[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newTracks: Track[] = [];

    for (const file of fileArray) {
      if (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.m4a')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
          const waveform = generateWaveform(audioBuffer);
          
          newTracks.push({
            id: Date.now().toString() + Math.random(),
            name: file.name,
            type: 'audio',
            audioBuffer,
            duration: audioBuffer.duration,
            waveform,
            trimStart: 0,
            trimEnd: audioBuffer.duration,
            volume: 0.8,
            muted: false,
            solo: false,
          });
        } catch (error) {
          console.error('Error decoding audio:', error);
        }
      }
    }

    setTracks(prev => [...prev, ...newTracks]);
  };

  const generateWaveform = (audioBuffer: AudioBuffer): number[] => {
    const channelData = audioBuffer.getChannelData(0);
    const samples = 200;
    const blockSize = Math.floor(channelData.length / samples);
    const waveform: number[] = [];

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[i * blockSize + j]);
      }
      waveform.push(sum / blockSize);
    }

    const max = Math.max(...waveform);
    return waveform.map(v => v / max);
  };

  const drawWaveform = (track: Track, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const waveform = track.waveform;
    const barWidth = width / waveform.length;

    waveform.forEach((value, index) => {
      const barHeight = value * height * 0.8;
      const x = index * barWidth;
      const y = (height - barHeight) / 2;

      ctx.fillStyle = track.id === selectedTrackId ? '#8b5cf6' : '#6366f1';
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });

    const trimStartPercent = track.trimStart / track.duration;
    const trimEndPercent = track.trimEnd / track.duration;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, width * trimStartPercent, height);
    ctx.fillRect(width * trimEndPercent, 0, width * (1 - trimEndPercent), height);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(width * trimStartPercent - 4, 0, 8, height);
    ctx.fillRect(width * trimEndPercent - 4, 0, 8, height);
  };

  useEffect(() => {
    tracks.forEach(track => {
      const canvas = canvasRefs.current.get(track.id);
      if (canvas) {
        drawWaveform(track, canvas);
      }
    });
  }, [tracks, selectedTrackId]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleAddBeatTrack = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const beats = await getBeats(currentUser.uid);
      setSavedBeats(beats);
      setShowBeatsDropdown(true);
    } catch (error) {
      console.error('Error fetching beats:', error);
    }
  };

  const handleBeatSelect = (beat: BeatData) => {
    const waveform = Array.from({ length: 200 }, () => Math.random() * 0.8);
    
    const newTrack: Track = {
      id: Date.now().toString() + Math.random(),
      name: beat.name,
      type: 'beat',
      duration: 16 / (beat.bpm / 60),
      waveform,
      trimStart: 0,
      trimEnd: 16 / (beat.bpm / 60),
      volume: 0.8,
      muted: false,
      solo: false,
      beatId: beat.id,
      bpm: beat.bpm,
    };

    setTracks(prev => [...prev, newTrack]);
    setBpm(beat.bpm);
    setShowBeatsDropdown(false);
  };

  const handleRemoveTrack = (trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
    if (selectedTrackId === trackId) setSelectedTrackId(null);
  };

  const handleToggleMute = (trackId: string) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, muted: !t.muted, solo: false } : t
    ));
  };

  const handleToggleSolo = (trackId: string) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, solo: !t.solo, muted: false } : { ...t, muted: !t.solo }
    ));
  };

  const handleTrackVolumeChange = (trackId: string, value: number[]) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, volume: value[0] } : t
    ));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = tracks.reduce((max, track) => Math.max(max, track.trimEnd - track.trimStart), 0);

  if (!isAuthenticated) return null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Studio Mixer</h1>
          <p className="text-muted-foreground mt-1">
            Mix your audio tracks and AI beats
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Mixer Panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Drop Zone</CardTitle>
                <CardDescription>Drag & drop audio files or click to browse</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-border/60'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drop audio files here (MP3, WAV, M4A, OGG)
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">Max file size: 50MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse Files
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleAddBeatTrack}
            >
              <Music className="h-4 w-4 mr-2" />
              Add AI Beat Track
            </Button>

            {showBeatsDropdown && (
              <Card className="border-border bg-card/40 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {savedBeats.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2">No saved beats</p>
                    ) : (
                      savedBeats.map((beat) => (
                        <button
                          key={beat.id}
                          className="w-full text-left px-3 py-2 rounded hover:bg-white/10 text-sm transition-colors"
                          onClick={() => handleBeatSelect(beat)}
                        >
                          <div className="font-medium">{beat.name}</div>
                          <div className="text-xs text-muted-foreground">{beat.genre} • {beat.bpm} BPM</div>
                        </button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tracks List */}
            <div className="space-y-3">
              {tracks.map((track) => (
                <Card
                  key={track.id}
                  className={`border transition-colors ${
                    selectedTrackId === track.id ? 'border-primary bg-primary/5' : 'border-border bg-card/40'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {track.type === 'beat' ? (
                          <Music className="h-4 w-4 text-violet-400" />
                        ) : (
                          <Mic className="h-4 w-4 text-cyan-400" />
                        )}
                        <span className="text-sm font-medium truncate max-w-[200px]">{track.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{formatTime(track.duration)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleRemoveTrack(track.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <canvas
                      ref={(el) => { if (el) canvasRefs.current.set(track.id, el); }}
                      width={400}
                      height={50}
                      className="w-full h-12 rounded bg-black/30 mb-3 cursor-pointer"
                      onClick={() => setSelectedTrackId(track.id)}
                    />

                    <div className="flex items-center gap-2">
                      <Button
                        variant={track.muted ? 'destructive' : 'outline'}
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => handleToggleMute(track.id)}
                      >
                        M
                      </Button>
                      <Button
                        variant={track.solo ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => handleToggleSolo(track.id)}
                      >
                        S
                      </Button>
                      <div className="flex-1 flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                        <Slider
                          value={[track.volume]}
                          min={0}
                          max={1}
                          step={0.01}
                          className="flex-1"
                          onValueChange={(v) => handleTrackVolumeChange(track.id, v)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-4">
            <Card className="border-border bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Transport Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsPlaying(false)}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={isPlaying ? 'destructive' : 'default'}
                    size="icon"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="text-center">
                  <span className="text-2xl font-mono">{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant={loopEnabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLoopEnabled(!loopEnabled)}
                  >
                    <Repeat className="h-4 w-4 mr-2" />
                    Loop
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>BPM</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[bpm]}
                    min={60}
                    max={200}
                    step={1}
                    className="flex-1"
                    onValueChange={(v) => setBpm(v[0])}
                  />
                  <span className="text-lg font-mono w-12 text-right">{bpm}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Mix Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tracks</span>
                    <span className="font-medium">{tracks.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Length</span>
                    <span className="font-medium">{formatTime(totalDuration)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Master Volume</span>
                    <span className="font-medium">{Math.round(masterVolume * 100)}%</span>
                  </div>
                  <Slider
                    value={[masterVolume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={(v) => setMasterVolume(v[0])}
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Noise Level</span>
                  <div className="h-2 bg-black/30 rounded overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                      style={{ width: `${masterVolume * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Export</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full">
                  Export WAV
                </Button>
                <Button variant="outline" className="w-full">
                  Save to Library
                </Button>
                <Button variant="default" className="w-full">
                  AI Mix
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudioMixer;
