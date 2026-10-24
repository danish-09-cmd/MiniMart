import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiError } from '../utils/apiError.js';
import { getPostAuthTarget } from '../utils/navigation.js';

export default function Register() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
    if (!form.name.trim()) errors.name = 'Name is required.';
    else if (form.name.trim().length > 100) errors.name = 'Name must be at most 100 characters.';
    if (!form.email.trim()) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
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
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      toast.success('Your MiniMart account is ready.');
      navigate(getPostAuthTarget(location, searchParams.get('redirect')), { replace: true });
    } catch (error) {
      const result = getApiError(error, 'Account creation failed. Please try again.');
      setFieldErrors(result.fieldErrors);
      setErrorMessage(result.message);
      toast.error(result.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-section container py-5">
      <div className="auth-card register-card row g-0 mx-auto overflow-hidden">
        <div className="auth-aside register-aside col-lg-5 d-none d-lg-flex flex-column justify-content-between">
          <div>
            <span className="auth-eyebrow">Make room for good things</span>
            <h1>Your next favorite is waiting.</h1>
            <p>Create an account and keep your everyday shopping in one easy place.</p>
          </div>
          <div className="aside-note"><span aria-hidden="true">✦</span> One account, a simpler shop.</div>
        </div>

        <div className="auth-content col-12 col-lg-7">
          <div className="auth-heading">
            <span className="auth-kicker">JOIN MINIMART</span>
            <h2>Create your account</h2>
            <p>It only takes a moment to get started.</p>
          </div>

          <ErrorMessage message={errorMessage} />

          <form onSubmit={submit} noValidate>
            <div className="mb-3">
              <label className="form-label" htmlFor="register-name">Full name</label>
              <input
                id="register-name"
                name="name"
                className={`form-control${fieldErrors.name ? ' is-invalid' : ''}`}
                type="text"
                autoComplete="name"
                maxLength={100}
                value={form.name}
                onChange={updateField}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? 'register-name-error' : undefined}
                required
              />
              {fieldErrors.name && <div className="invalid-feedback" id="register-name-error">{fieldErrors.name}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="register-email">Email address</label>
              <input
                id="register-email"
                name="email"
                className={`form-control${fieldErrors.email ? ' is-invalid' : ''}`}
                type="email"
                autoComplete="email"
                maxLength={150}
                value={form.email}
                onChange={updateField}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
                required
              />
              {fieldErrors.email && <div className="invalid-feedback" id="register-email-error">{fieldErrors.email}</div>}
            </div>

            <div className="mb-4">
              <label className="form-label" htmlFor="register-password">Password</label>
              <input
                id="register-password"
                name="password"
                className={`form-control${fieldErrors.password ? ' is-invalid' : ''}`}
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                value={form.password}
                onChange={updateField}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'register-password-error' : 'register-password-help'}
                required
              />
              {fieldErrors.password
                ? <div className="invalid-feedback" id="register-password-error">{fieldErrors.password}</div>
                : <div className="form-text" id="register-password-help">Choose 8 to 72 characters.</div>}
            </div>

            <button className="btn btn-primary auth-submit w-100" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Creating account…</> : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </section>
  );
}
