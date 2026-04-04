import React, { useState, useEffect } from 'react';
import {
  UserCircle, Calendar, Wallet,
  AlertTriangle, ArrowLeftCircle, User, LogOut, CheckCircle, Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../services/auth';
import { saveMasterPlan_calc } from '../../../services/api';
import './BajajTravel.css';
import logo from '../../../../src/assets/img/TravelAssist.webp';

// --- REDUX IMPORT ---
import { useAgentSelector } from '../../../redux/Agent/hooks';

// --- CONSTANTS FOR DROPDOWNS ---
const INDIAN_STATES = [
  "ANDAMAN AND NICOBAR ISLANDS", "ANDHRA PRADESH", "ARUNACHAL PRADESH", "ASSAM",
  "BIHAR", "CHANDIGARH", "CHHATTISGARH", "DADRA AND NAGAR HAVELI", "DAMAN AND DIU",
  "DELHI", "GOA", "GUJARAT", "HARYANA", "HIMACHAL PRADESH", "JAMMU AND KASHMIR",
  "JHARKHAND", "KARNATAKA", "KERALA", "LAKSHADWEEP", "MADHYA PRADESH", "MAHARASHTRA",
  "MANIPUR", "MEGHALAYA", "MIZORAM", "NAGALAND", "ODISHA", "PUDUCHERRY", "PUNJAB",
  "RAJASTHAN", "SIKKIM", "TAMIL NADU", "TELANGANA", "TRIPURA", "UTTAR PRADESH",
  "UTTARAKHAND", "WEST BENGAL"
].map(state => ({ value: state, label: state }));

const NOMINEE_RELATIONS = [
  { value: "", label: "Select Relation" },
  { value: "BROTHER", label: "BROTHER" },
  { value: "SISTER", label: "SISTER" },
  { value: "SPOUSE", label: "SPOUSE" },
  { value: "SON", label: "SON" },
  { value: "DAUGHTER", label: "DAUGHTER" },
  { value: "FATHER", label: "FATHER" },
  { value: "MOTHER", label: "MOTHER" },
  { value: "HUSBAND", label: "HUSBAND" },
  { value: "WIFE", label: "WIFE" }
];

const TITLE_OPTIONS = [
  { value: "Mr", label: "Mr." },
  { value: "Mrs", label: "Mrs." },
  { value: "Miss", label: "Miss" },
  { value: "Dr", label: "Dr." },
  { value: "Prof", label: "Prof." }
];

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
  error?: string;
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
  ProposerMiddleName: string;
  ProposerLastName: string;
  ProposerDOB: string;
  ProposerEmail: string;
  ProposerMobile: string;
  ProposerAddress: string;
  ProposerCity: string;
  ProposerState: string;
  ProposerPincode: string;
  ProposerPassport: string;
  ProposerGSTIN: string;
  ProposerGender: string;
  NomineeName: string;
  NomineeRelation: string;

  TravellerTitle: string;
  TravellerFirstName: string;
  TravellerMiddleName: string;
  TravellerLastName: string;
  TravellerDOB: string;
  TravellerGender: string;
  TravellerEmail: string;
  TravellerMobile: string;
  TravellerPassport: string;
  TravellerRelation: string;
  TravelleranyPreExistingDisease: string;
}

interface PremiumResult {
  pQuoteNo: string;
  PolicyNo: string;
  FinalPremium: number | string;
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
  Payout?: string;
}

// --- HELPER COMPONENTS ---
const InputField: React.FC<InputFieldProps> = ({
  label, name, value, onChange, type = 'text', required = false, options = [], disabled = false, error
}) => (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#4b5563', fontSize: '14px' }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    {type === 'select' ? (
      <select
        name={name} value={value} onChange={onChange} disabled={disabled}
        style={{
          width: '100%', padding: '10px 12px', border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          borderRadius: '6px', fontSize: '14px', backgroundColor: disabled ? '#f3f4f6' : 'white',
          color: '#1f2937', outline: 'none'
        }}
      >
        {options.map((opt, idx) => (<option key={idx} value={opt.value}>{opt.label}</option>))}
      </select>
    ) : (
      <input
        type={type} name={name} value={value} onChange={onChange} disabled={disabled}
        style={{
          width: '100%', padding: '10px 12px', border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          borderRadius: '6px', fontSize: '14px', backgroundColor: disabled ? '#f3f4f6' : 'white',
          color: '#1f2937', outline: 'none'
        }}
      />
    )}
    {error && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{error}</span>}
  </div>
);

