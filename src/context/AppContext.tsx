import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { api, setAuthToken } from '../lib/api';
import { auth, googleAuthProvider } from '../lib/firebase';
import type {
  Branch,
  HealthStatus,
  Profile,
  Semester,
} from '../types/campuscycle';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface OnboardingProfileDraft {
  fullName?: string;
  college: string;
  branch: Branch;
  semester: Semester;
  contactDetails: string;
}

export interface EmailRegisterInput extends OnboardingProfileDraft {
  fullName: string;
  email: string;
  password: string;
}

interface AppContextValue {
  path: string;
  navigate: (to: string) => void;
  user: Profile | null;
  authReady: boolean;
  setSession: (token: string | null, profile: Profile | null) => void;
  signInWithGoogle: (
    onboardingDraft?: OnboardingProfileDraft
  ) => Promise<Profile | null>;
  signInWithEmail: (email: string, password: string) => Promise<Profile | null>;
  registerWithEmail: (input: EmailRegisterInput) => Promise<Profile | null>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshHealth: () => Promise<void>;
  health: HealthStatus;
  toasts: ToastItem[];
  notify: (type: ToastItem['type'], message: string) => void;
  dismissToast: (id: string) => void;
}

function formatAuthError(err: unknown, fallback: string): Error {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code || '')
      : '';

  if (code === 'auth/operation-not-allowed') {
    return new Error(
      'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method → Email/Password).'
    );
  }
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return new Error('Invalid email or password.');
  }
  if (code === 'auth/email-already-in-use') {
    return new Error(
      'An account with this email already exists. Try signing in instead.'
    );
  }
  if (code === 'auth/weak-password') {
    return new Error('Password must be at least 6 characters (8+ recommended).');
  }
  if (code === 'auth/invalid-email') {
    return new Error('Please enter a valid email address.');
  }
  if (code === 'auth/too-many-requests') {
    return new Error('Too many attempts. Please wait a moment and try again.');
  }
  if (code === 'auth/popup-closed-by-user') {
    return new Error('Google sign-in popup was closed before completing.');
  }
  if (err instanceof Error) return err;
  return new Error(fallback);
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(
    () => window.location.pathname + window.location.search || '/'
  );
  const [user, setUser] = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [health, setHealth] = useState<HealthStatus>({
    ok: true,
    mode: 'live',
    authProvider: 'firebase',
    allowedCollegeDomain: '',
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const skipAutoSyncRef = useRef(false);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (type: ToastItem['type'], message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const navigate = useCallback((to: string) => {
    const cleanTo = to.startsWith('/') ? to : `/${to}`;
    if (window.location.pathname + window.location.search !== cleanTo) {
      window.history.pushState({}, '', cleanTo);
    }
    setPath(cleanTo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const refreshHealth = useCallback(async () => {
    try {
      const h = await api.getHealth();
      setHealth(h);
    } catch {
      // Keep default fallback
    }
  }, []);

  useEffect(() => {
    refreshHealth();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setAuthToken(null);
        setUser(null);
        setAuthReady(true);
        return;
      }

      if (skipAutoSyncRef.current) {
        return;
      }

      try {
        const token = await fbUser.getIdToken();
        setAuthToken(token);
        const { profile } = await api.getMe();
        setUser(profile);
      } catch (err) {
        setAuthToken(null);
        setUser(null);
        console.error('Auth session restore failed:', err);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [refreshHealth]);

  const setSession = useCallback(
    (token: string | null, profile: Profile | null) => {
      setAuthToken(token);
      setUser(profile);
    },
    []
  );

  const signInWithGoogle = useCallback(
    async (onboardingDraft?: OnboardingProfileDraft): Promise<Profile | null> => {
      skipAutoSyncRef.current = true;
      try {
        const credential = await signInWithPopup(auth, googleAuthProvider);
        const token = await credential.user.getIdToken();
        setAuthToken(token);

        let { profile } = await api.getMe();

        if (onboardingDraft) {
          const updated = await api.updateProfile({
            fullName:
              onboardingDraft.fullName?.trim() ||
              profile.fullName ||
              credential.user.displayName ||
              'Student',
            college: onboardingDraft.college,
            branch: onboardingDraft.branch,
            semester: onboardingDraft.semester,
            contactDetails: onboardingDraft.contactDetails,
          });
          profile = updated.profile;
        }

        setUser(profile);
        setAuthReady(true);
        return profile;
      } catch (err) {
        await signOut(auth).catch(() => undefined);
        setAuthToken(null);
        setUser(null);
        throw formatAuthError(err, 'Google sign-in failed.');
      } finally {
        skipAutoSyncRef.current = false;
      }
    },
    []
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<Profile | null> => {
      skipAutoSyncRef.current = true;
      try {
        const credential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        const token = await credential.user.getIdToken();
        setAuthToken(token);
        const { profile } = await api.getMe();
        setUser(profile);
        setAuthReady(true);
        return profile;
      } catch (err) {
        await signOut(auth).catch(() => undefined);
        setAuthToken(null);
        setUser(null);
        throw formatAuthError(err, 'Email sign-in failed.');
      } finally {
        skipAutoSyncRef.current = false;
      }
    },
    []
  );

  const registerWithEmail = useCallback(
    async (input: EmailRegisterInput): Promise<Profile | null> => {
      skipAutoSyncRef.current = true;
      try {
        const cleanEmail = input.email.trim().toLowerCase();
        if (
          health.allowedCollegeDomain &&
          !cleanEmail.endsWith(health.allowedCollegeDomain)
        ) {
          throw new Error(
            `Registration requires a verified ${health.allowedCollegeDomain} college email.`
          );
        }

        const credential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          input.password
        );
        await updateFirebaseProfile(credential.user, {
          displayName: input.fullName.trim(),
        }).catch(() => undefined);
        sendEmailVerification(credential.user).catch(() => undefined);

        const token = await credential.user.getIdToken(true);
        setAuthToken(token);

        await api.getMe();
        const updated = await api.updateProfile({
          fullName: input.fullName.trim(),
          college: input.college.trim(),
          branch: input.branch,
          semester: input.semester,
          contactDetails: input.contactDetails.trim(),
        });

        setUser(updated.profile);
        setAuthReady(true);
        return updated.profile;
      } catch (err) {
        await signOut(auth).catch(() => undefined);
        setAuthToken(null);
        setUser(null);
        throw formatAuthError(err, 'Account registration failed.');
      } finally {
        skipAutoSyncRef.current = false;
      }
    },
    [health.allowedCollegeDomain]
  );

  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      throw formatAuthError(err, 'Unable to send password reset email.');
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth).catch(() => undefined);
    setAuthToken(null);
    setUser(null);
    notify('info', 'Signed out of CampusCycle.');
    navigate('/');
  }, [navigate, notify]);

  return (
    <AppContext.Provider
      value={{
        path,
        navigate,
        user,
        authReady,
        setSession,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        sendPasswordReset,
        logout,
        refreshHealth,
        health,
        toasts,
        notify,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
