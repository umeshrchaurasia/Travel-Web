import React, { useState, useEffect } from 'react';
import { loginUser } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
// Replace logo import with TravelAssist.webp
import logo from '../../../src/assets/img/TravelAssist.webp';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    mobile: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Check for saved credentials
    const savedCredentials = localStorage.getItem('savedCredentials');
    if (savedCredentials) {
      const credentials = JSON.parse(savedCredentials);
      setFormData(credentials);
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await loginUser(formData.mobile, formData.password);
      if (result.Status === 'Success') {
        // Store complete MasterData
        const userData = result.MasterData;
        if (rememberMe) {
          localStorage.setItem('savedCredentials', JSON.stringify(formData));
          localStorage.setItem('userData', JSON.stringify(userData));
        } else {
          localStorage.removeItem('savedCredentials');
          sessionStorage.setItem('userData', JSON.stringify(userData));
        }
        onLogin(userData);
        navigate('/dashboard');
      } else {
        setError(result.Message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="LoginComponent">
      <div className="container">
        <section className="section register min-vh-100 d-flex flex-column align-items-center justify-content-center py-4">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-4 col-md-6 d-flex flex-column align-items-center justify-content-center">
                <div className="d-flex justify-content-center py-4">
                  <Link to="/" className="logo d-flex align-items-center w-auto">
                    {/* Use the updated logo with style to maintain original dimensions */}
                    <img 
                      src={logo} 
                      alt="ZextrA Travel Assist" 
                      style={{ maxHeight: '80px', width: 'auto' }}
                    />
                    <span className="d-none d-lg-block">Travel Assistance Service</span>
                  </Link>
                </div>

                <div className="card mb-3">
                  <div className="card-body">
                    <div className="pt-4 pb-2">
                      <h5 className="card-title text-center pb-0 fs-4">Login to Your Account</h5>
                      <p className="text-center small">Enter your Mobile & password to login</p>
                    </div>

                    {error && (
                      <div className="alert alert-danger" role="alert">
                        {error}
                      </div>
                    )}

                    <form
                      className="row g-3"
                      onSubmit={handleSubmit}
                      autoComplete="on"
                      method="post"
                    >
                      <div className="col-12">
                        <label htmlFor="username" className="form-label">Mobile Number</label>
                        <input
                          type="tel"
                          autoFocus
                          className="form-control"
                          id="username"
                          name="mobile"
                          autoComplete="username"
                          value={formData.mobile}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="col-12 position-relative">
                        <label htmlFor="current-password" className="form-label">Password</label>
                        <input
                          type="password"
                          className="form-control"
                          id="current-password"
                          name="password"
                          autoComplete="current-password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="rememberMe">
                            Remember me
                          </label>
                        </div>
                      </div>

                      <div className="col-12">
                        <button
                          className="btn btn-primary w-100"
                          type="submit"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                      </div>

                      <div className="col-12">
                        <p className="small mb-0">
                          Don't have account? <Link to="/signup">Create an account</Link>
                        </p>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="credits">
                  <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;