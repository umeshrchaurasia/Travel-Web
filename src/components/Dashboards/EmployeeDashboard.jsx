import React, { useState, useEffect } from 'react';
import {
  UserCircle, Mail, BadgeCheck, LogOut, UserPlus, RefreshCw,
  Home, Upload, CheckCircle, X, FileText
} from 'lucide-react';
import { fetchAgentsList, getAgentDocuments, GetAgentSummary } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/auth';
import './EmployeeDashboard.css';
import logo from '../../../src/assets/img/TravelAssist.webp';
import AddAgentModal from './AddAgentModal';
import AddAgentdocModal from './AddAgentdocModal';
import './Modal.css';

import WelcomeLetterForm from './WelcomeLetter/WelcomeLetterForm';

const defaultData = {
  agents: [],
  loading: true
};


const EmployeeDashboard = ({ userData = null, onLogout = () => { } }) => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState(defaultData.agents);
  const [loading, setLoading] = useState(defaultData.loading);
  const [userProfile, setUserProfile] = useState(() => {
    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile ? JSON.parse(savedProfile) : userData;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpendoc, setIsModalOpendoc] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [documentStatuses, setDocumentStatuses] = useState({});
  const [modalInstanceId, setModalInstanceId] = useState(Date.now());

  const [showWelcomeLetterForm, setShowWelcomeLetterForm] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // Calculate pagination values
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentAgents = agents.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(agents.length / rowsPerPage);


  // Toggle welcome letter form
  const toggleWelcomeLetterForm = () => {
    setShowWelcomeLetterForm(!showWelcomeLetterForm);
  };

  // Status helper functions
  const getStatusStyles = (adminApproved) => {

    const status = Number(adminApproved);
    switch (status) {
      case 1:
        return {
          className: 'status-active',
          text: 'Approved'
        };
      case 2:
        return {
          className: 'status-rejected',
          text: 'Rejected'
        };
      default:
        return {
          className: 'status-pending',
          text: 'Pending'
        };
    }
  };

  const getAgentConfirmStyles = (agentConfirm) => {
    // Handle undefined or null values
    if (agentConfirm === undefined || agentConfirm === null) {
      return {
        className: 'status-pending',
        text: 'Pending'
      };
    }

    // Convert to string for consistent handling
    const confirmStr = String(agentConfirm).trim().toLowerCase();

    // Check for "Approved" or "Approve" text variations
    if (confirmStr === "approved" || confirmStr === "Approved" || confirmStr === "1") {
      return {
        className: 'status-active',
        text: 'Approved'
      };
    }

    // Check for "Rejected" or numeric 2
    if (confirmStr === "rejected" || confirmStr === "reject" || confirmStr === "2") {
      return {
        className: 'status-rejected',
        text: 'Rejected'
      };
    }

    // Default to Pending for any other value
    return {
      className: 'status-pending',
      text: 'Pending'
    };
  };


  const AgentSummary = ({ userId }) => {
    const [summaryData, setSummaryData] = useState({
      TotalAgent: 0,
      TotalInactiveAgent: 0,
      CurrentMonthNewAgent: 0,
      TodayNewAgent: 0
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchSummaryData = async () => {
        try {
          if (!userId) return;

          setLoading(true);
          const result = await GetAgentSummary(userId);

          if (result.Status === 'Success' && result.MasterData && result.MasterData[0]) {
            setSummaryData(result.MasterData[0]);
          }
        } catch (error) {
          console.error('Error fetching agent summary:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchSummaryData();
    }, [userId]);

    return (
      <div className="summary-container">
        <h2 className="summary-title">Agent Summary</h2>
        <div className="summary-grid">
          <div className="summary-box">
            <h3>Total Agent</h3>
            <p>{loading ? '...' : summaryData.TotalAgent || 0}</p>
          </div>
          <div className="summary-box">
            <h3>Total Inactive Agent</h3>
            <p>{loading ? '...' : summaryData.TotalInactiveAgent || 0}</p>
          </div>
          <div className="summary-box">
            <h3>Current Month's New Agent</h3>
            <p>{loading ? '...' : summaryData.CurrentMonthNewAgent || 0}</p>
          </div>
          <div className="summary-box">
            <h3>Today's New Agent</h3>
            <p>{loading ? '...' : summaryData.TodayNewAgent || 0}</p>
          </div>
        </div>
      </div>
    );

  };


  const getDocumentButtonStatus = (agent, documentStatus) => {
    const status = documentStatus === 'completed';

    const adminStatus = Number(agent.Admin_Approved);


    switch (adminStatus) {
      case 1:
        return {
          className: 'btn-success',
          icon: <CheckCircle className="w-4 h-4 mr-2" />,
          text: 'Completed',
          disabled: true
        };
      case 2:
        return {
          className: 'btn-danger',
          icon: <Upload className="w-4 h-4 mr-2" />,
          text: 'Reupload',
          disabled: false
        };
      default:
        return {
          className: status ? 'btn-success' : 'btn-primary',
          icon: status ? <CheckCircle className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />,
          text: status ? 'Completed' : 'Pending',
          disabled: false
        };
    }
  };

  const loadAgents = async () => {
    try {
      setLoading(true);
      const userId = userData?.UId || userProfile?.id;
      const result = await fetchAgentsList(userId);

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

  const loadAgentDocuments = async (agentId) => {
    try {
      const response = await getAgentDocuments(agentId);
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
            documents: docs
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

  // Load agents data
  useEffect(() => {
    if (userData?.UId || userProfile?.id) {
      loadAgents();
    }
  }, [userData?.UId, userProfile?.id]);

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
    setCurrentPage(1); // Reset to first page on refresh
  };

  const handleAddAgent = () => {
    setSelectedAgent(null);
    // Generate a new modal instance ID to force remounting
    setModalInstanceId(Date.now());
    // Open the modal
    setIsModalOpen(true);
  };

  const handleAddAgent_doc = (agent) => {
    setSelectedAgent(agent);
    setIsModalOpendoc(true);
  };

  // In EmployeeDashboard.jsx - Keep your existing function
  const handleDocumentSuccess = async () => {
    try {
      setLoading(true); // Add loading state while updating
      // Refresh all data after document update
      await loadAgents();
      if (selectedAgent?.AgentId) {
        await loadAgentDocuments(selectedAgent.AgentId);
      }
      setIsModalOpendoc(false);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };
  const getDocumentStatus = (agentId) => {
    const status = documentStatuses[agentId];
    if (!status) return 'pending';
    return status.isComplete ? 'completed' : 'pending';
  };

  const goToEmpCOI = () => {

    const empId = displayData.id || displayData.UId;

    // Store the enriched display data in localStorage
    localStorage.setItem('walletData', JSON.stringify(displayData));

    // Navigate to the wallet page with the enriched state
    navigate('/Employee_COI', {
      state: {
        empid: empId,
        agentData: displayData
      }
    });
  };

  const gototest = () => {
    const empId = displayData.id || displayData.UId;
    localStorage.setItem('walletData', JSON.stringify(displayData));

    navigate('/MIS_Proposal', {
      state: {
        empid: empId,
        agentData: displayData,
        userType: 'Employee'
      }
    });
  }
  const goOcrNumber = () => {
    const empId = displayData.id || displayData.UId;
    localStorage.setItem('walletData', JSON.stringify(displayData));

    navigate('/OcrNumber', {
      state: {
        empid: empId,
        agentData: displayData,
        userType: 'Employee'
      }
    });
  }

  const goPlateOCR = () => {
    const empId = displayData.id || displayData.UId;
    localStorage.setItem('walletData', JSON.stringify(displayData));

    navigate('/PlateOCR', {
      state: {
        empid: empId,
        agentData: displayData,
        userType: 'Employee'
      }
    });
  }



  if (!userData && !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading user data...</p>
      </div>
    );
  }

  const displayData = userData || userProfile;

  return (
    <div className="EmployeeDashboard">
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
        {/* Employee Info Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="welcome-title">Welcome, {displayData.name || displayData.FullName}</h2>
          </div>
          <div className="employee-info">
            <div className="info-row">
              <div className="info-item">
                <span className="info-label spaced5">
                  <UserCircle className="w-4 h-4 inline-block mr-2 spaced5" />
                  <span className="font-weight">Employee ID</span>
                </span>
                <span className="info-value spaced10">{displayData.id || displayData.UId}</span>

                <span className="info-label spaced10">
                  <Mail className="w-4 h-4 inline-block mr-2 spaced5" />
                  <span className="font-weight">Email</span>
                </span>
                <span className="info-value">{displayData.email || displayData.EmailID}</span>
              </div>



              <button
                className="btn btn-primary"
                onClick={toggleWelcomeLetterForm}
              >
                <FileText className="w-4 h-4 mr-2" />
                {showWelcomeLetterForm ? 'Hide Welcome Letter' : 'Generate Welcome Letter'}

              </button>
              <button onClick={goToEmpCOI} className="apply-btn">
                View COI
              </button>
              <button onClick={gototest} className='apply-btn-emp' style={{ display: '' }}>
                MIS Report
              </button>




            </div>
          </div>
        </div>
        {/* Welcome Letter Form - conditionally rendered */}
        {showWelcomeLetterForm && (
          <div className="mt-4">
            <WelcomeLetterForm />
          </div>
        )}
        {/* Agents List Card */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                  <AgentSummary userId={userData?.UId || userProfile?.id} />
                </div>

                <h2 className="card-title">AGENT LIST</h2>
                <div className="header-actions">
                  <button onClick={handleRefresh} className="btn btn-primary spaced10">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </button>
                  <button onClick={handleAddAgent} className="btn btn-primary">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Agent
                  </button>
                </div>
              </main>
            </div>
          </div>
          <div className="card-body">
            <div className="table-container">
              {loading ? (
                <div className="loader-container">
                  <div className="custom-loader"></div>
                  <span className="loading-text">Loading Agent Data...</span>
                </div>
              ) : (
                <>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Sr No.</th>
                        <th>Agent Code</th>
                        <th>Agent Name</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Password</th>
                        <th>Document Status</th>
                        <th>Admin Approval</th>
                        <th>Agent Confirm</th>
                        <th>Wallet Balance</th>
                        <th>Payment Mode</th>
                        <th>Payout</th>
                        <th>Admin Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAgents.map((agent, index) => {
                        const documentStatus = getDocumentStatus(agent.AgentId);
                        const buttonStatus = getDocumentButtonStatus(agent, documentStatus);
                        const statusStyle = getStatusStyles(agent.Admin_Approved);

                        return (
                          <tr key={agent.AgentId}>
                            <td>{indexOfFirstRow + index + 1}</td>
                            <td>{agent.Agent_Code}</td>
                            <td>{agent.FullName}</td>
                            <td>{agent.EmailID}</td>
                            <td>{agent.MobileNumber}</td>
                            <td>{agent.Password}</td>
                            <td>
                              <button
                                onClick={() => handleAddAgent_doc(agent)}
                                className={`btn ${buttonStatus.className}`}
                                disabled={buttonStatus.disabled}
                              >
                                {buttonStatus.icon}
                                {buttonStatus.text}
                              </button>
                            </td>
                            <td>
                              <span className="status-badge status-cell">
                                <span className={getStatusStyles(agent.Admin_Approved).className}>
                                  {getStatusStyles(agent.Admin_Approved).text}
                                </span>
                              </span>
                            </td>
                            <td>
                              <span className="status-badge status-cell">
                                <span className={getAgentConfirmStyles(agent.Agent_Otp_Approved).className}>
                                  {getAgentConfirmStyles(agent.Agent_Otp_Approved).text}
                                </span>
                              </span>
                            </td>
                            <td>{agent.Wallet_Amount}</td>
                            <td>{agent.Paymentmode || agent.paymentmode}</td>
                            <td>{agent.Payout}</td>
                            <td className="admin-comment-cell">
                              {agent.Admin_comment || '-'}

                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="pagination-controls">
                      <button
                        className="btn btn-secondary"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >Prev</button>
                      <span className="px-4">Page {currentPage} of {totalPages}</span>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >Next</button>
                    </div>
                  )}
                </>
              )}
              {!loading && agents.length === 0 && (
                <p className="text-center py-4">No agents found</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <AddAgentModal
        key={`agent-modal-${modalInstanceId}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadAgents();
          setIsModalOpen(false);
        }}
        userId={userData?.UId || userProfile?.id || ''}
      />

      <AddAgentdocModal
        isOpen={isModalOpendoc}
        onClose={() => {
          setIsModalOpendoc(false);
          setSelectedAgent(null);
        }}
        onSuccess={handleDocumentSuccess}
        agentId={selectedAgent?.AgentId}
        userId={userData?.UId}
        adminApproved={selectedAgent?.Admin_Approved}
        adminComment={selectedAgent?.Admin_comment}
      />

      <footer className="footer">
        <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
      </footer>
    </div>
  );
};

export default EmployeeDashboard;