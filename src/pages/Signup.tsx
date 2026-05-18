import { useNavigate } from 'react-router-dom';
import { Music, Zap, ArrowRight } from 'lucide-react';
import MazerSignupForm from '@/components/auth/MazerSignupForm';

const Signup = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-black overflow-hidden">
      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden">
        {/* Animated background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[130px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/15 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-2/3 left-1/3 w-[300px] h-[300px] rounded-full bg-rose-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        {/* Content */}
        <div className="relative z-10 max-w-sm text-center space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.5)]">
              <Music className="h-8 w-8 text-white" />
            </div>
            <span className="text-4xl font-black tracking-tighter bg-gradient-to-r from-violet-300 via-white to-cyan-300 bg-clip-text text-transparent">
              Mazer
            </span>
          </div>

          {/* Welcome message */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium">
              <Zap className="h-3 w-3" /> AI-Powered Beat Studio
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
              Welcome to<br />
              <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                your studio.
              </span>
            </h2>
            <p className="text-sm text-white/50 leading-relaxed">
              Create beats with words. Our AI turns your descriptions into full 16-step drum patterns — no music theory required.
            </p>
          </div>

          {/* Mini feature list */}
          <div className="space-y-3 text-left">
            {[
              { color: 'bg-violet-500', label: 'AI Beat Generation', desc: 'Describe any vibe, get a beat' },
              { color: 'bg-cyan-400', label: 'Live Step Sequencer', desc: 'Edit patterns in real time' },
              { color: 'bg-amber-400', label: 'Cloud Library', desc: 'All beats saved to Firestore' },
            ].map(f => (
              <div key={f.label} className="flex items-start gap-3">
                <div className={`mt-1 h-2 w-2 rounded-full ${f.color} shrink-0`} />
                <div>
                  <p className="text-xs font-semibold text-white">{f.label}</p>
                  <p className="text-xs text-white/40">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Genre pills */}
          <div className="flex flex-wrap gap-1.5 justify-center pt-2">
            {['Trap', 'Boom Bap', 'House', 'Lo-Fi', 'D&B', 'Drill'].map(g => (
              <span key={g} className="text-xs px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-white/40">
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: signup form ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-10 relative">
        {/* Mobile background glow */}
        <div className="absolute inset-0 pointer-events-none lg:hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-violet-600/15 blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <Music className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white">Mazer</span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
            <p className="text-sm text-white/40">Start making beats with AI — it's free.</p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-2xl space-y-5">
            <MazerSignupForm />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-white/40">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors inline-flex items-center gap-1"
            >
              Log in <ArrowRight className="h-3 w-3" />
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
