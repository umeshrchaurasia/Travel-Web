import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, LogOut, Home, X, Filter, Edit,ArrowLeftCircle } from "lucide-react";
import { logout } from '../../../services/auth';
import { get_agentnamelist_admin } from "../../../services/api";

import logo from '../../../../src/assets/img/TravelAssist.webp';
import '../UpdatePolicy/generatecoi.css';
import AgentdocshowModal from "../MIS_Report/AgentdocshowModal";
import EditAgentModal from "./EditAgentModal";

// Define the Agent interface based on your API response
interface Agent {
    AgentId?: number;
    Agent_Code?: string;
    FullName?: string;
    EmailID?: string;
    MobileNumber?: string;
    EmpName?: string;
    EmpMobileNumber?: string;
    Gender?: string;
    DOB?: string;
    Payout?: string;
    Paymentmode?: string;
    Wallet_Amount?: string;
    Wallet_Update_Date?: string;
    EducationQualification?: string;
    Address?: string;
    PAN_No?: string;
    GST?: string;
    AdminApproved_Date?: string;
    Created_on?: string;
    isactive?: number;
}

// Define the API response interface
interface ApiResponse {
    Status: string;
    Message?: string;
    StatusNo?: number;
    MasterData?: Agent[];
}

// Define location state interface
interface LocationState {
    adminId?: string;
    userType?: string;
}

