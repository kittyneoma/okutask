import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordChecks = {
    length: formData.password.length >= 8,
    number: /\d/.test(formData.password),
    confirm: formData.password === formData.confirmPassword && formData.confirmPassword !== ''
  }
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // validates password match
    if (formData.password !== formData.confirmPassword) {
      setError('The passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      await authService.register(registerData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <div className="auth-header">
          <h1>Join ACCO</h1>
          <p>Create your account and start organizing your projects</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* name */}
          <div className="form-group">
            <label htmlFor="name" className="label">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              placeholder="Full Name"
              required
              minLength="2"
            />
          </div>

          {/* email */}
          <div className="form-group">
            <label htmlFor="email" className="label">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              placeholder="your@email.com"
              required
            />
          </div>

          {/* password */}
          <div className="form-group">
            <label htmlFor="password" className="label">
              Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              placeholder="Minimum of 8 characters"
              required
              minLength="8"
            />

            {/* password requirements */}
            {formData.password.length > 0 && (
              <div className="password-requirements">
                <p className="req-title">Password requirements:</p>
                <ul>
                  <li className={passwordChecks.length ? 'req-met' : 'req-unmet'}>
                    {passwordChecks.length ? '✓' : '✖'} At least 8 characters
                  </li>
                  <li className={passwordChecks.number ? 'req-met' : 'req-unmet'}>
                    {passwordChecks.number ? '✓' : '✖'} At least one number
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* confirm password */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="label">
              Confirm Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`input ${
                formData.confirmPassword.length > 0 
                  ? (passwordChecks.confirm ? 'input-valid' : 'input-invalid')
                  : ''
              }`}
              placeholder="Re-enter your password"
              required
              minLength="8"
            />
            {formData.confirmPassword.length > 0 && (
              <span className={passwordChecks.confirm ? 'req-met' : 'req-unmet'}>
                {passwordChecks.confirm ? '✓ Passwords match' : '✖ Passwords do not match'}
              </span>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Do you already have an account? <Link to="/login">Sign in here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;