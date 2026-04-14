import React, { useState, useEffect } from 'react';
import {
  UserCircle, Mail, BadgeCheck, HardDrive, FileText, LogOut, UserPlus,
  RefreshCw, Home, Upload, CheckCircle, X, Wallet, CreditCard, ArrowLeftCircle,
  Activity, Heart, Link, Check, Copy, Plane, ArrowRight, Shield
} from 'lucide-react';

import { getAgentById } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../services/auth';

import { useAgentDispatch } from '../../../redux/Agent/hooks';
import { setAgentData } from '../../../redux/Agent/agentSlice';

import './PlanSelection.css';

import logo from '../../../../src/assets/img/TravelAssist.webp';
import logowellness from '../../../../src/assets/img/TravelAssist_practo.webp';

import ayushlogo from '../../../../src/assets/img/ayushlogo.png';

const PlanSelection = ({ userData = null, onLogout = () => { } }) => {

  const dispatch = useAgentDispatch();

  const [displayData_sel, setDisplayData_sel] = useState(userData);

  const [loading, setLoading] = useState(true);

  const [view, setView] = useState('selection'); // 'selection' or 'travel'

  const [MainAgent, setMainAgent] = useState('');

  const [currentView, setCurrentView] = useState('main');

  const [isCopied, setIsCopied] = useState(false);

  const navigate = useNavigate();

  // ADD THIS LINE TO Agent id wise Display DATA
  const displayData = userData || JSON.parse(localStorage.getItem('userProfile'));
  // --- CORRECTED useEffect HOOK ---
  useEffect(() => {
    const initializeAndFetch = async () => {
      // Start with data from login props, or fall back to localStorage.
      let currentUserData = userData || JSON.parse(localStorage.getItem('userProfile'));

      // If we have data but it's incomplete (e.g., missing Agent_Code), we must fetch the full details.
      if (currentUserData) {
        // Use the common pattern to get AgentId, accommodating different casings/sources
        const agentId = currentUserData.AgentId || currentUserData.agentId;

        // Only fetch if we have an ID AND the AgentId in localStorage is not a string "28", "23", or "12"
        // This makes sure we fetch the full details for the required fields like FullName, Agent_Code, and EmailID.
        if (agentId) {
          try {
            const response = await getAgentById(agentId);
            if (response.Status === 'Success' && response.MasterData?.length > 0) {
              const fullAgentData = response.MasterData[0];
              // Merge new data with existing data, update state, and save to localStorage
              const finalData = { ...currentUserData, ...fullAgentData };
              setDisplayData_sel(finalData);
              setMainAgent(String(fullAgentData.Main_Agent || ''));

              localStorage.setItem('userProfile', JSON.stringify(finalData));
            } else {
              // Even if fetch fails, use existing data
              setDisplayData_sel(currentUserData);
            }
          } catch (error) {
            console.error('Error fetching full agent details:', error);
            // Even if fetch fails, use existing data
            setDisplayData_sel(currentUserData);
          }
        } else {
          // If no agentId is found, just use the current data.
          setDisplayData_sel(currentUserData);
          localStorage.setItem('userProfile', JSON.stringify(currentUserData));
        }
      }
      setLoading(false);
    };

    initializeAndFetch();
  }, [userData]); // Dependency is on the initial userData prop to run once.


  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    logout();
    onLogout();
    navigate('/login', { replace: true });
  };


  const handlePractoClick = () => {
    // Now displayData_sel is guaranteed to be the full profile
    navigate('/practo', { state: { agentData: displayData_sel } });
  };

  const handleAyushPayHealthClick = () => {
    navigate('/Ayushpay', { state: { agentData: displayData_sel } });

  };

  const handleAgentDashboardClick = () => {
    navigate('/AgentDashboard', { state: { agentData: displayData_sel } });
  };

  const handleBajajTravelClick = () => {
    if (displayData_sel) {
      // 1. Prepare payload matching AgentState interface
      const reduxPayload = {
        agentId: displayData_sel.AgentId || displayData_sel.agentId,
        FullName: displayData_sel.name || displayData_sel.FullName,
        agentEmail: displayData_sel.email || displayData_sel.EmailID,
        Agent_Code: displayData_sel.Agent_Code,
        MobileNumber: displayData_sel.MobileNumber,
        UId: displayData_sel.UId
      };
      // 2. Dispatch to the AGENT store
      dispatch(setAgentData(reduxPayload));

      // 3. Navigate
      navigate('/BajajTravel');
    }
  };

  const handleAddAgent = () => {
    navigate('/Add_subAgent', { state: { agentData: displayData_sel } });
  };

  const handleCopyLink = () => {
    if (!displayData_sel?.Agent_Code) return;

    const link = `${window.location.origin}/CustomerPlanSelection/${displayData_sel.Agent_Code}`;

    // Modern Clipboard API (HTTPS / localhost)
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(link).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
    // Fallback for HTTP
    else {
      const textArea = document.createElement("textarea");
      textArea.value = link;
      textArea.style.position = "fixed"; // avoid scroll
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        alert("Copy failed. Please copy manually.");
      }

      document.body.removeChild(textArea);
    }
  };

  if (loading) {
    return <div className="loading-container"><p>Loading...</p></div>;
  }

  if (!displayData_sel) {
    return <div className="loading-container"><p>No agent data found. Please login again.</p></div>;
  }

  const isAddSubAgentButtonVisible = !MainAgent || MainAgent === '0' || MainAgent === 'null' || MainAgent === 'undefined';
  
  // Safely extract the current AgentId to a number for our checks
  const currentAgentId = Number(displayData_sel.AgentId || displayData_sel.agentId);

  return (
    <div style={commonStyles.container}>

      {/* Injecting specific card designs to match CustomerPlanSelection */}
      <style>
        {`
          .customer-selection-card {
              background: #ffffff;
              border-radius: 0.75rem;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
              padding: 2.5rem;
              width: 470px;
              text-align: center;
              cursor: pointer;
              border: 1px solid #e0e0e0;
              border-top: 4px solid #e0e0e0;
              transition: all 0.3s ease;
              overflow: hidden;
              position: relative;
          }
          /* Practo Hover Effect (Purple) */
          .practo-hover-card:hover {
              border: 2px solid #6c63ff !important;
              border-top: 4px solid #6c63ff !important;
              background-color: #f5f3ff !important;
              transform: translateY(-10px);
              box-shadow: 0 10px 20px rgba(108, 99, 255, 0.2) !important;
          }
          /* AyushPay Hover Effect (Pink) */
          .ayush-hover-card:hover {
              border: 2px solid #ec4899 !important;
              border-top: 4px solid #ec4899 !important;
              background-color: #fdf2f8 !important;
              transform: translateY(-10px);
              box-shadow: 0 10px 20px rgba(236, 72, 153, 0.2) !important;
          }
          /* Active/Selected Animation */
          .customer-selection-card:active {
              transform: scale(0.97);
              opacity: 0.9;
          }
          .ayush-premium-btn {
              color: white;
              padding: 0.75rem;
              border-radius: 0.5rem;
              border: none;
              font-weight: 600;
              display: flex;
              justify-content: center;
              align-items: center;
              transition: opacity 0.2s;
          }
          .ayush-premium-btn:hover {
              opacity: 0.9;
          }
          `}
      </style>


      <header style={commonStyles.header}>
        <div style={commonStyles.headerContent}>
          <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
          <div className="logo d-flex align-items-center w-auto">
            <span className="d-none d-lg-block">Travel Assistance Service</span>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button
              onClick={handleLogout}
              style={{
                ...commonStyles.button,
                backgroundColor: '#ef4444'
              }}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main style={commonStyles.mainContent1}>

        {/* Agent Info Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="welcome-title">Welcome, {displayData_sel.name || displayData_sel.FullName}
            </h2>
            {/* Back Button positioned top-right inside header */}
            {currentView !== 'main' && (
              <button
                onClick={() => setCurrentView('main')}
                className="back-to-selection-btn"
              >
                <ArrowLeftCircle size={18} />
                <span>Back to Main Menu</span>
              </button>
            )}
          </div>
          <div className="employee-info">
            <div className="info-row">
              <div className="info-item">
                <span className="info-label spaced5">
                  <UserCircle className="w-4 h-4 inline-block mr-2 spaced5" />
                  <span className="font-weight">Agent CODE</span>
                </span>
                <span className="info-value spaced10">{displayData_sel.Agent_Code}</span>

                <span className="info-label spaced10">
                  <Mail className="w-4 h-4 inline-block mr-2 spaced5" />
                  <span className="font-weight">Email</span>
                </span>
                <span className="info-value">{displayData_sel.email || displayData_sel.EmailID}</span>
                {displayData_sel.Agent_Code && (
                  <button
                    onClick={handleCopyLink}
                    className="apply-btn flex items-center gap-2"
                    style={{
                      backgroundColor: isCopied ? '#059669' : '#6c63ff', // Green if copied, Purple default
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    {isCopied ? <Check size={18} /> : <Copy size={18} />}
                    {isCopied ? 'Copied!' : 'Zextraa link'}
                  </button>
                )}
              </div>

              {isAddSubAgentButtonVisible && (
                <div className="wallet-button-container">
                  <button onClick={handleAddAgent} className="apply-btn flex items-center gap-2">
                    <UserPlus className="w-4 h-4 mr-2 pr-2 " />
                    Add Sub Agent
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Selection Container */}
        <div className="selection-container">
          {/* VIEW 1: MAIN SELECTION */}
          {currentView === 'main' && (
            /* --- MAIN VIEW: Travel Assist & Zextra Wellness --- */
            <>
              {/* Card 1: Travel Assist */}
              <div className="selection-card" onClick={() => setCurrentView('travel')}>
                <HardDrive size={48} className="selection-icon" />
                <h3>Travel Assist</h3>
                <p>Proceed to calculate premium and execute travel assistance & services.</p>
              </div>

              {/* Card 2: Zextra Wellness */}
              <div className="selection-card" onClick={() => setCurrentView('wellness')}>
                <Activity size={48} className="selection-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} />
                <h3>Zextra Wellness</h3>
                <p>Access wellness plans, Practo subscriptions, and health services.</p>
              </div>
            </>
          )}

          {/* VIEW 2: TRAVEL SELECTION (Reliance & Bajaj) */}
          {currentView === 'travel' && (
            <>
              {/* Card 1: Reliance Traveller */}
              <div className="selection-card" onClick={handleAgentDashboardClick}>
                {/* Reusing a styled icon for Reliance */}
                <Plane size={48} className="selection-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }} />
                <h3>Reliance Traveller</h3>
                <p>Calculate premium for Reliance Travel Insurance.</p>
              </div>

                {/* Card 2: Bajaj Traveller */}
               {[42, 12, 28, 29].includes(currentAgentId) && (           
              <div className="selection-card" onClick={handleBajajTravelClick}>

                <Shield size={48} className="selection-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }} />
                <h3>Bajaj Traveller</h3>
                <p>Calculate premium for Bajaj Travel Insurance.</p>
              </div>
             )}
            </>
          )}

          {/* VIEW 3: WELLNESS SELECTION (Practo & AyushPay) */}
          {currentView === 'wellness' && (
            <>
              {/* Card 1: Practo Subscription */}
              <div className="customer-selection-card practo-hover-card" onClick={handlePractoClick}>
                <div style={commonStyles.leftSection}><img src={logowellness} alt="Logo" style={{ maxHeight: '60px' }} /></div>
                <h3>Practo Subscription</h3>
                {/* Conditionally render price based on currentAgentId */}
                <p style={{ fontWeight: 'bold', color: '#6c63ff' }}>
                  {currentAgentId === 59 ? '(Rs. 220 + 18% GST)' : '(Rs. 699 + 18% GST)'}
                </p>
                <div style={benefitListStyle}>
                  <p>✓ Covers up to 2 adults and 1 kid under one subscription</p>
                  <p>✓ Unlimited chat, audio, and video consultations with doctors</p>
                  <p>✓ One free, in-person OPD consultation per year at any Practo Cashless Network clinic</p>
                  <p>✓ Discount on diagnostic tests up to 20% and medicines up to 5%</p>
                  <p>-</p><p>-</p>
                </div>
                <button className="ayush-premium-btn" style={{ width: '100%', marginTop: '1.5rem', backgroundColor: '#6c63ff' }}>
                  Click Here <ArrowRight size={18} className="inline ml-2" />
                </button>
              </div>

              {/* Card 2: AyushPay Health */}
              {/* Hide AyushPay Health completely if agent ID is 28 */}
              {currentAgentId !== 59 && (
                <div className="customer-selection-card ayush-hover-card" onClick={handleAyushPayHealthClick}>
                  <div style={commonStyles.leftSection}><img src={logowellness} alt="Logo" style={{ maxHeight: '60px' }} /></div>
                  <h3>Medical Emergency Landing</h3>
                  <p style={{ fontWeight: 'bold', color: '#ec4899' }}>(Rs. 499 + 18% GST)</p>

                  <div style={benefitListStyle}>
                    <p>✓ Covers up to 2 adults under one subscription</p>
                    <p>✓ Unlimited video consultations with doctors (General Physicians only)</p>
                    <p>✓ No, in-person OPD consultation available</p>
                    <p>✓ Discount on diagnostic tests and medicines up to 25%</p>
                    <p>✓ 0% Interest Medical Loans up to 1 year - Max ₹15 Lakhs.Subject to min CIBIL score of rs.650+</p>
                    <p>✓ Max 10% Cashback on Hospital Treatment cost</p>
                    <p>✓ ₹500 per day Hospital Admission Allowance (Max 3 days)</p>
                    <p>✓ ₹5,00 Health Wallet Credit on the above subscription</p>
                  </div>

                  <button className="ayush-premium-btn" style={{ width: '100%', marginTop: '1.5rem', backgroundColor: '#ec4899' }}>
                    Click Here <ArrowRight size={18} className="inline ml-2" />
                  </button>
                  <footer style={{ marginTop: '1.5rem' }}>
                    <p>  <img src={ayushlogo} style={{ maxHeight: '20px' }} /> powered by Ayushpay</p>
                  </footer>
                </div>
              )}
            </>
          )}

        </div>
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
      </footer>
    </div>
  );
};
const benefitListStyle = {
  textAlign: 'left',
  marginTop: '15px',
  padding: '10px',
  background: '#f9fafb',
  borderRadius: '8px',
  fontSize: '0.85rem',
  lineHeight: '1.6'
};

const commonStyles = {
  container: {
    backgroundColor: '#f3f4f6',
    minHeight: '100vh'
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
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  leftSection: {
    flex: 1
  },
  logo: {
    height: '40px'
  },
  button: {
    backgroundColor: '#dc2626',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  mainContent1: {
    maxWidth: '1200px',
    margin: '20px auto',
    padding: '0 20px',
    flex: '1 0 auto'
  },
};
export default PlanSelection;