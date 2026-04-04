import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, LogOut, Home, Download, ArrowLeftCircle, RefreshCw, FileText, AlertTriangle } from "lucide-react";
import { logout } from '../../../services/auth';

// Import your properly configured axios API calls
import { 
    searchWelcomeLettersBajaj, 
    downloadWelcomeBajajZip, 
    PDF_BASE_URL 
} from "../../../services/api";

import logo from '../../../../src/assets/img/TravelAssist.webp';
import '../UpdatePolicy/generatecoi.css';
import './WelcomeLetterFormbajaj.css';

interface WelcomeLetter {
    id: number;
    pdfurl: string;
    Policy_Number: string;
    Asnumber_bajaj: string;
    PolicyStartDate: string;
    PolicyEndDate: string;
    fulladdress: string;
    fullname: string;
    PremiumAmount: string;
    cust_EmailID: string;
    cust_MobileNumber: string;
    travelDuration: string;
    Created_Date: string;
}

const WelcomeLetterBajajSearch = () => {
    const navigate = useNavigate();
    
    // Set default dates to current month like in MIS_Proposal_Admin
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);
    const [dateError, setDateError] = useState(""); // State for date validation errors
    
    const [results, setResults] = useState<WelcomeLetter[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
    const [downloadingZip, setDownloadingZip] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        // Clear previous error
        setDateError("");

        // 1. Validation: Check if dates are empty
        if (!startDate || !endDate) {
            setDateError("Please select both Start Date and End Date.");
            return;
        }

        // 2. Validation: End Date cannot be less than Start Date
        if (new Date(endDate) < new Date(startDate)) {
            setDateError("End Date cannot be earlier than Start Date.");
            return;
        }
        
        try {
            setLoading(true);
            
            // Call the Axios instance function from api.js
            const data = await searchWelcomeLettersBajaj({ startDate, endDate });
            
            if (data && (data.Status === "Success" || data.status === "Success")) {
                setResults(data.MasterData || []);
                setSelectedPolicies([]); // Reset selection on new search
                if (data.MasterData?.length === 0) {
                    setDateError("No records found for the selected date range.");
                }
            } else {
                setDateError(data.Message || "Failed to fetch data");
            }
        } catch (error: any) {
            console.error("Search error", error);
            setDateError(error?.response?.data?.Message || "An error occurred while searching.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedPolicies(results.map(r => r.Policy_Number));
        } else {
            setSelectedPolicies([]);
        }
    };

    const handleSelectRow = (policyNo: string) => {
        setSelectedPolicies(prev =>
            prev.includes(policyNo)
                ? prev.filter(p => p !== policyNo)
                : [...prev, policyNo]
        );
    };

    const handleDownloadZip = async () => {
        if (selectedPolicies.length === 0) return;

        try {
            setDownloadingZip(true);
            
            // Call the Axios instance function (which expects a blob)
            const blobData = await downloadWelcomeBajajZip(selectedPolicies);

            // Create a physical Blob from the Axios response
            const blob = new Blob([blobData], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            
            // Trigger automatic download
            const a = document.createElement('a');
            a.href = url;
            a.download = `Bajaj_Welcome_Letters_${new Date().getTime()}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            
            // Cleanup
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("ZIP Download Error", error);
            alert("Failed to download ZIP file. Ensure the PDFs exist on the server.");
        } finally {
            setDownloadingZip(false);
        }
    };

    const downloadCSV = () => {
        if (results.length === 0) return;

        const headers = [
            "Customer Name",
            "Policy Number",
            "AS Number",
            "Start Date",
            "End Date",
            "Duration (Days)",
            "Premium",
            "Created Date"
        ];

        const csvRows = results.map(res => [
            `"${res.fullname || ''}"`,
            `"${res.Policy_Number || ''}"`,
            `"${res.Asnumber_bajaj || ''}"`,
            `"${formatDate(res.PolicyStartDate) || ''}"`,
            `"${formatDate(res.PolicyEndDate) || ''}"`,
            `"${res.travelDuration || ''}"`,
            `"${res.PremiumAmount || ''}"`,
            `"${formatDate(res.Created_Date) || ''}"`
        ]);

        const csvContent = [headers.join(","), ...csvRows.map(row => row.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Bajaj_Welcome_Letters_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const goBack = () => navigate('/WelcomeLetterBajaj');

    const gotoDashboard = () => navigate('/dashboard');



    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-IN');
    };

    return (
        <div className="coi-container">
            <header className="coi-header">
                <div className="coi-header-content">
                    <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
                    <div className="d-flex justify-content-center py-4">
                        <div className="logo d-flex align-items-center w-auto">
                            <span className="page-title">Travel Assistance Service</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button onClick={gotoDashboard} className="coi-button"><Home size={18} /> Dashboard</button>
                        <button onClick={handleLogout} className="coi-button"><LogOut size={18} /> Logout</button>
                    </div>
                </div>
            </header>

            <main className="coi-main-content">
                <div className="coi-card shadow-sm border-0">
                    <div className="coi-card-header d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            <button onClick={goBack} className="btn btn-link text-primary p-0">
                                <ArrowLeftCircle size={28} />
                            </button>
                            <h2 className="coi-card-title mb-0"> Welcome Letter Bajaj Search By Created Date</h2>
                        </div>
                    </div>

                    <div className="card-body p-4 bg-light">
                        {/* Changed from row col-md-4 to a compact flexbox layout to prevent long stretched inputs */}
                        <form onSubmit={handleSearch} className="d-flex flex-wrap align-items-end gap-3 mb-2">
                            <div style={{ minWidth: '220px' }}>
                                <label className="form-label fw-bold text-secondary mb-1">From Date</label>
                                <input
                                    type="date"
                                    className={`form-control ${dateError ? 'is-invalid' : ''}`}
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setDateError(""); // clear error on change
                                    }}
                                />
                            </div>
                            <div style={{ minWidth: '220px' }}>
                                <label className="form-label fw-bold text-secondary mb-1">To Date</label>
                                <input
                                    type="date"
                                    className={`form-control ${dateError ? 'is-invalid' : ''}`}
                                    value={endDate}
                                    min={startDate} // HTML5 validation fallback
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setDateError(""); // clear error on change
                                    }}
                                />
                            </div>
                            <div>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary fw-bold shadow-sm" 
                                    disabled={loading}
                                    style={{ height: '38px', padding: '0 24px' }}
                                >
                                    {loading ? (
                                        <><RefreshCw size={18} className="me-2 animate-spin d-inline" /> Searching...</>
                                    ) : (
                                        <><Search size={18} className="me-2 d-inline" /> Search</>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Inline Error Message Display */}
                        {dateError && (
                            <div className="text-danger fw-semibold mt-2 d-flex align-items-center" style={{ fontSize: '14px' }}>
                                <AlertTriangle size={16} className="me-2" />
                                {dateError}
                            </div>
                        )}
                    </div>

                    {results.length > 0 && (
                        <div className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0 text-success fw-bold">Found {results.length} Records</h5>
                                <div className="d-flex gap-3">
                                    <button
                                        onClick={downloadCSV}
                                        className="btn btn-outline-primary shadow-sm"
                                        style={{ display: "flex", alignItems: "center", fontWeight: "600" }}
                                    >
                                        <FileText size={18} className="me-2" /> Download CSV
                                    </button>
                                    <button
                                        onClick={handleDownloadZip}
                                        disabled={selectedPolicies.length === 0 || downloadingZip}
                                        className={`btn shadow-sm ${selectedPolicies.length > 0 ? 'btn-success' : 'btn-secondary'}`}
                                        style={{ display: "flex", alignItems: "center", fontWeight: "600" }}
                                    >
                                        {downloadingZip ? (
                                            <><RefreshCw className="animate-spin me-2" size={18} /> Compressing...</>
                                        ) : (
                                            <><Download size={18} className="me-2" /> Download Selected as ZIP ({selectedPolicies.length})</>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="data-table table table-hover table-bordered align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="text-center">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    onChange={handleSelectAll}
                                                    checked={selectedPolicies.length === results.length && results.length > 0}
                                                />
                                            </th>
                                            <th>Customer Name</th>
                                            <th>Policy Number</th>
                                            <th>AS Number</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th className="text-center">Duration (Days)</th>
                                            <th>Premium</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((res, index) => (
                                            <tr key={index}>
                                                <td className="text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={selectedPolicies.includes(res.Policy_Number)}
                                                        onChange={() => handleSelectRow(res.Policy_Number)}
                                                    />
                                                </td>
                                                <td className="fw-semibold text-primary">{res.fullname}</td>
                                                <td>{res.Policy_Number}</td>
                                                <td>{res.Asnumber_bajaj || "—"}</td>
                                                <td>{formatDate(res.PolicyStartDate)}</td>
                                                <td>{formatDate(res.PolicyEndDate)}</td>
                                                <td className="text-center fw-bold text-dark">{res.travelDuration || "—"}</td>
                                                <td className="fw-bold text-success">₹{res.PremiumAmount}</td>
                                                <td className="text-center">
                                                    {res.pdfurl ? (
                                                        <a href={`${PDF_BASE_URL}${res.pdfurl}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm w-100">
                                                            View PDF
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted">—</span>
                                                    )}
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

            <footer className="coi-footer">
                <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
            </footer>
        </div>
    );
};

export default WelcomeLetterBajajSearch;