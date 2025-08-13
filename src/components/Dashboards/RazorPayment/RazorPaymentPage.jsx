import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Home, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import { logout } from '../../../services/auth';
import { getPolicyDetailsbyPolicyno, generateInvoicePdf, generatePolicybyPolicyno } from '../../../services/api';
import logo from '../../../../src/assets/img/TravelAssist.webp';

// Create a ConfirmationDialog component
const ConfirmationDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div style={dialogStyles.overlay}>
      <div style={dialogStyles.dialogContainer}>
        <h3 style={dialogStyles.title}>{title}</h3>
        <p style={dialogStyles.message}>{message}</p>
        <div style={dialogStyles.buttonContainer}>
          <button
            style={dialogStyles.cancelButton}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            style={dialogStyles.confirmButton}
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Full Screen Loader Component
const FullScreenLoader = ({ message = "Processing, please wait..." }) => {
  return (
    <div style={loaderStyles.overlay}>
      <div style={loaderStyles.content}>
        <div style={loaderStyles.spinner}></div>
        <p style={loaderStyles.message}>{message}</p>
      </div>
    </div>
  );
};

const RazorPaymentPage = ({ userData = null, onLogout = () => { } }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [policyDetails, setPolicyDetails] = useState(null);
  const [error, setError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [userProfile, setUserProfile] = useState(() => {
    const savedProfile = localStorage.getItem('userData');
    return savedProfile ? JSON.parse(savedProfile) : userData;
  });

  // This useEffect was incorrectly placed at the top level
  // Moving it inside the component to fix the error
  useEffect(() => {
    // Create and add a style element with the needed CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .payment-option-disabled {
        position: relative;
      }
      
      .payment-option-disabled::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(240, 240, 240, 0.4);
        z-index: 2;
        pointer-events: none;
        border-radius: 8px;
      }
    `;
    document.head.appendChild(styleElement);

    // Clean up function to remove the style element when component unmounts
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    const fetchPolicyData = async () => {
      try {
        // Get certificate number from session storage or URL parameters
        const storedInsuranceData = sessionStorage.getItem('insuranceData');
        let certificateNumber = '';

        if (storedInsuranceData) {
          const parsedData = JSON.parse(storedInsuranceData);
          certificateNumber = parsedData.certificateNumber || '';
        }

        // If no certificate number found, redirect to dashboard
        if (!certificateNumber) {
          navigate('/dashboard');
          return;
        }

        // Fetch policy details using the API
        const apiResponse = await getPolicyDetailsbyPolicyno(certificateNumber);

        if (apiResponse?.Status === "Success" && apiResponse?.MasterData?.proposals &&
          apiResponse.MasterData.proposals.length > 0) {

          const policyData = apiResponse.MasterData.proposals[0];
          setPolicyDetails(policyData);

          // Store the complete policy details in session storage for use in other components
          sessionStorage.setItem('policyDetails', JSON.stringify(policyData));

          setLoading(false);
        } else {
          setError('Policy details not found. Please try again or contact support.');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching policy details:', error);
        setError('Failed to load policy details. Please try again later.');
        setLoading(false);
      }
    };

    fetchPolicyData();
  }, [navigate]);

  const handleOnlinePaymentClick = async () => {
    if (policyDetails) {
      try {
        // Create payment data object with all necessary details from policy
        const paymentData = {
          paymentType: 'online',
          certificateNumber: policyDetails.Policy_No,
          fullName: `${policyDetails.FirstName || ''} ${policyDetails.MiddleName || ''} ${policyDetails.LastName || ''}`.trim(),
          email: policyDetails.EmailID || '',
          mobile: policyDetails.MobileNumber || '',
          radiobtn_selectedAmount: policyDetails.PremiumAmount || '',
          radiobtn_selectedOption: policyDetails.Payment_Mode || '',
          AgentId: policyDetails.AgentId || '',
          policyStartDate: policyDetails.PolicyStartDate || '',
          policyEndDate: policyDetails.PolicyEndDate || '',
          proposal_id: policyDetails.proposal_id || '',
          walletAmount: policyDetails.Wallet_Amount || 0
        };

        // Store payment data in session storage
        sessionStorage.setItem('paymentData', JSON.stringify(paymentData));

        // Navigate to payment input page
        navigate('/RazorPayment_input');
      } catch (error) {
        console.error('Error preparing payment data:', error);
        setError('Failed to prepare payment data. Please try again.');
      }
    }
  };

  const handleWalletPaymentClick = () => {

    // Show custom confirmation dialog
    setShowConfirmDialog(true);

  };

  const handleConfirmWalletPayment = async () => {
    try {
      // Close the dialog
      setShowConfirmDialog(false);

      // Show the processing loader
      setProcessingPayment(true);

      // First call generatePolicybyPolicyno API
      const policyNo = policyDetails.Policy_No;

      try {
        // Call the generatePolicybyPolicyno API function from api.js
        const generatePolicyResponse = await generatePolicybyPolicyno({
          Policyno: policyNo
        });

        console.log("Policy generation response:", generatePolicyResponse);

        if (generatePolicyResponse?.Status !== "Success") {
          throw new Error("Failed to generate policy");
        }
      } catch (generatePolicyError) {
        console.error("Error generating policy:", generatePolicyError);
        setError("Failed to generate policy. Please try again.");
        setProcessingPayment(false);
        // Continuing to invoice generation even if policy generation fails
        // This matches your current behavior in paste-2.txt (line 153)
      }

      // Then generate the invoice PDF
      try {
        const invoiceResponse = await generateInvoicePdf(policyNo);

        if (invoiceResponse?.Status === "Success") {
          console.log("Invoice generated successfully:", invoiceResponse);
          // Navigate to wallet payment page
          setProcessingPayment(false);
          // navigate('/wallet'); // Go to dashboard
          navigate('/dashboard');
        } else {
          console.error("Failed to generate invoice:", invoiceResponse);
          setError("Failed to generate invoice. Please try again.");
          setProcessingPayment(false);
        }
      } catch (invoiceError) {
        console.error("Error generating invoice:", invoiceError);
        setError("Failed to generate invoice. Please try again.");
        setProcessingPayment(false);
      }
    } catch (error) {
      console.error('Error during wallet payment process:', error);
      setError('Failed to process wallet payment. Please try again.');
      setProcessingPayment(false);
    }
  };

  const handleLogout = () => {
    try {
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

  // Format full name from policy details
  const fullName = `${policyDetails.FirstName || ''} ${policyDetails.MiddleName || ''} ${policyDetails.LastName || ''}`.trim();

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <img src={logo} alt="Travel Assist" style={styles.logo} />
          <div style={styles.centerTitle}>
            <span style={styles.titleText}>Travel Assistance Service</span>
          </div>
          <div style={styles.navButtons}>
            <button
              onClick={() => navigate('/dashboard')}
              style={styles.button}
            >
              <Home size={18} />
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              style={{
                ...styles.button,
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
      <main style={styles.mainContent}>
        <div style={styles.card}>
          <div style={styles.paymentHeader}>
            <h2 style={styles.paymentTitle}>Select Payment Method</h2>
          </div>

          <div style={styles.detailsContainer}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Full Name:</span>
              <span style={styles.detailValue}>{fullName}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Certificate Number:</span>
              <span style={styles.detailValue}>{policyDetails.Policy_No}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Payment Mode:</span>
              <span style={styles.detailValue}>{policyDetails.Payment_Mode || "Not specified"}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Premium Amount:</span>
              <span style={styles.detailValue}>₹{policyDetails.PremiumAmount || "Not available"}</span>
            </div>

            {/* Display more policy details */}
            {policyDetails.PolicyStartDate && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Policy Period:</span>
                <span style={styles.detailValue}>
                  {new Date(policyDetails.PolicyStartDate).toLocaleDateString()} to {new Date(policyDetails.PolicyEndDate).toLocaleDateString()}
                </span>
              </div>
            )}

            {policyDetails.Wallet_Amount && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Wallet Balance:</span>
                <span style={styles.detailValue}>₹{policyDetails.Wallet_Amount}</span>
              </div>
            )}
          </div>

          <div style={styles.paymentOptions}>

            <div
              style={{
                ...styles.paymentOption,
                opacity: 0.3,
                cursor: 'not-allowed',
                pointerEvents: 'none',
                backgroundColor: '#f9fafb',
                filter: 'grayscale(80%)'
              }}

            >
              <CreditCard size={48} color="#d1d5db" />
              <h3 style={{ color: "#6b7280" }}>Online Payment</h3>
              <p style={{ color: "#9ca3af" }}>
                Pay securely using credit/debit card, UPI, net banking and more
              </p>
              <div style={{
                marginTop: '12px',
                color: '#f87171',
                fontSize: '13px',
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                Online payment is not available for this payment mode.
              </div>
            </div>


            <div
              onClick={handleWalletPaymentClick}
              style={{
                ...styles.paymentOption,
                cursor: 'pointer'  // Always clickable
              }}
            >
              <Wallet size={48} color="#6c63ff" />
              <h3>Wallet Payment</h3>
              <p>Pay using your existing wallet balance
                {policyDetails.Wallet_Amount ? ` (₹${policyDetails.Wallet_Amount})` : ''}
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
      </footer>

      {/* Custom Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        title="Payment Deducted Successfully"
        message={`₹${policyDetails?.PremiumAmount || 0} has been deducted from your wallet balance. Confirm to proceed with admin approval process.`}
        onConfirm={handleConfirmWalletPayment}
        onCancel={() => setShowConfirmDialog(false)}
      />

      {/* Full Screen Processing Loader */}
      {processingPayment && (
        <FullScreenLoader message="Processing your payment, please wait..." />
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#f3f4f6',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column'
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
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    height: '60px',
    width: 'auto',

  },
  centerTitle: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  titleText: {
    color: '#012970',
    fontSize: '26px',
    fontWeight: '700',
    fontFamily: '"Nunito", sans-serif'
  },
  navButtons: {
    display: 'flex',
    gap: '20px'
  },
  button: {
    backgroundColor: '#6c63ff',
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
    maxWidth: '800px',
    margin: '40px auto',
    padding: '0 20px',
    flex: '1 0 auto'
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  paymentHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '25px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '20px'
  },
  paymentTitle: {
    color: '#6c63ff',
    margin: 0,
    fontSize: '24px',
    fontWeight: '600'
  },
  detailsContainer: {
    marginBottom: '30px',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRow: {
    display: 'flex',
    borderBottom: '1px solid #f3f4f6',
    padding: '12px 0'
  },
  detailLabel: {
    fontWeight: '600',
    width: '200px',
    color: '#4b5563'
  },
  detailValue: {
    flex: 1,
    color: '#1f2937'
  },
  paymentOptions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
    marginTop: '30px'
  },
  paymentOption: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center'
  },
  footer: {
    background: '#6c63ff',
    color: 'white',
    padding: '1rem',
    textAlign: 'center',
    marginTop: 'auto'
  },
  errorContainer: {
    maxWidth: '500px',
    margin: '100px auto',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px'
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: '24px',
    margin: 0
  },
  errorMessage: {
    color: '#4b5563',
    margin: 0
  },
  errorButton: {
    backgroundColor: '#6c63ff',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '10px'
  },
  insufficientBalance: {
    marginTop: '10px',
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: '14px'
  }
};

const dialogStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialogContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  title: {
    margin: '0 0 16px 0',
    color: '#333',
    fontSize: '20px',
  },
  message: {
    margin: '0 0 24px 0',
    color: '#555',
    fontSize: '16px',
    lineHeight: '1.5',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#f1f1f1',
    color: '#333',
    cursor: 'pointer',
    fontSize: '14px',
  },
  confirmButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#6c63ff',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

// Moved these styles inside the component to avoid duplication
const loaderStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001, // Higher than dialog
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    maxWidth: '300px',
    width: '90%',
    textAlign: 'center',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #6c63ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  message: {
    fontSize: '16px',
    color: '#333',
    margin: 0,
  }
};

export default RazorPaymentPage;