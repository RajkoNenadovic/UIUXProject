import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = (event) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }
    window.localStorage.setItem('clearlayer-session', 'active');
    navigate('/onboarding');
  };
  return <div className="auth-page"><section className="auth-card"><div className="workspace-logo auth-logo">CL</div><h1>Sign in</h1><p>Decode institutional text with clarity.</p><form onSubmit={submit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@school.edu" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" /></label><button className="auth-forgot" type="button">Forgot password?</button>{error && <p className="workspace-error" role="alert">{error}</p>}<button className="workspace-dark-button" type="submit">Sign in</button></form><div className="auth-divider">OR</div><button className="workspace-outline-button" type="button" onClick={() => navigate('/onboarding')}>G　Continue with Google</button><button className="workspace-outline-button" type="button" onClick={() => navigate('/onboarding')}>♧　Continue with SSO</button><p className="auth-footer">New here? <button type="button" onClick={() => navigate('/onboarding')}>Create account</button></p></section></div>;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const [level, setLevel] = useState(8);
  return <div className="auth-page onboarding-page"><section className="auth-card"><span className="auth-step">STEP 1 OF 4</span><div className="workspace-logo auth-logo">CL</div><h1>Let's set you up</h1><p>A few quick questions so we can decode institutional text the way that works best for you.</p><div className="onboarding-choice"><strong>Choose your reading complexity level:</strong><div className="complexity-icons"><span>◉</span><span>▤</span><span>▥</span></div><input type="range" min="6" max="10" step="2" value={level} onChange={(event) => setLevel(Number(event.target.value))} /><div className="complexity-labels"><span>Simple</span><span>Standard</span><span>Detailed</span></div><small>Decode into structured, clear sections.</small></div><button className="workspace-dark-button" type="button" onClick={() => { window.localStorage.setItem('clearlayer-onboarded', 'true'); navigate('/'); }}>Get started</button></section></div>;
}
