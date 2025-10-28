import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import './Practo.css';
import {
  UserCircle, Mail, BadgeCheck, LogOut, UserPlus, RefreshCw, Home, Upload, CheckCircle, X,
  Wallet, CreditCard, ArrowLeftCircle, XCircle, Loader
} from 'lucide-react';

import {
  createPractoProposal, updatePractoProposalWallet, getPractoPremium, generateInvoicePractoPdf
} from '../../../services/api';
import { logout } from '../../../services/auth';
import logo from '../../../../src/assets/img/TravelAssist_practo.webp';

interface AgentData {
  AgentId: number;
  name?: string;
  FullName?: string;
  TraderName?: string;
  email?: string;
  EmailID?: string;
  MobileNumber?: string;
  Agent_Code?: string;
  Wallet_Amount?: string;
  paymentmode?: string;
}

interface PremiumData {
  agent_collected: number;
  commission_agent: number;
  discount_agent_collection: number;
  full_agent_collection: number;
  gst_amount: number;
  payment_mode: string;
  payout_percentage: number;
  premium_amount: number;
  tds_amount: number;
  upfront_agent_commission: number;
  Wallet_Amount: number;
}

interface PractoProps {
  onLogout?: () => void;
}


const Practo: React.FC<PractoProps> = ({ onLogout = () => { } }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const agentData = location.state?.agentData as AgentData | undefined;

  const [formData, setFormData] = useState({
    FullName: '',
    MobileNumber: '',
    EmailID: ''
  });

  const [formErrors, setFormErrors] = useState({
    FullName: '',
    MobileNumber: '',
    EmailID: ''
  });
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [lastApiResponse, setLastApiResponse] = useState<any>(null);
  const [error, setError] = useState('');

  const [premium, setPremium] = useState<number | null>(null);
  const [agentcollected, setagentcollected] = useState<number | null>(null);
  const [paymentmode, setpaymentmode] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [availableOptions, setAvailableOptions] = useState(new Set());

  const [proposalResponse, setProposalResponse] = useState<any>(null); 
  const [premiumResponse, setPremiumResponse] = useState<any>(null);

  const radioStyles = {
    radioGroup: {
      display: 'flex',
      gap: '20px',
      margin: '15px 0',
      justifyContent: 'center'
    },
    radioLabel: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      padding: '8px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      transition: 'all 0.2s ease',
      backgroundColor: '#f9fafb'
    },
    radioLabelSelected: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      padding: '8px 16px',
      border: '2px solid #2563eb',
      borderRadius: '6px',
      backgroundColor: '#eff6ff',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
    },
    radioInput: {
      marginRight: '8px'
    },
    radioText: {
      fontWeight: '500',
      fontSize: '14px'
    }
  };


  // FIX 1: Initial load of premium data and options (runs only once on mount)
  useEffect(() => {
    if (agentData?.AgentId) {
      handleCalculatorPremium();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentData?.AgentId]); 

  // Secondary useEffect: Sets payment state whenever new premium data is fetched
  useEffect(() => {
    if (lastApiResponse && lastApiResponse.MasterData) {
      const data = lastApiResponse.MasterData;
      const apiPaymentMode = data.paymentmode;
      const newOptions = new Set();
      let initialSelectedOption = '';

      if (apiPaymentMode === 'Full Pay' || apiPaymentMode === 'Discount') {
        newOptions.add('full');
        newOptions.add('discount');
        initialSelectedOption = apiPaymentMode === 'Discount' ? 'discount' : 'full';
      } else if (apiPaymentMode === 'Upfront Commission') {
        newOptions.add('Upfront');
        initialSelectedOption = 'Upfront';
      }

      setAvailableOptions(newOptions);
      setSelectedOption(initialSelectedOption);

      if (initialSelectedOption === 'full') {
        setPremium(parseFloat(data.premium_amount));
        setagentcollected(parseFloat(data.full_agent_collection));
        setpaymentmode('Full Pay');
      } else if (initialSelectedOption === 'Upfront') {
        setPremium(parseFloat(data.premium_amount));
        setagentcollected(parseFloat(data.upfront_agent_commission));
        setpaymentmode('Upfront Commission');
      } else if (initialSelectedOption === 'discount') {
        setPremium(parseFloat(data.premium_amount));
        setagentcollected(parseFloat(data.discount_agent_collection));
        setpaymentmode('Discount');
      } else {
        setPremium(parseFloat(data.premium_amount));
        setagentcollected(null);
        setpaymentmode(null);
      }
      setPremiumResponse(data);
    }
  }, [lastApiResponse]);


  const handleGoToPlanSelection = () => {
    navigate('/dashboard');
  };

  const handleGoToWalletPagePracto = () => {
    navigate('/WalletPagePracto');
  };


  const gotoMISPracto = () => {
    if (!agentData) {
      setMessage({ text: 'Agent data is missing.', type: 'error' });
      return;
    }
    if (agentData.paymentmode === 'Upfront Commission') {
      navigate('/TDS_Proposal_Practo', {
        state: {
          empid: '',
          agentData: agentData,
          userType: 'Agent',
          adminId: ''
        }
      });
    } else {
      navigate('/MIS_Proposal_Practo', {
        state: {
          empid: '',
          agentData: agentData,
          userType: 'Agent',
          adminId: ''
        }
      });
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors = {
      FullName: '',
      MobileNumber: '',
      EmailID: ''
    };

    let isValid = true;

    if (!formData.FullName.trim()) {
      errors.FullName = 'Full Name is required';
      isValid = false;
    } else if (formData.FullName.trim().length < 3) {
      errors.FullName = 'Full Name must be at least 3 characters';
      isValid = false;
    }

    if (!formData.MobileNumber.trim()) {
      errors.MobileNumber = 'Mobile Number is required';
      isValid = false;
    } else if (!/^[0-9]{10}$/.test(formData.MobileNumber.trim())) {
      errors.MobileNumber = 'Mobile Number must be 10 digits';
      isValid = false;
    }

    if (!formData.EmailID.trim()) {
      errors.EmailID = 'Email Address is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.EmailID.trim())) {
      errors.EmailID = 'Please enter a valid email address';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmitProposal = async (): Promise<any | null> => {
    if (!agentData) {
      setMessage({ text: 'Agent data is missing.', type: 'error' });
      return null;
    }

    if (!validateForm()) {
      setMessage({ text: 'Please fix the errors in the Practo Subscription form. Cannot proceed to payment', type: 'error' });
      return null;
    }
    setIsLoading(true);
    setMessage(null);

    const payload = {
      AgentId: agentData.AgentId,
      FullName: formData.FullName,
      EmailID: formData.EmailID,
      MobileNumber: formData.MobileNumber,
      plan_id: "87e6002d-b99c-4dba-a171-f164f583ee2c"
    };

    try {
      const result = await createPractoProposal(payload);

      if (result.Status === 'Success') {
        const newProposalResponse = result.MasterData;
        
        if (newProposalResponse && newProposalResponse.status === 'Success' && newProposalResponse.Practo_proposal_id) {
            setProposalResponse(newProposalResponse);
            setIsSubscribed(true); // Lock the form
            setMessage({ text: 'Proposal submitted successfully! Ready for payment.', type: 'success' });
            return newProposalResponse;
        } else {
            setMessage({ text: newProposalResponse.message || 'Proposal failed or ID is missing.', type: 'error' });
            return null;
        }
      } else {
        setMessage({ text: result.Message || 'Proposal submission failed.', type: 'error' });
        return null;
      }
    } catch (error) {
      const errorMessage = (error as any).response?.data?.Message || 'Failed to connect to the server.';
      setMessage({ text: errorMessage, type: 'error' });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch and set premium data (called on mount)
  const handleCalculatorPremium = async () => {
    if (!agentData) return;

    if (!lastApiResponse) {
        setIsLoading(true);
    }
    
    setPremium(null);
    setagentcollected(null);
    setError('');
    setMessage(null);

    try {
      const agentId = parseInt(agentData?.AgentId?.toString() || '0');
      const response = await getPractoPremium(agentId);

      if (response?.Status === 'Success' && response?.MasterData) {
        setLastApiResponse(response); 
        
      } else {
        setError(response?.Message || 'Failed to load premium options');
        setMessage({ text: response?.Message || 'Failed to load premium options', type: 'error' });
      }
    } catch (error) {
      console.error('Error loading premium:', error);
      const errorMsg = 'Error loading premium options. Please try again.';
      setError(errorMsg);
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOption = e.target.value;
    setSelectedOption(newOption);

    if (lastApiResponse) {
      const data = lastApiResponse.MasterData;

      if (newOption === 'full') {
        setpaymentmode('Full Pay');
        setagentcollected(parseFloat(data.full_agent_collection));
      } else if (newOption === 'discount') {
        setpaymentmode('Discount');
        setagentcollected(parseFloat(data.discount_agent_collection));
      } else if (newOption === 'Upfront') {
        setpaymentmode('Upfront Commission');
        setagentcollected(parseFloat(data.upfront_agent_commission));
      }
    }
  };

  const handleCancel = () => {
    setLastApiResponse(null);
    setPremium(null);
    setagentcollected(null);
    setError('');
    setSelectedOption('');
    setAvailableOptions(new Set());
    setPremiumResponse(null);
    setMessage(null);
    setProposalResponse(null); 
    setIsSubscribed(false); 
    handleCalculatorPremium(); 
    setFormData({
      FullName: '',
      MobileNumber: '',
      EmailID: ''
    });
  };

  /**
   * Primary function to handle combined Proposal Submission (if needed) and Wallet Payment.
   */
  const handleWalletPayment = async () => {
    let currentProposalResponse = proposalResponse;

    // 1. Submit proposal if not already submitted
    if (!isSubscribed) {
        setMessage({ text: 'Submitting proposal and processing payment...', type: 'success' });
        
        currentProposalResponse = await handleSubmitProposal();
        if (!currentProposalResponse) {
          //  setMessage({ text: 'Please fix the errors in the Practo Subscription form. Cannot proceed to payment.', type: 'error' });
            return;
        }
    }
    
    // 2. Pre-payment checks
    if (!agentData || !premiumResponse || agentcollected === null || !paymentmode) {
      setMessage({ text: 'Payment details are incomplete. Please select a payment option and ensure premium is loaded.', type: 'error' });
      return;
    }

    const walletBalance = parseFloat(agentData.Wallet_Amount || '0');
    if (agentcollected > walletBalance) {
      setMessage({
        text: `Insufficient wallet balance. Required: ₹${agentcollected.toFixed(0)}, Available: ₹${walletBalance.toFixed(0)}`,
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);
  
    // 3. Construct payload for wallet payment
    const payload_wallet = {
      AgentId: agentData.AgentId,
      Practo_proposal_id: currentProposalResponse.Practo_proposal_id, 
      premium_amount: premiumResponse.premium_amount,
      Selected_PremiumAmount: agentcollected,
      Selected_Payment_Mode: paymentmode,
      gst_amount: premiumResponse.gst_amount,
      commission_agent: premiumResponse.commission_agent,
      tds_amount: premiumResponse.tds_amount,
      payout_percentage: premiumResponse.payout_percentage,
      Wallet_Amount: premiumResponse.Wallet_Amount
    };

    // 4. Perform wallet payment
    try {
      const result = await updatePractoProposalWallet(payload_wallet);

      if (result.Status === 'Success') {
        setMessage({ text: 'Payment processed successfully! Generating invoice...', type: 'success' });
        let invoicePdfUrl = null;

        // 5. Generate PDF/Invoice
        try {
          const invoiceResult = await generateInvoicePractoPdf(currentProposalResponse.Practo_proposal_id);

          if (invoiceResult.Status === 'Success' && invoiceResult.MasterData.pdfUrl) {
            invoicePdfUrl = invoiceResult.MasterData.pdfUrl;
          }
        } catch (err) {
          console.error('PDF generation failed (ignored):', err);
        }

        // 6. Prepare data for next page and navigate
        const completePaymentData = {
          ...result.MasterData,
          Selected_PremiumAmount: agentcollected,
          Selected_Payment_Mode: premiumResponse.payment_mode || paymentmode,
          FullName: formData.FullName,
          MobileNumber: formData.MobileNumber,
          EmailID: formData.EmailID,
        };

        setTimeout(() => {
          navigate('/PractoWalletDetails', {
            state: {
              paymentData: completePaymentData,
              agentData: agentData,
              pdfUrl: invoicePdfUrl
            }
          });
        }, 1500);
      } else {
        setMessage({ text: result.message || 'Wallet payment failed.', type: 'error' });
      }
    } catch (error) {
      const errorMessage = (error as any).response?.data?.message || 'Failed to process payment.';
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };


  // Initial loading state while premium options are fetched
  if (isLoading && !lastApiResponse) {
    return (
      <div className="practo-page-container">
        <div className="practo-card">
          <div className="initial-loader">
            <Loader className="spinner" size={32} />
            <p className="practo-text">Loading premium options...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where user navigates here directly without data
  if (!agentData) {
    return (
      <div className="practo-page-container">
        <div className="practo-card">
          <h1 className="practo-header-error">Error</h1>
          <p className="practo-text">No agent data found. Please return to the dashboard and try again.</p>
          <button onClick={() => navigate('/dashboard')} className="practo-back-button">Go to Dashboard</button>
        </div>
      </div>
    );
  }
  
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    logout();
    onLogout();
    navigate('/login', { replace: true });
  };

  // Determine button state
  const isPaymentDisabled = isLoading || agentcollected === null || selectedOption === '';

  // Determine if form fields should be disabled
  const isFormDisabled = isSubscribed || isLoading;


  return (
    <>

      <header className="top-header">
        <div className="header-content">
          <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
          <div className="d-flex justify-content-center py-4">
            <div className="logo d-flex align-items-center w-auto">
              <span className="d-none d-lg-block">Practo Subscription</span>
            </div>
          </div>
          <nav className="nav-link">

            <button autoFocus onClick={handleLogout} className="btn btn-danger">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <div className="practo-page-container">
          <div className="practo-card">
            <h1 className="practo-header">Welcome to Practo</h1>
            <p className="practo-text">Please input the below details.</p>

            <div className="practo-form">
              <div className="form-item">
                <label htmlFor="FullName">Full Name</label>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    name="FullName"
                    className="form-control"
                    id="FullName"
                    value={formData.FullName}
                    onChange={handleChange}
                    required
                    disabled={isFormDisabled}
                  />
                  {formErrors.FullName && (
                    <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                      {formErrors.FullName}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-item">
                <label htmlFor="MobileNumber">Mobile Number</label>
                <div style={{ flex: 1 }}>
                  <input
                    type="tel"
                    name="MobileNumber"
                    className="form-control"
                    id="MobileNumber"
                    value={formData.MobileNumber}
                    onChange={handleChange}
                    required
                    disabled={isFormDisabled}
                  />
                  {formErrors.MobileNumber && (
                    <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                      {formErrors.MobileNumber}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-item">
                <label htmlFor="EmailID">Email Address</label>
                <div style={{ flex: 1 }}>
                  <input
                    type="email"
                    name="EmailID"
                    className="form-control"
                    id="EmailID"
                    value={formData.EmailID}
                    onChange={handleChange}
                    required
                    disabled={isFormDisabled}
                  />
                  {formErrors.EmailID && (
                    <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                      {formErrors.EmailID}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {message && (
              <div className={`api-message ${message.type}`}>
                {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                <span>{message.text}</span>
              </div>
            )}

            <div className="containerpractoleft">
              <button onClick={handleGoToPlanSelection} className="back-to-selection-btn1">
                <ArrowLeftCircle size={18} />
                <span>Back To Plan Selection</span>
              </button>
            </div>


            <div className="containerpractoright">



              <div style={{ marginRight: '10px', padding: '12px' }} className="wallet-containerA" onClick={handleGoToWalletPagePracto}>
                <div className="wallet-icon-wrapper">
                  <Wallet className="wallet-iconA" />
                </div>
                <span className="wallet-textA">Wallet</span>
              </div>
              <button onClick={gotoMISPracto} className='Premium-btn-MIS' >
                MIS Report
              </button>
            </div>



            <div style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', marginTop: '20px' }}>
              <div className="info-item" style={{paddingBottom: '10px'}}>
                <strong>Wallet Amount:</strong>
                <span>₹{parseFloat(agentData.Wallet_Amount || '0').toFixed(2)}</span>
              </div>

              <div style={radioStyles.radioGroup}>
                {availableOptions.has('full') && (
                  <label style={selectedOption === 'full' ? radioStyles.radioLabelSelected : radioStyles.radioLabel}>
                    <input
                      type="radio"
                      name="paymentOption"
                      value="full"
                      checked={selectedOption === 'full'}
                      onChange={handleRadioChange}
                      style={radioStyles.radioInput}
                    />
                    <span style={radioStyles.radioText}>Full Pay</span>
                  </label>
                )}
                {availableOptions.has('discount') && (
                  <label style={selectedOption === 'discount' ? radioStyles.radioLabelSelected : radioStyles.radioLabel}>
                    <input
                      type="radio"
                      name="paymentOption"
                      value="discount"
                      checked={selectedOption === 'discount'}
                      onChange={handleRadioChange}
                      style={radioStyles.radioInput}
                    />
                    <span style={radioStyles.radioText}>Discount</span>
                  </label>
                )}
                {availableOptions.has('Upfront') && (
                  <label style={selectedOption === 'Upfront' ? radioStyles.radioLabelSelected : radioStyles.radioLabel}>
                    <input
                      type="radio"
                      name="paymentOption"
                      value="Upfront"
                      checked={selectedOption === 'Upfront'}
                      onChange={handleRadioChange}
                      style={radioStyles.radioInput}
                    />
                    <span style={radioStyles.radioText}>Upfront Commission</span>
                  </label>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '20px', flexWrap: 'wrap', textAlign: 'center' }}>
                {(selectedOption === 'full' || selectedOption === 'discount') && agentcollected !== null && (
                  <div style={{ padding: '15px 25px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '2px solid #ef4444', transition: 'all 0.3s ease' }}>
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#b91c1c' }}>
                      Agent to be collected<br />
                      <b>₹{agentcollected?.toFixed(0)}</b>
                    </span>
                  </div>
                )}
                {selectedOption === 'Upfront' && agentcollected !== null && (
                  <div style={{ padding: '15px 25px', borderRadius: '8px', backgroundColor: '#f5f3ff', border: '2px solid #7c3aed', transition: 'all 0.3s ease' }}>
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#6d28d9' }}>
                      Agent to be collected<br />
                      <b>₹{agentcollected?.toFixed(0)}</b>
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center',gap: '15px',  marginTop: '20px' }}>
                <button className='Premium-btn' type="button" onClick={handleWalletPayment} disabled={isPaymentDisabled}>
                  {isLoading ? <Loader className="spinner" size={20} /> : 'Submit Practo Subscription'}
                </button>
              

                <button className='apply-btn-emp' type="button" onClick={handleCancel}>
                  Cancel
                </button>

                </div>

            
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

export default Practo;