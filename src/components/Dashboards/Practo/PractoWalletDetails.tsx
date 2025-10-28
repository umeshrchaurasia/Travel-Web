import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeftCircle, CheckCircle } from 'lucide-react';
import { PDF_BASE_URL } from '../../../services/api';

// Re-use the same CSS for a consistent look and feel
import '../../Dashboards/PlanSelection/PlanSelection.css'; 

// --- Component ---
const PractoWalletDetails: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Data passed from the previous page (Practo.tsx)
    const { paymentData, agentData, pdfUrl } = location.state || {};

    const handleGoToPlanSelection = () => {
        // Navigate back to the main dashboard
        navigate('/dashboard'); 
    };

    const handleDownloadInvoice = () => {
        // Placeholder for future invoice generation logic
        if (pdfUrl) {
            const fullUrl = `${PDF_BASE_URL}${pdfUrl}`;
            window.open(fullUrl, '_blank'); // Open the PDF in a new tab
        } else {
            alert('Invoice PDF is not available at the moment.');
        }
    };

    // If data is missing (e.g., user refreshed the page), show an error.
    if (!paymentData || !agentData) {
        return (
            <div className="practo-page-container">
                <div className="practo-card">
                    <h1 className="practo-header-error">Error</h1>
                    <p className="practo-text">Transaction data not found. Please return to the dashboard.</p>
                    <button onClick={handleGoToPlanSelection} className="practo-back-button">
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Calculate the new wallet balance for display
   // const initialWallet = parseFloat(agentData.Wallet_Amount || '0') + parseFloat(paymentData.Selected_PremiumAmount || '0');
    const newWalletBalance = parseFloat(agentData.Wallet_Amount || '0');

    return (
        <div className="practo-page-container">
            <div className="practo-card" style={{ maxWidth: '700px' }}>
                <CheckCircle size={48} className="text-success mx-auto mb-3" color="#28a745" />
                <h1 className="practo-header">Wallet Payment Successful!</h1>
                <p className="practo-text">Your payment for the Practo subscription has been processed successfully.</p>

                {/* --- Transaction Details Card --- */}
                <div className="transaction-details-card">
                    <div className="detail-item">
                        <span>Practo Proposal ID:</span>
                        <strong>#{paymentData.Practo_proposal_id}</strong>
                    </div>
                    <hr />
                    <div className="detail-item">
                        <span>Amount Paid:</span>
                        <strong className="text-danger" style={{ color: '#dc3545', fontSize: '1.2rem' }}>
                            ₹{parseFloat(paymentData.Selected_PremiumAmount).toFixed(2)}
                        </strong>
                    </div>
                     <div className="detail-item">
                        <span>Payment Mode:</span>
                        <strong>{paymentData.Selected_Payment_Mode}</strong>
                    </div>
                    <hr />
                    
                    <div className="detail-item wallet-summary">
                        <span>Updated Wallet Balance:</span>
                        <strong className="text-success" style={{ color: '#28a745', fontSize: '1.2rem' }}>
                            ₹{newWalletBalance.toFixed(2)}
                        </strong>
                    </div>
                </div>

                {/* --- Action Buttons --- */}
                <div className="action-buttons-container">
                    <button onClick={handleGoToPlanSelection} className="action-button secondary">
                        <ArrowLeftCircle size={18} />
                        Go to Plan Selection
                    </button>
                        <button 
                        onClick={handleDownloadInvoice} 
                        className="action-button primary"
                        disabled={!pdfUrl}
                    >
                        <FileText size={18} />
                        Download Invoice
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PractoWalletDetails;