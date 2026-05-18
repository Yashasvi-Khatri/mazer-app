import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Menu,
  Music,
  LogOut,
  User,
  X,
  ChevronDown,
  Mail,
  Check,
  Sun,
  Moon,
  Sliders
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout, updateUsername } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(user?.username || '');
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
        setIsEditingUsername(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync username input when user changes
  useEffect(() => {
    setUsernameInput(user?.username || '');
  }, [user?.username]);

  const handleUsernameSave = async () => {
    if (usernameInput.trim()) {
      await updateUsername(usernameInput.trim());
      setIsEditingUsername(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link 
            to="/" 
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <Music className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold tracking-tight">Mazer</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link 
                to="/" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Home
              </Link>
              <Link 
                to="/dashboard" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Dashboard
              </Link>
              <Link 
                to="/create" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Create Beat
              </Link>
              <Link
                to="/instruments"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Instruments
              </Link>
              <Link
                to="/studio-mixer"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Studio Mixer
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="h-9 w-9"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <div className="flex items-center gap-4">
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{user?.username || user?.email}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-border bg-card backdrop-blur-md shadow-xl p-4 space-y-3">
                      <div className="space-y-2">
                        {isEditingUsername ? (
                          <div className="flex gap-2">
                            <Input
                              value={usernameInput}
                              onChange={(e) => setUsernameInput(e.target.value)}
                              placeholder="Enter username"
                              className="flex-1 h-8 text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUsernameSave();
                                if (e.key === 'Escape') setIsEditingUsername(false);
                              }}
                            />
                            <Button size="icon" className="h-8 w-8" onClick={handleUsernameSave}>
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{user?.username || 'Set username'}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setIsEditingUsername(true)}
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </Button>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user?.email}
                        </p>
                      </div>
                      <div className="border-t border-border pt-3">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Log Out
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Log In
              </Link>
              <Button 
                onClick={() => navigate('/signup')}
                className="animate-pulse-subtle"
              >
                Sign Up
              </Button>
            </>
          )}
        </nav>

        <div className="md:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-md animate-slide-down">
          <div className="container py-4 space-y-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 py-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{user?.username}</span>
                </div>
                <Link 
                  to="/" 
                  className="block py-2 text-sm font-medium transition-colors hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  to="/dashboard" 
                  className="block py-2 text-sm font-medium transition-colors hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/create" 
                  className="block py-2 text-sm font-medium transition-colors hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Create Beat
                </Link>
                <Link 
                  to="/instruments" 
                  className="block py-2 text-sm font-medium transition-colors hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Instruments
                </Link>
                <Link 
                  to="/studio-mixer" 
                  className="block py-2 text-sm font-medium transition-colors hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Studio Mixer
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    toggleTheme();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block py-2 text-sm font-medium transition-colors hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Button 
                  className="w-full"
                  onClick={() => {
                    navigate('/signup');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
