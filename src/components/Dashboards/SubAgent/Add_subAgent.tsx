import React, { useState, useRef } from 'react';
import {
    UserCircle, Mail, UserPlus, LogOut, Home, Eye, EyeOff, Check,
    AlertCircle, FileText, CreditCard, List
} from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";

import { addAgent_nonkyc, checkEmailDuplicate, checkMobileDuplicate } from '../../../services/api';

import { logout } from '../../../services/auth';

import logo from '../../../assets/img/TravelAssist.webp';

import './Add_subAgent.css';

// 1. Import the KYC component
import Add_Kyc_subAgent from './Add_Kyc_subAgent';

// Type definitions for clarity
interface AgentFormData {
    UId: string | number;
    FullName: string;
    TraderName: string;
    Password: string;
    EmailID: string;
    MobileNumber: string;
    Gender: 'Male' | 'Female' | 'Other';
    DOB: string;
    PayoutPercentage: string;
    PayoutPracto: string;
    PayoutAyush: string;
    PaymentMode: 'Full Pay' | 'Upfront Commission' | 'Discount';
    Wallet_Amount: string;
    EducationQualification: string;
    GST: string;
    Address: string;
    PAN_No: string;
    State: string;
    Main_Agent: string;
}

// Debounce reference for throttling API calls
const debounceTimeout = { current: null as NodeJS.Timeout | null };

// --- UTILITY FUNCTIONS & VALIDATIONS ---

const enhancedValidations = {
    validateEmail: async (email: string) => {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!email) return "Email is required";
        if (!emailRegex.test(email)) return "Please enter a valid email address";

        try {
            // @ts-ignore
            const response = await checkEmailDuplicate(email);
            if (response.MasterData?.isDuplicate) {
                return "This email is already registered with another agent";
            }
        } catch (error) {
            console.log('Error checking email duplicate:', error);
        }
        return "";
    },

    validateMobile: async (mobile: string) => {
        if (!mobile) return "Mobile number is required";
        if (mobile.length !== 10) return "Mobile number must be 10 digits";
        if (!/^[6-9]\d{9}$/.test(mobile)) return "Please enter a valid 10-digit mobile number";

        try {
            // @ts-ignore
            const response = await checkMobileDuplicate(mobile);
            if (response.MasterData?.isDuplicate) {
                return "This mobile number is already registered with another agent";
            }
        } catch (error) {
            console.log('Error checking mobile duplicate:', error);
        }
        return "";
    }
};

