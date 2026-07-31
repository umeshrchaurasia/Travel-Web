import React, { useState, ChangeEvent, useRef } from 'react';
import {
    LogOut, Home, ArrowLeftCircle, Plane,
    Shield
} from 'lucide-react';
import { logout } from '../../../services/auth';
import logo from '../../../../src/assets/img/TravelAssist.webp';
import * as XLSX from 'xlsx';
import { excelInsertBajajProposal, uploadBajajPdfApi } from '../../../services/api';
import './WelcomeLetterForm.css';
import './WelcomeLetterFormbajaj.css';
import '../UpdatePolicy/generatecoi.css';
import '../AdminDashboard.css';

import { useNavigate, useLocation } from 'react-router-dom';

interface ProcessResult {
    customerName: string;
    policyNumber: string;
    asNumber: string;
    startDate: string | null;
    endDate: string | null;
    finalPremium: string | number;
    selectedPremium: string | number;
    status: 'Success' | 'Failed';
    error?: string;
    erpStatus: 'Pending' | 'Uploading...' | 'Success' | 'Failed';

}

interface ExcelRow {
    AgentId: string;
    UId: string;
    Asnumber_bajaj: string;
    PolicyNo: string; GeographicalCover: string; CountryName: string;
    StartDate: string | number; EndDate: string | number; JourneyFromDate: string | number; JourneyToDate: string | number; NoOfDays: string | number;
    FinalPremium: string | number; Selected_PremiumAmount: string | number; Actual_PremiumAmount: string | number; gstamount: string | number; commission_agentamount: string | number;
    Premium_without_gst: string | number; Payout_Bajaj: string | number; Selected_Payment_Mode: string;
    Prop_Pincode: string; Prop_State: string; Prop_City: string; Prop_Address: string; Prop_Email: string; Prop_Mobile: string;
    Trv_Title: string; Trv_Gender: string; Trv_FirstName: string; Trv_MiddleName: string; Trv_LastName: string; Trv_DOB: string | number;
    Trv_Passport: string; Trv_RelationWithProposer: string; Trv_NomineeName: string; Trv_NomineeRelation: string; Trv_Email: string; Trv_Mobile: string; Trv_PreExistingDisease: string;
}

