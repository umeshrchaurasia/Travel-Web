import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import AdminDashboard from './components/Dashboards/AdminDashboard';
import EmployeeDashboard from './components/Dashboards/EmployeeDashboard';
import AgentDashboard from './components/Dashboards/AgentDashboard';
import Dashboard from './components/Dashboards/Dashboard';
import AgentList from './components/Dashboards/AgentList';
import ProposalDocument from './components/Dashboards/ProposalDocument';

import ReplenishWallet from './components/Dashboards/ReplenishWallet/ReplenishWallet';
import WalletPage from './components/Dashboards/Wallet/WalletPage';

import GenerateCOI from './components/Dashboards/UpdatePolicy/GenerateCOI';
import Employee_COI from './components/Dashboards/UpdatePolicy/Employee_COI';
import Testempcois from './components/Dashboards/UpdatePolicy/Testempcois';

import UpdatePolicyInsurance from './components/Dashboards/UpdatePolicy/UpdatePolicyInsurance';
import SecondPage from './components/Dashboards/UpdatePolicy/SecondPage';

import RazorPaymentPage from './components/Dashboards/RazorPayment/RazorPaymentPage';
import RazorPayment_input from './components/Dashboards/RazorPayment/RazorPayment_input';
import RazorPayment_cancel from './components/Dashboards/RazorPayment/RazorPayment_cancel';
import Razorpaymentsuccess from './components/Dashboards/RazorPayment/Razorpaymentsuccess';
import PolicyDownload from './components/Dashboards/Policy_InvoiceDownload/PolicyDownload';

import WelcomeLetterForm from './components/Dashboards/WelcomeLetter/WelcomeLetterForm';

import PaymentTravel from './components/Dashboards/PaymentTravel';

import MIS_Proposal from './components/Dashboards/MIS_Report/MIS_Proposal';
import MIS_Proposal_Admin from './components/Dashboards/MIS_Report/MIS_Proposal_Admin';
import MIS_Agentdetail_Admin from './components/Dashboards/MIS_Report/MIS_Agentdetail_Admin';

import TDS_Proposal from './components/Dashboards/MIS_Report/TDS_Proposal';
import Update_Agent from './components/Dashboards/AgentDashboards/Update_Agent';



import Practo from './components/Dashboards/Practo/Practo'
import PlanSelectionAgent from './components/Dashboards/PlanSelection/PlanSelection';

import PractoWalletDetails from './components/Dashboards/Practo/PractoWalletDetails'

import WalletPagePracto from './components/Dashboards/Practo/WalletPagePracto'

import ReplenishWallet_Practo from './components/Dashboards/ReplenishWallet/ReplenishWallet_Practo'

import MIS_Proposal_Practo from './components/Dashboards/MIS_Report/MIS_Proposal_Practo'

import TDS_Proposal_Practo from './components/Dashboards/MIS_Report/TDS_Proposal_Practo';
import MIS_Proposal_Admin_Practo from './components/Dashboards/MIS_Report/MIS_Proposal_Admin_Practo';

import Add_subAgent from './components/Dashboards/SubAgent/Add_subAgent';
import SubAgentlistview from './components/Dashboards/SubAgent/SubAgentlistview';

import MIS_Proposal_SubAgent__ByAgent from './components/Dashboards/MIS_Report/MIS_Proposal_SubAgent__ByAgent';
import MIS_Proposal_SubAgent_ByAdmin from './components/Dashboards/MIS_Report/MIS_Proposal_SubAgent_ByAdmin';
import TDS_Proposal_SubAgent from './components/Dashboards/MIS_Report/TDS_Proposal_SubAgent';

import Ayushpay from './components/Dashboards/Ayushpayhealth/Ayushpay';

import AyushWalletDetails from './components/Dashboards/Ayushpayhealth/AyushWalletDetails';

import WalletPageAyush from './components/Dashboards/Ayushpayhealth/WalletPageAyush';

import ReplenishWallet_Ayush from './components/Dashboards/ReplenishWallet/ReplenishWallet_Ayush';

import MIS_Proposal_AyushPay from './components/Dashboards/MIS_Report/MIS_Proposal_AyushPay';

