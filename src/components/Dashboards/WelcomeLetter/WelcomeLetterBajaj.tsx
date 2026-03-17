import React, { useState, ChangeEvent, useRef } from 'react';
import {
    UserCircle, ArrowLeftCircle, RefreshCw, AlertTriangle, Search,
    LogOut, Home, Download, Eye, X, ArrowLeft, Filter, Edit, FileText
} from 'lucide-react';
import { logout } from '../../../services/auth';
import logo from '../../../../src/assets/img/TravelAssist.webp';
import * as XLSX from 'xlsx';
import { generateWelcomeLetterBajaj, downloadWelcomeBajajZip, PDF_BASE_URL } from '../../../services/api';
import './WelcomeLetterForm.css';
import './WelcomeLetterFormbajaj.css';
import { useNavigate, useLocation } from 'react-router-dom';
// ─── Types ────────────────────────────────────────────────────────────────────

interface ProcessResult {
    customerName: string;
    policyNumber: string;
    asNumber?: string;
    pdfUrl?: string;
    status: 'Success' | 'Failed';
    error?: string;
}

interface ExcelRow {
    'Customer Name': string;
    'Address': string;
    'Email': string;
    'Date': string;
    'Departure Date': string;
    'Arrival Date': string;
    'Duration': string | number;
    'Policy Number': string;
    'Charges': string | number;
    'custcontactno': string | number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const WelcomeLetterBajaj: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state || {};
    const [agentId, setAgentId] = useState<string>(state.agent || state.agentData?.AgentId || '');

    const [adminId, setAdminId] = useState<string>(state.adminId || '');
    const [userType, setUserType] = useState<string>(state.userType || '');

    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<ProcessResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
    const [isZipping, setIsZipping] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── Download All Zip Handler ─────────────────────────────────────────────

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
    const handleDownloadAll = async () => {
        const successPolicies = results.filter(r => r.status === 'Success').map(r => r.policyNumber);

        if (successPolicies.length === 0) {
            alert("No successful PDFs available to download.");
            return;
        }

        setIsZipping(true);
        try {
            const blob = await downloadWelcomeBajajZip(successPolicies);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Bajaj_Welcome_Letters_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error downloading zip:", err);
            alert("Error downloading ZIP file. Ensure backend is running and no network errors occurred.");
        } finally {
            setIsZipping(false);
        }
    };

    const handleGoToPlanSelection = () => {
        navigate('/dashboard', {
            state: {
                view: 'approvals',
                product: 'travelAssist'
            }
        });
    };

