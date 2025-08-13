import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, LogOut, Home, Download } from "lucide-react";
import { logout } from '../../../services/auth';
import { getProposalTDS, PDF_BASE_URL } from "../../../services/api";

import logo from '../../../../src/assets/img/TravelAssist.webp';
import '../UpdatePolicy/generatecoi.css';

interface Proposal {
    proposal_id?: number;
    AssitanceNo?: string;
    invoiceno?: string;
    Certificate_no?: string;
    Planname?: string;
    Nameofthepassenger?: string;
    PassportNo?: string;
    Policy_Generation_Date?: string;
    PolicyStartDate?: string;
    PolicyEndDate?: string;
    Assiatance_charges_PreTaxAmount?: string | number;
    Assiatance_charges_PostTaxAmount?: string | number;
    AgentId?: number;
    UserID_Mobileno?: string;
    AgentName?: string
    Selected_Payment_Mode?: string;
    PaymentType?: string;
    Discount?: string;
    Fullpay_Discount_amount_to_be_paid?: string | number;
    Paymentreceived?: string;
    UId?: string;
    Payment_Status?: string;
}

interface ApiResponse {
    Status: string;
    MasterData?: {
        proposals?: Proposal[];
    }
}

const TDS_Proposal: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state || {};

    const [empId, setEmpId] = useState<string>(state.empid || '');
    const [agentId, setAgentId] = useState<string>(state.agent || state.agentData?.AgentId || '');

    const [adminId, setAdminId] = useState<string>(state.adminId || '');
    const [userType, setUserType] = useState<string>(state.userType || '');

    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [proposal, setProposals] = useState<Proposal[]>([]);

    const [paymentFilter, setPaymentFilter] = useState<'Discount' | 'Upfront'>('Discount');

    useEffect(() => {
        // Set dates: 7 days ago to today
        const today = new Date();
        //  const sevenDaysAgo = new Date(today);
        // sevenDaysAgo.setDate(today.getDate() - 14);
        //   const start = sevenDaysAgo.toISOString().split('T')[0];
        //   const end = today.toISOString().split('T')[0];

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const formatDate1 = (date: Date) => {
            return date.toLocaleDateString("en-CA", {
                timeZone: "Asia/Kolkata" // Use IST
            });
        };
        const start = formatDate1(startOfMonth);
        const end = formatDate1(today);

        setStartDate(start);
        setEndDate(end);

        // Auto search based on user type
        if (userType === 'Agent' && agentId) {
            searchData(start, end, '', agentId);
        } else if (userType === 'Admin') {
            searchData(start, end, '', '');
        }
    }, [empId, agentId, userType]);

    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-GB');
    };

    const calculateUpfrontAmount = (proposal: Proposal): number => {
        const preTax = parseFloat(String(proposal.Assiatance_charges_PreTaxAmount)) || 0;
        const postTax = parseFloat(String(proposal.Assiatance_charges_PostTaxAmount)) || 0;
        const discountComm = parseFloat(String(proposal.Discount)) || 0;
        const amountPaid = parseFloat(String(proposal.Fullpay_Discount_amount_to_be_paid)) || 0;

        const upfront_amt_filter = postTax * (discountComm / 100);

        // Applying the formula provided by the user
        const upfrontAmount = amountPaid + (upfront_amt_filter * 0.02);

        return Math.round(upfrontAmount);
    };

    const formatCurrency = (amount?: string | number): string => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount ?? 0;
        return `₹${num.toLocaleString()}`;
    };

    const handleSearch = (): void => {
        if (userType === 'Agent') {
            searchData(startDate, endDate, '', agentId);
        } else {
            searchData(startDate, endDate, '', '');
        }
    };

    const searchData = async (fromDate: string, toDate: string, employeeId: string, agentId: string): Promise<void> => {
        if (!fromDate || !toDate) {
            setError('Please fill all fields');
            return;
        }



        if (userType === 'Agent' && !agentId) {
            setError('Agent ID is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let response: ApiResponse;

            if (userType === 'Agent') {
                response = await getProposalTDS(fromDate, toDate, '', agentId);
            } else {
                // Admin or other user types - fetch all data
                response = await getProposalTDS(fromDate, toDate, '', '');
            }

            if (response.Status === 'Success' && response.MasterData?.proposals && response.MasterData.proposals.length > 0) {
                setProposals(response.MasterData.proposals);

                const firstProposal = response.MasterData.proposals[0];
                const paymentModeFromAPI = firstProposal.Selected_Payment_Mode;
                if (paymentModeFromAPI === 'Upfront' || paymentModeFromAPI === 'Discount') {
                    // If it's valid, set it
                    setPaymentFilter(paymentModeFromAPI);
                } else {
                    // Otherwise, fall back to a default value to ensure type safety
                    setPaymentFilter('Discount');
                }



                setError('');
            } else {
                setProposals([]);
                setError('No data found');
            }
        } catch (err) {
            setProposals([]);
            setError('Error loading data');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProposals = proposal.filter(proposal => {
        if (paymentFilter === 'Discount') {
            return proposal.Selected_Payment_Mode !== 'Upfront';
        }
        if (paymentFilter === 'Upfront') {
            return proposal.Selected_Payment_Mode === 'Upfront';
        }
        return true; // Fallback
    });


    // CSV Download Function
    const downloadCSV = (): void => {
        if (filteredProposals.length === 0) {
            alert('No data available to download');
            return;
        }

        // Define CSV headers
        const headers = [
            'Sr.No',
            'Assistance No',
            'Certificate No',
            'Plan Name',
            'Name of the Passenger',
            'Passport No',
            'Policy Generation Date',
            'Policy Start Date',
            'Policy End Date',
            'Assistance Charges Pre Tax Amount',
            'Assistance Charges Post Tax Amount',
            'User ID-Mobile No',
            'Agent Name',
            'Selected Payment Mode',
            'Payment Type',
            'Discount/Comm%',
             paymentFilter === 'Upfront' ? 'Upfront Amount to be Paid' : 'Full Pay/Discount Amount Paid',
            'Payment Received'
        ];

        // Convert data to CSV format
        const csvData = filteredProposals.map((item, index) => {
            const amountCell = paymentFilter === 'Upfront'
                ? calculateUpfrontAmount(item).toFixed(2)
                : item.Fullpay_Discount_amount_to_be_paid || '';
            return [
                index + 1,
                item.AssitanceNo || '',
                `\t${item.Certificate_no || ''}`,
                item.Planname || '',
                item.Nameofthepassenger || '',
                item.PassportNo || '',
                formatDate(item.Policy_Generation_Date),
                formatDate(item.PolicyStartDate),
                formatDate(item.PolicyEndDate),
                item.Assiatance_charges_PreTaxAmount || '',
                item.Assiatance_charges_PostTaxAmount || '',
                item.UserID_Mobileno || '',
                item.AgentName || '',
                item.Selected_Payment_Mode || '',
                item.PaymentType || '',
                item.Discount || '',
                amountCell,
                item.Paymentreceived || ''
            ]
        });

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
        const filename = `MIS_Proposal_Report_${userType}_${empId || agentId || 'All'}_${currentDate}.csv`;
        link.setAttribute('download', filename);

        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

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

    const goBack = () => {
        navigate('/dashboard');
    };

    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) =>
        (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value);

    // Determine which field to show based on user type
    const showEmployeeField = userType === 'Employee';
    const showAgentField = userType === 'Agent';
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
                        <h2 className="coi-card-title">{userType} MIS Reports Details</h2>
                        {empId && userType === 'Employee' && (
                            <p style={{ margin: '10px 0', color: '#6b7280', fontSize: '14px' }}>
                                Employee ID: <strong>{empId}</strong>
                            </p>
                        )}
                        {agentId && userType === 'Agent' && (
                            <p style={{ margin: '10px 0', color: '#6b7280', fontSize: '14px' }}>
                                Agent ID: <strong>{agentId}</strong>
                            </p>
                        )}
                        {adminId && userType === 'Admin' && (
                            <p style={{ margin: '10px 0', color: '#6b7280', fontSize: '14px' }}>
                                Admin ID: <strong>{adminId}</strong>
                            </p>
                        )}
                    </div>

                    {/* Search Form */}
                    <div className="coi-filter-container">
                        <div style={{
                            display: 'flex',
                            gap: '15px',
                            alignItems: 'end',
                            flexWrap: 'wrap',
                            marginBottom: '15px',
                            padding: '10px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            marginRight: '5px',
                            border: '1px solid #e2e8f0'
                        }}>
                            {showEmployeeField && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                                        Employee ID: {userType === 'Employee' && <span style={{ color: '#ef4444' }}>*</span>}
                                    </label>
                                    <input
                                        type="text"
                                        value={empId}
                                        onChange={(e) => setEmpId(e.target.value)}
                                        placeholder="Enter Employee ID"
                                        className="coi-filter-input"
                                        style={{
                                            width: '150px',
                                            backgroundColor: (location.state?.empid && userType === 'Employee') ? '#f3f4f6' : 'white'
                                        }}
                                        readOnly={location.state?.empid && userType === 'Employee'}
                                    />
                                </div>
                            )}

                            {showAgentField && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                                        Agent ID: {userType === 'Agent' && <span style={{ color: '#ef4444' }}>*</span>}
                                    </label>
                                    <input
                                        type="text"
                                        value={agentId}
                                        onChange={(e) => setAgentId(e.target.value)}
                                        placeholder="Enter Agent ID"
                                        className="coi-filter-input"
                                        style={{
                                            width: '150px',
                                            backgroundColor: (location.state?.agent && userType === 'Agent') ? '#f3f4f6' : 'white'
                                        }}
                                        readOnly={location.state?.agent && userType === 'Agent'}
                                    />
                                </div>
                            )}

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
                                            width: '150px',
                                            backgroundColor: (location.state?.adminId && userType === 'Admin') ? '#f3f4f6' : 'white'
                                        }}
                                        readOnly={location.state?.adminId && userType === 'Admin'}
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
                                    style={{ width: '150px' }}
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
                                    style={{ width: '150px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'end' }}>
                                <button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="coi-search-button"
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: (!startDate || !endDate || (userType === 'Employee' && !empId) || (userType === 'Agent' && !agentId)) ? '#9ca3af' : '#3b82f6',
                                        cursor: (!startDate || !endDate || (userType === 'Employee' && !empId) || (userType === 'Agent' && !agentId)) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <Search size={16} style={{ marginRight: '5px' }} />
                                    {loading ? 'Searching...' : 'Search'}
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'end' }}>
                                <button
                                    className='apply-btn-emp'
                                    onClick={downloadCSV}
                                    disabled={filteredProposals.length === 0}
                                    style={{
                                        opacity: filteredProposals.length === 0 ? 0.5 : 1,
                                        cursor: filteredProposals.length === 0 ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}
                                >
                                    <Download size={16} />
                                    Download CSV
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    {loading && <p>Loading...</p>}

                    {error && <p style={{ color: 'red' }}>{error}</p>}

                    {!loading && filteredProposals.length > 0 && (
                        <div>
                            <p><strong>{filteredProposals.length} proposals found</strong></p>

                            <div className="coi-table-container">
                                <table className="coi-table">
                                    <thead>
                                        <tr>
                                            <th className="coi-table-header">Sr.No</th>
                                            <th className="coi-table-header">Assistance No</th>
                                            <th className="coi-table-header">Certificate No</th>
                                            <th className="coi-table-header">Plan Name</th>
                                            <th className="coi-table-header">Name of the Passenger</th>
                                            <th className="coi-table-header">Passport No</th>
                                            <th className="coi-table-header">Policy Generation Date</th>
                                            <th className="coi-table-header">Policy Start Date</th>
                                            <th className="coi-table-header">Policy End Date</th>
                                            <th className="coi-table-header">Assistance Charges Pre Tax Amount</th>
                                            <th className="coi-table-header">Assistance Charges Post Tax Amount</th>
                                            <th className="coi-table-header">User ID-Mobile No</th>
                                            <th className="coi-table-header">Agent Name</th>
                                            <th className="coi-table-header">Selected Payment Mode</th>
                                            <th className="coi-table-header">Payment Type</th>
                                            <th className="coi-table-header">Discount/Comm%</th>
                                            <th className="coi-table-header">
                                                {paymentFilter === 'Upfront' ? 'Upfront Amount Paid' : 'Full Pay/Discount Amount Paid'}
                                            </th>
                                            <th className="coi-table-header">Payment Received</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProposals.map((proposal: Proposal, index: number) => (
                                            <tr key={proposal.proposal_id || index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                                                <td className="coi-table-cell">{index + 1}</td>
                                                <td className="coi-table-cell">{proposal.AssitanceNo || ''}</td>
                                                <td className="coi-table-cell">{proposal.Certificate_no || ''}</td>
                                                <td className="coi-table-cell">{proposal.Planname || ''}</td>
                                                <td className="coi-table-cell">{proposal.Nameofthepassenger || ''}</td>
                                                <td className="coi-table-cell">{proposal.PassportNo || ''}</td>
                                                <td className="coi-table-cell">{formatDate(proposal.Policy_Generation_Date)}</td>
                                                <td className="coi-table-cell">{formatDate(proposal.PolicyStartDate)}</td>
                                                <td className="coi-table-cell">{formatDate(proposal.PolicyEndDate)}</td>
                                                <td className="coi-table-cell" style={{ textAlign: "center", verticalAlign: "middle" }}>{proposal.Assiatance_charges_PreTaxAmount}</td>
                                                <td className="coi-table-cell" style={{ textAlign: "center", verticalAlign: "middle" }}>{proposal.Assiatance_charges_PostTaxAmount || ''}</td>
                                                <td className="coi-table-cell">{proposal.UserID_Mobileno || ''}</td>
                                                <td className="coi-table-cell">{proposal.AgentName || ''}</td>
                                                <td className="coi-table-cell">{proposal.Selected_Payment_Mode || ''}</td>
                                                <td className="coi-table-cell">{proposal.PaymentType || ''}</td>
                                                <td className="coi-table-cell" style={{ textAlign: "center", verticalAlign: "middle" }}>{proposal.Discount || ''}</td>

                                                <td className="coi-table-cell" style={{ textAlign: "center", verticalAlign: "middle" }}>
                                                    {paymentFilter === 'Upfront'
                                                        ? calculateUpfrontAmount(proposal)
                                                        : proposal.Fullpay_Discount_amount_to_be_paid
                                                    }
                                                </td>

                                                <td className="coi-table-cell">
                                                    <span style={{
                                                        padding: '2px 6px',
                                                        borderRadius: '3px',
                                                        backgroundColor: proposal.Paymentreceived === 'Payment received' ? '#d4edda' : '#fff3cd',
                                                        color: proposal.Paymentreceived === 'Payment received' ? '#155724' : '#856404'
                                                    }}>
                                                        {proposal.Paymentreceived || ''}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {!loading && filteredProposals.length === 0 && proposal.length > 0 && (
                        <p style={{ textAlign: 'center', marginTop: '20px' }}>No proposals found for the selected payment type.</p>
                    )}
                </div>
            </main>
            <footer className="coi-footer">
                <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
            </footer>
        </div>
    );
};

export default TDS_Proposal;