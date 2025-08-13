import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    UserCircle, ChevronDown, RefreshCw, AlertTriangle, Search, LogOut, Home, Download,
    Eye, X, ArrowLeft, Filter, Edit, FileText, CircleX,
} from 'lucide-react';

import { logout } from '../../../services/auth';

import {
    getProposalDetailsByEmployee, PDF_BASE_URL,
    getPolicyDetailsbyPolicyno, cancelpolicy
} from '../../../services/api';
import logo from '../../../../src/assets/img/TravelAssist.webp';
import './generatecoi.css';

const Employee_COI = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [proposals, setProposals] = useState([]);
    const [filteredProposals, setFilteredProposals] = useState([]);
    const [error, setError] = useState('');
    const [agentData, setAgentData] = useState(null);

    // Date filter states
    const [empId, setEmpId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchFilter, setSearchFilter] = useState('');

    // For pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        // Load agent data from location state or sessionStorage
        const data = location.state?.agentData || JSON.parse(sessionStorage.getItem('coiAgentData') || '{}');
        setAgentData(data);

        // Get employee ID from location state (passed from dashboard)
        const empIdFromState = location.state?.empid;
        if (empIdFromState) {
            setEmpId(empIdFromState);

        }

        // Set default dates: From Date = current date - 7 days, To Date = current date
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const todayString = today.toISOString().split('T')[0];
        const sevenDaysAgoString = sevenDaysAgo.toISOString().split('T')[0];

        setStartDate(sevenDaysAgoString);
        setEndDate(todayString);

        // Auto-call API when component loads and employee ID is available
        if (empIdFromState) {
            // Small delay to ensure state is set
            setTimeout(() => {
                fetchEmployeeProposalsWithDates(empIdFromState, sevenDaysAgoString, todayString);
            }, 100);
        }

    }, [location]);

    const fetchEmployeeProposalsWithDates = async (employeeId, fromDate, toDate) => {
        if (!employeeId || !fromDate || !toDate) {
            return;
        }

        try {
            setLoading(true);
            setSearching(true);
            setError('');

            console.log('Auto-fetching proposals with:', { empId: employeeId, startDate: fromDate, endDate: toDate });

            const response = await getProposalDetailsByEmployee(employeeId, fromDate, toDate);

            if (response.Status === 'Success' && response.MasterData?.proposals?.length > 0) {
                setProposals(response.MasterData.proposals);
                setFilteredProposals(response.MasterData.proposals);
                setError('');
            } else {
                setError(`No proposals found for Employee ID ${employeeId} between ${fromDate} and ${toDate}`);
                setProposals([]);
                setFilteredProposals([]);
            }
        } catch (err) {
            console.error('Error auto-fetching employee proposals:', err);
            setError('Failed to fetch proposal data. Please check your connection and try again.');
            setProposals([]);
            setFilteredProposals([]);
        } finally {
            setLoading(false);
            setSearching(false);
        }
    };

    const filterProposalsBySearchCriteria = (proposals, searchText) => {
        if (!searchText.trim()) {
            return proposals;
        }

        const lowerFilter = searchText.toLowerCase();

        return proposals.filter(proposal => {
            // Search in multiple fields
            const fullName = (proposal.InsuredFullName || '').toLowerCase();
            const policyNo = (proposal.Policy_No || '').toLowerCase();
            const AgentName = (proposal.AgentName || '').toLowerCase();
            const paymentRefNo = (proposal.Payment_Ref_No || '').toLowerCase();
            const paymentStatus = (proposal.Payment_Status || '').toLowerCase();

            return (
                fullName.includes(lowerFilter) ||
                policyNo.includes(lowerFilter) ||
                AgentName.includes(lowerFilter) ||
                paymentRefNo.includes(lowerFilter) ||
                paymentStatus.includes(lowerFilter)
            );
        });
    };

    // Filter proposals based on search text
    useEffect(() => {
        if (!searchFilter.trim()) {
            setFilteredProposals(proposals);
            return;
        }

        const filtered = filterProposalsBySearchCriteria(proposals, searchFilter);
        setFilteredProposals(filtered);
        setCurrentPage(1); // Reset to first page when filtering
    }, [searchFilter, proposals]);

    // Get current items for pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredProposals.slice(indexOfFirstItem, indexOfLastItem);

    // Calculate total pages
    const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);

    const fetchEmployeeProposals = async () => {
        if (!empId || !startDate || !endDate) {
            setError('Please fill in all required fields (Employee ID, From Date, To Date)');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            setError('From date cannot be later than To date');
            return;
        }

        try {
            setLoading(true);
            setSearching(true);
            setError('');

            console.log('Fetching proposals with:', { empId, startDate, endDate });

            // Call the API with employee ID and date range
            const response = await getProposalDetailsByEmployee(empId, startDate, endDate);

            console.log('API Response:', response);

            if (response.Status === 'Success' && response.MasterData?.proposals?.length > 0) {
                setProposals(response.MasterData.proposals);
                setFilteredProposals(response.MasterData.proposals);
                setError('');
            } else {
                setError(`No proposals found for Employee ID ${empId} between ${startDate} and ${endDate}`);
                setProposals([]);
                setFilteredProposals([]);
            }
        } catch (err) {
            console.error('Error fetching employee proposals:', err);
            setError('Failed to fetch proposal data. Please check your connection and try again.');
            setProposals([]);
            setFilteredProposals([]);
        } finally {
            setLoading(false);
            setSearching(false);
        }
    };

    const handleSearch = () => {
        fetchEmployeeProposals();
    };

    const handleFilterSearch = () => {
        if (!searchFilter.trim()) {
            setError('Please enter search criteria');
            return;
        }

        // Filter the existing proposals based on the search filter
        const filtered = filterProposalsBySearchCriteria(proposals, searchFilter);
        setFilteredProposals(filtered);
        setCurrentPage(1);

        if (filtered.length === 0) {
            setError('No results found matching your search criteria');
        } else {
            setError('');
        }
    };

    const handleCancelPolicy = (proposal) => {
        // Get the policy number to use for the detailed fetch
        const policyNo = proposal.Policy_No || proposal.Certificate_Number;

        const objdata = {
            "policyNo": proposal.Policy_No,
            "UID": proposal.UId,
            Name: proposal.InsuredFullName || '',
            AgentId: proposal.AgentId || '',
            proposal_id: proposal.proposal_id,
            Premium: proposal.PremiumAmount
        };

        if (policyNo) {
            // First fetch complete policy details using the policy number
            CancelPolicyDetails(objdata);
        }
    };

    const CancelPolicyDetails = async (cancelData) => {
        try {
            setLoading(true); // Show loading state

            // Call the API to get detailed policy information
            const response = await cancelpolicy(cancelData);

            if (response.Status === 'Success') {
                fetchEmployeeProposalsWithDates(empId, startDate, endDate);
            } else {
                setError(response.Message || 'Failed to cancel policy. Please try again.');
            }
        } catch (error) {
            console.error('Error fetching policy details:', error);
            // Fall back to the original proposal data
            setError('Something went wrong while canceling the policy.');

        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePolicy = (proposal) => {
        // Get the policy number to use for the detailed fetch
        const policyNo = proposal.Policy_No || proposal.Certificate_Number;

        if (policyNo) {
            // First fetch complete policy details using the policy number
            fetchPolicyDetails(policyNo, proposal);
        } else {
            // If no policy number, just use the existing proposal data
            navigateToUpdatePolicy(proposal);
        }
    };

    const fetchPolicyDetails = async (policyNo, fallbackProposal) => {
        try {
            setLoading(true); // Show loading state

            // Call the API to get detailed policy information
            const response = await getPolicyDetailsbyPolicyno(policyNo);

            if (response.Status === 'Success' && response.MasterData?.proposals?.length > 0) {
                // Use the detailed policy data for navigation
                navigateToUpdatePolicy(response.MasterData.proposals[0]);
            } else {
                // If no details found, fall back to the original proposal data
                navigateToUpdatePolicy(fallbackProposal);
            }
        } catch (error) {
            console.error('Error fetching policy details:', error);
            // Fall back to the original proposal data
            navigateToUpdatePolicy(fallbackProposal);
        } finally {
            setLoading(false);
        }
    };

    // Function to navigate to update policy page with provided data
    const navigateToUpdatePolicy = (proposal) => {
        // Store the complete proposal data in sessionStorage for the update page
        sessionStorage.setItem('proposalData', JSON.stringify({
            ...proposal,
            agentDetails: {
                AgentId: proposal.AgentId || agentData.AgentId,
                Agent_Code: proposal.Agent_Code || agentData.Agent_Code,
                FullName: proposal.UserName || agentData.FullName || agentData.name
            },
            travelDetails: {
                departureDate: proposal.PolicyStartDate,
                arrivalDate: proposal.PolicyEndDate,
                numberOfDays: Math.ceil(
                    (new Date(proposal.PolicyEndDate) - new Date(proposal.PolicyStartDate)) /
                    (1000 * 60 * 60 * 24)
                ) || 30, // Default to 30 days if calculation fails
                geographicalCover: proposal.NameofPlan?.includes('USA') ? 'USA' : 'Worldwide',
            },
            insuranceDetails: {
                premium: parseFloat(proposal.Selected_PremiumAmount || proposal.PremiumAmount || 0),
                planAmount: '500000', // Default value
                radiobtn_selectedOption: proposal.Selected_Payment_Mode || proposal.Payment_Mode || 'Full Pay',
                radiobtn_selectedAmount: proposal.Selected_PremiumAmount || proposal.PremiumAmount || '0',
                dateOfBirth: proposal.DateOfBirth
            }
        }));

        // Navigate to the update policy page
        navigate('/UpdatePolicyInsurance');
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    };

    const handleFilterChange = (e) => {
        setSearchFilter(e.target.value);
    };

    const handleFilterKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleFilterSearch();
        }
    };

    // Pagination handlers
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

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

            {/* Main Content */}
            <main className="coi-main-content">
                <div className="coi-card">
                    <div className="coi-card-header">
                        <h2 className="coi-card-title">
                            Employee Wise Proposal Details
                        </h2>
                        {empId && (
                            <p style={{ margin: '10px 0', color: '#6b7280', fontSize: '14px' }}>
                                Employee ID: <strong>{empId}</strong>
                            </p>
                        )}
                    </div>

                    {/* Date Filter Section */}
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
                                    Employee ID: <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={empId}
                                    onChange={(e) => setEmpId(e.target.value)}
                                    placeholder="Enter Employee ID"
                                    className="coi-filter-input"
                                    style={{
                                        width: '150px',
                                        backgroundColor: location.state?.empid ? '#f3f4f6' : 'white'
                                    }}
                                    readOnly={location.state?.empid ? true : false}
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
                                    disabled={searching || loading || !empId || !startDate || !endDate}
                                    className="coi-search-button"
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: (!empId || !startDate || !endDate) ? '#9ca3af' : '#3b82f6',
                                        cursor: (!empId || !startDate || !endDate) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <Search size={16} style={{ marginRight: '5px' }} />
                                    {searching ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        </div>

                        {/* Filter input for search within results */}
                        {proposals.length > 0 && (
                            <>
                                <div className="coi-filter-input-container1">
                                    <Filter size={16} style={{ color: '#6b7280', marginRight: '8px' }} />
                                    <input
                                        type="text"
                                        placeholder="Filter results (name, policy number, agent name)"
                                        value={searchFilter}
                                        onChange={handleFilterChange}
                                        onKeyDown={handleFilterKeyDown}
                                        className="coi-filter-input"
                                    />
                                    {searchFilter && (
                                        <button
                                            onClick={() => setSearchFilter('')}
                                            className="coi-clear-button"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                <div className="coi-results-count">
                                    {filteredProposals.length} {filteredProposals.length === 1 ? 'result' : 'results'} found
                                </div>
                            </>
                        )}
                    </div>

                    {loading ? (
                        <div className="coi-loading-container">
                            <div className="coi-spinner"></div>
                            <p>Loading proposals...</p>
                        </div>
                    ) : error ? (
                        <div className="coi-error-container">
                            <AlertTriangle size={24} color="#ef4444" />
                            <p className="coi-error-text">{error}</p>
                        </div>
                    ) : filteredProposals.length === 0 && !searching ? (
                        <div className="coi-empty-container">
                            <p>No proposals found. Please enter search criteria and click Search.</p>
                        </div>
                    ) : (
                        <>
                            <div className="coi-table-container">
                                <table className="coi-table">
                                    <thead>
                                        <tr>
                                            <th className="coi-table-header">Sr. No.</th>
                                            <th className="coi-table-header">Name</th>
                                            <th className="coi-table-header">Policy No.</th>
                                            <th className="coi-table-header">Agent Name</th>
                                            <th className="coi-table-header">Policy Start</th>
                                            <th className="coi-table-header">Policy End</th>
                                            <th className="coi-table-header">Premium</th>
                                            <th className="coi-table-header">Payment Mode</th>

                                            <th className="coi-table-header">Wallet Amount</th>
                                            <th className="coi-table-header">Status</th>
                                            <th className="coi-table-header">Invoice</th>
                                            <th className="coi-table-header">Policy</th>
                                            <th className='coi-table-header'>Reliance Pdf</th>
                                            <th className="coi-table-header">Update Policy</th>
                                            <th className="coi-table-header">Cancel Policy</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((proposal, index) => {
                                            const policyNo = proposal.Policy_No || '';
                                            const globalIndex = indexOfFirstItem + index + 1;

                                            return (
                                                <tr key={index} className={index % 2 === 0 ? "coi-table-row-even" : "coi-table-row-odd"}>
                                                    <td className="coi-table-cell">{globalIndex}</td>
                                                    <td className="coi-table-cell">
                                                        {proposal.InsuredFullName || 'N/A'}
                                                    </td>
                                                    <td className="coi-table-cell">{policyNo}</td>
                                                    <td className="coi-table-cell">{proposal.AgentName || 'N/A'}</td>
                                                    <td className="coi-table-cell">{formatDate(proposal.PolicyStartDate)}</td>
                                                    <td className="coi-table-cell">{formatDate(proposal.PolicyEndDate)}</td>
                                                    <td className="coi-table-cell">₹{parseFloat(proposal.PremiumAmount || 0).toLocaleString()}</td>
                                                    <td className="coi-table-cell">{proposal.Payment_Mode || 'N/A'}</td>

                                                    <td className="coi-table-cell">₹{parseFloat(proposal.Wallet_Amount || 0).toLocaleString()}</td>
                                                    <td className="coi-table-cell">
                                                        <span className="coi-status-badge">
                                                            {proposal.Payment_Status || 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="coi-table-cell">
                                                        {proposal.Invoice_Url ? (
                                                            <a
                                                                href={`${PDF_BASE_URL}${proposal.Invoice_Url}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="coi-button1"
                                                            >
                                                                <Download size={16} className="mr-1" />
                                                                Invoice
                                                            </a>
                                                        ) : (
                                                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>No Invoice</span>
                                                        )}
                                                    </td>

                                                    <td className="coi-table-cell">
                                                        {proposal.Policy_Url ? (
                                                            <a
                                                                href={`${PDF_BASE_URL}${proposal.Policy_Url}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="coi-button2"
                                                            >
                                                                <Download size={16} className="mr-1" />
                                                                Policy
                                                            </a>
                                                        ) : (
                                                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>No Policy</span>
                                                        )}
                                                    </td>

                                                    <td className="coi-table-cell">
                                                        {proposal.RelianceUrl ? (
                                                            <a
                                                                href={proposal.RelianceUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="coi-action-button coi-action-button-edit"
                                                            >
                                                                <Download size={16} className="mr-1" />
                                                                Reliance Policy
                                                            </a>
                                                        ) : (
                                                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>No Policy</span>
                                                        )}
                                                    </td>

                                                    <td className="coi-table-cell">
                                                        <div className="coi-action-buttons">
                                                            <button
                                                                onClick={() => handleUpdatePolicy(proposal)}
                                                                className="coi-button3"
                                                                title="Update Policy"
                                                            >
                                                                <Edit size={16} style={{ marginRight: '5px' }} /> Update Policy
                                                            </button>
                                                        </div>
                                                    </td>

                                                    <td className="coi-table-cell">
                                                        <div className="coi-action-buttons">
                                                            <button
                                                                onClick={() => {
                                                                    const confirmed = window.confirm(`Are you sure you want to cancel Policy No. ${proposal.Policy_No || proposal.Certificate_Number} ?`);

                                                                    if (confirmed) {
                                                                        handleCancelPolicy(proposal)
                                                                    }
                                                                }}
                                                                className="coi-button1"
                                                                title="Cancel Policy"
                                                            >
                                                                <CircleX size={16} style={{ marginRight: '5px' }} /> Cancel Policy
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="coi-pagination">
                                    <button
                                        onClick={goToPreviousPage}
                                        disabled={currentPage === 1}
                                        className={`coi-pagination-button ${currentPage === 1 ? 'coi-pagination-button-disabled' : ''}`}
                                    >
                                        Previous
                                    </button>

                                    <div className="coi-page-numbers">
                                        <span style={{ margin: '0 10px', color: '#6b7280' }}>
                                            Page {currentPage} of {totalPages} | Total Records: {filteredProposals.length}
                                        </span>
                                    </div>

                                    <button
                                        onClick={goToNextPage}
                                        disabled={currentPage === totalPages}
                                        className={`coi-pagination-button ${currentPage === totalPages ? 'coi-pagination-button-disabled' : ''}`}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main >

            <footer className="coi-footer">
                <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
            </footer>
        </div >
    );
};

export default Employee_COI;