import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function SecondPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Get the data passed from the first page
    const { policyData } = location.state || {};

    // Handle case when data is not available
    if (!policyData) {
        return (
            <div className="container">
                <h1>Error</h1>
                <p>No policy data available</p>
                <button onClick={() => navigate('/')} className="back-btn">Go Back</button>
            </div>
        );
    }

    // Function to handle download
    const handleDownload = () => {
        window.open(policyData.downloadFilePath, '_blank');
    };

    return (
        <div className="container">
            <h1>Complete Policy Details</h1>
            <div className="policy-details">
                <h2>Personal Information</h2>
                <p><strong>Full Name:</strong> {policyData.fullName}</p>
                <p><strong>Pax ID:</strong> {policyData.paxId}</p>

                <h2>Policy Information</h2>
                <p><strong>PSO Number:</strong> {policyData.psoNumber}</p>
                <p><strong>Certificate Number:</strong> {policyData.certificateNumber}</p>
                <p><strong>Agent ID:</strong> {policyData.AgentId}</p>
                <p><strong>Agent Code/BAS Code:</strong> {policyData.AgentCode_BASCode}</p>

                <h2>Financial Information</h2>
                <p><strong>Premium Amount:</strong> ₹{policyData.premiumAmount}</p>
                <p><strong>Selected Option:</strong> {policyData.selectedOption}</p>
                <p><strong>Radio Button Selected Option:</strong> {policyData.radiobtn_selectedOption}</p>
                <p><strong>Selected Amount:</strong> ₹{policyData.radiobtn_selectedAmount}</p>
            </div>

            <div className="action-buttons">
                <button onClick={handleDownload} className="download-btn">
                    Download Policy
                </button>
                <button onClick={() => navigate('/FirstPage')} className="back-btn">
                    Go Back
                </button>
            </div>
        </div>
    );
}


export default SecondPage;