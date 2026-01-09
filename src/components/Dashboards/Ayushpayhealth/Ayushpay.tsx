import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Ayushpay.css';
import {
  LogOut, CheckCircle, XCircle, Loader, Wallet, ArrowLeftCircle
} from 'lucide-react';

import {
  checkAyushDuplicate,
  createAyushPayProposal,
  updateAyushProposalWallet,
  getAyushPayPremium,
  generateInvoiceAyushPayPdf

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



interface AyushpayProps {
  onLogout?: () => void;
}

const Ayushpay: React.FC<AyushpayProps> = ({ onLogout = () => { } }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const agentData = location.state?.agentData as AgentData | undefined;

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    pan_number: '',
    mobile: '',
    email: '',
    pincode: '',
    Ayushpayplan_id: 'PLAN_123',
    Ayushpay_PlanName: 'Platinum Plan',
    amount: ''
  });

  const [formErrors, setFormErrors] = useState({
    first_name: '',
    last_name: '',
    pan_number: '',
    mobile: '',
    email: '',
    pincode: '',
    Ayushpayplan_id: '',
    Ayushpay_PlanName: '',
    amount: ''
  });

  // UI & Data State

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Payment Calculation State
  const [lastApiResponse, setLastApiResponse] = useState<any>(null);
  const [error, setError] = useState('');
  const [premium, setPremium] = useState<number | null>(null);
  const [agentcollected, setagentcollected] = useState<number | null>(null);
  const [paymentmode, setpaymentmode] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [availableOptions, setAvailableOptions] = useState(new Set());
  const [premiumResponse, setPremiumResponse] = useState<any>(null);

  const [proposalResponse, setProposalResponse] = useState<any>(null);
  const [loaderMessage, setLoaderMessage] = useState('');

  // 1. Load Premium Calculation on Mount
  useEffect(() => {
    if (agentData?.AgentId) {
      handleCalculatorPremium();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentData?.AgentId]);

  // 2. Load Plans on Mount


  // 3. Update Payment UI when Premium Data Arrives
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
      updatePaymentAmounts(initialSelectedOption, data);
      setPremiumResponse(data);
    }
  }, [lastApiResponse]);

  const updatePaymentAmounts = (option: string, data: any) => {
    if (option === 'full') {
      setPremium(parseFloat(data.premium_amount));
      setagentcollected(parseFloat(data.full_agent_collection));
      setpaymentmode('Full Pay');
    } else if (option === 'Upfront') {
      setPremium(parseFloat(data.premium_amount));
      setagentcollected(parseFloat(data.upfront_agent_commission));
      setpaymentmode('Upfront Commission');
    } else if (option === 'discount') {
      setPremium(parseFloat(data.premium_amount));
      setagentcollected(parseFloat(data.discount_agent_collection));
      setpaymentmode('Discount');
    }
  };

  const handleCalculatorPremium = async () => {
    if (!agentData) return;
    setIsLoading(true);
    try {
      const agentId = parseInt(agentData.AgentId.toString());
      const response = await getAyushPayPremium(agentId);
      if (response?.Status === 'Success' && response?.MasterData) {
        setLastApiResponse(response);
      } else {
        setError(response?.Message || 'Failed to load premium options');
      }
    } catch (error) {
      console.error('Error loading premium:', error);
      setError('Error loading premium options.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'pan_number' ? value.toUpperCase() : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOption = e.target.value;
    setSelectedOption(newOption);
    if (lastApiResponse) {
      updatePaymentAmounts(newOption, lastApiResponse.MasterData);
    }
  };

  const validateForm = (): boolean => {
    const errors: any = {};
    let isValid = true;

    if (!formData.first_name.trim()) { errors.first_name = 'First Name is required'; isValid = false; }
    if (!formData.last_name.trim()) { errors.last_name = 'Last Name is required'; isValid = false; }
    if (!formData.mobile.trim() || !/^[0-9]{10}$/.test(formData.mobile)) { errors.mobile = 'Valid 10-digit Mobile is required'; isValid = false; }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { errors.email = 'Valid Email is required'; isValid = false; }
    if (!formData.pan_number.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number)) { errors.pan_number = 'Valid PAN (ABCDE1234F) is required'; isValid = false; }
    if (!formData.pincode.trim() || !/^[0-9]{6}$/.test(formData.pincode)) { errors.pincode = 'Valid 6-digit Pincode is required'; isValid = false; }
    if (!formData.Ayushpayplan_id) { errors.Ayushpayplan_id = 'Please select a plan'; isValid = false; }

    setFormErrors(prev => ({ ...prev, ...errors }));
    return isValid;
  };



  // --- PHASE 1: CREATE PROPOSAL ---

  const handleSubmitProposal = async (): Promise<any | null> => {
    if (!validateForm()) {
      setMessage({ text: 'Please fix form errors.', type: 'error' });
      return null;
    }

    if (!agentData) return null;

    setIsLoading(true);
    setLoaderMessage('Validating Customer Details...');

    try {
      const dupCheck: any = await checkAyushDuplicate(
        formData.mobile,
        formData.email
      );

      // FIX: Check for "Failure" status when duplicate found
      if (dupCheck?.Status === 'Failure' || dupCheck?.Status === 'Error') {
        setMessage({
          text: 'User with this mobile or email already exists.',//dupCheck.Message ||
          type: 'error'
        });
        setIsLoading(false);
        setLoaderMessage('');
        return null;
      }

      // If Status is "Success", user is unique, proceed
      if (dupCheck.Status !== 'Success') {
        setMessage({
          text: 'Unexpected response from duplicate check.',
          type: 'error'
        });
        setIsLoading(false);
        setLoaderMessage('');
        return null;
      }

      // ✅ Now create proposal (user is unique)
      setLoaderMessage('Creating Proposal...');

      const payload = {
        AgentId: agentData.AgentId,
        ...formData,
        amount: agentcollected
      };

      const result = await createAyushPayProposal(payload);

      if (result.Status === 'Success') {
        const data = result.MasterData;
        setProposalResponse(data);
        setIsSubscribed(true);
        setMessage({
          text: 'Proposal initialized. Proceeding to payment...',
          type: 'success'
        });
        setLoaderMessage('');
        return data;
      } else {
        setMessage({
          text: result.Message || 'Proposal creation failed.',
          type: 'error'
        });
        setLoaderMessage('');
        return null;
      }
    } catch (error: any) {
      setMessage({
        text: error?.response?.data?.Message || 'Server Error during proposal.',
        type: 'error'
      });
      setLoaderMessage('');
      return null;
    } finally {
      setIsLoading(false);
    }
  };


  // --- PHASE 2: PROCESS PAYMENT & ACTIVATE ---
  const handleWalletPayment = async () => {

    if (!agentData || !agentcollected) {
      setMessage({ text: 'Premium details not loaded.', type: 'error' });
      return;
    }

    const walletBalance = parseFloat(agentData.Wallet_Amount || '0');

    if (agentcollected > walletBalance) {
      setMessage({ text: `Insufficient Wallet Balance. Required: ₹${agentcollected}`, type: 'error' });
      return;
    }

    let currentProposal = proposalResponse;

    if (!isSubscribed || !currentProposal) {
      currentProposal = await handleSubmitProposal();
      if (!currentProposal) return;
    }



    setIsLoading(true);
    setLoaderMessage('Processing Payment & Activating Subscription...');

    const paymentPayload = {
      AgentId: agentData.AgentId,
      Ayush_id: currentProposal.Ayush_id,

      Ayush_ApplicationId: currentProposal.Ayush_ApplicationId,
      Ayushpayplan_id: formData.Ayushpayplan_id,
      Selected_Payment_Mode: paymentmode,
      Selected_PremiumAmount: agentcollected,
      premium_amount: premiumResponse.premium_amount,
      gst_amount: premiumResponse.gst_amount,
      commission_agent: premiumResponse.commission_agent,
      tds_amount: premiumResponse.tds_amount,
      payout_percentage: premiumResponse.payout_percentage,
      Wallet_Amount: premiumResponse?.Wallet_Amount
    };

    try {
      const result = await updateAyushProposalWallet(paymentPayload);

      if (result.Status === 'Success') {
        setLoaderMessage('Payment Successful! Generating Invoice...');

        let pdfUrl = null;
        try {
          setLoaderMessage('Generating Invoice...');
          const invoiceRes = await generateInvoiceAyushPayPdf(currentProposal.Ayush_id);
          if (invoiceRes?.MasterData?.pdfUrl) pdfUrl = invoiceRes.MasterData.pdfUrl;
        } catch (e) 
        { console.warn("Invoice gen skipped", e);
          setLoaderMessage('Completing Subscription...');
         }

        const completePaymentData = {
          ...result.MasterData, // contains status
          ...formData,
          Selected_PremiumAmount: agentcollected,
          Selected_Payment_Mode: paymentmode,
          // Pass IDs for reference in details page
          Ayush_id: currentProposal.Ayush_id,
          Ayush_ApplicationId: currentProposal.Ayush_ApplicationId
        };

        setTimeout(() => {
          setIsLoading(false); // ✅ Stop loader before navigate
          setLoaderMessage('');
          navigate('/AyushWalletDetails', {
            state: {
              paymentData: completePaymentData,
              agentData: agentData,
              pdfUrl: pdfUrl
            }
          });
        }, 1500);

      } else {
        setMessage({ text: result.Message || 'Wallet payment failed.', type: 'error' });
        setIsLoading(false);
        setLoaderMessage('');
      }
    } catch (error: any) {
      setMessage({ text: error.response?.data?.Message || 'Payment/Activation Error.', type: 'error' });
      setIsLoading(false);
      setLoaderMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  // --- NAVIGATION HANDLERS ---
  const handleLogout = () => {
    logout();
    onLogout();
    navigate('/login', { replace: true });
  };

  const handleCancel = () => {
    setIsSubscribed(false);
    setProposalResponse(null);
    setMessage(null);
     setLoaderMessage('');
    setFormData(prev => ({ ...prev, Ayushpayplan_id: '', Ayushpay_PlanName: '' }));
    window.location.reload();
  };

  const handleGoToPlanSelection = () => {
    navigate('/dashboard');
  };

  const handleGoToWalletPage = () => {
    navigate('/WalletPageAyush', {
      state: { agentData: agentData }
    });
  };

  const gotoMISAyush = () => {
    if (!agentData) {
      setMessage({ text: 'Agent data is missing.', type: 'error' });
      return;
    }
    navigate('/MIS_Proposal_AyushPay', {
      state: {
        empid: '',
        agentData: agentData,
        userType: 'Agent',
        adminId: ''
      }
    });
  }

  if (!agentData) return <div className="ayush-page-container"><div className="ayush-card">Access Denied</div></div>;

  return (
    <>
      <header className="top-header">
        <div className="header-content">
          <img src={logo} alt="ZextrA" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
          <div className="d-flex justify-content-center py-4">
            <div className="logo d-flex align-items-center w-auto">

              <span className="d-none d-lg-block logo-text">Ayushpay Subscription</span>
            </div>
          </div>

          <nav className="nav-link">
            <button autoFocus onClick={handleLogout} className="btn btn-danger">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </nav>
        </div>
      </header>

      {isLoading && (
        <div className="ayush-loader-overlay">
          <div className="ayush-loader-content">
            <Loader className="ayush-big-spinner" size={64} />
            <span className="ayush-loader-text">{loaderMessage}</span>
            <span className="ayush-loader-subtext">Please do not close or refresh this window.</span>
          </div>
        </div>
      )}
      <main className="ayush-main-content">
        <div className="ayush-page-container">

          {/* TOP ACTIONS - NOW OUTSIDE AND ABOVE CARD */}
          <div className="ayush-actions-wrapper">
            <button onClick={handleGoToPlanSelection} className="ayush-back-btn">
              <ArrowLeftCircle size={18} />
              <span>Back To Plan Selection</span>
            </button>

            <div className="ayush-actions-right">
              <button className="ayush-wallet-btn-top" onClick={handleGoToWalletPage}>
                <Wallet size={18} />
                <span>Wallet</span>
              </button>
              <button className="ayush-mis-btn-top" onClick={gotoMISAyush}>
                MIS Report
              </button>
            </div>
          </div>

          <div className="ayush-card">
            <h1 className="ayush-header">Welcome to Ayushpay</h1>
            <p className="ayush-text">Please input the below details.</p>

            {/* FORM SECTION */}
            <div className="ayush-form">

              {/* Row 1 */}
              <div className="ayush-form-row">
                <div className="ayush-form-group">
                  <label className="ayush-form-label">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    className={`ayush-form-control ${formErrors.first_name ? 'ayush-error-border' : ''}`}
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={isSubscribed}
                    placeholder="Enter first name"
                  />
                  {formErrors.first_name && <span className="ayush-error-text">{formErrors.first_name}</span>}
                </div>

                <div className="ayush-form-group">
                  <label className="ayush-form-label">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    className={`ayush-form-control ${formErrors.last_name ? 'ayush-error-border' : ''}`}
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={isSubscribed}
                    placeholder="Enter last name"
                  />
                  {formErrors.last_name && <span className="ayush-error-text">{formErrors.last_name}</span>}
                </div>
              </div>

              {/* Row 2 */}
              <div className="ayush-form-row">
                <div className="ayush-form-group">
                  <label className="ayush-form-label">Mobile Number</label>
                  <input
                    type="tel"
                    name="mobile"
                    className={`ayush-form-control ${formErrors.mobile ? 'ayush-error-border' : ''}`}
                    value={formData.mobile}
                    onChange={handleChange}
                    maxLength={10}
                    disabled={isSubscribed}
                    placeholder="10-digit mobile number"
                  />
                  {formErrors.mobile && <span className="ayush-error-text">{formErrors.mobile}</span>}
                </div>

                <div className="ayush-form-group">
                  <label className="ayush-form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className={`ayush-form-control ${formErrors.email ? 'ayush-error-border' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isSubscribed}
                    placeholder="Enter email address"
                  />
                  {formErrors.email && <span className="ayush-error-text">{formErrors.email}</span>}
                </div>
              </div>

              {/* Row 3 */}
              <div className="ayush-form-row">
                <div className="ayush-form-group">
                  <label className="ayush-form-label">PAN Number</label>
                  <input
                    type="text"
                    name="pan_number"
                    className={`ayush-form-control ${formErrors.pan_number ? 'ayush-error-border' : ''}`}
                    style={{ textTransform: 'uppercase' }}
                    value={formData.pan_number}
                    onChange={handleChange}
                    maxLength={10}
                    disabled={isSubscribed}
                    placeholder="Format: ABCDE1234F"
                  />
                  {formErrors.pan_number && <span className="ayush-error-text">{formErrors.pan_number}</span>}
                </div>

                <div className="ayush-form-group">
                  <label className="ayush-form-label">Pin Code</label>
                  <input
                    type="text"
                    name="pincode"
                    className={`ayush-form-control ${formErrors.pincode ? 'ayush-error-border' : ''}`}
                    value={formData.pincode}
                    onChange={handleChange}
                    maxLength={6}
                    disabled={isSubscribed}
                    placeholder="6-digit pin code"
                  />
                  {formErrors.pincode && <span className="ayush-error-text">{formErrors.pincode}</span>}
                </div>
              </div>

            </div>

            {/* MESSAGE BOX */}
            {message && (
              <div className={`ayush-api-message ${message.type === 'success' ? 'ayush-success' : 'ayush-error'}`}>
                {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                <span>{message.text}</span>
              </div>
            )}

            {/* WALLET DISPLAY */}
            <div className="ayush-wallet-display">
              <div className="ayush-wallet-info-box">
                <Wallet size={18} className="text-green-600" />
                <span className="ayush-wallet-text">Wallet Balance: ₹{parseFloat(agentData.Wallet_Amount || '0').toFixed(2)}</span>
              </div>
            </div>

            {/* PAYMENT & ACTIONS */}
            <div className="ayush-payment-section">

              <div className="ayush-payment-radio-group">
                {availableOptions.has('full') && (
                  <label className={`ayush-radio-label ${selectedOption === 'full' ? 'ayush-selected' : ''}`}>
                    <input className="ayush-radio-input" type="radio" name="paymentOption" value="full" checked={selectedOption === 'full'} onChange={handleRadioChange} />
                    <span className="ayush-radio-text">Full Pay</span>
                  </label>
                )}
                {availableOptions.has('discount') && (
                  <label className={`ayush-radio-label ${selectedOption === 'discount' ? 'ayush-selected' : ''}`}>
                    <input className="ayush-radio-input" type="radio" name="paymentOption" value="discount" checked={selectedOption === 'discount'} onChange={handleRadioChange} />
                    <span className="ayush-radio-text">Discount</span>
                  </label>
                )}
                {availableOptions.has('Upfront') && (
                  <label className={`ayush-radio-label ${selectedOption === 'Upfront' ? 'ayush-selected' : ''}`}>
                    <input className="ayush-radio-input" type="radio" name="paymentOption" value="Upfront" checked={selectedOption === 'Upfront'} onChange={handleRadioChange} />
                    <span className="ayush-radio-text">Upfront Commission</span>
                  </label>
                )}
              </div>

              {agentcollected !== null && (
                <div className="ayush-collection-box">
                  <span className="ayush-collection-text">
                    To be collected from Agent: <b>₹{agentcollected.toFixed(0)}</b>
                  </span>
                </div>
              )}

              <div className="ayush-payment-actions">
                <button
                  className='ayush-premium-btn'
                  type="button"
                  onClick={handleWalletPayment}
                  disabled={isLoading || agentcollected === null}
                >
                  {isLoading ? 'Processing...' : 'Submit Ayushpay Subscription'}
                </button>

                <button className='ayush-apply-btn' type="button" onClick={handleCancel} disabled={isLoading}>
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

export default Ayushpay;