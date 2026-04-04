import React, { useState, useEffect } from 'react';
import {
  UserCircle, AlertTriangle, ArrowLeftCircle, LogOut, Mail, Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../services/auth';
import { calculatePremiumExcluding_bajaj, calculatePremiumIncluding_bajaj } from '../../../services/api';
import './BajajTravel.css';
import logo from '../../../../src/assets/img/TravelAssist.webp';

// --- REDUX IMPORT ---
import { useAgentSelector } from '../../../redux/Agent/hooks';

interface DisplayData {
  AgentId?: string | number;
  agentId?: string | number;
  FullName?: string;
  name?: string;
  Agent_Code?: string;
  EmailID?: string;
  email?: string;
  Paymentmode?: string;
  Payout?: string;
  MobileNumber?: string;
  Wallet_Amount?: string | number;
}

const BajajTravel = () => {
  const navigate = useNavigate();

  // -- 1. STATE MANAGEMENT & REDUX --
  const agentFromRedux = useAgentSelector((state: any) => state.agentDashboard);

  const [displayData] = useState<DisplayData>(() => {
    if (agentFromRedux && agentFromRedux.agentId) {
      return {
        AgentId: agentFromRedux.agentId,
        agentId: agentFromRedux.agentId,
        FullName: agentFromRedux.FullName,
        name: agentFromRedux.FullName,
        Agent_Code: agentFromRedux.Agent_Code,
        EmailID: agentFromRedux.agentEmail,
        email: agentFromRedux.agentEmail,
        Paymentmode: agentFromRedux.Paymentmode,
        Payout: agentFromRedux.Payout,
        MobileNumber: agentFromRedux.MobileNumber,
        Wallet_Amount: agentFromRedux.Wallet_Amount
      };
    }
    const stored = localStorage.getItem('userProfile');
    return stored ? JSON.parse(stored) : {};
  });

  // Wallet Status (Assuming eligible for now unless calculated otherwise)
  const [walletStatus] = useState({ eligibleProposal: true });

  // Calculator Form State
  const [formData, setFormData] = useState({
    departureDate: '',
    arrivalDate: '',
    numberOfDays: '',
    geographicalCover: 'INCL',
    dateOfBirth: '',
    planAmount: '50000',
    agentid: displayData?.AgentId || 0,
  });

  // Calculation Results State
  const [age, setAge] = useState({ years: 0, months: 0 });
  const [premium, setPremium] = useState<number | null>(null);
  const [agentcollected, setagentcollected] = useState<number | null>(null);
  const [paymentmode, setpaymentmode] = useState<string | null>(null);

  // New states for the requested parameters
  const [commission_agent, setCommissionAgent] = useState<number | null>(null);
  const [premium_without_gst, setPremiumWithoutGst] = useState<number | null>(null);
  const [premium_gst, setPremiumGst] = useState<number | null>(null);


  const [selectedOption, setSelectedOption] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [lastApiResponse, setLastApiResponse] = useState<any>(null);
  const [showEligibilityMessage, setShowEligibilityMessage] = useState<boolean>(false);
  const [reliancePremiumAmount, setReliancePremiumAmount] = useState<number | null>(null);
  const [availableOptions, setAvailableOptions] = useState<Set<string>>(new Set());
  const [calculating, setCalculating] = useState<boolean>(false);

  const [Payout_Bajaj, setPayout_Bajaj] = useState<number | null>(null);

  const plans = [
    { value: '50000', label: '50,000 USD' },
    { value: '200000', label: '200,000 USD' },
    { value: '500000', label: '500,000 USD' },
  ];

  // -- 2. HELPER FUNCTIONS --
  const getMaxDateOfBirth = () => {
    const now = new Date();
    now.setMonth(now.getMonth() - 6);
    return now.toISOString().split('T')[0];
  };

  const getMinDateOfBirth = () => {
    const now = new Date();
    now.setFullYear(now.getFullYear() - 81);
    now.setDate(now.getDate() + 1);
    return now.toISOString().split('T')[0];
  };

  const calculateArrivalDate = (departureDate: string, days: string | number) => {
    if (departureDate && days) {
      const departure = new Date(departureDate);
      const arrival = new Date(departure);
      arrival.setDate(departure.getDate() + parseInt(days.toString()) - 1);
      return arrival.toISOString().split('T')[0];
    }
    return '';
  };

  const calculateDays = (departureDate: string, arrivalDate: string) => {
    if (departureDate && arrivalDate) {
      const departure = new Date(departureDate);
      const arrival = new Date(arrivalDate);
      const diffTime = Math.abs(arrival.getTime() - departure.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    return '';
  };

  const getNameOfPlan = () => {
    const amountMap: Record<string, string> = {
      '50000': '50K PLAN',
      '200000 ': '2LPLAN',
      '500000': '5L PLAN'
    };
    const baseLabel = amountMap[formData.planAmount] || '';
    const geo = formData.geographicalCover === 'EXCL' ? 'TRAVEL EXCL USA & CANADA' : 'TRAVEL INCL USA & CANADA';
    return `${geo} ${baseLabel}`;
  };

  // -- 3. EFFECTS --
  useEffect(() => {
    if (formData.dateOfBirth) {
      const birth = new Date(formData.dateOfBirth);
      const today = new Date();
      let years = today.getFullYear() - birth.getFullYear();
      let months = today.getMonth() - birth.getMonth();
      if (months < 0) {
        years--;
        months += 12;
      }
      setAge({ years, months });
    }
  }, [formData.dateOfBirth]);

  useEffect(() => {
    if (lastApiResponse && lastApiResponse.MasterData) {
      const data = lastApiResponse.MasterData;
      const apiPaymentMode = data.paymentmode;
      const newOptions = new Set<string>();
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
        setPremium(parseFloat(data.fullpay_amount || data.premium_amount));
        setagentcollected(parseFloat(data.fullpay_agentcollected || data.agentcollected));
      } else if (initialSelectedOption === 'Upfront') {
        setPremium(parseFloat(data.premium_amount));
        setagentcollected(parseFloat(data.upfront_agent_commission));
      } else {
        setPremium(parseFloat(data.premium_amount));
        setagentcollected(parseFloat(data.agentcollected));
      }
      setpaymentmode(apiPaymentMode);

      // Setting new parameters
      setCommissionAgent(parseFloat(data.commission_agent || '0'));
      setPremiumWithoutGst(parseFloat(data.premium_without_gst || '0'));
      setPremiumGst(parseFloat(data.premium_gst || '0'));

    }
  }, [lastApiResponse]);

  // -- 4. HANDLERS --
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    logout();
    navigate('/login');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'numberOfDays' && parseInt(value) > 182) {
      setError('Duration cannot exceed 182 days. Please enter a value less than 182 days.');
      return;
    }
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'departureDate' && newData.numberOfDays) {
        newData.arrivalDate = calculateArrivalDate(newData.departureDate, newData.numberOfDays);
      } else if (name === 'arrivalDate' && newData.departureDate) {
        newData.numberOfDays = calculateDays(newData.departureDate, newData.arrivalDate).toString();
      } else if (name === 'numberOfDays' && newData.departureDate) {
        newData.arrivalDate = calculateArrivalDate(newData.departureDate, newData.numberOfDays);
      }
      if (parseInt(newData.numberOfDays) > 182) {
        setError('Duration cannot exceed 182 days. Please adjust your dates.');
      } else {
        setError('');
      }
      return newData;
    });
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOption = e.target.value;
    setSelectedOption(newOption);
    if (lastApiResponse) {
      const data = lastApiResponse.MasterData;
      if (newOption === 'full') {
        setpaymentmode('Full Pay');
        setPremium(parseFloat(data.fullpay_amount || data.premium_amount));
        setagentcollected(parseFloat(data.fullpay_agentcollected || data.agentcollected));
      } else {
        setpaymentmode(data.paymentmode);
        setPremium(parseFloat(data.premium_amount));
        if (newOption === 'Upfront') {
          setagentcollected(parseFloat(data.upfront_agent_commission));
        } else {
          setagentcollected(parseFloat(data.agentcollected));
        }
      }
    }
  };

  const handleCalculatePremium = async (e: React.FormEvent) => {
    e.preventDefault();
    setLastApiResponse(null);
    setPremium(null);
    setagentcollected(null);
    setCommissionAgent(null);
    setPremiumWithoutGst(null);
    setPremiumGst(null);
    setError('');

    if (!formData.departureDate || !formData.arrivalDate || !formData.dateOfBirth || !formData.numberOfDays) {
      setError('Please fill in all required fields');
      return;
    }

    if (!walletStatus.eligibleProposal) {
      setShowEligibilityMessage(true);
      return;
    }

    setCalculating(true);
    try {
      const payload = {
        duration: parseInt(formData.numberOfDays),
        age_years: age.years,
        age_months: age.months,
        plan_amount: parseFloat(formData.planAmount),
        agentid: parseInt(displayData?.AgentId?.toString() || '0'),
        paymentmode: displayData.Paymentmode
      };

      const response = formData.geographicalCover === 'INCL'
        ? await calculatePremiumIncluding_bajaj(payload)
        : await calculatePremiumExcluding_bajaj(payload);

      if (response?.Status === 'Success' && response?.MasterData) {
        setLastApiResponse(response);
        if (response.MasterData.reliance_premium_amount) {
          setReliancePremiumAmount(parseFloat(response.MasterData.reliance_premium_amount));
          setPayout_Bajaj(parseFloat(response.MasterData.payout_bajaj));
        }
      } else {
        setError(response?.Message || 'Failed to calculate premium');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error calculating premium. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      departureDate: '',
      arrivalDate: '',
      numberOfDays: '',
      geographicalCover: 'INCL',
      dateOfBirth: '',
      planAmount: '50000',
      agentid: displayData?.AgentId || 0,
    });
    setPremium(null);
    setagentcollected(null);
    setpaymentmode(null);
    setCommissionAgent(null);
    setPremiumWithoutGst(null);
    setPremiumGst(null);
    setSelectedOption('');
    setError('');
    setLastApiResponse(null);
    setShowEligibilityMessage(false);
  };


  const handleWalletBajajClick = () => {
    // Store the enriched display data in localStorage
    localStorage.setItem('walletData', JSON.stringify(displayData));

    // Navigate to the wallet page with the enriched state
    navigate('/walletPage_bajaj', {
      state: {
        agentData: displayData,
        walletStatus: walletStatus
      }
    });
  };

  const goToCOIBajaj = () => {
    // Store the enriched display data in localStorage
    localStorage.setItem('walletData', JSON.stringify(displayData));

    // Navigate to the wallet page with the enriched state
    navigate('/GenerateCOI_bajaj', {
      state: {
        agentData: displayData,
        walletStatus: walletStatus
      }
    });
  };


  const gotoMISBajaj = () => {
    //const empId = displayData.id || displayData.UId;
    localStorage.setItem('walletData', JSON.stringify(displayData));

    if (displayData.Paymentmode === 'Upfront Commission') {
      navigate('/TDS_Proposal_bajaj', {
        state: {
          empid: '',
          agentData: displayData,
          userType: 'Agent',
          adminId: ''
        }
      });
    } else {
      navigate('/MIS_Proposal_bajaj', {
        state: {
          empid: '',
          agentData: displayData,
          userType: 'Agent',
          adminId: ''
        }
      });
    }
  }

  const handleProceedToProposal = () => {
    const radiobtn_selectedAmount = selectedOption === 'full' ? premium : agentcollected;
    const currentWalletAmount = parseFloat(displayData?.Wallet_Amount?.toString() || '0');

    if (radiobtn_selectedAmount !== null && radiobtn_selectedAmount > currentWalletAmount) {
      const shortfall = radiobtn_selectedAmount - currentWalletAmount;
      setError(`Insufficient wallet balance! Required: ₹${radiobtn_selectedAmount.toFixed(0)}, Available: ₹${currentWalletAmount.toFixed(0)}. You need ₹${shortfall.toFixed(0)} more to proceed.`);
      return;
    }
    setError('');

    const proposalData = {
      agentDetails: {
        AgentId: displayData.AgentId,
        Agent_Code: displayData.Agent_Code,
        FullName: displayData.FullName,
        EmailID: displayData.EmailID,
        MobileNumber: displayData.MobileNumber,
        Payout_Bajaj: Payout_Bajaj,
        Paymentmode: paymentmode
      },
      travelDetails: {
        departureDate: formData.departureDate,
        arrivalDate: formData.arrivalDate,
        numberOfDays: formData.numberOfDays,
        geographicalCover: formData.geographicalCover,
        NameofPlan: getNameOfPlan()
      },
      insuranceDetails: {
        dateOfBirth: formData.dateOfBirth,
        planAmount: formData.planAmount,
        premium: premium,
        bajaj_premium_amount: reliancePremiumAmount,
        agentCollection: agentcollected,
        radiobtn_selectedOption: selectedOption,
        radiobtn_selectedAmount: radiobtn_selectedAmount,
        selectedOption: selectedOption,
        commission_agent: commission_agent,
        premium_without_gst: premium_without_gst,
        premium_gst: premium_gst
      }
    };

    sessionStorage.setItem('proposalData', JSON.stringify(proposalData));
    navigate('/BajajTravelProposal');
  };

  // -- 5. STYLES (Inline specific to radio buttons) --
  const radioStyles = {
    radioGroup: { display: 'flex', gap: '20px', margin: '15px 0', justifyContent: 'center' },
    radioLabel: { display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#f9fafb' },
    radioLabelSelected: { display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px 16px', border: '2px solid #2563eb', borderRadius: '6px', backgroundColor: '#eff6ff' },
    radioInput: { marginRight: '8px' },
    radioText: { fontWeight: '500', fontSize: '14px' }
  };

  return (
    <div className="dashboard-wrapper">
      {/* HEADER */}
      <header className="top-header">
        <div className="header-content">
          <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
          </div>
          <div className="d-flex justify-content-center py-4">
            <div className="logo d-flex align-items-center w-auto">
              <span className="company-name d-none d-lg-block" style={{ fontSize: '24px', fontWeight: 'bold' }}>Travel Assistance Service</span>
            </div>
          </div>
          <nav className="nav-link" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>Home</span>
            <span style={{ cursor: 'pointer' }}>Contact Us</span>
            <span style={{ cursor: 'pointer' }}>About Us</span>
            <button autoFocus onClick={handleLogout} className="logout-button">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content-b">
        {/* WELCOME INFO CARD */}
        <div className="user-info-card-b">
          <div className="card-header-b" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="welcome-title-b">
              Welcome, {displayData.FullName || displayData.name}
            </h2>
            <button onClick={() => navigate('/dashboard')} className="back-to-selection-btn-b" style={{ position: 'relative', top: '0', right: '0' }}>
              <ArrowLeftCircle size={18} />
              <span>Back To Plan Selection</span>
            </button>
          </div>

          <div className="employee-info" style={{ padding: '20px' }}>
            <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="info-item" style={{ display: 'flex', gap: '30px' }}>
                <span className="info-label">
                  <UserCircle className="w-5 h-5 mr-2" style={{ color: '#ef4444' }} />
                  <span className="font-weight" style={{ color: '#ef4444', fontWeight: 'bold' }}>Agent CODE</span>
                  <span className="info-value" style={{ marginLeft: '10px', color: '#6b7280' }}>{displayData.Agent_Code}</span>
                </span>
                <span className="info-label">
                  <Mail className="w-5 h-5 mr-2" style={{ color: '#ef4444' }} />
                  <span className="font-weight" style={{ color: '#ef4444', fontWeight: 'bold' }}>Email</span>
                  <span className="info-value" style={{ marginLeft: '10px', color: '#6b7280' }}>{displayData.email || displayData.EmailID}</span>
                </span>
              </div>

              <div className="wallet-button-container" style={{ display: 'flex', gap: '10px' }}>
                <button onClick={goToCOIBajaj} className="Premium-btn" style={{ backgroundColor: '#059669', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px' }}>
                  Bajaj View COI
                </button>
                <div onClick={handleWalletBajajClick} className="wallet-containerA" style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#F59E0B', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                  <Wallet size={18} color="white" />
                  <span style={{ color: 'white', fontWeight: 'bold' }}>Bajaj Wallet</span>
                </div>
                <button onClick={gotoMISBajaj} className="Premium-btn-MIS" style={{ backgroundColor: '#2563EB', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px' }}>
                  Bajaj MIS Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PREMIUM CALCULATOR CARD */}
        <div style={{ maxWidth: '100%', margin: '0 auto', padding: '30px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px', textAlign: 'center' }}>Travel Insurance Premium Calculator</h2>

          {showEligibilityMessage && (
            <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '15px', borderRadius: '5px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} />
              <div>
                <p style={{ fontWeight: 'bold', margin: 0 }}>Wallet Not Eligible</p>
                <p style={{ margin: '5px 0 0 0' }}>Your wallet needs to be updated before calculating premium.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleCalculatePremium}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563' }}>Departure Date</label>
                <input type="date" name="departureDate" min={new Date().toISOString().split('T')[0]} value={formData.departureDate} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563' }}>Days/Duration</label>
                <input type="number" name="numberOfDays" value={formData.numberOfDays} onChange={handleChange} min="1" max="182" style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563' }}>Arrival Date</label>
                <input type="date" name="arrivalDate" min={formData.departureDate || new Date().toISOString().split('T')[0]} value={formData.arrivalDate} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563' }}>Geographical Cover</label>
                <select name="geographicalCover" value={formData.geographicalCover} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }} required>
                  <option value="INCL">TRAVEL INCL USA & CANADA</option>
                  <option value="EXCL">TRAVEL EXCL USA & CANADA</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563' }}>Date of Birth</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} max={getMaxDateOfBirth()} min={getMinDateOfBirth()} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563' }}>Available Plans</label>
                <select name="planAmount" value={formData.planAmount} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }} required>
                  {plans.map(plan => (<option key={plan.value} value={plan.value}>{plan.label}</option>))}
                </select>
              </div>
            </div>

            {error && (<div style={{ color: '#dc2626', padding: '10px', backgroundColor: '#fee2e2', borderRadius: '4px', marginBottom: '15px', textAlign: 'center' }}>{error}</div>)}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className='Premium-btn' type="submit" disabled={calculating}>
                {calculating ? 'Calculating...' : 'Calculate Premium'}
              </button>
              <button className='apply-btn-emp' type="button" onClick={handleCancel}>Cancel</button>
            </div>

            {lastApiResponse && (
              <div style={{ padding: '20px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', marginTop: '30px' }}>
                <div style={radioStyles.radioGroup}>
                  {availableOptions.has('full') && (
                    <label style={selectedOption === 'full' ? radioStyles.radioLabelSelected : radioStyles.radioLabel}>
                      <input type="radio" name="paymentOption" value="full" checked={selectedOption === 'full'} onChange={handleRadioChange} style={radioStyles.radioInput} />
                      <span style={radioStyles.radioText}>Full Pay</span>
                    </label>
                  )}
                  {availableOptions.has('discount') && (
                    <label style={selectedOption === 'discount' ? radioStyles.radioLabelSelected : radioStyles.radioLabel}>
                      <input type="radio" name="paymentOption" value="discount" checked={selectedOption === 'discount'} onChange={handleRadioChange} style={radioStyles.radioInput} />
                      <span style={radioStyles.radioText}>Discount</span>
                    </label>
                  )}
                  {availableOptions.has('Upfront') && (
                    <label style={selectedOption === 'Upfront' ? radioStyles.radioLabelSelected : radioStyles.radioLabel}>
                      <input type="radio" name="paymentOption" value="Upfront" checked={selectedOption === 'Upfront'} onChange={handleRadioChange} style={radioStyles.radioInput} />
                      <span style={radioStyles.radioText}>Upfront Commission</span>
                    </label>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '20px', flexWrap: 'wrap', textAlign: 'center' }}>
                  {premium !== null && (
                    <div style={{ padding: '15px 25px', borderRadius: '8px', backgroundColor: '#ecfdf5', border: '2px solid #10b981' }}>
                      <span style={{ fontSize: '18px', fontWeight: '500', color: '#047857' }}>Assistance charges (Incl GST)<br /><b>₹{premium.toFixed(0)}</b></span>
                    </div>
                  )}
                  {(selectedOption === 'full' || selectedOption === 'discount') && agentcollected !== null && (
                    <div style={{ padding: '15px 25px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '2px solid #ef4444' }}>
                      <span style={{ fontSize: '18px', fontWeight: '600', color: '#b91c1c' }}>To be collected from Agent<br /><b>₹{agentcollected.toFixed(0)}</b></span>
                    </div>
                  )}
                  {selectedOption === 'Upfront' && agentcollected !== null && (
                    <div style={{ padding: '15px 25px', borderRadius: '8px', backgroundColor: '#f5f3ff', border: '2px solid #7c3aed' }}>
                      <span style={{ fontSize: '18px', fontWeight: '600', color: '#6d28d9' }}>Agent to be collected<br /><b>₹{agentcollected.toFixed(0)}</b></span>
                    </div>
                  )}
                </div>

                <div style={{ paddingTop: '30px', display: 'flex', justifyContent: 'center' }}>
                  {walletStatus && !walletStatus.eligibleProposal ? (
                    <div style={{ textAlign: 'center' }}>
                      <button disabled={true} style={{ padding: '12px 24px', backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: '6px', cursor: 'not-allowed', fontWeight: '500', opacity: 0.7 }}>
                        Proceed to Proposal
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px', color: '#ef4444', fontSize: '14px' }}>
                        <AlertTriangle size={16} style={{ marginRight: '5px' }} />
                        <span>Wallet update required. Please update your wallet.</span>
                      </div>
                    </div>
                  ) : (
                    <button onClick={handleProceedToProposal} style={{ padding: '12px 24px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '16px' }}>
                      Proceed to Proposal
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      </main>

      <footer className="footer" style={{ backgroundColor: '#6c63ff', color: 'white', padding: '15px', textAlign: 'center' }}>
        <p style={{ margin: 0 }}>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
      </footer>
    </div>
  );
};

export default BajajTravel;