import React, { useState, useEffect } from 'react';
import {
  UserCircle, Calendar, Wallet,
  AlertTriangle, ArrowLeftCircle, User, LogOut, CheckCircle, Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../services/auth';
import { saveMasterPlan_calc, saveMasterPlan_ISSUE_POLICY } from '../../../services/api';
import './BajajTravel.css';
import logo from '../../../../src/assets/img/TravelAssist.webp';

// --- REDUX IMPORT ---
import { useAgentSelector } from '../../../redux/Agent/hooks';

// --- INTERFACES ---

interface Option {
  value: string;
  label: string;
}

interface InputFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  required?: boolean;
  options?: Option[];
  disabled?: boolean;
}

interface FormData {
  StartDate: string;
  EndDate: string;
  NoOfDays: string | number;
  Plan: string;
  GeographicalCover: string;
  CountryName: string;
  ProposerTitle: string;
  ProposerFirstName: string;
  ProposerLastName: string;
  ProposerDOB: string;
  ProposerEmail: string;
  ProposerMobile: string;
  ProposerAddress: string;
  ProposerCity: string;
  ProposerState: string;
  ProposerPincode: string;
  ProposerPassport: string;
  ProposerGender: string;
  TravellerTitle: string;
  TravellerFirstName: string;
  TravellerLastName: string;
  TravellerDOB: string;
  TravellerGender: string;
  TravellerPassport: string;
  TravellerRelation: string;
  NomineeName: string;
  NomineeRelation: string;
}

interface PremiumResult {
  pQuoteNo: string;
  pPremiumDtls?: {
    finalPremium: string | number;
  };
}

interface PolicyResult {
  PolicyNo: string;
  StartDate: string;
  EndDate: string;
  BasePremium: string | number;
  FinalPremium: string | number;
  AgentId: string;
}

interface DisplayData {
  AgentId?: string | number;
  agentId?: string | number;
  FullName?: string;
  name?: string;
  Agent_Code?: string;
  EmailID?: string;
  email?: string;
}

// --- HELPER COMPONENTS ---

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  options = [],
  disabled = false
}) => (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
      {label} {required && <span style={{ color: 'red' }}>*</span>}
    </label>
    {type === 'select' ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px',
          backgroundColor: disabled ? '#f3f4f6' : 'white'
        }}
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px',
          backgroundColor: disabled ? '#f3f4f6' : 'white'
        }}
      />
    )}
  </div>
);

// --- MAIN COMPONENT ---

