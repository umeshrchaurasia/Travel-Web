import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircle, ChevronDown, Mail, Calendar, Globe, CreditCard,
  BadgeCheck, LogOut, Home, Upload, CheckCircle, X, AlertTriangle
} from 'lucide-react';
import { logout } from '../../../services/auth';
import logo from '../../../../src/assets/img/TravelAssist.webp';

import {
  getProposalByPassport,
  updateProposal_policy,
  getPolicyDetailsbyPolicyno,
  generatePolicybyPolicyno,
  PDF_BASE_URL
} from '../../../services/api';

// InputField Component with enhanced error handling
const InputField = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  error,
  required = false,
  disabled = false,
  options = []
}) => (
  <div style={commonStyles.inputGroup}>
    <label style={commonStyles.label}>
      {label} {required && <span style={{ color: 'red' }}>*</span>}
    </label>
    {type === 'select' ? (
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        style={{
          ...commonStyles.input,
          backgroundColor: disabled ? '#f3f4f6' : 'white',
          borderColor: error ? '#dc2626' : '#e5e7eb'
        }}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={value || ""}
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
      <div style={{
        color: '#dc2626',
        fontSize: '12px',
        marginTop: '4px',
        position: 'absolute'
      }}>
        {error}
      </div>
    )}
  </div>
);

