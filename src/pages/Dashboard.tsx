import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { subscribeToBeats, deleteBeat as deleteBeatFromService } from '@/services/beatsService';
import { auth } from '@/firebase';
import { PlusCircle, Music, Calendar, Loader2, Trash2, Mic, Guitar } from 'lucide-react';
import { format } from 'date-fns';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { BeatPattern } from '@/types/beat';

type Recording = {
  id: string;
  title: string;
  description: string;
  type: 'instrument' | 'voice';
  audioUrl: string;
  duration?: string;
  createdAt: any;
};

const INSTRUMENT_COLORS: Record<string, string> = {
  kick: 'bg-violet-500',
  snare: 'bg-cyan-400',
  hihat: 'bg-amber-400',
  percussion: 'bg-rose-400',
};

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [beats, setBeats] = useState<BeatPattern[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    
    // Load recordings from API
    api.getRecordings().then(userRecordings => {
      setRecordings(userRecordings || []);
    }).catch(() => {
      toast.error('Failed to load recordings');
      setRecordings([]);
    });

    // Subscribe to beats from Firebase
    const currentUser = auth.currentUser;
    if (currentUser) {
      const unsubscribe = subscribeToBeats(currentUser.uid, (beats) => {
        setBeats(beats);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, navigate]);

  const handleDelete = async (id: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    try {
      await deleteBeatFromService(currentUser.uid, id);
      toast.success('Beat deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDeleteRecording = async (id: string) => {
    try {
      await api.deleteRecording(id);
      setRecordings(prev => prev.filter(r => r.id !== id));
      toast.success('Recording deleted');
    } catch {
      toast.error('Failed to delete recording');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Layout>
      <ErrorBoundary>
        <div className="space-y-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, <span className="text-foreground font-medium">{user?.username || user?.email}</span>.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* AI Beats Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">AI Generated Beats</h2>
                  <Button onClick={() => navigate('/create')} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />Create New
                  </Button>
                </div>

                {beats.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {beats.map((beat) => (
                      <Card key={beat.id}
                        className="overflow-hidden hover:shadow-md transition-shadow duration-300 border-border bg-card/40 backdrop-blur-sm group">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base font-semibold truncate">{beat.name || 'Untitled Beat'}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <span>{beat.genre || 'Unknown'}</span>
                            <span>•</span>
                            <span>{beat.bpm} BPM</span>
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="pb-3">
                          {/* Mini step grid preview */}
                          <div className="space-y-1">
                            {(['kick', 'snare', 'hihat'] as const).map((inst) => (
                              <div key={inst} className="flex gap-0.5">
                                {Array.from({ length: 16 }).map((_, i) => (
                                  <div key={i}
                                    className={`flex-1 h-2 rounded-sm ${beat.patterns?.[inst]?.[i] ? INSTRUMENT_COLORS[inst] : 'bg-white/5'}`} />
                                ))}
                              </div>
                            ))}
                          </div>
                        </CardContent>

                        <CardFooter className="flex items-center justify-between pt-2">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {beat.createdAt
                              ? format(new Date(beat.createdAt as string), 'MMM d, yyyy')
                              : 'No date'}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm"
                              onClick={() => handleDelete(beat.id)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/create?id=${beat.id}`)}>
                              <Music className="h-3.5 w-3.5 mr-1" />Open
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-border bg-card/40">
                    <CardHeader>
                      <CardTitle>No beats yet</CardTitle>
                      <CardDescription>Create your first AI-generated beat to get started.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button onClick={() => navigate('/create')}>
                        <PlusCircle className="mr-2 h-4 w-4" />Create Beat
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>

              {/* Recordings Section */}
              <div className="space-y-4 pt-8 border-t border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Mic className="h-5 w-5" /> Recordings
                  </h2>
                  <Button onClick={() => navigate('/instruments')} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />Record New
                  </Button>
                </div>

                {recordings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recordings.map((rec) => (
                      <Card key={rec.id}
                        className="border-border bg-card/40 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base font-semibold truncate">{rec.title}</CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1">
                                  {rec.type === 'voice' ? <Mic className="h-3 w-3" /> : <Guitar className="h-3 w-3" />}
                                  {rec.type === 'voice' ? 'Voice' : 'Instrument'}
                                </span>
                                {rec.duration && <span>•</span>}
                                {rec.duration && <span>{rec.duration}</span>}
                              </CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRecording(rec.id)}
                              className="h-7 w-7 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardHeader>

                        <CardContent className="pb-3">
                          {rec.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{rec.description}</p>
                          )}
                          <audio controls src={rec.audioUrl} className="w-full h-8" />
                        </CardContent>

                        <CardFooter className="pt-2">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {rec.createdAt
                              ? format(new Date(rec.createdAt.toDate ? rec.createdAt.toDate() : rec.createdAt), 'MMM d, yyyy')
                              : 'No date'}
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-border bg-card/40">
                    <CardHeader>
                      <CardTitle>No recordings yet</CardTitle>
                      <CardDescription>Record your voice or instruments to save them here.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button onClick={() => navigate('/instruments')}>
                        <PlusCircle className="mr-2 h-4 w-4" />Go to Instruments
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      </ErrorBoundary>
    </Layout>
  );
};

export default Dashboard;
