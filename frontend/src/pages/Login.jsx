import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiError } from '../utils/apiError.js';
import { getPostAuthTarget } from '../utils/navigation.js';

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) return <Loader label="Loading your account…" />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
    setErrorMessage('');
  };

  const submit = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!form.email.trim()) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
    else if (form.email.trim().length > 150) errors.email = 'Email must be at most 150 characters.';
    if (!form.password) errors.password = 'Password is required.';
    else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.';
    else if (form.password.length > 72) errors.password = 'Password must be no longer than 72 characters.';

    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      const message = 'Please correct the highlighted fields.';
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await login({ email: form.email.trim(), password: form.password });
      toast.success('Welcome back. You are signed in.');
      navigate(getPostAuthTarget(location, searchParams.get('redirect')), { replace: true });
    } catch (error) {
      const result = getApiError(error, 'Sign in failed. Check your email and password.');
      setFieldErrors(result.fieldErrors);
      setErrorMessage(result.message);
      toast.error(result.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-section container py-5">
      <div className="auth-card row g-0 mx-auto overflow-hidden">
        <div className="auth-aside col-lg-5 d-none d-lg-flex flex-column justify-content-between">
          <div>
            <span className="auth-eyebrow">A little closer to home</span>
            <h1>Good to see you again.</h1>
            <p>Your everyday favorites are just a few clicks away.</p>
          </div>
          <div className="aside-note"><span aria-hidden="true">✦</span> Simple shopping. Thoughtful finds.</div>
        </div>

        <div className="auth-content col-12 col-lg-7">
          <div className="auth-heading">
            <span className="auth-kicker">WELCOME BACK</span>
            <h2>Sign in to MiniMart</h2>
            <p>Enter your account details to continue.</p>
          </div>

          <ErrorMessage message={errorMessage} />

          <form onSubmit={submit} noValidate>
            <div className="mb-3">
              <label className="form-label" htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                name="email"
                className={`form-control${fieldErrors.email ? ' is-invalid' : ''}`}
                type="email"
                autoComplete="email"
                maxLength={150}
                value={form.email}
                onChange={updateField}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
                required
              />
              {fieldErrors.email && <div className="invalid-feedback" id="login-email-error">{fieldErrors.email}</div>}
            </div>

            <div className="mb-4">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                className={`form-control${fieldErrors.password ? ' is-invalid' : ''}`}
                type="password"
                autoComplete="current-password"
                value={form.password}
                maxLength={72}
                onChange={updateField}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'login-password-error' : 'login-password-help'}
                minLength={8}
                required
              />
              {fieldErrors.password
                ? <div className="invalid-feedback" id="login-password-error">{fieldErrors.password}</div>
                : <div className="form-text" id="login-password-help">Use at least 8 characters.</div>}
            </div>

            <button className="btn btn-primary auth-submit w-100" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Signing in…</> : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">New to MiniMart? <Link to="/register">Create an account</Link></p>
        </div>
      </div>
    </section>
  );
}
