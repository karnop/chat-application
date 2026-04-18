import React from 'react';

const AuthScreen = ({
    authMode,
    setAuthMode,
    username,
    setUsername,
    password,
    setPassword,
    handleAuth,
    error,
    onGuestEntry,
    AmbientBackground
}) => {
    return (
        <div className="flex h-screen items-center justify-center font-sans text-white relative p-4">
            {AmbientBackground && <AmbientBackground />}
            <div className="relative z-10 bg-white/5 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border border-white/10 w-full max-w-[440px] shadow-2xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                        {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-white/40 text-sm">Secure multi-room communication</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {error && (
                        <div className="bg-rose-500/20 border border-rose-500/50 text-rose-300 px-4 py-3 rounded-xl text-xs text-center">
                            {error}
                        </div>
                    )}
                    <input
                        className="w-full bg-black/40 text-white px-6 py-4 rounded-xl outline-none border border-white/10 focus:border-indigo-500/50 transition-all placeholder-white/20"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        className="w-full bg-black/40 text-white px-6 py-4 rounded-xl outline-none border border-white/10 focus:border-indigo-500/50 transition-all placeholder-white/20"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                        {authMode === 'login' ? 'Login' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 flex flex-col items-center gap-4">
                    <button
                        onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                        className="text-white/40 hover:text-white text-sm transition-colors"
                    >
                        {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                    </button>
                    <div className="w-full h-[1px] bg-white/5" />
                    <button
                        onClick={onGuestEntry}
                        className="text-indigo-400/60 hover:text-indigo-400 text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                        Continue as Guest (Read Only)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;
