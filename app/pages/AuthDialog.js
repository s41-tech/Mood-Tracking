import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faSignOutAlt, faUserPlus, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { register, login, logout, loadAuthState } from './Auth';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export default function AuthDialog({ onLogin, customClass, defaultMode = true, externalOpen, onExternalClose }) {
    const [isOpen,    setIsOpen]    = useState(false);
    const [isLogin,   setIsLogin]   = useState(defaultMode);
    const [email,     setEmail]     = useState('');
    const [password,  setPassword]  = useState('');
    const [name,      setName]      = useState('');
    const [error,     setError]     = useState(null);
    const [user,      setUser]      = useState(null);
    const [loading,   setLoading]   = useState(false);
    const [resetSent, setResetSent] = useState(false);

    useEffect(() => {
        if (externalOpen) { setIsOpen(true); setIsLogin(false); }
    }, [externalOpen]);

    const handleClose = () => {
        setIsOpen(false);
        setError(null);
        setResetSent(false);
        if (onExternalClose) onExternalClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            let result;
            if (isLogin) {
                result = await login(email, password);
                sessionStorage.setItem("isNewUser", "false");
                onLogin(result, false);
            } else {
                result = await register(email, password, name);
                sessionStorage.setItem("isNewUser", "true");
                onLogin(result, true);
            }
            setUser(result);
            setIsOpen(false);
            resetForm();
            window.location.href = '/dashboard';
        } catch (error) {
            if (error.code === 'auth/email-already-in-use')
                setError('This email is already in use. Please sign in instead.');
            else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential')
                setError('Incorrect email or password. Please try again.');
            else if (error.code === 'auth/user-not-found')
                setError('No account found with this email.');
            else if (error.code === 'auth/invalid-email')
                setError('Please enter a valid email address.');
            else if (error.code === 'auth/weak-password')
                setError('Password must be at least 6 characters.');
            else
                setError('Something went wrong. Please try again.');
        }
        setLoading(false);
    };

    const handleForgotPassword = async () => {
        if (!email) { setError('Enter your email address above first.'); return; }
        try {
            await sendPasswordResetEmail(getAuth(), email);
            setResetSent(true);
            setError(null);
        } catch {
            setError('No account found with this email address.');
        }
    };

    const handleLogout = async () => {
        try { await logout(); setUser(null); onLogin(null); }
        catch (error) { setError(error.message); }
    };

    const resetForm = () => { setEmail(''); setPassword(''); setName(''); setError(null); setResetSent(false); };

    const toggleAuthMode = () => { setIsLogin(!isLogin); resetForm(); };

    useEffect(() => {
        const savedUser = loadAuthState();
        if (savedUser) { setUser(savedUser); onLogin(savedUser); window.location.href = '/dashboard'; }
    }, [onLogin]);

    if (user) {
        return (
            <div className="flex justify-between items-center">
                <h2 className="font-bold text-gray-300 px-3 text-sm hidden sm:block">Welcome, {user.displayName}</h2>
                <button onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 sm:px-4 rounded-full transition duration-300 text-sm">
                    <FontAwesomeIcon icon={faSignOutAlt} className="sm:mr-2" />
                    <span className="hidden sm:inline">Sign out</span>
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Trigger button */}
            <button onClick={() => setIsOpen(true)}
                className={customClass || "bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 text-sm"}>
                <FontAwesomeIcon icon={isLogin ? faSignInAlt : faUserPlus} className="mr-1.5" />
                {isLogin ? 'Sign in' : 'Sign up'}
            </button>

            {/* Modal / Bottom Sheet */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
                    onClick={handleClose}
                >
                    <div
                        className="bg-[#1a1a1a] border border-gray-700 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl p-5 sm:p-8 max-h-[92vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drag handle — mobile only */}
                        <div className="sm:hidden w-10 h-1 rounded-full bg-gray-600 mx-auto mb-4" />

                        {/* Header */}
                        <div className="flex items-center justify-between mb-5 sm:mb-6">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-white">
                                    {isLogin ? 'Welcome back' : 'Create account'}
                                </h2>
                                <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                                    {isLogin ? 'Sign in to your mood journal' : 'Start tracking your mood today'}
                                </p>
                            </div>
                            <button onClick={handleClose}
                                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition flex-shrink-0">
                                <FontAwesomeIcon icon={faTimes} className="text-xs" />
                            </button>
                        </div>

                        {/* Error / success banner */}
                        {error && (
                            <div className="mb-4 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                        {resetSent && (
                            <div className="mb-4 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                                ✓ Password reset link sent — check your email.
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

                            {!isLogin && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold ml-1">Display Name</label>
                                    <input
                                        type="text" value={name} onChange={e => setName(e.target.value)}
                                        placeholder="Your name" required={!isLogin}
                                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0a0a0a] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500 transition"
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold ml-1">Email</label>
                                <input
                                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com" required
                                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0a0a0a] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500 transition"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold ml-1">Password</label>
                                <input
                                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••" required
                                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0a0a0a] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500 transition"
                                />
                            </div>

                            {/* Forgot password */}
                            {isLogin && (
                                <div className="text-right -mt-1">
                                    <button type="button" onClick={handleForgotPassword}
                                        className="text-xs text-gray-500 hover:text-purple-400 transition">
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            {/* Submit */}
                            <button type="submit" disabled={loading}
                                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition disabled:opacity-50 mt-1 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2">
                                {loading
                                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <FontAwesomeIcon icon={faCheck} />}
                                {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
                            </button>

                        </form>

                        {/* Toggle mode */}
                        <p className="text-center text-sm text-gray-500 mt-4">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button type="button" onClick={toggleAuthMode}
                                className="text-purple-400 hover:text-purple-300 font-semibold transition">
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>

                    </div>
                </div>
            )}
        </>
    );
}
