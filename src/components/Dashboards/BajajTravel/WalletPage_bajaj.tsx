import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserCircle, Mail, BadgeCheck, LogOut, RefreshCw, Home, CreditCard, ArrowLeft,
  Check, X, Download, Upload, DollarSign, Clock, CheckCircle, XCircle, Wallet, AlertTriangle
} from 'lucide-react';
import { logout } from '../../../services/auth';
import {
  getProposalDetailsByAgent_bajaj,
  applyWalletPayment_bajaj,
  getAgentById,
  ApplyWalletBalance_bajaj,
  PDF_BASE_URL // Assumed imported here; remove if declared elsewhere
} from '../../../services/api';
import '../Wallet/WalletPage.css';
import logo from '../../../../src/assets/img/TravelAssist.webp';

// --- Interfaces ---
interface UserProfile {
  AgentId?: string | number;
  agentId?: string | number;
  FullName?: string;
  name?: string;
  Agent_Code?: string;
  EmailID?: string;
  email?: string;
  Wallet_Amount?: string | number;
  Wallet_Update_Date?: string | null;
  AdminApproved_Date?: string | null;
}

interface WalletStatus {
  days: number;
  isExpired: boolean;
  eligibleProposal: boolean;
  referenceDate: Date | null;
}

interface Proposal {
  proposal_id: string | number;
  Policy_No?: string;
  Certificate_Number?: string;
  Payment_Ref_No?: string;
  Selected_PremiumAmount: string | number;
  Payment_Mode?: string;
  Selected_Payment_Mode?: string;
  CreateDate: string;
  InvoicepdfUrl?: string;
  InsuredFullName?: string;
}

interface AgentDetailsState {
  isLoading: boolean;
  error: string | null;
  data: UserProfile | null;
}

// Function to calculate remaining days and eligibility
const calculateRemainingDays = (
  walletUpdateDate: string | null | undefined,
  adminApprovedDate: string | null | undefined
): WalletStatus => {
  const defaultResult: WalletStatus = {
    days: 0,
    isExpired: true,
    eligibleProposal: false,
    referenceDate: null
  };

  if (!walletUpdateDate && !adminApprovedDate) {
    return defaultResult;
  }

  const referenceDate = walletUpdateDate ? new Date(walletUpdateDate) : new Date(adminApprovedDate!);
  const currentDate = new Date();

  const expiryDate = new Date(referenceDate);
  expiryDate.setDate(expiryDate.getDate() + 15);

  const diffTime = expiryDate.getTime() - currentDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isExpired = diffDays < 0;
  const eligibleProposal = !isExpired;

  return {
    days: diffDays,
    isExpired: isExpired,
    eligibleProposal: eligibleProposal,
    referenceDate: referenceDate
  };
};

