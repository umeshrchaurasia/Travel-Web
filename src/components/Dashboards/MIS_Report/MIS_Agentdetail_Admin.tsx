import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, LogOut, Home, Download, ArrowLeftCircle } from "lucide-react";
import { logout } from '../../../services/auth';
import { get_agentlist_admin, PDF_BASE_URL } from "../../../services/api";

import logo from '../../../../src/assets/img/TravelAssist.webp';
import '../UpdatePolicy/generatecoi.css';
import AgentdocshowModal from "./AgentdocshowModal";

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
    empid?: string;
    agent?: string;
    agentData?: { AgentId: string };
    adminId?: string;
    userType?: string;
}

const MIS_Agentdetail_Admin: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state as LocationState) || {};

    const [empId, setEmpId] = useState<string>(state.empid || '');
    const [agentId, setAgentId] = useState<string>(state.agent || state.agentData?.AgentId || '');
    const [adminId, setAdminId] = useState<string>(state.adminId || '');
    const [userType, setUserType] = useState<string>(state.userType || '');

    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [agents, setAgents] = useState<Agent[]>([]);

    // State for the new payment mode filter
    const [paymentFilter, setPaymentFilter] = useState<'Discount' | 'Upfront Commission'>('Discount');



    // *** 2. STATE FOR MODAL VISIBILITY AND SELECTED AGENT DATA ***
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

    // *** 3. HANDLER TO OPEN THE MODAL WITH AGENT DATA ***
    const handleViewDocuments = (agent: Agent) => {
        setSelectedAgent(agent);
        setIsModalOpen(true);
    };
    // *** 4. HANDLERS TO CLOSE THE MODAL ***
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAgent(null);
    };

    const handleSuccess = () => {
        handleCloseModal(); // Close modal on success
        // You can optionally refresh data here if needed
    };

    useEffect(() => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const formatDate1 = (date: Date): string => {
            return date.toLocaleDateString("en-CA", {
                timeZone: "Asia/Kolkata"
            });
        };

        const start = formatDate1(startOfMonth);
        const end = formatDate1(today);

        setStartDate(start);
        setEndDate(end);

        // Auto search based on user type
        if (userType === 'Admin') {
            searchData(start, end, '', '');
        }
    }, [userType]);

    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-GB');
    };

    const formatCurrency = (amount?: string | number): string => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount ?? 0;
        return `₹${num.toLocaleString()}`;
    };

    const handleSearch = (): void => {
        searchData(startDate, endDate, '', '');
    };

    const searchData = async (fromDate: string, toDate: string, employeeId: string, agentId: string): Promise<void> => {
        if (!fromDate || !toDate) {
            setError('Please fill all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Fetch agent data
            const response: ApiResponse = await get_agentlist_admin(fromDate, toDate);

            if (response.Status === 'Success' && response.MasterData) {
                setAgents(response.MasterData);
                setError('');
            } else {
                setAgents([]);
                setError('No data found');
            }
        } catch (err) {
            setAgents([]);
            setError('Error loading data');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter agents based on the selected payment mode radio button
    const filteredAgents = agents.filter(agent => {
        if (paymentFilter === 'Discount') {
            return agent.Paymentmode !== 'Upfront Commission';
        }
        if (paymentFilter === 'Upfront Commission') {
            return agent.Paymentmode === 'Upfront Commission';
        }
        return true; // Fallback
    });

    // CSV Download Function
    const downloadCSV = (): void => {
        if (filteredAgents.length === 0) {
            alert('No data available to download');
            return;
        }

        // Define CSV headers for agent data
        const headers = [
            'Sr.No',
            'Agent ID',
            'Agent Code',
            'Agent Name',
            'Email ID',
            'Mobile Number',
            'Employee Name',
            'Employee Mobile Number',
            'Gender',
            'Date of Birth',
            'Payout',
            'Payment Mode',
            'Education Qualification',
            'Address',
            'PAN Number',
            'GST',
            'Admin Approved Date',
            'Created On',
            'Status'
        ];

        // Convert data to CSV format
        const csvData = filteredAgents.map((agent, index) => [
            index + 1,
            agent.AgentId || '',
            agent.Agent_Code || '',
            agent.FullName || '',
            agent.EmailID || '',
            agent.MobileNumber || '',
            agent.EmpName || '',
            agent.EmpMobileNumber || '',
            agent.Gender || '',
            formatDate(agent.DOB),
            agent.Payout || '',
            agent.Paymentmode || '',
            agent.EducationQualification || '',
            agent.Address || '',
            agent.PAN_No || '',
            agent.GST || '',
            formatDate(agent.AdminApproved_Date),
            formatDate(agent.Created_on),
            agent.isactive === 1 ? 'Active' : 'Inactive'
        ]);

        // Combine headers and data
        const allData = [headers, ...csvData];

        // Convert to CSV string
        const csvContent = allData.map(row =>
            row.map(field => {
                // Handle fields that might contain commas or quotes
                const stringField = String(field);
                if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                    return `"${stringField.replace(/"/g, '""')}"`;
                }
                return stringField;
            }).join(',')
        ).join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);

        // Generate filename with current date
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `MIS_Agent_Report_${userType}_${empId || agentId || 'All'}_${currentDate}.csv`;
        link.setAttribute('download', filename);

        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) =>
        (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value);

    // Determine which field to show based on user type
    const showAdminField = userType === 'Admin';

    return (
        <div className="coi-container">
            {/* Header */}
            <header className="coi-header">
                <div className="coi-header-content">
                    <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
                    <div className="d-flex justify-content-center py-4">
                        <div className="logo d-flex align-items-center w-auto">
                            <span className="page-title">Travel Assistance Service</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button
                            onClick={goBack}
                            className="coi-button"
                        >
                            <Home size={18} />
                            Dashboard
                        </button>
                        <button
                            onClick={handleLogout}
                            className="coi-button coi-logout-button"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="coi-main-content">
                <div className="coi-card">
                    <div className="coi-card-header">
                        <h2 className="coi-card-title">{userType} - Agent MIS Details Report</h2>
                        {adminId && userType === 'Admin' && (
                            <p style={{ margin: '10px 0', color: '#6b7280', fontSize: '14px' }}>
                                Admin ID: <strong>{adminId}</strong>
                            </p>
                        )}
                        <button onClick={handleGoToPlanSelection} className="back-to-selection-btn_admin">
                            <ArrowLeftCircle size={18} />
                            <span>Back To Previous Page</span>
                        </button>
                    </div>

                    {/* Search Form */}
                    <div className="coi-filter-container">
                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            alignItems: 'flex-end',
                            flexWrap: 'wrap',
                            width: '100%'
                        }}>

                            {showAdminField && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                                        Admin ID: {userType === 'Admin' && <span style={{ color: '#ef4444' }}>*</span>}
                                    </label>
                                    <input
                                        type="text"
                                        value={adminId}
                                        onChange={(e) => setAdminId(e.target.value)}
                                        placeholder="Enter Admin ID"
                                        className="coi-filter-input"
                                        style={{
                                            width: '110px',
                                            backgroundColor: (location.state?.adminId && userType === 'Admin') ? '#f3f4f6' : 'white'
                                        }}
                                        readOnly={!!(location.state?.adminId && userType === 'Admin')}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                                    From Date: <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="coi-filter-input"
                                    style={{ width: '110px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                                    To Date: <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="coi-filter-input"
                                    style={{ width: '110px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: '15px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Payment Type</label>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', height: '40px', padding: '0 5px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="paymentFilter"
                                            value="Discount"
                                            checked={paymentFilter === 'Discount'}
                                            onChange={() => setPaymentFilter('Discount')}
                                        />
                                        Discount / Full Pay
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="paymentFilter"
                                            value="Upfront Commission"
                                            checked={paymentFilter === 'Upfront Commission'}
                                            onChange={() => setPaymentFilter('Upfront Commission')}
                                        />
                                        Upfront Commission
                                    </label>
                                </div>
                            </div>

                            <div style={{ marginLeft: '10px' }}>
                                <button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="coi-search-button"

                                >
                                    <Search size={16} style={{ marginRight: '5px' }} />
                                    {loading ? 'Searching...' : 'Search'}
                                </button>
                            </div>

                            <div>
                                <button
                                    className='apply-btn-emp'
                                    onClick={downloadCSV}
                                    disabled={filteredAgents.length === 0}
                                    style={{
                                        opacity: filteredAgents.length === 0 ? 0.5 : 1,
                                        cursor: filteredAgents.length === 0 ? 'not-allowed' : 'pointer',

                                    }}
                                >
                                    <Download size={16} style={{ marginRight: '5px' }} />
                                    Download CSV
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    {loading && <p>Loading...</p>}

                    {error && !loading && <p style={{ color: 'red' }}>{error}</p>}

                    {!loading && filteredAgents.length > 0 && (
                        <div>
                            <p><strong>{filteredAgents.length} agents found</strong></p>

                            <div className="coi-table-container">
                                <table className="coi-table">
                                    <thead>
                                        <tr>
                                            <th className="coi-table-header">Sr.No</th>

                                            <th className="coi-table-header">Agent ID</th>
                                            <th className="coi-table-header">Agent Document</th>
                                            <th className="coi-table-header">Agent Code</th>
                                            <th className="coi-table-header">Agent Name</th>
                                            <th className="coi-table-header">Email ID</th>
                                            <th className="coi-table-header">Mobile Number</th>
                                            <th className="coi-table-header">Employee Name</th>
                                            <th className="coi-table-header">Employee Mobile Number</th>
                                            <th className="coi-table-header">Gender</th>
                                            <th className="coi-table-header">Date of Birth</th>
                                            <th className="coi-table-header">Payout</th>
                                            <th className="coi-table-header">Payment Mode</th>
                                            <th className="coi-table-header">Education</th>
                                            <th className="coi-table-header">Address</th>
                                            <th className="coi-table-header">PAN Number</th>
                                            <th className="coi-table-header">GST</th>
                                            <th className="coi-table-header">Admin Approved</th>
                                            <th className="coi-table-header">Created On</th>
                                            <th className="coi-table-header">Status</th>

                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAgents.map((agent: Agent, index: number) => (
                                            <tr key={agent.AgentId || index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                                                <td className="coi-table-cell">{index + 1}</td>
                                                <td className="coi-table-cell">{agent.AgentId || ''}</td>
                                                <td className="coi-table-cell" style={{ textAlign: 'center' }}>
                                                    <button className="click-here-btn" onClick={() => handleViewDocuments(agent)}>
                                                        Click Here
                                                    </button>
                                                </td>
                                                <td className="coi-table-cell">{agent.Agent_Code || ''}</td>
                                                <td className="coi-table-cell">{agent.FullName || ''}</td>
                                                <td className="coi-table-cell">{agent.EmailID || ''}</td>
                                                <td className="coi-table-cell">{agent.MobileNumber || ''}</td>
                                                <td className="coi-table-cell">{agent.EmpName || ''}</td>
                                                <td className="coi-table-cell">{agent.EmpMobileNumber || ''}</td>
                                                <td className="coi-table-cell">{agent.Gender || ''}</td>
                                                <td className="coi-table-cell">{formatDate(agent.DOB)}</td>
                                                <td className="coi-table-cell" style={{ textAlign: "center", verticalAlign: "middle" }}>{agent.Payout || ''}%</td>
                                                <td className="coi-table-cell" style={{ textAlign: "center", verticalAlign: "middle" }}>{agent.Paymentmode || ''}</td>
                                                <td className="coi-table-cell">{agent.EducationQualification || ''}</td>
                                                <td className="coi-table-cell" style={{ width: '180px', maxWidth: '180px', wordWrap: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={agent.Address || ''}>{agent.Address || ''}</td>
                                                <td className="coi-table-cell">{agent.PAN_No || ''}</td>
                                                <td className="coi-table-cell">{agent.GST || 'N/A'}</td>
                                                <td className="coi-table-cell">{formatDate(agent.AdminApproved_Date)}</td>
                                                <td className="coi-table-cell">{formatDate(agent.Created_on)}</td>
                                                <td className="coi-table-cell">
                                                    <span style={{
                                                        padding: '2px 6px',
                                                        borderRadius: '3px',
                                                        backgroundColor: agent.isactive === 1 ? '#d4edda' : '#f8d7da',
                                                        color: agent.isactive === 1 ? '#155724' : '#721c24'
                                                    }}>
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
                    {!loading && filteredAgents.length === 0 && agents.length > 0 && (
                        <p style={{ textAlign: 'center', marginTop: '20px' }}>No agents found for the selected payment type.</p>
                    )}
                </div>
            </main>
            {selectedAgent && (
                <AgentdocshowModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSuccess={handleSuccess}
                    agentId={selectedAgent.AgentId}
                    userId={adminId}

                />
            )}

            <footer className="coi-footer">
                <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
            </footer>
        </div>
    );
};

export default MIS_Agentdetail_Admin;