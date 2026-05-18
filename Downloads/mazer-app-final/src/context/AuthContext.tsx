import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Define the base URL for API calls
const API_BASE_URL = 'https://your-backend-api.com'; // Replace with your actual backend URL

type User = {
  id: string;
  email: string;
  username?: string;
  avatar?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUsername: (username: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          username: firebaseUser.displayName || undefined,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Initialize audio context for the application
  const initializeAudioContext = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContext();
      if (!context) {
        console.error("Failed to create audio context.");
        toast.error("Failed to initialize audio system.");
      } else {
        console.log("Audio context initialized successfully");
        sessionStorage.setItem('audioContextInitialized', 'true');
        if (context.state === 'suspended') {
          context.resume().then(() => {
            console.log("AudioContext resumed successfully");
          });
        }
      }
    } catch (error) {
      console.error("Error creating audio context:", error);
      toast.error("Failed to initialize audio system. Please try again.");
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully');
      initializeAudioContext();
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, username: string, password: string) => {
    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Optionally update displayName with username
      if (userCredential.user && username) {
        await updateProfile(userCredential.user, { displayName: username });
      }
      toast.success('Account created successfully');
      initializeAudioContext();
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Signup failed. Please try again.');
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed. Please try again.');
      console.error('Logout error:', error);
    }
  };

  const updateUsername = async (username: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');
      await updateProfile(currentUser, { displayName: username });
      setUser(prev => prev ? { ...prev, username } : null);
      toast.success('Username updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update username');
      console.error('Update username error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, updateUsername }}>
      {children}
    </AuthContext.Provider>
  );
};
