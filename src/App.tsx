import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { RevolutionaryLanding } from './components/landing/RevolutionaryLanding';
import { AuthForm } from './components/auth/AuthForm';
import { EnhancedWizardFlow } from './components/wizard/EnhancedWizardFlow';
import { AppLayout } from './components/layout/AppLayout';
import { BackendStatus } from './components/ui/BackendStatus';
import { QuantumLoader } from './components/ui/QuantumLoader';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { MagicalBackground } from './components/ui/MagicalBackground';
import { getAuthErrorFromURL } from './lib/auth-utils';
import { MainDashboard } from './components/pages/MainDashboard';
import { AgentsPage } from './components/pages/AgentsPage';
import { GuildsPage } from './components/pages/GuildsPage';
import { MarketplacePage } from './components/pages/MarketplacePage';

type AppState = 'landing' | 'auth' | 'app';
type AppPage = 'dashboard' | 'guilds' | 'agents' | 'marketplace' | 'wizard' | 'analytics';

function App() {
  const { user, loading, initialize } = useAuthStore();
  const [appState, setAppState] = useState<AppState>('app');
  const [currentPage, setCurrentPage] = useState<AppPage>('dashboard');
  const [guestMode, setGuestMode] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🚀 Phase 1: Initializing GenesisOS Foundation...');
    initialize();
    
    // Check for auth errors in URL
    const errorFromURL = getAuthErrorFromURL();
    if (errorFromURL) {
      setAuthError(errorFromURL);
      setAppState('auth');
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      if (user || guestMode) {
        console.log('✅ User authenticated - entering Genesis Platform:', user?.email || 'Guest Mode');
        setAppState('app');
      } else if (!guestMode) {
        console.log('👤 Anonymous user - showing landing experience');
        if (appState !== 'auth') {
          setAppState('landing');
        }
      }
    }
  }, [user, loading, guestMode]);

  

  if (loading) {
    return (
      <MagicalBackground variant="cosmic" intensity="subtle">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            {/* Animated Genesis Logo */}
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent animate-pulse" />
              <span className="text-white font-bold text-3xl relative z-10">G</span>
            </div>
            
            {/* Quantum Loader */}
            <QuantumLoader size="lg" color="purple" />
            
            <div className="mt-8 space-y-2">
              <p className="text-white/90 text-lg font-medium">Initializing AI-Native Workspace</p>
              <p className="text-white/60 text-sm">Loading revolutionary platform...</p>
            </div>
            
            {/* Progress indicators */}
            <div className="mt-6 space-y-1 text-white/40 text-xs">
              <p>🧠 Loading neural networks...</p>
              <p>⚡ Establishing quantum connections...</p>
              <p>🌟 Preparing digital workforce...</p>
            </div>
          </div>
        </div>
        <BackendStatus />
      </MagicalBackground>
    );
  }

  if (appState === 'landing') {
    return (
      <>
        <RevolutionaryLanding 
          onGetStarted={() => setGuestMode(true)}
          onSignIn={() => setAppState('auth')}
        />
        <BackendStatus />
      </>
    );
  }

  if (appState === 'auth') {
    return (
      <>
        <AuthForm 
          initialError={authError}
          onBack={() => setAppState('landing')}
        />
        <BackendStatus />
      </>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <MainDashboard onNavigate={setCurrentPage} />;
      case 'guilds':
        return <GuildsPage />;
      case 'agents':
        return <AgentsPage />;
      case 'marketplace':
        return <MarketplacePage />;
      case 'wizard':
        return <EnhancedWizardFlow />;
      case 'analytics':
        return <AnalyticsDashboard guildId="main-guild" />;
      default:
        return <MainDashboard onNavigate={setCurrentPage} />;
    }
  };

  // User is authenticated or in guest mode - show the main Genesis experience
  return (
    <AppLayout 
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      isGuest={guestMode}
    >
      {renderCurrentPage()}
    </AppLayout>
  );
}

export default App;