const Excel_InsertTravelProposal: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state || {};
    const [agentId, setAgentId] = useState<string>(state.agent || state.agentData?.AgentId || '');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<ProcessResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const PRODUCT_RELIANCE_TRAVEL = 'relianceTravel';
    const PRODUCT_BAJAJ_TRAVEL = 'bajajTravel';

    const VIEW_TRAVEL_SELECTION = 'travelSelection';
    const VIEW_ZEXTRA_SELECTION = 'zextraSelection';

    const VIEW_SELECTION = 'selection';


    const VIEW_APPROVALS = 'approvals';

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

    const WelcomeLetterSearch = () => {
        navigate('/Excel_LetterBajajSearch', {
            state: { agentId }
        });
    }

    const downloadSampleCSV = () => {
        const headers = [
            "AgentId", "UId", "Asnumber_bajaj", "PolicyNo", "GeographicalCover", "CountryName", "StartDate", "EndDate", "NoOfDays",
            "FinalPremium", "Selected_PremiumAmount", "Actual_PremiumAmount", "gstamount", "commission_agentamount", "Premium_without_gst", "Payout_Bajaj", "Selected_Payment_Mode",
            "Prop_Pincode", "Prop_State", "Prop_City", "Prop_Address", "Prop_Email", "Prop_Mobile",
            "Trv_Title", "Trv_Gender", "Trv_FirstName", "Trv_MiddleName", "Trv_LastName", "Trv_DOB", "Trv_Passport", "Trv_RelationWithProposer", "Trv_NomineeName", "Trv_NomineeRelation", "Trv_Email", "Trv_Mobile", "Trv_PreExistingDisease"
        ].join(',');

        const row = [
            "28", "119590", "BEU00090031", "000-12345678", "Worldwide Including USA and Canada", "USA", "05-04-2026", "15-04-2026", "10",
            "472", "977", "977", "149", "414", "828", "50", "full",
            "400021", "Maharashtra", "Mumbai", "123 Main St", "prop@example.com", "9876543210",
            "Mr", "M", "Umesh", "M", "Chaurasia", "1990-01-01", "Z1234567", "SELF", "Rahul Chaurasia", "BROTHER", "umesh@example.com", "9876543210", "No"
        ].join(',');

        const csvContent = `${headers}\n${row}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Sample_Bajaj_Travel_Proposals.csv';
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ─── STRICT DATE FORMATTER (Converts EVERYTHING to YYYY-MM-DD) ──────
    const forceYYYYMMDD = (dateVal: string | number | undefined) => {
        if (dateVal === undefined || dateVal === null || dateVal === '') return '';

        // 1. Handle Excel Serial Numbers (e.g., 46026.00011574074)
        const numericVal = Number(dateVal);
        if (!isNaN(numericVal) && numericVal > 20000) {
            // Convert Excel serial number to JS Date
            const jsDate = new Date(Math.round((numericVal - 25569) * 86400 * 1000));

            // Excel US-locale turns 1/4/2026 (April 1) into Jan 4.
            // We forcefully swap the month and day back to correct it.
            const excelMonth = (jsDate.getUTCMonth() + 1).toString().padStart(2, '0');
            const excelDay = jsDate.getUTCDate().toString().padStart(2, '0');
            const excelYear = jsDate.getUTCFullYear();

            // Swapping: excelMonth becomes the Day, excelDay becomes the Month
            return `${excelYear}-${excelDay}-${excelMonth}`;
        }

        // 2. Handle CSV Raw Text Strings (e.g., "1/04/2026", "15-03-2026")
        const strVal = String(dateVal).trim();

        // Match DD/MM/YYYY or D/M/YYYY or DD-MM-YYYY
        const dmyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
        const dmyMatch = strVal.match(dmyRegex);
        if (dmyMatch) {
            const day = dmyMatch[1].padStart(2, '0');
            const month = dmyMatch[2].padStart(2, '0');
            const year = dmyMatch[3];
            return `${year}-${month}-${day}`;
        }

        // Match YYYY-MM-DD or YYYY/MM/DD
        const ymdRegex = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;
        const ymdMatch = strVal.match(ymdRegex);
        if (ymdMatch) {
            const year = ymdMatch[1];
            const month = ymdMatch[2].padStart(2, '0');
            const day = ymdMatch[3].padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        return strVal; // Fallback
    };

    // For ERP Update PDF File
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

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async (evt: ProgressEvent<FileReader>) => {
            setLoading(true); setError(null); setResults([]); setProgress(null);

            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];

                const data = XLSX.utils.sheet_to_json<ExcelRow>(ws, { raw: true });

                if (data.length === 0) {
                    setError('The uploaded file contains no data rows.');
                    setLoading(false);
                    return;
                }

                const processResults: ProcessResult[] = [];
                setProgress({ done: 0, total: data.length });

                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    const policyNumber = String(row.PolicyNo ?? '').trim();

                    if (!policyNumber) {
                        processResults.push({
                            customerName: row.Trv_FirstName || 'Unknown',
                            policyNumber: 'MISSING',
                            asNumber: row.Asnumber_bajaj || '-',
                            startDate: forceYYYYMMDD(row.StartDate),
                            endDate: forceYYYYMMDD(row.EndDate),
                            finalPremium: row.FinalPremium || 0,
                            selectedPremium: row.Selected_PremiumAmount || 0,
                            status: 'Failed',
                            error: 'Policy Number is required.',
                            erpStatus: 'Pending'
                        });

                        // Update UI for this failed row immediately
                        setResults([...processResults]);
                        setProgress({ done: i + 1, total: data.length });
                        continue;
                    }

                    const payload = {
                        AgentId: row.AgentId,
                        UId: row.UId,
                        Asnumber_bajaj: row.Asnumber_bajaj,
                        PolicyNo: policyNumber,
                        GeographicalCover: row.GeographicalCover, CountryName: row.CountryName,
                        StartDate: forceYYYYMMDD(row.StartDate),
                        EndDate: forceYYYYMMDD(row.EndDate),
                        JourneyFromDate: forceYYYYMMDD(row.StartDate),
                        JourneyToDate: forceYYYYMMDD(row.EndDate),
                        NoOfDays: row.NoOfDays || 0, FinalPremium: row.FinalPremium || 0,
                        Selected_PremiumAmount: row.Selected_PremiumAmount || 0,
                        Actual_PremiumAmount: row.Actual_PremiumAmount || 0,
                        gstamount: row.gstamount || 0, 
                        commission_agentamount: row.commission_agentamount || 0,
                        Premium_without_gst: row.Premium_without_gst || 0, 
                        Payout_Bajaj: row.Payout_Bajaj || 0,
                        Selected_Payment_Mode: row.Selected_Payment_Mode, 
                        Prop_Pincode: row.Prop_Pincode,
                        Prop_State: row.Prop_State, Prop_City: row.Prop_City, Prop_Address: row.Prop_Address,
                        Prop_Email: row.Prop_Email, Prop_Mobile: row.Prop_Mobile,
                        Trv_Title: row.Trv_Title, Trv_Gender: row.Trv_Gender, Trv_FirstName: row.Trv_FirstName,
                        Trv_MiddleName: row.Trv_MiddleName, Trv_LastName: row.Trv_LastName, Trv_DOB: forceYYYYMMDD(row.Trv_DOB),
                        Trv_Passport: row.Trv_Passport, Trv_RelationWithProposer: row.Trv_RelationWithProposer,
                        Trv_NomineeName: row.Trv_NomineeName, Trv_NomineeRelation: row.Trv_NomineeRelation,
                        Trv_Email: row.Trv_Email, Trv_Mobile: row.Trv_Mobile, Trv_PreExistingDisease: row.Trv_PreExistingDisease || 'No'
                    };

                    try {
                        const response = await excelInsertBajajProposal(payload);

                        if (response?.Status === "Success" || response?.status === "Success") {

                            // Ensure it pulls the ERP_Status from your new backend addition
                            const backendErpStatus = response?.MasterData?.erpStatus || response?.data?.MasterData?.erpStatus || 'Pending';

                            processResults.push({
                                customerName: `${payload.Trv_FirstName} ${payload.Trv_LastName}`,
                                policyNumber: payload.PolicyNo,
                                asNumber: payload.Asnumber_bajaj || '-',
                                startDate: payload.StartDate,
                                endDate: payload.EndDate,
                                finalPremium: payload.FinalPremium,
                                selectedPremium: payload.Selected_PremiumAmount,
                                status: 'Success',
                                erpStatus: backendErpStatus
                            });
                        } else {
                            throw new Error(response.Message || 'Failed to process record');
                        }
                    } catch (err: any) {
                        processResults.push({
                            customerName: `${payload.Trv_FirstName} ${payload.Trv_LastName}`,
                            policyNumber: payload.PolicyNo,
                            asNumber: payload.Asnumber_bajaj || '-',
                            startDate: payload.StartDate,
                            endDate: payload.EndDate,
                            finalPremium: payload.FinalPremium,
                            selectedPremium: payload.Selected_PremiumAmount,
                            status: 'Failed',
                            error: err.message || 'Server error',
                            erpStatus: 'Failed'
                        });
                    }
                    // UPDATE STATE HERE: This renders the table row dynamically as the loop progresses
                    setResults([...processResults]);
                    setProgress({ done: i + 1, total: data.length });
                }


            } catch {
                setError('Failed to parse file. Please ensure it matches the sample format exactly.');
            } finally {
                setLoading(false);
                setProgress(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const [currentView, setCurrentView] = useState(() => {
        if (location.state?.product === 'travelAssist') return VIEW_TRAVEL_SELECTION;
        return location.state?.view === 'approvals' ? VIEW_APPROVALS : VIEW_SELECTION;
    });
    const [selectedProduct, setSelectedProduct] = useState(() => {
        if (location.state?.product === 'indusindTravel') return PRODUCT_RELIANCE_TRAVEL;
       // if (location.state?.product === 'bajajTravel') return PRODUCT_BAJAJ_TRAVEL;

        return PRODUCT_BAJAJ_TRAVEL;
    });

    const handleTravelProductSelection = (product: string) => {
        setSelectedProduct(product);
        setCurrentView(VIEW_APPROVALS);
    };

    const successCount = results.filter(r => r.status === 'Success').length;
    const failCount = results.filter(r => r.status === 'Failed').length;

    return (
        <div className="coi-container">
            <header className="coi-header">
                <div className="coi-header-content">
                    <img src={logo} alt="Travel Assist" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
                    <div className="d-flex justify-content-center py-4">
                        <span className="page-title">Travel Assistance Service</span>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button onClick={goBack} className="coi-button"><Home size={18} /> Dashboard</button>
                        <button onClick={handleLogout} className="coi-button"><LogOut size={18} /> Logout</button>
                    </div>
                </div>
            </header>

            <main className="coi-main-content">
                <div className="coi-card">
                    <div className="coi-card-header">
                        <h2 className="coi-card-title"> Proposal Upload In ERP</h2>
                        <button onClick={goBack} className="back-to-selection-btn_admin">
                            <ArrowLeftCircle size={18} /><span>Back</span>
                        </button>
                    </div>

                    <div className="AdminDashboard">
                        <div className="product-selection-grid">
                            <div
                                className={`product-card card-travel ${selectedProduct === PRODUCT_RELIANCE_TRAVEL ? 'selected-card' : ''}`}
                                onClick={() => handleTravelProductSelection(PRODUCT_RELIANCE_TRAVEL)}
                            >
                                <Plane size={48} className="card-icon" />
                                <h3>IndusInd Travel Insurance</h3>
                                <p>Manage IndusInd Travel Assist Agents, Wallet, and Reports.</p>
                            </div>

                            <div
                                className={`product-card card-travel ${selectedProduct === PRODUCT_BAJAJ_TRAVEL ? 'selected-card' : ''}`}
                                onClick={() => handleTravelProductSelection(PRODUCT_BAJAJ_TRAVEL)}
                            >
                                <Shield size={48} className="card-icon" />
                                <h3>Bajaj Traveller</h3>
                                <p>Manage Bajaj Travel Assistance services and Welcome Letters.</p>
                            </div>
                        </div>
                    </div>
                    {selectedProduct === PRODUCT_BAJAJ_TRAVEL && (

                      <div id="bajaj-card" className="card upload-card-container">
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 className="card-title m-0">Upload Excel Data - Bajaj</h2>
                                <button type="button" className="btn btn-outline-primary btn-sm" onClick={WelcomeLetterSearch} disabled={loading}>
                                    Welcome Letter Search - Bajaj
                                </button>
                                <button type="button" className="btn btn-outline-primary btn-sm" onClick={downloadSampleCSV} disabled={loading}>
                                    Download Sample CSV
                                </button>
                            </div>

                            <div className="card-body">
                                <div className="form-group">
                                    <label>Upload Excel / CSV File</label>
                                    <input
                                        ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv"
                                        onChange={handleFileUpload} className="form-control file-input-styled"
                                        disabled={loading}
                                    />
                                </div>

                                {loading && (
                                    <div className="d-flex flex-column align-items-center justify-content-center mt-4 mb-4">
                                        <div className="spinner"></div>
                                        <p className="mt-3 mb-0">Processing records, please wait... {progress && <strong> ({progress.done} / {progress.total})</strong>}</p>
                                    </div>
                                )}

                                {error && <div className="alert alert-danger mt-3">{error}</div>}

                                {results.length > 0 && (
                                    <>

                                        <div className="table-responsive" style={{ overflowX: 'auto', width: '100%' }}>
                                            <table className="table table-striped table-hover table-bordered mb-0" style={{ whiteSpace: 'nowrap', backgroundColor: 'white' }}>
                                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 1 }}>
                                                    <tr>
                                                        <th style={{ fontWeight: '600', color: '#4b5563' }}>#</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563' }}>Customer Name</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563' }}>Policy Number</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563' }}>AS Number</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563' }}>Start Date</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563' }}>End Date</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563' }}>Final Premium</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563' }}>Selected Premium</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563' }}>Status</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563', minWidth: '220px' }}>Upload BAJAJ Pdf</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563', minWidth: '120px', textAlign: 'center' }}>ERP Status</th>                                          </tr>
                                                </thead>
                                                <tbody>
                                                    {results.map((res, index) => (
                                                        <tr key={index}>
                                                            <td style={{ verticalAlign: 'middle' }}>{index + 1}</td>
                                                            <td style={{ verticalAlign: 'middle' }}>{res.customerName}</td>
                                                            <td style={{ verticalAlign: 'middle' }}>{res.policyNumber}</td>
                                                            <td style={{ verticalAlign: 'middle' }}>{res.asNumber}</td>
                                                            <td style={{ verticalAlign: 'middle' }}>{res.startDate || '-'}</td>
                                                            <td style={{ verticalAlign: 'middle' }}>{res.endDate || '-'}</td>
                                                            <td style={{ verticalAlign: 'middle' }}>₹{res.finalPremium || '0'}</td>
                                                            <td style={{ verticalAlign: 'middle' }}>₹{res.selectedPremium || '0'}</td>
                                                            <td style={{ verticalAlign: 'middle' }}>
                                                                <span
                                                                    className={`badge ${res.status?.toLowerCase() === 'success'
                                                                        ? 'badge-success'
                                                                        : 'badge-danger'
                                                                        }`}
                                                                    style={{
                                                                        padding: '6px 10px',
                                                                        borderRadius: '4px',
                                                                        color: res.status?.toLowerCase() === 'success' ? '#28a745' : '#dc3545',
                                                                        fontWeight: '600'
                                                                    }}
                                                                >
                                                                    {res.status}
                                                                </span>

                                                                {res.error && (
                                                                    <div className="text-danger mt-1" style={{ fontSize: '12px' }}>
                                                                        {res.error}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td style={{ verticalAlign: 'middle' }}>
                                                                <input
                                                                    type="file"
                                                                    accept="application/pdf"
                                                                    onChange={(e) => handlePdfUpload(e, index, res.policyNumber)}
                                                                    disabled={res.status !== 'Success' || res.erpStatus === 'Uploading...'}
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
                                    </>
                                )}
                            </div>
                        </div>

                    )}

                    {/* SHOW ONLY IF INDUSIND IS SELECTED */}
                    {selectedProduct === PRODUCT_RELIANCE_TRAVEL && (

                        <div id="IndusInd-card" className="card upload-card-container">
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 className="card-title m-0">Upload Excel Data - IndusInd</h2>
                                <button type="button" className="btn btn-outline-primary btn-sm" onClick={WelcomeLetterSearch} disabled={loading}>
                                    Welcome Letter Search - IndusInd
                                </button>
                                <button type="button" className="btn btn-outline-primary btn-sm" onClick={downloadSampleCSV} disabled={loading}>
                                    Download Sample CSV
                                </button>
                            </div>

                            <div className="card-body">
                                <div className="form-group">
                                    <label>Upload Excel / CSV File</label>
                                    <input
                                        ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv"
                                        onChange={handleFileUpload} className="form-control file-input-styled"
                                        disabled={loading}
                                    />
                                </div>

                                {loading && (
                                    <div className="d-flex flex-column align-items-center justify-content-center mt-4 mb-4">
                                        <div className="spinner"></div>
                                        <p className="mt-3 mb-0">Processing records, please wait... {progress && <strong> ({progress.done} / {progress.total})</strong>}</p>
                                    </div>
                                )}

                                {error && <div className="alert alert-danger mt-3">{error}</div>}

                                {results.length > 0 && (
                                    <>

                                        <div className="table-responsive" style={{ overflowX: 'auto', width: '100%' }}>
                                            <table className="table table-striped table-hover table-bordered mb-0" style={{ whiteSpace: 'nowrap', backgroundColor: 'white' }}>
                                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 1 }}>
                                                    <tr>
                                                        <th style={{ fontWeight: '600', color: '#4b5563' }}>#</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563' }}>Customer Name</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563' }}>Policy Number</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563' }}>AS Number</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563' }}>Start Date</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563' }}>End Date</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563' }}>Final Premium</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563' }}>Selected Premium</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563' }}>Status</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563', minWidth: '220px' }}>Upload BAJAJ Pdf</th>
                                                        <th style={{ fontWeight: '600', color: '#4b5563', minWidth: '120px', textAlign: 'center' }}>ERP Status</th>                                          </tr>
                                                </thead>
                                                <tbody>
                                                    {results.map((res, index) => (
                                                        <tr key={index}>
                                                            <td style={{ verticalAlign: 'middle' }}>{index + 1}</td>
                                                            <td style={{ verticalAlign: 'middle' }}>{res.customerName}</td>
                                                            <td style={{ verticalAlign: 'middle' }}>{res.policyNumber}</td>
                                                            <td style={{ verticalAlign: 'middle' }}>{res.asNumber}</td>
                                                            <td style={{ verticalAlign: 'middle' }}>{res.startDate || '-'}</td>
                                                            <td style={{ verticalAlign: 'middle' }}>{res.endDate || '-'}</td>
                                                            <td style={{ verticalAlign: 'middle' }}>₹{res.finalPremium || '0'}</td>
                                                            <td style={{ verticalAlign: 'middle' }}>₹{res.selectedPremium || '0'}</td>
                                                            <td style={{ verticalAlign: 'middle' }}>
                                                                <span
                                                                    className={`badge ${res.status?.toLowerCase() === 'success'
                                                                        ? 'badge-success'
                                                                        : 'badge-danger'
                                                                        }`}
                                                                    style={{
                                                                        padding: '6px 10px',
                                                                        borderRadius: '4px',
                                                                        color: res.status?.toLowerCase() === 'success' ? '#28a745' : '#dc3545',
                                                                        fontWeight: '600'
                                                                    }}
                                                                >
                                                                    {res.status}
                                                                </span>

                                                                {res.error && (
                                                                    <div className="text-danger mt-1" style={{ fontSize: '12px' }}>
                                                                        {res.error}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td style={{ verticalAlign: 'middle' }}>
                                                                <input
                                                                    type="file"
                                                                    accept="application/pdf"
                                                                    onChange={(e) => handlePdfUpload(e, index, res.policyNumber)}
                                                                    disabled={res.status !== 'Success' || res.erpStatus === 'Uploading...'}
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
                                    </>
                                )}
                            </div>
                        </div>

                    )}
                </div>
            </main>
        </div>
    );
};

export default Excel_InsertTravelProposal;