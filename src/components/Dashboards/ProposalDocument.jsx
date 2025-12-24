import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircle, ChevronDown, Mail, Calendar, Globe, CreditCard,
  BadgeCheck, LogOut, Home, Upload, CheckCircle, X, AlertTriangle
} from 'lucide-react';
import { logout } from '../../services/auth';
import logo from '../../../src/assets/img/TravelAssist.webp';

import {
  createProposal,
  getProposalByPassport,
  validatePolicyWithReliance
} from '../../services/api';


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

const ProposalDocument = ({ userData = null, onLogout = () => { } }) => {
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

  // Initialize form state with all fields
  const [formData, setFormData] = useState({
    AgentId: "",
    Product_Code: "2822",
    AgentCode_BASCode: "14A07082",
    UserName: "14a07082-14040",
    EncryptedPassword: "aaM2kWXl+KR4mTLlX4pgXTp7maoZ7oLzD9LoKBh3MSiWzYTz9dEMpHoIHC4g2WyjbuPed2crt0A+dOEBG1Se0w==",
    "IntermediatoryBranchCode": "14a07082-14040",
    "IntermediatoryDepartmentName": "TRAVEL",
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
    Cust_GSTINNO: "24AADCI7698J1Z0",
    premiumAmount: "",
    selectedOption: "",
    radiobtn_selectedOption: "",
    radiobtn_selectedAmount: "",
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
      AgeGroup: "00-81",
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
    const parsedData = JSON.parse(storedData);
    setProposalData(parsedData);

    // Pre-fill form with available data
    setFormData(prev => ({
      ...prev,
      AgentId: parsedData.agentDetails.AgentId,
      AgentCode_BASCode: parsedData.agentDetails.Agent_Code,
      UserName: parsedData.agentDetails.FullName,
      PolicyStartDate: parsedData.travelDetails.departureDate,
      PolicyEndDate: parsedData.travelDetails.arrivalDate,
      NameofPlan: parsedData.travelDetails.NameofPlan,
      premiumAmount: parsedData.insuranceDetails.premium.toFixed(2),

      radiobtn_selectedOption: parsedData.insuranceDetails.radiobtn_selectedOption || "",
      radiobtn_selectedAmount: parsedData.insuranceDetails.radiobtn_selectedAmount || "",
      traveller: {
        ...prev.traveller,
        DateOfBirth: parsedData.insuranceDetails.dateOfBirth // Set the date of birth here
      }
    }));

    setLoading(false);
  }, [navigate]);

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

  const generatePaxId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const isOtherDiseaseSelected = () => {
    return formData.traveller.SufferingFromAnyPreExistingDisease &&
      formData.traveller.NameOfDiseases !== "" &&
      formData.traveller.NameOfDiseases !== "AnyOther";
  };
  const isAnyOtherDiseaseSelected = () => {
    return formData.traveller.SufferingFromAnyPreExistingDisease &&
      formData.traveller.NameOfDiseases === "AnyOther";
  };
  const validateForm = () => {
    let errors = {};

    if (isAnyOtherDiseaseSelected() && !customDiseaseName.trim()) {
      errors.CustomDiseaseName = 'Please specify the disease type';
    }

    // Required fields validation
    const requiredFields = {
      AddressLine1: 'Address Line 1',
      CityName: 'City',
      PinCode: 'Pin Code',
      EmailID: 'Email',
      MobileNumber: 'Mobile Number',
      CountryVisiting: 'Country Visiting'
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
      DateOfBirth: 'Date of Birth',
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
    if (formData.LandLineNumber?.trim()) {
      const landlineRegex = /^[0-9]{1,15}$/; // allows 1 to 15 digits only
      if (!landlineRegex.test(formData.LandLineNumber)) {
        errors.LandLineNumber = 'Landline number must be digits only';
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
      if (!passportRegex.test(formData.traveller.PassportNo.trim())) {
        errors.PassportNo = 'Invalid passport number format (e.g., A1234567, V1317095, AA202808)';
      }
    }

    // Date of birth validation
    if (formData.traveller.DateOfBirth) {
      const dob = new Date(formData.traveller.DateOfBirth);
      const today = new Date();

      const diffInMonths =
        (today.getFullYear() - dob.getFullYear()) * 12 +
        (today.getMonth() - dob.getMonth());

      if (diffInMonths < 3 || (diffInMonths === 3 && today.getDate() < dob.getDate())) {
        errors.DateOfBirth = 'Age must be at least 3 months';
      } else if (diffInMonths / 12 > 81) {
        errors.DateOfBirth = 'Age cannot exceed 81 years';
      } else if (dob > today) {
        errors.DateOfBirth = 'Date of birth cannot be in future';
      }


    }

    // GST validation
    if (formData.IsRegGST === 'Yes' && !formData.Cust_GSTINNO?.trim()) {
      errors.Cust_GSTINNO = 'GSTIN is required when GST registered';
    }

    // Disease validation
    if (formData.traveller.SufferingFromAnyPreExistingDisease &&
      !formData.traveller.NameOfDiseases?.trim()) {
      errors.NameOfDiseases = 'Please select disease';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateForApi = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} 12:00:00`;
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
        const proposalData = response.MasterData[0];

        // Format dates properly
        const formatAPIDate = (dateString) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };

        // Update form data with retrieved data
        // But preserve the original PolicyStartDate and PolicyEndDate
        const originalStartDate = formData.PolicyStartDate;
        const originalEndDate = formData.PolicyEndDate;

        // Check if the disease in proposal data is in our dropdown list
        const diseaseName = proposalData.NameOfDiseases || '';
        let isStandardDisease = false;

        // Check if the disease is in our standard dropdown options
        if (diseaseName) {
          isStandardDisease = diseaseOptions.some(option =>
            option.value === diseaseName && diseaseName !== "AnyOther"
          );
        }

        // If it's not a standard disease but exists, treat it as a custom disease
        if (diseaseName && !isStandardDisease) {
          setCustomDiseaseName(diseaseName);

          // Set the form data with AnyOther for the dropdown
          setFormData(prev => ({
            ...prev,
            AddressLine1: proposalData.AddressLine1 || '',
            AddressLine2: proposalData.AddressLine2 || '',
            CityName: proposalData.CityName || '',
            PinCode: proposalData.PinCode || '',
            State: proposalData.State || '',
            EmailID: proposalData.EmailID || '',
            MobileNumber: proposalData.MobileNumber || '',
            LandLineNumber: proposalData.LandLineNumber || '',
            CountryVisiting: proposalData.CountryVisiting || '',
            StateVisit: proposalData.StateVisit || '',
            City_Of_visit: proposalData.City_Of_visit || '',
            IsRegGST: proposalData.IsRegGST || 'Yes',
            Cust_GSTINNO: proposalData.Cust_GSTINNO || '',
            // Keep the original dates, don't overwrite them
            PolicyStartDate: originalStartDate,
            PolicyEndDate: originalEndDate,
            traveller: {
              ...prev.traveller,
              InsuredFirstName: proposalData.InsuredFirstName || '',
              InsuredMiddleName: proposalData.InsuredMiddleName || '',
              InsuredLastName: proposalData.InsuredLastName || '',
              InsuredGender: proposalData.InsuredGender || '',
              PassportNo: proposalData.PassportNo || '',
              NomineeName: proposalData.NomineeName || '',
              RelationshipOfTheNomineeWithInsured: proposalData.RelationshipOfTheNomineeWithInsured || '',
              // Keep the original DateOfBirth, don't overwrite it
              DateOfBirth: prev.traveller.DateOfBirth,
              SufferingFromAnyPreExistingDisease: Boolean(proposalData.SufferingFromAnyPreExistingDisease),
              NameOfDiseases: "AnyOther" // Set to AnyOther when custom disease
            }
          }));
        } else {
          // If it's a standard disease or no disease, just use the value directly
          setFormData(prev => ({
            ...prev,
            AddressLine1: proposalData.AddressLine1 || '',
            AddressLine2: proposalData.AddressLine2 || '',
            CityName: proposalData.CityName || '',
            PinCode: proposalData.PinCode || '',
            State: proposalData.State || '',
            EmailID: proposalData.EmailID || '',
            MobileNumber: proposalData.MobileNumber || '',
            LandLineNumber: proposalData.LandLineNumber || '',
            CountryVisiting: proposalData.CountryVisiting || '',
            StateVisit: proposalData.StateVisit || '',
            City_Of_visit: proposalData.City_Of_visit || '',
            IsRegGST: 'Yes',
            Cust_GSTINNO: "24AADCI7698J1Z0",
            // Keep the original dates, don't overwrite them
            PolicyStartDate: originalStartDate,
            PolicyEndDate: originalEndDate,
            traveller: {
              ...prev.traveller,
              InsuredFirstName: proposalData.InsuredFirstName || '',
              InsuredMiddleName: proposalData.InsuredMiddleName || '',
              InsuredLastName: proposalData.InsuredLastName || '',
              InsuredGender: proposalData.InsuredGender || '',
              PassportNo: proposalData.PassportNo || '',
              NomineeName: proposalData.NomineeName || '',
              RelationshipOfTheNomineeWithInsured: proposalData.RelationshipOfTheNomineeWithInsured || '',
              // Keep the original DateOfBirth, don't overwrite it
              DateOfBirth: prev.traveller.DateOfBirth,
              SufferingFromAnyPreExistingDisease: Boolean(proposalData.SufferingFromAnyPreExistingDisease),
              NameOfDiseases: proposalData.NameOfDiseases || ''
            }
          }));

          // Clear the custom disease name if not needed
          setCustomDiseaseName('');
        }

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
    // Check for AnyOther disease first
    if (isOtherDiseaseSelected()) {
      setErrorMessage("Sorry, we cannot process applications with specific disease types. Please select 'AnyOther' or contact customer support for assistance.");
      return;
    }

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

  const formatOptionName = (option) => {
    if (!option) return "";

    // Convert "discount" to "Discount" and "full" to "Full Pay"
    if (option.toLowerCase() === "discount") {
      return "Discount";
    } else if (option.toLowerCase() === "full") {
      return "Full Pay";
    }

    // Return the original if it's already properly formatted
    return option;
  };

  const handleSubmit = async () => {
    setShowConfirmation(false);

    // Clear previous messages
    setSuccessMessage('');
    setErrorMessage('');

    try {
      setSubmitting(true);

      const paxId = generatePaxId();
      const PSONumber = "PSO-" + generatePaxId();

      // Prepare data for Reliance API
      const relianceData = {
        Product_Code: "2822",
        AgentCode_BASCode: "17BRG116",
        UserName: "17BRG116-725288-11031",
        EncryptedPassword: "MBn1Y3/oGIs1g4lwg420s3XjNac599ReQV/nxAMt1fT1jM4sbgl3pKrvUCHtD1bsfV4fYqKJeojp9ZilK5JB8vbfTxCO7nOb7nymGyivPpE=",
        IntermediatoryBranchCode: "17BRG116-725288-11031",

        IntermediatoryDepartmentName: "TRAVEL",
        AddressLine1: formData.AddressLine1,
        AddressLine2: formData.AddressLine2 || null,
        CityName: formData.CityName,
        PinCode: formData.PinCode,
        State: formData.State,
        EmailID: formData.EmailID,
        MobileNumber: formData.MobileNumber,
        LandLineNumber: formData.LandLineNumber || null,
        NameofPlan: formData.NameofPlan,
        PolicyStartDate: formatDateForApi(formData.PolicyStartDate),
        PolicyEndDate: formatDateForApi(formData.PolicyEndDate),
        BusinessType: "New Business",
        PSONumber: PSONumber,
        SenderName: "Landmark Insurance",
        CountryVisiting: formData.CountryVisiting,
        StateVisit: formData.StateVisit || null,
        City_Of_visit: formData.City_Of_visit,
        IsRegGST: formData.IsRegGST,
        Cust_GSTINNO: formData.IsRegGST === 'Yes' ? formData.Cust_GSTINNO : null,
        MemberDetails: [
          {
            PaxId: "PaxId-" + paxId,
            InsuredFirstName: formData.traveller.InsuredFirstName,
            InsuredMiddleName: formData.traveller.InsuredMiddleName || null,
            InsuredLastName: formData.traveller.InsuredLastName,
            InsuredGender: formData.traveller.InsuredGender,
            PassportNo: formData.traveller.PassportNo,
            IdentificationNo: formData.traveller.IdentificationNo || null,
            NomineeName: formData.traveller.NomineeName,
            RelationshipOfTheNomineeWithInsured: formData.traveller.RelationshipOfTheNomineeWithInsured,
            DateOfBirth: formatDateForApi(formData.traveller.DateOfBirth),
            AgeGroup: "00-81",
            SufferingFromAnyPreExistingDisease: formData.traveller.SufferingFromAnyPreExistingDisease,
            NameOfDiseases: formData.traveller.SufferingFromAnyPreExistingDisease ?
              (formData.traveller.NameOfDiseases === "AnyOther" ? customDiseaseName : formData.traveller.NameOfDiseases) :
              null,
            AddressOfTheHomeToBeCoveredUnderHomeBurglaryPlan: formData.AddressLine1 + (formData.AddressLine2 ? ", " + formData.AddressLine2 : "") + ", " + formData.CityName + ", " + formData.State + ", " + formData.PinCode
          }
        ]
      };

      //   console.log('Calling Reliance API with data:', JSON.stringify(relianceData));

      // Set a flag to proceed without Reliance validation if needed
      let bypassRelianceValidation = false;
      let relianceResponse;
      let certificateNumber = '';
      let downloadFilePath = '';
      let reliancePaxId = '';
      let reliancePSONumber = PSONumber;  // Use our generated PSONumber as fallback

      try {
        // Call Reliance API for validation
        relianceResponse = await validatePolicyWithReliance(relianceData);
        //        console.log('Reliance API Response:', relianceResponse);

        // Check for Reliance API validation errors
        if (relianceResponse && relianceResponse.CustomerDetails) {
          const customer = relianceResponse.CustomerDetails[0];

          if (customer.WebServiceReturnStatus === 'Error') {
            // Handle specific error codes if needed
            setErrorMessage(`Reliance validation failed: ${customer.Error_Message} (Code: ${customer.ErrorCode})`);
            return;
          }
          if (customer.WebServiceReturnStatus === 'ErrorMessage') {
            // Handle specific error codes if needed
            setErrorMessage(`Reliance validation failed: ${customer.Error_Message} (Code: ${customer.ErrorCode})`);
            return;
          }

          if (customer.WebServiceReturnStatus === 'Successful') {
            certificateNumber = customer.CertificateNumber;
            downloadFilePath = customer.DownloadFilePath;
            reliancePaxId = customer.PaxId;
            reliancePSONumber = relianceResponse.PSONumber;
          }
        } else {
          // If response doesn't have expected structure, flag to continue anyway
          console.warn('Reliance API response structure unexpected:', relianceResponse);
          bypassRelianceValidation = true;
        }
      } catch (error) {
        console.error('Reliance API Error:', error);

        // For demo/development purposes, set bypass to true to continue the flow
        // You may want to adjust this logic in production
        bypassRelianceValidation = window.confirm(
          "Reliance API validation failed. Do you want to continue without validation? (For testing purposes only)"
        );

        if (!bypassRelianceValidation) {
          setErrorMessage('Reliance API validation failed. Please try again later.');
          setSubmitting(false);
          return;
        }

        // Use generated values since Reliance API failed
        reliancePaxId = "PaxId-" + paxId;
        reliancePSONumber = PSONumber;
        certificateNumber = "TEST-" + Date.now();
        downloadFilePath = "";
      }

      // If Reliance validation passes or we're bypassing, proceed with our API
      const submitData = {
        AgentId: formData.AgentId,
        Product_Code: "2822",
        AgentCode_BASCode: "14A07082",
        UserName: "14a07082-14040",
        EncryptedPassword: "aaM2kWXl+KR4mTLlX4pgXTp7maoZ7oLzD9LoKBh3MSiWzYTz9dEMpHoIHC4g2WyjbuPed2crt0A+dOEBG1Se0w==",
        IntermediatoryBranchCode: "14a07082-14040",
        IntermediatoryDepartmentName: "TRAVEL",
        AddressLine1: formData.AddressLine1,
        AddressLine2: formData.AddressLine2,
        CityName: formData.CityName,
        PinCode: formData.PinCode,
        State: formData.State,
        EmailID: formData.EmailID,
        MobileNumber: formData.MobileNumber,
        LandLineNumber: formData.LandLineNumber,
        NameofPlan: formData.NameofPlan,
        PolicyStartDate: formData.PolicyStartDate,
        PolicyEndDate: formData.PolicyEndDate,
        BusinessType: "New Business Type",
        PSONumber: reliancePSONumber,
        SenderName: "Landmark Insurance",
        CountryVisiting: formData.CountryVisiting,
        StateVisit: formData.StateVisit,
        City_Of_visit: formData.City_Of_visit,
        IsRegGST: formData.IsRegGST,
        Cust_GSTINNO: formData.Cust_GSTINNO,
        Certificate_Number: certificateNumber,
        Download_Insurance: downloadFilePath,

        // IMPORTANT: Match these parameter names with the stored procedure
        Selected_Payment_Mode: formatOptionName(proposalData.insuranceDetails.radiobtn_selectedOption),
        Selected_PremiumAmount: proposalData.insuranceDetails.radiobtn_selectedAmount || "",

        PlanAmount: proposalData.insuranceDetails.planAmount,
        ReliancePremiumAmount: proposalData.insuranceDetails.reliance_premium_amount,
        Actual_PremiumAmount: proposalData.insuranceDetails.premium,
        // Member details
        PaxId: reliancePaxId,
        InsuredFirstName: formData.traveller.InsuredFirstName,
        InsuredMiddleName: formData.traveller.InsuredMiddleName,
        InsuredLastName: formData.traveller.InsuredLastName,
        InsuredGender: formData.traveller.InsuredGender,
        PassportNo: formData.traveller.PassportNo,
        IdentificationNo: formData.traveller.IdentificationNo,
        NomineeName: formData.traveller.NomineeName,
        RelationshipOfTheNomineeWithInsured: formData.traveller.RelationshipOfTheNomineeWithInsured,
        DateOfBirth: formData.traveller.DateOfBirth,
        AgeGroup: "00-81",
        SufferingFromAnyPreExistingDisease: formData.traveller.SufferingFromAnyPreExistingDisease,
        NameOfDiseases: formData.traveller.SufferingFromAnyPreExistingDisease ?
          (formData.traveller.NameOfDiseases === "AnyOther" ? customDiseaseName : formData.traveller.NameOfDiseases) :
          null,
        AddressOfTheHome: formData.AddressLine1 + (formData.AddressLine2 ? ", " + formData.AddressLine2 : "") + ", " + formData.CityName + ", " + formData.State + ", " + formData.PinCode
      };

      //     console.log('Calling our API with data:', JSON.stringify(submitData));

      const response = await createProposal(submitData);
      if (response.Status === "Success") {
        setSuccessMessage(`Proposal submitted successfully! Reference ID: ${reliancePSONumber}`);

        // Store the insurance data in sessionStorage for the payment page
        const insuranceData = {
          fullName: `${formData.traveller.InsuredFirstName} ${formData.traveller.InsuredLastName}`,
          paxId: bypassRelianceValidation ? reliancePaxId : relianceResponse.CustomerDetails[0].PaxId,
          psoNumber: reliancePSONumber,
          certificateNumber: certificateNumber,
          downloadFilePath: downloadFilePath,
          AgentId: proposalData.agentDetails.AgentId,
          AgentCode_BASCode: proposalData.agentDetails.Agent_Code,

          premiumAmount: proposalData.insuranceDetails.premium,
          selectedOption: proposalData.insuranceDetails.selectedOption || "Full Pay",

          selectedPremiumAmount: proposalData.insuranceDetails.selectedPremiumAmount,
          selectedAgentCollectionAmount: proposalData.insuranceDetails.selectedAgentCollectionAmount,

          radiobtn_selectedOption: proposalData.insuranceDetails.radiobtn_selectedOption || "",
          radiobtn_selectedAmount: proposalData.insuranceDetails.radiobtn_selectedAmount || "",
        };
        sessionStorage.setItem('insuranceData', JSON.stringify(insuranceData));
        // Redirect to payment page after 2 seconds
        setTimeout(() => {
          navigate('/RazorPaymentPage');
        }, 2000);
      }
      else {
        setErrorMessage(response.Message || 'Failed to submit proposal');
      }
    } catch (error) {
      console.error('Error submitting proposal:', error);
      setErrorMessage(error.response?.data?.Message || 'Error submitting proposal. Please try again.');
    } finally {
      setSubmitting(false);
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
      // Use replace to prevent going back to the protected route
      //navigate('/login', { replace: true });
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading || !proposalData) {
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

  // Confirmation Dialog
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
        <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Confirm Submission</h3>
        <p style={{ marginBottom: '20px', lineHeight: '1.5', color: '#4b5563' }}>
          Are you sure you want to submit this proposal? Your data will be validated with Reliance Insurance API before proceeding.
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
            Confirm Submission
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

  const diseaseOptions = [
    { value: "", label: "Select Disease" },
    { value: "AnyOther", label: "AnyOther" },
    { value: "Cancer", label: "Cancer" },
    { value: "Cardiacailments", label: "Cardiacailments" },
    { value: "COPD", label: "COPD" },
    { value: "HIVorAIDS", label: "HIVorAIDS" },
    { value: "InsulinDependentDiabetes", label: "InsulinDependentDiabetes" },
    { value: "KidneyAilment", label: "KidneyAilment" },
    { value: "Leukemia", label: "Leukemia" },
    { value: "LiverDisease", label: "LiverDisease" },
    { value: "MalignantTumor", label: "MalignantTumor" },
    { value: "NeurologicalDisorder", label: "Neurological Disorder / Stroke / Paralysis" },
    { value: "Thalasemia", label: "Thalasemia" }
  ];

  return (
    <div style={commonStyles.container}>
      {/* Confirmation Dialog */}
      {showConfirmation && <ConfirmationDialog />}

      {/* Header */}
      <header style={commonStyles.header}>
        <div style={commonStyles.headerContent}>
          <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
          <div className="logo d-flex align-items-center w-auto">
            <span className="d-none d-lg-block">Travel Assistance Service</span>
          </div>
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
                backgroundColor: '#ef4444'
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
        {/* Summary Card */}
        <div style={commonStyles.card}>
          <h3 style={commonStyles.cardTitle}>Policy Summary</h3>
          <div style={commonStyles.grid}>
            <div>
              <h4 style={{ color: '#4b5563', marginBottom: '8px' }}>Travel Period</h4>
              <p>Duration : {proposalData.travelDetails.numberOfDays} Days</p>
              <p>From : {formatDate(proposalData.travelDetails.departureDate)}</p>
              <p>To : {formatDate(proposalData.travelDetails.arrivalDate)}</p>

            </div>

            <div>
              <h4 style={{ color: '#4b5563', marginBottom: '8px' }}>Coverage Details</h4>
              <p>Plan Name : {proposalData.travelDetails.NameofPlan}</p>
              <p>Plan Amount : USD {parseInt(proposalData.insuranceDetails.planAmount).toLocaleString()}</p>

              {proposalData.insuranceDetails.radiobtn_selectedOption && proposalData.insuranceDetails.radiobtn_selectedAmount && (
                <p style={{ display: 'flex', justifyContent: 'left' }}>
                  <span>
                    {proposalData.insuranceDetails.radiobtn_selectedOption === "Full Pay" ? "Premium" : "Premium "}:
                    ₹{parseFloat(proposalData.insuranceDetails.radiobtn_selectedAmount).toFixed(2)}
                  </span>
                  <span style={{ marginLeft: '20px' }}>Option : {formatOptionName(proposalData.insuranceDetails.radiobtn_selectedOption)}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Proposal Form */}
        <div style={commonStyles.card}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h5 style={{
              marginRight: '20px',
            }}>Search Proposal Form</h5>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}>
              <div style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  placeholder="Enter Passport Number"
                  value={searchPassport}
                  onChange={(e) => {
                    setSearchError('');
                    setSearchPassport(e.target.value.toUpperCase());
                  }}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${searchError ? '#dc2626' : '#e5e7eb'}`,
                    borderRadius: '4px',
                    width: '200px',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c63ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: searching ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    opacity: searching ? 0.7 : 1
                  }}
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
              {searchError && (
                <div style={{
                  color: '#dc2626',
                  fontSize: '12px',
                  textAlign: 'left'
                }}>
                  {searchError}
                </div>
              )}
            </div>
          </div>
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

              <InputField
                label="Date of Birth"
                name="DateOfBirth"
                type="date"
                value={formData.traveller.DateOfBirth}
                onChange={(e) => handleInputChange(e, 'traveller')}
                disabled
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
                value="Yes"
                onChange={() => { }}
                disabled={true}
              />
              {formData.IsRegGST === 'Yes' && (
                <InputField
                  label="GSTIN Number"
                  name="Cust_GSTINNO"
                  value="24AADCI7698J1Z0"
                  onChange={() => { }}
                  required
                  disabled={true}

                />
              )}
            </div>
          </div>


          {/* Travel Details */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#4b5563', marginBottom: '15px' }}>Travel Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <InputField
                label="Country Visiting"
                name="CountryVisiting"
                value={formData.CountryVisiting}
                onChange={handleInputChange}
                required
                error={formErrors.CountryVisiting}
              />
              <InputField
                label="State of Visit"
                name="StateVisit"
                value={formData.StateVisit}
                onChange={handleInputChange}

              />

              <InputField
                label="City of Visit"
                name="City_Of_visit"
                value={formData.City_Of_visit}
                onChange={handleInputChange}

              />

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
              <InputField
                label="Start Date"
                name="PolicyStartDate"
                type="date"
                value={formData.PolicyStartDate}
                onChange={handleInputChange}
                disabled
              />
              <InputField
                label="End Date"
                name="PolicyEndDate"
                type="date"
                value={formData.PolicyEndDate}
                onChange={handleInputChange}
                disabled
              />
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

          {/* Pre-existing Disease */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#4b5563', marginBottom: '15px' }}>Pre-existing Disease Information</h4>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px' }}>
                Any Pre-existing Disease?
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleInputChange({
                    target: {
                      name: 'SufferingFromAnyPreExistingDisease',
                      value: true
                    }
                  }, 'traveller')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: formData.traveller.SufferingFromAnyPreExistingDisease ? '#6c63ff' : '#f3f4f6',
                    color: formData.traveller.SufferingFromAnyPreExistingDisease ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange({
                    target: {
                      name: 'SufferingFromAnyPreExistingDisease',
                      value: false
                    }
                  }, 'traveller')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: !formData.traveller.SufferingFromAnyPreExistingDisease ? '#6c63ff' : '#f3f4f6',
                    color: !formData.traveller.SufferingFromAnyPreExistingDisease ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  No
                </button>
              </div>
            </div>

            {formData.traveller.SufferingFromAnyPreExistingDisease && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                <InputField
                  label="Name of Disease"
                  name="NameOfDiseases"
                  value={formData.traveller.NameOfDiseases}
                  onChange={(e) => handleInputChange(e, 'traveller')}
                  type="select"
                  options={diseaseOptions}
                  required
                  error={formErrors.NameOfDiseases}
                />

                {isAnyOtherDiseaseSelected() && (
                  <InputField
                    label="Name of Disease Type"
                    name="CustomDiseaseName"
                    value={customDiseaseName}
                    onChange={(e) => setCustomDiseaseName(e.target.value)}
                    required
                    error={formErrors.CustomDiseaseName}
                  />
                )}

                {isOtherDiseaseSelected() && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px 15px',
                    backgroundColor: '#fff4e5',
                    color: '#d97706',
                    borderRadius: '4px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertTriangle size={18} />
                    <span>
                      <strong>Not allowed:</strong> Applications with specific disease types cannot be processed online.
                      Please select 'AnyOther' or contact customer support for assistance.
                    </span>
                  </div>
                )}
              </div>
            )}

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

          {successMessage && (
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
              onClick={() => navigate('/dashboard')}
              disabled={submitting}
              style={{
                padding: '10px 20px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1
              }}
            >
              Cancel
            </button>

            {isAnyOtherDiseaseSelected() || !formData.traveller.SufferingFromAnyPreExistingDisease ? (
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c63ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {submitting ? (
                  <>
                    <div className="spinner-border spinner-border-sm" role="status" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  'Submit Proposal'
                )}
              </button>
            ) : null}
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
    minHeight: '100vh'
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

export default ProposalDocument;