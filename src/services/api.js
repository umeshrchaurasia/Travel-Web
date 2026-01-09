import axios from 'axios';

//QA Server
//export const BASE_URL = 'http://3.111.3.129/qa-api/api';
//export const PDF_BASE_URL = 'http://3.111.3.129/qa-api';

//QA  Local Server
//export const BASE_URL = 'http://localhost:3011/api';
//export const PDF_BASE_URL = 'http://localhost:3011';

//export const BASE_URL = 'http://3.111.41.93:3000/api';

//Local Server
export const BASE_URL = 'http://localhost:3000/api';
export const PDF_BASE_URL = 'http://localhost:3000';

//Live Server

//export const BASE_URL = 'http://zextratravelassist.interstellar.co.in/travel-api/api';
//export const PDF_BASE_URL = 'http://zextratravelassist.interstellar.co.in/travel-api';

const HEADER_TOKEN = '1234567890';

// Add this to your backend server file (e.g., server.js or app.js)
//const axios = require('axios');

// Create an axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'token': HEADER_TOKEN,
    'Content-Type': 'application/json'
  }
});
export const loginUser = async (mobile, password) => {
  try {
    const response = await api.post('/login', {
      mobile,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const signupUser = async (userData) => {
  try {
    const response = await api.post('/addemployee', userData);
    return response.data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const fetchAgentsList = async (uId) => {
  try {
  //  console.log(uId);
    const response = await api.get('/agents_listByEmp', {
      params: { UId: uId }
    });
//    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const fetchAgentsList_Agent = async (agentId) => {
  try {
  //  console.log(agentid);
    const response = await api.get('/agents_listBy_Agent', {
      params: { agentId: agentId }
    });
//    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};


export const GetAgentSummary = async (uId) => {
  try {
  //  console.log(uId);
    const response = await api.get('/GetAgentSummary', {
      params: { UId: uId }
    });
  //  console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};


export const addAgent = async (agentData) => {
  try {
    const response = await api.post('/addagent', agentData);
    return response.data;
  } catch (error) {
    console.error('Add agent error:', error);
    throw error;
  }
};


export const addAgent_nonkyc = async (agentData) => {
  try {
    const response = await api.post('/addAgent_nonkyc', agentData);
    return response.data;
  } catch (error) {
    console.error('Add agent error:', error);
    throw error;
  }
};

export const addAgent_kyc = async (agentData) => {
  try {
    const response = await api.post('/addAgent_kyc', agentData);
    return response.data;
  } catch (error) {
    console.error('Add agent error:', error);
    throw error;
  }
};


// Add new functions for document handling
export const uploadDocument = async (formData) => {
  try {
    const response = await axios.post(`${BASE_URL}/documents/upload`, formData, {
      headers: {
        'token': HEADER_TOKEN,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Document upload error:', error);
    throw error;
  }
};

export const getAgentDocuments = async (agentId) => {
  try {
    const response = await api.get(`/documents/agent/${agentId}`);
    return response.data;
  } catch (error) {
    console.error('Get agent documents error:', error);
    throw error;
  }
};


// New approval-related functions
export const getPendingApprovals = async () => {
  try {
    const response = await api.get('/pending-approvals');
    return response.data;
  } catch (error) {
    console.error('Get pending approvals error:', error);
    throw error;
  }
};

export const get_agentlist_admin = async (startdate, enddate) => {
  try {
    const response = await api.post('/get_agentlist_admin', {
      startdate, enddate
    });
    return response.data;
  } catch (error) {
    console.error('Get agent list error:', error);
    throw error;
  }
};

export const get_agentnamelist_admin = async (startdate, enddate,agentname) => {
  try {
    const response = await api.post('/get_agentnamelist_admin', {
      startdate, enddate,agentname
    });
    return response.data;
  } catch (error) {
    console.error('Get agent list error:', error);
    throw error;
  }
};

export const updateAgentDetails = async (agentData) => {
  try {
    const response = await api.post('/updateAgentDetails', agentData);
    return response.data;
  } catch (error) {
    console.error('Error updating agent details:', error);
    throw error;
  }
};


export const getAgentListByUId = async (userId, agentId) => {
  try {
    const response = await api.get('/getAgentDoc-approvals', {
      params: {
        UId: userId,
        AgentId: agentId
      }
    });
    return response.data;
  } catch (error) {
    console.error('Get agent documents error:', error);
    throw error;
  }
};


export const updateAgentApproval = async (approvalData) => {
  try {

    const response = await api.post('/update-approval', approvalData);
    return response.data;
  } catch (error) {
    console.error('Update approval error:', error);
    throw error;
  }
};

// Example error handling wrapper
export const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    return error.response.data.message || 'Server error occurred';
  } else if (error.request) {
    // The request was made but no response was received
    return 'No response from server';
  } else {
    // Something happened in setting up the request
    return 'Error in request setup';
  }
};


// Agent PremiumIncluding

export const calculatePremiumIncluding = async (premiumData) => {
  try {
    const response = await api.post('/getPremium-including', premiumData);
    return response.data;
  } catch (error) {
    console.error('Calculate premium error:', error);
    throw error;
  }
};

export const calculatePremiumExcluding = async (premiumData) => {
  try {
    const response = await api.post('/getPremium-excluding', premiumData);
    return response.data;
  } catch (error) {
    console.error('Calculate premium error:', error);
    throw error;
  }
};

export const getAgentSummary = async (agentId) => {
  try {
    const response = await api.get('/agent-summary', {
      params: { agentId }
    });
    return response.data;
  } catch (error) {
    console.error('Get agent summary error:', error);
    throw error;
  }
};

export const createProposal = async (proposalData) => {
  try {
    const response = await api.post('/proposal-create', proposalData);
    return response.data;
  } catch (error) {
    console.error('Create proposal error:', error);
    throw error;
  }
};

// In your api.js
export const getProposalByPassport = async (passportNo) => {
  try {
    const response = await api.post('/proposal-getByPassportNo', {
      passportpassportno: passportNo
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal:', error);
    throw error;
  }
};

// New function to call Reliance validation API

// Replace this function in your api.js file (document #9)

export const validatePolicyWithReliance = async (data) => {
  try {
    // Add a retry mechanism for reliability
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Attempt ${attempts} to call Reliance API`);

        const response = await api.post('/proxy-reliance-validation', data);
        return response.data;
      } catch (error) {
        if (attempts >= maxAttempts) {
          // If we've reached max attempts, throw the error
          throw error;
        }

        // Wait before retrying (exponential backoff)
        const delay = 1000 * attempts; // 1s, 2s
        console.log(`Retrying after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  } catch (error) {
    console.error('Error validating policy with Reliance:', error);

    // Return a default response structure even in case of error
    // This allows the application flow to continue
    return {
      Status: 'Error',
      Message: error.message || 'Failed to connect to Reliance API',
      CustomerDetails: [{
        WebServiceReturnStatus: 'Error',
        ErrorCode: error.code || 'CONNECTION_ERROR',
        Error_Message: error.message || 'Failed to connect to Reliance API',
        PaxId: `PaxId-${Date.now()}`,
        CertificateNumber: `TEMP-${Date.now()}`,
        DownloadFilePath: ''
      }],
      PSONumber: `PSO-${Date.now()}`
    };
  }
};

// Function to get proposal details by agent ID
export const getProposalDetailsByAgent = async (agentId, paymentStatus) => {
  try {
    const response = await api.post('/getProposalDetailsByAgent', {
      agentId,
      paymentStatus
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal details:', error);
    throw error;
  }
};

// New function to apply wallet payment
export const applyWalletPayment = async (paymentData) => {
  try {
 //   console.log('Sending payment data to API:', paymentData);

    // Use api instance with proper headers and base URL
    const response = await api.post('/insertBatchPayment', paymentData);

 //   console.log('API response received:', response.data);

    // Return the data from the response
    return response.data;
  } catch (error) {
    console.error('Error details:', error.response || error);
    throw error;
  }
};

export const getBatchPaymentsByStatus = async (status) => {
  try {
    const response = await api.post('/getBatchPaymentsByStatus', { status });
    return response.data;
  } catch (error) {
    console.error('Error fetching batch payments:', error);
    throw error;
  }
};

// Function to update batch payment status and UTR
export const updateBatchPayment = async (paymentData) => {
  try {
    const response = await api.post('/updateBatchPayment', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error updating batch payment:', error);
    throw error;
  }
};


export const getAgentById = async (agentId) => {
  try {
    const response = await api.post('/get_agentbyagentid', {
      agentId
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching agent details:', error);
    throw error;
  }
};


export const ApplyWalletBalance = async (walletData) => {
  try {
    const response = await api.post('/Apply-wallet-balance', walletData);
    return response.data;
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    throw error;
  }
};

export const getWalletApplications = async () => {
  try {
    const response = await api.get('/wallet-applications');
    return response.data;
  } catch (error) {
    console.error('Error fetching wallet applications:', error);
    throw error;
  }
};

export const processWalletApplication = async (applicationData) => {
  try {
    const response = await api.post('/process-wallet-application', applicationData);
    return response.data;
  } catch (error) {
    console.error('Error processing wallet application:', error);
    throw error;
  }
};

//update proposal

export const getUpdateProposalDetailsByAgent = async (agentId, paymentStatus) => {
  try {
    const response = await api.post('/getUpdateProposalDetailsByAgent', {
      agentId,
      paymentStatus
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal details:', error);
    throw error;
  }
};


export const getProposalDetailsByEmployee = async (empId, startdate, enddate) => {
  try {
    const response = await api.post('/getProposalDetailsByEmployee', {
      empId, startdate, enddate
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal details:', error);
    throw error;
  }
};


export const getProposalMIS = async (startdate, enddate, empId, agentId) => {
  try {
    const response = await api.post('/getProposalMIS', {
      startdate, enddate, empId, agentId
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal details:', error);
    throw error;
  }
};

export const getProposalTDS = async (startdate, enddate, empId, agentId) => {
  try {
    const response = await api.post('/getProposalTDS', {
      startdate, enddate, empId, agentId
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal details:', error);
    throw error;
  }
};



export const getPolicyDetailsbyPolicyno = async (Policyno) => {
  try {
    const response = await api.post('/getPolicyDetailsbyPolicyno', {
      Policyno
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching policy details:', error);
    throw error;
  }
};

export const updateProposal_policy = async (paymentData) => {
  try {
    const response = await api.post('/updateProposal_policy', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error updating batch payment:', error);
    throw error;
  }
};

// New RazorPay-related functions
export const addRazorpayData = async (paymentData) => {
  try {
    // Log the request data for debugging
  //  console.log("Sending to Razorpay API:", paymentData);

    try {
      const response = await api.post('/Addtorazorpaydata', paymentData);
  //    console.log("API Response:", response);
      return response;
    } catch (localApiError) {
      console.error("Error in addRazorpayData:", localApiError);

      // If our API call fails, return an appropriate error response
      return {
        data: {
          Status: "Failure",
          Message: localApiError.message || "Error processing payment",
          MasterData: null
        }
      };
    }
  } catch (error) {
    console.error("Error in addRazorpayData:", error);
    throw error;
  }
};

export const getPaymentStatus = async (policyNo) => {
  try {
    const response = await api.get(`/getPaymentStatus/${policyNo}`);
    return response.data;
  } catch (error) {
    console.error('Error getting payment status:', error);
    throw error;
  }
};

export const generateInvoicePdf = async (policyNo) => {
  try {
    const response = await api.post(`/generateInvoicePdf`, { certificateId: policyNo });
    return response.data;
  } catch (error) {
    console.error('Error getting payment status:', error);
    throw error;
  }
};

// Add this function to your existing api.js exports
export const sendOtp = async (data) => {
  try {
    // Basic input validation
    if (!data.email || !data.agentId) {
      throw new Error('Email and agentId are required');
    }

    // Make API call to send OTP
    const response = await api.post('/sendOtp', {
      email: data.email,
      agentId: data.agentId
    });

   // console.log('OTP send response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

// Add this function for OTP verification (for future use)
export const verifyOtp = async (data) => {
  try {
    const response = await api.post('/verifyOtp', {
      email: data.email,
      otp: data.otp,
      agentId: data.agentId
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

// Add this function for OTP resend (for future use)
export const resendOtp = async (data) => {
  try {
    const response = await api.post('/resendOtp', {
      email: data.email,
      agentId: data.agentId
    });
    return response.data;
  } catch (error) {
    console.error('Error resending OTP:', error);
    throw error;
  }
};

// In api.js, replace the existing generateWelcomeLetter function with this:

export const checkCertificate = async (policyNumber) => {
  try {
    const response = await api.post('/certificate-check', { policyNumber });
    return response.data;
  } catch (error) {
    console.error('Certificate check error:', error);
    throw error;
  }
};

// Update the existing welcome letter generation function
export const generateWelcomeLetter = async (formData) => {
  try {
    // Single API call that handles both certificate check and welcome letter generation
    const response = await api.post('/welcome-letter', formData);

    // Handle different response formats
    // Check if we have response.data.Data or response.data.MasterData
    if (response.data?.Data) {
      return {
        data: {
          Status: response.data.Status,
          Message: response.data.Message,
          Data: response.data.Data
        }
      };
    } else if (response.data?.MasterData) {
      // Convert MasterData format to Data format for consistency
      return {
        data: {
          Status: response.data.Status,
          Message: response.data.Message,
          Data: response.data.MasterData
        }
      };
    } else {
      // Fallback for unexpected response format
      console.warn('Unexpected response format:', response.data);
      return response;
    }
  } catch (error) {
    console.error('Welcome letter generation error:', error);
    throw error;
  }
};

export const getWelcomeLetterByCustomerId = async (customerId) => {
  try {
    const response = await api.get(`/welcome-letter/${customerId}`);
    return response;
  } catch (error) {
    console.error('Get welcome letter error:', error);
    throw error;
  }
};

export const verifyPanpro = async (panNumber, fullName) => {
  try {
    const response = await api.post('/verify-pan-pro', {
      pan_number: panNumber,
      pan_holder_name: fullName
    });

    return response.data;


  } catch (error) {
    console.error('PAN verification error:', error);
    throw error;
  }
};


export const generatePolicybyPolicyno = async (data) => {
  try {
  //  console.log("Generating policy with data:", data);
    // Changed from GET to POST to match your backend route
    const response = await api.post('/generatePolicybyPolicyno', {
      Policyno: data.Policyno
    });
  //  console.log("Policy generation response:", response.data);
    return response.data;
  } catch (error) {
    console.error('Policy generation error:', error);
    throw error;
  }
};

export const checkEmailDuplicate = async (email) => {
  try {
    const response = await api.post('/check-email-duplicate', { email });
    return response.data;
  } catch (error) {
    console.error('Error checking email duplicate:', error);
    throw error;
  }
};

export const checkMobileDuplicate = async (mobile) => {
  try {
    const response = await api.post('/check-mobile-duplicate', { mobile });
    return response.data;
  } catch (error) {
    console.error('Error checking mobile duplicate:', error);
    throw error;
  }
};

export const cancelpolicy = async (cancelData) => {
  try {
    const response = await api.post('/cancel-policy', cancelData);
    return response.data;
  } catch (error) {
    console.error('Error cancel payment:', error);
    throw error;
  }
};


export const createPractoSubscription = async (payload) => {
  try {
    // This uses the 'api' instance you already configured with axios
    const response = await api.post('/create-practo-subscription', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating Practo subscription:', error);
    // Re-throw the error so the component's catch block can handle it and show a message
    throw error;
  }
};




//PRACTO

export const createPractoProposal = async (ProposalData) => {
  try {
    // This uses the 'api' instance you already configured with axios
    const response = await api.post('/createPractoProposal', ProposalData);
    return response.data;
  } catch (error) {
    console.error('Error creating Practo Proposal:', error);
    // Re-throw the error so the component's catch block can handle it and show a message
    throw error;
  }
};

export const updatePractoProposalWallet = async (payload) => {
  try {
    const response = await api.post('/update-practo-proposal-wallet', payload);
    return response.data;
  } catch (error) {
    console.error('Error updating Practo proposal wallet:', error);
    throw error;
  }
};


export const getPractoPremium = async (agentId) => {
  try {
    const response = await api.post('/getPractoPremium', {
      AgentId: agentId
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Practo premium details:', error);
    throw error;
  }
};


export const getPractoPlan = async () => {
  try {
    const response = await api.post('/getPractoPlan');
    return response.data;
  } catch (error) {
    console.error('Error fetching Practo premium details:', error);
    throw error;
  }
};


export const generateInvoicePractoPdf = async (Practo_proposal_id) => {
  try {
    const response = await api.post('/generateInvoicePractoPdf', {
      Practo_proposal_id: Practo_proposal_id
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching InvoicePractoPdf:', error);
    throw error;
  }
};

export const getProposalDetailsByAgent_Practo = async (agentId, paymentStatus) => {
  try {
    const response = await api.post('/getProposalDetailsByAgent_Practo', {
      agentId,
      paymentStatus
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal details:', error);
    throw error;
  }
};

//AyushPay


export const createAyushPayProposal = async (ProposalData) => {
  try {
    // This uses the 'api' instance you already configured with axios
    const response = await api.post('/createAyushPayProposal', ProposalData);
    return response.data;
  } catch (error) {
    console.error('Error creating Practo Proposal:', error);
    // Re-throw the error so the component's catch block can handle it and show a message
    throw error;
  }
};


// FIX: Replaced broken recursive function with correct API call
export const checkAyushDuplicate = async (mobile, email) => {
  try {
    const response = await api.post('/checkAyushDuplicate', { mobile, email });
    return response.data;
  } catch (error) {
    console.error('Error checking duplicate:', error);
    throw error;
  }
};

export const updateAyushProposalWallet = async (payload) => {
  try {
    const response = await api.post('/update-ayush-proposal-wallet', payload);
    return response.data;
  } catch (error) {
    console.error('Error updating Ayush proposal wallet:', error);
    throw error;
  }
};



export const generateInvoiceAyushPayPdf = async (Ayush_id) => {
  try {
    const response = await api.post('/generateInvoiceAyushPayPdf', {
      Ayush_id: Ayush_id
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching InvoicePractoPdf:', error);
    throw error;
  }
};

export const getProposalDetailsByAgent_AyushPay = async (agentId, paymentStatus) => {
  try {
    const response = await api.post('/getProposalDetailsByAgent_AyushPay', {
      agentId,
      paymentStatus
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal details:', error);
    throw error;
  }
};

export const getAyushPayPremium = async (agentId) => {
  try {
    const response = await api.post('/getAyushPayPremium', {
      AgentId: agentId
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Practo premium details:', error);
    throw error;
  }
};


// New function to apply wallet payment
export const applyWalletPayment_Practo = async (paymentData) => {
  try {
 //   console.log('Sending payment data to API:', paymentData);

    // Use api instance with proper headers and base URL
    const response = await api.post('/insertBatchPayment_Practo', paymentData);

//    console.log('API response received:', response.data);

    // Return the data from the response
    return response.data;
  } catch (error) {
    console.error('Error details:', error.response || error);
    throw error;
  }
};


export const getBatchPaymentsByStatus_Practo = async (status) => {
  try {
    const response = await api.post('/getBatchPaymentsByStatus_Practo', { status });
    return response.data;
  } catch (error) {
    console.error('Error fetching batch payments:', error);
    throw error;
  }
};

// Function to update batch payment status and UTR
export const updateBatchPayment_Practo = async (paymentData) => {
  try {
    const response = await api.post('/updateBatchPayment_Practo', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error updating batch payment:', error);
    throw error;
  }
};

export const getProposalMIS_Practo = async (startdate, enddate, empId, agentId) => {
  try {
    const response = await api.post('/getProposalMIS_Practo', {
      startdate, enddate, empId, agentId
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal details:', error);
    throw error;
  }
};

export const getProposalTDS_Practo = async (startdate, enddate, empId, agentId) => {
  try {
    const response = await api.post('/getProposalTDS_Practo', {
      startdate, enddate, empId, agentId
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal details:', error);
    throw error;
  }
};


export const fetchSubAgentsList = async (agentId) => {
  try {
  
    const response = await api.get('/subagents_listByagent', {
      params: { agentId: agentId }
    });
  //  console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};


export const getProposalMIS_SubAgent = async (startdate, enddate, empId, agentId) => {
  try {
    const response = await api.post('/getProposalMIS_SubAgent', {
      startdate, enddate, empId, agentId
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal details:', error);
    throw error;
  }
};

export const getProposalTDS_SubAgent = async (startdate, enddate, empId, agentId) => {
  try {
    const response = await api.post('/getProposalTDS_SubAgent', {
      startdate, enddate, empId, agentId
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal details:', error);
    throw error;
  }
};



export const getSub_Main_AgentMIS_byAdmin = async (startdate, enddate, empId, agentId) => {
  try {
    const response = await api.post('/getSub_Main_AgentMIS_byAdmin', {
      startdate, enddate, empId, agentId
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal details:', error);
    throw error;
  }
};

export const applyWalletPayment_AyushPay = async (paymentData) => {
  try {
 //   console.log('Sending payment data to API:', paymentData);

    // Use api instance with proper headers and base URL
    const response = await api.post('/insertBatchPayment_AyushPay', paymentData);

//    console.log('API response received:', response.data);

    // Return the data from the response
    return response.data;
  } catch (error) {
    console.error('Error details:', error.response || error);
    throw error;
  }
};

export const getProposalMIS_AyushPay = async (startdate, enddate, empId, agentId) => {
  try {
    const response = await api.post('/getProposalMIS_AyushPay', {
      startdate, enddate, empId, agentId
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal details:', error);
    throw error;
  }
};


export default api;