const TitleSelect: React.FC<{
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}> = ({ name, value, onChange }) => (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#4b5563', fontSize: '14px' }}>
      Title
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      style={{
        width: '100%', padding: '10px 12px',
        border: '1px solid #d1d5db', borderRadius: '6px',
        fontSize: '14px', backgroundColor: 'white',
        color: '#1f2937', outline: 'none', cursor: 'pointer'
      }}
    >
      {TITLE_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const FullScreenLoader = ({ message = "Processing, please wait..." }: { message?: string }) => (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, flexDirection: 'column' }}>
    <div style={{ width: '50px', height: '50px', border: '5px solid #f3f3f3', borderTop: '5px solid #6c63ff', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
    <h3 style={{ color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>{message}</h3>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);
// --- MAIN COMPONENT ---
const BajajTravelProposal = () => {
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
        Payout: agentFromRedux.Payout
      };
    }
    const stored = localStorage.getItem('userProfile');
    return stored ? JSON.parse(stored) : {};
  });

  const [calculating, setCalculating] = useState<boolean>(false);
  const [issuing, setIssuing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [premiumResult, setPremiumResult] = useState<PremiumResult | null>(null);
  const [policyResult, setPolicyResult] = useState<PolicyResult | null>(null);
  const [proposalData, setProposalData] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState<FormData>({
    StartDate: '', EndDate: '', NoOfDays: '', Plan: 'TPHGLD',
    GeographicalCover: 'Worldwide Including USA and Canada', CountryName: '',
    ProposerTitle: 'Mr', ProposerFirstName: '', ProposerMiddleName: '', ProposerLastName: '', ProposerDOB: '',
    ProposerEmail: '', ProposerMobile: '', ProposerAddress: '', ProposerCity: '',
    ProposerState: '', ProposerPincode: '', ProposerPassport: '',
    ProposerGSTIN: '24AADCI7698J1Z0',     // Hardcoded Default
    ProposerGender: 'M',
    NomineeName: '', NomineeRelation: '',
    TravellerTitle: 'Mr', TravellerFirstName: '', TravellerMiddleName: '', TravellerLastName: '', TravellerDOB: '',
    TravellerGender: 'M', TravellerPassport: '', TravellerRelation: 'SELF',
    TravellerEmail: '', TravellerMobile: '',
    TravelleranyPreExistingDisease: 'No',


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

  useEffect(() => {
    const storedData = sessionStorage.getItem('proposalData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setProposalData(parsedData);

      setFormData(prev => ({
        ...prev,
        StartDate: parsedData.travelDetails.departureDate,
        EndDate: parsedData.travelDetails.arrivalDate,
        NoOfDays: parsedData.travelDetails.numberOfDays,
        Plan: 'TPHGLD',
        GeographicalCover: parsedData.travelDetails.geographicalCover === 'INCL'
          ? 'Worldwide Including USA and Canada'
          : 'Worldwide Excluding USA and Canada',
        ProposerDOB: parsedData.insuranceDetails.dateOfBirth,
        TravellerDOB: parsedData.insuranceDetails.dateOfBirth
      }));
    }
  }, []);

  // -- 3. VALIDATION LOGIC --
  const validateField = (name: string, value: string) => {
    let errorMsg = '';
    switch (name) {
     case 'ProposerMobile':
      case 'TravellerMobile':
        if (value && !/^[6-9][0-9]{9}$/.test(value)) {
           errorMsg = 'Must be 10 digits and start with 6, 7, 8, or 9';
        }
        break;
      case 'ProposerEmail':
      case 'TravellerEmail':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errorMsg = 'Invalid email format';
        break;
      case 'ProposerPassport':
      case 'TravellerPassport':
        if (value && !/^[A-Z][0-9]{7}$/.test(value.toUpperCase())) errorMsg = 'Invalid Passport (e.g. Z1234567)';
        break;
      case 'ProposerPincode':
        if (value && !/^[0-9]{6}$/.test(value)) errorMsg = 'Must be exactly 6 digits';
        break;
      default:
        break;
    }
    return errorMsg;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    // Auto-uppercase specific fields
    if (name === 'ProposerCity' || name === 'ProposerPassport' || name === 'TravellerPassport') {
      value = value.toUpperCase();
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate the specific field dynamically
    const fieldError = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: fieldError }));

    // Clear main API error on typing
    setApiError('');
    if (premiumResult) setPremiumResult(null);
    if (policyResult) setPolicyResult(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    logout();
    navigate('/login');
  };

  const validateForm = (): boolean => {
    // Check missing fields
    if (!formData.StartDate || !formData.EndDate || !formData.CountryName) {
      setApiError("Travel dates and Country are required.");
      return false;
    }
    if (!formData.ProposerFirstName || !formData.ProposerMobile || !formData.ProposerEmail || !formData.ProposerState) {
      setApiError("Please fill all required Proposer details including State.");
      return false;
    }
    if (!formData.TravellerFirstName || !formData.TravellerDOB || !formData.TravellerPassport) {
      setApiError("Please fill all required Traveller details including Passport.");
      return false;
    }
    if (!formData.NomineeName || !formData.NomineeRelation) {
      setApiError("Please fill Nominee Details and Relationship.");
      return false;
    }

    // Check if any specific field has an outstanding regex error
    const hasErrors = Object.values(errors).some(err => err !== '');
    if (hasErrors) {
      setApiError("Please fix the validation errors in the form before submitting.");
      return false;
    }

    return true;
  };

  const formatDateForApi = (dateStr: string): string => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const buildPayload = () => {
    const insDetails = proposalData?.insuranceDetails || {};
    const agentDetails = proposalData?.agentDetails || {};

    return {
      AgentId: displayData.AgentId || displayData.agentId,
      StartDate: formatDateForApi(formData.StartDate),
      EndDate: formatDateForApi(formData.EndDate),
      JourneyFromDate: formatDateForApi(formData.StartDate),
      JourneyToDate: formatDateForApi(formData.EndDate),
      NoOfDays: String(formData.NoOfDays),
      Plan: formData.Plan,
      GeographicalCover: formData.GeographicalCover,
      CountryName: formData.CountryName,

      planAmount: insDetails.planAmount || 0,
      premium: insDetails.premium || 0,
      bajaj_premium_amount: insDetails.bajaj_premium_amount || 0,

      agentCollection: insDetails.agentCollection || 0,
      radiobtn_selectedOption: insDetails.radiobtn_selectedOption || "",
      radiobtn_selectedAmount: insDetails.radiobtn_selectedAmount || 0,
      Payout_Bajaj: agentDetails.Payout_Bajaj,

      // Included new parameters here
      commission_agent: insDetails.commission_agent || 0,
      premium_without_gst: insDetails.premium_without_gst || 0,
      premium_gst: insDetails.premium_gst || 0,

      ProposerDetails: {
        beforeTitle: formData.ProposerTitle,
        firstName: formData.ProposerFirstName,
        middleName: formData.ProposerMiddleName, // Passed accurately
        LastName: formData.ProposerLastName,
        dateOfBirth: formatDateForApi(formData.ProposerDOB),
        GSTINNumber: formData.ProposerGSTIN, // Passed default value
        PANNumber: "",
        Pincode: formData.ProposerPincode,
        State: formData.ProposerState,
        City: formData.ProposerCity,
        Area: "",
        Address: formData.ProposerAddress,
        mobileNumber: formData.ProposerMobile,
        emailId: formData.ProposerEmail,
        passportNumber: formData.ProposerPassport,
        gender: formData.ProposerGender,
        nomineeName: formData.NomineeName,
        nomineeRelation: formData.NomineeRelation
      },
      TravellerDetails: [{
        beforeTitle: formData.TravellerTitle,
        gender: formData.TravellerGender,
        firstName: formData.TravellerFirstName,
        middleName: formData.TravellerMiddleName, // Passed accurately
        LastName: formData.TravellerLastName,
        dateOfBirth: formatDateForApi(formData.TravellerDOB),
        relationWithProposer: formData.TravellerRelation,
        passportNumber: formData.TravellerPassport,
        nomineeName: formData.NomineeName,
        nomineeRelation: formData.NomineeRelation,
        trvEmailId: formData.TravellerEmail,
        trvMobileNumber: formData.TravellerMobile,
        anyPreExistingDisease: formData.TravelleranyPreExistingDisease,
      }],
      TripType: {
        groupName: "No",
        natureOfGroup: "No",
        typeOfTour: "No",
        multipleCity: "No"
      }
    };
  };

  // --- Step 1: Calculate Premium ---
  const calculatePremium = async () => {
    if (!validateForm()) return;

    setCalculating(true);
    setApiError('');
    setPremiumResult(null);
    setPolicyResult(null);

    try {
      const payload = buildPayload();
      console.log("[UI] Sending Calculate Payload:", payload);

      const response = await saveMasterPlan_calc(payload);
      console.log("[UI] Received Response:", response);

      if (response.Status === "Failure" || !response.MasterData) {
        setApiError(response.Message || "Failed to calculate premium. Please review the details.");
        return;
      }

      setPremiumResult(response.MasterData as PremiumResult);

    } catch (err: any) {
      const msg = err.response?.data?.Message || err.message || "Server error while communicating with the API.";
      setApiError(msg);
    } finally {
      setCalculating(false);
    }
  };

  // --- Step 2: Proceed to Wallet Payment ---
  const handleProceed = () => {
    if (!premiumResult?.pQuoteNo) {
      setApiError("Quote number is missing. Please recalculate premium.");
      return;
    }
    setIssuing(true);
    const finalPayload = {
      ...buildPayload(),
      QuoteNo: premiumResult.pQuoteNo
    };

    const paymentData = {
      payload: finalPayload,
      quoteNo: premiumResult.pQuoteNo,
      policyNo: premiumResult.PolicyNo,
      amount: finalPayload.radiobtn_selectedAmount,
      proposerName: `${formData.ProposerFirstName} ${formData.ProposerLastName}`,
      planName: formData.Plan,
      days: formData.NoOfDays
    };

    sessionStorage.setItem('bajajPaymentData', JSON.stringify(paymentData));

    // Optional: Add a tiny delay so the user actually sees the loader message
    setTimeout(() => {
      setIssuing(false);
      navigate('/BajajTravelWallet', { state: paymentData });
    }, 500);
  };



  // -- 4. UI RENDER --
  return (
    <>
      {calculating && <FullScreenLoader message="Calculating Premium & Generating Proposal..." />}
      {issuing && <FullScreenLoader message="Preparing Payment Gateway..." />}
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
          {/* WELCOME CARD */}
          <div className="user-info-card-b">
            <div className="card-header-b" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="welcome-title-b">
                Welcome, {displayData.FullName || displayData.name}
              </h2>
              <button onClick={() => navigate('/BajajTravel')} className="back-to-selection-btn-b" style={{ position: 'relative', top: '0', right: '0' }}>
                <ArrowLeftCircle size={18} />
                <span>Back To Premium Calculator</span>
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
              </div>
            </div>
          </div>

          {/* MAIN FORM / CALCULATOR CARD */}
          <div style={{ maxWidth: '100%', margin: '0 auto', padding: '30px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px', textAlign: 'center', color: '#1f2937' }}>
              Bajaj Travel Proposal Form
            </h2>

            {/* 1. Travel Details Section */}
            <div style={{ marginBottom: '40px' }}>
              <h4 style={{ color: '#6c63ff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' }}>
                <Calendar size={20} /> Trip Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>

                <InputField label="Start Date" name="StartDate" type="date" value={formData.StartDate} onChange={handleInputChange} required />
                <InputField label="End Date" name="EndDate" type="date" value={formData.EndDate} onChange={handleInputChange} required />
                <InputField label="Duration (Days)" name="NoOfDays" value={formData.NoOfDays} onChange={handleInputChange} disabled />
                <InputField label="Country Visiting" name="CountryName" value={formData.CountryName} onChange={handleInputChange} required />
                <InputField label="Plan" name="Plan" value={formData.Plan} onChange={handleInputChange} disabled />
              </div>
            </div>

            {/* 2. Proposer Details Section */}
            <div style={{ marginBottom: '40px' }}>
              <h4 style={{ color: '#6c63ff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' }}>
                <UserCircle size={20} /> Proposer Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <TitleSelect
                  name="ProposerTitle"
                  value={formData.ProposerTitle}
                  onChange={handleInputChange} />
                <InputField label="First Name" name="ProposerFirstName" value={formData.ProposerFirstName} onChange={handleInputChange} required />
                <InputField label="Middle Name" name="ProposerMiddleName" value={formData.ProposerMiddleName} onChange={handleInputChange} />
                <InputField label="Last Name" name="ProposerLastName" value={formData.ProposerLastName} onChange={handleInputChange} />
                <InputField label="Date of Birth" name="ProposerDOB" type="date" value={formData.ProposerDOB} onChange={handleInputChange} required />
                <InputField label="Gender" name="ProposerGender" type="select" value={formData.ProposerGender} onChange={handleInputChange} options={[{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }]} />

                <InputField label="Mobile" name="ProposerMobile" value={formData.ProposerMobile} onChange={handleInputChange} required error={errors.ProposerMobile} />
                <InputField label="Email" name="ProposerEmail" type="email" value={formData.ProposerEmail} onChange={handleInputChange} required error={errors.ProposerEmail} />
                <InputField label="Passport No" name="ProposerPassport" value={formData.ProposerPassport} onChange={handleInputChange} error={errors.ProposerPassport} />

                <InputField label="Address" name="ProposerAddress" value={formData.ProposerAddress} onChange={handleInputChange} />
                <InputField label="City" name="ProposerCity" value={formData.ProposerCity} onChange={handleInputChange} />
                <InputField label="State" name="ProposerState" type="select" value={formData.ProposerState} onChange={handleInputChange} required options={[{ value: '', label: 'Select State' }, ...INDIAN_STATES]} />
                <InputField label="Pincode" name="ProposerPincode" value={formData.ProposerPincode} onChange={handleInputChange} error={errors.ProposerPincode} />

                {/* GSTIN Default Read Only */}
                <InputField label="GSTIN Number" name="ProposerGSTIN" value={formData.ProposerGSTIN} onChange={handleInputChange} disabled={true} />

              </div>
            </div>

            {/* 4. Nominee Details Section proposer*/}
            <div style={{ marginBottom: '40px' }}>
              <h4 style={{ color: '#6c63ff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' }}>
                <UserCircle size={20} /> Nominee Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <InputField label="Nominee Name" name="NomineeName" value={formData.NomineeName} onChange={handleInputChange} required />
                <InputField label="Relationship with Insured" name="NomineeRelation" type="select" value={formData.NomineeRelation} onChange={handleInputChange} options={NOMINEE_RELATIONS} required />
              </div>
            </div>


            {/* 3. Traveller Details Section */}
            <div style={{ marginBottom: '40px' }}>
              <h4 style={{ color: '#6c63ff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' }}>
                <User size={20} /> Traveller Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <TitleSelect
                  name="TravellerTitle"
                  value={formData.TravellerTitle}
                  onChange={handleInputChange} />
                <InputField label="First Name" name="TravellerFirstName" value={formData.TravellerFirstName} onChange={handleInputChange} required />
                <InputField label="Middle Name" name="TravellerMiddleName" value={formData.TravellerMiddleName} onChange={handleInputChange} />
                <InputField label="Last Name" name="TravellerLastName" value={formData.TravellerLastName} onChange={handleInputChange} />
                <InputField label="Date of Birth" name="TravellerDOB" type="date" value={formData.TravellerDOB} onChange={handleInputChange} required />

                <InputField label="Mobile" name="TravellerMobile" value={formData.TravellerMobile} onChange={handleInputChange} required error={errors.ProposerMobile} />
                <InputField label="Email" name="TravellerEmail" type="email" value={formData.TravellerEmail} onChange={handleInputChange} required error={errors.ProposerEmail} />

                <InputField label="Passport No" name="TravellerPassport" value={formData.TravellerPassport} onChange={handleInputChange} required error={errors.TravellerPassport} />
                <InputField label="Gender" name="TravellerGender" type="select" value={formData.TravellerGender} onChange={handleInputChange} options={[{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }]} />
                <InputField label="Relation to Proposer" name="TravellerRelation" type="select" value={formData.TravellerRelation} onChange={handleInputChange} options={[{ value: 'SELF', label: 'Self' }, ...NOMINEE_RELATIONS.filter(r => r.value !== '')]} />

                <InputField label="Any Pre-Existing Disease" name="TravelleranyPreExistingDisease" type="select" value={formData.TravelleranyPreExistingDisease} onChange={handleInputChange} options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]} />

              </div>
            </div>

            {/* ERROR DISPLAY AREA */}
            {apiError && (
              <div style={{ margin: '20px 0', padding: '15px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} />
                <span style={{ fontWeight: '500' }}>{apiError}</span>
              </div>
            )}

            {/* ACTION BUTTONS (Calculate) */}
            {!premiumResult && !policyResult && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
                <button
                  onClick={calculatePremium}
                  disabled={calculating}
                  className="Premium-btn"
                  style={{ minWidth: '250px', padding: '14px', fontSize: '16px', fontWeight: 'bold' }}
                >
                  {calculating ? 'Processing Proposal...' : 'Submit Proposal'}
                </button>
              </div>
            )}

            {/* RESULT DISPLAY (Calculated Premium) */}
            {premiumResult && (
              <div style={{ marginTop: '30px', padding: '30px', background: '#f0fdf4', border: '1px solid #10b981', borderRadius: '8px', animation: 'fadeIn 0.5s' }}>
                <h3 style={{ textAlign: 'center', color: '#047857', marginBottom: '30px', fontSize: '22px' }}>Proposal Generated Successfully</h3>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center', minWidth: '220px' }}>
                    <p style={{ margin: '0', fontSize: '14px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Policy Number</p>
                    <p style={{ margin: '10px 0 0', fontSize: '20px', fontWeight: 'bold', color: '#374151' }}>{premiumResult.PolicyNo}</p>
                  </div>

                  <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '8px', border: '2px solid #10b981', textAlign: 'center', minWidth: '220px' }}>
                    <p style={{ margin: '0', fontSize: '14px', color: '#047857', textTransform: 'uppercase', letterSpacing: '1px' }}>Final Premium (Incl. GST)</p>
                    <p style={{ margin: '10px 0 0', fontSize: '28px', fontWeight: 'bold', color: '#059669' }}>
                      ₹ {premiumResult.FinalPremium}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '40px', textAlign: 'center', display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <button
                    onClick={handleProceed}
                    disabled={issuing}
                    className="Premium-btn"
                    style={{ padding: '12px 30px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '16px' }}
                  >
                    {issuing ? 'Loading...' : 'Proceed to Payment'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="footer" style={{ backgroundColor: '#6c63ff', color: 'white', padding: '15px', textAlign: 'center' }}>
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
        </footer>
      </div>
    </>
  );
};

export default BajajTravelProposal;