const DateInput = ({
  label,
  name,
  value,
  onChange,
  error,
  required = false  
}) => {
  // Format YYYY-MM-DD to display format if needed
  let displayValue = '';

  if (value) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        displayValue = `${day}-${month}-${year}`;
      } else {
        displayValue = value; // Keep original value if not a valid date
      }
    } catch (error) {
      displayValue = value; // Keep original value if parsing error
    }
  }
  return (
    <div style={commonStyles.inputGroup}>
      <label style={commonStyles.label}>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </label>
      <input
        type="text" // Changed from "date" to "text"
        name={name}
        value={displayValue}
        readOnly={true} // Use readOnly instead of disabled for better appearance
        style={{
          ...commonStyles.input,
          backgroundColor: '#f3f4f6',
          borderColor: error ? '#dc2626' : '#e5e7eb',
          cursor: 'default',
          caretColor: 'transparent',
          // Remove calendar icon in various browsers
          WebkitAppearance: 'none',
          MozAppearance: 'textfield'
        }}
      />
      {error && (
        <div style={{
          color: '#dc2626',
          fontSize: '12px',
          marginTop: '4px',
          position: 'absolute'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

const UpdatePolicyInsurance = ({ userData = null, onLogout = () => { } }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [proposalData, setProposalData] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchPassport, setSearchPassport] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [customDiseaseName, setCustomDiseaseName] = useState('');
  
  // Added states for policy generation
  const [generatingPolicy, setGeneratingPolicy] = useState(false);
  const [loadingState, setLoadingState] = useState('');
  const [policyGenerated, setPolicyGenerated] = useState(false);
  const [policyResponseData, setPolicyResponseData] = useState(null);

  // Define CSS style for animation
  if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleSheet);
  }

  // Initialize form state with all fields
  const [formData, setFormData] = useState({
    proposal_id: "",
    AgentId: "",
    Product_Code: "2822",
    AgentCode_BASCode: "",
    UserName: "",
    AddressLine1: "",
    AddressLine2: "",
    CityName: "",
    PinCode: "",
    State: "",
    EmailID: "",
    MobileNumber: "",
    LandLineNumber: "",
    NameofPlan: "",
    PolicyStartDate: "",
    PolicyEndDate: "",
    BusinessType: "New Business",
    PSONumber: "",
    SenderName: "Landmark Insurance",
    CountryVisiting: "",
    StateVisit: "",
    City_Of_visit: "",
    IsRegGST: "Yes",
    Cust_GSTINNO: "",
    Certificate_Number: "",
    traveller: {
      PaxId: "",
      InsuredFirstName: "",
      InsuredMiddleName: "",
      InsuredLastName: "",
      InsuredGender: "",
      PassportNo: "",
      IdentificationNo: "",
      NomineeName: "",
      RelationshipOfTheNomineeWithInsured: "",
      DateOfBirth: "",
      AgeGroup: "00-70",
      SufferingFromAnyPreExistingDisease: false,
      NameOfDiseases: "",
      AddressOfTheHome: ""
    }
  });

  useEffect(() => {
    const storedData = sessionStorage.getItem('proposalData');
    if (!storedData) {
      navigate('/dashboard');
      return;
    }

    try {
      // Parse the stored data
      const parsedData = JSON.parse(storedData);
      setProposalData(parsedData);

      // Directly populate the form with the stored data
      populateFormWithProposalData(parsedData);
    } catch (error) {
      console.error('Error parsing stored proposal data:', error);
      setErrorMessage('Error loading policy data');
    } finally {
      // Always set loading to false when done
      setLoading(false);
    }
  }, [navigate]);

  const populateFormWithProposalData = (proposal) => {
    // Check if proposal is null or undefined
    if (!proposal) {
      console.error('No proposal data provided to populateFormWithProposalData');
      setErrorMessage('No policy data available');
      return;
    }

    // Format Date of Birth if available
    let formattedDOB = proposal.DateOfBirth || proposal.insuranceDetails?.dateOfBirth || '';

    // Ensure DOB is in the correct format for the date input (YYYY-MM-DD)
    if (formattedDOB) {
      try {
        // Convert various date formats to YYYY-MM-DD
        const date = new Date(formattedDOB);
        if (!isNaN(date.getTime())) {
          formattedDOB = date.toISOString().split('T')[0];
        }
      } catch (error) {
        console.error('Error formatting date:', error);
      }
    }

    // Extract the required data with safe defaults
    const firstName = proposal.InsuredFirstName || proposal.FirstName || '';
    const middleName = proposal.InsuredMiddleName || proposal.MiddleName || '';
    const lastName = proposal.InsuredLastName || proposal.LastName || '';
    const gender = proposal.InsuredGender || proposal.Gender || '';

    // Pre-fill form with all available data, using optional chaining to avoid null errors
    setFormData({
      proposal_id: proposal.proposal_id || '',
      AgentId: proposal.AgentId || proposal.agentDetails?.AgentId || '',
      AgentCode_BASCode: proposal.Agent_Code || proposal.agentDetails?.Agent_Code || '',
      UserName: proposal.UserName || proposal.agentDetails?.FullName || '',
      AddressLine1: proposal.AddressLine1 || '',
      AddressLine2: proposal.AddressLine2 || '',
      CityName: proposal.CityName || '',
      PinCode: proposal.PinCode || '',
      State: proposal.State || '',
      EmailID: proposal.EmailID || '',
      MobileNumber: proposal.MobileNumber || '',
      LandLineNumber: proposal.LandLineNumber || '',
      NameofPlan: proposal.NameofPlan || `ATLYS ${proposal.travelDetails?.geographicalCover || ''} USA & CANADA ELITE PLAN`,
      PolicyStartDate: proposal.PolicyStartDate || proposal.travelDetails?.departureDate || '',
      Premium:  proposal.insuranceDetails?.premium || '',
      PolicyEndDate: proposal.PolicyEndDate || proposal.travelDetails?.arrivalDate || '',
      BusinessType: proposal.BusinessType || "New Business",
      PSONumber: proposal.PSONumber || '',
      SenderName: proposal.SenderName || "Landmark Insurance",
      CountryVisiting: proposal.CountryVisiting || '',
      StateVisit: proposal.StateVisit || '',
      City_Of_visit: proposal.City_Of_visit || '',
      IsRegGST: proposal.IsRegGST || "Yes",
      Cust_GSTINNO: proposal.Cust_GSTINNO || '',
      Certificate_Number: proposal.Certificate_Number || proposal.Policy_No || '',
      traveller: {
        PaxId: proposal.PaxId || '',
        InsuredFirstName: firstName,
        InsuredMiddleName: middleName,
        InsuredLastName: lastName,
        InsuredGender: gender,
        PassportNo: proposal.PassportNo || '',
        IdentificationNo: proposal.IdentificationNo || '',
        NomineeName: proposal.NomineeName || '',
        RelationshipOfTheNomineeWithInsured: proposal.RelationshipOfTheNomineeWithInsured || '',
        DateOfBirth: formattedDOB,
        AgeGroup: proposal.AgeGroup || "00-70",
        SufferingFromAnyPreExistingDisease: false,
        NameOfDiseases: '',
        AddressOfTheHome: proposal.AddressOfTheHome || ''
      }
    });
  };

  const handleInputChange = (e, section = null) => {
    const { name, value } = e.target;

    if (section === 'traveller') {
      setFormData(prev => ({
        ...prev,
        traveller: {
          ...prev.traveller,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when field is modified
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear any global error messages as well
    setErrorMessage('');
  };

  const validateForm = () => {
    let errors = {};

    // Required fields validation
    const requiredFields = {
      AddressLine1: 'Address Line 1',
      CityName: 'City',
      PinCode: 'Pin Code',
      EmailID: 'Email',
      MobileNumber: 'Mobile Number'
    };

    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!formData[field]?.trim()) {
        errors[field] = `${label} is required`;
      }
    });

    // Traveller details validation
    const requiredTravellerFields = {
      InsuredFirstName: 'First Name',
      InsuredLastName: 'Last Name',
      PassportNo: 'Passport Number',
      NomineeName: 'Nominee Name'
    };

    Object.entries(requiredTravellerFields).forEach(([field, label]) => {
      if (!formData.traveller[field]?.trim()) {
        errors[field] = `${label} is required`;
      }
    });

    if (!formData.traveller.InsuredGender || formData.traveller.InsuredGender === "") {
      errors.InsuredGender = 'Please select a gender';
    }

    if (!formData.traveller.RelationshipOfTheNomineeWithInsured ||
      formData.traveller.RelationshipOfTheNomineeWithInsured === "") {
      errors.RelationshipOfTheNomineeWithInsured = 'Please select relationship with nominee';
    }

    // Format validations
    if (formData.EmailID?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.EmailID)) {
        errors.EmailID = 'Invalid email format';
      }
    }

    if (formData.MobileNumber?.trim()) {
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(formData.MobileNumber)) {
        errors.MobileNumber = 'Mobile number must be 10 digits';
      }
    }

    if (formData.PinCode?.trim()) {
      const pinCodeRegex = /^[0-9]{6}$/;
      if (!pinCodeRegex.test(formData.PinCode)) {
        errors.PinCode = 'Pin code must be 6 digits';
      }
    }

    // Dropdown fields validation
    if (!formData.State || formData.State === "") {
      errors.State = 'Please select a state';
    }

    if (formData.traveller.PassportNo?.trim()) {
     const passportRegex = /^[A-Z]{1,2}[0-9]{6,7}$/;
      if (!passportRegex.test(formData.traveller.PassportNo)) {
        errors.PassportNo = 'Invalid passport number format (e.g., A1234567)';
      }
    }

    // GST validation
    if (formData.IsRegGST === 'Yes' && !formData.Cust_GSTINNO?.trim()) {
      errors.Cust_GSTINNO = 'GSTIN is required when GST registered';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const handleSearch = async () => {
    if (!searchPassport.trim()) {
      setSearchError('Please enter a passport number');
      return;
    }

    setSearching(true);
    setSearchError('');

    try {
      const response = await getProposalByPassport(searchPassport);

      if (response.Status === 'Success' && response.MasterData?.length > 0) {
        const proposal = response.MasterData[0];
        populateFormWithProposalData(proposal);
        setSuccessMessage('Proposal data loaded successfully');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setSearchError('No proposal found with this passport number');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Error searching for proposal. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmSubmit = () => {
    if (validateForm()) {
      setShowConfirmation(true);
    } else {
      // Scroll to the first error
      const firstErrorField = Object.keys(formErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Handle policy update with API call
  const handleSubmit = async () => {
    setShowConfirmation(false);

    // Clear previous messages
    setSuccessMessage('');
    setErrorMessage('');

    try {
      setSubmitting(true);

      // Prepare data for the update API
      const updateData = {
        proposal_id: formData.proposal_id,
        PolicyNo: formData.Certificate_Number,  // Added policy number for lookup

        // Basic details
        AddressLine1: formData.AddressLine1,
        AddressLine2: formData.AddressLine2,
        CityName: formData.CityName,
        PinCode: formData.PinCode,
        State: formData.State,
        EmailID: formData.EmailID,
        MobileNumber: formData.MobileNumber,
        LandLineNumber: formData.LandLineNumber,

        // GST info
        IsRegGST: formData.IsRegGST,
        Cust_GSTINNO: formData.Cust_GSTINNO,

        // Traveller details
        InsuredFirstName: formData.traveller.InsuredFirstName,
        InsuredMiddleName: formData.traveller.InsuredMiddleName,
        InsuredLastName: formData.traveller.InsuredLastName,
        InsuredGender: formData.traveller.InsuredGender,
        PassportNo: formData.traveller.PassportNo,

        // Nominee details
        NomineeName: formData.traveller.NomineeName,
        RelationshipOfTheNomineeWithInsured: formData.traveller.RelationshipOfTheNomineeWithInsured,
      };

      console.log('Updating proposal with data:', JSON.stringify(updateData));

      // Call the API to update the proposal
      const response = await updateProposal_policy(updateData);
      if (response && response.Status === "Success") {
        setSuccessMessage(`Policy updated successfully!`);

        // Generate policy PDF after successful update
        await generatePolicy();
      } else {
        const errorMsg = response?.Message || 'Failed to update policy. Please try again.';
        setErrorMessage(errorMsg);  
      }
    } catch (error) {
      console.error('Error updating policy:', error);
      setErrorMessage(error.response?.data?.Message || 'Error updating policy. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate policy PDF
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

      // Call the generate policy API
      const response = await generatePolicybyPolicyno({
        Policyno: formData.Certificate_Number
      });

      console.log('Generate policy response:', response);

      if (response?.Status !== 'Success') {
        throw new Error(response?.Message || 'Failed to generate policy document');
      }

      // Extract the PDF URL from the response
      const pdfUrl = response.MasterData?.pdfUrl;

      if (!pdfUrl) {
        throw new Error('PDF URL not found in response');
      }

      // Set the policy data for success message
      setPolicyResponseData({
        pdfUrl: pdfUrl,
        fullPdfUrl: `${PDF_BASE_URL}${pdfUrl}`,
        customerName: `${formData.traveller.InsuredFirstName} ${formData.traveller.InsuredMiddleName} ${formData.traveller.InsuredLastName}`.trim(),
        policyNumber: formData.Certificate_Number
      });

      // Set success flag
      setPolicyGenerated(true);

      // Scroll to the success message
      setTimeout(() => {
        const resultMessage = document.getElementById('policyResultMessage');
        if (resultMessage) {
          resultMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      logout();
      if (onLogout) {
        onLogout();
      }
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Calculate travel duration (days)
  const calculateDuration = () => {
    if (!formData.PolicyStartDate || !formData.PolicyEndDate) return '';

    const startDate = new Date(formData.PolicyStartDate);
    const endDate = new Date(formData.PolicyEndDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';

    const diffTime = endDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? `${diffDays} Days` : '';
  };

  // Confirmation Dialog component
  const ConfirmationDialog = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px 25px',
        maxWidth: '450px',
        width: '90%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Confirm Update</h3>
        <p style={{ marginBottom: '20px', lineHeight: '1.5', color: '#4b5563' }}>
          Are you sure you want to update this policy? The changes will be saved permanently.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={() => setShowConfirmation(false)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: '#6c63ff',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Confirm Update
          </button>
        </div>
      </div>
    </div>
  );

  // Initialize constants for dropdowns
  const genderOptions = [
    { value: "", label: "Select Gender" },
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'Transgender Male', label: 'Transgender Male' },
    { value: 'Transgender Female', label: 'Transgender Female' }
  ];

  const relationshipOptions = [
    { value: "", label: "Select Relationship" },
    { value: "PARENT", label: "Parent" },
    { value: "CHILD", label: "Child" },
    { value: "SON", label: "Son" },
    { value: "DAUGHTER", label: "Daughter" },
    { value: "SPOUSE", label: "Spouse" },
    { value: "SISTER", label: "Sister" },
    { value: "BROTHER", label: "Brother" },
    { value: "FATHER", label: "Father" },
    { value: "MOTHER", label: "Mother" },
    { value: "EMPLOYEE", label: "Employee" },
    { value: "EMPLOYER", label: "Employer" },
    { value: "FATHERIL", label: "Father In Law" },
    { value: "GFATHER", label: "Grand Father" },
    { value: "GMANAGER", label: "Group Manager" },
    { value: "GMOTHER", label: "Grand Mother" },
    { value: "LGUARDIAN", label: "Legal Guardian" },
    { value: "LHEIR", label: "Legal Heir" },
    { value: "MOTHERIL", label: "Mother In Law" },
    { value: "TOPERATOR", label: "Tour Operator" },
    { value: "OTHERS", label: "Others" }
  ];

  

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div className="spinner" />
      </div>
    );
  }




  return (
    <div style={commonStyles.container}>
      {/* Confirmation Dialog */}
      {showConfirmation && <ConfirmationDialog />}

      {/* Fullscreen Loading Overlay for Policy Generation */}
      {generatingPolicy && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1050
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #6c63ff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '20px'
            }}></div>
            <p style={{ fontSize: '16px', fontWeight: '500' }}>{loadingState}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={commonStyles.header}>
        <div style={commonStyles.headerContent}>
          <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '50px', width: 'auto' }} />
          <div style={{ display: 'flex', gap: '20px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={commonStyles.button}
            >
              <Home size={18} />
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              style={{
                ...commonStyles.button,
                backgroundColor: '#dc2626'
              }}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={commonStyles.mainContent}>
        {/* Summary Card */}
        <div style={commonStyles.card}>
          <h3 style={commonStyles.cardTitle}>Policy Summary</h3>
          <div style={commonStyles.grid}>
            <div>
              <h4 style={{ color: '#4b5563', marginBottom: '8px' }}>Travel Period</h4>
              <p>Duration: {calculateDuration()}</p>
              <p>From: {formatDate(formData.PolicyStartDate)}</p>
              <p>To: {formatDate(formData.PolicyEndDate)}</p>
            </div>

            <div>
              <h4 style={{ color: '#4b5563', marginBottom: '8px' }}>Coverage Details</h4>
              <p>Plan Name: {formData.NameofPlan || 'ATLYS USA & CANADA ELITE PLAN'}</p>
              <p>Certificate/Policy Number: {formData.Certificate_Number || 'Not Available'}</p>
              <p>Policy Premium: ₹{parseFloat(formData.Premium || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Policy Generated Success Message */}
        {policyGenerated && policyResponseData && (
          <div style={{
            margin: '0 0 20px 0',
            padding: '20px',
            backgroundColor: '#f0fff4',
            borderRadius: '8px',
            border: '1px solid #10b981',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }} id="policyResultMessage">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={24} style={{ color: '#10b981' }} />
              <h4 style={{ color: '#10b981', fontSize: '18px', margin: '0' }}>Policy Generated Successfully!</h4>
            </div>
            <p style={{ margin: '5px 0' }}><strong>Customer Name:</strong> {policyResponseData.customerName}</p>
            <p style={{ margin: '5px 0' }}><strong>Policy Number:</strong> {policyResponseData.policyNumber}</p>
            <div style={{ marginTop: '10px' }}>
              <a 
                href={policyResponseData.fullPdfUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{
                  display: 'inline-block',
                  backgroundColor: '#6c63ff',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: '500',
                  textAlign: 'center'
                }}
              >
                View PDF
              </a>
            </div>
          </div>
        )}

        {/* Proposal Form */}
        <div style={commonStyles.card}>
          {/* Traveller Details */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#4b5563', marginBottom: '15px' }}>Traveller Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <InputField
                label="First Name"
                name="InsuredFirstName"
                value={formData.traveller.InsuredFirstName}
                onChange={(e) => handleInputChange(e, 'traveller')}
                required
                error={formErrors.InsuredFirstName}
              />
              <InputField
                label="Middle Name"
                name="InsuredMiddleName"
                value={formData.traveller.InsuredMiddleName}
                onChange={(e) => handleInputChange(e, 'traveller')}
              />
              <InputField
                label="Last Name"
                name="InsuredLastName"
                value={formData.traveller.InsuredLastName}
                onChange={(e) => handleInputChange(e, 'traveller')}
                required
                error={formErrors.InsuredLastName}
              />
              <InputField
                label="Gender"
                name="InsuredGender"
                value={formData.traveller.InsuredGender}
                onChange={(e) => handleInputChange(e, 'traveller')}
                type="select"
                options={genderOptions}
                required
                error={formErrors.InsuredGender}
              />

              <InputField
                label="Passport Number"
                name="PassportNo"
                value={formData.traveller.PassportNo}
                onChange={(e) => handleInputChange(e, 'traveller')}
                required
                error={formErrors.PassportNo}
              />

              <DateInput
                label="Date of Birth"
                name="DateOfBirth"
                value={formData.traveller.DateOfBirth}
                error={formErrors.DateOfBirth}
              />
            </div>
          </div>

          {/* Basic Details */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#4b5563', marginBottom: '15px' }}>Basic Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <InputField
                label="Address Line 1"
                name="AddressLine1"
                value={formData.AddressLine1}
                onChange={handleInputChange}
                required
                error={formErrors.AddressLine1}
              />
              <InputField
                label="Address Line 2"
                name="AddressLine2"
                value={formData.AddressLine2}
                onChange={handleInputChange}
              />
              <InputField
                label="Pin Code"
                name="PinCode"
                value={formData.PinCode}
                onChange={handleInputChange}
                required
                error={formErrors.PinCode}
              />

              <InputField
                label="City"
                name="CityName"
                value={formData.CityName}
                onChange={handleInputChange}
                required
                error={formErrors.CityName}
              />
              <InputField
                label="State"
                name="State"
                value={formData.State}
                onChange={handleInputChange}
                type="select"
                options={[
                  { value: "", label: "Select State" },
                  { value: 'ANDAMAN AND NICOBAR ISLANDS', label: 'Andaman and Nicobar Islands' },
                  { value: 'ANDHRA PRADESH', label: 'Andhra Pradesh' },
                  { value: 'ARUNACHAL PRADESH', label: 'Arunachal Pradesh' },
                  { value: 'ASSAM', label: 'Assam' },
                  { value: 'BIHAR', label: 'Bihar' },
                  { value: 'CHANDIGARH U.T.', label: 'Chandigarh U.T.' },
                  { value: 'CHHATTISGARH', label: 'Chhattisgarh' },
                  { value: 'DADRA AND NAGAR HAVELI', label: 'Dadra and Nagar Haveli' },
                  { value: 'DAMAN AND DIU', label: 'Daman and Diu' },
                  { value: 'DELHI', label: 'Delhi' },
                  { value: 'GOA', label: 'Goa' },
                  { value: 'GUJARAT', label: 'Gujarat' },
                  { value: 'HARYANA', label: 'Haryana' },
                  { value: 'HIMACHAL PRADESH', label: 'Himachal Pradesh' },
                  { value: 'JAMMU AND KASHMIR', label: 'Jammu and Kashmir' },
                  { value: 'JHARKHAND', label: 'Jharkhand' },
                  { value: 'KARNATAKA', label: 'Karnataka' },
                  { value: 'KERALA', label: 'Kerala' },
                  { value: 'LAKSHADWEEP U.T.', label: 'Lakshadweep U.T.' },
                  { value: 'MADHYA PRADESH', label: 'Madhya Pradesh' },
                  { value: 'MAHARASHTRA', label: 'Maharashtra' },
                  { value: 'MANIPUR', label: 'Manipur' },
                  { value: 'MEGHALAYA', label: 'Meghalaya' },
                  { value: 'MIZORAM', label: 'Mizoram' },
                  { value: 'NAGALAND', label: 'Nagaland' },
                  { value: 'ODISHA', label: 'Odisha' },
                  { value: 'PUDUCHERRY U T', label: 'Puducherry U.T.' },
                  { value: 'PUNJAB', label: 'Punjab' },
                  { value: 'RAJASTHAN', label: 'Rajasthan' },
                  { value: 'SIKKIM', label: 'Sikkim' },
                  { value: 'TAMIL NADU', label: 'Tamil Nadu' },
                  { value: 'TELANGANA', label: 'Telangana' },
                  { value: 'TRIPURA', label: 'Tripura' },
                  { value: 'UTTAR PRADESH', label: 'Uttar Pradesh' },
                  { value: 'UTTARAKHAND', label: 'Uttarakhand' },
                  { value: 'WEST BENGAL', label: 'West Bengal' }
                ]}
                required
                error={formErrors.State}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#4b5563', marginBottom: '15px' }}>Contact Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <InputField
                label="Email"
                name="EmailID"
                type="email"
                value={formData.EmailID}
                onChange={handleInputChange}
                required
                error={formErrors.EmailID}
              />
              <InputField
                label="Mobile Number"
                name="MobileNumber"
                value={formData.MobileNumber}
                onChange={handleInputChange}
                required
                error={formErrors.MobileNumber}
              />
              <InputField
                label="Landline Number"
                name="LandLineNumber"
                value={formData.LandLineNumber}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* GST Information */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#4b5563', marginBottom: '15px' }}>GST Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <InputField
                label="GST Registration"
                name="IsRegGST"
                value={formData.IsRegGST}
                onChange={handleInputChange}
                type="select"
                options={[
                  { value: "Yes", label: 'Yes' },
                  { value: 'No', label: 'No' }
                ]}
              />
              {formData.IsRegGST === 'Yes' && (
                <InputField
                  label="GSTIN Number"
                  name="Cust_GSTINNO"
                  value={formData.Cust_GSTINNO}
                  onChange={handleInputChange}
                  required
                  error={formErrors.Cust_GSTINNO}
                />
              )}
            </div>
          </div>

          {/* Nominee Details */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#4b5563', marginBottom: '15px' }}>Nominee Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <InputField
                label="Nominee Name"
                name="NomineeName"
                value={formData.traveller.NomineeName}
                onChange={(e) => handleInputChange(e, 'traveller')}
                required
                error={formErrors.NomineeName}
              />
              <InputField
                label="Relationship with Insured"
                name="RelationshipOfTheNomineeWithInsured"
                value={formData.traveller.RelationshipOfTheNomineeWithInsured}
                onChange={(e) => handleInputChange(e, 'traveller')}
                type="select"
                options={relationshipOptions}
                required
                error={formErrors.RelationshipOfTheNomineeWithInsured}
              />
            </div>
          </div>

          {/* Status Messages */}
          {errorMessage && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <AlertTriangle size={20} />
              <div>
                <strong>Error: </strong> {errorMessage}
              </div>
            </div>
          )}

          {successMessage && !policyGenerated && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f0fdf4',
              color: '#059669',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CheckCircle size={20} />
              {successMessage}
            </div>
          )}

          {/* Form Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '15px',
            marginTop: '30px',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '20px'
          }}>
            <button
              type="button"
              onClick={() => navigate('/GenerateCOI')}
              disabled={submitting || generatingPolicy}
              style={{
                padding: '10px 20px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                backgroundColor: 'white',
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
                padding: '10px 20px',
                backgroundColor: '#6c63ff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (submitting || generatingPolicy) ? 'not-allowed' : 'pointer',
                opacity: (submitting || generatingPolicy) ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {submitting ? (
                <>
                  <div className="spinner-border spinner-border-sm" role="status" />
                  <span>Updating...</span>
                </>
              ) : (
                'Update Policy'
              )}
            </button>
          </div>
        </div>
      </main>

      <footer style={{
        background: '#6c63ff',
        color: 'white',
        padding: '1rem',
        textAlign: 'center',
        marginTop: 'auto'
      }}>
        <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
      </footer>
    </div>
  );
};

const commonStyles = {
  container: {
    backgroundColor: '#f3f4f6',
    minHeight: '100vh',
    
  },
  header: {
    backgroundColor: '#6c63ff',
    padding: '1rem',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    color: 'white'
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    height: '40px'
  },
  button: {
    backgroundColor: '#dc2626',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '20px auto',
    padding: '0 20px',
    flex: '1 0 auto'
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#1f2937'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  inputGroup: {
    marginBottom: '25px', // Increased to accommodate error messages
    position: 'relative'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '500',
    color: '#374151'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px'
  },
  error: {
    color: '#dc2626',
    fontSize: '12px',
    marginTop: '4px',
    position: 'absolute'
  },
  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
};

export default UpdatePolicyInsurance;