const validations = {
    validateName: (name: string) => {
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

    validateTraderName: (name: string) => {
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

    validatePassword: (password: string) => {
        if (!password || !password.trim()) return "Password is required";
        if (password.length < 6) return "Password must be at least 6 characters long";
        return "";
    },

    validateDOB: (dob: string) => {
        if (!dob) return "Date of birth is required";
        return "";
    },

    validatePayout: (payout: string, mainAgentPayout: string, fieldLabel: string = "Payout Percentage") => {
        if (!payout) return `${fieldLabel} is required`;

        const payoutNum = parseFloat(payout);
        const mainPayoutNum = parseFloat(mainAgentPayout);

        if (isNaN(payoutNum)) return "Please enter a valid number";
        if (payoutNum < 0 || payoutNum > 60) return "Payout percentage must be between 0 and 60";

        if (!isNaN(mainPayoutNum) && payoutNum >= mainPayoutNum) {
            return `${fieldLabel} must be less than Main Agent Payout (${mainAgentPayout}%)`;
        }
        return "";
    },

    validateEducation: (edu: string) => {
        if (!edu || !edu.trim()) return "Education qualification is required";
        return "";
    }
};


// --- Add_subAgent COMPONENT ---

const Add_subAgent: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as any || {};
    const parentAgentData = state.agentData || {};
    const userId = parentAgentData.UId;

    const Main_Agent_Payout = String(parentAgentData.Payout);

    // Default to NON-KYC, but allow switching freely
    const [selectedView, setSelectedView] = useState<'NON-KYC' | 'KYC'>('NON-KYC');

    const initialFormData: AgentFormData = {
        UId: userId || '',
        FullName: '',
        TraderName: '',
        Password: '',
        EmailID: '',
        MobileNumber: '',
        Gender: 'Male',
        DOB: '',
        PayoutPercentage: '',
        PayoutPracto: '',
        PayoutAyush: '',
        PaymentMode: 'Full Pay',
        Wallet_Amount: '0',
        EducationQualification: '',
        GST: '',
        Address: '',
        PAN_No: '',
        State: '',
        Main_Agent: '',
    };

    const formRef = useRef<HTMLFormElement>(null);
    const emailInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const mobileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<AgentFormData>(initialFormData);
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof AgentFormData, string>>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [otpSent, setOtpSent] = useState(false);
    const [otpSending, setOtpSending] = useState(false);
    const [validationLoading, setValidationLoading] = useState<Record<string, boolean>>({});

    const resetForm = () => {
        const freshInitialData: AgentFormData = { ...initialFormData, UId: userId || '' };
        // Resetting state variables is the standard React way to reset a controlled form
        setFormData(freshInitialData);
        setFormErrors({});
        setError('');
        setSuccess('');
        setShowConfirmClose(false);
        setOtpSent(false);
        // The setFormData call above handles the reset for all controlled inputs.
    };

    const handleLogout = (): void => {
        try {
            localStorage.clear();
            sessionStorage.clear();
            // @ts-ignore
            logout();
            window.location.href = '/login';
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    const handleEmailValidation = async (email: string) => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(async () => {
            if (email && email.includes('@')) {
                setValidationLoading(prev => ({ ...prev, EmailID: true }));
                const error = await enhancedValidations.validateEmail(email);
                setFormErrors(prev => ({ ...prev, EmailID: error }));
                setValidationLoading(prev => ({ ...prev, EmailID: false }));
            }
        }, 1000);
    };

    const handleMobileValidation = async (mobile: string) => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(async () => {
            if (mobile && mobile.length === 10) {
                setValidationLoading(prev => ({ ...prev, MobileNumber: true }));
                const error = await enhancedValidations.validateMobile(mobile);
                setFormErrors(prev => ({ ...prev, MobileNumber: error }));
                setValidationLoading(prev => ({ ...prev, MobileNumber: false }));
            }
        }, 1000);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let processedValue = value;
        const key = name as keyof AgentFormData;

        switch (key) {
            case 'FullName':
            case 'TraderName':
            case 'EducationQualification':
                processedValue = value.replace(/[^A-Za-z\s\-'\.]/g, '');
                setFormData(prev => ({ ...prev, [key]: processedValue }));
                const validationFn = validations[`validate${key}` as keyof typeof validations];
                if (validationFn) {
                    // FIX: Use a type assertion to safely call single-argument functions
                    const singleArgValidationFn = validationFn as (value: string) => string;

                    setFormErrors(prev => ({ ...prev, [key]: singleArgValidationFn(processedValue) }));
                }
                break;

            case 'MobileNumber':
                processedValue = value.replace(/\D/g, '').slice(0, 10);
                setFormData(prev => ({ ...prev, [key]: processedValue }));
                if (processedValue.length === 10) {
                    handleMobileValidation(processedValue);
                } else {
                    // Fix: Use destructuring exclusion to safely remove optional error field
                    setFormErrors(prev => { const { MobileNumber, ...newErrors } = prev; return newErrors; });
                }
                break;

            case 'Password': // <--- NEW SEPARATE CASE FOR PASSWORD
                // Allow all characters for password; no filtering here.
                processedValue = value;
                setFormData(prev => ({ ...prev, [key]: processedValue }));
                // Apply only the length validation
                setFormErrors(prev => ({ ...prev, [key]: validations.validatePassword(processedValue) }));
                break;

            case 'EmailID':
                processedValue = value;
                setFormData(prev => ({ ...prev, [key]: processedValue }));
                handleEmailValidation(processedValue);
                break;

            case 'PayoutPercentage':
                if (value === '' || (/^\d{0,2}(\.\d{0,2})?$/.test(value) && parseFloat(value) <= 60)) {
                    processedValue = value;
                    setFormData(prev => ({ ...prev, [key]: processedValue }));

                    // CHANGE 4: Pass Main_Agent_Payout to the validation function
                    const errorMsg = validations.validatePayout(processedValue, Main_Agent_Payout);
                    setFormErrors(prev => ({ ...prev, PayoutPercentage: errorMsg }));
                    // END CHANGE 4
                }
                break;
            case 'PayoutPracto':
                if (value === '' || (/^\d{0,2}(\.\d{0,2})?$/.test(value) && parseFloat(value) <= 50)) {
                    processedValue = value;
                    setFormData(prev => ({ ...prev, [key]: processedValue }));

                    // CHANGE: Pass specific label
                    const errorMsg = validations.validatePayout(processedValue, Main_Agent_Payout, "Payout Practo (%)");
                    setFormErrors(prev => ({ ...prev, PayoutPracto: errorMsg }));
                }
                break;
            case 'PayoutAyush':
                if (value === '' || (/^\d{0,2}(\.\d{0,2})?$/.test(value) && parseFloat(value) <= 50)) {
                    processedValue = value;
                    setFormData(prev => ({ ...prev, [key]: processedValue }));

                    // CHANGE: Pass specific label
                    const errorMsg = validations.validatePayout(processedValue, Main_Agent_Payout, "Payout AyushPay (%)");
                    setFormErrors(prev => ({ ...prev, PayoutAyush: errorMsg }));
                }
                break;

            case 'DOB':
            case 'State':
                setFormData(prev => ({ ...prev, [key]: value }));
                if (key === 'DOB') setFormErrors(prev => ({ ...prev, DOB: validations.validateDOB(value) }));
                if (key === 'State') setFormErrors(prev => ({ ...prev, State: value ? '' : 'State is required' }));
                break;


            default: // Gender, PaymentMode, Wallet_Amount, GST, Address
                setFormData(prev => ({ ...prev, [key]: value }));
                break;
        }
    };

    const validateForm = () => {
        const errors: Partial<Record<keyof AgentFormData, string>> = {};

        // Removed 'PayoutPercentage' from this generic loop to handle it explicitly below with others
        const checkFields: Array<keyof AgentFormData> = ['FullName', 'TraderName', 'Password', 'DOB', 'EducationQualification', 'State'];

        checkFields.forEach(key => {
            // ... existing loop logic ...
            const validationFn = validations[`validate${key}` as keyof typeof validations];
            if (validationFn) {
                const singleArgValidationFn = validationFn as (value: string) => string;
                const errorMsg = singleArgValidationFn(formData[key] as string);
                if (errorMsg) errors[key] = errorMsg;
            }
        });

        // Explicit Payout Validations with Labels
        if (formData.PayoutPercentage) {
            const msg = validations.validatePayout(formData.PayoutPercentage, Main_Agent_Payout, "Payout TravelAssist (%)");
            if (msg) errors.PayoutPercentage = msg;
        }
        if (formData.PayoutPracto) {
            const msg = validations.validatePayout(formData.PayoutPracto, Main_Agent_Payout, "Payout Practo (%)");
            if (msg) errors.PayoutPracto = msg;
        }
        if (formData.PayoutAyush) {
            const msg = validations.validatePayout(formData.PayoutAyush, Main_Agent_Payout, "Payout AyushPay (%)");
            if (msg) errors.PayoutAyush = msg;
        }

        if (!formData.State) errors.State = 'State is required';

        setFormErrors(prev => ({ ...prev, ...errors }));
        return Object.keys(errors).length === 0;
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const requiredFields: Array<keyof AgentFormData> = [
            'FullName', 'TraderName', 'Password', 'EmailID', 'MobileNumber', 'DOB',
            'PayoutPercentage', 'EducationQualification', 'State'
        ];

        const emptyFields = requiredFields.filter(key => !formData[key]?.toString().trim());

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

            if (!validateForm()) {
                setError('Please fix the validation errors before submitting');
                setLoading(false);
                return;
            }

            setSuccess('');
            setOtpSent(false);

            const submissionData = {
                ...formData,
                UId: parentAgentData.UId,
                Wallet_Amount: formData.Wallet_Amount,
                // Ensure PAN_No is explicitly empty as per user's current requirement (no KYC)
                PAN_No: '',
                Main_Agent: parentAgentData.AgentId,
                PayoutPracto: formData.PayoutPracto || '0',
                PayoutAyush: formData.PayoutAyush || '0',
                Address: formData.Address || ''

            };

            // @ts-ignore
            const response = await addAgent_nonkyc(submissionData);

            if (response.Status === 'Error') {
                setError(response.Message || 'Failed to add sub-agent');
                setLoading(false);
                return;
            }

            if (response.Status === 'Success') {
                setSuccess('Sub-Agent added successfully!');
                let agentId = response.AgentId || response.MasterData?.[0]?.AgentId || response.MasterData?.AgentId || response.Data?.[0]?.AgentId || response.Data?.AgentId;

                if (agentId) {
                    const newAgentData = {
                        // Use current form data combined with default/response data
                        ...formData,
                        AgentId: agentId,// Use the new AgentId/Code from the response

                        Wallet_Amount: formData.Wallet_Amount || '0',
                        Paymentmode: formData.PaymentMode,
                        Payout: formData.PayoutPercentage,

                    };

                    setTimeout(() => {
                        // Navigate and pass the new agent object under the key 'newAgent'
                        navigate('/SubAgentlistview', { state: { newAgent: newAgentData, agentData: parentAgentData } });
                    }, 1500);
                }
                else {
                    // Fallback if agentId is missing
                    setTimeout(() => { navigate('/dashboard'); }, 1500);
                }

            } else {
                setError(response.Message || 'Failed to add sub-agent');
            }
        } catch (err: any) {
            console.error('Error during sub-agent creation:', err);
            setError(err.response?.data?.Message || err.response?.data?.Status || err.response?.data || 'An error occurred while adding the sub-agent');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    const handleCloseAttempt = () => {
        resetForm();
    };

    const goBack = () => {
        navigate('/dashboard');
    };

    const agentName = parentAgentData.name || parentAgentData.FullName || 'Agent';

    const handleSelectView = (view: 'NON-KYC' | 'KYC') => {
        setSelectedView(view);
        resetForm();
    };

    const goToSublist = () => {
        // We use parentAgentData directly, which contains the main agent's ID
        // and is needed for the subAgentlist page to fetch the sub-agents.

        navigate('/SubAgentlistview', {
            state: {
                // Pass the parent's data object
                agentData: parentAgentData
            }
        });
    };

    return (
        <>
            <style>
                {`
                .selection-card-base {
                    padding: 15px 25px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid #ccc;
                    width: 250px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .selection-card-base:hover {
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                }
                .selection-kyc { background-color: #ecfdf5; }
                .selection-nonkyc { background-color: #fef2f2; }
                .selection-kyc.active { border-color: #10b981; }
                .selection-nonkyc.active { border-color: #ef4444; }
                .form-row { display: flex; gap: 20px; margin-bottom: 5px; } /* Reduced margin-bottom to compensate for container */
                .form-group { flex: 1; display: flex; flex-direction: column; }
                .form-control { border: 1px solid #ccc; border-radius: 4px; padding: 10px; }
                .error-message-container { 
                    min-height: 20px; /* RESERVES SPACE to prevent layout shift */
                    margin-top: 2px;
                }
                .error-message { 
                    color: red; 
                    font-size: 12px; 
                    margin-top: 0px; 
                }

                 .card {
                    background: white;
                    border-radius: 0.5rem;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    margin-bottom: 2rem;
                }
                .card-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #e5e7eb;
                }
                    .welcome-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #1f2937;
                    margin: 0;
                }
                .employee-info {
                    padding: 1.5rem;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                    padding-left: 10px !important;
                    padding-right: 10px !important;
                }
                .info-item {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .info-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .font-weight {
                    font-weight: 600;
                    color: #374151;
                }
                .info-value {
                    color: #6b7280;
                }
                .spaced5 { margin-right: 5px; }
                .spaced10 { margin-right: 10px;}
                .modal-content { border: 1px solid #ddd; border-radius: 8px; background: white; transition: none; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; }
                @media (max-width: 768px) {
                    .form-row { flex-direction: column; gap: 0; }
                    .selection-card-base { width: 100%; margin-bottom: 10px; }
                }
      `}
            </style>

            <header className="coi-header">
                <div className="coi-header-content">
                    {/* Placeholder for Logo */}
                    <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
                    <div className="d-flex justify-content-center py-4">
                        <div className="logo d-flex align-items-center w-auto">
                            <span className="page-title">Travel Assistance Service</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button onClick={goBack} className="coi-button">
                            <Home size={18} /> Dashboard
                        </button>
                        <button onClick={handleLogout} className="coi-button coi-logout-button">
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </div>
            </header>

            <main style={{ padding: '2rem' }}>
                <div className="card">
                    <div style={{
                        padding: '6px',
                        display: 'flex',            // Enable flex container
                        justifyContent: 'space-between', // Push items to opposite ends
                        alignItems: 'center'        // Vertically center items
                    }}>
                        <h4>Main Agent : {agentName}</h4>

                        {/* Renamed button for clarity and fixed placeholder data usage */}

                        <button onClick={goToSublist} className="apply-btn-list flex items-center">
                            <List className="w-4 h-4 mr-2 pr-2" />
                            View Sub-Agents
                        </button>

                    </div>
                </div>

                {/* Selection Buttons - Always Visible */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', padding: '5px', flexWrap: 'wrap', textAlign: 'center' }}>
                    <div
                        onClick={() => handleSelectView('KYC')}
                        className={`selection-card-base selection-kyc ${selectedView === 'KYC' ? 'active' : ''}`}
                    >
                        <FileText size={20} style={{ marginRight: '8px' }} />
                        <b style={{ color: selectedView === 'KYC' ? '#047857' : '#333' }}>KYC SubAgent</b>
                    </div>

                    <div
                        onClick={() => handleSelectView('NON-KYC')}
                        className={`selection-card-base selection-nonkyc ${selectedView === 'NON-KYC' ? 'active' : ''}`}
                    >
                        <CreditCard size={20} style={{ marginRight: '8px' }} />
                        <b style={{ color: selectedView === 'NON-KYC' ? '#b91c1c' : '#333' }}>NON-KYC SubAgent</b>
                    </div>
                </div>

                <div style={{ transition: 'none' }}>
                    <div style={{ display: selectedView === 'NON-KYC' ? 'block' : 'none' }}>

                        <div className={`modal-content`} style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
                            <div className="modal-header" style={{ borderBottom: '1px solid #eee' }}>
                                <h4>Sub-Agent Details NON-KYC</h4>

                            </div>
                            <form ref={formRef} onSubmit={handleSubmit} autoComplete="off">
                                {/* Row 1: Full Name, Password */}
                                <div className="form-row">
                                    <div className="form-group">
                                        {/* FIX: Removed duplicate asterisk from label */}
                                        <label htmlFor="FullName">Full Name</label>
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
                                        {/* FIX: Wrapped error message in container to stabilize layout */}
                                        <div className="error-message-container">
                                            {formErrors.FullName && <div className="error-message">{formErrors.FullName}</div>}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="Password">Password</label>
                                        <div className="password-input-container">
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
                                        {/* FIX: Wrapped error message in container to stabilize layout */}
                                        <div className="error-message-container">
                                            {formErrors.Password && <div className="error-message">{formErrors.Password}</div>}
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Trader Name, Email */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="TraderName">Trader Name</label>
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
                                        {/* FIX: Wrapped error message in container to stabilize layout */}
                                        <div className="error-message-container">
                                            {formErrors.TraderName && <div className="error-message">{formErrors.TraderName}</div>}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="EmailID">Email</label>
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
                                            {validationLoading.EmailID && <div className='loading-spinner-small'>Checking...</div>}
                                        </div>
                                        {/* FIX: Wrapped error message in container to stabilize layout */}
                                        <div className="error-message-container">
                                            {formErrors.EmailID && <div className="error-message">{formErrors.EmailID}</div>}
                                        </div>
                                    </div>
                                </div>

                                {/* Row 3: Mobile, Gender */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="MobileNumber">Mobile Number</label>
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
                                                maxLength={10}
                                            />
                                            {validationLoading.MobileNumber && <div className='loading-spinner-small'>Checking...</div>}
                                        </div>
                                        {/* FIX: Wrapped error message in container to stabilize layout */}
                                        <div className="error-message-container">
                                            {formErrors.MobileNumber && <div className="error-message">{formErrors.MobileNumber}</div>}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="Gender">Gender </label>
                                        <select
                                            id="Gender"
                                            name="Gender"
                                            className="form-control"
                                            value={formData.Gender}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        {/* Empty container for layout consistency */}
                                        <div className="error-message-container"></div>
                                    </div>
                                </div>

                                {/* Row 4: DOB, Education */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="DOB">DOB or Date of Incorporation </label>
                                        <input
                                            type="date"
                                            id="DOB"
                                            name="DOB"
                                            className={`form-control ${formErrors.DOB ? 'error' : ''}`}
                                            value={formData.DOB}
                                            onChange={handleChange}
                                            autoComplete="off"
                                            required
                                        />
                                        {/* FIX: Wrapped error message in container to stabilize layout */}
                                        <div className="error-message-container">
                                            {formErrors.DOB && <div className="error-message">{formErrors.DOB}</div>}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="EducationQualification">Education Qualification </label>
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
                                        {/* FIX: Wrapped error message in container to stabilize layout */}
                                        <div className="error-message-container">
                                            {formErrors.EducationQualification && <div className="error-message">{formErrors.EducationQualification}</div>}
                                        </div>
                                    </div>
                                </div>

                                {/* Row 5: GST (No PAN field is shown) */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="GST" className="optional-label">GST No (optional)</label>
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
                                        {/* Empty container for layout consistency */}
                                        <div className="error-message-container"></div>
                                    </div>
                                </div>

                                {/* Row 6: Address */}
                                <div className="form-row" style={{ display: 'block', width: '100%' }}>
                                    <div className="form-group" style={{ width: '100%', flex: 'none' }}>
                                        <label htmlFor="Address" className="optional-label">Address (optional)</label>
                                        <textarea
                                            id="Address"
                                            name="Address"
                                            className="form-control"
                                            value={formData.Address}
                                            onChange={handleChange}
                                            autoComplete="off"
                                            placeholder="Enter Address"
                                            rows={3}
                                            style={{ resize: 'vertical', minHeight: '80px', width: '100%', boxSizing: 'border-box', maxWidth: '100%', display: 'block' }}
                                        />
                                        {/* Empty container for layout consistency */}
                                        <div className="error-message-container"></div>
                                    </div>
                                </div>

                                {/* Row 7: Payout, Payment Mode */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="PayoutPercentage">Payout TravelAssist (%)<span style={{ color: '#4154f1', fontWeight: 500 }}>(Main Agent Payout is {Main_Agent_Payout})</span></label>
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
                                        {/* FIX: Wrapped error message in container to stabilize layout */}
                                        <div className="error-message-container">
                                            {formErrors.PayoutPercentage && <div className="error-message">{formErrors.PayoutPercentage}</div>}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="PaymentMode">Payment Mode </label>
                                        <select
                                            id="PaymentMode"
                                            name="PaymentMode"
                                            className="form-control"
                                            value={formData.PaymentMode}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="Full Pay">Full Pay</option>
                                            <option value="Upfront Commission">Upfront Commission</option>
                                            <option value="Discount">Discount</option>
                                        </select>
                                        {/* Empty container for layout consistency */}
                                        <div className="error-message-container"></div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="PayoutPracto">Payout Practo (%)</label>
                                        <input
                                            type="text"
                                            id="PayoutPracto"
                                            name="PayoutPracto"
                                            className={`form-control ${formErrors.PayoutPracto ? 'error' : ''}`}
                                            value={formData.PayoutPracto}
                                            onChange={handleChange}
                                            autoComplete="off"
                                            placeholder="Enter Payout Practo Percentage (0-50)"
                                            required
                                        />
                                        <div className="error-message-container">
                                            {formErrors.PayoutPracto && <div className="error-message">{formErrors.PayoutPracto}</div>}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="PayoutAyush">Payout AyushPay (%)</label>
                                        <input
                                            type="text"
                                            id="PayoutAyush"
                                            name="PayoutAyush"
                                            className={`form-control ${formErrors.PayoutAyush ? 'error' : ''}`}
                                            value={formData.PayoutAyush}
                                            onChange={handleChange}
                                            autoComplete="off"
                                            placeholder="Enter Payout AyushPay Percentage (0-50)"
                                            required
                                        />
                                        <div className="error-message-container">
                                            {formErrors.PayoutAyush && <div className="error-message">{formErrors.PayoutAyush}</div>}
                                        </div>
                                    </div>
                                </div>

                                {/* Row 8: Wallet Amount, State */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="Wallet_Amount">Wallet Amount:</label>
                                        <select
                                            id="Wallet_Amount"
                                            name="Wallet_Amount"
                                            value={formData.Wallet_Amount}
                                            onChange={handleChange}
                                            style={{ padding: '8px 15px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px', backgroundColor: 'white', width: '250px', height: '44px' }}
                                        >
                                            <option value="0">₹ 0</option>
                                            <option value="5000">₹ 5,000</option>
                                            <option value="10000">₹ 10,000</option>
                                            <option value="15000">₹ 15,000</option>
                                            <option value="20000">₹ 20,000</option>
                                            <option value="25000">₹ 25,000</option>
                                        </select>
                                        {/* Empty container for layout consistency */}
                                        <div className="error-message-container"></div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="State">State</label>
                                        <select
                                            id="State"
                                            name="State"
                                            className={`form-control ${formErrors.State ? 'error' : ''}`}
                                            value={formData.State}
                                            onChange={handleChange}
                                            required
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
                                        {/* FIX: Wrapped error message in container to stabilize layout */}
                                        <div className="error-message-container">
                                            {formErrors.State && <div className="error-message">{formErrors.State}</div>}
                                        </div>
                                    </div>
                                </div>


                                {error && <div className="alert alert-error">{error}</div>}
                                {success && (<div className="alert alert-success"><Check size={18} style={{ marginRight: '8px' }} />{success}</div>)}

                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseAttempt} disabled={loading}>
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading || validationLoading.EmailID || validationLoading.MobileNumber}
                                        style={{
                                            opacity: (loading || validationLoading.EmailID || validationLoading.MobileNumber) ? '0.7' : '1',
                                            cursor: (loading || validationLoading.EmailID || validationLoading.MobileNumber) ? 'not-allowed' : 'pointer'
                                        }}
                                    >

                                        {loading ? 'Adding...' : 'Submit Sub-Agent'}
                                    </button>
                                </div>
                            </form>

                            {showConfirmClose && (
                                <div className="confirmation-overlay">
                                    <div className="confirmation-dialog">
                                        <h3>Confirm Close</h3>
                                        <p>Are you sure you want to close? All entered data will be lost.</p>
                                        <div className="confirmation-buttons">
                                            <button className="btn btn-secondary" onClick={() => setShowConfirmClose(false)}>
                                                No, Continue Editing
                                            </button>
                                            <button className="btn btn-primary" onClick={() => { setShowConfirmClose(false); navigate('/dashboard'); }}>
                                                Yes, Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={{ display: selectedView === 'KYC' ? 'block' : 'none' }}>
                        {/* 2. Render the KYC component passing parent props */}
                        <Add_Kyc_subAgent userData={parentAgentData} onLogout={handleLogout} />
                    </div>
                </div>
            </main>

            <footer className="footer">
                <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
            </footer>

            {showConfirmClose && (
                <div className="confirmation-overlay">
                    <div className="confirmation-dialog">
                        <h3>Confirm Close</h3>
                        <p>Are you sure you want to close? All entered data will be lost.</p>
                        <div className="confirmation-buttons">
                            <button className="btn btn-secondary" onClick={() => setShowConfirmClose(false)}>
                                No, Continue Editing
                            </button>
                            <button className="btn btn-primary" onClick={() => { setShowConfirmClose(false); navigate('/dashboard'); }}>
                                Yes, Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Add_subAgent;