function App() {
  const [userData, setUserData] = useState(() => {
    const savedData = localStorage.getItem('userData');
    const sessionData = sessionStorage.getItem('userData');
    return savedData ? JSON.parse(savedData) : sessionData ? JSON.parse(sessionData) : null;
  });

  const handleLogin = (user) => {
    localStorage.setItem('userData', JSON.stringify(user));
    setUserData(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('userData');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('proposalData');
    setUserData(null);
    window.location.href = '/login';
  };

  const ProtectedRoute = ({ children }) => {
    const savedData = localStorage.getItem('userData');
    const sessionData = sessionStorage.getItem('userData');
    if (!savedData && !sessionData) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="app-container theme-blue">
        <Routes>
          <Route path="/login" element={
            userData ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
          } />

          <Route path="/signup" element={
            <Signup onSignupSuccess={() => <Navigate to="/login" />} />
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              {userData?.EMPType === 'Admin' ? (
                <AdminDashboard userData={userData} onLogout={handleLogout} />
              ) : userData?.EMPType === 'Emp' ? (
                <EmployeeDashboard userData={userData} onLogout={handleLogout} />
              ) : (
                <PlanSelectionAgent userData={userData} onLogout={handleLogout} />
              )}
            </ProtectedRoute>
          } />


          <Route path="/AgentDashboard" element={
            <ProtectedRoute>
              <AgentDashboard userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />





          <Route path="/" element={
            <ProtectedRoute>
              <Navigate to="/dashboard" />
            </ProtectedRoute>
          } />

          <Route path="/ProposalDocument" element={
            <ProtectedRoute>
              <ProposalDocument />
            </ProtectedRoute>
          } />

          <Route path="/payment-travel" element={
            <ProtectedRoute>
              <PaymentTravel userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/ReplenishWallet" element={
            <ProtectedRoute>
              <ReplenishWallet userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/wallet" element={
            <ProtectedRoute>
              <WalletPage userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/GenerateCOI" element={
            <ProtectedRoute>
              <GenerateCOI userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path='/Employee_COI' element={
            <ProtectedRoute>
              <Employee_COI userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path='/Testempcois' element={
            <ProtectedRoute>
              <Testempcois userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/UpdatePolicyInsurance" element={
            <ProtectedRoute>
              <UpdatePolicyInsurance userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/SecondPage" element={
            <ProtectedRoute>
              <SecondPage userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/RazorPaymentPage" element={
            <ProtectedRoute>
              <RazorPaymentPage userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/RazorPayment_input" element={
            <ProtectedRoute>
              <RazorPayment_input userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/RazorPayment_cancel" element={
            <ProtectedRoute>
              <RazorPayment_cancel userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/Razorpaymentsuccess" element={
            <ProtectedRoute>
              <Razorpaymentsuccess userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/RazorPaymentPage" element={
            <ProtectedRoute>
              <RazorPaymentPage userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/PolicyDownload" element={
            <ProtectedRoute>
              <PolicyDownload userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/WelcomeLetterForm" element={
            <ProtectedRoute>
              <WelcomeLetterForm userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/MIS_Proposal" element={
            <ProtectedRoute>
              <MIS_Proposal userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />


          <Route path="/MIS_Proposal_Admin" element={
            <ProtectedRoute>
              <MIS_Proposal_Admin userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/MIS_Agentdetail_Admin" element={
            <ProtectedRoute>
              <MIS_Agentdetail_Admin userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />



          <Route path="/TDS_Proposal" element={
            <ProtectedRoute>
              <TDS_Proposal userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/Update_Agent" element={
            <ProtectedRoute>
              <Update_Agent userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />




          <Route path="/Practo" element={
            <ProtectedRoute>
              <Practo userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/PractoWalletDetails" element={
            <ProtectedRoute>
              <PractoWalletDetails userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/WalletPagePracto" element={
            <ProtectedRoute>
              <WalletPagePracto userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/Ayushpay" element={
            <ProtectedRoute>
              <Ayushpay userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />


          <Route path="/ReplenishWallet_Practo" element={
            <ProtectedRoute>
              <ReplenishWallet_Practo userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/MIS_Proposal_Practo" element={
            <ProtectedRoute>
              <MIS_Proposal_Practo userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/TDS_Proposal_Practo" element={
            <ProtectedRoute>
              <TDS_Proposal_Practo userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/MIS_Proposal_Admin_Practo" element={
            <ProtectedRoute>
              <MIS_Proposal_Admin_Practo userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/Add_subAgent" element={
            <ProtectedRoute>
              <Add_subAgent userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/SubAgentlistview" element={
            <ProtectedRoute>
              <SubAgentlistview userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />


          <Route path="/MIS_Proposal_SubAgent__ByAgent" element={
            <ProtectedRoute>
              <MIS_Proposal_SubAgent__ByAgent userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />


          <Route path="/MIS_Proposal_SubAgent_ByAdmin" element={
            <ProtectedRoute>
              <MIS_Proposal_SubAgent_ByAdmin userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />


          <Route path="/TDS_Proposal_SubAgent" element={
            <ProtectedRoute>
              <TDS_Proposal_SubAgent userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/AyushWalletDetails" element={
            <ProtectedRoute>
              <AyushWalletDetails userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="/WalletPageAyush" element={
            <ProtectedRoute>
              <WalletPageAyush userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

            <Route path="/ReplenishWallet_Ayush" element={
            <ProtectedRoute>
              <ReplenishWallet_Ayush userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

           <Route path="/MIS_Proposal_AyushPay" element={
            <ProtectedRoute>
              <MIS_Proposal_AyushPay userData={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          

        </Routes>
      </div>
    </Router>
  );
}

export default App;