    const downloadSampleCSV = () => {
        const csvContent =
            'Customer Name,Address,Email,Date,Departure Date,Arrival Date,Duration,Policy Number,Charges,custcontactno\n' +
            'Ravi Sharma,101 Horizon Towers Andheri East Mumbai 400053,ravi.sharma@example.com,2026-03-15,2026-04-01,2026-04-15,15,BAJ1002003001,2500,9224624999\n' +
            'Priya Patel,Flat 4B Green Enclave Koramangala Mumbai 400034,priya.p@example.com,2026-03-16,2026-05-10,2026-05-20,10,BAJ1002003002,1850,9876543210';

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'sample_bajaj_data.csv';
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Helper to convert Excel serial dates AND string dates (like DD-MM-YYYY) into YYYY-MM-DD
    const formatExcelDate = (dateVal: string | number | undefined) => {
        if (dateVal === undefined || dateVal === null) return '';

        // 1. Handle Excel Serial Numbers
        if (typeof dateVal === 'number' || (!isNaN(Number(dateVal)) && Number(dateVal) > 20000)) {
            const excelDays = Number(dateVal);
            const jsDate = new Date(Math.round((excelDays - 25569) * 86400 * 1000));
            return jsDate.toISOString().split('T')[0];
        }

        // 2. Handle Text Dates (e.g. "15-04-2026" or "15/04/2026")
        const strVal = String(dateVal).trim();
        const parts = strVal.split(/[-/]/);

        if (parts.length === 3) {
            // If year is at the end (e.g., DD-MM-YYYY -> 15-04-2026)
            if (parts[2].length === 4) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                return `${year}-${month}-${day}`;
            }
            // If year is at the beginning (e.g., YYYY-MM-DD -> 2026-04-15)
            if (parts[0].length === 4) {
                const year = parts[0];
                const month = parts[1].padStart(2, '0');
                const day = parts[2].padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        }
        return strVal;
    };

    // ─── File upload handler ──────────────────────────────────────────────────


    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async (evt: ProgressEvent<FileReader>) => {
            setLoading(true);
            setError(null);
            setResults([]);
            setProgress(null);

            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json<ExcelRow>(ws);

                if (data.length === 0) {
                    setError('The uploaded file contains no data rows.');
                    return;
                }

                const processResults: ProcessResult[] = [];
                setProgress({ done: 0, total: data.length });

                for (let i = 0; i < data.length; i++) {
                    const row = data[i];

                    // 1. Strict Validation for Policy Number
                    const policyNumber = String(row['Policy Number'] ?? '').trim();

                    if (!policyNumber) {
                        processResults.push({
                            customerName: row['Customer Name'] || 'Unknown',
                            policyNumber: 'MISSING',
                            status: 'Failed',
                            error: 'Policy Number is required and cannot be empty.',
                        });
                        continue; // Skip processing this row
                    }

                    // 2. Formatting Duration with fallback
                    const rawDuration = String(row['Duration'] ?? '').trim();
                    const formattedDuration = rawDuration
                        ? (rawDuration.toLowerCase().includes('day') ? rawDuration : `${rawDuration} Days`)
                        : 'N/A';

                    // 3. Payload with Null-Safety for optional fields
                    const payload = {
                        customerName: row['Customer Name'] || 'N/A',
                        customerAddress: row['Address'] || '', // Optional
                        customerEmail: row['Email'] || '',     // Optional
                        customerDate: formatExcelDate(row['Date']),
                        departureDate: formatExcelDate(row['Departure Date']),
                        arrivalDate: formatExcelDate(row['Arrival Date']),
                        travelDuration: formattedDuration,
                        policyNumber: policyNumber,
                        assistanceCharges: String(row['Charges'] ?? '0'),
                        SupportEmail: 'support@interstellarservices.com',
                        SupportcontactNo: '+91-9876543210',
                        contactNo: String(row['custcontactno'] ?? ''), // Optional
                        isBajaj: true,
                    };

                    try {
                        const response = await generateWelcomeLetterBajaj(payload);

                        if (response?.data?.Data) {
                            processResults.push({
                                customerName: payload.customerName,
                                policyNumber: payload.policyNumber,
                                status: 'Success',
                                pdfUrl: `${PDF_BASE_URL}${response.data.Data.pdfUrl}`,
                                asNumber: response.data.Data.assistanceNumber,
                            });
                        } else {
                            throw new Error('Invalid response structure from server');
                        }
                    } catch (err: unknown) {
                        const message = err instanceof Error ? err.message : 'Failed to generate';
                        processResults.push({
                            customerName: payload.customerName,
                            policyNumber: payload.policyNumber,
                            status: 'Failed',
                            error: message,
                        });
                    }
                    setProgress({ done: i + 1, total: data.length });
                }

                setResults(processResults);
            } catch {
                setError('Failed to parse file. Please ensure it matches the sample format exactly.');
            } finally {
                setLoading(false);
                setProgress(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        reader.onerror = () => {
            setError('Error reading file.');
            setLoading(false);
        };

        reader.readAsBinaryString(file);
    };

    const successCount = results.filter(r => r.status === 'Success').length;
    const failCount = results.filter(r => r.status === 'Failed').length;

    // ─── Render ───────────────────────────────────────────────────────────────

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
                        <h2 className="coi-card-title">
                            Insurance Policy Documents
                        </h2>

                        <button onClick={handleGoToPlanSelection} className="back-to-selection-btn_admin">
                            <ArrowLeftCircle size={18} />
                            <span>Back To Previous Page</span>
                        </button>
                    </div>

                    <div className="card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className="card-title m-0">Bajaj Welcome Letter Generator</h2>
                            <button type="button" className="btn btn-outline-primary btn-sm" onClick={downloadSampleCSV} disabled={isZipping || loading}>
                                Download Sample CSV
                            </button>
                        </div>

                        <div className="card-body">
                            <div className="form-group">
                                <label>Upload Excel / CSV File</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileUpload}
                                    className="form-control file-input-styled"
                                    disabled={loading || isZipping}
                                />
                                <div style={{ marginTop: 8 }}>
                                    <small className="text-muted">
                                        <strong>Required Headers:</strong> Customer Name, Address, Email, Date, Departure Date, Arrival Date, Duration, Policy Number, Charges, Customer Contact No
                                    </small>
                                </div>
                            </div>

                            {loading && (
                                <div className="d-flex flex-column align-items-center justify-content-center mt-4 mb-4">
                                    <div className="spinner"></div>
                                    <p className="mt-3 mb-0">
                                        Processing records, please wait&hellip;
                                        {progress && <strong> ({progress.done} / {progress.total})</strong>}
                                    </p>
                                </div>
                            )}

                            {error && <div className="alert alert-danger mt-3">{error}</div>}

                            {results.length > 0 && (
                                <div className="mt-3 mb-3 d-flex gap-3">
                                    <span className="badge badge-success px-3 py-2" style={{ fontSize: '14px' }}>✓ Success: {successCount}</span>
                                    <span className="badge badge-danger px-3 py-2" style={{ fontSize: '14px' }}>✗ Failed: {failCount}</span>
                                    <span className="badge badge-secondary px-3 py-2" style={{ fontSize: '14px' }}>Total: {results.length}</span>
                                </div>
                            )}

                            {results.length > 0 && (
                                <div className="table-container mt-3">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '5%' }}>#</th>
                                                <th style={{ width: '20%' }}>Customer Name</th>
                                                <th style={{ width: '20%' }}>Policy Number</th>
                                                <th style={{ width: '15%' }}>AS Number</th>
                                                <th style={{ width: '15%' }}>Status</th>
                                                <th style={{ width: '25%' }} className="text-center">
                                                    {/* Download All Button moved inside the Header! */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                        <span>Downloads</span>
                                                        {results.some(r => r.status === 'Success') && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-success btn-sm w-100 download-all-btn"
                                                                onClick={handleDownloadAll}
                                                                disabled={isZipping || loading}
                                                            >
                                                                {isZipping ? (
                                                                    <>
                                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                        Zipping...
                                                                    </>
                                                                ) : (
                                                                    'Download All (ZIP)'
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.map((res, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td className="fw-semibold">{res.customerName}</td>
                                                    <td>{res.policyNumber}</td>
                                                    <td>{res.asNumber ?? 'N/A'}</td>
                                                    <td>
                                                        <span className={`status-badge ${res.status === 'Success' ? 'status-success' : 'status-failed'}`}>
                                                            {res.status}
                                                        </span>
                                                        {res.error && (
                                                            <div className="error-text" title={res.error}>
                                                                {res.error.length > 45 ? `${res.error.slice(0, 45)}…` : res.error}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        {res.status === 'Success' && res.pdfUrl ? (
                                                            <a href={res.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm w-100">
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
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <footer className="coi-footer">
                <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
            </footer>
        </div>
    );
};

export default WelcomeLetterBajaj;