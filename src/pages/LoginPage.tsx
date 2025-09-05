import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, ArrowRight, Eye, EyeOff, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useStore } from '../lib/store';

import { auth, db } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const signInStore = useStore((s) => s.signIn);

  // Let users type either their username or email
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isEmail = useMemo(
    () => /^\S+@\S+\.\S+$/.test(identifier.trim()),
    [identifier]
  );

  const findEmailForIdentifier = async (): Promise<{ email: string; username?: string } | null> => {
    const id = identifier.trim();
    if (isEmail) return { email: id, username: undefined };

    const uname = id.toLowerCase();
    if (!/^[a-z0-9_.]{3,20}$/.test(uname)) {
      toast.error('Enter a valid username or email.');
      return null;
    }

    // Look up user by usernameLower
    const qRef = query(collection(db, 'users'), where('usernameLower', '==', uname));
    const snap = await getDocs(qRef);
    if (snap.empty) {
      toast.error('No account found with that username.');
      return null;
    }
    // Take the first match (usernames should be unique)
    const data = snap.docs[0].data() as any;
    if (!data?.email) {
      toast.error('Account has no email associated.');
      return null;
    }
    return { email: String(data.email), username: String(data.username ?? uname) };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const resolved = await findEmailForIdentifier();
      if (!resolved) return;

      const { email, username } = resolved;
      const cred = await signInWithEmailAndPassword(auth, email, password);

      const nameForStore =
        username ||
        cred.user.displayName ||
        (cred.user.email ? cred.user.email.split('@')[0] : 'User');

      // Update your global store (kept from your original pattern)
      signInStore(nameForStore, cred.user.email || email);

      toast.success(`Welcome back, ${nameForStore}!`);
      navigate('/app');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        toast.error('Invalid credentials. Check your email/username and password.');
      } else if (code === 'auth/user-not-found') {
        toast.error('No user found with those credentials.');
      } else if (code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please try again later.');
      } else {
        toast.error(err?.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      setIsLoading(true);
      const resolved = await findEmailForIdentifier();
      if (!resolved) return;
      await sendPasswordResetEmail(auth, resolved.email);
      toast.success('Password reset email sent.');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') toast.error('No account with that email.');
      else toast.error(err?.message || 'Could not send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-100 text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute w-96 h-96 bg-primary rounded-full -top-20 -right-20 filter blur-3xl opacity-20"></div>
      <div className="absolute w-96 h-96 bg-secondary rounded-full -bottom-20 -left-20 filter blur-3xl opacity-20"></div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md bg-dark-200/80 backdrop-blur-lg border border-dark-300 rounded-2xl p-8 z-10"
      >
        <Link to="/" className="absolute top-4 right-4 text-light-200 hover:text-white transition-colors">
          <X size={24} />
        </Link>

        <div className="text-center mb-8">
          <Link to="/" className="text-4xl font-bold tracking-tighter text-white">
            Backr<span className="text-primary">.</span>
          </Link>
          <h2 className="text-2xl font-bold text-white mt-4">Welcome Back!</h2>
          <p className="text-light-200">Sign in to continue to Backr.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            id="identifier"
            label="Email or Username"
            placeholder="you@example.com or your_username"
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          <div className="relative">
            <Input
              id="password"
              label="Password"
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-9 text-light-200 hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm font-medium text-primary hover:underline"
              disabled={isLoading || !identifier.trim()}
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !identifier.trim() || !password}>
            <LogIn size={20} />
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-light-200 mt-8">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Sign Up <ArrowRight className="inline w-4 h-4" />
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
