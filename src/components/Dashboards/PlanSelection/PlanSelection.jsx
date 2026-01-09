import React, { useState, useEffect } from 'react';
import {
  UserCircle, Mail, BadgeCheck, HardDrive, FileText, LogOut, UserPlus,
  RefreshCw, Home, Upload, CheckCircle, X, Wallet, CreditCard, ArrowLeftCircle,
  Activity, Heart
} from 'lucide-react';

import { getAgentById } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../services/auth';

import './PlanSelection.css';

import logo from '../../../../src/assets/img/TravelAssist.webp';


const PlanSelection = ({ userData = null, onLogout = () => { } }) => {

  const [displayData_sel, setDisplayData_sel] = useState(userData);


  const [loading, setLoading] = useState(true);

  const [view, setView] = useState('selection'); // 'selection' or 'travel'

  const [MainAgent, setMainAgent] = useState('');

  const [showWellnessOptions, setShowWellnessOptions] = useState(false);


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

  const handleAddAgent = () => {
    navigate('/Add_subAgent', { state: { agentData: displayData_sel } });
  };


  if (loading) {
    return <div className="loading-container"><p>Loading...</p></div>;
  }

  if (!displayData_sel) {
    return <div className="loading-container"><p>No agent data found. Please login again.</p></div>;
  }

  // --- NEW LOGIC FOR CONDITIONAL RENDERING ---
  //const allowedAgentIds = [28, 23, 12];
  //const currentAgentId = displayData_sel.AgentId ? parseInt(displayData_sel.AgentId) : null;
  // const showPractoCard = currentAgentId && allowedAgentIds.includes(currentAgentId);
  // --- END NEW LOGIC ---
  const isAddSubAgentButtonVisible = !MainAgent || MainAgent === '0' || MainAgent === 'null' || MainAgent === 'undefined';;

  return (
    <div style={commonStyles.container}>
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
              </div>

              {isAddSubAgentButtonVisible && (
                <div className="wallet-button-container">
                  <button onClick={handleAddAgent} className="apply-btn flex items-center gap-2">
                    <UserPlus className="w-4 h-4 mr-2 pr-2" />
                    Add Sub Agent
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back Button for Wellness View */}
        {showWellnessOptions && (
          <div style={{ maxWidth: '100%', marginBottom: '1rem', marginTop: '1rem' }}>
            <button
              onClick={() => setShowWellnessOptions(false)}
              className="back-to-selection-btn"
              style={{ position: 'relative', top: '0', right: '0' }}
            >
              <ArrowLeftCircle size={18} />
              Back to Main Menu
            </button>
          </div>
        )}

        {/* Dynamic Selection Container */}
        <div className="selection-container">

          {!showWellnessOptions ? (
            /* --- MAIN VIEW: Travel Assist & Zextra Wellness --- */
            <>
              {/* Card 1: Travel Assist */}
              <div className="selection-card" onClick={handleAgentDashboardClick}>
                <HardDrive size={48} className="selection-icon" />
                <h3>Travel Assist</h3>
                <p>Proceed to calculate premium and execute travel assistance & services.</p>
              </div>

              {/* Card 2: Zextra Wellness */}
              <div className="selection-card" onClick={() => setShowWellnessOptions(true)}>
                <Activity size={48} className="selection-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} />
                <h3>Zextra Wellness</h3>
                <p>Access wellness plans, Practo subscriptions, and health services.</p>
              </div>
            </>
          ) : (
            /* --- SUB VIEW: Practo Subscription & Practo Health --- */
            <>
              {/* Card 1: Practo Subscription */}
              <div className="selection-card" onClick={handlePractoClick}>
                <FileText size={48} className="selection-icon" />
                <h3>Practo Subscription</h3>
                <p>Navigate to the Practo section for subscription plans.</p>
              </div>

        

              {/* Card 2: AyushPay Health */}

              {[12, 28, 29].includes(Number(displayData?.AgentId)) && (
              <div className="selection-card" onClick={handleAyushPayHealthClick}>
                <Heart size={48} className="selection-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }} />
                <h3>AyushPay</h3>
                <p>Navigate to the AyushPay section for subscription plans.</p>
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