import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/store';
import logo from '../assets/logo.png';

const STEP = {
    INITIAL: 'initial',
    LOGIN_PASSWORD: 'login_password',
    REGISTER_DETAILS: 'register_details',
    GOOGLE_USERNAME: 'google_username',
};

const Auth = () => {
    const canvasRef = useRef(null);

    const {
        googleUser,
        isInitializing,
        isAuthenticating,
        error,
        clearError,
        setError,
        loginWithGoogle,
        checkEmailExists,
        login,
        register,
        finishGoogleSetup,
        handleGoogleCallback,
        handleEmailConfirmCallback,
    } = useAuthStore();

    const [step, setStep] = useState(STEP.INITIAL);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [sent, setSent] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const BG = '#0a0d0a';
        let W, H, nodes, animId;
        const mouse = { x: -999, y: -999 };

        function resize() {
            const el = canvas.parentElement;
            W = canvas.width = el.offsetWidth;
            H = canvas.height = el.offsetHeight;
            initNodes();
        }

        function initNodes() {
            const count = Math.floor((W * H) / 9000);
            nodes = Array.from({ length: count }, () => ({
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                r: Math.random() * 1.8 + 1,
                pulse: Math.random() * Math.PI * 2,
            }));
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = BG;
            ctx.fillRect(0, 0, W, H);

            const glow1 = ctx.createRadialGradient(W * 0.25, H * 0.3, 0, W * 0.25, H * 0.3, W * 0.55);
            glow1.addColorStop(0, 'rgba(30,58,22,0.65)');
            glow1.addColorStop(1, 'rgba(10,13,10,0)');
            ctx.fillStyle = glow1;
            ctx.fillRect(0, 0, W, H);

            const glow2 = ctx.createRadialGradient(W * 0.7, H * 0.72, 0, W * 0.7, H * 0.72, W * 0.45);
            glow2.addColorStop(0, 'rgba(22,42,16,0.5)');
            glow2.addColorStop(1, 'rgba(10,13,10,0)');
            ctx.fillStyle = glow2;
            ctx.fillRect(0, 0, W, H);

            for (let i = 0; i < nodes.length; i++) {
                const a = nodes[i];
                a.x += a.vx;
                a.y += a.vy;
                if (a.x < 0 || a.x > W) a.vx *= -1;
                if (a.y < 0 || a.y > H) a.vy *= -1;

                const dx = mouse.x - a.x;
                const dy = mouse.y - a.y;
                const md = Math.sqrt(dx * dx + dy * dy);
                if (md < 100) {
                    a.x -= dx * 0.015;
                    a.y -= dy * 0.015;
                }

                for (let j = i + 1; j < nodes.length; j++) {
                    const b = nodes[j];
                    const ex = b.x - a.x;
                    const ey = b.y - a.y;
                    const d = Math.sqrt(ex * ex + ey * ey);
                    const maxD = 110;
                    if (d < maxD) {
                        const alpha = (1 - d / maxD) * 0.22;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(200,240,88,${alpha})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                }

                a.pulse += 0.018;
                const pulse = Math.sin(a.pulse) * 0.4 + 0.7;
                const r = a.r * pulse;

                ctx.beginPath();
                ctx.arc(a.x, a.y, r + 5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(200,240,88,0.06)';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200,240,88,${0.5 * pulse})`;
                ctx.fill();
            }

            animId = requestAnimationFrame(draw);
        }

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        const handleMouseLeave = () => {
            mouse.x = -999;
            mouse.y = -999;
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('resize', resize);
        resize();
        draw();

        return () => {
            cancelAnimationFrame(animId);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('resize', resize);
        };
    }, []);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                const provider = session.user.app_metadata?.provider;

                if (provider === 'google') {
                    const result = await handleGoogleCallback(session);
                    if (result?.needsUsername) {
                        setStep(STEP.GOOGLE_USERNAME);
                    } else if (result?.success) {
                        window.location.href = '/';
                    }
                    return;
                }

                const result = await handleEmailConfirmCallback(session);
                if (result?.success) {
                    window.location.href = '/';
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (googleUser) setStep(STEP.GOOGLE_USERNAME);
    }, [googleUser]);

    const handleGoogle = async () => {
        clearError();
        await loginWithGoogle();
    };

    const handleEmailContinue = async () => {
        const val = email.trim();
        if (!val || !val.includes('@')) {
            setError('Enter a valid email address.');
            return;
        }
        clearError();
        const result = await checkEmailExists(val);
        if (result.error) return;
        setStep(result.exists ? STEP.LOGIN_PASSWORD : STEP.REGISTER_DETAILS);
    };

    const handleLogin = async () => {
        if (!password) { setError('Enter your password.'); return; }
        clearError();
        const result = await login(email, password);
        if (result?.success) window.location.href = '/';
    };

    const handleRegister = async () => {
        if (!name.trim()) { setError('Enter your display name.'); return; }
        if (!username.trim()) { setError('Enter a username.'); return; }
        if (!password || password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        clearError();
        const result = await register(email, password, username.trim(), name.trim());
        if (result?.success) setSent(true);
    };

    const handleGoogleUsernameSubmit = async () => {
        if (!username.trim()) { setError('Enter a username.'); return; }
        clearError();
        const result = await finishGoogleSetup(username.trim());
        if (result?.success) window.location.href = '/';
    };

    const inputClass = "input-field w-full outline-none transition-[border-color,box-shadow] duration-150";

    const Spinner = () => (
        <span className="w-3.5 h-3.5 rounded-full border-2 animate-spin inline-block shrink-0"
            style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }} />
    );

    if (isInitializing) {
        return (
            <div className="page grid grid-cols-2 min-h-screen relative overflow-hidden max-[720px]:grid-cols-1">
                <div className="side-image relative overflow-hidden max-[720px]:hidden">
                    <canvas ref={canvasRef} className="block w-full h-full absolute inset-0" />
                </div>
                <div className="auth-col flex flex-col justify-center items-center py-12 pr-10 pl-4 relative z-[3] max-[720px]:p-10">
                    <div className="flex flex-col gap-4 items-center animate-fadeUp">
                        <div className="w-5 h-5 rounded-full border-2 animate-spin"
                            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                        <p className="text-sm" style={{ color: 'var(--text2)' }}>Signing you in…</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page grid grid-cols-2 min-h-screen relative overflow-hidden max-[720px]:grid-cols-1">
            <div className="side-image relative overflow-hidden max-[720px]:hidden">
                <canvas ref={canvasRef} className="block w-full h-full absolute inset-0" />
            </div>
            <div className="auth-col flex flex-col justify-center items-center py-12 pr-10 pl-4 relative z-[3] max-[720px]:p-10">
                <div className="auth-inner w-full max-w-[320px] flex flex-col gap-8 animate-fadeUp">

                    <div className="flex items-center gap-2">
                        <img src={logo} alt="Flock" className="h-18 w-auto object-contain" />
                    </div>

                    {sent ? (
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>Check your email</p>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
                                We sent a confirmation link to{' '}
                                <span style={{ color: 'var(--text)' }}>{email}</span>.
                                Click it to activate your account.
                            </p>
                            <button
                                className="text-xs mt-2 underline cursor-pointer w-fit transition-opacity duration-150 hover:opacity-60"
                                style={{ color: 'var(--text3)' }}
                                onClick={() => {
                                    setSent(false);
                                    setStep(STEP.INITIAL);
                                    setPassword('');
                                    setName('');
                                    setUsername('');
                                    clearError();
                                }}
                            >
                                Use a different email
                            </button>
                        </div>
                    ) : (
                        <>
                            {step === STEP.INITIAL && (
                                <div className="auth-fields flex flex-col gap-3">
                                    <button
                                        className="google-btn flex items-center justify-center gap-2.5 w-full cursor-pointer transition-transform duration-150 hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                                        onClick={handleGoogle}
                                        disabled={isAuthenticating}
                                    >
                                        {isAuthenticating ? (
                                            <span className="text-sm flex items-center gap-2" style={{ color: 'var(--text2)' }}>
                                                <Spinner /> Redirecting…
                                            </span>
                                        ) : (
                                            <>
                                                <svg className="google-icon w-[18px] h-[18px] shrink-0" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                                                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                                                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                                                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                                                </svg>
                                                Continue with Google
                                            </>
                                        )}
                                    </button>
                                    <div className="divider flex items-center gap-3 uppercase text-[0.78rem] tracking-widest">or</div>
                                    <div className="flex gap-2">
                                        <input
                                            className={inputClass}
                                            type="email"
                                            placeholder="Enter your email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); clearError(); }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleEmailContinue()}
                                        />
                                        <button
                                            className="email-submit shrink-0 cursor-pointer font-bold whitespace-nowrap transition-[opacity,transform,box-shadow] duration-150 hover:-translate-y-px hover:opacity-[0.88] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                                            onClick={handleEmailContinue}
                                            disabled={isAuthenticating}
                                        >
                                            {isAuthenticating ? '…' : 'Continue'}
                                        </button>
                                    </div>
                                    {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}
                                </div>
                            )}

                            {step === STEP.LOGIN_PASSWORD && (
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm" style={{ color: 'var(--text2)' }}>Signing in as</p>
                                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{email}</p>
                                    </div>
                                    <input
                                        className={inputClass}
                                        type="password"
                                        placeholder="Password"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); clearError(); }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                        autoFocus
                                    />
                                    {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}
                                    <button
                                        className="email-submit w-full cursor-pointer font-bold whitespace-nowrap transition-[opacity,transform,box-shadow] duration-150 hover:-translate-y-px hover:opacity-[0.88] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                                        onClick={handleLogin}
                                        disabled={isAuthenticating}
                                    >
                                        {isAuthenticating ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Spinner /> Signing in…
                                            </span>
                                        ) : 'Sign in'}
                                    </button>
                                    <button
                                        className="text-xs underline cursor-pointer w-fit transition-opacity duration-150 hover:opacity-60"
                                        style={{ color: 'var(--text3)' }}
                                        onClick={() => { setStep(STEP.INITIAL); setPassword(''); clearError(); }}
                                    >
                                        Use a different email
                                    </button>
                                </div>
                            )}

                            {step === STEP.REGISTER_DETAILS && (
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm" style={{ color: 'var(--text2)' }}>Creating account for</p>
                                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{email}</p>
                                    </div>
                                    <input
                                        className={inputClass}
                                        type="text"
                                        placeholder="Display name"
                                        autoComplete="name"
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); clearError(); }}
                                        autoFocus
                                    />
                                    <input
                                        className={inputClass}
                                        type="text"
                                        placeholder="Username"
                                        autoComplete="username"
                                        value={username}
                                        onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/\s/g, '')); clearError(); }}
                                    />
                                    <input
                                        className={inputClass}
                                        type="password"
                                        placeholder="Password"
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); clearError(); }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                                    />
                                    {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}
                                    <button
                                        className="email-submit w-full cursor-pointer font-bold whitespace-nowrap transition-[opacity,transform,box-shadow] duration-150 hover:-translate-y-px hover:opacity-[0.88] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                                        onClick={handleRegister}
                                        disabled={isAuthenticating}
                                    >
                                        {isAuthenticating ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Spinner /> Creating account…
                                            </span>
                                        ) : 'Create account'}
                                    </button>
                                    <button
                                        className="text-xs underline cursor-pointer w-fit transition-opacity duration-150 hover:opacity-60"
                                        style={{ color: 'var(--text3)' }}
                                        onClick={() => { setStep(STEP.INITIAL); setPassword(''); setName(''); setUsername(''); clearError(); }}
                                    >
                                        Use a different email
                                    </button>
                                </div>
                            )}

                            {step === STEP.GOOGLE_USERNAME && googleUser && (
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        {googleUser.user_metadata?.avatar_url && (
                                            <img
                                                src={googleUser.user_metadata.avatar_url}
                                                alt="avatar"
                                                className="w-10 h-10 rounded-full object-cover shrink-0"
                                            />
                                        )}
                                        <div className="flex flex-col">
                                            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                                                {googleUser.user_metadata?.full_name}
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--text2)' }}>{googleUser.email}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm" style={{ color: 'var(--text2)' }}>
                                        Choose a username to finish setting up your account.
                                    </p>
                                    <input
                                        className={inputClass}
                                        type="text"
                                        placeholder="Username"
                                        autoComplete="username"
                                        value={username}
                                        onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/\s/g, '')); clearError(); }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleGoogleUsernameSubmit()}
                                        autoFocus
                                    />
                                    {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}
                                    <button
                                        className="email-submit w-full cursor-pointer font-bold whitespace-nowrap transition-[opacity,transform,box-shadow] duration-150 hover:-translate-y-px hover:opacity-[0.88] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                                        onClick={handleGoogleUsernameSubmit}
                                        disabled={isAuthenticating}
                                    >
                                        {isAuthenticating ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Spinner /> Finishing setup…
                                            </span>
                                        ) : 'Finish setup'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Auth;
