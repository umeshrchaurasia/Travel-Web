// Updated wallet eligibility logic 
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserCircle, Mail, BadgeCheck, LogOut, RefreshCw, Home, CreditCard, ArrowLeft,
  Check, X, Download, Upload, DollarSign, Clock, CheckCircle, XCircle, Wallet, AlertTriangle
} from 'lucide-react';
import { logout } from '../../../services/auth';
import {
  getProposalDetailsByAgent_Practo,
  applyWalletPayment_Practo,
  getAgentById,

  PDF_BASE_URL // Import the new API function
} from '../../../services/api';
import './WalletPagePracto.css';
import logo from '../../../../src/assets/img/TravelAssist_practo.webp';

// Function to calculate remaining days and eligibility
const calculateRemainingDays = (walletUpdateDate, adminApprovedDate) => {
  // Default result object
  const defaultResult = {
    days: 0,
    isExpired: true,
    eligibleProposal: false,
    referenceDate: null
  };

  // If no dates are provided, return default result
  if (!walletUpdateDate && !adminApprovedDate) {
    return defaultResult;
  }

  // Determine which date to use (wallet update date or admin approved date)
  const referenceDate = walletUpdateDate ? new Date(walletUpdateDate) : new Date(adminApprovedDate);
  const currentDate = new Date();

  // Add 15 days to reference date to get expiry date
  const expiryDate = new Date(referenceDate);
  expiryDate.setDate(expiryDate.getDate() + 15);

  // Calculate difference in days
  const diffTime = expiryDate - currentDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Determine if wallet is eligible for creating proposals
  // UPDATED: If remaining days is less than or equal to 15, wallet is eligible
  // UPDATED: If remaining days is greater than 15, wallet is not eligible
  const isExpired = diffDays < 0;//const isExpired = diffDays > 15;
  const eligibleProposal = !isExpired;

  return {
    days: diffDays,
    isExpired: isExpired,
    eligibleProposal: eligibleProposal,
    referenceDate: referenceDate
  };
};

const WalletPagePracto = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get user profile either from location state or localStorage
  const [userProfile, setUserProfile] = useState(() => {
    if (location.state?.agentData) {
      return location.state.agentData;
    }

    const savedWalletData = localStorage.getItem('walletData');
    if (savedWalletData) {
      return JSON.parse(savedWalletData);
    }

    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile ? JSON.parse(savedProfile) : null;
  });

  // Get wallet status from location state or calculate it
  const [walletStatus, setWalletStatus] = useState(() => {
    if (location.state?.walletStatus) {
      return location.state.walletStatus;
    }

    // If wallet status is not provided, calculate it from user profile
    if (userProfile) {
      return calculateRemainingDays(
        userProfile.Wallet_Update_Date,
        userProfile.AdminApproved_Date
      );
    }

    return null;
  });

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedProposals, setSelectedProposals] = useState([]);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [totalWalletAmount, setTotalWalletAmount] = useState(userProfile?.Wallet_Amount ? parseFloat(userProfile.Wallet_Amount) : 25000);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Pending');
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Used to trigger refreshes

  // New states for COI generation
  const [generatingCOI, setGeneratingCOI] = useState(false);
  const [coiSuccess, setCoiSuccess] = useState('');
  const [coiError, setCoiError] = useState('');

  // New states for wallet recharge
  const [selectedWalletAmount, setSelectedWalletAmount] = useState('5000');
  const [submittingWallet, setSubmittingWallet] = useState(false);

  // Consolidated wallet state - replaces walletUpdateDate and remainingDays
  const [agentDetails, setAgentDetails] = useState({
    isLoading: true,
    error: null,
    data: null
  });

  // Fetch full agent details to ensure we have latest data
  const fetchAgentDetails = useCallback(async () => {
    // Skip if we don't have a valid agent ID
    if (!userProfile?.AgentId) return;

    setAgentDetails(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await getAgentById(userProfile.AgentId);

      if (response.Status === 'Success' && response.MasterData && response.MasterData.length > 0) {
        const agentData = response.MasterData[0];

        // Calculate wallet status
        const newWalletStatus = calculateRemainingDays(
          agentData.Wallet_Update_Date,
          agentData.AdminApproved_Date
        );

        // Update wallet status
        setWalletStatus(newWalletStatus);

        // Update agent details state
        setAgentDetails({
          isLoading: false,
          error: null,
          data: agentData
        });

        // Update wallet amount if different
        if (agentData.Wallet_Amount) {
          setTotalWalletAmount(parseFloat(agentData.Wallet_Amount));
        }
      } else {
        setAgentDetails(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to fetch agent details'
        }));
      }
    } catch (error) {
      console.error('Error fetching agent details:', error);
      setAgentDetails(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error fetching agent details'
      }));
    }
  }, [userProfile?.AgentId]);

  // Memoize fetchProposals to prevent unnecessary recreations
  const fetchProposals = useCallback(async (paymentStatus = 'Pending') => {
    try {
      setLoading(true);
      setError('');

      // Get the agent ID from the user profile
      const agentId = userProfile?.AgentId || userProfile?.agentId;

      if (!agentId) {
        setError('Agent ID not found in user profile');
        setLoading(false);
        return;
      }

      console.log("Fetching proposals for agent:", agentId, "with status:", paymentStatus);
      // Change in Practo

      const response = await getProposalDetailsByAgent_Practo(agentId, paymentStatus);
      console.log("API Response:", response);

      // Handle the response according to the structure from your API
      if (response && response.Status === 'Success' && response.MasterData) {
        setProposals(response.MasterData.proposals || []);
      } else {
        setError(response?.Message || `Failed to fetch ${paymentStatus} proposals`);
      }
    } catch (error) {
      console.error(`Error fetching ${paymentStatus} proposals:`, error);
      setError(`Failed to fetch ${paymentStatus} proposals. ${error.message || ''}`);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    // Fetch agent details first to ensure we have the latest data
    fetchAgentDetails();

    // Then fetch proposals
    fetchProposals(activeTab);

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
  }, [activeTab, refreshTrigger, fetchProposals, fetchAgentDetails]);

  const handleLogout = async () => {
    try {
      // Clear all local storage and session storage
      localStorage.clear();
      sessionStorage.clear();

      // Call the logout service and wait for it to complete
      await logout();

      // Force a small delay to ensure all async operations complete
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

  const goBack = () => {
    navigate('/dashboard');
  };


  const handleRefresh = () => {
    // Increment refresh trigger to cause a re-fetch
    setRefreshTrigger(prev => prev + 1);
    setSuccessMessage('');
    setError('');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleSelectProposal = (proposalId) => {
    // Only allow selection in Pending tab
    if (activeTab !== 'Pending') return;

    const updatedSelection = [...selectedProposals];
    const index = updatedSelection.indexOf(proposalId);

    if (index === -1) {
      // Add to selection
      updatedSelection.push(proposalId);
    } else {
      // Remove from selection
      updatedSelection.splice(index, 1);
    }

    setSelectedProposals(updatedSelection);

    // Calculate total selected amount
    const totalAmount = calculateSelectedAmount(updatedSelection);
    setSelectedAmount(totalAmount);
  };

  const calculateSelectedAmount = (selectedIds) => {
    return selectedIds.reduce((total, currentId) => {
      const proposal = proposals.find(p => p.proposal_id === currentId);
      return total + (proposal ? parseFloat(proposal.Selected_PremiumAmount) || 0 : 0);
    }, 0);
  };

  const handleApplyPayment = async () => {
    if (selectedProposals.length === 0) {
      setError('Please select at least one proposal');
      return;
    }
    //comment 27-05
    // if (selectedAmount > totalWalletAmount) {
    //   setError('Selected amount exceeds wallet balance');
    //   return;
    // }

    try {
      setProcessingPayment(true);
      setError('');
      setSuccessMessage('');

      const selectedPolicies = [];
      const selectedProposalIds = [];

      selectedProposals.forEach(id => {
        const proposal = proposals.find(p => p.proposal_id === id);
        if (proposal) {
          selectedPolicies.push(proposal.Policy_No || proposal.Certificate_Number);
          selectedProposalIds.push(proposal.proposal_id); // Collect proposal IDs
        }
      });

      if (selectedPolicies.length === 0) {
        setError('No valid policies selected');
        setProcessingPayment(false);
        return;
      }

      // Join policies with pipe symbols
      const policiesString = selectedPolicies.join('||');
      const proposalIdsString = selectedProposalIds.join('||');

      // Construct payload for batch payment API
      const paymentData = {
        agentCode: userProfile.AgentId,
        policyNo: policiesString,
        totalAmount: selectedAmount.toString(),
        paymentMode: 'InProcess',  // Changed to InProcess to match the status in the stored procedure
        utr: '',
        proposal_id: proposalIdsString// Optional reference number
      };

      console.log("Applying payment:", paymentData);

      // Call the API to apply payment
      const response = await applyWalletPayment_Practo(paymentData);
      console.log("Payment response:", response);

      if (response && response.Status === 'Success') {
        // Set success message including the number of policies processed
        const policiesCount = selectedPolicies.length;
        setSuccessMessage(
          `Payment of ₹${selectedAmount.toFixed(2)} applied successfully for ${policiesCount} ${policiesCount === 1 ? 'policy' : 'policies'}`
        );

        // Update wallet balance
        const newWalletAmount = totalWalletAmount;
        setTotalWalletAmount(newWalletAmount);

        // Update user profile in localStorage
        if (userProfile) {
          const updatedProfile = {
            ...userProfile,
            Wallet_Amount: newWalletAmount.toString()
          };
          localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
          localStorage.setItem('walletData', JSON.stringify(updatedProfile));
          setUserProfile(updatedProfile);
        }

        // Refresh all tabs to see latest data
        // This will refresh the current tab
        setRefreshTrigger(prev => prev + 1);

        // Reset selection
        setSelectedProposals([]);
        setSelectedAmount(0);
      } else {
        setError(response?.Message || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Error applying payment:', error);
      setError(`Error processing payment. ${error.message || 'Please try again.'}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedProposals([]);
    setSelectedAmount(0);
    setError('');
    setSuccessMessage('');
    // We don't need to call fetchProposals here as it will be triggered by the useEffect
  };

  // Function to handle wallet amount selection
  const handleWalletAmountChange = (e) => {
    setSelectedWalletAmount(e.target.value);
  };



  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading user data...</p>
      </div>
    );
  }

  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not Available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Determine reference date (Wallet Update Date or Admin Approved Date)
  const referenceDate = userProfile.Wallet_Update_Date || userProfile.AdminApproved_Date;
  const referenceLabel = userProfile.Wallet_Update_Date ? 'Wallet Update Date' : 'Admin Approved Date';

  return (
    <div className="wallet-page-wrapperPr">
      <header className="top-header">
        <div className="header-content">
          <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
          <div className="d-flex justify-content-center py-4">
            <div className="logo d-flex align-items-center w-auto">
              <span className="d-none d-lg-block">Practo Subscription</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button
              onClick={goBack}
              className="coi-buttonL"
            >
              <Home size={18} />
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="coi-buttonL"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="card">
          <div className="wallet-info">
            <div className="wallet-balance">
              <div className="agent-info-card">
                <h2>Agent Information</h2>
                <div>
                  <p>
                    <strong>Name:</strong> {userProfile.name || userProfile.FullName}
                    <strong style={{ marginLeft: '20px' }}>Agent Code:</strong> {userProfile.Agent_Code}
                    <strong style={{ marginLeft: '20px' }}>Email:</strong> {userProfile.email || userProfile.EmailID}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Info Card with Enhanced Status Display */}
        <div className="card">
          <div style={{ padding: '20px' }}>
            {/* Wallet Balance on a single line */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '500',
                color: '#374151',
                margin: '0',
                marginRight: '15px'
              }}>Wallet Balance:</h3>
              <span style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#059669',
                margin: '0'
              }}>
                ₹ {totalWalletAmount.toLocaleString()}
              </span>
            </div>

            {/* Admin Approved Date */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '15px',
              fontSize: '0.875rem',
              color: '#4b5563'
            }}>
              <strong>Admin Approved Date:</strong> {formatDate(referenceDate)}
            </div>

            {/* Status Box - UPDATED with conditional colors based on eligibility */}
            <div style={{
              backgroundColor: walletStatus?.eligibleProposal ? '#f0fdf4' : '#fee2e2',
              padding: '10px 20px',
              borderRadius: '8px',
              border: `1px solid ${walletStatus?.eligibleProposal ? '#10b981' : '#ef4444'}`,
              width: '100%'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'nowrap',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <strong style={{ marginRight: '8px' }}>Eligibility Status:</strong>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: walletStatus?.eligibleProposal ? '#10b981' : '#ef4444',
                    fontWeight: 'bold'
                  }}>
                    {walletStatus?.eligibleProposal ? (
                      <>
                        <CheckCircle size={18} style={{ marginRight: '5px' }} />
                        Eligible
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={18} style={{ marginRight: '5px' }} />
                        Not Eligible
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <strong style={{ marginRight: '8px' }}>
                    {walletStatus?.eligibleProposal ? "Remaining Days:" : "Expire Days:"}
                  </strong>
                  <span style={{
                    fontWeight: 'bold',
                    color: walletStatus?.eligibleProposal ? '#10b981' : '#ef4444'
                  }}>
                    {walletStatus?.days || 0} days
                  </span>
                </div>
              </div>

              {/* Only show warning message when not eligible */}
              {!walletStatus?.eligibleProposal && (
                <div style={{
                  marginTop: '10px',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <AlertTriangle size={16} style={{ marginRight: '8px' }} />
                  Your wallet has expired. Please update your balance.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Improved Wallet Recharge Form - Only show when wallet is NOT eligible */}
        {!walletStatus?.eligibleProposal && (
          <div className="card">
            <div style={{ padding: '25px' }}>
              <h3 style={{
                fontSize: '22px',
                fontWeight: '600',
                color: '#333',
                margin: '0 0 30px 0'
              }}>
                Apply Wallet Balance and Eligible Days Reset
              </h3>

              <div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <label
                      htmlFor="walletAmount"
                      style={{
                        fontWeight: '500',
                        color: '#333',
                        fontSize: '16px'
                      }}
                    >
                      Select Amount:
                    </label>
                    <select
                      id="walletAmount"
                      value={selectedWalletAmount}

                      onChange={handleWalletAmountChange}
                      style={{
                        padding: '8px 15px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '16px',
                        backgroundColor: 'white',
                        width: '250px'
                      }}
                      disabled={submittingWallet}
                    >
                      <option value="0">₹ 0</option>
                      <option value="5000">₹ 5,000</option>
                      <option value="10000">₹ 10,000</option>
                      <option value="15000">₹ 15,000</option>
                      <option value="20000">₹ 20,000</option>
                      <option value="25000">₹ 25,000</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <label style={{
                      fontWeight: '500',
                      color: '#333',
                      fontSize: '16px'
                    }}>
                      Current  Date:
                    </label>
                    <div style={{
                      padding: '12px 15px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: '#f3f4f6',
                      width: '250px',
                      fontSize: '16px'
                    }}>
                      {new Date().toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </div>
        )}

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
        {/* Add Invoice Success/Error Messages here */}
        {coiSuccess && (
          <div className="success-message">
            <Check className="w-5 h-5 inline-block mr-2" />
            {coiSuccess}
          </div>
        )}

        {coiError && (
          <div className="error-message">
            <X className="w-5 h-5 inline-block mr-2" />
            {coiError}
          </div>
        )}

        {/* Transaction Tabs */}
        <div className="wallet-tabs">
          <div className="tab-buttons">
            <button
              className={`tab-button ${activeTab === 'Pending' ? 'active' : ''}`}
              onClick={() => handleTabChange('Pending')}
            >
              Pending Transactions
            </button>
            <button
              className={`tab-button ${activeTab === 'InProcess' ? 'active' : ''}`}
              onClick={() => handleTabChange('InProcess')}
            >
              In Process Transactions
            </button>
            <button
              className={`tab-button ${activeTab === 'Approved' ? 'active' : ''}`}
              onClick={() => handleTabChange('Approved')}
            >
              Approved Transactions
            </button>
          </div>
        </div>

        {/* Proposals Table */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h3 className="proposal-title">{activeTab} Proposals</h3>
              <button onClick={handleRefresh} className="refresh-button">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>


          <div className="table-container">
            {loading ? (
              <div className="loading-message">Loading {activeTab.toLowerCase()} proposals...</div>
            ) : proposals.length === 0 ? (
              <div className="no-data-message">No {activeTab.toLowerCase()} proposals found</div>
            ) : (
              <table className="proposals-table">
                <thead>
                  <tr>
                    <th data-column="sr-no">Sr No</th>
                    {activeTab === 'Pending' && <th data-column="select">Select</th>}
                    <th data-column="member-name">Member Name</th>
                    <th data-column="policy-no">Policy No</th>
                    {activeTab !== 'Pending' && <th data-column="payment-ref-no">Payment Ref No</th>}
                    <th data-column="amount">Amount</th>
                    <th data-column="mode">Mode</th>
                    <th data-column="payment-date">Payment Date</th>
                    {activeTab !== 'Pending' && <th data-column="status">Status</th>}
                    {(activeTab === 'Approved' || activeTab === 'Pending') && <th data-column="actions">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((proposal, index) => (
                    <tr key={proposal.proposal_id}>
                      <td>{index + 1}</td>
                      {activeTab === 'Pending' && (
                        <td>
                          <label className="checkbox-container">
                            <input

                              type="checkbox"
                              checked={selectedProposals.includes(proposal.proposal_id)}
                              onChange={() => handleSelectProposal(proposal.proposal_id)}
                              disabled={processingPayment || !walletStatus?.eligibleProposal}
                            />
                            <span className="checkmark"></span>
                          </label>
                        </td>
                      )}
                      <td>{proposal.InsuredFullName}</td>

                      {/* Add title attribute for Policy No to show full text on hover */}
                      <td title={proposal.Policy_No || proposal.Certificate_Number}>
                        {proposal.Policy_No || proposal.Certificate_Number}
                      </td>

                      {activeTab !== 'Pending' && (
                        /* Add title attribute for Payment Ref No to show full text on hover */
                        <td title={proposal.Payment_Ref_No || '-'}>
                          {proposal.Payment_Ref_No || '-'}
                        </td>
                      )}

                      <td>₹ {parseFloat(proposal.Selected_PremiumAmount).toLocaleString()}</td>
                      <td>{proposal.Payment_Mode || proposal.Selected_Payment_Mode}</td>
                      <td>{new Date(proposal.CreateDate).toLocaleDateString()}</td>

                      {activeTab !== 'Pending' && (
                        <td className={`status ${activeTab.toLowerCase()}`}>
                          {activeTab === 'Approved' ?
                            <CheckCircle size={16} className="status-icon approved" /> :
                            <Clock size={16} className="status-icon in-process" />
                          }
                          <span>{activeTab}</span>
                        </td>
                      )}

                      {/* Improved Invoice button cell alignment */}
                      {(activeTab === 'Approved' || activeTab === 'Pending') && (
                        <td>
                          {proposal.InvoicepdfUrl ? (
                            <a
                              href={`${PDF_BASE_URL}${proposal.InvoicepdfUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="coi-button"
                            >
                              <Download size={16} style={{ marginRight: '4px' }} />
                              Invoice
                            </a>
                          ) : (
                            <span className="no-invoice">No Invoice</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {activeTab === 'Pending' && (
            <div className="action-container">
              <button
                className="apply-btn"
                onClick={handleApplyPayment}
                disabled={selectedProposals.length === 0 || processingPayment || !walletStatus?.eligibleProposal}
                style={{
                  backgroundColor: !walletStatus?.eligibleProposal ? '#9ca3af' : undefined,
                  cursor: !walletStatus?.eligibleProposal ? 'not-allowed' : undefined
                }}
              >
                {processingPayment ? 'Processing...' : 'Apply Wallet Payment'}
              </button>

              <div className="selected-amount">
                <span>Selected Amount:</span>
                <div className="amount-box">₹ {selectedAmount.toLocaleString()}</div>
              </div>

              <button className="back-btn" onClick={handleBackToDashboard} disabled={processingPayment}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back To Dashboard
              </button>
            </div>
          )}

          {activeTab !== 'Pending' && (
            <div className="action-container">
              <button className="back-btn" onClick={handleBackToDashboard}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back To Dashboard
              </button>
            </div>
          )}
        </div>

        {!walletStatus?.eligibleProposal && activeTab === 'Pending' && (
          <div style={{
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            padding: '15px',
            marginTop: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <AlertTriangle size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontWeight: '600', color: '#b91c1c', margin: '0 0 5px 0' }}>Wallet Not Eligible for Transactions</p>
              <p style={{ color: '#b91c1c', margin: '0', fontSize: '14px' }}>Your wallet needs to be updated before you can process any payments.</p>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
      </footer>
    </div>
  );
};

export default WalletPagePracto;