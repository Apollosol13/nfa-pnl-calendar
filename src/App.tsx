import { useState, useEffect } from 'react';
import { LogOut, TrendingUp } from 'lucide-react';
import { PNLCalendar } from './components/PNLCalendar';
import { AuthModal } from './components/AuthModal';
import { supabase } from './lib/supabase';

function App() {
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
    if (!user) {
      setShowAuthModal(true);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowAuthModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <TrendingUp className="w-12 h-12 text-green-400" />
              <h1 className="text-4xl font-bold text-white">PNL Calendar</h1>
            </div>
            <p className="text-zinc-400 text-lg mb-8">Track your daily trading performance</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg shadow-blue-500/50"
            >
              Get Started
            </button>
          </div>
        </div>
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => {
              setShowAuthModal(false);
              checkUser();
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors backdrop-blur-sm border border-slate-700/50"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <PNLCalendar />
    </div>
  );
}

export default App;
