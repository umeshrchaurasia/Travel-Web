import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import {
    UserCircle, Mail, BadgeCheck, LogOut, UserPlus, RefreshCw,
    Home, Upload, CheckCircle, X, FileText, ArrowLeftCircle
} from 'lucide-react';
import { fetchSubAgentsList } from '../../../services/api';

import { logout } from '../../../services/auth';
import '../EmployeeDashboard.css';
import logo from '../../../assets/img/TravelAssist.webp';

// Placeholder for missing helper functions used in rendering
const getStatusStyles = (status: string) => {
    let className = 'status-pending';
    let text = 'Pending';
    if (status === 'Approved') { className = 'status-approved'; text = 'Approved'; }
    if (status === 'Rejected') { className = 'status-rejected'; text = 'Rejected'; }
    return { className, text };
};
const getAgentConfirmStyles = (status: string) => getStatusStyles(status);
const getDocumentStatus = (agentId: string) => 'N/A';
const getDocumentButtonStatus = (agent: any, status: string) => ({ text: 'View', disabled: false });
// End Placeholders

const defaultData = {
    agents: [],
    loading: true
};


const SubAgentlistview: React.FC = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as any || {};
    const parentAgentData = state.agentData || {};

    const displayData_sel = parentAgentData.FullName;

    const userId = parentAgentData.UId;
    const AgentId = parentAgentData.AgentId;

    const Main_Agent_type = parentAgentData.Agent_type;
    const [agents, setAgents] = useState(defaultData.agents);
    const [loading, setLoading] = useState(defaultData.loading);

    const [selectedAgent, setSelectedAgent] = useState(null);

    const [modalInstanceId, setModalInstanceId] = useState(Date.now());



    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;

    // Calculate pagination values
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentAgents = agents.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(agents.length / rowsPerPage);



    const loadAgents = async () => {
        try {
            setLoading(true);

            const result = await fetchSubAgentsList(AgentId);

            if (result.Status === 'Success') {
                setAgents(result.MasterData || []);

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


    // Handle back button
    useEffect(() => {
        const handleBackButton = (e: Event) => {
            e.preventDefault();
            window.history.forward();
        };

        window.history.pushState(null, '', window.location.pathname);
        window.addEventListener('popstate', handleBackButton);

        return () => {
            window.removeEventListener('popstate', handleBackButton);
        };
    }, []);

    // Load agents data
    useEffect(() => {

        if (AgentId) {
            loadAgents();
        } else {
            setLoading(false);
        }

    }, [AgentId]);

    const handleLogout = () => {
        try {
            localStorage.clear();
            sessionStorage.clear();
            logout();

            window.location.href = '/login';
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    const handleRefresh = () => {
        loadAgents();
        setCurrentPage(1); // Reset to first page on refresh
    };

    const handleGoToPlanSelection = () => {
        navigate('/Add_subAgent');
    };

    const goBack = () => {
        navigate('/dashboard');
    };

    const agentDisplayName = displayData_sel;

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
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button onClick={goBack} className="coi-button">
                            <Home size={18} /> Dashboard
                        </button>
                        <button onClick={handleLogout} className="coi-button coi-logout-button">
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="main-content">
                {/* Employee Info Card */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="welcome-title">Welcome, {agentDisplayName}</h2>
                        <button onClick={handleGoToPlanSelection}  className="back-to-selection-btn_subagent">
                            <ArrowLeftCircle size={18} />
                            <span>Back To Previous Page</span>
                        </button>
                    </div>
                    <div className="card-body">
                        <div className="table-container">
                            {loading ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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

                                                <th>Agent Type</th>
                                                <th>Agent Confirm</th>
                                                <th>Wallet Balance</th>
                                                <th>Payment Mode</th>
                                                <th>Payout</th>
                                                <th>Main Agent</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentAgents.map((agent: any, index: number) => {
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
                                                            {agent.Agent_type}
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
                                                            {agent.MainAgentName || '-'}

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



            <footer className="footer">
                <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
            </footer>
        </div>
    );
};


export default SubAgentlistview;