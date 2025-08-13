// src/components/Signup.jsx
import React, { useState } from 'react';
import { signupUser } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import './Signup.css';
import logo from '../../../src/assets/img/TravelAssist.webp';

function Signup({ onSignupSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    UId: '',
    FullName: '',
    Password: '',
    EmailID: '',
    MobileNumber: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signupUser(formData);
      if (result.Status === 'Success') {
        alert('Signup successful!');
        onSignupSuccess();
        navigate('/login');
      } else {
        setError(result.Message || 'Signup failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="SignupComponent">
      <div className="container">
        <section className="section register min-vh-100 d-flex flex-column align-items-center justify-content-center py-4">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-4 col-md-6 d-flex flex-column align-items-center justify-content-center">
                
                <div className="d-flex justify-content-center py-4">
                  <Link to="/" className="logo d-flex align-items-center w-auto">
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
                      <h5 className="card-title text-center pb-0 fs-4">Create an Account</h5>
                      <p className="text-center small">Enter your personal details to create account</p>
                    </div>

                    {error && (
                      <div className="alert alert-danger" role="alert">
                        {error}
                      </div>
                    )}

                    <form className="row g-3 needs-validation" onSubmit={handleSubmit}>
                      <div className="col-12">
                        <label htmlFor="yourEmpId" className="form-label">Employee ID</label>
                        <input 
                          type="text"
                          name="UId"
                          autoFocus
                          className="form-control"
                          id="yourEmpId"
                          value={formData.UId}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label htmlFor="yourName" className="form-label">Your Name</label>
                        <input 
                          type="text"
                          name="FullName"
                          className="form-control"
                          id="yourName"
                          value={formData.FullName}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label htmlFor="yourEmail" className="form-label">Your Email</label>
                        <input 
                          type="email"
                          name="EmailID"
                          className="form-control"
                          id="yourEmail"
                          value={formData.EmailID}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label htmlFor="yourPassword" className="form-label">Password</label>
                        <input 
                          type="password"
                          name="Password"
                          className="form-control"
                          id="yourPassword"
                          value={formData.Password}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label htmlFor="yourMobile" className="form-label">Mobile Number</label>
                        <input 
                          type="tel"
                          name="MobileNumber"
                          className="form-control"
                          id="yourMobile"
                          value={formData.MobileNumber}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            name="acceptTerms"
                            id="acceptTerms"
                            required
                          />
                          <label className="form-check-label" htmlFor="acceptTerms">
                            I agree and accept the <a href="#terms">terms and conditions</a>
                          </label>
                        </div>
                      </div>

                      <div className="col-12">
                        <button 
                          className="btn btn-primary w-100" 
                          type="submit"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                      </div>

                      <div className="col-12">
                        <p className="small mb-0">
                          Already have an account? <Link to="/login">Log in</Link>
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

export default Signup;