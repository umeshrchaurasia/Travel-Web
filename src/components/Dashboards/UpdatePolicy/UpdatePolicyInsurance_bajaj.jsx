import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Home, CheckCircle, AlertTriangle } from 'lucide-react';
import { logout } from '../../../services/auth';
import logo from '../../../../src/assets/img/TravelAssist.webp';

import {
  updateBajajProposer,
  generatePolicybyPolicyno_bajaj,
  Getbajajpincode,
  PDF_BASE_URL
} from '../../../services/api';

// Inject spin animation once at module level
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}

const titleOptions = [
  { value: 'Mr', label: 'Mr.' },
  { value: 'Mrs', label: 'Mrs.' },
  { value: 'Ms', label: 'Ms.' },
  { value: 'Dr', label: 'Dr.' }
];

const genderOptions = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' }
];

// InputField Component
const InputField = ({
  label, name, value, onChange,
  type = 'text', error, required = false, disabled = false, options = []
}) => (
  <div style={commonStyles.inputGroup}>
    <label style={commonStyles.label}>
      {label} {required && <span style={{ color: 'red' }}>*</span>}
    </label>
    {type === 'select' ? (
      <select
        name={name}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        style={{
          ...commonStyles.input,
          backgroundColor: disabled ? '#f3f4f6' : 'white',
          borderColor: error ? '#dc2626' : '#e5e7eb'
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        style={{
          ...commonStyles.input,
          backgroundColor: disabled ? '#f3f4f6' : 'white',
          borderColor: error ? '#dc2626' : '#e5e7eb'
        }}
      />
    )}
    {error && (
      <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', position: 'absolute' }}>
        {error}
      </div>
    )}
  </div>
);

const UpdatePolicyInsurance_bajaj = ({ onLogout = () => { } }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [generatingPolicy, setGeneratingPolicy] = useState(false);
  const [loadingState, setLoadingState] = useState('');
  const [policyGenerated, setPolicyGenerated] = useState(false);
  const [policyResponseData, setPolicyResponseData] = useState(null);

  const [formData, setFormData] = useState({
    ProposerTitle: 'Mr',
    ProposerFirstName: '',
    ProposerMiddleName: '',
    ProposerLastName: '',
    ProposerGender: 'M',
    ProposerPassport: '',
    AddressLine1: '',
    PinCode: '',
    CityName: '',
    State: '',
    Certificate_Number: '',
  });

  // Load from sessionStorage on mount
  useEffect(() => {
    const storedData = sessionStorage.getItem('proposalData');
    if (!storedData) {
      navigate('/dashboard');
      return;
    }
    try {
      const proposal = JSON.parse(storedData);
      setFormData({
        ProposerTitle: proposal.ProposerTitle || 'Mr',
        ProposerFirstName: proposal.FirstName || proposal.InsuredFirstName || '',
        ProposerMiddleName: proposal.MiddleName || proposal.InsuredMiddleName || '',
        ProposerLastName: proposal.LastName || proposal.InsuredLastName || '',
        ProposerGender: proposal.Gender || proposal.InsuredGender || 'M',
        ProposerPassport: proposal.PassportNo || '',
        AddressLine1: proposal.AddressLine1 || '',
        PinCode: proposal.PinCode || '',
        CityName: proposal.CityName || '',
        State: proposal.State || '',
        Certificate_Number: proposal.Certificate_Number || proposal.Policy_No || '',
      });
    } catch (error) {
      console.error('Error parsing stored proposal data:', error);
      setErrorMessage('Error loading policy data');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Auto-fill City & State from Pincode API
  useEffect(() => {
    const fetchCityState = async () => {
      if (formData.PinCode && /^[0-9]{6}$/.test(formData.PinCode)) {
        try {
          const response = await Getbajajpincode(formData.PinCode);
          if (
            response?.MasterData?.applicationError?.errorCode === '0' &&
            response?.MasterData?.pincodeDetail
          ) {
            const { cityName, stateName } = response.MasterData.pincodeDetail;
            setFormData(prev => ({ ...prev, CityName: cityName, State: stateName }));
          }
        } catch (error) {
          console.error('Error fetching pincode details:', error);
        }
      }
    };
    fetchCityState();
  }, [formData.PinCode]);

  const handleInputChange = (e) => {
    let { name, value } = e.target;

    // Allow only digits, max 6 chars for PinCode
    if (name === 'PinCode') {
      value = value.replace(/\D/g, '').slice(0, 6);
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear field error on change
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    setErrorMessage('');
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.ProposerFirstName?.trim()) errors.ProposerFirstName = 'First Name is required';
    if (!formData.ProposerLastName?.trim()) errors.ProposerLastName = 'Last Name is required';

   if (formData.ProposerPassport?.trim()) {
      // Use toUpperCase() to ensure the regex match succeeds even if user input is lowercase
      if (!/^[A-Z]{1,2}[0-9]{6,7}$/.test(formData.ProposerPassport.trim().toUpperCase())) {
        errors.ProposerPassport = 'Invalid passport format (e.g., Z1234567 or ZA045860)';
      }
    } else {
      errors.ProposerPassport = 'Passport Number is required';
    }
    if (!formData.AddressLine1?.trim()) errors.AddressLine1 = 'Address is required';

    if (!formData.PinCode?.trim()) {
      errors.PinCode = 'Pin Code is required';
    } else if (!/^[0-9]{6}$/.test(formData.PinCode)) {
      errors.PinCode = 'Pin Code must be 6 digits';
    }

    if (!formData.CityName?.trim()) errors.CityName = 'City is required';
    if (!formData.State?.trim()) errors.State = 'State is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmSubmit = () => {
    if (validateForm()) {
      setShowConfirmation(true);
    } else {
      const firstErrorField = Object.keys(formErrors)[0];
      const el = document.querySelector(`[name="${firstErrorField}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmit = async () => {
    setShowConfirmation(false);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      setSubmitting(true);

      const updateData = {
        PolicyNo: formData.Certificate_Number,
        ProposerTitle: formData.ProposerTitle,
        ProposerFirstName: formData.ProposerFirstName,
        ProposerMiddleName: formData.ProposerMiddleName,
        ProposerLastName: formData.ProposerLastName,
        ProposerGender: formData.ProposerGender,
        ProposerPassport: formData.ProposerPassport,
        AddressLine1: formData.AddressLine1,
        PinCode: formData.PinCode,
        CityName: formData.CityName,
        State: formData.State,
      };

      console.log('Updating proposal:', JSON.stringify(updateData));
      const response = await updateBajajProposer(updateData);

      if (response && response.Status === 'Success') {
        setSuccessMessage('Policy updated successfully!');
        await generatePolicy();
      } else {
        setErrorMessage(response?.Message || 'Failed to update policy. Please try again.');
      }
    } catch (error) {
      console.error('Error updating policy:', error);
      setErrorMessage(error.response?.data?.Message || 'Error updating policy. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const generatePolicy = async () => {
    if (!formData.Certificate_Number) {
      setErrorMessage('Policy number is required to generate the policy document');
      return;
    }
    try {
      setGeneratingPolicy(true);
      setLoadingState('Generating policy document...');
      setPolicyGenerated(false);
      setPolicyResponseData(null);

      const response = await generatePolicybyPolicyno_bajaj({ Policyno: formData.Certificate_Number });
      console.log('Generate policy response:', response);

      if (response?.Status !== 'Success') {
        throw new Error(response?.Message || 'Failed to generate policy document');
      }

      const pdfUrl = response.MasterData?.combinepdfurl || (response.MasterData?.proposals && response.MasterData.proposals[0]?.PolicypdfUrl);
      if (!pdfUrl) throw new Error('PDF URL not found in response');

      setPolicyResponseData({
        fullPdfUrl: `${PDF_BASE_URL}${pdfUrl}`,
        customerName: `${formData.ProposerFirstName} ${formData.ProposerMiddleName} ${formData.ProposerLastName}`.trim(),
        policyNumber: formData.Certificate_Number
      });
      setPolicyGenerated(true);

      setTimeout(() => {
        document.getElementById('policyResultMessage')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (error) {
      console.error('Error generating policy:', error);
      setErrorMessage(`Failed to generate policy document: ${error.message || 'Unknown error'}`);
    } finally {
      setGeneratingPolicy(false);
      setLoadingState('');
    }
  };

  const handleLogout = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      logout();
      if (onLogout) onLogout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const ConfirmationDialog = () => (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '8px',
        padding: '20px 25px', maxWidth: '450px', width: '90%',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Confirm Update</h3>
        <p style={{ marginBottom: '20px', lineHeight: '1.5', color: '#4b5563' }}>
          Are you sure you want to update this policy? The changes will be saved permanently.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={() => setShowConfirmation(false)}
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#6c63ff', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Confirm Update
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{
          width: '40px', height: '40px',
          border: '4px solid #f3f3f3', borderTop: '4px solid #6c63ff',
          borderRadius: '50%', animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div style={commonStyles.container}>
      {showConfirmation && <ConfirmationDialog />}

      {/* Policy generation overlay */}
      {generatingPolicy && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px',
            borderRadius: '8px', textAlign: 'center', maxWidth: '400px'
          }}>
            <div style={{
              display: 'inline-block', width: '40px', height: '40px',
              border: '4px solid #f3f3f3', borderTop: '4px solid #6c63ff',
              borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px'
            }} />
            <p style={{ fontSize: '16px', fontWeight: '500' }}>{loadingState}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={commonStyles.header}>
        <div style={commonStyles.headerContent}>
          <img src={logo} alt="ZextrA Travel Assist" style={{ maxHeight: '50px', width: 'auto' }} />
          <div style={{ display: 'flex', gap: '20px' }}>
            <button onClick={() => navigate('/dashboard')} style={{ ...commonStyles.navButton, backgroundColor: '#dc2626' }}>
              <Home size={18} /> Dashboard
            </button>
            <button onClick={handleLogout} style={{ ...commonStyles.navButton, backgroundColor: '#dc2626' }}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main style={commonStyles.mainContent}>

        {/* Policy Generated Success */}
        {policyGenerated && policyResponseData && (
          <div id="policyResultMessage" style={{
            marginBottom: '20px', padding: '20px', backgroundColor: '#f0fff4',
            borderRadius: '8px', border: '1px solid #10b981',
            display: 'flex', flexDirection: 'column', gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={24} style={{ color: '#10b981' }} />
              <h4 style={{ color: '#10b981', fontSize: '18px', margin: 0 }}>Policy Generated Successfully!</h4>
            </div>
            <p style={{ margin: '5px 0' }}><strong>Customer Name:</strong> {policyResponseData.customerName}</p>
            <p style={{ margin: '5px 0' }}><strong>Policy Number:</strong> {policyResponseData.policyNumber}</p>
            <div style={{ marginTop: '10px' }}>
              <a
                href={policyResponseData.fullPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block', backgroundColor: '#6c63ff', color: 'white',
                  padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: '500'
                }}
              >
                View PDF
              </a>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div style={commonStyles.card}>
          <h3 style={commonStyles.cardTitle}>Update Proposal</h3>
          <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
            Certificate No: <strong>{formData.Certificate_Number || 'N/A'}</strong>
          </p>

          <div style={commonStyles.formGrid}>

            {/* Title */}
            <InputField
              label="Title" name="ProposerTitle"
              value={formData.ProposerTitle}
              onChange={handleInputChange}
              type="select" options={titleOptions}
            />

            {/* First Name */}
            <InputField
              label="First Name" name="ProposerFirstName"
              value={formData.ProposerFirstName}
              onChange={handleInputChange}
              required error={formErrors.ProposerFirstName}
            />

            {/* Middle Name */}
            <InputField
              label="Middle Name" name="ProposerMiddleName"
              value={formData.ProposerMiddleName}
              onChange={handleInputChange}
            />

            {/* Last Name */}
            <InputField
              label="Last Name" name="ProposerLastName"
              value={formData.ProposerLastName}
              onChange={handleInputChange}
              required error={formErrors.ProposerLastName}
            />

            {/* Gender */}
            <InputField
              label="Gender" name="ProposerGender"
              value={formData.ProposerGender}
              onChange={handleInputChange}
              type="select" options={genderOptions}
            />

            {/* Passport */}
            <InputField
              label="Passport Number" name="ProposerPassport"
              value={formData.ProposerPassport}
              onChange={handleInputChange}
              required error={formErrors.ProposerPassport}
            />

            {/* Address */}
            <InputField
              label="Address" name="AddressLine1"
              value={formData.AddressLine1}
              onChange={handleInputChange}
              required error={formErrors.AddressLine1}
            />

            {/* Pin Code */}
            <InputField
              label="Pin Code" name="PinCode"
              value={formData.PinCode}
              onChange={handleInputChange}
              required error={formErrors.PinCode}
            />

            {/* City — auto-filled from pincode, read-only */}
            <InputField
              label="City" name="CityName"
              value={formData.CityName}
              onChange={handleInputChange}
              disabled required error={formErrors.CityName}
            />

            {/* State — auto-filled from pincode, read-only */}
            <InputField
              label="State" name="State"
              value={formData.State}
              onChange={handleInputChange}
              disabled required error={formErrors.State}
            />

          </div>

          {/* Status Messages */}
          {errorMessage && (
            <div style={{
              marginTop: '20px', padding: '15px', backgroundColor: '#fee2e2',
              color: '#dc2626', borderRadius: '6px',
              display: 'flex', alignItems: 'flex-start', gap: '10px'
            }}>
              <AlertTriangle size={20} />
              <div><strong>Error: </strong>{errorMessage}</div>
            </div>
          )}

          {successMessage && !policyGenerated && (
            <div style={{
              marginTop: '20px', padding: '15px', backgroundColor: '#f0fdf4',
              color: '#059669', borderRadius: '6px',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <CheckCircle size={20} />
              {successMessage}
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: '15px',
            marginTop: '30px', borderTop: '1px solid #e5e7eb', paddingTop: '20px'
          }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              disabled={submitting || generatingPolicy}
              style={{
                padding: '10px 20px', border: '1px solid #e5e7eb',
                borderRadius: '6px', backgroundColor: 'white',
                cursor: (submitting || generatingPolicy) ? 'not-allowed' : 'pointer',
                opacity: (submitting || generatingPolicy) ? 0.7 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSubmit}
              disabled={submitting || generatingPolicy}
              style={{
                padding: '10px 20px', backgroundColor: '#6c63ff', color: 'white',
                border: 'none', borderRadius: '6px',
                cursor: (submitting || generatingPolicy) ? 'not-allowed' : 'pointer',
                opacity: (submitting || generatingPolicy) ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {submitting ? (
                <>
                  <div style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white',
                    borderRadius: '50%', animation: 'spin 1s linear infinite'
                  }} />
                  <span>Updating...</span>
                </>
              ) : 'Update Policy'}
            </button>
          </div>
        </div>
      </main>

      <footer style={{ background: '#6c63ff', color: 'white', padding: '1rem', textAlign: 'center', marginTop: 'auto' }}>
        <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
      </footer>
    </div>
  );
};

const commonStyles = {
  container: { backgroundColor: '#f3f4f6', minHeight: '100vh' },
  header: { backgroundColor: '#6c63ff', padding: '1rem', position: 'sticky', top: 0, zIndex: 100, color: 'white' },
  headerContent: { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navButton: {
    backgroundColor: '#5a52d5', color: 'white', padding: '8px 16px',
    borderRadius: '4px', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px'
  },
  mainContent: { maxWidth: '1200px', margin: '20px auto', padding: '0 20px' },
  card: { background: 'white', borderRadius: '8px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  cardTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#1f2937' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
  inputGroup: { marginBottom: '25px', position: 'relative' },
  label: { display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' },
};

export default UpdatePolicyInsurance_bajaj;