import Layout from '@/components/Layout';
import InstrumentsCluster from '@/components/InstrumentsCluster';
import SoundRecorder from '@/components/SoundRecorder';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';

const Instruments = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      toast.error('Please log in to access instruments');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instruments</h1>
          <p className="text-muted-foreground mt-1">
            Play synthesized instruments live and record your performance
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InstrumentsCluster />
          <SoundRecorder />
        </div>
      </div>
    </Layout>
  );
};

export default Instruments;
