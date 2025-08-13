import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import logo from '../../../../src/assets/img/TravelAssist.webp';
import './PolicyDownload.css';

const PolicyDownload = ({ userData, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [policyNo, setPolicyNo] = useState(null);

  useEffect(() => {
    // Get certificate number from URL parameters
    const queryParams = new URLSearchParams(location.search);
    const certificateNo = queryParams.get('certificateNo');

    if (certificateNo) {
      setPolicyNo(certificateNo);
      generatePolicyPDF(certificateNo);
    } else {
      setError('Certificate number is missing. Please go back and try again.');
      setLoading(false);
    }
  }, [location]);

  const generatePolicyPDF = async (certificateNo) => {
    setLoading(true);
    
    try {
      // Call the API to generate the PDF
      const response = await axios.post('/api/generatePolicybyPolicyno', {
        Policyno: certificateNo
      });
      
      if (response.data.Status === 'Success' && response.data.MasterData && response.data.MasterData.pdfUrl) {
        setPdfUrl(response.data.MasterData.pdfUrl);
        
        // Optional: Automatically open the PDF in a new tab
        window.open(response.data.MasterData.pdfUrl, '_blank');
        
        setLoading(false);
      } else {
        throw new Error(response.data.Message || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate policy PDF. Please try again.');
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return <div className="loading_pay">Generating policy document...</div>;
  }

  return (
    <div className="main-container_pay">
      <div className="container-wrapper_pay">
        <div className="logo-navigation-container_pay">
          <div className="logo-container_pay">
            <a href="#" onClick={handleBackToDashboard}>
         <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '50px', width: 'auto' }} />
            </a>
          </div>
        </div>
        
        <div className="content-container_pay">
          <div className="header-title_pay">
            Policy Document
          </div>
          
          <div className="white-container_pay">
            {error ? (
              <div className="error-message_pay">
                {error}
              </div>
            ) : (
              <div className="success-header_pay">
                <p>Your policy document has been generated successfully.</p>
                {policyNo && <p>Policy Number: {policyNo}</p>}
                <p>If the document didn't open automatically, you can download it using the button below.</p>
              </div>
            )}
            
            <div className="policy-actions_pay">
              {!error && pdfUrl && (
                <button 
                  className="payment-button_pay" 
                  onClick={handleDownloadPDF}
                >
                  Download Policy PDF
                </button>
              )}
              <button 
                className="dashboard-button_pay" 
                onClick={handleBackToDashboard}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="footer-container_pay">
        <div className="footer-inner_pay">
          <span className="footer-text_pay">
            <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
          </span>
        </div>
      </div>
    </div>
  );
};

export default PolicyDownload;