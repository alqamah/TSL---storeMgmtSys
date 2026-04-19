import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  const [form, setForm] = useState({ p_no: '', name: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <button className="login-theme-btn" onClick={toggleTheme} aria-label="Toggle Theme">
          {isDarkMode ? <HiOutlineSun /> : <HiOutlineMoon />}
        </button>
        <button className="login-close-btn" onClick={() => navigate('/')} aria-label="Close">✕</button>
        <div className="login-header">
          <h1 className="login-title">Create Account</h1>
          <p className="login-subtitle">Register as a store manager</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">P.No (6 characters)</label>
            <input
              id="register-pno"
              className="form-input"
              type="text"
              name="p_no"
              placeholder="Enter your TSL Personal Number"
              value={form.p_no}
              onChange={handleChange}
              maxLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              id="register-name"
              className="form-input"
              type="text"
              name="name"
              placeholder="Enter your name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="register-password"
              className="form-input"
              type="password"
              name="password"
              placeholder="Choose a password"
              value={form.password}
              onChange={handleChange}
              minLength={4}
              required
            />
          </div>

          <button
            id="register-submit"
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <div className="login-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