const WalletPage_bajaj: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get user profile either from location state or localStorage
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const state = location.state as { agentData?: UserProfile } | null;
    if (state?.agentData) {
      return state.agentData;
    }

    const savedWalletData = localStorage.getItem('walletData');
    if (savedWalletData) {
      return JSON.parse(savedWalletData);
    }

    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile ? JSON.parse(savedProfile) : null;
  });

  // Get wallet status from location state or calculate it
  const [walletStatus, setWalletStatus] = useState<WalletStatus | null>(() => {
    const state = location.state as { walletStatus?: WalletStatus } | null;
    if (state?.walletStatus) {
      return state.walletStatus;
    }

    if (userProfile) {
      return calculateRemainingDays(
        userProfile.Wallet_Update_Date,
        userProfile.AdminApproved_Date
      );
    }
    return null;
  });

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [selectedProposals, setSelectedProposals] = useState<(string | number)[]>([]);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [totalWalletAmount, setTotalWalletAmount] = useState<number>(
    userProfile?.Wallet_Amount ? parseFloat(String(userProfile.Wallet_Amount)) : 25000
  );
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('Pending');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const [generatingCOI, setGeneratingCOI] = useState<boolean>(false);
  const [coiSuccess, setCoiSuccess] = useState<string>('');
  const [coiError, setCoiError] = useState<string>('');

  const [selectedWalletAmount, setSelectedWalletAmount] = useState<string>('5000');
  const [submittingWallet, setSubmittingWallet] = useState<boolean>(false);

  const [agentDetails, setAgentDetails] = useState<AgentDetailsState>({
    isLoading: true,
    error: null,
    data: null
  });

  const fetchAgentDetails = useCallback(async () => {
    if (!userProfile?.AgentId) return;

    setAgentDetails(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response: any = await getAgentById(userProfile.AgentId);

      if (response.Status === 'Success' && response.MasterData && response.MasterData.length > 0) {
        const agentData = response.MasterData[0];

        const newWalletStatus = calculateRemainingDays(
          agentData.Wallet_Update_Date,
          agentData.AdminApproved_Date
        );

        setWalletStatus(newWalletStatus);

        setAgentDetails({
          isLoading: false,
          error: null,
          data: agentData
        });

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

  const fetchProposals = useCallback(async (paymentStatus: string = 'Pending') => {
    try {
      setLoading(true);
      setError('');

      const agentId = userProfile?.AgentId || userProfile?.agentId;

      if (!agentId) {
        setError('Agent ID not found in user profile');
        setLoading(false);
        return;
      }

      const response: any = await getProposalDetailsByAgent_bajaj(agentId, paymentStatus);

      if (response && response.Status === 'Success' && response.MasterData) {
        setProposals(response.MasterData.proposals || []);
      } else {
        setError(response?.Message || `Failed to fetch ${paymentStatus} proposals`);
      }
    } catch (error: unknown) {
      console.error(`Error fetching ${paymentStatus} proposals:`, error);
      setError(`Failed to fetch ${paymentStatus} proposals. ${(error as Error).message || ''}`);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    fetchAgentDetails();
    fetchProposals(activeTab);

    const handleBackButton = (e: Event) => {
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
    navigate('/BajajTravel');
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    setSuccessMessage('');
    setError('');
  };

  const handleBackToDashboard = () => {
    navigate('/BajajTravel');
  };

  const handleSelectProposal = (proposalId: string | number) => {
    if (activeTab !== 'Pending') return;

    const updatedSelection = [...selectedProposals];
    const index = updatedSelection.indexOf(proposalId);

    if (index === -1) {
      updatedSelection.push(proposalId);
    } else {
      updatedSelection.splice(index, 1);
    }

    setSelectedProposals(updatedSelection);

    const totalAmount = calculateSelectedAmount(updatedSelection);
    setSelectedAmount(totalAmount);
  };

  // --- ERROR FIXED HERE --- 
  // Explicitly typing `total: number` and `currentId: string | number` fixes the reducer overload ambiguity.
  const calculateSelectedAmount = (selectedIds: (string | number)[]): number => {
    return selectedIds.reduce((total: number, currentId: string | number) => {
      const proposal = proposals.find(p => p.proposal_id === currentId);
      return total + (proposal ? parseFloat(String(proposal.Selected_PremiumAmount)) || 0 : 0);
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

      const selectedPolicies = selectedProposals.map(id => {
        const proposal = proposals.find(p => p.proposal_id === id);
        return proposal?.Policy_No || proposal?.Certificate_Number;
      }).filter(Boolean);

      if (selectedPolicies.length === 0) {
        setError('No valid policies selected');
        setProcessingPayment(false);
        return;
      }

      const policiesString = selectedPolicies.join('||');

      const paymentData = {
        agentCode: userProfile?.Agent_Code,
        policyNo: policiesString,
        totalAmount: selectedAmount.toString(),
        paymentMode: 'InProcess',
        utr: '' 
      };

      const response: any = await applyWalletPayment_bajaj(paymentData);

      if (response && response.Status === 'Success') {
        const policiesCount = selectedPolicies.length;
        setSuccessMessage(
          `Payment of ₹${selectedAmount.toFixed(2)} applied successfully for ${policiesCount} ${policiesCount === 1 ? 'policy' : 'policies'}`
        );

        setTotalWalletAmount(totalWalletAmount);

        if (userProfile) {
          const updatedProfile = {
            ...userProfile,
            Wallet_Amount: totalWalletAmount.toString()
          };
          localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
          localStorage.setItem('walletData', JSON.stringify(updatedProfile));
          setUserProfile(updatedProfile);
        }

        setRefreshTrigger(prev => prev + 1);
        setSelectedProposals([]);
        setSelectedAmount(0);
      } else {
        setError(response?.Message || 'Payment processing failed');
      }
    } catch (error: unknown) {
      console.error('Error applying payment:', error);
      setError(`Error processing payment. ${(error as Error).message || 'Please try again.'}`);
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

  const handleWalletRechargeSubmit = async () => {
    if (!selectedWalletAmount) {
      setError('Please select a wallet amount');
      return;
    }

    setSubmittingWallet(true);
    setError('');
    setSuccessMessage('');

    try {
      const walletData = {
        AgentId: userProfile?.AgentId,
        Agent_Code: userProfile?.Agent_Code,
        wallet_amount: selectedWalletAmount,
      };

      const response: any = await ApplyWalletBalance_bajaj(walletData);

      if (response && response.Status === 'Success') {
        setSuccessMessage(`Wallet updated successfully. Wait Admin Approval`);
        setTotalWalletAmount(parseFloat(selectedWalletAmount));

        const newWalletStatus = calculateRemainingDays(
          new Date().toISOString(),
          null
        );
        setWalletStatus(newWalletStatus);

        if (userProfile) {
          const updatedProfile = {
            ...userProfile,
            Wallet_Amount: selectedWalletAmount,
            Wallet_Update_Date: new Date().toISOString()
          };
          localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
          localStorage.setItem('walletData', JSON.stringify(updatedProfile));
          setUserProfile(updatedProfile);
        }

        fetchAgentDetails();
      } else {
        setError(response?.Message || 'Failed to update wallet balance');
      }
    } catch (error: unknown) {
      console.error('Error updating wallet balance:', error);
      setError('Failed to update wallet. Please try again.');
    } finally {
      setSubmittingWallet(false);
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading user data...</p>
      </div>
    );
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Not Available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const referenceDate = userProfile.Wallet_Update_Date || userProfile.AdminApproved_Date;

  return (
    <div className="wallet-page-wrapper">
      <header className="top-header">
        <div className="header-content">
          <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
          <div className="d-flex justify-content-center py-4">
            <div className="logo d-flex align-items-center w-auto">
              <span className="d-none d-lg-block">Travel Assistance Service</span>
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

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '15px',
              fontSize: '0.875rem',
              color: '#4b5563'
            }}>
              <strong>Admin Approved Date:</strong> {formatDate(referenceDate)}
            </div>

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

        {/* Wallet Recharge Form - Only show when wallet is NOT eligible */}
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
                      Current Date:
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

                <button
                  onClick={handleWalletRechargeSubmit}
                  disabled={submittingWallet}
                  style={{
                    padding: '12px 25px',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '500',
                    cursor: submittingWallet ? 'not-allowed' : 'pointer',
                    width: '180px',
                    fontSize: '16px',
                    opacity: submittingWallet ? 0.7 : 1
                  }}
                >
                  {submittingWallet ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        )}

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

                      <td title={proposal.Policy_No || proposal.Certificate_Number}>
                        {proposal.Policy_No || proposal.Certificate_Number}
                      </td>

                      {activeTab !== 'Pending' && (
                        <td title={proposal.Payment_Ref_No || '-'}>
                          {proposal.Payment_Ref_No || '-'}
                        </td>
                      )}

                      <td>₹ {parseFloat(String(proposal.Selected_PremiumAmount)).toLocaleString()}</td>
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

export default WalletPage_bajaj;