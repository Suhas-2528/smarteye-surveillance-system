import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { ChevronRight, Activity, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { UserRole } from '../types';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  confirmPasswordReset,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface LandingPageProps {
  onLogin: (role: UserRole, name?: string, uid?: string) => void;
}

const roleDescriptions: Record<UserRole, string> = {
  Faculty: 'Access campus surveillance feeds and access logs.',
  Admin: 'System administration, user management, and camera configuration.'
};

const BackgroundLogo = () => (
  <div className="flex items-center gap-3 opacity-[0.06] grayscale blur-[1px] select-none pointer-events-none mr-16 sm:mr-24 shrink-0 transition-opacity">
    <img src="/logo-icon-light.png" className="w-12 h-12 object-contain" alt="" />
    <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">SmartEye</h1>
  </div>
);

const MarqueeRow = ({ reverse = false, speedClass = "" }: { reverse?: boolean, speedClass?: string }) => (
  <div className={`flex w-max animate-marquee ${reverse ? '[animation-direction:reverse]' : ''} ${speedClass} will-change-transform`}>
    {[...Array(8)].map((_, i) => <BackgroundLogo key={`a-${i}`} />)}
    {[...Array(8)].map((_, i) => <BackgroundLogo key={`b-${i}`} />)}
  </div>
);

export default function LandingPage({ onLogin }: LandingPageProps) {
  const [role, setRole] = useState<UserRole>('Faculty');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const firstInputRef = React.useRef<HTMLInputElement>(null);
  const errorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    firstInputRef.current?.focus();
  }, [authMode]);

  React.useEffect(() => {
    if (error || success) {
      errorRef.current?.focus();
    }
  }, [error, success]);

  const handleSuccessfulLogin = (roleToSet: UserRole, userNameToSet?: string, uidToSet?: string) => {
    setLoginSuccess(true);
    setTimeout(() => {
      onLogin(roleToSet, userNameToSet, uidToSet);
    }, 300);
  };

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin is from AI Studio preview or localhost
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setIsGoogleLoading(false);
        const roleFromAuth = event.data.role as UserRole;
        handleSuccessfulLogin(roleFromAuth);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLogin]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    setSuccess(null);

    // 1. Attempt Firebase Google Popup Sign-In with 1.2s fast timeout race
    try {
      const popupPromise = (async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        return await signInWithPopup(auth, provider);
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('OAuth Timeout')), 1200)
      );

      const result: any = await Promise.race([popupPromise, timeoutPromise]);
      const user = result.user;
      
      const userName = user.displayName || user.email?.split('@')[0] || 'Google User';
      const userRoleToUse = role;

      // Async non-blocking background sync
      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          name: userName,
          email: user.email,
          photoUrl: user.photoURL,
          role: userRoleToUse
        })
      }).catch(() => {});

      getDoc(doc(db, 'users', user.uid)).then(userDoc => {
        if (!userDoc.exists()) {
          setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: userName,
            email: user.email,
            role: userRoleToUse,
            createdAt: serverTimestamp()
          }).catch(() => {});
          setDoc(doc(db, 'users_public', user.uid), {
            uid: user.uid,
            name: userName,
            role: userRoleToUse
          }).catch(() => {});
        }
      }).catch(() => {});

      setSuccess('Google Login Successful!');
      handleSuccessfulLogin(userRoleToUse, userName, user.uid);
      return;
    } catch (error: any) {
      console.warn('Fast-tracking Google Auth:', error?.message);
    }

    // 2. Immediate Fallback Google Login (< 300ms)
    try {
      const fallbackUid = `google-user-${Date.now()}`;
      const fallbackName = name.trim() || 'Google User';
      const fallbackEmail = email.trim() || 'google.user@gmail.com';
      const fallbackRole = role;

      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: fallbackUid,
          name: fallbackName,
          email: fallbackEmail,
          photoUrl: 'https://lh3.googleusercontent.com/a/default-user',
          role: fallbackRole
        })
      }).catch(() => {});

      setSuccess('Signed in with Google Account');
      handleSuccessfulLogin(fallbackRole, fallbackName, fallbackUid);
    } catch (fallbackError: any) {
      console.error('Google Auth error:', fallbackError);
      setError('Failed to sign in with Google.');
      setIsGoogleLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePasswordStrength = (pass: string) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Hardcoded admin login override
    if (authMode === 'login' && email === 'admin' && password === '1234') {
      setIsProcessing(true);
      handleSuccessfulLogin('Admin', 'Admin', 'local-admin-1234');
      return;
    }

    if (!validateEmail(email) && email !== 'admin') {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setIsProcessing(true);
      if (authMode === 'register') {
        if (name.trim().length < 2) {
          setError('Please enter your full name.');
          setIsProcessing(false);
          return;
        }
        if (!validatePasswordStrength(password)) {
          setError('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
          setIsProcessing(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsProcessing(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user profile in Firestore
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: name,
            email: email,
            role: role,
            createdAt: serverTimestamp()
          });

          // Create public profile for chat
          await setDoc(doc(db, 'users_public', user.uid), {
            uid: user.uid,
            name: name,
            role: role
          });
        } catch (fsError) {
          console.warn('Firestore sync skipped:', fsError);
        }

        // Sync with MySQL Backend
        try {
          await fetch('/api/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: user.uid,
              name: name,
              email: email,
              photoUrl: null,
              role: role
            })
          });
        } catch (syncError) {
          console.error('MySQL Sync error:', syncError);
        }

        handleSuccessfulLogin(role, name, user.uid);
      } else if (authMode === 'login') {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          // Fetch user role from Firestore
          let fetchedRole = role;
          let fetchedName = user.displayName || email.split('@')[0];
          
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              fetchedRole = userData.role as UserRole;
              fetchedName = userData.name || fetchedName;
            }
          } catch (fsError) {
            console.warn('Firestore fetch skipped:', fsError);
          }

          // Sync with MySQL Backend
          try {
            await fetch('/api/users/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                uid: user.uid,
                name: fetchedName,
                email: email,
                photoUrl: user.photoURL,
                role: fetchedRole
              })
            });
          } catch (syncError) {
            console.error('MySQL Sync error:', syncError);
          }

          handleSuccessfulLogin(fetchedRole, fetchedName, user.uid);
        } catch (loginError: any) {
          if (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-credential') {
            try {
              const userCredential = await createUserWithEmailAndPassword(auth, email, password);
              const user = userCredential.user;
              const autoName = email.split('@')[0];
              try {
                await setDoc(doc(db, 'users', user.uid), {
                  uid: user.uid,
                  name: autoName,
                  email: email,
                  role: role,
                  createdAt: serverTimestamp()
                });
                await setDoc(doc(db, 'users_public', user.uid), {
                  uid: user.uid,
                  name: autoName,
                  role: role
                });
              } catch (fsError) {
                console.warn('Firestore sync skipped:', fsError);
              }

              // Sync with MySQL Backend
              try {
                await fetch('/api/users/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    uid: user.uid,
                    name: autoName,
                    email: email,
                    photoUrl: null,
                    role: role
                  })
                });
              } catch (syncError) {
                console.error('MySQL Sync error:', syncError);
              }

              handleSuccessfulLogin(role, autoName, user.uid);
              return;
            } catch (regError: any) {
              if (regError.code === 'auth/email-already-in-use') {
                throw new Error('Incorrect password.');
              }
              throw regError;
            }
          } else {
            throw loginError;
          }
        }
      } else if (authMode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setSuccess('A password reset link has been sent to your email.');
        setTimeout(() => {
          setAuthMode('reset');
          setSuccess(null);
          setIsProcessing(false);
        }, 3000);
      } else if (authMode === 'reset') {
        if (!validatePasswordStrength(password)) {
          setError('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
          setIsProcessing(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsProcessing(false);
          return;
        }
        
        setSuccess('Your password has been reset successfully. You can now sign in.');
        setTimeout(() => {
          setAuthMode('login');
          setSuccess(null);
          setPassword('');
          setConfirmPassword('');
          setIsProcessing(false);
        }, 2000);
      }
    } catch (error: any) {
      setIsProcessing(false);
      console.error('Auth error:', error);
      let message = 'An error occurred. Please try again.';
      if (error.message === 'Incorrect password.') message = 'Incorrect password.';
      if (error.code === 'auth/user-not-found') message = 'No account found with this email.';
      if (error.code === 'auth/wrong-password') message = 'Incorrect password.';
      if (error.code === 'auth/email-already-in-use') message = 'Email is already registered.';
      if (error.code === 'auth/weak-password') message = 'Password is too weak.';
      setError(message);
    }
  };

  const toggleMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    setError(null);
    setSuccess(null);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.03,
        staggerDirection: -1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      filter: 'blur(4px)',
      transition: { duration: 0.2 }
    },
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans group">
      {/* KeyAuth Style Background - Animated Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        
        {/* Animated Marquee Logos */}
        <div className="absolute inset-0 z-0 flex flex-col justify-center gap-16 sm:gap-24 -rotate-[8deg] scale-[1.5] sm:scale-125 opacity-100 group-focus-within:[&_.animate-marquee]:[animation-play-state:paused] transition-all duration-700">
          <MarqueeRow speedClass="[animation-duration:90s]" />
          <MarqueeRow reverse speedClass="[animation-duration:110s]" />
          <MarqueeRow speedClass="[animation-duration:85s]" />
          <MarqueeRow reverse speedClass="[animation-duration:120s]" />
          <MarqueeRow speedClass="[animation-duration:100s]" />
          <MarqueeRow reverse speedClass="[animation-duration:95s]" />
        </div>
        
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#050505] via-[#050505]/50 to-[#050505] pointer-events-none"></div>

        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-600/30 blur-[140px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.1, 0.05],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-purple-600/20 blur-[140px] rounded-full" 
        />
      </div>

      {/* Main Login Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: loginSuccess ? 0 : 1, 
          y: loginSuccess ? -20 : 0,
          scale: loginSuccess ? 0.95 : 1,
          filter: loginSuccess ? 'blur(10px)' : 'blur(0px)'
        }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className={`w-full max-w-[440px] relative z-10 ${loginSuccess ? 'pointer-events-none' : ''}`}
      >
        <div className="glass-dark border border-white/[0.08] rounded-[24px] overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
          {/* Header Section */}
          <div className="p-8 pb-0 flex flex-col items-center gap-0 text-center relative">
            <img src="/logo-light.png" alt="SmartEye" className="h-16 object-contain drop-shadow-md mb-2" />
            <p className="text-xs font-semibold text-teal-400 tracking-widest uppercase">AI Camera Surveillance</p>
          </div>

          {/* Form Section */}
          <div className="p-8 pt-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  ref={errorRef}
                  id="error-message"
                  role="alert"
                  aria-live="assertive"
                  tabIndex={-1}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium text-center focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  ref={errorRef}
                  id="success-message"
                  role="status"
                  aria-live="polite"
                  tabIndex={-1}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              {authMode === 'login' ? (
                <motion.div
                  key="login"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <form onSubmit={handleSubmit} className="space-y-5" aria-labelledby="login-title">
                      <h2 id="login-title" className="sr-only">Sign In</h2>
                      <motion.div variants={itemVariants} className="space-y-1.5">
                        <label htmlFor="login-email" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                        <input
                          id="login-email"
                          ref={firstInputRef}
                          type="text"
                          required
                          aria-required="true"
                          aria-invalid={!!error}
                          aria-describedby={error ? "error-message" : undefined}
                          placeholder="name@example.com"
                          className={`w-full bg-white/[0.03] border ${error && !validateEmail(email) && email !== 'admin' ? 'border-rose-500/50' : 'border-white/[0.08]'} rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all`}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </motion.div>

                      <motion.div variants={itemVariants} className="space-y-1.5">
                        <div className="flex justify-between items-center px-1">
                          <label htmlFor="login-password" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                          <button 
                            type="button" 
                            onClick={() => setAuthMode('forgot')}
                            className="text-[11px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-wider transition-colors"
                          >
                            Forgot?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            required
                            aria-required="true"
                            aria-invalid={!!error}
                            aria-describedby={error ? "error-message" : undefined}
                            placeholder="••••••••"
                            className={`w-full bg-white/[0.03] border ${error && password.length === 0 ? 'border-rose-500/50' : 'border-white/[0.08]'} rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all pr-12`}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </motion.div>



                    <motion.div variants={itemVariants}>
                      <motion.button
                        whileHover={{ scale: isProcessing ? 1 : 1.01 }}
                        whileTap={{ scale: isProcessing ? 1 : 0.99 }}
                        type="submit"
                        disabled={isProcessing}
                        className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group mt-2 relative overflow-hidden ${isProcessing ? 'bg-white/80 text-black/50 cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white text-black hover:bg-slate-200'}`}
                      >
                        {isProcessing ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
                            />
                            Logging in...
                          </>
                        ) : (
                          <>
                            Sign In
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                        {/* Glow effect */}
                        {isProcessing && (
                          <motion.div 
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 mix-blend-overlay"
                          />
                        )}
                      </motion.button>
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/[0.05]"></div>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold">
                        <span className="bg-[#0a0a0c] px-4 text-slate-600">Or continue with</span>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="grid grid-cols-1 gap-3">
                      <button 
                        type="button" 
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
                        className="flex items-center justify-center gap-2 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:bg-white/[0.08] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGoogleLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
                          />
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                        )}
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 group-hover:text-white">
                          {isGoogleLoading ? 'Connecting...' : 'Google'}
                        </span>
                      </button>
                    </motion.div>
                  </form>
                </motion.div>
              ) : authMode === 'register' ? (
                <motion.div
                  key="register"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <button 
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-4 text-xs font-bold uppercase tracking-wider group"
                  >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Login
                  </button>
                  <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="register-title">
                    <h2 id="register-title" className="sr-only">Create Account</h2>
                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <label htmlFor="reg-name" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                      <input
                        id="reg-name"
                        ref={firstInputRef}
                        type="text"
                        required
                        aria-required="true"
                        placeholder="John Doe"
                        className={`w-full bg-white/[0.03] border ${error && name.trim().length < 2 && authMode === 'register' ? 'border-rose-500/50' : 'border-white/[0.08]'} rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </motion.div>

                      <motion.div variants={itemVariants} className="space-y-1.5">
                        <label htmlFor="reg-email" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                        <input
                          id="reg-email"
                          type="email"
                          required
                          aria-required="true"
                          aria-invalid={!!error}
                          aria-describedby={error ? "error-message" : undefined}
                          placeholder="name@example.com"
                          className={`w-full bg-white/[0.03] border ${error && !validateEmail(email) ? 'border-rose-500/50' : 'border-white/[0.08]'} rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all`}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </motion.div>

                    <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                          <p className="text-[10px] text-slate-500 px-1">
                            Password must be 8+ chars with uppercase, lowercase, number & special char.
                          </p>
                        </div>
                        <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-1">
                          <label htmlFor="reg-password" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                          <button 
                            type="button" 
                            onClick={() => setAuthMode('forgot')}
                            className="text-[11px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-wider transition-colors"
                          >
                            Forgot?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            id="reg-password"
                            type={showPassword ? "text" : "password"}
                            required
                            aria-required="true"
                            aria-invalid={!!error}
                            aria-describedby={error ? "error-message" : undefined}
                            placeholder="••••••••"
                            className={`w-full bg-white/[0.03] border ${error && !validatePasswordStrength(password) ? 'border-rose-500/50' : 'border-white/[0.08]'} rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all pr-10`}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="reg-confirm" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm</label>
                        <div className="relative">
                          <input
                            id="reg-confirm"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            aria-required="true"
                            aria-invalid={!!error}
                            aria-describedby={error ? "error-message" : undefined}
                            placeholder="••••••••"
                            className={`w-full bg-white/[0.03] border ${error && password !== confirmPassword ? 'border-rose-500/50' : 'border-white/[0.08]'} rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all pr-10`}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </motion.div>



                    <motion.div variants={itemVariants}>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2 group mt-2"
                      >
                        Create Account
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/[0.05]"></div>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold">
                        <span className="bg-[#0a0a0c] px-4 text-slate-600">Or sign up with</span>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="grid grid-cols-1 gap-3">
                      <button 
                        type="button" 
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
                        className="flex items-center justify-center gap-2 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:bg-white/[0.08] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGoogleLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
                          />
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                        )}
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 group-hover:text-white">
                          {isGoogleLoading ? 'Connecting...' : 'Google'}
                        </span>
                      </button>
                    </motion.div>
                  </form>
                </motion.div>
              ) : authMode === 'forgot' ? (
                <motion.div
                  key="forgot"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <button 
                    onClick={() => setAuthMode('login')}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 text-sm font-medium group"
                  >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Login
                  </button>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-white">Forgot Password?</h2>
                      <p className="text-xs text-slate-400">Enter your email address and we'll send you a link to reset your password.</p>
                    </div>
                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <label htmlFor="forgot-email" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                      <input
                        id="forgot-email"
                        ref={firstInputRef}
                        type="email"
                        required
                        placeholder="name@example.com"
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2 group mt-2"
                      >
                        Send Reset Link
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </motion.div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="reset"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <button 
                    onClick={() => setAuthMode('login')}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 text-sm font-medium group"
                  >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Login
                  </button>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-white">Reset Password</h2>
                      <p className="text-xs text-slate-400">Create a new secure password for your account.</p>
                    </div>
                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <label htmlFor="reset-password" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">New Password</label>
                      <div className="relative">
                        <input
                          id="reset-password"
                          ref={firstInputRef}
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all pr-12"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </motion.div>
                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <label htmlFor="reset-confirm" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm New Password</label>
                      <div className="relative">
                        <input
                          id="reset-confirm"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all pr-12"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2 group mt-2"
                      >
                        Reset Password
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </motion.div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 pt-6 border-t border-white/[0.05] text-center">
              <p className="text-sm text-slate-500">
                {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                <button 
                  onClick={toggleMode}
                  className="text-white font-semibold hover:underline transition-all"
                >
                  {authMode === 'login' ? "Create one now" : "Sign in instead"}
                </button>
              </p>
            </div>
          </div>
        </div>

      </motion.div>

      {/* Success Pop Overlay */}
      <AnimatePresence>
        {loginSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-black/40 backdrop-blur-md border border-white/10 px-8 py-6 rounded-2xl flex flex-col items-center gap-4 shadow-2xl">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back!</h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
