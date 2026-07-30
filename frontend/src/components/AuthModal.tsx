import React, { useState } from 'react';
import { api } from '../services/api';
import { User, Role } from '../types';
import { X, LogIn, UserPlus, Flame } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: User, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('BUYER');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegister) {
        const res = await api.register({ email, password, name, role });
        onSuccess(res.user, res.token);
      } else {
        const res = await api.login({ email, password });
        onSuccess(res.user, res.token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuick = async (roleName: string) => {
    try {
      const res = await api.quickLogin(roleName);
      onSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/90 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-6 my-auto max-h-[90vh] flex flex-col animate-scale-in">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            {isRegister ? <UserPlus className="w-4 h-4 text-orange-500" /> : <LogIn className="w-4 h-4 text-orange-500" />}
            <span>{isRegister ? 'Create Vutto Account' : 'Sign In to Account'}</span>
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Demo Fast Login Toolbar */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-3 shrink-0">
          <div className="text-[10px] text-slate-400 uppercase font-semibold mb-2 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" /> Demo Quick Login
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
            <button onClick={() => handleQuick('BUYER')} className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg border border-slate-700">Buyer Alex</button>
            <button onClick={() => handleQuick('SELLER')} className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 py-1.5 rounded-lg border border-amber-500/40">Seller Moto</button>
            <button onClick={() => handleQuick('ADMIN')} className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 py-1.5 rounded-lg border border-cyan-500/40">Admin Apex</button>
          </div>
        </div>

        {error && (
          <div className="mb-3 bg-red-500/10 border border-red-500/40 p-2.5 rounded-xl text-xs text-red-400 shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs overflow-y-auto pr-1 flex-1">
          {isRegister && (
            <div>
              <label className="text-slate-400 font-semibold uppercase block mb-1">Full Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
            </div>
          )}

          <div>
            <label className="text-slate-400 font-semibold uppercase block mb-1">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono" />
          </div>

          <div>
            <label className="text-slate-400 font-semibold uppercase block mb-1">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono" />
          </div>

          {isRegister && (
            <div>
              <label className="text-slate-400 font-semibold uppercase block mb-1">Account Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold">
                <option value="BUYER">BUYER (Participate in live auctions)</option>
                <option value="SELLER">SELLER (Publish motorcycle listings)</option>
                <option value="ADMIN">ADMIN (Full system observability & controls)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition text-xs sm:text-sm mt-2 shadow-lg shadow-orange-500/20"
          >
            {isSubmitting ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-3 text-center text-xs text-slate-400 pt-3 border-t border-slate-800 shrink-0">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsRegister(!isRegister)} className="text-orange-400 font-bold underline">
            {isRegister ? 'Sign In' : 'Register Now'}
          </button>
        </div>

      </div>
    </div>
  );
};
