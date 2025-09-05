import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ArrowRight, Eye, EyeOff, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useStore } from '../lib/store';

import { auth, db } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const signInStore = useStore((state) => state.signIn);

  const [username, setUsername] = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const usernameLower = useMemo(
    () => username.trim().toLowerCase(),
    [username]
  );

  const validate = () => {
    if (!usernameLower) { toast.error('Username is required.'); return false; }
    if (!/^[a-z0-9_\.]{3,20}$/.test(usernameLower)) {
      toast.error('Username must be 3–20 chars: a–z, 0–9, underscore, dot.');
      return false;
    }
    if (!email.trim()) { toast.error('Email is required.'); return false; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { toast.error('Enter a valid email.'); return false; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters.'); return false; }
    return true;
  };

  const usernameAvailable = async () => {
    const qRef = query(
      collection(db, 'users'),
      where('usernameLower', '==', usernameLower)
    );
    const snap = await getDocs(qRef);
    return snap.empty;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      // 1) Ensure username is free
      const ok = await usernameAvailable();
      if (!ok) {
        toast.error('Username already taken. Try another.');
        setIsLoading(false);
        return;
      }

      // 2) Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

      // 3) Set displayName
      await updateProfile(cred.user, { displayName: username.trim() });

      // 4) Write Firestore user document
      const userDoc = doc(db, 'users', cred.user.uid);
      await setDoc(userDoc, {
        uid: cred.user.uid,
        email: email.trim(),
        username: username.trim(),
        usernameLower,
        createdAt: serverTimestamp(),
        photoURL: cred.user.photoURL ?? null,
      }, { merge: true });

      // 5) Update global store & navigate
      signInStore(username.trim(), email.trim());
      toast.success(`Welcome, ${username.trim()}!`);
      navigate('/app');
    } catch (err: any) {
      const code = err?.code ?? '';
      if (code === 'auth/email-already-in-use') toast.error('Email already in use.');
      else if (code === 'auth/invalid-email') toast.error('Invalid email address.');
      else if (code === 'auth/weak-password') toast.error('Password too weak.');
      else toast.error(err?.message || 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-100 text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute w-96 h-96 bg-primary rounded-full -top-20 -left-20 filter blur-3xl opacity-20"></div>
      <div className="absolute w-96 h-96 bg-secondary rounded-full -bottom-20 -right-20 filter blur-3xl opacity-20"></div>

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
          <h2 className="text-2xl font-bold text-white mt-4">Create Your Account</h2>
          <p className="text-light-200">Join the hype. It&apos;s free.</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          <Input
            id="username"
            label="Username"
            placeholder="Your cool username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            hint="3–20 chars: a–z, 0–9, underscore, dot"
          />
          <Input
            id="email"
            label="Email Address"
            placeholder="you@example.com"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            <UserPlus size={20} />
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </Button>
        </form>

        <p className="text-center text-light-200 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign In <ArrowRight className="inline w-4 h-4" />
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SignUpPage;
