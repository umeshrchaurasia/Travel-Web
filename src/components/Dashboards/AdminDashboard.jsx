import React, { useState, useEffect } from 'react';
import {
  UserCircle, Mail, BadgeCheck, LogOut, RefreshCw, Home,
  Upload, CheckCircle, CircleOff, X, Wallet, HardDrive,
  FileText,
  UserPlus,
  CreditCard,
  FileBarChart,
  UserCog,
  ArrowLeftCircle,
} from 'lucide-react';
import {
  getPendingApprovals,
  getAgentListByUId
} from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../../services/auth';
import './AdminDashboard.css';
import logo from '../../../src/assets/img/TravelAssist.webp';
import AddApprovalAgentdocModal from './AddApprovalAgentdocModal';

const defaultData = {
  agents: [],
  loading: true
};

// Define constants for product selection
const PRODUCT_TRAVEL_ASSIST = 'travelAssist';
const PRODUCT_ZEXTRA_WELLNESS = 'zextraWellness';
const PRODUCT_PRACTO = 'practo';
const PRODUCT_AYUSHPAY = 'ayushpay';
const VIEW_SELECTION = 'selection';
const VIEW_ZEXTRA_SELECTION = 'zextraSelection';
const VIEW_APPROVALS = 'approvals';

const AdminDashboard = ({ userData = null, onLogout = () => { } }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [agents, setAgents] = useState(defaultData.agents);
  const [loading, setLoading] = useState(defaultData.loading);

  const [userProfile, setUserProfile] = useState(() => {
    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile ? JSON.parse(savedProfile) : userData;
  });

  const [isModalOpendoc, setIsModalOpendoc] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [documentStatuses, setDocumentStatuses] = useState({});

  const [selectedProduct, setSelectedProduct] = useState(() => {
    if (location.state?.product === 'travelAssist') return PRODUCT_TRAVEL_ASSIST;
    if (location.state?.product === 'zextraWellness') return PRODUCT_ZEXTRA_WELLNESS;
    if (location.state?.product === 'practo') return PRODUCT_PRACTO;
    if (location.state?.product === 'ayushpay') return PRODUCT_AYUSHPAY;
    return null;
  });

  const [currentView, setCurrentView] = useState(() => {
    return location.state?.view === 'approvals' ? VIEW_APPROVALS : VIEW_SELECTION;
  });

  const handleProductSelection = (product) => {
    if (product === PRODUCT_ZEXTRA_WELLNESS) {
      setSelectedProduct(product);
      setCurrentView(VIEW_ZEXTRA_SELECTION);
    } else {
      setSelectedProduct(product);
      setCurrentView(VIEW_APPROVALS);
    }
  };

  const handleZextraProductSelection = (product) => {
    setSelectedProduct(product);
    setCurrentView(VIEW_APPROVALS);
  };

  const resetView = () => {
    setSelectedProduct(null);
    setCurrentView(VIEW_SELECTION);
  };

  const goBackFromZextra = () => {
    setSelectedProduct(null);
    setCurrentView(VIEW_SELECTION);
  };

  // Load agents function
  const loadAgents = async () => {
    try {
      setLoading(true);
      const result = await getPendingApprovals();

      if (result.Status === 'Success') {
        setAgents(result.MasterData || []);
        await Promise.all(
          result.MasterData.map(async (agent) => {
            await loadAgentDocuments(agent.AgentId);
          })
        );
      } else {
        console.error('Failed to fetch agents:', result.Message);
        setAgents([]);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  // Load document statuses for an agent
  const loadAgentDocuments = async (agentId) => {
    try {
      const userId = userData?.UId || userProfile?.UId;
      const response = await getAgentListByUId(userId, agentId);
      if (response.Status === 'Success') {
        const docs = response.MasterData || [];
        const mandatoryDocs = ['pancard', 'bankdetails', 'addressproof'];
        const uploadedMandatory = docs.filter(doc =>
          mandatoryDocs.includes(doc.DocType.toLowerCase())
        ).length;

        setDocumentStatuses(prev => ({
          ...prev,
          [agentId]: {
            total: docs.length,
            mandatory: uploadedMandatory,
            isComplete: uploadedMandatory === mandatoryDocs.length,
            documents: docs,
            comment: docs[0]?.AdminComment || ''
          }
        }));
      }
    } catch (error) {
      console.error('Error loading agent documents:', error);
    }
  };

  // Handle back button
  useEffect(() => {
    const handleBackButton = (e) => {
      e.preventDefault();
      window.history.forward();
    };

    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, []);

  // Load agents data on component mount
  useEffect(() => {
    if (userData?.UId || userProfile?.UId) {
      loadAgents();
    }
  }, [userData?.UId, userProfile?.UId]);

  const handleLogout = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      logout();
      onLogout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleRefresh = () => {
    loadAgents();
  };

  const gotoMIS = () => {
    localStorage.setItem('walletData', JSON.stringify(displayData));
    navigate('/MIS_Proposal_Admin', {
      state: {
        empid: '',
        agentData: displayData,
        userType: 'Admin',
        adminId: userData?.UId
      }
    });
  }

  const gotoMISPracto = () => {
    localStorage.setItem('walletData', JSON.stringify(displayData));
    navigate('/MIS_Proposal_Admin_Practo', {
      state: {
        empid: '',
        agentData: displayData,
        userType: 'Admin',
        adminId: userData?.UId
      }
    });
  }

  const gotoMISAyushpay = () => {
    localStorage.setItem('walletData', JSON.stringify(displayData));
    navigate('/MIS_Proposal_Admin_AyushPay', {
      state: {
        empid: '',
        agentData: displayData,
        userType: 'Admin',
        adminId: userData?.UId
      }
    });
  }

  const gotoMISAgent = () => {
    localStorage.setItem('walletData', JSON.stringify(displayData));
    navigate('/MIS_Agentdetail_Admin', {
      state: {
        empid: '',
        agentData: displayData,
        userType: 'Admin',
        adminId: userData?.UId
      }
    });
  }

  const gotoUpdateAgent = () => {
    localStorage.setItem('walletData', JSON.stringify(displayData));
    navigate('/Update_Agent', {
      state: {
        empid: '',
        agentData: displayData,
        userType: 'Admin',
        adminId: userData?.UId
      }
    });
  }

  const handleWalletClick = () => {
    localStorage.setItem('walletData', JSON.stringify(displayData));
    navigate('/ReplenishWallet', { state: { agentData: displayData } });
  };

  const handleWallet_PractoClick = () => {
    localStorage.setItem('walletData', JSON.stringify(displayData));
    navigate('/ReplenishWallet_Practo', { state: { agentData: displayData } });
  };

  const handleWallet_AyushpayClick = () => {
    localStorage.setItem('walletData', JSON.stringify(displayData));
    navigate('/ReplenishWallet_Ayush', { state: { agentData: displayData } });
  };

  const handleViewDocuments = (agent) => {
    if (agent.Agent_Otp_Approved?.toLowerCase() !== "approved") {
      alert("Document review is not allowed. Agent agreement approval is required first.");
      return;
    }
    setSelectedAgent(agent);
    setIsModalOpendoc(true);
  };

  const handleDocumentSuccess = async () => {
    await loadAgents();
    setIsModalOpendoc(false);
  };

  if (!userData && !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading user data...</p>
      </div>
    );
  }

  const displayData = userData || userProfile;

  const getDocumentStatus = (agentId) => {
    const status = documentStatuses[agentId];
    if (!status) return 'pending';
    return status.isComplete ? 'completed' : 'pending';
  };

  return (
    <div className="AdminDashboard">
      <header className="top-header">
        <div className="header-content">
          <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
          <div className="d-flex justify-content-center py-4">
            <div className="logo d-flex align-items-center w-auto">
              <span className="d-none d-lg-block">Travel Assistance Service</span>
            </div>
          </div>
          <nav className="nav-links">
            <a href="#" onClick={resetView}>Home</a>
            <a href="#">Contact Us</a>
            <a href="#">About Us</a>
            <button autoFocus onClick={handleLogout} className="btn btn-danger">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {/* Admin Info Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="welcome-title">Welcome, {displayData.FullName}</h2>
          </div>
          <div className="employee-info">
            
            {/* --- NEW LAYOUT: Info + Back Button in one row --- */}
            <div className="info-header-row">
              <div className="info-item">
                <span className="info-label spaced5">
                  <UserCircle className="w-4 h-4 inline-block mr-2 spaced5" />
                  <span className="font-weight">Admin ID</span>
                </span>
                <span className="info-value spaced10">{displayData.UId}</span>

                <span className="info-label spaced10">
                  <Mail className="w-4 h-4 inline-block mr-2 spaced5" />
                  <span className="font-weight">Email</span>
                </span>
                <span className="info-value">{displayData.EmailID}</span>
              </div>

              {/* Back Button positioned here */}
              {currentView === VIEW_ZEXTRA_SELECTION && (
                <button onClick={goBackFromZextra} className="back-to-selection-btn-admin">
                  <ArrowLeftCircle size={18} />
                  <span>Back To Selection</span>
                </button>
              )}
              {currentView === VIEW_APPROVALS && (
                <button onClick={resetView} className="back-to-selection-btn-admin">
                  <ArrowLeftCircle size={18} />
                  <span>Back To Selection</span>
                </button>
              )}
            </div>
            {/* -------------------------------------------------- */}

            {/* --- HOME VIEW: INITIAL PRODUCT SELECTION --- */}
            {currentView === VIEW_SELECTION && (
              <div className="product-selection-grid">
                <div
                  className="product-card card-travel"
                  onClick={() => handleProductSelection(PRODUCT_TRAVEL_ASSIST)}
                >
                  <HardDrive size={48} className="card-icon" />
                  <h3>Travel Assist</h3>
                  <p>Manage Travel Assist Agents, Wallet, and Reports.</p>
                </div>

                <div
                  className="product-card card-zextra"
                  onClick={() => handleProductSelection(PRODUCT_ZEXTRA_WELLNESS)}
                >
                  <FileText size={48} className="card-icon" />
                  <h3>Zextra Wellness</h3>
                  <p>Access wellness plans, Practo subscriptions, and health services.</p>
                </div>
              </div>
            )}

            {/* --- ZEXTRA SELECTION VIEW: PRACTO & AYUSHPAY --- */}
            {currentView === VIEW_ZEXTRA_SELECTION && (
              <>
                <div className="product-selection-grid">
                  <div
                    className="product-card card-practo"
                    onClick={() => handleZextraProductSelection(PRODUCT_PRACTO)}
                  >
                    <FileText size={48} className="card-icon" />
                    <h3>Practo Subscription</h3>
                    <p>Manage Practo Agents, Wallet, and Reports.</p>
                  </div>

                  <div
                    className="product-card card-ayushpay"
                    onClick={() => handleZextraProductSelection(PRODUCT_AYUSHPAY)}
                  >
                    <UserPlus size={48} className="card-icon" />
                    <h3>Ayushpay</h3>
                    <p>Navigate to the Ayushpay section for subscription plans.</p>
                  </div>
                </div>
              </>
            )}

            {/* --- ACTION BUTTONS AND AGENT TABLE (After Selection) --- */}
            {currentView === VIEW_APPROVALS && (
              <>
                <div className="action-group">
                  {selectedProduct === PRODUCT_TRAVEL_ASSIST && (
                    <>
                      <button onClick={gotoMIS} className="action-button button-mis">
                        <FileBarChart size={18} /> MIS Reports
                      </button>
                      <button onClick={gotoMISAgent} className="action-button button-agent-details">
                        <UserPlus size={18} /> Agent Details
                      </button>
                      <button onClick={gotoUpdateAgent} className="action-button updatebutton-agent-details">
                        <UserCog size={18} /> Update Agent Details
                      </button>
                      <button onClick={handleWalletClick} className="action-button button-replenish">
                        <Wallet className="w-4 h-4 mr-2" size={20} /> Replenish Wallet
                      </button>
                    </>
                  )}

                  {selectedProduct === PRODUCT_PRACTO && (
                    <>
                      <button onClick={gotoMISPracto} className="action-button button-mis">
                        <FileBarChart size={18} /> MIS Reports Practo
                      </button>
                      <button onClick={handleWallet_PractoClick} className="action-button button-replenish">
                        <Wallet size={18} /> Replenish Wallet Practo
                      </button>
                    </>
                  )}

                  {selectedProduct === PRODUCT_AYUSHPAY && (
                    <>
                      <button onClick={gotoMISAyushpay} className="action-button button-mis-ayushpay">
                        <FileBarChart size={18} /> MIS AyushPay
                      </button>
                      <button onClick={handleWallet_AyushpayClick} className="action-button button-replenish-ayushpay">
                        <Wallet size={18} /> Replenish Wallet AyushPay
                      </button>
                    </>
                  )}
                </div>

                {/* Only show "Pending Agent Document Approvals" title for Travel Assist */}
                {selectedProduct === PRODUCT_TRAVEL_ASSIST && (
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-3">Pending Agent Document Approvals</h2>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Agents List Card - VISIBLE ONLY FOR TRAVEL ASSIST */}
        {selectedProduct === PRODUCT_TRAVEL_ASSIST && (
          <div className="card">
            <div className="card-header">
              {/* Added class for header layout and padding */}
              <div className="approval-header-content">
                <h2 className="card-title">PENDING APPROVALS</h2>
                <div className="header-actions">
                  <button onClick={handleRefresh} className="btn btn-primary">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh List
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="table-container">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Sr No.</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Document Status</th>
                        <th>Admin Approval</th>
                        <th>Agent Approval</th>
                        <th>PanCard Status</th>
                        <th>Wallet Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.map((agent) => (
                        <tr key={agent.AgentId}>
                          <td>{agent.AgentId}</td>
                          <td>{agent.FullName}</td>
                          <td>{agent.EmailID}</td>
                          <td>{agent.MobileNumber}</td>
                          <td>
                            <button
                              onClick={() => handleViewDocuments(agent)}
                              className={`btn ${agent.Agent_Otp_Approved?.toLowerCase() === "approved"
                                ? getDocumentStatus(agent.AgentId) === 'completed'
                                  ? 'btn-success'
                                  : 'btn-primary'
                                : 'btn-secondary'
                                }`}
                              style={{
                                opacity: agent.Agent_Otp_Approved?.toLowerCase() === "approved" ? 1 : 0.6,
                                cursor: agent.Agent_Otp_Approved?.toLowerCase() === "approved" ? 'pointer' : 'not-allowed'
                              }}
                            >
                              {agent.Agent_Otp_Approved?.toLowerCase() === "approved" ? (
                                getDocumentStatus(agent.AgentId) === 'completed' ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    View Documents
                                  </>
                                ) : (
                                  <>
                                    <CircleOff className="w-4 h-4 mr-2" />
                                    Incomplete Documents
                                  </>
                                )
                              ) : (
                                <>
                                  <X className="w-4 h-4 mr-2" />
                                  Agent Approval Required
                                </>
                              )}
                            </button>
                          </td>
                          <td>
                            <span className="status-badge status-cell">
                              <span className={agent.Admin_Approved === "1" ? 'status-active' : 'status-pending'}>
                                {agent.Admin_Approved === "1" ? 'Approved' : 'Pending'}
                              </span>
                            </span>
                          </td>
                          <td>
                            <span className="status-badge status-cell">
                              <span className={
                                agent.Agent_Otp_Approved?.toLowerCase() === "approved"
                                  ? 'status-active'
                                  : agent.Agent_Otp_Approved?.toLowerCase() === "rejected"
                                    ? 'status-inactive'
                                    : 'status-pending'
                              }>
                                {agent.Agent_Otp_Approved || "Pending"}
                              </span>
                            </span>
                          </td>

                          <td>
                            <span className="status-badge status-cell">
                              <span className="status-active">
                                Valid
                              </span>
                            </span>
                          </td>
                          <td>{agent.Wallet_Amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {!loading && agents.length === 0 && (
                  <p className="text-center py-4">No pending approvals found</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Document Review Modal */}
      {selectedAgent && (
        <AddApprovalAgentdocModal
          isOpen={isModalOpendoc}
          onClose={() => {
            setIsModalOpendoc(false);
            setSelectedAgent(null);
          }}
          onSuccess={handleDocumentSuccess}
          agentId={selectedAgent.AgentId}
          userId={userData?.UId || userProfile?.UId}
          walletAmount={selectedAgent.Wallet_Amount}
        />
      )}

      <footer className="footer">
        <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;