import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await register(name, email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.message || 'Registration failed');
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4 bg-light">
      <div className="p-5 bg-white shadow-lg rounded-4" style={{ maxWidth: 400, width: '100%' }}>
        <h4 className="fw-bold text-dark mb-4 text-center">Create Account</h4>
        {error && <div className="alert alert-danger p-2 small mb-3">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-bold">Full Name</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-bold">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-bold">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="d-grid gap-2 mt-3">
            <button className="btn btn-primary fw-bold" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Register'}
            </button>
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none"
              onClick={() => navigate('/login')}
            >
              Already have an account? Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
