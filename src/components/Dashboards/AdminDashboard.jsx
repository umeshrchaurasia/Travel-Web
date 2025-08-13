import React, { useState, useEffect } from 'react';
import {
  UserCircle,
  Mail,
  BadgeCheck,
  LogOut,
  RefreshCw,
  Home,
  Upload,
  CheckCircle,
  CircleOff,
  X, Wallet
} from 'lucide-react';
import {
  getPendingApprovals,
  getAgentListByUId
} from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/auth';
import './AdminDashboard.css';
import logo from '../../../src/assets/img/TravelAssist.webp';
import AddApprovalAgentdocModal from './AddApprovalAgentdocModal';

const defaultData = {
  agents: [],
  loading: true
};

const AdminDashboard = ({ userData = null, onLogout = () => { } }) => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState(defaultData.agents);
  const [loading, setLoading] = useState(defaultData.loading);
  const [userProfile, setUserProfile] = useState(() => {
    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile ? JSON.parse(savedProfile) : userData;
  });

  const [isModalOpendoc, setIsModalOpendoc] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [documentStatuses, setDocumentStatuses] = useState({});

  // Load agents function
  const loadAgents = async () => {
    try {
      setLoading(true);
      const result = await getPendingApprovals();

      if (result.Status === 'Success') {
        setAgents(result.MasterData || []);
        // Load document statuses for each agent
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

    const gotoMIS=()=>{
     //const empId = displayData.id || displayData.UId;
     localStorage.setItem('walletData',JSON.stringify(displayData));

     navigate('/MIS_Proposal_Admin',{
      state:{
        empid:'',
        agentData:displayData,
        userType:'Admin',
        adminId:userData?.UId
      }
     });
  }

    const gotoMISAgent=()=>{
     //const empId = displayData.id || displayData.UId;
     localStorage.setItem('walletData',JSON.stringify(displayData));

     navigate('/MIS_Agentdetail_Admin',{
      state:{
        empid:'',
        agentData:displayData,
        userType:'Admin',
        adminId:userData?.UId
      }
     });
  }

  const handleWalletClick = () => {
    // Store the display data in localStorage to pass it to the wallet page
    localStorage.setItem('walletData', JSON.stringify(displayData));
    // Navigate to the wallet page
    navigate('/ReplenishWallet', { state: { agentData: displayData } });
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
    await loadAgents(); // Refresh the entire list after approval
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
            <a href="#" onClick={handleRefresh}>Home</a>
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
            <div className="info-row">
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

              <div className="wallet-button-container">
                <div className="wallet-container" onClick={handleWalletClick}>
                  <div className="wallet-icon-wrapper">
                    <Wallet className="wallet-icon" />
                  </div>
                  <span className="wallet-text">Replenish Wallet</span>
                </div>
              </div>
              <div className="">
                <button  onClick={gotoMIS} className='apply-btn-emp' style={{ display: '' }}>
                  MIS Report
                </button> </div>

                <div className="">
                <button  onClick={gotoMISAgent} className='apply-btn' style={{ display: '' }}>
                 Agent MIS Details
                </button> </div>
            </div>
          </div>
        </div>

        {/* Agents List Card */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
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