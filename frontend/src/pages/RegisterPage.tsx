import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../store/AuthContext';
import { getErrorMessage } from '../utils/errorMessage';

const PASSWORD_HINT =
    'At least 8 characters, one uppercase letter, and one number.';

export function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (password !== confirm) {
            toast.error('Passwords do not match');
            return;
        }
        setSubmitting(true);
        try {
            await register(name, email, password);
            toast.success('Account created — you are signed in.');
            navigate('/dashboard', { replace: true });
        } catch (err) {
            toast.error(getErrorMessage(err, 'Registration failed'));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">P</div>
                    <span className="auth-logo-text">PrimaTrade</span>
                </div>
                <h1 className="auth-title">Create account</h1>
                <p className="auth-subtitle">Register to manage tasks with a secure JWT session.</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-name">
                            Name
                        </label>
                        <input
                            id="reg-name"
                            className="form-input"
                            type="text"
                            autoComplete="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            minLength={2}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-email">
                            Email
                        </label>
                        <input
                            id="reg-email"
                            className="form-input"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-password">
                            Password
                        </label>
                        <input
                            id="reg-password"
                            className="form-input"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                        <p className="text-muted mt-4" style={{ fontSize: '12px' }}>
                            {PASSWORD_HINT}
                        </p>
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-confirm">
                            Confirm password
                        </label>
                        <input
                            id="reg-confirm"
                            className="form-input"
                            type="password"
                            autoComplete="new-password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Creating account…' : 'Register'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
