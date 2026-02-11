import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Removed unused useParams, useLocation
import { CheckCircle, XCircle, Loader, ArrowLeftCircle } from 'lucide-react';
import { createCustomerDetailEntry } from '../../../services/api';

// CSS & Assets
import '../Ayushpayhealth/Ayushpay.css';
import logo from '../../../../src/assets/img/TravelAssist_practo.webp';

// Redux
import { useAppSelector } from '../../../redux/NoLoginCustomer/hooks';

const CustomerDetails = () => {
  const navigate = useNavigate();

  // 1. Read from Redux
  const agent = useAppSelector((state) => state.agent);

  // 2. SAFETY CHECK: Redirect if data is missing (e.g., on page refresh)
  useEffect(() => {
    if (!agent.agentId || !agent.PlanSelection) {
      // If we don't have the agent ID, the form can't be submitted.
      // Redirect user back to the previous step.
      navigate(-1); 
    }
  }, [agent, navigate]);

  // 3. Component States
  const [isLoading, setIsLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    pan_number: '',
    mobile: '',
    email: '',
    pincode: ''
  });

  const [formErrors, setFormErrors] = useState({
    first_name: '',
    last_name: '',
    pan_number: '',
    mobile: '',
    email: '',
    pincode: ''
  });

  // 4. Input Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Auto-uppercase PAN number
    const finalValue = name === 'pan_number' ? value.toUpperCase() : value;
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));

    // Clear error for this field
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 5. Validation Logic
  const validateForm = (): boolean => {
    const errors: any = {};
    let isValid = true;

    if (!formData.first_name.trim()) { errors.first_name = 'First Name is required'; isValid = false; }
    if (!formData.mobile.trim() || !/^[0-9]{10}$/.test(formData.mobile)) { errors.mobile = 'Valid 10-digit Mobile is required'; isValid = false; }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { errors.email = 'Valid Email is required'; isValid = false; }

    // Optional but formatted fields
    if (formData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number)) {
      errors.pan_number = 'Invalid PAN format';
      isValid = false;
    }
    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) {
      errors.pincode = 'Invalid Pincode';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // 6. Submit Logic
  const handleCreateDetailEntry = async () => {
    if (!validateForm()) {
      setMessage({ text: 'Please fix form errors.', type: 'error' });
      return;
    }

    // Double check agent data exists before submitting
    if (!agent.agentId) {
        setMessage({ text: 'Session expired. Please go back and select a plan again.', type: 'error' });
        return;
    }

    setIsLoading(true);
    setLoaderMessage('Saving Customer Details...');

    try {
      const payload = {
        AgentId: agent.agentId,
        FirstName: formData.first_name,
        LastName: formData.last_name,
        Email: formData.email,
        Mobile: formData.mobile,
        PanNumber: formData.pan_number,
        Pincode: formData.pincode,
        PlanSelectionType: agent.PlanSelection,
        AgentEmail: agent.agentEmail || '',
        UId: agent.UId || ''
      };

      const result = await createCustomerDetailEntry(payload);

      if (result.Status === 'Success') {
        setMessage({
          text: 'Details recorded successfully. Thank you!',
          type: 'success'
        });
      } else {
        setMessage({
          text: result.Message || 'Failed to save details.',
          type: 'error'
        });
      }
    } catch (error: any) {
      setMessage({
        text: 'Internal Server Error. Please try again later.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
      setLoaderMessage('');
    }
  };

  return (
    <>
      <header style={commonStyles.header}>
        <div style={commonStyles.headerContent}>
          <div style={commonStyles.leftSection}>
            <img src={logo} alt="Logo" style={{ maxHeight: '60px', width: 'auto' }} />
          </div>
          <div style={commonStyles.centerSection}>
            <div className="logo d-flex align-items-center w-auto">
              <span className="logo-text" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                Zextra Wellness
              </span>
            </div>
          </div>
          <div style={commonStyles.rightSection}></div>
        </div>
      </header>

      {isLoading && (
        <div className="ayush-loader-overlay">
          <div className="ayush-loader-content">
            <Loader className="ayush-big-spinner" size={64} />
            <span className="ayush-loader-text">{loaderMessage}</span>
          </div>
        </div>
      )}

      <main className="ayush-main-content-customer">
        <div className="ayush-page-container">
          <div className="ayush-actions-wrapper">
            <button onClick={() => navigate(-1)} className="ayush-back-btn">
              <ArrowLeftCircle size={18} />
              <span>Back</span>
            </button>
          </div>

          <div className="ayush-card">
            <h1 className="ayush-header">Customer Information</h1>

            {/* Displaying Agent Name from Redux */}
            <p className="ayush-text">Referring Agent: <b>{agent.FullName}</b></p>

            <div className="ayush-form">
              <div className="ayush-form-row">
                <div className="ayush-form-group">
                  <label className="ayush-form-label">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    className={`ayush-form-control ${formErrors.first_name ? 'ayush-error-border' : ''}`}
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="First Name"
                  />
                  {formErrors.first_name && <span className="ayush-error-text">{formErrors.first_name}</span>}
                </div>

                <div className="ayush-form-group">
                  <label className="ayush-form-label">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    className="ayush-form-control"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div className="ayush-form-row">
                <div className="ayush-form-group">
                  <label className="ayush-form-label">Mobile Number *</label>
                  <input
                    type="tel"
                    name="mobile"
                    className={`ayush-form-control ${formErrors.mobile ? 'ayush-error-border' : ''}`}
                    value={formData.mobile}
                    onChange={handleChange}
                    maxLength={10}
                    placeholder="10-digit mobile"
                  />
                  {formErrors.mobile && <span className="ayush-error-text">{formErrors.mobile}</span>}
                </div>

                <div className="ayush-form-group">
                  <label className="ayush-form-label">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    className={`ayush-form-control ${formErrors.email ? 'ayush-error-border' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                  />
                  {formErrors.email && <span className="ayush-error-text">{formErrors.email}</span>}
                </div>
              </div>

              <div className="ayush-form-row">
                <div className="ayush-form-group">
                  <label className="ayush-form-label">PAN Number *</label>
                  <input
                    type="text"
                    name="pan_number"
                    className={`ayush-form-control ${formErrors.pan_number ? 'ayush-error-border' : ''}`}
                    value={formData.pan_number}
                    onChange={handleChange}
                    maxLength={10}
                    placeholder="ABCDE1234F"
                  />
                  {formErrors.pan_number && <span className="ayush-error-text">{formErrors.pan_number}</span>}
                </div>

                <div className="ayush-form-group">
                  <label className="ayush-form-label">Pin Code *</label>
                  <input
                    type="text"
                    name="pincode"
                    className={`ayush-form-control ${formErrors.pincode ? 'ayush-error-border' : ''}`}
                    value={formData.pincode}
                    onChange={handleChange}
                    maxLength={6}
                    placeholder="6-digit PIN"
                  />
                  {formErrors.pincode && <span className="ayush-error-text">{formErrors.pincode}</span>}
                </div>
              </div>
            </div>

            {message && (
              <div className={`ayush-api-message ${message.type === 'success' ? 'ayush-success' : 'ayush-error'}`}>
                {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                <span>{message.text}</span>
              </div>
            )}

            <div className="ayush-payment-actions" style={{ marginTop: '30px' }}>
              <button
                className='ayush-premium-btn'
                onClick={handleCreateDetailEntry}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Submit Registration'}
              </button>

              <button className='ayush-apply-btn' onClick={() => navigate(-1)} disabled={isLoading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </main>
      <footer className="footer">
        <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
      </footer>
    </>
  );
};

export default CustomerDetails;

const commonStyles: any = {
  header: {
    backgroundColor: '#6c63ff',
    padding: '1rem',
    top: 0,
    zIndex: 100,
    color: 'white'
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  leftSection: { flex: 1, display: 'flex', justifyContent: 'flex-start' },
  centerSection: { flex: 2, display: 'flex', justifyContent: 'center' },
  rightSection: { flex: 1 },
};