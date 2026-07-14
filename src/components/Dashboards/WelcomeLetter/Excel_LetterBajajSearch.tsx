import React, { useState , ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search, LogOut, Home, Download, ArrowLeftCircle, RefreshCw, FileText, AlertTriangle } from "lucide-react";
import { logout } from '../../../services/auth';

// Import your properly configured axios API calls
import {
    ERP_search_welcome_letters_bajaj,searchWelcomeLettersBajaj,uploadBajajPdfApi,
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
    Issue_Date: string;
    error?: string;
    erpStatus: 'Pending' | 'Uploading...' | 'Success' | 'Failed';
}

const Excel_LetterBajajSearch = () => {
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
            const data = await ERP_search_welcome_letters_bajaj({ startDate, endDate });

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




    const goBack = () => navigate('/Excel_InsertTravelProposal');

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

    const handlePdfUpload = async (e: ChangeEvent<HTMLInputElement>, index: number, policyNo: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Set status to Uploading... (Using functional update)
        setResults((prevResults) => {
            const updatedResults = [...prevResults];
            updatedResults[index].erpStatus = 'Uploading...';
            return updatedResults;
        });

        // 2. Read file as base64 to send to backend
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64File = reader.result as string;

            try {
                // Call the API
                const response = await uploadBajajPdfApi({ policyNo: policyNo, pdfBase64: base64File });

                // Check response (added response.data.status fallback just in case Axios isn't unwrapped)
                if (response?.Status === "Success" || response?.status === "Success" || response?.data?.status === "Success" || response?.data?.Status === "Success") {

                    // 3. Update to Success (Using functional update to avoid stale closure)
                    setResults((prevResults) => {
                        const finalResults = [...prevResults];
                        finalResults[index].erpStatus = 'Success';
                        return finalResults;
                    });

                } else {
                    throw new Error("Upload Failed");
                }
            } catch (error) {
                console.error("PDF Upload Error:", error);

                // 4. Update to Failed (Using functional update)
                setResults((prevResults) => {
                    const finalResults = [...prevResults];
                    finalResults[index].erpStatus = 'Failed';
                    return finalResults;
                });
            }
        };
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
                            <h2 className="coi-card-title mb-0">ERP Upload -  Welcome Letter Bajaj Proposal</h2>
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

                            <div className="table-responsive">
                                <table className="data-table table table-hover table-bordered align-middle">
                                    <thead className="table-light">
                                        <tr>

                                            <th>Customer Name</th>
                                            <th>Policy Number</th>
                                            <th>AS Number</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th className="text-center">Duration (Days)</th>
                                            <th>Premium</th>
                                            <th>Upload BAJAJ Pdf</th>
                                            <th className="text-center">ERP Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((res, index) => (
                                            <tr key={index}>

                                                <td className="fw-semibold text-primary">{res.fullname}</td>
                                                <td>{res.Policy_Number}</td>
                                                <td>{res.Asnumber_bajaj || "—"}</td>
                                                <td>{formatDate(res.PolicyStartDate)}</td>
                                                <td>{formatDate(res.PolicyEndDate)}</td>
                                                <td className="text-center fw-bold text-dark">{res.travelDuration || "—"}</td>
                                                <td className="fw-bold text-success">₹{res.PremiumAmount}</td>
                                                <td style={{ verticalAlign: 'middle' }}>
                                                    <input
                                                        type="file"
                                                        accept="application/pdf"
                                                        onChange={(e) => handlePdfUpload(e, index, res.Policy_Number)}
                                                        disabled={ res.erpStatus === 'Uploading...'}
                                                        className="form-control"
                                                        style={{ padding: '4px', fontSize: '12px', minWidth: '200px' }}
                                                    />
                                                </td>
                                                <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                                                    <span
                                                        className={`badge ${res.erpStatus?.toLowerCase() === 'success'
                                                            ? 'badge-success'
                                                            : res.erpStatus === 'Uploading...'
                                                                ? 'badge-info'
                                                                : 'badge-danger'
                                                            }`}
                                                        style={{
                                                            padding: '6px 10px',
                                                            borderRadius: '4px',
                                                            display: 'inline-block',
                                                            minWidth: '80px',
                                                            color:
                                                                res.erpStatus?.toLowerCase() === 'success'
                                                                    ? '#28a745'
                                                                    : '#dc3545',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        {res.erpStatus}
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

            <footer className="coi-footer">
                <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
            </footer>
        </div>
    );
};

export default Excel_LetterBajajSearch;