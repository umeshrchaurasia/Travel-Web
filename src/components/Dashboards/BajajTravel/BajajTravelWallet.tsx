import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Home, CreditCard, Wallet, AlertTriangle, ArrowLeftCircle, CheckCircle } from 'lucide-react';
import { logout } from '../../../services/auth';

import logo from '../../../../src/assets/img/TravelAssist.webp';
import { generateBajajInvoicePdf, generatePolicybyPolicyno_bajaj } from '../../../services/api';

import './BajajTravel.css'; // Uses the same CSS for header and layout

// --- 1. CONFIRMATION DIALOG COMPONENT ---
const ConfirmationDialog = ({ isOpen, title, message, onConfirm, onCancel }: any) => {
  if (!isOpen) return null;
  return (
    <div style={dialogStyles.overlay}>
      <div style={dialogStyles.dialogContainer}>
        <h3 style={dialogStyles.title}>{title}</h3>
        <p style={dialogStyles.message}>{message}</p>
        <div style={dialogStyles.buttonContainer}>
          <button style={dialogStyles.cancelButton} onClick={onCancel}>Cancel</button>
          <button style={dialogStyles.confirmButton} onClick={onConfirm}>Confirm Payment</button>
        </div>
      </div>
    </div>
  );
};

// --- 2. FULL SCREEN LOADER COMPONENT ---
const FullScreenLoader = ({ message = "Processing your payment, please wait..." }: any) => {
  return (
    <div style={loaderStyles.overlay}>
      <div style={loaderStyles.content}>
        <div style={loaderStyles.spinner}></div>
        <p style={loaderStyles.message}>{message}</p>
      </div>
    </div>
  );
};

