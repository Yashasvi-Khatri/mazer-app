import { useNavigate } from 'react-router-dom';
import { Music, Headphones, ArrowRight, Wand2, Radio } from 'lucide-react';
import MazerLoginForm from '@/components/auth/MazerLoginForm';

const RECENT_BEATS = [
  { name: 'Late Night Trap', genre: 'Trap', bpm: 140, bars: [1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0] },
  { name: 'Chill Lo-Fi', genre: 'Lo-Fi', bpm: 85,  bars: [1,0,0,1,0,0,1,0,1,0,0,0,1,0,0,0] },
  { name: 'House Groove', genre: 'House', bpm: 128, bars: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0] },
];

const INST_COLORS = ['bg-violet-500', 'bg-cyan-400', 'bg-amber-400', 'bg-rose-400'];

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-black overflow-hidden">

      {/* ── Left panel: form ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-10 relative order-2 lg:order-1">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[140px]" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-md space-y-8">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
              <Music className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white">Mazer</span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
            <p className="text-sm text-white/40">Log in to your studio and keep creating.</p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-2xl">
            <MazerLoginForm />
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-white/40">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors inline-flex items-center gap-1"
            >
              Create one free <ArrowRight className="h-3 w-3" />
            </button>
          </p>
        </div>
      </div>

      {/* ── Right panel: branding ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden order-1 lg:order-2">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-600/15 blur-[130px] animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/15 blur-[120px] animate-pulse" style={{ animationDelay: '1.2s' }} />
          <div className="absolute top-1/4 left-1/2 w-[250px] h-[250px] rounded-full bg-rose-500/8 blur-[100px] animate-pulse" style={{ animationDelay: '2.4s' }} />
        </div>

        {/* Diagonal grid */}
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.6) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        {/* Content */}
        <div className="relative z-10 max-w-sm text-center space-y-8">

          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 via-violet-600 to-cyan-500 flex items-center justify-center shadow-[0_0_50px_rgba(34,211,238,0.35)]">
              <Music className="h-8 w-8 text-white" />
            </div>
            <span className="text-4xl font-black tracking-tighter bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent">
              Mazer
            </span>
          </div>

          {/* Badge + headline */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-medium">
              <Headphones className="h-3 w-3" /> Your beats are waiting
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
              Pick up where<br />
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                you left off.
              </span>
            </h2>
            <p className="text-sm text-white/50 leading-relaxed">
              Your saved beats, recordings, and patterns are all in one place — ready to play, edit, or export.
            </p>
          </div>

          {/* Mini beat preview cards */}
          <div className="space-y-2.5 text-left">
            {RECENT_BEATS.map((beat) => (
              <div key={beat.name}
                className="rounded-xl border border-white/8 bg-white/5 backdrop-blur-sm px-3.5 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{beat.name}</span>
                  <span className="text-xs text-white/30 font-mono">{beat.bpm} BPM</span>
                </div>
                <div className="flex gap-0.5">
                  {beat.bars.map((on, i) => (
                    <div key={i}
                      className={`flex-1 h-2 rounded-sm transition-colors ${on ? INST_COLORS[i % 4] : 'bg-white/5'}`} />
                  ))}
                </div>
                <span className="text-xs text-white/25 uppercase tracking-widest">{beat.genre}</span>
              </div>
            ))}
          </div>

          {/* Feature pills */}
          <div className="flex gap-2 justify-center flex-wrap pt-1">
            {[
              { icon: <Wand2 className="h-3 w-3" />, label: 'AI Generation' },
              { icon: <Radio className="h-3 w-3" />, label: 'Live Sequencer' },
              { icon: <Music className="h-3 w-3" />, label: 'Cloud Library' },
            ].map(f => (
              <div key={f.label}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-white/50">
                {f.icon}{f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
