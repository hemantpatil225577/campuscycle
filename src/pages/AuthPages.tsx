import { useState } from 'react';
import { CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Branch, Semester } from '../types/campuscycle';

function GoogleMark() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.37 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
  );
}

export function LoginPage() {
  const { user, navigate, signInWithGoogle, signInWithEmail, notify, health } =
    useApp();
  const [tab, setTab] = useState<'student' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busyMode, setBusyMode] = useState<'google' | 'email' | null>(null);

  const handlePostAuthNavigation = (
    profile: NonNullable<typeof user>,
    forAdminTab: boolean
  ) => {
    if (forAdminTab) {
      if (profile.role === 'admin') {
        notify('success', `Welcome back, ${profile.fullName}`);
        navigate('/admin');
      } else {
        notify(
          'error',
          'Signed in as a student account. Admin Console requires an authorized administrator role.'
        );
        navigate('/dashboard');
      }
      return;
    }

    if (!profile.isOnboarded) {
      notify(
        'success',
        'Signed in! Please confirm your college, branch, and semester.'
      );
      navigate('/profile');
    } else {
      notify('success', `Welcome back, ${profile.fullName}`);
      navigate('/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    setBusyMode('google');
    try {
      const profile = await signInWithGoogle();
      if (profile) handlePostAuthNavigation(profile, tab === 'admin');
    } catch (err) {
      notify(
        'error',
        err instanceof Error ? err.message : 'Google sign-in failed.'
      );
    } finally {
      setBusyMode(null);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyMode('email');
    try {
      const profile = await signInWithEmail(email, password);
      if (profile) handlePostAuthNavigation(profile, tab === 'admin');
    } catch (err) {
      notify(
        'error',
        err instanceof Error ? err.message : 'Email sign-in failed.'
      );
    } finally {
      setBusyMode(null);
    }
  };

  if (user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="sky-glass-panel rounded-2xl p-6 sm:p-8 text-center space-y-4">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">
            Signed in as {user.fullName}
          </h1>
          <p className="text-sm text-slate-600">
            {user.email} · {user.branch} · Semester {user.semester}
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg cursor-pointer"
            >
              Open Dashboard
            </button>
            {user.role === 'admin' && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-5 py-2.5 text-sm font-semibold text-[#0F172A] bg-white/85 border border-sky-200 hover:border-sky-400 rounded-lg cursor-pointer"
              >
                Open Admin Console
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="sky-glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">
            Sign in to CampusCycle
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Choose Google Sign-In or your email &amp; password to access listings,
            requests, pickups, and handovers.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Account sign-in type"
          className="flex gap-1 p-1 bg-sky-100/80 border border-sky-200/75 rounded-lg"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'student'}
            onClick={() => setTab('student')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md cursor-pointer transition-all duration-150 ${
              tab === 'student'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-slate-600 hover:text-sky-900 hover:bg-white/60'
            }`}
          >
            Student Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'admin'}
            onClick={() => setTab('admin')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md cursor-pointer transition-all duration-150 ${
              tab === 'admin'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-slate-600 hover:text-sky-900 hover:bg-white/60'
            }`}
          >
            Admin Console
          </button>
        </div>

        {tab === 'admin' && (
          <div className="p-4 sky-glass-subtle rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="h-4 w-4 text-sky-700 shrink-0 mt-0.5" />
            <p>
              Admin access is verified server-side against authorized platform
              administrator accounts. Sign in with your authorized Google
              account or admin email &amp; password.
            </p>
          </div>
        )}

        {health.allowedCollegeDomain && (
          <div className="p-3.5 sky-glass-subtle rounded-xl text-xs text-slate-600">
            Restricted to verified{' '}
            <strong className="text-[#0F172A]">
              {health.allowedCollegeDomain}
            </strong>{' '}
            campus accounts.
          </div>
        )}

        <button
          type="button"
          disabled={busyMode !== null}
          onClick={handleGoogleLogin}
          className="w-full py-3 px-4 inline-flex items-center justify-center gap-3 text-sm font-semibold text-[#0F172A] bg-white hover:bg-sky-50 border border-sky-200 hover:border-sky-400 rounded-xl shadow-xs sky-btn-lift cursor-pointer disabled:opacity-50"
        >
          <GoogleMark />
          <span>
            {busyMode === 'google'
              ? 'Opening Google Sign-In...'
              : tab === 'admin'
                ? 'Sign In with Google (Admin)'
                : 'Continue with Google'}
          </span>
        </button>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-sky-200/80" />
          <span className="shrink mx-3 text-[11px] font-medium text-slate-500">
            or sign in with email &amp; password
          </span>
          <div className="flex-grow border-t border-sky-200/80" />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              College Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@college.edu"
              className="w-full px-3.5 py-2.5 text-sm bg-white/80 border border-sky-200 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="login-password"
                className="text-xs font-medium text-slate-700"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => navigate('/reset-password')}
                className="text-xs font-medium text-sky-700 hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3.5 py-2.5 text-sm bg-white/80 border border-sky-200 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={busyMode !== null}
            className={`w-full py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm sky-btn-lift cursor-pointer disabled:opacity-50 ${
              tab === 'admin'
                ? 'bg-sky-700 hover:bg-sky-800 shadow-sky-700/20'
                : 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20'
            }`}
          >
            {busyMode === 'email'
              ? 'Signing In...'
              : tab === 'admin'
                ? 'Sign In to Admin Console'
                : 'Sign In with Email'}
          </button>
        </form>

        <p className="text-xs text-center text-slate-600">
          New to CampusCycle?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="font-semibold text-sky-700 hover:underline cursor-pointer"
          >
            Create student account
          </button>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const {
    navigate,
    signInWithGoogle,
    registerWithEmail,
    notify,
    health,
  } = useApp();
  const [authMethod, setAuthMethod] = useState<'email' | 'google'>('email');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState(
    'National Institute of Engineering & Technology'
  );
  const [branch, setBranch] = useState<Branch>('CSE');
  const [semester, setSemester] = useState<Semester>(3);
  const [contactDetails, setContactDetails] = useState('');
  const [busyMode, setBusyMode] = useState<'google' | 'email' | null>(null);

  const handleGoogleRegister = async () => {
    setBusyMode('google');
    try {
      const profile = await signInWithGoogle({
        fullName,
        college,
        branch,
        semester,
        contactDetails,
      });
      if (profile) {
        notify('success', `Student profile ready for ${profile.fullName}!`);
        navigate('/dashboard');
      }
    } catch (err) {
      notify(
        'error',
        err instanceof Error ? err.message : 'Google account setup failed.'
      );
    } finally {
      setBusyMode(null);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyMode('email');
    try {
      const profile = await registerWithEmail({
        fullName,
        email,
        password,
        college,
        branch,
        semester,
        contactDetails,
      });
      if (profile) {
        notify(
          'success',
          `Account created for ${profile.fullName}! Verification email sent.`
        );
        navigate('/dashboard');
      }
    } catch (err) {
      notify(
        'error',
        err instanceof Error ? err.message : 'Registration failed.'
      );
    } finally {
      setBusyMode(null);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="sky-glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">
            Create Student Account
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Join CampusCycle using your choice of Email &amp; Password or Google
            Sign-In.
            {health.allowedCollegeDomain
              ? ` Requires ${health.allowedCollegeDomain} email.`
              : ''}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Registration sign-up method"
          className="flex gap-1 p-1 bg-sky-100/80 border border-sky-200/75 rounded-lg"
        >
          <button
            type="button"
            role="tab"
            aria-selected={authMethod === 'email'}
            onClick={() => setAuthMethod('email')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md cursor-pointer transition-all duration-150 ${
              authMethod === 'email'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-slate-600 hover:text-sky-900 hover:bg-white/60'
            }`}
          >
            Email &amp; Password
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={authMethod === 'google'}
            onClick={() => setAuthMethod('google')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md cursor-pointer transition-all duration-150 ${
              authMethod === 'google'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-slate-600 hover:text-sky-900 hover:bg-white/60'
            }`}
          >
            Google Sign-In
          </button>
        </div>

        <form onSubmit={handleEmailRegister} className="space-y-4">
          <div>
            <label
              htmlFor="reg-fullname"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Full Name {authMethod === 'email' ? '*' : '(optional for Google)'}
            </label>
            <input
              id="reg-fullname"
              type="text"
              autoComplete="name"
              required={authMethod === 'email'}
              minLength={authMethod === 'email' ? 2 : undefined}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g., Ananya Sharma"
              className="w-full px-3.5 py-2.5 text-sm bg-white/80 border border-sky-200 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500"
            />
          </div>

          {authMethod === 'email' && (
            <>
              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  College Email *
                </label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  className="w-full px-3.5 py-2.5 text-sm bg-white/80 border border-sky-200 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Password (min 8 characters) *
                </label>
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full px-3.5 py-2.5 text-sm bg-white/80 border border-sky-200 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500"
                />
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="reg-college"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              College / Institute *
            </label>
            <input
              id="reg-college"
              type="text"
              required
              minLength={2}
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white/80 border border-sky-200 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="reg-branch"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Branch
              </label>
              <select
                id="reg-branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value as Branch)}
                className="w-full px-3 py-2.5 text-sm border border-sky-200 rounded-lg bg-white/80 focus:outline-none focus:border-sky-500"
              >
                {['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'Other'].map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="reg-semester"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Semester
              </label>
              <select
                id="reg-semester"
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value) as Semester)}
                className="w-full px-3 py-2.5 text-sm border border-sky-200 rounded-lg bg-white/80 focus:outline-none focus:border-sky-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-contact"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Optional Campus Contact (Hostel / Dept Room)
            </label>
            <input
              id="reg-contact"
              type="text"
              value={contactDetails}
              onChange={(e) => setContactDetails(e.target.value)}
              placeholder="e.g., Hostel-3, Room 214"
              className="w-full px-3.5 py-2.5 text-sm bg-white/80 border border-sky-200 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500"
            />
          </div>

          {authMethod === 'email' ? (
            <button
              type="submit"
              disabled={busyMode !== null}
              className="w-full py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 sky-btn-lift cursor-pointer disabled:opacity-50"
            >
              <Mail className="h-4 w-4" />
              <span>
                {busyMode === 'email'
                  ? 'Creating Account...'
                  : 'Register with Email & Password'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              disabled={busyMode !== null}
              onClick={handleGoogleRegister}
              className="w-full py-3 px-4 inline-flex items-center justify-center gap-3 text-sm font-semibold text-[#0F172A] bg-white hover:bg-sky-50 border border-sky-200 hover:border-sky-400 rounded-xl shadow-xs sky-btn-lift cursor-pointer disabled:opacity-50"
            >
              <GoogleMark />
              <span>
                {busyMode === 'google'
                  ? 'Creating Profile...'
                  : 'Continue with Google & Save Profile'}
              </span>
            </button>
          )}
        </form>

        <p className="text-xs text-center text-slate-600">
          Already registered?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-semibold text-sky-700 hover:underline cursor-pointer"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  const { navigate, sendPasswordReset, notify } = useApp();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await sendPasswordReset(email);
      notify(
        'success',
        'Password reset link sent! Check your email inbox or spam folder.'
      );
      navigate('/login');
    } catch (err) {
      notify(
        'error',
        err instanceof Error ? err.message : 'Unable to send reset email.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="sky-glass-panel rounded-2xl p-6 sm:p-8 space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">
            Reset Password
          </h1>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            For email &amp; password accounts, enter your registered email to
            receive a password reset link. (Google Sign-In users manage passwords
            through Google Account Security.)
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label
              htmlFor="reset-email"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Registered Email
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@college.edu"
              className="w-full px-3.5 py-2.5 text-sm bg-white/80 border border-sky-200 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 sky-btn-lift cursor-pointer disabled:opacity-50"
          >
            {busy ? 'Sending Reset Link...' : 'Send Password Reset Email'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full py-2 text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
