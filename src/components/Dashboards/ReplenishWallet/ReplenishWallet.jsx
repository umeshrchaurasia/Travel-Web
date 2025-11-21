import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserCircle, Mail, BadgeCheck, LogOut, RefreshCw, Home, CreditCard, ArrowLeft,
  Check, X, Download, Upload, DollarSign, Clock, CheckCircle, XCircle, Wallet, Calendar
} from 'lucide-react';
import { logout } from '../../../services/auth';
import {
  getBatchPaymentsByStatus,
  updateBatchPayment,
  getWalletApplications,
  processWalletApplication
} from '../../../services/api';
import './ReplenishWallet.css';

import logo from '../../../../src/assets/img/TravelAssist.webp';

const ReplenishWallet = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get admin profile from localStorage
  const [adminProfile, setAdminProfile] = useState(() => {
    // First check if data was passed via navigation state
    if (location.state?.agentData) {
      return location.state.agentData;
    }

    // Then check if walletData exists in localStorage
    const savedWalletData = localStorage.getItem('walletData');
    if (savedWalletData) {
      return JSON.parse(savedWalletData);
    }

    // Finally fall back to userProfile
    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile ? JSON.parse(savedProfile) : {
      // Default admin data if nothing else is available
      UId: 'admin',
      EmailID: 'admin@example.com',
      FullName: 'Admin'
    };
  });

  const [batchPayments, setBatchPayments] = useState([]);
  const [walletApplications, setWalletApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [utrInputs, setUtrInputs] = useState({});
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    if (!dateString) return '';

    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Memoize fetchBatchPayments
  const fetchBatchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      console.log("Fetching batch payments with status: InProcess");
      const response = await getBatchPaymentsByStatus('InProcess');
      //    console.log("API Response:", response);

      if (response && response.Status === 'Success' && response.MasterData) {
        const payments = response.MasterData.payments || [];
        setBatchPayments(payments);

        // Initialize UTR inputs for each payment
        const initialUtrInputs = {};
        payments.forEach(payment => {
          initialUtrInputs[payment.Payment_Ref_No] = payment.UTR || '';
        });
        setUtrInputs(initialUtrInputs);
      } else {
        setError(response?.Message || 'Failed to fetch pending payments');
        setBatchPayments([]);
      }
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      setError(`Failed to fetch pending payments. ${error.message || ''}`);
      setBatchPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch wallet applications
  const fetchWalletApplications = useCallback(async () => {
    try {
      setLoadingApplications(true);

      console.log("Fetching wallet applications");
      const response = await getWalletApplications();
      //    console.log("Wallet Applications API Response:", response);

      if (response && response.Status === 'Success' && response.MasterData) {
        // Set applications with a small delay to ensure proper rendering
        const applications = response.MasterData || [];
        setWalletApplications(applications);
      } else {
        console.warn('No wallet applications found or error occurred:', response?.Message);
        setWalletApplications([]);
      }
    } catch (error) {
      console.error('Error fetching wallet applications:', error);
      setWalletApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  }, []);

  // Improved refresh data function
  const refreshData = useCallback(() => {
    setSuccessMessage('');
    setError('');

    // Force loading states to ensure proper UI updates
    setLoading(true);
    setLoadingApplications(true);

    // Fetch payment data
    fetchBatchPayments();

    // Fetch wallet applications with a small delay to ensure proper state update
    setTimeout(() => {
      fetchWalletApplications();
    }, 100);
  }, [fetchBatchPayments, fetchWalletApplications]);

  useEffect(() => {
    // Fetch both batch payments and wallet applications
    refreshData();

    // Handle back button
    const handleBackButton = (e) => {
      e.preventDefault();
      window.history.forward();
    };

    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [refreshTrigger, refreshData]);

  const handleLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();

      await logout();

      setTimeout(() => {
        // Use window.location for a hard redirect instead of navigate
        window.location.href = '/login';
      }, 100);
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, still redirect to login
      window.location.href = '/login';
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    refreshData();
  };

  const goBack = () => {
    navigate('/dashboard');
  };

  const handleUtrChange = (paymentRefNo, value) => {
    setUtrInputs(prev => ({
      ...prev,
      [paymentRefNo]: value
    }));
  };

  // Submit payment handler - button always enabled
  const handleSubmitPayment = async (payment) => {
    const utr = utrInputs[payment.Payment_Ref_No];

    if (!utr || !utr.trim()) {
      setError('UTR number is required for approval');
      return;
    }

    try {
      setProcessingPayment(true);
      setError('');
      setSuccessMessage('');

      // Prepare data for API
      const paymentData = {
        paymentRefNo: payment.Payment_Ref_No,
        newStatus: 'Approved',
        utr: utr.trim(),
        agentCode: payment.Agent_Code
      };

      //   console.log('Approving payment:', paymentData);

      // Call API to update status
      const response = await updateBatchPayment(paymentData);
      //    console.log('Approval response:', response);

      if (response && response.Status === 'Success') {
        setSuccessMessage(`Payment ${payment.Payment_Ref_No} approved successfully`);

        // Refresh the data immediately
        refreshData();
      } else {
        setError(response?.Message || 'Payment approval failed');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      setError(`Error processing payment. ${error.message || 'Please try again.'}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handlers for wallet applications
  const handleApproveApplication = async (application) => {
    if (processingPayment) return;

    const confirmApproval = window.confirm(`Are you sure you want to approve the wallet application for ${application.FullName}?`);
    if (!confirmApproval) return;

    try {
      setProcessingPayment(true);
      setError('');

      const response = await processWalletApplication({
        agentCode: application['Agent_Code'],
        status: 'Approved',
        adminComment: '',  // Empty comment
        amount: application['Apply Amount']
      });

      if (response && response.Status === 'Success') {
        setSuccessMessage(`Wallet application for ${application.FullName} approved successfully`);

        // Immediately set loading state to avoid flickering empty state
        setLoadingApplications(true);

        // Wait before refreshing to ensure the server has processed the change
        setTimeout(() => {
          // Do a full refresh to update all data
          fetchBatchPayments();
          fetchWalletApplications();
        }, 800);
      } else {
        setError(response?.Message || 'Failed to approve wallet application');
      }
    } catch (error) {
      console.error('Error approving wallet application:', error);
      setError(`Error processing approval. ${error.message || ''}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleRejectApplication = async (application) => {
    if (processingPayment) return;

    const confirmRejection = window.confirm(`Are you sure you want to reject the wallet application for ${application.FullName}?`);
    if (!confirmRejection) return;

    try {
      setProcessingPayment(true);
      setError('');

      const response = await processWalletApplication({
        agentCode: application['Agent_Code'],
        status: 'Rejected',
        adminComment: '',  // Default rejection comment
        amount: 0
      });

      if (response && response.Status === 'Success') {
        setSuccessMessage(`Wallet application for ${application.FullName} rejected successfully`);

        // Immediately set loading state to avoid flickering empty state
        setLoadingApplications(true);

        // Wait before refreshing to ensure the server has processed the change
        setTimeout(() => {
          // Do a full refresh to update all data
          fetchBatchPayments();
          fetchWalletApplications();
        }, 800);
      } else {
        setError(response?.Message || 'Failed to reject wallet application');
      }
    } catch (error) {
      console.error('Error rejecting wallet application:', error);
      setError(`Error processing rejection. ${error.message || ''}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Helper function to determine if data is truly empty
  const hasWalletApplications = walletApplications && Array.isArray(walletApplications) && walletApplications.length > 0;

  if (!adminProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading admin data...</p>
      </div>
    );
  }

  return (
    <div className="replenish-wallet-wrapper">
      <header className="coi-header">
        <div className="coi-header-content">
          <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
          <div className="d-flex justify-content-center py-4">
            <div className="logo d-flex align-items-center w-auto">
              <span className="page-title">Travel Assistance Service</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button
              onClick={goBack}
              className="coi-button"
            >
              <Home size={18} />
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="coi-button coi-logout-button"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <h1 className="wallet-title">Replenish Wallet</h1>

        {/* Admin Info Card */}
        <div className="card">
          <div className="wallet-info">
            <div className="wallet-balance">
              <div className="agent-info-card">
                <h2>Admin Information</h2>
                <div>
                  <p>
                    <strong>Admin ID:</strong> {adminProfile.UId || adminProfile.adminId}
                    <strong style={{ marginLeft: '20px' }}>Email:</strong> {adminProfile.email || adminProfile.EmailID}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="success-message">
            <Check className="w-5 h-5 inline-block mr-2" />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="error-message">
            <X className="w-5 h-5 inline-block mr-2" />
            {error}
          </div>
        )}

        {/* Pending Wallet Payments */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h3 className="proposal-title">Pending Wallet Payments</h3>
              <button onClick={handleRefresh} className="refresh-button">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <div className="loading-message">Loading pending payments...</div>
            ) : batchPayments.length === 0 ? (
              <div className="no-data-message">No pending payments found</div>
            ) : (
              <table className="proposals-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>Sr No</th>
                    <th style={{ width: '160px' }}>Payment Ref No</th>
                    <th style={{ width: '120px' }}>Agent Code</th>
                    <th style={{ width: '150px' }}>Agent Name</th>
                    <th style={{ width: '120px' }}>Wallet Amount</th>
                    <th style={{ width: '120px' }}>Policy Amount</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th style={{ width: '160px' }}>UTR</th>
                    <th style={{ width: '100px' }}>Action</th>
                    <th style={{ width: '120px' }}>Create Date</th>
                  </tr>
                </thead>
                <tbody>
                  {batchPayments.map((payment, index) => (
                    <tr key={payment.BatchNo || index}>
                      <td>{index + 1}</td>
                      <td>{payment.Payment_Ref_No}</td>
                      <td>{payment.Agent_Code}</td>
                      <td>{payment.FullName}</td>
                      <td>₹ {parseFloat(payment.Wallet_Amount || 0).toLocaleString()}</td>
                      <td>₹ {parseFloat(payment.Total_Amount || 0).toLocaleString()}</td>
                      <td>
                        <span className="status-badge inprocess">
                          <Clock size={10} className="status-icon in-process" />

                          <span>InProcess</span>
                        </span>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={utrInputs[payment.Payment_Ref_No] || ''}
                          onChange={(e) => handleUtrChange(payment.Payment_Ref_No, e.target.value)}
                          placeholder="Enter UTR number"
                          className="utr-input-table"
                          disabled={processingPayment}
                        />
                      </td>
                      <td>
                        {/* Always enabled submit button */}
                        <button
                          type="button"
                          className="submit-button"
                          onClick={() => handleSubmitPayment(payment)}
                          disabled={processingPayment}
                          style={{
                            backgroundColor: '#059669',
                            color: 'white',
                            cursor: 'pointer',
                            opacity: processingPayment ? '0.7' : '1'
                          }}
                        >
                          {processingPayment ? 'Processing...' : 'Submit'}
                        </button>
                      </td>
                      <td>{formatDate(payment.Create_Date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Wallet Applications Section */}
          <div className="section-divider wallet-section-title">
            <div className="section-title">
              <Wallet className="w-5 h-5 mr-2" />
              Apply Wallet Balance and Eligible Days Reset
            </div>
          </div>

          <div className="table-container wallet-applications-table">
            {loadingApplications ? (
              <div className="loading-message">Loading wallet applications...</div>
            ) : !hasWalletApplications ? (
              <div className="no-data-message">No wallet applications found</div>
            ) : (
              <table className="proposals-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>Sr No</th>
                    <th style={{ width: '120px' }}>Agent Code</th>
                    <th style={{ width: '180px' }}>Agent Name</th>
                    <th style={{ width: '150px' }}>Requested Amount</th>
                    <th style={{ width: '150px' }}>Current Balance</th>
                    <th style={{ width: '180px' }}>Application Date</th>
                    <th style={{ width: '160px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {walletApplications.map((application, index) => (
                    <tr key={`${application['Agent_Code']}-${index}`}>
                      <td>{index + 1}</td>
                      <td>{application['Agent_Code']}</td>
                      <td>{application['FullName']}</td>
                      <td>₹ {parseFloat(application['Apply Amount'] || 0).toLocaleString()}</td>
                      <td>₹ {parseFloat(application['Wallet Amount'] || 0).toLocaleString()}</td>
                      <td>{formatDateTime(application['Apply Date'])}</td>
                      <td>
                        <div className="action-buttons-container">
                          <button
                            className="approve-button"
                            onClick={() => handleApproveApplication(application)}
                            disabled={processingPayment}
                          >
                            <CheckCircle size={16} className="mr-1" />
                            Approve
                          </button>
                          <button
                            className="reject-button"
                            onClick={() => handleRejectApplication(application)}
                            disabled={processingPayment}
                          >
                            <X size={16} className="mr-1" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="action-container">
            <button className="back-btn" onClick={goBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back To Dashboard
            </button>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
      </footer>
    </div>
  );
};

export default ReplenishWallet;