// AyushWalletDetails.tsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeftCircle, CheckCircle } from 'lucide-react';
import { PDF_BASE_URL } from '../../../services/api';

// You can reuse the PlanSelection CSS or create a specific one
// For now, assuming you reuse common styles or have them inline
import '../../Dashboards/PlanSelection/PlanSelection.css'; 

const AyushWalletDetails: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Data passed from the previous page (Ayushpay.tsx)
    const { paymentData, agentData, pdfUrl } = location.state || {};

    const handleGoToPlanSelection = () => {
        // Navigate back to the main dashboard
        navigate('/dashboard'); 
    };

    const handleDownloadInvoice = () => {
        if (pdfUrl) {
            const fullUrl = `${PDF_BASE_URL}${pdfUrl}`;
            window.open(fullUrl, '_blank'); 
        } else {
            alert('Invoice PDF is not available at the moment.');
        }
    };

    // If data is missing
    if (!paymentData || !agentData) {
        return (
            <div className="practo-page-container" style={{padding: '2rem', textAlign: 'center'}}>
                <div className="practo-card">
                    <h2>Error loading details</h2>
                    <p>No payment information found. Please try again.</p>
                    <button onClick={handleGoToPlanSelection} className="action-button secondary">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Logic for new wallet balance
    // If Wallet_Amount was a string in agentData, parse it.
    const currentWallet = parseFloat(agentData.Wallet_Amount || '0');
    const deductedAmount = parseFloat(paymentData.Selected_PremiumAmount || '0');
    // Note: If the backend already updated the wallet, you might display that. 
    // Otherwise, this is a projected balance.
    const newWalletBalance = currentWallet - deductedAmount;

    return (
        <div className="practo-page-container" style={{minHeight: '100vh', background:'#f3f4f6', padding:'2rem'}}>
            <div className="practo-card" style={{maxWidth: '600px', margin: '0 auto', background:'white', padding:'2rem', borderRadius:'8px', boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}}>
                
                {/* --- Header --- */}
                <div className="header-section" style={{textAlign:'center', marginBottom:'2rem'}}>
                    <div style={{display:'inline-block', background:'#dcfce7', borderRadius:'50%', padding:'1rem', marginBottom:'1rem'}}>
                        <CheckCircle size={48} color="#166534" />
                    </div>
                    <h2 style={{color:'#166534', margin:0}}>Transaction Successful</h2>
                    <p className="subtitle" style={{color:'#6b7280'}}>Ayush Pay Proposal Created</p>
                </div>

                {/* --- Details --- */}
                <div className="details-grid" style={{display:'flex', flexDirection:'column', gap:'1rem', borderTop:'1px solid #e5e7eb', paddingTop:'1.5rem'}}>
                    
                    <div className="detail-item" style={{display:'flex', justifyContent:'space-between'}}>
                        <span style={{color:'#6b7280'}}>Proposal ID:</span>
                        <strong>{paymentData.Ayush_id || 'N/A'}</strong>
                    </div>

                    <div className="detail-item" style={{display:'flex', justifyContent:'space-between'}}>
                        <span style={{color:'#6b7280'}}>Agent Name:</span>
                        <strong>{agentData.FullName}</strong>
                    </div>

                    <div className="detail-item" style={{display:'flex', justifyContent:'space-between'}}>
                        <span style={{color:'#6b7280'}}>Amount Deducted:</span>
                        <strong className="text-danger" style={{color:'#dc2626'}}>
                            - ₹{deductedAmount.toFixed(2)}
                        </strong>
                    </div>

                     <div className="detail-item" style={{display:'flex', justifyContent:'space-between'}}>
                        <span style={{color:'#6b7280'}}>Payment Mode:</span>
                        <strong>{paymentData.Selected_Payment_Mode}</strong>
                    </div>
                    
                    <div className="detail-item wallet-summary" style={{display:'flex', justifyContent:'space-between', borderTop:'1px dashed #e5e7eb', paddingTop:'1rem', marginTop:'0.5rem'}}>
                        <span style={{fontWeight:600}}>Projected Wallet Balance:</span>
                        <strong className="text-success" style={{ color: '#0d9488', fontSize: '1.2rem' }}>
                            ₹{newWalletBalance.toFixed(2)}
                        </strong>
                    </div>
                </div>

                {/* --- Action Buttons --- */}
                <div className="action-buttons-container" style={{marginTop:'2rem', display:'flex', gap:'1rem', justifyContent:'center'}}>
                    <button 
                        onClick={handleGoToPlanSelection} 
                        className="action-button secondary"
                        style={{padding:'0.5rem 1rem', border:'1px solid #d1d5db', borderRadius:'4px', background:'white', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}
                    >
                        <ArrowLeftCircle size={18} />
                        Dashboard
                    </button>
                    
                    <button 
                        onClick={handleDownloadInvoice} 
                        className="action-button primary"
                        disabled={!pdfUrl}
                        style={{padding:'0.5rem 1rem', border:'none', borderRadius:'4px', background: pdfUrl ? '#0d9488' : '#9ca3af', color:'white', cursor: pdfUrl ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', gap:'5px'}}
                    >
                        <FileText size={18} />
                        Download Invoice
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AyushWalletDetails;