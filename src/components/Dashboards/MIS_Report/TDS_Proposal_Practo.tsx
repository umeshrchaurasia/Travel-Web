import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, LogOut, Home, Download } from "lucide-react";
import { logout } from '../../../services/auth';
import { getProposalTDS_Practo, PDF_BASE_URL } from "../../../services/api";

import logo from '../../../../src/assets/img/TravelAssist.webp';
import '../UpdatePolicy/generatecoi.css';

interface Proposal {
    Practo_proposal_id?: number;
    Practo_inv_number?: string; // Corresponds to Practo_inv_number
    Planname?: string;
    Nameofthepassenger?: string;
    passenger_Mobileno?: string;
    Policy_Generation_Date?: string; // Corresponds to CreateDate
    Assiatance_charges_PreTaxAmount?: string | number; // Corresponds to PremiumAmount
    Assiatance_charges_PostTaxAmount?: string | number; // Corresponds to Selected_PremiumAmount
    AgentId?: number;
    Agent_Mobileno?: string;
    AgentName?: string;
    Selected_Payment_Mode?: string;
    PaymentType?: string; // 'Wallet' in SP
    Discount?: string; // Corresponds to Payout
    Fullpay_Discount_amount_to_be_paid?: string | number; // Corresponds to Selected_PremiumAmount
    Paymentreceived?: string;
    UId?: string;
    Payment_Status?: string;
    practo_fees?: string;
    gstamount?: string;
    tdsamount?: string;
}

interface ApiResponse {
    Status: string;
    MasterData?: {
        proposals?: Proposal[];
    } | null;
}

