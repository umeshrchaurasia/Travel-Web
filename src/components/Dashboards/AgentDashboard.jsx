import React, { useState, useEffect } from 'react';
import {
  UserCircle, Mail, BadgeCheck, LogOut, UserPlus, RefreshCw, Home, Upload, CheckCircle, X,
   Wallet, CreditCard,ArrowLeftCircle
} from 'lucide-react';

import { fetchAgentsList, getAgentById } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/auth';

import './AgentDashboard.css';
import './Modal.css';
import logo from '../../../src/assets/img/TravelAssist.webp';

import PremiumCalculator from './AgentDashboards/PremiumCalculator';


const defaultData = {
  agents: [],
  loading: true
};



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
  const isExpired = diffDays <= 0;
  const eligibleProposal = !isExpired;

  return {
    days: diffDays,
    isExpired: isExpired,
    eligibleProposal: eligibleProposal,
    referenceDate: referenceDate
  };
};


const AgentDashboard = ({ userData = null, onLogout = () => { } }) => {
  const [userProfile, setUserProfile] = useState(() => {
    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile ? JSON.parse(savedProfile) : userData;
  });

  const [displayData, setDisplayData] = useState(userData || userProfile);
  const [walletStatus, setWalletStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const [agents, setAgents] = useState(defaultData.agents);

  // Fetch agent details with wallet information
  const fetchAgentDetails = async () => {
    try {
      setLoading(true);

      // Get agent ID from the current user data
      const agentId = displayData?.AgentId || displayData?.agentId;

      if (!agentId) {
        console.error('Agent ID not found in profile data');
        setLoading(false);
        return;
      }

      // Call the API to get detailed agent information
      const response = await getAgentById(agentId);

      if (response.Status === 'Success' && response.MasterData && response.MasterData.length > 0) {
        const agentData = response.MasterData[0];

        // Calculate wallet status based on dates
        const walletUpdateDate = agentData.Wallet_Update_Date;
        const adminApprovedDate = agentData.AdminApproved_Date;

        const walletStatusInfo = calculateRemainingDays(walletUpdateDate, adminApprovedDate);

        // Set wallet status
        setWalletStatus(walletStatusInfo);

        // Update the display data with the latest information
        const updatedDisplayData = {
          ...displayData,
          ...agentData,
          walletStatus: walletStatusInfo
        };

        setDisplayData(updatedDisplayData);

        // Update localStorage for other components to use
        localStorage.setItem('userProfile', JSON.stringify(updatedDisplayData));
      } else {
        console.error('Failed to fetch agent details:', response.Message);
      }
    } catch (error) {
      console.error('Error fetching agent details:', error);
    } finally {
      setLoading(false);
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

  // Load agent data
  useEffect(() => {
    if (userData?.AgentId || userProfile?.AgentId) {
      fetchAgentDetails();
    }
  }, [userData?.AgentId, userProfile?.AgentId]);

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
    fetchAgentDetails();
  };
    const handleHome= () => {
    handleGoToPlanSelection();
  };

  const handleWalletClick = () => {
    // Store the enriched display data in localStorage
    localStorage.setItem('walletData', JSON.stringify(displayData));

    // Navigate to the wallet page with the enriched state
    navigate('/wallet', {
      state: {
        agentData: displayData,
        walletStatus: walletStatus
      }
    });
  };

  const goToCOI = () => {
    // Store the enriched display data in localStorage
    localStorage.setItem('walletData', JSON.stringify(displayData));

    // Navigate to the wallet page with the enriched state
    navigate('/GenerateCOI', {
      state: {
        agentData: displayData,
        walletStatus: walletStatus
      }
    });
  };


  const gotoMIS = () => {
    //const empId = displayData.id || displayData.UId;
    localStorage.setItem('walletData', JSON.stringify(displayData));

    if (displayData.Paymentmode === 'Upfront Commission') {
      navigate('/TDS_Proposal', {
        state: {
          empid: '',
          agentData: displayData,
          userType: 'Agent',
          adminId: ''
        }
      });
    } else {
      navigate('/MIS_Proposal', {
        state: {
          empid: '',
          agentData: displayData,
          userType: 'Agent',
          adminId: ''
        }
      });
    }
  }

  const goToRazorPayment = () => {
    // Store the enriched display data in localStorage
    const insuranceData = {

      "fullName": "Test Testmesh Test",
      "paxId": "PaxId-951562",
      "psoNumber": "PSO-333120",
      "certificateNumber": "110392528221003360",
      "downloadFilePath": "https://xpas-preprod.reliancegeneral.co.in/XPAS_TravelWebAPI_UAT/api/XpasPolicyInsurance/GetXpasPolicyInsurancePDF?certificateNumber=vz9NNFOacw37lblI+s4B5kq3T5k7SNgH",
      "AgentId": 35,
      "AgentCode_BASCode": "202504146217",
      "premiumAmount": 5405,
      "selectedOption": "discount",
      "radiobtn_selectedOption": "discount",
      "radiobtn_selectedAmount": 3115

    };
    sessionStorage.setItem('insuranceData', JSON.stringify(insuranceData));
    // Redirect to payment page after 2 seconds
    setTimeout(() => {
      navigate('/RazorPaymentPage');
    }, 10);
  };


const handleGoToPlanSelection = () => {
   navigate('/dashboard');
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading agent data...</p>
      </div>
    );
  }

  if (!displayData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No agent data available. Please login again.</p>
      </div>
    );
  }

  return (
    <>
      <header className="top-header">
        <div className="header-content">
          <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
          <div className="d-flex justify-content-center py-4">
            <div className="logo d-flex align-items-center w-auto">
              <span className="d-none d-lg-block">Travel Assistance Service</span>
            </div>
          </div>
          <nav className="nav-link">
            <a href="#" className="nav-link" onClick={handleHome}>Home</a>
            <a href="#" className="nav-link">Contact Us</a>
            <a href="#" className="nav-link">About Us</a>
            <button autoFocus onClick={handleLogout} className="btn btn-danger">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {/* Agent Info Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="welcome-title">Welcome, {displayData.name || displayData.FullName}
            
             <button onClick={handleGoToPlanSelection} className="back-to-selection-btn">
                    <ArrowLeftCircle size={18} />
                    <span>Back To Plan Selection</span>
                  </button>
            </h2>
          </div>
          <div className="employee-info">
            <div className="info-row">
              <div className="info-item">
                <span className="info-label spaced5">
                  <UserCircle className="w-4 h-4 inline-block mr-2 spaced5" />
                  <span className="font-weight">Agent CODE</span>
                </span>
                <span className="info-value spaced10">{displayData.Agent_Code}</span>

                <span className="info-label spaced10">
                  <Mail className="w-4 h-4 inline-block mr-2 spaced5" />
                  <span className="font-weight">Email</span>
                </span>
                <span className="info-value">{displayData.email || displayData.EmailID}</span>
              </div>

              {/* Enhanced Wallet Button with yellow highlight */}
              <div className="wallet-button-container">

                <button onClick={goToRazorPayment} className="apply-btn" style={{ display: 'none' }}>
                  Payment
                </button>
                <button onClick={goToCOI} className="apply-btn">
                  View COI
                </button>
                <div className="wallet-containerA" onClick={handleWalletClick}>
                  <div className="wallet-icon-wrapper">
                    <Wallet className="wallet-iconA" />
                  </div>
                  <span className="wallet-textA">Wallet</span>
                </div>
                <button onClick={gotoMIS} className='Premium-btn-MIS' >
                  MIS Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Dashboard Content */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <main className="max-w-7xl mx-auto">

                <PremiumCalculator
                  agentData={displayData}
                  walletStatus={walletStatus}
                />



              </main>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
      </footer>
    </>
  );
};

export default AgentDashboard;