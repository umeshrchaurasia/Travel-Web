import React, { useState, ChangeEvent, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    LogOut,
    Home,
    ArrowLeftCircle,
    RefreshCw,
    AlertTriangle,
    Send,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    UserSearch,
} from "lucide-react";
import { logout } from "../../../services/auth";

// Import your properly configured axios API calls
import {
    ERP_search_welcome_letters_bajaj,
    uploadBajajPdfApi,
    pushCsDataBajajApi,
} from "../../../services/api";

import logo from "../../../../src/assets/img/TravelAssist.webp";
import "../UpdatePolicy/generatecoi.css";
import "./WelcomeLetterFormbajaj.css";

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
    erpStatus: "Pending" | "Uploading..." | "Success" | "Failed";
    csPushStatus?: "Idle" | "Pushing..." | "Pushed" | "Failed";
}

const ITEMS_PER_PAGE = 15;

const Excel_LetterBajajSearch = () => {
    const navigate = useNavigate();

    // Default dates to current month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [startDate, setStartDate] = useState(
        firstDayOfMonth.toISOString().split("T")[0],
    );
    const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);
    const [customerNameSearch, setCustomerNameSearch] = useState("");
    const [dateError, setDateError] = useState("");

    const [results, setResults] = useState<WelcomeLetter[]>([]);
    const [loading, setLoading] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);

    const isSuccessStatus = (status: string | undefined) => {
        if (!status) return false;
        const s = status.toLowerCase().trim();
        return s === 'success' || s === 'sucess';
    };


    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setDateError("");

        if (!startDate || !endDate) {
            setDateError("Please select both Start Date and End Date.");
            return;
        }

        if (new Date(endDate) < new Date(startDate)) {
            setDateError("End Date cannot be earlier than Start Date.");
            return;
        }

        try {
            setLoading(true);
            const data = await ERP_search_welcome_letters_bajaj({
                startDate,
                endDate,
            });

            if (data && (data.Status === "Success" || data.status === "Success")) {
                const fetchedData = (data.MasterData || []).map(
                    (item: WelcomeLetter) => {
                         const isErpSuccess = isSuccessStatus(item.erpStatus);

                         return {
                            ...item,
                             csPushStatus: isErpSuccess ? 'Pushed' :'Idle' // Set to Idle if ERP upload was successful, else Failed
                         };
                    },
                );
                setResults(fetchedData);
                setCurrentPage(1); // Reset to page 1 on new search
                if (fetchedData.length === 0) {
                    setDateError("No records found for the selected date range.");
                }
            } else {
                setDateError(data.Message || "Failed to fetch data");
            }
        } catch (error: any) {
            console.error("Search error", error);
            setDateError(
                error?.response?.data?.Message || "An error occurred while searching.",
            );
        } finally {
            setLoading(false);
        }
    };

    // Filter results by Customer Name (case-insensitive) while preserving original index
    const filteredResultsWithIndex = useMemo(() => {
        const query = customerNameSearch.trim().toLowerCase();
        return results
            .map((item, originalIndex) => ({ item, originalIndex }))
            .filter(({ item }) => {
                if (!query) return true;
                return (
                    item.fullname?.toLowerCase().includes(query) ||
                    item.Policy_Number?.toLowerCase().includes(query) ||
                    item.Asnumber_bajaj?.toLowerCase().includes(query)
                );
            });
    }, [results, customerNameSearch]);

    // Calculate Pagination (15 records per page)
    const totalRecords = filteredResultsWithIndex.length;
    const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedRecords = filteredResultsWithIndex.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE,
    );

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const goBack = () => navigate("/Excel_InsertTravelProposal");
    const gotoDashboard = () => navigate("/dashboard");

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return isNaN(date.getTime())
            ? dateString
            : date.toLocaleDateString("en-IN");
    };

    // Handle CS Data Push Button Click
    const handleCsDataPush = async (
        originalIndex: number,
        record: WelcomeLetter,
    ) => {
        setResults((prev) => {
            const updated = [...prev];
            updated[originalIndex] = {
                ...updated[originalIndex],
                csPushStatus: "Pushing...",
            };
            return updated;
        });

        try {
            // Replace or hook up your CS Data Push API call here if needed:
            const response = await pushCsDataBajajApi({
                Policyno: record.Policy_Number,
            });
            if (
                response &&
                (response.Status === "Success" || response.status === "Success")
            ) {
                // Set state to Pushed
                setResults((prev) => {
                    const updated = [...prev];
                    updated[originalIndex] = {
                        ...updated[originalIndex],
                        csPushStatus: "Pushed",
                    };
                    return updated;
                });
                // Optional: You can show a success toast/alert here
                // alert(`Successfully pushed data for policy ${record.Policy_Number}`);
            } else {
                throw new Error(response.Message || "Failed to push data");
            }
        } catch (error) { }
    };

    const handlePdfUpload = async (
        e: ChangeEvent<HTMLInputElement>,
        originalIndex: number,
        policyNo: string,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setResults((prevResults) => {
            const updatedResults = [...prevResults];
            updatedResults[originalIndex] = {
                ...updatedResults[originalIndex],
                erpStatus: "Uploading...",
            };
            return updatedResults;
        });

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64File = reader.result as string;

            try {
                const response = await uploadBajajPdfApi({
                    policyNo: policyNo,
                    pdfBase64: base64File,
                });

                if (
                    response?.Status === "Success" ||
                    response?.status === "Success" ||
                    response?.data?.status === "Success" ||
                    response?.data?.Status === "Success"
                ) {
                    setResults((prevResults) => {
                        const finalResults = [...prevResults];
                        finalResults[originalIndex] = {
                            ...finalResults[originalIndex],
                            erpStatus: "Success",
                             csPushStatus: 'Pushed'
                        };
                        return finalResults;
                    });
                } else {
                    throw new Error("Upload Failed");
                }
            } catch (error) {
                console.error("PDF Upload Error:", error);
                setResults((prevResults) => {
                    const finalResults = [...prevResults];
                    finalResults[originalIndex] = {
                        ...finalResults[originalIndex],
                        erpStatus: "Failed",
                    };
                    return finalResults;
                });
            }
        };
    };

    return (
        <div className="coi-container">
            <header className="coi-header">
                <div className="coi-header-content">
                    <img
                        src={logo}
                        alt="ZextrA Travel Assist"
                        className="logo-image"
                        style={{ maxHeight: "60px", width: "auto" }}
                    />
                    <div className="d-flex justify-content-center py-4">
                        <div className="logo d-flex align-items-center w-auto">
                            <span className="page-title">Travel Assistance Service</span>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "20px" }}>
                        <button onClick={gotoDashboard} className="coi-button">
                            <Home size={18} /> Dashboard
                        </button>
                        <button onClick={handleLogout} className="coi-button">
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="coi-main-content">
                <div className="coi-card shadow-sm border-0">
                    <div className="coi-card-header d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            <button
                                onClick={goBack}
                                className="btn btn-link text-primary p-0"
                            >
                                <ArrowLeftCircle size={28} />
                            </button>
                            <h2 className="coi-card-title mb-0">
                                ERP Upload - Welcome Letter Bajaj Proposal
                            </h2>
                        </div>
                    </div>

                    <div className="card-body p-4 bg-light">
                        <form
                            onSubmit={handleSearch}
                            className="d-flex flex-wrap align-items-end gap-3 mb-2"
                        >
                            <div style={{ minWidth: "200px" }}>
                                <label className="form-label fw-bold text-secondary mb-1">
                                    From Date
                                </label>
                                <input
                                    type="date"
                                    className={`form-control ${dateError ? "is-invalid" : ""}`}
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setDateError("");
                                    }}
                                />
                            </div>
                            <div style={{ minWidth: "200px" }}>
                                <label className="form-label fw-bold text-secondary mb-1">
                                    To Date
                                </label>
                                <input
                                    type="date"
                                    className={`form-control ${dateError ? "is-invalid" : ""}`}
                                    value={endDate}
                                    min={startDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setDateError("");
                                    }}
                                />
                            </div>

                            {/* Customer Name Search Input */}
                            <div
                                style={{
                                    minWidth: "260px",
                                    flex: "1 1 260px",
                                    maxWidth: "340px",
                                }}
                            >
                                <label className="form-label fw-bold text-secondary mb-1">
                                    Customer Name
                                </label>
                                <div className="position-relative">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search by customer name or policy..."
                                        value={customerNameSearch}
                                        onChange={(e) => {
                                            setCustomerNameSearch(e.target.value);
                                            setCurrentPage(1); // Reset to first page when filtering
                                        }}
                                        style={{ paddingLeft: "36px" }}
                                    />
                                    <UserSearch
                                        size={18}
                                        className="text-secondary position-absolute"
                                        style={{
                                            left: "10px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            pointerEvents: "none",
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="btn btn-primary fw-bold shadow-sm"
                                    disabled={loading}
                                    style={{
                                        height: "42px",
                                        padding: "0 24px",
                                        backgroundColor: "#5a52ff",
                                        borderColor: "#5a52ff",
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw
                                                size={18}
                                                className="me-2 animate-spin d-inline"
                                            />{" "}
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <Search size={18} className="me-2 d-inline" /> Search
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {dateError && (
                            <div
                                className="text-danger fw-semibold mt-2 d-flex align-items-center"
                                style={{ fontSize: "14px" }}
                            >
                                <AlertTriangle size={16} className="me-2" />
                                {dateError}
                            </div>
                        )}
                    </div>

                    {results.length > 0 && (
                        <div>
                            {/* Summary Bar */}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <span
                                    className="text-muted fw-semibold"
                                    style={{ fontSize: "14px" }}
                                >
                                    Showing {totalRecords === 0 ? 0 : startIndex + 1} to{" "}
                                    {Math.min(startIndex + ITEMS_PER_PAGE, totalRecords)} of{" "}
                                    {totalRecords} records
                                </span>
                            </div>

                            <div className="table-responsive">
                                <table className="data-table table table-hover table-bordered align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="text-center">Customer Name</th>
                                            <th className="text-center">Policy Number</th>
                                            <th className="text-center">AS Number</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th className="text-center">Duration (Days)</th>
                                            <th>Premium</th>
                                            <th className="text-center">CS Data Push</th>
                                            <th className="text-center">Upload BAJAJ Pdf</th>
                                            <th className="text-center">ERP Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedRecords.length > 0 ? (
                                            paginatedRecords.map(({ item: res, originalIndex }) => (
                                                <tr key={res.Policy_Number || originalIndex}>
                                                    <td
                                                        style={{ minWidth: "190px" }}
                                                        className="fw-semibold text-primary"
                                                    >
                                                        {res.fullname}
                                                    </td>
                                                    <td style={{ minWidth: "190px" }}>
                                                        {res.Policy_Number}
                                                    </td>
                                                    <td>{res.Asnumber_bajaj || "—"}</td>
                                                    <td style={{ minWidth: "105px" }}>
                                                        {formatDate(res.PolicyStartDate)}
                                                    </td>
                                                    <td style={{ minWidth: "105px" }}>
                                                        {formatDate(res.PolicyEndDate)}
                                                    </td>
                                                    <td className="text-center fw-bold text-dark">
                                                        {res.travelDuration || "—"}
                                                    </td>
                                                    <td className="fw-bold text-success">
                                                        ₹{res.PremiumAmount}
                                                    </td>

                                                    {/* Updated Styled CS Data Push Button */}
                                                    <td
                                                        className="text-center"
                                                        style={{
                                                            minWidth: "145px",
                                                            verticalAlign: "middle",
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleCsDataPush(originalIndex, res)
                                                            }
                                                            disabled={
                                                                res.csPushStatus === "Pushing..." ||
                                                                res.csPushStatus === "Pushed"
                                                            }
                                                            className={`btn btn-sm fw-semibold d-inline-flex align-items-center justify-content-center gap-1 shadow-sm ${res.csPushStatus === "Pushed"
                                                                    ? "btn-success"
                                                                    : res.csPushStatus === "Failed"
                                                                        ? "btn-danger"
                                                                        : "btn-primary"
                                                                }`}
                                                            style={{
                                                                padding: "6px 12px",
                                                                fontSize: "12px",
                                                                borderRadius: "6px",
                                                                minWidth: "120px",
                                                                backgroundColor:
                                                                    res.csPushStatus === "Pushed"
                                                                        ? "#198754"
                                                                        : res.csPushStatus === "Failed"
                                                                            ? "#dc3545"
                                                                            : "#4f46e5",
                                                                borderColor: "transparent",
                                                                color: "#fff",
                                                                transition: "all 0.2s ease",
                                                            }}
                                                        >
                                                            {res.csPushStatus === "Pushing..." ? (
                                                                <>
                                                                    <RefreshCw
                                                                        size={14}
                                                                        className="animate-spin"
                                                                    />{" "}
                                                                    Pushing...
                                                                </>
                                                            ) : res.csPushStatus === "Pushed" ? (
                                                                <>
                                                                    <CheckCircle2 size={14} /> CS Pushed
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Send size={13} /> CS Data Push
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>

                                                    <td style={{ verticalAlign: "middle" }}>
                                                        <input
                                                            type="file"
                                                            accept="application/pdf"
                                                            onChange={(e) =>
                                                                handlePdfUpload(
                                                                    e,
                                                                    originalIndex,
                                                                    res.Policy_Number,
                                                                )
                                                            }
                                                            disabled={res.erpStatus === "Uploading..."}
                                                            className="form-control"
                                                            style={{
                                                                padding: "4px",
                                                                fontSize: "12px",
                                                                minWidth: "200px",
                                                            }}
                                                        />
                                                    </td>
                                                    <td
                                                        style={{
                                                            verticalAlign: "middle",
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        <span
                                                            className={`badge ${res.erpStatus?.toLowerCase() === "success"
                                                                    ? "badge-success"
                                                                    : res.erpStatus === "Uploading..."
                                                                        ? "badge-info"
                                                                        : "badge-danger"
                                                                }`}
                                                            style={{
                                                                padding: "6px 10px",
                                                                borderRadius: "4px",
                                                                display: "inline-block",
                                                                minWidth: "80px",
                                                                fontSize: '15px',
                                                                color:
                                                                    res.erpStatus?.toLowerCase() === "success"
                                                                        ? "#28a745"
                                                                        : "#dc3545",
                                                                fontWeight: "600",
                                                            }}
                                                        >
                                                            {res.erpStatus}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={10}
                                                    className="text-center py-4 text-muted fw-semibold"
                                                >
                                                    No matching customer records found for "
                                                    {customerNameSearch}".
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls (15 per page) */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                                    <div className="text-muted" style={{ fontSize: "13px" }}>
                                        Page <strong>{currentPage}</strong> of{" "}
                                        <strong>{totalPages}</strong>
                                    </div>
                                    <div className="d-flex align-items-center gap-1">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft size={16} /> Prev
                                        </button>

                                        {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                                            .filter(
                                                (page) =>
                                                    page === 1 ||
                                                    page === totalPages ||
                                                    Math.abs(page - currentPage) <= 2,
                                            )
                                            .map((page, idx, arr) => (
                                                <React.Fragment key={page}>
                                                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                                                        <span className="px-2 text-muted">...</span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePageChange(page)}
                                                        className={`btn btn-sm ${currentPage === page
                                                                ? "btn-primary fw-bold"
                                                                : "btn-outline-secondary"
                                                            }`}
                                                        style={
                                                            currentPage === page
                                                                ? {
                                                                    backgroundColor: "#4f46e5",
                                                                    borderColor: "#4f46e5",
                                                                    color: "#fff",
                                                                }
                                                                : {}
                                                        }
                                                    >
                                                        {page}
                                                    </button>
                                                </React.Fragment>
                                            ))}

                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <footer className="coi-footer">
                <p>
                    © {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All
                    rights reserved
                </p>
            </footer>
        </div>
    );
};

export default Excel_LetterBajajSearch;