const TDS_Proposal_Practo: React.FC = () => {
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

    const calculateUpfrontAmounts = (proposal: Proposal) => {
        const preTax = parseFloat(String(proposal.Assiatance_charges_PreTaxAmount)) || 0;
        const postTax = parseFloat(String(proposal.Assiatance_charges_PostTaxAmount)) || 0;
        const discountComm = parseFloat(String(proposal.Discount)) || 0;
        const amountPaid = parseFloat(String(proposal.Fullpay_Discount_amount_to_be_paid)) || 0;

        const upfrontCommAmount = parseFloat(String(proposal.Assiatance_charges_PostTaxAmount)) || 0;

        // Applying the formula provided by the user
        const tdsAmount = parseFloat(String(proposal.tdsamount)) || 0;

        return {
            upfrontCommAmount,
            tdsAmount,
            amountToBePaid: amountPaid
        };
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
                response = await getProposalTDS_Practo(fromDate, toDate, '', agentId);
            } else {
                // Admin or other user types - fetch all data
                response = await getProposalTDS_Practo(fromDate, toDate, '', '');
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
            'Practo Proposal ID',
            'Practo Invoice No',
            'Plan Name',
            'Name of the Passenger',
            'Passenger Mobile No',
            'Policy Subscription Date',
            'Pre Tax Amount',
            'Post Tax Amount',
            'Agent ID', // Using AgentId from the data
            'Agent Name',
            'Agent Mobile No',
            'Selected Payment Mode',
            'Payment Type',
            'Discount/Comm%',

        ];
        if (paymentFilter === 'Upfront') {
            headers.push('TDS@2%');
            headers.push('Upfront Amount Paid');
        } else {
            headers.push('Full Pay/Discount Amount Paid');
        }
        headers.push('Payment Received');
       
        headers.push('Practo Fees');


        // Convert data to CSV format
        const csvData = filteredProposals.map((item, index) => {
            const row = [
                index + 1,

                item.Practo_proposal_id || '',
                item.Practo_inv_number || '',
                item.Planname || '',
                item.Nameofthepassenger || '',
                item.passenger_Mobileno || '',

                formatDate(item.Policy_Generation_Date),
                item.Assiatance_charges_PreTaxAmount || '',
                item.Assiatance_charges_PostTaxAmount || '',
                item.AgentId || '',
                item.AgentName || '',
                item.Agent_Mobileno || '',
                item.Selected_Payment_Mode || '',
                item.PaymentType || '',
                item.Discount || '',
               
            ];
            if (paymentFilter === 'Upfront') {
                const { tdsAmount, amountToBePaid } = calculateUpfrontAmounts(item);
                row.push(
                    tdsAmount.toFixed(2),
                    amountToBePaid.toFixed(2)
                );
            } else {
                row.push(item.Fullpay_Discount_amount_to_be_paid || '');
            }
            row.push(item.Paymentreceived || '');
            row.push(item.practo_fees || '');

            return row;
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
                            <span className="page-title">Practo Subscription</span>
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
                            className="coi-button"
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
                                            <th className="coi-table-header">Practo Proposal ID</th>
                                            <th className="coi-table-header">Practo Invoice No</th>
                                            <th className="coi-table-header">Plan Name</th>
                                            <th className="coi-table-header">Name of the Passenger</th>
                                            <th className="coi-table-header">Passenger Mobile No</th>

                                            <th className="coi-table-header">Policy Subscription Date</th>
                                            <th className="coi-table-header">Pre Tax Amount</th>
                                            <th className="coi-table-header">Post Tax Amount</th>
                                            <th className="coi-table-header">Agent ID</th>
                                            <th className="coi-table-header">Agent Name</th>
                                            <th className="coi-table-header">Agent Mobile No</th>
                                            <th className="coi-table-header">Selected Payment Mode</th>
                                            <th className="coi-table-header">Payment Type</th>
                                            <th className="coi-table-header">Discount/Comm%</th>

                                            {/* Conditionally add new headers for Upfront */}
                                            {paymentFilter === 'Upfront' && (
                                                <>

                                                    <th className="coi-table-header">TDS@2%</th>
                                                </>
                                            )}

                                            <th className="coi-table-header">
                                                {paymentFilter === 'Upfront' ? 'Upfront Amount Paid' : 'Full Pay/Discount Amount Paid'}
                                            </th>

                                            <th className="coi-table-header">Payment Received</th>
                                            <th className="coi-table-header">Practo Fees</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProposals.map((proposal: Proposal, index: number) => {
                                            // When filter is Upfront, calculate all amounts once for the row
                                            const upfrontAmounts = paymentFilter === 'Upfront'
                                                ? calculateUpfrontAmounts(proposal)
                                                : null;

                                            return (
                                                <tr key={proposal.Practo_proposal_id || index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                                                    <td className="coi-table-cell">{index + 1}</td>
                                                    <td className="coi-table-cell">{proposal.Practo_proposal_id || ''}</td>
                                                    <td className="coi-table-cell">{proposal.Practo_inv_number || ''}</td>
                                                    <td className="coi-table-cell">{proposal.Planname || ''}</td>
                                                    <td className="coi-table-cell">{proposal.Nameofthepassenger || ''}</td>
                                                    <td className="coi-table-cell">{proposal.passenger_Mobileno || ''}</td>

                                                    <td className="coi-table-cell">{formatDate(proposal.Policy_Generation_Date)}</td>
                                                    <td className="coi-table-cell" style={{ textAlign: "center", verticalAlign: "middle" }}>{proposal.Assiatance_charges_PreTaxAmount || ''}</td>
                                                    <td className="coi-table-cell" style={{ textAlign: "center", verticalAlign: "middle" }}>{proposal.Assiatance_charges_PostTaxAmount || ''}</td>
                                                    <td className="coi-table-cell">{proposal.AgentId || ''}</td>
                                                    <td className="coi-table-cell">{proposal.AgentName || ''}</td>
                                                    <td className="coi-table-cell">{proposal.Agent_Mobileno || ''}</td>
                                                    <td className="coi-table-cell">{proposal.Selected_Payment_Mode || ''}</td>
                                                    <td className="coi-table-cell">{proposal.PaymentType || ''}</td>
                                                    <td className="coi-table-cell" style={{ textAlign: "center", verticalAlign: "middle" }}>{proposal.Discount || ''}</td>


                                                    {/* Conditionally add new data cells for Upfront */}
                                                    {paymentFilter === 'Upfront' && upfrontAmounts && (
                                                        <>

                                                            <td className="coi-table-cell" style={{ textAlign: "center", verticalAlign: "middle" }}>{upfrontAmounts.tdsAmount.toFixed(2)}</td>
                                                        </>
                                                    )}

                                                    <td className="coi-table-cell" style={{ textAlign: "center", verticalAlign: "middle" }}>
                                                        {paymentFilter === 'Upfront' && upfrontAmounts
                                                            ? upfrontAmounts.amountToBePaid.toFixed(2) // <-- THE FIX IS HERE
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
                                                    <td className="coi-table-cell">{proposal.practo_fees || '0'} </td>
                                                </tr>
                                            );
                                        })}
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

export default TDS_Proposal_Practo;