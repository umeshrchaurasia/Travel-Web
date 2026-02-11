import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, LogOut, Home, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { logout } from '../../../services/auth';
import { getCustomerList_emp_wise } from "../../../services/api";

import logo from '../../../../src/assets/img/TravelAssist_practo.webp';

import '../UpdatePolicy/generatecoi.css';

interface Customer {
    NoLogin_Cust_id: number;
    AgentId: number;
    AgentName: string;
    FirstName: string;
    LastName: string;
    Email: string;
    Mobile: string;
    PanNumber: string;
    Pincode: string;
    PlanSelectionType: string;
    UId: string;
    CreateDate: string;
    isactive: number;
    UpdateDate?: string;
    PractoProposal: string; // 'Y' or 'N'
    AyushProposal: string;  // 'Y' or 'N'
}

interface ApiResponse {
    Status: string;
    MasterData?: Customer[] | null; // API should return an array of Customers
}

const CustomerList_emp_wise: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state || {};

    const [empId, setEmpId] = useState<string>(state.empid || '');
    const [agentId, setAgentId] = useState<string>(state.agent || state.agentData?.AgentId || '');


    const [userType, setUserType] = useState<string>(state.userType || '');

    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const [customers, setCustomers] = useState<Customer[]>([]);

    // Filter State
    const [showNoSubscriptionOnly, setShowNoSubscriptionOnly] = useState<boolean>(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 10;

    useEffect(() => {
        // Set dates: First day of current month to today
        const today = new Date();
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
        searchData(start, end, empId);

    }, [empId]);

    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-GB');
    };

    const handleSearch = (): void => {
        setCurrentPage(1); // Reset to first page on new search
        searchData(startDate, endDate, empId);
    };

    const searchData = async (
        fromDate: string,
        toDate: string,
        employeeId: string
    ): Promise<void> => {
        if (!fromDate || !toDate) {
            setError("Please fill all fields");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response: any = await getCustomerList_emp_wise(
                fromDate,
                toDate,
                employeeId
            );

            console.log("API Response:", response);

            let data: any[] = [];

            // Logic to handle different response structures
            if (response.data) {
                if (Array.isArray(response.data)) {
                    // Case 1: Nested Array (Standard MySQL SP response: [[rows], [metadata]])
                    if (response.data.length > 0 && Array.isArray(response.data[0])) {
                        data = response.data[0];
                    }
                    // Case 2: Flat Array (Backend already cleaned it: [row1, row2])
                    else {
                        data = response.data;
                    }
                }
            } else if (response.MasterData) {
                // Case 3: Old structure (MasterData or MasterData.proposals)
                data = response.MasterData.proposals || response.MasterData;
            }

            if (Array.isArray(data) && data.length > 0) {
                setCustomers(data);
                setError("");
            } else {
                setCustomers([]);
                setError("No data found");
            }
        } catch (err) {
            setCustomers([]);
            setError("Error loading data");
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
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

    const getRowStyle = (customer: any) => {
        // Rule 1: If AyushProposal is 'Y', use Light Yellow
        if (customer.AyushProposal === 'Y') {
            return { backgroundColor: '#ede15a' }; // Tailwind 'yellow-100' hex
        }
        // Rule 2: If PractoProposal is 'Y', use Light Green
        else if (customer.PractoProposal === 'Y') {
            return { backgroundColor: '#60ef92' }; // Tailwind 'green-100' hex
        }
        // Default: White
        return { backgroundColor: '#FFFFFF' };
    };

    // --- Filter Logic ---
    const filteredCustomers = customers.filter(customer => {
        if (showNoSubscriptionOnly) {
            // Show only if both are NOT 'Y'
            return customer.PractoProposal !== 'Y' && customer.AyushProposal !== 'Y';
        }
        return true; // Show all if filter is unchecked
    });

    // --- Pagination Logic (Applied on filteredCustomers) ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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
                        <h2 className="coi-card-title">Zextra Wellness Customer List</h2>

                        <p style={{ margin: '10px 0', color: '#6b7280', fontSize: '14px' }}>
                            Employee ID: <strong>{empId}</strong>
                        </p>
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

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                                    From Date: <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="coi-filter-input"
                                    style={{ width: '130px' }}
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
                                    style={{ width: '130px' }}
                                />
                            </div>

                            {/* No Subscription Checkbox */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingBottom: '10px', marginLeft: '25px' }}>
                                <input
                                    type="checkbox"
                                    id="noSubscriptionFilter"
                                    checked={showNoSubscriptionOnly}
                                    onChange={(e) => {
                                        setShowNoSubscriptionOnly(e.target.checked);
                                        setCurrentPage(1); // Reset to page 1 when filter changes
                                    }}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label
                                    htmlFor="noSubscriptionFilter"
                                    style={{ fontSize: '14px', fontWeight: '500', color: '#374151', cursor: 'pointer', marginBottom: 0 }}
                                >
                                    No Subscription Only
                                </label>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'end' }}>
                                <button
                                    onClick={handleSearch}
                                    disabled={loading || !startDate || !endDate || (userType === 'Employee' && !empId) || (userType === 'Agent' && !agentId)}
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

                        </div>
                    </div>

                    {/* Results */}
                    {loading && <p>Loading...</p>}

                    {error && <p style={{ color: 'red' }}>{error}</p>}

                    {filteredCustomers.length > 0 && (
                        <div>
                            <p><strong>{filteredCustomers.length} records found</strong></p>

                            <div className="coi-table-container">
                                <table className="coi-table">
                                    <thead>
                                        <tr>
                                            <th className="coi-table-header">Sr.No</th>
                                            <th className="coi-table-header">Created Date</th>
                                            <th className="coi-table-header">Agent Name</th>
                                            <th className="coi-table-header">Customer Name</th>
                                            <th className="coi-table-header">Mobile</th>
                                            <th className="coi-table-header">Email</th>
                                            <th className="coi-table-header">Practo Subscription</th>
                                            <th className="coi-table-header">AyushPay Subscription </th>
                                            <th className="coi-table-header">Selected Plan Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentCustomers.map((cust, index) => (
                                            <tr
                                                key={cust.NoLogin_Cust_id || index}
                                                style={getRowStyle(cust)} // Apply Row Color Here
                                            >
                                                <td className="coi-table-cell ">{indexOfFirstItem + index + 1}</td>
                                                <td className="coi-table-cell">
                                                    {formatDate(cust.CreateDate)}
                                                </td>
                                                <td className="coi-table-cell">{cust.AgentName}</td>
                                                <td className="coi-table-cell">
                                                    {cust.FirstName} {cust.LastName}
                                                </td>
                                                <td className="coi-table-cell">{cust.Mobile}</td>
                                                <td className="coi-table-cell">{cust.Email}</td>

                                                {/* Practo Status Badge */}
                                                <td className="coi-table-cell" style={{ textAlign: "center", verticalAlign: "middle" }}>
                                                    {cust.PractoProposal === "Y" ? (
                                                        <span
                                                            style={{
                                                                padding: "4px 8px",
                                                                borderRadius: "12px",
                                                                backgroundColor: "#dcfce7",
                                                                color: "#166534",
                                                                fontWeight: "bold",
                                                                fontSize: "12px",
                                                            }}
                                                        >
                                                            Yes
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "#ef4444" }}>No</span>
                                                    )}
                                                </td>

                                                {/* Ayush Status Badge */}
                                                <td className="coi-table-cell" style={{ textAlign: "center", verticalAlign: "middle" }}>
                                                    {cust.AyushProposal === "Y" ? (
                                                        <span
                                                            style={{
                                                                padding: "4px 8px",
                                                                borderRadius: "12px",
                                                                backgroundColor: "#fef9c3",
                                                                color: "#854d0e",
                                                                fontWeight: "bold",
                                                                fontSize: "12px",
                                                            }}
                                                        >
                                                            Yes
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "#ef4444" }}>No</span>
                                                    )}
                                                </td>

                                                <td className="coi-table-cell">
                                                    {cust.PlanSelectionType}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0 10px' }}>
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    style={{
                                        display: 'flex', alignItems: 'center', padding: '5px 10px',
                                        backgroundColor: currentPage === 1 ? '#e2e8f0' : '#fff',
                                        border: '1px solid #cbd5e1', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <ChevronLeft size={16} /> Previous
                                </button>

                                <span style={{ fontSize: '14px', color: '#475569' }}>
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        display: 'flex', alignItems: 'center', padding: '5px 10px',
                                        backgroundColor: currentPage === totalPages ? '#e2e8f0' : '#fff',
                                        border: '1px solid #cbd5e1', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>

                        </div>
                    )}
                </div>
            </main>
            <footer className="coi-footer">
                <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
            </footer>
        </div>
    );
};

export default CustomerList_emp_wise;