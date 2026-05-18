import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, Music, Wand2, Radio, Share2, Zap, Layers } from 'lucide-react';

const FEATURES = [
  {
    icon: <Wand2 className="h-7 w-7 text-violet-400" />,
    title: 'AI Beat Generation',
    description: 'Describe any beat in plain English and our AI generates a full 16-step pattern across kick, snare, hihat, and percussion — instantly.',
    color: 'from-violet-500/10 to-violet-500/5',
    border: 'border-violet-500/20',
  },
  {
    icon: <Radio className="h-7 w-7 text-cyan-400" />,
    title: 'Live Step Sequencer',
    description: 'Edit patterns in real-time on a precise lookahead scheduler. Add swing, adjust per-instrument volumes, and randomize any row.',
    color: 'from-cyan-500/10 to-cyan-500/5',
    border: 'border-cyan-500/20',
  },
  {
    icon: <Layers className="h-7 w-7 text-amber-400" />,
    title: 'Live Instruments',
    description: 'Play synthesized piano, drums, bass, and synth pads in real time. Record your performance and download it.',
    color: 'from-amber-500/10 to-amber-500/5',
    border: 'border-amber-500/20',
  },
  {
    icon: <Zap className="h-7 w-7 text-rose-400" />,
    title: 'BPM & Mixer Controls',
    description: 'Dial in the perfect tempo with genre presets (Lo-Fi to D&B). Export patterns as JSON or save to your library.',
    color: 'from-rose-500/10 to-rose-500/5',
    border: 'border-rose-500/20',
  },
  {
    icon: <Share2 className="h-7 w-7 text-emerald-400" />,
    title: 'Cloud Library',
    description: 'All beats auto-saved to your Firebase account. Access, edit, or delete them from your dashboard anytime.',
    color: 'from-emerald-500/10 to-emerald-500/5',
    border: 'border-emerald-500/20',
  },
];

const GENRES = ['Trap', 'Boom Bap', 'House', 'Lo-Fi', 'Afrobeats', 'Reggaeton', 'D&B', 'Drill'];

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-violet-400" />
            <span className="text-lg font-bold tracking-tight">Mazer</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')} size="sm">
                Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Log In</Button>
                <Button size="sm" onClick={() => navigate('/signup')}>
                  Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-24 md:py-36 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
          <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-cyan-600/8 blur-[80px]" />
        </div>

        <div className="max-w-3xl mx-auto space-y-6 relative animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium">
            <Zap className="h-3 w-3" /> AI-Powered Beat Maker
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-none">
            Make beats with
            <span className="block bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              your words.
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Type a description. Mazer generates a full beat pattern using AI, plays it back live,
            and saves it to your library — no music theory required.
          </p>

          {/* Genre pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {GENRES.map(g => (
              <span key={g} className="text-xs px-3 py-1 rounded-full border border-border bg-accent/5 text-muted-foreground">
                {g}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button size="lg" onClick={() => navigate(isAuthenticated ? '/create' : '/signup')}
              className="bg-violet-600 hover:bg-violet-500 text-white border-0 px-8">
              {isAuthenticated ? 'Create a Beat' : 'Start for Free'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {!isAuthenticated && (
              <Button variant="outline" size="lg" onClick={() => navigate('/login')}
                className="border-border hover:bg-accent/5">
                Log In
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-white/5">
        <div className="container">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Everything you need</h2>
            <p className="text-muted-foreground">
              From AI generation to live instruments — a complete beat studio in your browser.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i}
                className={`rounded-xl p-6 border bg-gradient-to-br ${f.color} ${f.border} animate-fade-in`}
                style={{ animationDelay: `${i * 80}ms` }}>
                <div className="h-12 w-12 rounded-xl bg-black/30 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/5">
        <div className="container max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Ready to make your first beat?</h2>
          <p className="text-muted-foreground mb-8">Free to use. No credit card required.</p>
          <Button size="lg" onClick={() => navigate(isAuthenticated ? '/create' : '/signup')}
            className="bg-violet-600 hover:bg-violet-500 text-white border-0 px-10">
            {isAuthenticated ? 'Open Studio' : 'Create Free Account'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-white/5">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-semibold">Mazer</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Mazer. AI-powered beat generation.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