const Update_Agent: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state as LocationState) || {};

    const [adminId, setAdminId] = useState<string>(state.adminId || '');
    const [userType, setUserType] = useState<string>(state.userType || '');

    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [agentName, setAgentName] = useState<string>(''); // State for agent name filter
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [agents, setAgents] = useState<Agent[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleViewDocuments = (agent: Agent) => {
        setSelectedAgent(agent);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAgent(null);
    };



    // --- Handlers for Edit Modal ---
    const handleEditAgent = (agent: Agent) => {
        setSelectedAgent(agent);
        setIsEditModalOpen(true);
    };
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedAgent(null);
    };


    const handleSuccess = () => {
        handleCloseModal();
        handleCloseEditModal();
        handleSearch(); // Refresh data on success
    };

    useEffect(() => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const formatDateToAPI = (date: Date): string => {
            return date.toLocaleDateString("en-CA"); // YYYY-MM-DD format
        };

        const start = formatDateToAPI(startOfMonth);
        const end = formatDateToAPI(today);

        setStartDate(start);
        setEndDate(end);

        if (userType === 'Admin') {
            searchData(start, end, ''); // Initial search with empty name
        }
    }, [userType]);

    const formatDateForDisplay = (dateStr?: string): string => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-GB');
    };

    const formatCurrency = (amount?: string | number): string => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount ?? 0;
        return `₹${num.toLocaleString('en-IN')}`;
    };

    const handleSearch = (): void => {
        // Use an empty string for dates if you want the backend to ignore them when a name is present
        const searchStartDate = agentName ? '' : startDate;
        const searchEndDate = agentName ? '' : endDate;
        searchData(searchStartDate, searchEndDate, agentName);
    };

    const searchData = async (fromDate: string, toDate: string, name: string): Promise<void> => {
        // Validation: Ensure either dates or a name is provided
        if ((!fromDate || !toDate) && !name) {
            setError('Please provide a date range or an agent name to search.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response: ApiResponse = await get_agentnamelist_admin(fromDate, toDate, name);

            if (response.Status === 'Success' && response.MasterData) {
                setAgents(response.MasterData);
                if (response.MasterData.length === 0) {
                    setError('No data found for the given criteria.');
                }
            } else {
                setAgents([]);
                setError(response.Message || 'No data found');
            }
        } catch (err) {
            setAgents([]);
            setError('Error loading data');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleLogout = (): void => {
        try {
            localStorage.clear();
            sessionStorage.clear();
            logout();
            window.location.href = '/login';
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    const goBack = (): void => {
        navigate('/dashboard');
    };

      const handleGoToPlanSelection = () => {
        navigate('/dashboard', {
            state: {
                view: 'approvals',
                product: 'travelAssist'
            }
        });
    };

    return (
        <div className="coi-container">
            <header className="coi-header">
                <div className="coi-header-content">
                    <img src={logo} alt="Travel Assist" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
                    <div className="d-flex justify-content-center py-4">
                        <div className="logo d-flex align-items-center w-auto">
                            <span className="page-title">Travel Assistance Service</span>
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

            <main className="coi-main-content">
                <div className="coi-card">
                    <div className="coi-card-header">
                        <h2 className="coi-card-title">{userType} -Update Agent Details</h2>
                         <button onClick={handleGoToPlanSelection} className="back-to-selection-btn_admin">
                            <ArrowLeftCircle size={18} />
                            <span>Back To Previous Page</span>
                        </button>
                    </div>

                    <div className="coi-filter-container">
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', width: '100%' }}>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>From Date:</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="coi-filter-input"
                                    style={{ width: '130px' }}
                                    disabled={!!agentName} // Disable if searching by name
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>To Date:</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="coi-filter-input"
                                    style={{ width: '130px' }}
                                    disabled={!!agentName} // Disable if searching by name
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', color: '#6b7280', fontStyle: 'italic' }}>OR</div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Agent Name:</label>
                                <div className="coi-filter-input-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <Filter size={16} style={{ color: '#6b7280', position: 'absolute', left: '10px' }} />
                                    <input
                                        type="text"
                                        placeholder="Search by agent name..."
                                        value={agentName}
                                        onChange={(e) => setAgentName(e.target.value)}
                                        onKeyDown={handleFilterKeyDown}
                                        className="coi-filter-input"
                                        style={{ paddingLeft: '35px', width: '250px' }}
                                    />
                                    {agentName && (
                                        <button onClick={() => setAgentName('')} className="coi-clear-button" style={{ position: 'absolute', right: '10px' }}>
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginLeft: '10px' }}>
                                <button onClick={handleSearch} disabled={loading} className="coi-search-button">
                                    <Search size={16} style={{ marginRight: '5px' }} />
                                    {loading ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {loading && <p>Loading...</p>}
                    {error && !loading && <p style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>{error}</p>}

                    {!loading && agents.length > 0 && (
                        <div>
                            <p><strong>{agents.length} agents found</strong></p>
                            <div className="coi-table-container">
                                <table className="coi-table">
                                    <thead>
                                        <tr>
                                            <th className="coi-table-header">Sr.No</th>
                                            <th className="coi-table-header">Agent ID</th>
                                            <th className="coi-table-header">Documents</th>
                                            <th className="coi-table-header">Edit Agent</th>

                                            <th className="coi-table-header">Agent Name</th>
                                            <th className="coi-table-header">Email ID</th>
                                            <th className="coi-table-header">Mobile</th>
                                            <th className="coi-table-header">Employee Name</th>
                                            <th className="coi-table-header">Payout</th>
                                            <th className="coi-table-header">Payment Mode</th>
                                            <th className="coi-table-header">Wallet Balance</th>
                                            <th className="coi-table-header">Wallet Update Date</th>
                                            <th className="coi-table-header">PAN</th>
                                            <th className="coi-table-header">Created On</th>
                                            <th className="coi-table-header">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {agents.map((agent, index) => (
                                            <tr key={agent.AgentId || index}>
                                                <td className="coi-table-cell">{index + 1}</td>
                                                <td className="coi-table-cell">{agent.AgentId || ''}</td>
                                                <td className="coi-table-cell" style={{ textAlign: 'center' }}>
                                                    <button className="click-here-btn" onClick={() => handleViewDocuments(agent)}>
                                                        View Docs
                                                    </button>
                                                </td>
                                                <td className="coi-table-cell" style={{ textAlign: 'center' }}>
                                                    <button className="click-here-btn" onClick={() => handleEditAgent(agent)}>
                                                        Edit
                                                    </button>
                                                </td>

                                                <td className="coi-table-cell">{agent.FullName || ''}</td>
                                                <td className="coi-table-cell">{agent.EmailID || ''}</td>
                                                <td className="coi-table-cell">{agent.MobileNumber || ''}</td>
                                                <td className="coi-table-cell">{agent.EmpName || 'N/A'}</td>
                                                <td className="coi-table-cell">{agent.Payout || '0'}%</td>
                                                <td className="coi-table-cell">{agent.Paymentmode || ''}</td>
                                                <td className="coi-table-cell">{formatCurrency(agent.Wallet_Amount)}</td>
                                                <td className="coi-table-cell">{(agent.Wallet_Update_Date)}</td>
                                                <td className="coi-table-cell">{agent.PAN_No || ''}</td>
                                                <td className="coi-table-cell">{formatDateForDisplay(agent.Created_on)}</td>
                                                <td className="coi-table-cell">
                                                    <span className={agent.isactive === 1 ? 'status-active' : 'status-inactive'}>
                                                        {agent.isactive === 1 ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {selectedAgent && (
                <>
                    <AgentdocshowModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onSuccess={handleSuccess}
                        agentId={selectedAgent.AgentId}
                        userId={adminId}
                    />
                    <EditAgentModal
                        isOpen={isEditModalOpen}
                        onClose={handleCloseEditModal}
                        onSuccess={handleSuccess}
                        agent={selectedAgent}
                    />
                </>
            )}

            <footer className="coi-footer">
                <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
            </footer>
        </div>
    );
};

export default Update_Agent;