const BajajTravel = () => {
  const navigate = useNavigate();

  // -- 1. STATE MANAGEMENT & REDUX --

  // Retrieve data from the Agent Slice
  const agentFromRedux = useAgentSelector((state) => state.agentDashboard);

  // Initialize displayData: Prioritize Redux, fallback to localStorage
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
      };
    }
    // Fallback logic
    const stored = localStorage.getItem('userProfile');
    return stored ? JSON.parse(stored) : {};
  });

  const [calculating, setCalculating] = useState<boolean>(false);
  const [issuing, setIssuing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [premiumResult, setPremiumResult] = useState<PremiumResult | null>(null);
  const [policyResult, setPolicyResult] = useState<PolicyResult | null>(null);

  // Form State
  const [formData, setFormData] = useState<FormData>({
    StartDate: '',
    EndDate: '',
    NoOfDays: '',
    Plan: 'TPHGLD',
    GeographicalCover: 'Worldwide Including USA and Canada',
    CountryName: '',
    ProposerTitle: 'Mr',
    ProposerFirstName: '',
    ProposerLastName: '',
    ProposerDOB: '',
    ProposerEmail: '',
    ProposerMobile: '',
    ProposerAddress: '',
    ProposerCity: '',
    ProposerState: '',
    ProposerPincode: '',
    ProposerPassport: '',
    ProposerGender: 'M',
    TravellerTitle: 'Mr',
    TravellerFirstName: '',
    TravellerLastName: '',
    TravellerDOB: '',
    TravellerGender: 'M',
    TravellerPassport: '',
    TravellerRelation: 'SELF',
    NomineeName: '',
    NomineeRelation: ''
  });

  // -- 2. EFFECTS --

  useEffect(() => {
    if (formData.StartDate && formData.EndDate) {
      const start = new Date(formData.StartDate);
      const end = new Date(formData.EndDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays > 0) {
        setFormData(prev => ({ ...prev, NoOfDays: diffDays }));
      }
    }
  }, [formData.StartDate, formData.EndDate]);

  // -- 3. HANDLERS --

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    if (premiumResult) setPremiumResult(null);
    if (policyResult) setPolicyResult(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    logout();
    navigate('/login');
  };

  const validateForm = (): string | null => {
    if (!formData.StartDate || !formData.EndDate || !formData.CountryName) return "Travel dates and Country are required.";
    if (!formData.ProposerFirstName || !formData.ProposerMobile || !formData.ProposerEmail) return "Proposer basic details are required.";
    if (!formData.TravellerFirstName || !formData.TravellerDOB) return "Traveller details are required.";
    return null;
  };

  const formatDateForApi = (dateStr: string): string => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const buildPayload = () => {
    return {
      AgentId: displayData.AgentId || displayData.agentId,
      StartDate: formatDateForApi(formData.StartDate),
      EndDate: formatDateForApi(formData.EndDate),
      JourneyFromDate: formatDateForApi(formData.StartDate),
      JourneyToDate: formatDateForApi(formData.EndDate),
      NoOfDays: formData.NoOfDays,
      Plan: formData.Plan,
      GeographicalCover: formData.GeographicalCover,
      CountryName: formData.CountryName,
      ProposerDetails: {
        beforeTitle: formData.ProposerTitle,
        firstName: formData.ProposerFirstName,
        LastName: formData.ProposerLastName,
        dateOfBirth: formatDateForApi(formData.ProposerDOB),
        emailId: formData.ProposerEmail,
        mobileNumber: formData.ProposerMobile,
        gender: formData.ProposerGender,
        Address: formData.ProposerAddress,
        City: formData.ProposerCity,
        State: formData.ProposerState,
        Pincode: formData.ProposerPincode,
        passportNumber: formData.ProposerPassport
      },
      TravellerDetails: [{
        beforeTitle: formData.TravellerTitle,
        firstName: formData.TravellerFirstName,
        LastName: formData.TravellerLastName,
        dateOfBirth: formatDateForApi(formData.TravellerDOB),
        gender: formData.TravellerGender,
        passportNumber: formData.TravellerPassport,
        relationWithProposer: formData.TravellerRelation,
        nomineeName: formData.NomineeName,
        nomineeRelation: formData.NomineeRelation,
        trvEmailId: formData.ProposerEmail,
        trvMobileNumber: formData.ProposerMobile,
        anyPreExistingDisease: "No"
      }],
      TripType: {
        groupName: "Yes",
        natureOfGroup: "Yes",
        typeOfTour: "No",
        multipleCity: "No"
      }
    };
  };

  // --- Step 1: Calculate Premium ---
  const calculatePremium = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setCalculating(true);
    setError('');
    setPremiumResult(null);
    setPolicyResult(null);

    try {
      const payload = buildPayload();
      const response = await saveMasterPlan_calc(payload);

      if (response.Status === "Success") {
        setPremiumResult(response.MasterData as PremiumResult);
      } else {
        setError(response.Message || "Failed to calculate premium.");
      }

    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.Message || err.message || "Server error while calculating premium.";
      setError(msg);
    } finally {
      setCalculating(false);
    }
  };

  // --- Step 2: Issue Policy ---
  const handleProceed = async () => {
    if (!premiumResult?.pQuoteNo) {
      setError("Quote number is missing. Please recalculate premium.");
      return;
    }

    setIssuing(true);
    setError('');

    try {
      const payload = {
        ...buildPayload(),
        QuoteNo: premiumResult.pQuoteNo
      };

      const response = await saveMasterPlan_ISSUE_POLICY(payload);

      if (response.Status === "Success") {
        setPolicyResult(response.MasterData as PolicyResult);
        setPremiumResult(null);
      } else {
        setError(response.Message || "Failed to issue policy.");
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.Message || err.message || "Server error while issuing policy.";
      setError(msg);
    } finally {
      setIssuing(false);
    }
  };

  // -- 4. UI RENDER --
  return (
    <>
      <div className="dashboard-wrapper">
        {/* HEADER */}
        <header className="top-header">
          <div className="header-content">
            <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
            <div className="d-flex justify-content-center py-4">
              <div className="logo d-flex align-items-center w-auto">
                <span className="d-none d-lg-block">Travel Assistance Service</span>
              </div>
            </div>
            <nav className="nav-link">
              <button autoFocus onClick={handleLogout} className="btn btn-danger">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </button>
            </nav>
          </div>
        </header>

        <main className="main-content-b">
        
        {/* WELCOME CARD */}
        <div className="user-info-card-b">
           <div className="card-header-b">
            <h2 className="welcome-title-b">
              Welcome, {displayData.FullName || displayData.name}
            </h2>
            
            <button onClick={() => navigate('/dashboard')} className="back-to-selection-btn-b">
              <ArrowLeftCircle size={18} />
              <span>Back To Plan Selection</span>
            </button>
           </div>
           
           <div className="employee-info">
             <div className="info-row">
               <div className="info-item">
                 <span className="info-label spaced5">
                   <UserCircle className="w-4 h-4 inline-block mr-2 spaced5" />
                   <span className="font-weight">Agent CODE</span>
                 </span>
                 <span className="info-value spaced10">{displayData.Agent_Code}</span>

                 <span className="info-label spaced10">
                   <Mail className="w-4 h-4 inline-block mr-2 spaced5" />
                   <span className="font-weight">Email</span>
                 </span>
                 <span className="info-value">{displayData.email || displayData.EmailID}</span>
               </div>
               
               <div className="wallet-button-container" style={{display: 'flex', gap: '10px', marginLeft: 'auto'}}>
                  <div className="wallet-containerA" style={{display:'flex', alignItems:'center', gap:'5px', cursor:'pointer'}}>
                    <div className="wallet-icon-wrapper">
                      <Wallet className="wallet-iconA" size={18} />
                    </div>
                    <span className="wallet-textA">Wallet</span>
                  </div>
                  <button className='Premium-btn-MIS' style={{background:'#6c63ff', color:'white', border:'none', padding:'5px 15px', borderRadius:'4px'}}>
                    MIS Report
                  </button>
               </div>
             </div>
           </div>
        </div>

        {/* MAIN FORM / CALCULATOR CARD */}
        <div className="card" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '20px', color: '#4b5563', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            Bajaj Travel Proposal Form
          </h3>

          {/* 1. Travel Details Section */}
          <h4 style={{ color: '#6c63ff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={18} /> Trip Details
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <InputField label="Start Date" name="StartDate" type="date" value={formData.StartDate} onChange={handleInputChange} required />
            <InputField label="End Date" name="EndDate" type="date" value={formData.EndDate} onChange={handleInputChange} required />
            <InputField label="Duration (Days)" name="NoOfDays" value={formData.NoOfDays} onChange={handleInputChange} disabled />
            <InputField label="Country Visiting" name="CountryName" value={formData.CountryName} onChange={handleInputChange} required />
            <InputField label="Plan" name="Plan" value={formData.Plan} onChange={handleInputChange} disabled />
            <InputField
              label="Geographical Cover"
              name="GeographicalCover"
              type="select"
              value={formData.GeographicalCover}
              onChange={handleInputChange}
              options={[
                { value: 'Worldwide Including USA and Canada', label: 'Worldwide Including USA and Canada' },
                { value: 'Worldwide Excluding USA and Canada', label: 'Worldwide Excluding USA and Canada' }
              ]}
            />
          </div>

          {/* 2. Proposer Details Section */}
          <h4 style={{ color: '#6c63ff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCircle size={18} /> Proposer Details
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <InputField label="First Name" name="ProposerFirstName" value={formData.ProposerFirstName} onChange={handleInputChange} required />
            <InputField label="Last Name" name="ProposerLastName" value={formData.ProposerLastName} onChange={handleInputChange} />
            <InputField label="Date of Birth" name="ProposerDOB" type="date" value={formData.ProposerDOB} onChange={handleInputChange} required />
            <InputField label="Mobile" name="ProposerMobile" value={formData.ProposerMobile} onChange={handleInputChange} required />
            <InputField label="Email" name="ProposerEmail" type="email" value={formData.ProposerEmail} onChange={handleInputChange} required />
            <InputField label="Passport No" name="ProposerPassport" value={formData.ProposerPassport} onChange={handleInputChange} />
            <InputField label="Address" name="ProposerAddress" value={formData.ProposerAddress} onChange={handleInputChange} />
            <InputField label="City" name="ProposerCity" value={formData.ProposerCity} onChange={handleInputChange} />
            <InputField label="Pincode" name="ProposerPincode" value={formData.ProposerPincode} onChange={handleInputChange} />
          </div>

          {/* 3. Traveller Details Section */}
          <h4 style={{ color: '#6c63ff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={18} /> Traveller Details
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <InputField label="First Name" name="TravellerFirstName" value={formData.TravellerFirstName} onChange={handleInputChange} required />
            <InputField label="Last Name" name="TravellerLastName" value={formData.TravellerLastName} onChange={handleInputChange} />
            <InputField label="Date of Birth" name="TravellerDOB" type="date" value={formData.TravellerDOB} onChange={handleInputChange} required />
            <InputField label="Passport No" name="TravellerPassport" value={formData.TravellerPassport} onChange={handleInputChange} required />
            <InputField label="Gender" name="TravellerGender" type="select" value={formData.TravellerGender} onChange={handleInputChange} options={[{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }]} />
            <InputField label="Relation" name="TravellerRelation" type="select" value={formData.TravellerRelation} onChange={handleInputChange} options={[{ value: 'SELF', label: 'Self' }, { value: 'SPOUSE', label: 'Spouse' }, { value: 'CHILD', label: 'Child' }]} />
            <InputField label="Nominee Name" name="NomineeName" value={formData.NomineeName} onChange={handleInputChange} />
            <InputField label="Nominee Relation" name="NomineeRelation" value={formData.NomineeRelation} onChange={handleInputChange} />
          </div>

          {/* ACTION BUTTONS (Calculate) */}
          {!premiumResult && !policyResult && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button
                onClick={calculatePremium}
                disabled={calculating}
                className="Premium-btn"
                style={{ minWidth: '200px', padding: '12px', fontSize: '16px' }}
              >
                {calculating ? 'Calculating...' : 'Calculate Premium'}
              </button>
            </div>
          )}

          {/* ERROR DISPLAY */}
          {error && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* RESULT DISPLAY (Calculated Premium) */}
          {premiumResult && (
            <div style={{ marginTop: '30px', padding: '25px', background: '#f0fdf4', border: '1px solid #10b981', borderRadius: '8px', animation: 'fadeIn 0.5s' }}>
              <h3 style={{ textAlign: 'center', color: '#047857', marginBottom: '20px' }}>Premium Calculated Successfully</h3>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>

                {/* Quote Number Box */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center', minWidth: '200px' }}>
                  <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>Quote Number</p>
                  <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: 'bold', color: '#374151' }}>{premiumResult.pQuoteNo}</p>
                </div>

                {/* Final Premium Box */}
                <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '8px', border: '2px solid #10b981', textAlign: 'center', minWidth: '200px' }}>
                  <p style={{ margin: '0', fontSize: '14px', color: '#047857' }}>Final Premium (Incl. GST)</p>
                  <p style={{ margin: '5px 0 0', fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                    ₹ {premiumResult.pPremiumDtls?.finalPremium}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '30px', textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => setPremiumResult(null)} // Cancel/Recalculate
                  style={{ padding: '12px 30px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '16px' }}
                >
                  Recalculate
                </button>

                <button
                  onClick={handleProceed}
                  disabled={issuing}
                  style={{ padding: '12px 30px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '16px' }}
                >
                  {issuing ? 'Issuing Policy...' : 'Proceed to Issue Policy'}
                </button>
              </div>
            </div>
          )}

          {/* FINAL POLICY RESULT */}
          {policyResult && (
            <div style={{ marginTop: '30px', padding: '25px', background: '#f0f9ff', border: '1px solid #0284c7', borderRadius: '8px', animation: 'fadeIn 0.5s', textAlign: 'center' }}>
              <CheckCircle size={48} color="#0284c7" style={{ margin: '0 auto 15px' }} />
              <h2 style={{ color: '#0369a1', marginBottom: '10px' }}>Policy Issued Successfully!</h2>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>Your travel policy has been generated.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', textAlign: 'left', background: 'white', padding: '20px', borderRadius: '8px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>Policy Number</span>
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{policyResult.PolicyNo}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>Coverage Period</span>
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{policyResult.StartDate} to {policyResult.EndDate}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>Premium Paid</span>
                  <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#059669' }}>₹ {policyResult.FinalPremium}</span>
                </div>
              </div>

              <div style={{ marginTop: '30px' }}>
                <button
                  onClick={() => window.location.reload()}
                  style={{ padding: '10px 20px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Create Another Policy
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Interstellar   Services Pvt. Ltd., All rights reserved</p>
      </footer>
    </div>
    </>
  );
};

export default BajajTravel;
       