// --- 3. MAIN COMPONENT ---
const BajajTravelWallet = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  // Retrieve data passed from BajajTravelProposal.tsx
  const [paymentData, setPaymentData] = useState<any>(null);
  const [policyNo, setpolicyNo] = useState<any>(null);

  useEffect(() => {
    // Check for navigation state or session storage
     //12-9911-0009392888-00

    const stateData = location.state;
    const storedString = sessionStorage.getItem('bajajPaymentData');


    if (stateData) {
      setPaymentData(stateData);
      setpolicyNo(stateData.policyNo);
      setLoading(false);
    } else if (storedString) {
      const parsedData = JSON.parse(storedString);
      setPaymentData(parsedData);
      setpolicyNo(stateData.policyNo);
      setLoading(false);
    } else {
      // If no data is found, redirect back to calculator
    //  navigate('/BajajTravel');
     setpolicyNo('12-9911-0009392888-00');
     setLoading(false);
    }

   
  }, [location, navigate]);

  // --- HANDLERS ---
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    logout();
    navigate('/login');
  };

  const handleWalletPaymentClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmWalletPayment = async () => {
    try {
      // Close the dialog
      setShowConfirmDialog(false);

      // Show the processing loader
      setProcessingPayment(true);
      if (!policyNo) {
        setError("Policy number not found. Please go back and regenerate.");
        setProcessingPayment(false);
        return;
      }
      // First call generatePolicybyPolicyno API


      try {
        // Call the generatePolicybyPolicyno API function from api.js
      
        const generatePolicyResponse = await generatePolicybyPolicyno_bajaj({
          Policyno: policyNo
        });

        if (generatePolicyResponse?.Status === "Success") {
          // Trigger the Success UI Screen
          setSuccessData({
            PolicyNo: policyNo,
            StartDate: paymentData?.payload?.StartDate,
            EndDate: paymentData?.payload?.EndDate,
            FinalPremium: paymentData?.amount
          });
        } else {
          setError(generatePolicyResponse?.Message || "Failed to generate policy");
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

              console.log("[UI] Sending Calculate Payload:", JSON.stringify(policyNo));

        const invoiceResponse = await generateBajajInvoicePdf(policyNo);

        if (invoiceResponse?.Status === "Success") {
          console.log("Invoice generated successfully:", invoiceResponse);
          // Navigate to wallet payment page
          setProcessingPayment(false);
          // navigate('/wallet'); // Go to dashboard
          navigate('/GenerateCOI_bajaj');
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

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
            <button autoFocus onClick={handleLogout} className="logout-button">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content-b" style={{ maxWidth: '800px', margin: '40px auto' }}>

        {/* SUCCESS SCREEN */}
        {successData ? (
          <div style={{ padding: '40px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center', animation: 'fadeIn 0.5s' }}>
            <CheckCircle size={64} color="#059669" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ color: '#047857', fontSize: '28px', fontWeight: 'bold', marginBottom: '15px' }}>Payment Successful!</h2>
            <p style={{ color: '#4b5563', fontSize: '16px', marginBottom: '30px' }}>Your wallet has been deducted and the policy has been successfully issued.</p>

            <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '8px', textAlign: 'left', marginBottom: '30px', display: 'grid', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontWeight: '500' }}>Policy Number:</span>
                <span style={{ color: '#1f2937', fontWeight: 'bold' }}>{successData.PolicyNo}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontWeight: '500' }}>Coverage Period:</span>
                <span style={{ color: '#1f2937', fontWeight: 'bold' }}>{successData.StartDate} to {successData.EndDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontWeight: '500' }}>Premium Paid:</span>
                <span style={{ color: '#059669', fontWeight: 'bold' }}>₹{successData.FinalPremium}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button onClick={() => navigate('/GenerateCOI')} style={{ padding: '12px 24px', backgroundColor: '#6c63ff', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Download Policy / View COI
              </button>
              <button onClick={() => navigate('/BajajTravel')} style={{ padding: '12px 24px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Create New Proposal
              </button>
            </div>
          </div>
        ) : (

          /* PAYMENT SELECTION SCREEN */
          <div style={{ background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '20px', marginBottom: '25px' }}>
              <h2 style={{ color: '#1f2937', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Select Payment Method</h2>
              <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: '500' }}>
                <ArrowLeftCircle size={18} /> Back to Proposal
              </button>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '15px', borderRadius: '8px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={20} />
                <span style={{ fontWeight: '500' }}>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: '30px' }}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Proposer Name:</span>
                <span style={styles.detailValue}>{paymentData?.proposerName}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Policy Number:</span>
                <span style={styles.detailValue} className="font-mono text-indigo-600 font-bold">{paymentData?.policyNo}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Plan Details:</span>
                <span style={styles.detailValue}>{paymentData?.planName} ({paymentData?.days} Days)</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Premium Amount:</span>
                <span style={{ ...styles.detailValue, color: '#059669', fontWeight: 'bold', fontSize: '18px' }}>
                  ₹{paymentData?.amount}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
              {/* Online Payment (Disabled) */}
              <div style={{ flex: 1, padding: '25px 15px', border: '1px solid #e5e7eb', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f9fafb', opacity: 0.6, cursor: 'not-allowed' }}>
                <CreditCard size={42} color="#9ca3af" style={{ margin: '0 auto 15px' }} />
                <h3 style={{ fontSize: '18px', color: '#6b7280', marginBottom: '10px', fontWeight: 'bold' }}>Online Payment</h3>
                <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '15px' }}>Pay securely using credit/debit card, UPI, or net banking</p>
                <span style={{ color: '#ef4444', fontSize: '12px', fontStyle: 'italic', fontWeight: '500' }}>Currently unavailable</span>
              </div>

              {/* Wallet Payment (Enabled) */}
              <div
                onClick={handleWalletPaymentClick}
                style={{ flex: 1, padding: '25px 15px', border: '2px solid #6c63ff', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f5f3ff', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(108, 99, 255, 0.1)' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Wallet size={42} color="#6c63ff" style={{ margin: '0 auto 15px' }} />
                <h3 style={{ fontSize: '18px', color: '#4c1d95', marginBottom: '10px', fontWeight: 'bold' }}>Wallet Payment</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '15px' }}>Pay instantly using your existing agent wallet balance</p>
                <span style={{ background: '#6c63ff', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>Pay ₹{paymentData?.amount}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="footer" style={{ backgroundColor: '#6c63ff', color: 'white', padding: '15px', textAlign: 'center', marginTop: 'auto' }}>
        <p style={{ margin: 0 }}>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
      </footer>

      {/* DIALOGS */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        title="Confirm Wallet Deduction"
        message={`Are you sure you want to deduct ₹${paymentData?.amount} from your wallet to issue this policy?`}
        onConfirm={handleConfirmWalletPayment}
        onCancel={() => setShowConfirmDialog(false)}
      />

      {processingPayment && (
        <FullScreenLoader message="Deducting wallet balance and issuing policy..." />
      )}
    </div>
  );
};

// --- STYLES ---
const styles = {
  detailRow: { display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '15px 0', alignItems: 'center' },
  detailLabel: { fontWeight: '600', width: '180px', color: '#4b5563', fontSize: '15px' },
  detailValue: { flex: 1, color: '#1f2937', fontSize: '15px' },
};

const dialogStyles = {
  overlay: { position: 'fixed' as 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  dialogContainer: { backgroundColor: 'white', borderRadius: '12px', padding: '25px', width: '90%', maxWidth: '420px', boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)' },
  title: { margin: '0 0 15px 0', color: '#1f2937', fontSize: '20px', fontWeight: 'bold' },
  message: { margin: '0 0 25px 0', color: '#4b5563', fontSize: '15px', lineHeight: '1.5' },
  buttonContainer: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  cancelButton: { padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', color: '#374151', cursor: 'pointer', fontWeight: '600' },
  confirmButton: { padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#6c63ff', color: 'white', cursor: 'pointer', fontWeight: '600' },
};

const loaderStyles = {
  overlay: { position: 'fixed' as 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001 },
  content: { display: 'flex', flexDirection: 'column' as 'column', alignItems: 'center', backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center' as 'center' },
  spinner: { width: '50px', height: '50px', border: '4px solid #f3f3f3', borderTop: '4px solid #6c63ff', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' },
  message: { fontSize: '16px', color: '#1f2937', margin: 0, fontWeight: '500' }
};

export default BajajTravelWallet;