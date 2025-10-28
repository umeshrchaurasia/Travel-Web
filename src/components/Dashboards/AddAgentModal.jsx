// AddAgentModal.jsx - PART 1: Imports, States, and Functions
import React, { useState, useEffect, useRef } from 'react';
import { addAgent, sendOtp, checkEmailDuplicate, checkMobileDuplicate, verifyPanpro } from '../../services/api';
import {
  Eye, EyeOff, Mail, Check, AlertCircle, X, CheckCircle, XCircle,
  Shield, User, CreditCard, MapPin, Calendar
} from 'lucide-react';
import './Modal_addAgent.css';

const AddAgentModal = ({ isOpen, onClose, onSuccess, userId }) => {
  // Initialize form data
  const initialFormData = {
    UId: userId || '',
    FullName: '',
    TraderName: '',
    Password: '',
    EmailID: '',
    MobileNumber: '',
    Gender: 'Male',
    DOB: '',
    PayoutPercentage: '',
    PaymentMode: 'Full Pay',
    Wallet_Amount: '0',
    EducationQualification: '',
    GST: '',
    Address: '',
    PAN_No: '',
    State: ''
  };

  // Create refs for form elements
  const formRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const mobileInputRef = useRef(null);

  // States
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formKey, setFormKey] = useState(Date.now());
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [validationLoading, setValidationLoading] = useState({});
  const [isPanValidated, setIsPanValidated] = useState(false);
  // PAN Validation States
  const [showPanValidationModal, setShowPanValidationModal] = useState(false);
  const [panValidationLoading, setPanValidationLoading] = useState(false);
  const [panValidationResult, setPanValidationResult] = useState(null);
  const [panValidationError, setPanValidationError] = useState('');
  const [showPanValidationResult, setShowPanValidationResult] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
      setFormKey(Date.now());
    }
  }, [isOpen, userId]);

  // Complete form reset function
  const resetForm = () => {
    const freshInitialData = {
      UId: userId || '',
      FullName: '',
      TraderName: '',
      Password: '',
      EmailID: '',
      MobileNumber: '',
      Gender: 'Male',
      DOB: '',
      PayoutPercentage: '',
      PaymentMode: 'Full Pay',
      Wallet_Amount: '0',
      EducationQualification: '',
      GST: '',
      Address: '',
      PAN_No: ''
    };

    setFormData(freshInitialData);
    setFormErrors({});
    setError('');
    setSuccess('');
    setShowConfirmClose(false);
    setShowPassword(false);
    setOtpSent(false);
    setOtpSending(false);
    setValidationLoading({});

    // Reset PAN validation states
    setShowPanValidationModal(false);
    setPanValidationLoading(false);
    setPanValidationResult(null);
    setPanValidationError('');
    setShowPanValidationResult(false);
    setIsPanValidated(false);

    setTimeout(() => {
      if (formRef.current) {
        formRef.current.reset();
      }

      if (emailInputRef.current) emailInputRef.current.value = '';
      if (passwordInputRef.current) passwordInputRef.current.value = '';
      if (mobileInputRef.current) mobileInputRef.current.value = '';

      const inputs = document.querySelectorAll('.modal-content input');
      inputs.forEach(input => {
        input.setAttribute('autocomplete', 'new-password');
        if (input.type !== 'checkbox' && input.type !== 'radio') {
          input.value = '';
        }
      });
    }, 50);
  };

  // PAN Card Validation Handler
  const handlePanCardValidation = async () => {
    setError('');
    setPanValidationError('');

    // Validate PAN format first
    const panError = validations.validatePAN(formData.PAN_No);
    if (panError) {
      setFormErrors(prev => ({
        ...prev,
        PAN_No: panError
      }));
      return;
    }

    // Check if Full Name is provided
    if (!formData.FullName || !formData.FullName.trim()) {
      setPanValidationError('Please enter Full Name before validating PAN');
      setShowPanValidationResult(true);
      return;
    }

    // Check if PAN is provided
    if (!formData.PAN_No || !formData.PAN_No.trim()) {
      setPanValidationError('Please enter PAN Number before validation');
      setShowPanValidationResult(true);
      return;
    }

    setPanValidationLoading(true);
    setPanValidationError('');
    setPanValidationResult(null);
    setShowPanValidationResult(true);

    try {
      const result = await verifyPanpro(formData.PAN_No, formData.FullName);
      console.log('PAN Verification Result:', result);

      // FIXED: Check the actual API response structure
      if (result.Status === 'Success' && result.MasterData) {
        setPanValidationResult(result.MasterData);

        // FIXED: Check if result exists and has pan_number (successful verification)
        if (result.MasterData.result && result.MasterData.result.pan_number) {
          setIsPanValidated(true);

          // FIXED: Update form with verified name if available
          if (result.MasterData.result.user_full_name) {
            setFormData(prev => ({
              ...prev,
              FullName: result.MasterData.result.user_full_name
            }));

            // Clear any existing name validation errors
            setFormErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors.FullName;
              return newErrors;
            });
          }

          // Log database save status
          if (result.MasterData.database_save?.status === 'Success') {
            console.log('PAN details saved to database successfully:', {
              id: result.MasterData.database_save.saved_id,
              saved_at: result.MasterData.database_save.saved_at
            });
          }
        } else if (result.MasterData.success && !result.MasterData.result) {
          // FIXED: Handle "No Record Found" case
          setIsPanValidated(false);
          setPanValidationError(
            result.MasterData.response_message || 'No PAN record found. Please verify the PAN number and name.'
          );
        } else {
          // FIXED: Handle other failure cases
          setIsPanValidated(false);
          setPanValidationError(
            result.MasterData.response_message || 'PAN verification failed'
          );
        }
      } else {
        // FIXED: Handle API failure
        setIsPanValidated(false);
        setPanValidationError(result.Message || 'PAN verification failed');
      }
    } catch (error) {
      console.error('PAN validation error:', error);
      setPanValidationError('Failed to verify PAN. Please try again.');
      setIsPanValidated(false);
    } finally {
      setPanValidationLoading(false);
    }
  };


  // Enhanced PAN Validation Display Component

  const PanValidationDisplay = () => {
    if (!showPanValidationResult) return null;

    return (
      <div style={{ marginTop: '15px' }}>
        {panValidationLoading && (
          <div style={{
            padding: '20px',
            backgroundColor: '#fff8eb',
            border: '1px solid #fcd34d',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            color: '#b45309'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #E08D28',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginRight: '12px'
            }}></div>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Verifying PAN Card...</div>
              <div style={{ fontSize: '12px', opacity: '0.8' }}>Please wait while we validate and save your PAN details</div>
            </div>
          </div>
        )}

        {panValidationError && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'flex-start',
            fontSize: '14px'
          }}>
            <XCircle size={20} style={{ marginRight: '12px', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '16px' }}>Validation Failed</div>
              <div style={{ lineHeight: '1.5' }}>{panValidationError}</div>
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                backgroundColor: '#fee2e2',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                <strong>Note:</strong> Please ensure PAN number and name are correct, then try again.
              </div>
            </div>
          </div>
        )}

        {/* FIXED: Success case - when result exists and has pan_number */}
        {panValidationResult && panValidationResult.result && panValidationResult.result.pan_number && (
          <div style={{
            backgroundColor: '#f0fdf4',
            color: '#16a34a',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'flex-start',
            fontSize: '14px'
          }}>
            <CheckCircle size={20} style={{ marginRight: '12px', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '16px' }}>PAN Verification Successful</div>
              <div style={{ lineHeight: '1.5' }}>
                <div><strong>PAN Number:</strong> {panValidationResult.result.pan_number}</div>
                <div><strong>Name:</strong> {panValidationResult.result.user_full_name}</div>
                <div><strong>Date of Birth:</strong> {panValidationResult.result.user_dob}</div>
                <div><strong>Gender:</strong> {panValidationResult.result.user_gender === 'M' ? 'Male' : 'Female'}</div>
                {panValidationResult.result.user_address && (
                  <div><strong>Address:</strong> {panValidationResult.result.user_address.full}</div>
                )}
                <div><strong>Name Match Score:</strong> {panValidationResult.result.name_match_score}%</div>
                <div><strong>PAN Type:</strong> {panValidationResult.result.pan_type}</div>
              </div>
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                backgroundColor: '#dcfce7',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                <strong>✓ Verified:</strong> PAN details have been successfully verified and saved.
              </div>
              {panValidationResult.database_save?.status === 'Success' && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: '#166534',
                  fontStyle: 'italic'
                }}>
                  Data saved to database with ID: {panValidationResult.database_save.saved_id}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FIXED: No record found case - when success is true but result is null */}
        {panValidationResult && panValidationResult.success && !panValidationResult.result && (
          <div style={{
            backgroundColor: '#fffbeb',
            color: '#d97706',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #fcd34d',
            display: 'flex',
            alignItems: 'flex-start',
            fontSize: '14px'
          }}>
            <AlertCircle size={20} style={{ marginRight: '12px', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '16px' }}>No Record Found</div>
              <div style={{ lineHeight: '1.5' }}>
                {panValidationResult.response_message || 'No PAN record found in the system'}
              </div>
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                backgroundColor: '#fef3c7',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                <strong>Note:</strong> Please verify that the PAN number and name are correctly entered.
                The PAN might not be registered or there might be a mismatch in the provided details.
              </div>
              {panValidationResult.database_save?.status === 'Skipped' && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: '#92400e',
                  fontStyle: 'italic'
                }}>
                  No data was saved to database as no valid PAN record was found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };



  // Enhanced validations with duplicate checking
  const enhancedValidations = {
    validateEmail: async (email) => {
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!email) return "Email is required";
      if (!emailRegex.test(email)) return "Please enter a valid email address";

      try {
        setValidationLoading(prev => ({ ...prev, EmailID: true }));
        const response = await checkEmailDuplicate(email);
        if (response.MasterData?.isDuplicate) {
          return "This email is already registered with another agent";
        }
      } catch (error) {
        console.log('Error checking email duplicate:', error);
      } finally {
        setValidationLoading(prev => ({ ...prev, EmailID: false }));
      }

      return "";
    },

    validateMobile: async (mobile) => {
      if (!mobile) return "Mobile number is required";
      if (mobile.length !== 10) return "Mobile number must be 10 digits";
      if (!/^[6-9]\d{9}$/.test(mobile)) return "Please enter a valid 10-digit mobile number";

      try {
        setValidationLoading(prev => ({ ...prev, MobileNumber: true }));
        const response = await checkMobileDuplicate(mobile);
        if (response.MasterData?.isDuplicate) {
          return "This mobile number is already registered with another agent";
        }
      } catch (error) {
        console.log('Error checking mobile duplicate:', error);
      } finally {
        setValidationLoading(prev => ({ ...prev, MobileNumber: false }));
      }

      return "";
    }
  };

  // Basic validations (synchronous)
  const validations = {
    validateName: (name) => {
      if (!name || !name.trim()) return "Full Name is required";

      const nameRegex = /^[A-Za-z\s\-'\.]+$/;
      if (!nameRegex.test(name.trim())) {
        return "Name can only contain letters, spaces, hyphens, apostrophes, and periods";
      }

      const trimmedName = name.trim();
      if (trimmedName.length < 2) return "Name must be at least 2 characters long";
      if (trimmedName.length > 50) return "Name cannot exceed 50 characters";

      return "";
    },


    // Validation for Trader Name

    validateTraderName: (name) => {
      if (!name || !name.trim()) return "Trader Name is required";

      const nameRegex = /^[A-Za-z\s\-'\.]+$/;
      if (!nameRegex.test(name.trim())) {
        return "Name can only contain letters, spaces, hyphens, apostrophes, and periods";
      }

      const trimmedName = name.trim();
      if (trimmedName.length < 2) return "Trader Name must be at least 2 characters long";
      if (trimmedName.length > 50) return "Trader Name cannot exceed 50 characters";

      return "";
    },

    validatePassword: (password) => {
      if (!password || !password.trim()) return "Password is required";
      if (password.length < 6) return "Password must be at least 6 characters long";
      return "";
    },

    validateDOB: (dob) => {
      if (!dob) return "Date of birth is required";
      return "";
    },

    validatePAN: (pan) => {
      // If empty, it's valid (optional field)
      if (!pan || !pan.trim()) return "";

      // PAN format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

      if (!panRegex.test(pan.trim().toUpperCase())) {
        return "Please enter a valid PAN format (e.g., ABCDE1234F)";
      }

      return "";
    },
    validatePayout: (payout) => {
      if (!payout) return "Payout percentage is required";
      const payoutNum = parseFloat(payout);
      if (isNaN(payoutNum)) return "Please enter a valid number";
      if (payoutNum < 0 || payoutNum > 60) return "Payout percentage must be between 0 and 60";
      return "";
    },

    validateEducation: (edu) => {
      if (!edu || !edu.trim()) return "Education qualification is required";
      return "";
    }
  };

  // Debounced validation for email and mobile
  const debounceTimeout = useRef(null);

  const handleEmailValidation = async (email) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(async () => {
      if (email && email.includes('@')) {
        const error = await enhancedValidations.validateEmail(email);
        setFormErrors(prev => ({
          ...prev,
          EmailID: error
        }));
      }
    }, 1000);
  };



  const handleMobileValidation = async (mobile) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(async () => {
      if (mobile && mobile.length === 10) {
        const error = await enhancedValidations.validateMobile(mobile);
        setFormErrors(prev => ({
          ...prev,
          MobileNumber: error
        }));
      }
    }, 1000);
  };


  // Event Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    switch (name) {
      case 'FullName':
        processedValue = value.replace(/[^A-Za-z\s\-'\.]/g, '');
        setFormData(prev => ({ ...prev, [name]: processedValue }));

        const nameError = validations.validateName(processedValue);
        setFormErrors(prev => ({
          ...prev,
          FullName: nameError
        }));
        break;

      case 'TraderName':
        processedValue = value; // Allow any characters for now, or add specific regex
        setFormData(prev => ({ ...prev, [name]: processedValue }));
        const traderNameError = validations.validateTraderName(processedValue);
        setFormErrors(prev => ({
          ...prev,
          TraderName: traderNameError
        }));
        break;

      case 'Password':
        processedValue = value;
        setFormData(prev => ({ ...prev, [name]: processedValue }));

        const passwordError = validations.validatePassword(processedValue);
        setFormErrors(prev => ({
          ...prev,
          Password: passwordError
        }));
        break;

      case 'MobileNumber':
        processedValue = value.replace(/\D/g, '').slice(0, 10);
        setFormData(prev => ({ ...prev, [name]: processedValue }));

        if (processedValue.length === 10) {
          handleMobileValidation(processedValue);
        } else {
          setFormErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.MobileNumber;
            return newErrors;
          });
        }
        break;

      case 'EmailID':
        processedValue = value;
        setFormData(prev => ({ ...prev, [name]: processedValue }));
        handleEmailValidation(processedValue);
        break;

      case 'PAN_No':
        // Convert to uppercase and allow only alphanumeric characters
        processedValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10);
        setFormData(prev => ({ ...prev, [name]: processedValue }));

        // Reset PAN validation when PAN field changes
        setIsPanValidated(false);
        setShowPanValidationResult(false);
        setPanValidationResult(null);
        setPanValidationError('');

        // Validate PAN format if value is provided
        const panError = validations.validatePAN(processedValue);
        setFormErrors(prev => ({
          ...prev,
          PAN_No: panError
        }));
        break;

      case 'PayoutPercentage':
        if (value === '' || (/^\d{0,2}(\.\d{0,2})?$/.test(value) && parseFloat(value) <= 60)) {
          processedValue = value;
          setFormData(prev => ({ ...prev, [name]: processedValue }));

          const payoutError = validations.validatePayout(processedValue);
          setFormErrors(prev => ({
            ...prev,
            PayoutPercentage: payoutError
          }));
        } else {
          return;
        }
        break;

      case 'EducationQualification':
        processedValue = value;
        setFormData(prev => ({ ...prev, [name]: processedValue }));

        const educationError = validations.validateEducation(processedValue);
        setFormErrors(prev => ({
          ...prev,
          EducationQualification: educationError
        }));
        break;

      default:
        processedValue = value;
        setFormData(prev => ({ ...prev, [name]: processedValue }));
        break;
    }
  };

  const handleDOBChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    const dobError = validations.validateDOB(value);
    setFormErrors(prevErrors => ({
      ...prevErrors,
      DOB: dobError
    }));
  };

  const handleWalletAmountChange = (e) => {
    const walletAmount = e.target.value;
    setFormData(prev => ({ ...prev, Wallet_Amount: walletAmount }));
  };

  const validateForm = () => {
    const errors = {};

    if (formData.FullName) {
      errors.FullName = validations.validateName(formData.FullName);
    }
    if (formData.TraderName) {
      errors.TraderName = validations.validateTraderName(formData.TraderName);
    }

    if (formData.Password) {
      errors.Password = validations.validatePassword(formData.Password);
    }
    if (formData.DOB) {
      errors.DOB = validations.validateDOB(formData.DOB);
    }
    if (formData.PayoutPercentage) {
      errors.PayoutPercentage = validations.validatePayout(formData.PayoutPercentage);
    }
    if (formData.EducationQualification) {
      errors.EducationQualification = validations.validateEducation(formData.EducationQualification);
    }
    if (formData.PAN_No) {
      errors.PAN_No = validations.validatePAN(formData.PAN_No);
    }

    Object.keys(errors).forEach(key => {
      if (!errors[key]) delete errors[key];
    });

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = [
      'FullName',
      'TraderName',
      'Password',
      'EmailID',
      'MobileNumber',
      'DOB',
      'PayoutPercentage',
      'EducationQualification',
      'State'
    ];

    const emptyFields = requiredFields.filter(field => !formData[field]?.trim());

    if (emptyFields.length > 0) {
      setError(`Please fill in all required fields: ${emptyFields.join(', ')}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const emailError = await enhancedValidations.validateEmail(formData.EmailID);
      const mobileError = await enhancedValidations.validateMobile(formData.MobileNumber);

      if (emailError || mobileError) {
        setFormErrors(prev => ({
          ...prev,
          ...(emailError && { EmailID: emailError }),
          ...(mobileError && { MobileNumber: mobileError })
        }));
        setError('Please fix the validation errors before submitting');
        setLoading(false);
        return;
      }

      const isValid = validateForm();
      if (!isValid) {
        setError('Please fix the validation errors before submitting');
        setLoading(false);
        return;
      }

      setSuccess('');
      setOtpSent(false);

      const submissionData = {
        ...formData,
        Wallet_Amount: formData.Wallet_Amount
      };

      const response = await addAgent(submissionData);
      console.log("Agent creation response:", response);

      if (response.Status === 'Error') {
        setError(response.Message || 'Failed to add agent');
        setLoading(false);
        return;
      }

      if (response.Status === 'Success') {
        setSuccess('Agent added successfully!');

        let agentId = response.AgentId;
        if (!agentId && response.MasterData) {
          if (Array.isArray(response.MasterData)) {
            agentId = response.MasterData[0]?.AgentId;
          } else {
            agentId = response.MasterData.AgentId;
          }
        }

        if (!agentId && response.Data) {
          if (Array.isArray(response.Data)) {
            agentId = response.Data[0]?.AgentId;
          } else {
            agentId = response.Data.AgentId;
          }
        }

        if (agentId) {
          try {
            setOtpSending(true);
            await sendOtp({
              email: formData.EmailID,
              agentId: agentId
            });
            setOtpSent(true);
          } catch (otpError) {
            console.error('Failed to send OTP:', otpError);
          } finally {
            setOtpSending(false);
          }
        }

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(response.Message || 'Failed to add agent');
      }
    } catch (err) {
      console.error('Error during agent creation:', err);

      if (err.response?.data?.Status === 'Error') {
        setError(err.response.data.Message || 'Failed to add agent');
      } else if (err.response?.data?.Message) {
        setError(err.response.data.Message);
      } else {
        setError('An error occurred while adding the agent');
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleCloseAttempt = () => {
    if (Object.values(formData).some(value => value !== '')) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  // JSX Return
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add New Agent</h2>
          <button className="close-button" onClick={handleCloseAttempt}>&times;</button>
        </div>

        <form key={formKey} ref={formRef} onSubmit={handleSubmit} autoComplete="off">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="FullName" style={{
                fontWeight: '500',
                color: '#333',
                fontSize: '16px'
              }}>Full Name</label>
              <input
                type="text"
                id="FullName"
                name="FullName"
                className={`form-control ${formErrors.FullName ? 'error' : ''}`}
                value={formData.FullName}
                onChange={handleChange}
                autoComplete="off"
                placeholder="Enter full name"
                required
              />
              {formErrors.FullName && (
                <div className="error-message" style={{ marginTop: '5px', position: 'static', color: 'red', fontSize: '14px' }}>
                  {formErrors.FullName}
                </div>
              )}
            </div>



            <div className="form-group">
              <label htmlFor="Password" style={{
                fontWeight: '500',
                color: '#333',
                fontSize: '16px'
              }}>Password</label>
              <div className="password-input-container" style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="Password"
                  name="Password"
                  className={`form-control ${formErrors.Password ? 'error' : ''}`}
                  value={formData.Password}
                  onChange={handleChange}
                  ref={passwordInputRef}
                  autoComplete="new-password"
                  placeholder="Enter password (min 6 characters)"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={togglePasswordVisibility}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>
              {formErrors.Password && (
                <div className="error-message" style={{ marginTop: '5px', position: 'static', color: 'red', fontSize: '14px' }}>
                  {formErrors.Password}
                </div>
              )}
            </div>

          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="TraderName" style={{
                fontWeight: '500',
                color: '#333',
                fontSize: '16px'
              }}>Trader Name</label>
              <input
                type="text"
                id="TraderName"
                name="TraderName"
                className={`form-control ${formErrors.TraderName ? 'error' : ''}`}
                value={formData.TraderName}
                onChange={handleChange}
                autoComplete="off"
                placeholder="Enter trader name"
                required
              />
              {formErrors.TraderName && (
                <div className="error-message" style={{ marginTop: '5px', position: 'static', color: 'red', fontSize: '14px' }}>
                  {formErrors.TraderName}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="EmailID" style={{
                fontWeight: '500',
                color: '#333',
                fontSize: '16px'
              }}>Email </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  id="EmailID"
                  name="EmailID"
                  className={`form-control ${formErrors.EmailID ? 'error' : ''}`}
                  value={formData.EmailID}
                  onChange={handleChange}
                  ref={emailInputRef}
                  autoComplete="off"
                  placeholder="Enter email address"
                  required
                />
                {validationLoading.EmailID && (
                  <div style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    Checking...
                  </div>
                )}
              </div>
              {formErrors.EmailID && (
                <div className="error-message" style={{ marginTop: '5px', position: 'static', color: 'red', fontSize: '14px' }}>
                  {formErrors.EmailID}
                </div>
              )}
            </div>


          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="MobileNumber" style={{
                fontWeight: '500',
                color: '#333',
                fontSize: '16px'
              }}>Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="MobileNumber"
                  name="MobileNumber"
                  className={`form-control ${formErrors.MobileNumber ? 'error' : ''}`}
                  value={formData.MobileNumber}
                  onChange={handleChange}
                  ref={mobileInputRef}
                  autoComplete="off"
                  placeholder="Enter 10 digit number"
                  required
                />
                {validationLoading.MobileNumber && (
                  <div style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    Checking...
                  </div>
                )}
              </div>
              {formErrors.MobileNumber && (
                <div className="error-message" style={{ marginTop: '5px', position: 'static', color: 'red', fontSize: '14px' }}>
                  {formErrors.MobileNumber}
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="Gender"
                style={{
                  fontWeight: '500',
                  color: '#333',
                  fontSize: '16px'
                }}>Gender</label>
              <select
                id="Gender"
                name="Gender"
                className="form-control"
                value={formData.Gender}
                onChange={handleChange}
                style={{
                  backgroundColor: '#fff',
                  paddingLeft: '15px',
                  paddingRight: '40px',
                  appearance: 'revert',
                  height: '44px'
                }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>


          </div>

          <div className="form-row">

            <div className="form-group">
              <label htmlFor="DOB"
                style={{
                  fontWeight: '500',
                  color: '#333',
                  fontSize: '16px'
                }}
              >DOB or Date of Incorporation</label>
              <input
                type="date"
                id="DOB"
                name="DOB"
                className={`form-control ${formErrors.DOB ? 'error' : ''}`}
                value={formData.DOB}
                onChange={handleDOBChange}
                autoComplete="off"
                required
              />
              {formErrors.DOB && (
                <div className="error-message" style={{ marginTop: '5px', position: 'static', color: 'red', fontSize: '14px' }}>
                  {formErrors.DOB}
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="EducationQualification"
                style={{
                  fontWeight: '500',
                  color: '#333',
                  fontSize: '16px'
                }}
              >Education Qualification</label>
              <input
                type="text"
                id="EducationQualification"
                name="EducationQualification"
                className={`form-control ${formErrors.EducationQualification ? 'error' : ''}`}
                value={formData.EducationQualification}
                onChange={handleChange}
                autoComplete="off"
                placeholder="Enter Education Qualification"
                required
              />
              {formErrors.EducationQualification && (
                <div className="error-message" style={{ marginTop: '5px', position: 'static', color: 'red', fontSize: '14px' }}>
                  {formErrors.EducationQualification}
                </div>
              )}
            </div>


          </div>

          <div className="form-row">

            <div className="form-group">
              <label htmlFor="PAN_No" style={{
                fontWeight: '500',
                color: '#333',
                fontSize: '16px'
              }} >PAN No</label>
              <input
                type="text"
                id="PAN_No"
                name="PAN_No"
                className={`form-control ${formErrors.PAN_No ? 'error' : ''}`}
                value={formData.PAN_No}
                onChange={handleChange}
                autoComplete="off"
                placeholder="Enter PAN Number"
                maxLength="10"
                style={{
                  textTransform: 'uppercase'
                }}
              />
              {formErrors.PAN_No && (
                <div className="error-message" style={{ marginTop: '5px', position: 'static', color: 'red', fontSize: '14px' }}>
                  {formErrors.PAN_No}
                </div>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePanCardValidation}
                disabled={loading || panValidationLoading}
                style={{
                  fontWeight: '500',
                  marginTop: '5px',
                  color: '#ffffff',
                  backgroundColor: '#E08D28',
                  fontSize: '16px',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: panValidationLoading ? 'not-allowed' : 'pointer',
                  opacity: panValidationLoading ? '0.7' : '1'
                }}
              >
                {panValidationLoading ? 'Validating...' : 'Validate PAN Card'}
              </button>

              {/* FIXED: Use the enhanced PAN validation display component */}
              <PanValidationDisplay />
            </div>

            <div className="form-group">
              <label htmlFor="GST"
                style={{
                  fontWeight: '500',
                  color: '#333',
                  fontSize: '16px'
                }}
                className="optional-label">GST No (optional)</label>
              <input
                type="text"
                id="GST"
                name="GST"
                className="form-control"
                value={formData.GST}
                onChange={handleChange}
                autoComplete="off"
                placeholder="Enter GST No"
              />
            </div>

          </div>

          <div className="form-row" style={{ display: 'block', width: '100%' }}>
            <div className="form-group" style={{ width: '100%', flex: 'none' }}>
              <label htmlFor="Address" style={{
                fontWeight: '500',
                color: '#333',
                fontSize: '16px'
              }} className="optional-label">Address (optional)</label>
              <textarea
                id="Address"
                name="Address"
                className="form-control"
                value={formData.Address}
                onChange={handleChange}
                autoComplete="off"
                placeholder="Enter Address"
                rows="3"
                style={{
                  resize: 'vertical',
                  minHeight: '80px',
                  width: '100%',
                  boxSizing: 'border-box',
                  maxWidth: '100%',
                  display: 'block'
                }}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="PayoutPercentage" style={{
                fontWeight: '500',
                color: '#333',
                fontSize: '16px'
              }}>Payout Percentage</label>
              <input
                type="text"
                id="PayoutPercentage"
                name="PayoutPercentage"
                className={`form-control ${formErrors.PayoutPercentage ? 'error' : ''}`}
                value={formData.PayoutPercentage}
                onChange={handleChange}
                autoComplete="off"
                placeholder="Enter Payout Percentage (0-60)"
                required
              />
              {formErrors.PayoutPercentage && (
                <div className="error-message" style={{ marginTop: '5px', position: 'static', color: 'red', fontSize: '14px' }}>
                  {formErrors.PayoutPercentage}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="PaymentMode" style={{
                fontWeight: '500',
                color: '#333',
                fontSize: '16px'
              }}>Payment Mode</label>
              <select
                id="PaymentMode"
                name="PaymentMode"
                className="form-control"
                value={formData.PaymentMode}
                onChange={handleChange}
                style={{
                  backgroundColor: '#fff',
                  paddingLeft: '15px',
                  paddingRight: '40px',
                  appearance: 'revert',
                  height: '44px'
                }}
              >
                <option value="Full Pay">Full Pay</option>
                <option value="Upfront Commission">Upfront Commission</option>
                <option value="Discount">Discount</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="Wallet_Amount" style={{
                fontWeight: '500',
                color: '#333',
                fontSize: '16px'
              }}>Wallet Amount:</label>
              <select
                id="Wallet_Amount"
                name="Wallet_Amount"
                value={formData.Wallet_Amount}
                onChange={handleWalletAmountChange}
                style={{
                  padding: '8px 15px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundColor: 'white',
                  width: '250px',
                  height: '44px'
                }}
              >
                <option value="0">₹ 0</option>
                <option value="5000">₹ 5,000</option>
                <option value="10000">₹ 10,000</option>
                <option value="15000">₹ 15,000</option>
                <option value="20000">₹ 20,000</option>
                <option value="25000">₹ 25,000</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="State" style={{
                fontWeight: '500',
                color: '#333',
                fontSize: '16px'
              }}>State</label>
              <select
                id="State"
                name="State"
                className={`form-control ${formErrors.State ? 'error' : ''}`}
                value={formData.State}
                onChange={handleChange} // Use the existing handleChange function
                required
                style={{
                  backgroundColor: '#fff',
                  paddingLeft: '15px',
                  paddingRight: '40px',
                  appearance: 'revert',
                  height: '44px'
                }}
              >
                <option value="">Select State</option>
                <option value="ANDAMAN AND NICOBAR ISLANDS">Andaman and Nicobar Islands</option>
                <option value="ANDHRA PRADESH">Andhra Pradesh</option>
                <option value="ARUNACHAL PRADESH">Arunachal Pradesh</option>
                <option value="ASSAM">Assam</option>
                <option value="BIHAR">Bihar</option>
                <option value="CHANDIGARH U.T.">Chandigarh U.T.</option>
                <option value="CHHATTISGARH">Chhattisgarh</option>
                <option value="DADRA AND NAGAR HAVELI">Dadra and Nagar Haveli</option>
                <option value="DAMAN AND DIU">Daman and Diu</option>
                <option value="DELHI">Delhi</option>
                <option value="GOA">Goa</option>
                <option value="GUJARAT">Gujarat</option>
                <option value="HARYANA">Haryana</option>
                <option value="HIMACHAL PRADESH">Himachal Pradesh</option>
                <option value="JAMMU AND KASHMIR">Jammu and Kashmir</option>
                <option value="JHARKHAND">Jharkhand</option>
                <option value="KARNATAKA">Karnataka</option>
                <option value="KERALA">Kerala</option>
                <option value="LAKSHADWEEP U.T.">Lakshadweep U.T.</option>
                <option value="MADHYA PRADESH">Madhya Pradesh</option>
                <option value="MAHARASHTRA">Maharashtra</option>
                <option value="MANIPUR">Manipur</option>
                <option value="MEGHALAYA">Meghalaya</option>
                <option value="MIZORAM">Mizoram</option>
                <option value="NAGALAND">Nagaland</option>
                <option value="ODISHA">Odisha</option>
                <option value="PUDUCHERRY U T">Puducherry U.T.</option>
                <option value="PUNJAB">Punjab</option>
                <option value="RAJASTHAN">Rajasthan</option>
                <option value="SIKKIM">Sikkim</option>
                <option value="TAMIL NADU">Tamil Nadu</option>
                <option value="TELANGANA">Telangana</option>
                <option value="TRIPURA">Tripura</option>
                <option value="UTTAR PRADESH">Uttar Pradesh</option>
                <option value="UTTARAKHAND">Uttarakhand</option>
                <option value="WEST BENGAL">West Bengal</option>
              </select>
              {formErrors.State && (
                <div className="error-message" style={{ marginTop: '5px', position: 'static', color: 'red', fontSize: '14px' }}>
                  {formErrors.State}
                </div>
              )}
            </div>


          </div>

          {error && <div className="alert alert-error" style={{ color: 'red', backgroundColor: '#fee', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>{error}</div>}

          {success && (
            <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', color: 'green', backgroundColor: '#efe', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
              <Check size={18} style={{ marginRight: '8px' }} />
              {success}
            </div>
          )}

          {otpSending && (
            <div className="alert" style={{
              backgroundColor: '#fff8eb', color: '#b45309', border: '1px solid #fcd34d',
              display: 'flex', alignItems: 'center', padding: '10px', borderRadius: '4px', marginBottom: '10px'
            }}>
              <Mail size={18} style={{ marginRight: '8px' }} />
              Sending verification code to agent's email...
            </div>
          )}

          {otpSent && (
            <div className="alert" style={{
              backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd',
              display: 'flex', alignItems: 'center', padding: '10px', borderRadius: '4px', marginBottom: '10px'
            }}>
              <Check size={18} style={{ marginRight: '8px' }} />
              Verification code sent successfully to the agent's email
            </div>
          )}

          {formData.PAN_No && !isPanValidated && (
            <div style={{
              backgroundColor: '#fff8eb',
              color: '#b45309',
              border: '1px solid #fcd34d',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '10px',
              textAlign: 'center',
              fontSize: '14px'
            }}>
              Please validate PAN before submitting the form
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCloseAttempt}
              disabled={loading}
            >
              Cancel
            </button>

            {isPanValidated && (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  loading ||
                  validationLoading.EmailID ||
                  validationLoading.MobileNumber
                }
                style={{
                  opacity: (loading || validationLoading.EmailID || validationLoading.MobileNumber) ? '0.7' : '1',
                  cursor: (loading || validationLoading.EmailID || validationLoading.MobileNumber) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Adding...' : 'Add Agent'}
              </button>
            )}

            {!isPanValidated && (
              <div style={{
                backgroundColor: '#fff8eb',
                color: '#b45309',
                border: '1px solid #fcd34d',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '10px',
                textAlign: 'center',
                fontSize: '14px'
              }}>
                Please validate PAN to proceed
              </div>
            )}
          </div>
        </form>

        {showConfirmClose && (
          <div className="confirmation-overlay">
            <div className="confirmation-dialog">
              <h3>Confirm Close</h3>
              <p>Are you sure you want to close? All entered data will be lost.</p>
              <div className="confirmation-buttons">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmClose(false)}
                >
                  No, Continue Editing
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowConfirmClose(false);
                    onClose();
                  }}
                >
                  Yes, Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddAgentModal;