import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserCircle, LogOut, RefreshCw, Home, ArrowLeft,
  Check, X, Download, CheckCircle, Clock, AlertTriangle
} from 'lucide-react';
import { logout } from '../../../services/auth';
import {
  getProposalDetailsByAgent_AyushPay, // Updated API import
  applyWalletPayment_AyushPay,        // Updated API import
  getAgentById,
  PDF_BASE_URL
} from '../../../services/api';
import './WalletPageAyush.css'; // Ensure this CSS file exists
import logo from '../../../../src/assets/img/TravelAssist_practo.webp'; // Verify if you have an Ayush specific logo

// Function to calculate remaining days and eligibility
const calculateRemainingDays = (walletUpdateDate: string, adminApprovedDate: string) => {
  // Default result object
  const defaultResult = {
    days: 0,
    isExpired: true,
    eligibleProposal: false,
    referenceDate: null as Date | null
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
  const diffTime = expiryDate.getTime() - currentDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Determine if wallet is eligible for creating proposals
  const isExpired = diffDays < 0; 
  const eligibleProposal = !isExpired;

  return {
    days: diffDays,
    isExpired: isExpired,
    eligibleProposal: eligibleProposal,
    referenceDate: referenceDate
  };
};

const WalletPageAyush: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get user profile either from location state or localStorage
  const [userProfile, setUserProfile] = useState<any>(() => {
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
  const [walletStatus, setWalletStatus] = useState<any>(() => {
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

  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedProposals, setSelectedProposals] = useState<string[]>([]);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [totalWalletAmount, setTotalWalletAmount] = useState(userProfile?.Wallet_Amount ? parseFloat(userProfile.Wallet_Amount) : 0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Pending');
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  // New states for wallet recharge
  const [selectedWalletAmount, setSelectedWalletAmount] = useState('5000');
  const [submittingWallet, setSubmittingWallet] = useState(false); // Kept for future implementation

  // Consolidated wallet state
  const [agentDetails, setAgentDetails] = useState({
    isLoading: true,
    error: null as string | null,
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

      // ** CHANGE: Using AyushPay API **
      const response = await getProposalDetailsByAgent_AyushPay(agentId, paymentStatus);

      // Handle the response according to the structure from your API
      if (response && response.Status === 'Success' && response.MasterData) {
        // Assuming the backend structure is similar to Practo (MasterData.proposals or just MasterData array)
        setProposals(response.MasterData.proposals || response.MasterData || []);
      } else {
        setError(response?.Message || `Failed to fetch ${paymentStatus} proposals`);
      }
    } catch (error: any) {
      console.error(`Error fetching ${paymentStatus} proposals:`, error);
      setError(`Failed to fetch ${paymentStatus} proposals. ${error.message || ''}`);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    fetchAgentDetails();
    fetchProposals(activeTab);

    // Handle back button behavior
    const handleBackButton = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.forward();
    };

    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [activeTab, refreshTrigger, fetchProposals, fetchAgentDetails]);

  const handleLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      await logout();
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.href = '/login';
    }
  };

  const goBack = () => {
    navigate('/dashboard');
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    setSuccessMessage('');
    setError('');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleSelectProposal = (proposalId: string) => {
    if (activeTab !== 'Pending') return;

    const updatedSelection = [...selectedProposals];
    const index = updatedSelection.indexOf(proposalId);

    if (index === -1) {
      updatedSelection.push(proposalId);
    } else {
      updatedSelection.splice(index, 1);
    }

    setSelectedProposals(updatedSelection);

    // Calculate total selected amount
    const totalAmount = calculateSelectedAmount(updatedSelection);
    setSelectedAmount(totalAmount);
  };

  const calculateSelectedAmount = (selectedIds: string[]) => {
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

    try {
      setProcessingPayment(true);
      setError('');
      setSuccessMessage('');

      const selectedPolicies: string[] = [];
      const selectedProposalIds: string[] = [];

      selectedProposals.forEach(id => {
        const proposal = proposals.find(p => p.proposal_id === id);
        if (proposal) {
          // Check for Policy_No first, fallback to Certificate_Number if applicable
          selectedPolicies.push(proposal.Policy_No || proposal.Certificate_Number || proposal.Ayush_id); 
          selectedProposalIds.push(proposal.proposal_id);
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
        paymentMode: 'InProcess',
        utr: '',
        proposal_id: proposalIdsString
      };

      // ** CHANGE: Using AyushPay API **
      const response = await applyWalletPayment_AyushPay(paymentData);

      if (response && response.Status === 'Success') {
        const policiesCount = selectedPolicies.length;
        setSuccessMessage(
          `Payment of ₹${selectedAmount.toFixed(2)} applied successfully for ${policiesCount} ${policiesCount === 1 ? 'policy' : 'policies'}`
        );

        // Update wallet balance (optimistically or via re-fetch)
     
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

        // Here we just trigger a refresh which fetches fresh agent data
        setRefreshTrigger(prev => prev + 1);

        // Reset selection
        setSelectedProposals([]);
        setSelectedAmount(0);
      } else {
        setError(response?.Message || 'Payment processing failed');
      }
    } catch (error: any) {
      console.error('Error applying payment:', error);
      setError(`Error processing payment. ${error.message || 'Please try again.'}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedProposals([]);
    setSelectedAmount(0);
    setError('');
    setSuccessMessage('');
  };

  const handleWalletAmountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
  const formatDate = (dateString: any) => {
    if (!dateString) return 'Not Available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Determine reference date
  const referenceDate = userProfile.Wallet_Update_Date || userProfile.AdminApproved_Date;

  return (
    <div className="wallet-page-wrapperPr">
      <header className="top-header">
        <div className="header-content">
          <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
          <div className="d-flex justify-content-center py-4">
            <div className="logo d-flex align-items-center w-auto">
              {/* CHANGE: Updated Title */}
              <span className="d-none d-lg-block">Ayushpay Subscription</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button onClick={goBack} className="coi-buttonL">
              <Home size={18} />
              Dashboard
            </button>
            <button onClick={handleLogout} className="coi-buttonL">
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

        {/* Wallet Info Card */}
        <div className="card">
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '500', color: '#374151', margin: '0', marginRight: '15px' }}>
                Wallet Balance:
              </h3>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669', margin: '0' }}>
                ₹ {totalWalletAmount.toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px', fontSize: '0.875rem', color: '#4b5563' }}>
              <strong>Admin Approved Date:</strong> {formatDate(referenceDate)}
            </div>

            <div style={{
              backgroundColor: walletStatus?.eligibleProposal ? '#f0fdf4' : '#fee2e2',
              padding: '10px 20px',
              borderRadius: '8px',
              border: `1px solid ${walletStatus?.eligibleProposal ? '#10b981' : '#ef4444'}`,
              width: '100%'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'space-between' }}>
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
                  <span style={{ fontWeight: 'bold', color: walletStatus?.eligibleProposal ? '#10b981' : '#ef4444' }}>
                    {walletStatus?.days || 0} days
                  </span>
                </div>
              </div>

              {!walletStatus?.eligibleProposal && (
                <div style={{ marginTop: '10px', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                  <AlertTriangle size={16} style={{ marginRight: '8px' }} />
                  Your wallet has expired. Please update your balance.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wallet Recharge Form - Only show when wallet is NOT eligible */}
        {!walletStatus?.eligibleProposal && (
          <div className="card">
            <div style={{ padding: '25px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: '600', color: '#333', margin: '0 0 30px 0' }}>
                Apply Wallet Balance and Eligible Days Reset
              </h3>
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label htmlFor="walletAmount" style={{ fontWeight: '500', color: '#333', fontSize: '16px' }}>
                      Select Amount:
                    </label>
                    <select
                      id="walletAmount"
                      value={selectedWalletAmount}
                      onChange={handleWalletAmountChange}
                      style={{ padding: '8px 15px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px', backgroundColor: 'white', width: '250px' }}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontWeight: '500', color: '#333', fontSize: '16px' }}>
                      Current Date:
                    </label>
                    <div style={{ padding: '12px 15px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#f3f4f6', width: '250px', fontSize: '16px' }}>
                      {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
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
                        {proposal.Policy_No || proposal.Certificate_Number || proposal.Ayush_id}
                      </td>

                      {activeTab !== 'Pending' && (
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

                      {/* Invoice button */}
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

export default WalletPageAyush;