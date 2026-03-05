import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faSignOutAlt, faUserPlus, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { register, login, logout, loadAuthState } from './Auth';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export default function AuthDialog({ onLogin, customClass, defaultMode = true, externalOpen, onExternalClose }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLogin, setIsLogin] = useState(defaultMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (externalOpen) {
            setIsOpen(true);
            setIsLogin(false);
        }
    }, [externalOpen]);

    const handleClose = () => {
        setIsOpen(false);
        if (onExternalClose) onExternalClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
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
            if (error.code === 'auth/email-already-in-use') {
                setError('This email is already in use. Please use a different email or sign in.');
            } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                setError('Incorrect email or password. Please try again.');
            } else if (error.code === 'auth/user-not-found') {
                setError('No account found with this email.');
            } else if (error.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else if (error.code === 'auth/weak-password') {
                setError('Password must be at least 6 characters.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            alert("Please enter your email address first.");
            return;
        }
        try {
            const auth = getAuth();
            await sendPasswordResetEmail(auth, email);
            alert("Password reset link sent to your email!");
        } catch (error) {
            alert("No account found with this email address.");
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            setUser(null);
            onLogin(null);
        } catch (error) {
            setError(error.message);
        }
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setName('');
        setError(null);
    };

    const toggleAuthMode = () => {
        setIsLogin(!isLogin);
        resetForm();
    };

    useEffect(() => {
        const savedUser = loadAuthState();
        if (savedUser) {
            setUser(savedUser);
            onLogin(savedUser);
            window.location.href = '/dashboard';
        }
    }, [onLogin]);

    if (user) {
        return (
            <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold text-gray-800 px-3">Welcome, {user.displayName}</h2>
                <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full transition duration-300">
                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                    Sign out
                </button>
            </div>
        );
    }

    return (
        <>
            <button onClick={() => setIsOpen(true)}
                className={customClass || "bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition duration-300"}>
                <FontAwesomeIcon icon={isLogin ? faSignInAlt : faUserPlus} className="mr-2" />
                {isLogin ? 'Sign in' : 'Sign up'}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-[#1a1a1a] p-8 rounded-lg shadow-xl max-w-xl w-full border border-gray-700">
                        <h2 className="text-2xl font-bold mb-4 text-white">{isLogin ? 'Sign in' : 'Sign up'}</h2>
                        {error && <p className="text-red-500 mb-4">{error}</p>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLogin && (
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required={!isLogin} className="w-full p-2 border border-gray-600 rounded bg-[#0a0a0a] text-white placeholder-gray-500" />
                            )}
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full p-2 border border-gray-600 rounded bg-[#0a0a0a] text-white placeholder-gray-500" />
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full p-2 border border-gray-600 rounded bg-[#0a0a0a] text-white placeholder-gray-500" />

                            {/* Forgot password — Sign in only */}
                            {isLogin && (
                                <div style={{ textAlign: 'right', marginTop: '4px' }}>
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#888',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            <div id="bot" className="p-2 flex items-center justify-between">
                                <p className="text-sm text-gray-400">
                                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                                    <button type="button" onClick={toggleAuthMode}
                                        className="text-purple-500 hover:text-purple-400 underline transition duration-300">
                                        {isLogin ? 'Sign up' : 'Sign in'}
                                    </button>
                                </p>
                                <span className="flex space-x-2 float-right">
                                    <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 w-auto flex items-center">
                                        <FontAwesomeIcon icon={faCheck} className="mr-2" />
                                        {isLogin ? 'Sign in' : 'Register'}
                                    </button>
                                    <button type="button" onClick={() => handleClose()} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 w-auto flex items-center">
                                        <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                        Cancel
                                    </button>
                                </span>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}