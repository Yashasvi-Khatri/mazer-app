import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Square, Download, Trash2, Music2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

type Recording = {
  id: string;
  url: string;
  name: string;
  duration: string;
};

const SoundRecorder = () => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [recordingTitle, setRecordingTitle] = useState('');
  const [recordingDescription, setRecordingDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      recorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const dur = Math.round((Date.now() - startTimeRef.current) / 1000);
        setRecordings(prev => [{
          id: `rec-${Date.now()}`,
          url,
          name: `Take ${prev.length + 1}`,
          duration: formatTime(dur),
        }, ...prev]);
        // Stop all tracks
        stream.getTracks().forEach(t => t.stop());
        toast.success('Recording saved!');
      };

      recorderRef.current.start(100);
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      toast.error('Microphone access denied. Please allow mic permission.');
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const deleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
    if (selectedRecording?.id === id) {
      setSelectedRecording(null);
      setRecordingTitle('');
      setRecordingDescription('');
    }
  };

  const handleSaveRecording = async () => {
    if (!user || !selectedRecording) {
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
      const response = await fetch(selectedRecording.url);
      const blob = await response.blob();

      // In a real app, you'd upload the blob to Firebase Storage
      // For now, we'll save the metadata to Firestore
      const recordingData = {
        title: recordingTitle,
        description: recordingDescription,
        type: 'voice',
        duration: selectedRecording.duration,
        createdAt: serverTimestamp(),
        userId: user.id,
        // In production: audioUrl would be the Firebase Storage URL
        audioUrl: selectedRecording.url, // This is temporary, won't persist across sessions
      };

      await addDoc(collection(db, 'users', user.id, 'recordings'), recordingData);
      toast.success('Recording saved to your library!');
      setSelectedRecording(null);
      setRecordingTitle('');
      setRecordingDescription('');
    } catch (error) {
      console.error('Error saving recording:', error);
      toast.error('Failed to save recording');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full border-border bg-card/40 backdrop-blur-sm">
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Music2 className="h-4 w-4" /> Sound Recorder
          </h3>
          <Button
            variant={isRecording ? 'destructive' : 'outline'}
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
            className="gap-1.5 border-white/10"
          >
            {isRecording
              ? <><Square className="h-3.5 w-3.5" />Stop</>
              : <><Mic className="h-3.5 w-3.5" />Record</>
            }
          </Button>
        </div>

        {/* Live indicator */}
        {isRecording && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-red-400 font-mono">{formatTime(elapsed)}</span>
            <span className="text-xs text-muted-foreground">Recording in progress…</span>
          </div>
        )}

        {!isRecording && recordings.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Hit Record to capture your mic input
          </p>
        )}

        {/* Recording list */}
        {recordings.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Your recordings</p>
            {recordings.map((rec) => (
              <div key={rec.id} className="space-y-1.5 p-3 rounded-lg border border-border bg-accent/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{rec.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{rec.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setSelectedRecording(rec);
                        setRecordingTitle(rec.name);
                      }}
                    >
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                    <a href={rec.url} download={`${rec.name}.webm`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <Button variant="ghost" size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteRecording(rec.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <audio controls src={rec.url} className="w-full h-8" />
              </div>
            ))}
          </div>
        )}

        {/* Save selected recording */}
        {selectedRecording && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">Save to library</p>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedRecording(null);
                  setRecordingTitle('');
                  setRecordingDescription('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SoundRecorder;
