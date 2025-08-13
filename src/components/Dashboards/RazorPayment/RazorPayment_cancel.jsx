import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getPolicyDetailsbyPolicyno, getPaymentStatus } from '../../../services/api';

import logo from '../../../../src/assets/img/TravelAssist.webp';
import unsuccessfulImg from '../../../assets/img/unsucessful.jpg';
import './RazorPayment.css';

const RazorPayment_cancel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [customerId, setCustomerId] = useState('');
  const [reason, setReason] = useState('Payment Cancelled');
  const [loading, setLoading] = useState(true);
  const [policyDetails, setPolicyDetails] = useState(null);
  const [failureDetails, setFailureDetails] = useState(null);
  const [error, setError] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Extract the customer ID and optional reason from URL parameters
        const queryParams = new URLSearchParams(location.search);
        const cid = queryParams.get('cid') || '';
        const urlPaymentId = queryParams.get('paymentId') || '';
        let failReason = queryParams.get('reason') || 'Payment Cancelled';
        
        // Set payment ID if available
        if (urlPaymentId) {
          setPaymentId(urlPaymentId);
        }
        
        // Special handling for API errors but payment might still be successful
        const isApiError = failReason === 'API_error';
        if (isApiError && urlPaymentId) {
          failReason = "Your payment might have succeeded, but we couldn't verify it. Please check your bank statement and contact customer support with Payment ID: " + urlPaymentId;
        }
        
        setCustomerId(cid);
        setReason(failReason);
        
        // Get failure details from session storage if available
        const storedFailureData = sessionStorage.getItem('paymentFailureData');
        if (storedFailureData) {
          const parsedFailureData = JSON.parse(storedFailureData);
          setFailureDetails(parsedFailureData);
          
          // Set payment ID from failure data if not already set
          if (!urlPaymentId && parsedFailureData.paymentId) {
            setPaymentId(parsedFailureData.paymentId);
          }
        }
        
        // Get cancellation details if user cancelled
        const cancelData = sessionStorage.getItem('paymentCancelData');
        if (cancelData && !storedFailureData) {
          const parsedCancelData = JSON.parse(cancelData);
          setFailureDetails(parsedCancelData);
        }
        
        if (!cid) {
          setLoading(false);
          return;
        }
        
        // Try to get policy details from session storage first
        const storedPolicyDetails = sessionStorage.getItem('policyDetails');
        
        if (storedPolicyDetails) {
          setPolicyDetails(JSON.parse(storedPolicyDetails));
          setLoading(false);
          return;
        }
        
        // If not in session storage, fetch from API
        try {
          const apiResponse = await getPolicyDetailsbyPolicyno(cid);
          
          if (apiResponse?.Status === "Success" && 
            apiResponse?.MasterData?.proposals && 
            apiResponse.MasterData.proposals.length > 0) {

            const policyData = apiResponse.MasterData.proposals[0];
            setPolicyDetails(policyData);
            
            // Store in session storage for future use
            sessionStorage.setItem('policyDetails', JSON.stringify(policyData));
          }
        } catch (policyError) {
          console.error('Error fetching policy details:', policyError);
          // Continue without policy details
        }
        
        // If there's a payment ID, try to get payment status
        if (paymentId || urlPaymentId) {
          try {
            const paymentResponse = await getPaymentStatus(cid);
            // If we got a successful response, it means payment might have gone through despite the error
            if (paymentResponse?.Status === "success" && 
                paymentResponse?.MasterData && 
                paymentResponse.MasterData.length > 0) {
              
              // Override previous reason with more accurate information
              failReason = "Your payment might have been successful in our records. Please check the payment status on your dashboard.";
              setReason(failReason);
            }
          } catch (paymentError) {
            console.error('Error checking payment status:', paymentError);
            // Continue without payment status
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error in component initialization:', error);
        setError('An error occurred while loading the page. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [location]);
  
  const handleContactUs = () => {
    // Redirect to contact page
    window.location.href = 'http://interstellar.co.in/Contact_Us.html';
  };
  
  const handleRetry = () => {
    // Go back to the payment page to retry
    navigate('/RazorPaymentPage');
  };
  
  const handleBackToDashboard = () => {
    // Go back to dashboard
    navigate('/dashboard');
  };

  const handleCheckStatus = () => {
    // Navigate to a status check page or open support ticket
    if (paymentId) {
      // Option 1: Open a support ticket with the payment ID
      // window.location.href = `http://bo.magicfinmart.com/support?payment_id=${paymentId}`;
      
      // Option 2: Show alert with the payment ID for users to take note
      alert(`Please contact support with this Payment ID: ${paymentId}`);
    } else {
      alert('No payment ID available. Please contact support for assistance.');
    }
  };

  if (loading) {
    return <div className="loading_pay">Loading...</div>;
  }

  if (error) {
    return (
      <div className="error-container_pay">
        <div className="error-message_pay">
          {error}
        </div>
        <button 
          className="dashboard-button_pay"
          onClick={handleBackToDashboard}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Format full name from policy details
  const fullName = policyDetails ? 
    `${policyDetails.FirstName || ''} ${policyDetails.MiddleName || ''} ${policyDetails.LastName || ''}`.trim() : 
    'Customer';

  // Check if it might be a successful payment with verification failure
  const isPossiblySuccessful = reason.includes("might have succeeded") || 
                              (failureDetails && failureDetails.apiError?.includes("might have succeeded"));

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
            Transaction Acknowledgement
          </div>
          
          <div className="white-container_pay">
            <div className={isPossiblySuccessful ? "warning-header_pay" : "failed-header_pay"}>
              <img src={unsuccessfulImg} alt="Unsuccessful" /><br />
              {isPossiblySuccessful 
                ? "Your payment status is unclear" 
                : "Your payment transaction was not successful"}
            </div>
            
            <div className="detail-row_pay">
              <div className="detail-label_pay">
                Payment Status :
              </div>
              <div className="detail-value_pay">
                <span className="status-span_pay">{isPossiblySuccessful ? "Pending Verification" : "Failed"}</span>
              </div>
            </div>
            
            <div className="detail-row_pay">
              <div className="detail-label_pay">
                Reason :
              </div>
              <div className="detail-value_pay">
                <span className="status-span_pay">{reason}</span>
              </div>
            </div>
            
            {paymentId && (
              <div className="detail-row_pay">
                <div className="detail-label_pay">
                  Payment ID :
                </div>
                <div className="detail-value_pay">
                  <span className="customer-id-span_pay">{paymentId}</span>
                </div>
              </div>
            )}
            
            {customerId && (
              <div className="detail-row_pay">
                <div className="detail-label_pay">
                  Certificate Number :
                </div>
                <div className="detail-value_pay">
                  <span className="customer-id-span_pay">{customerId}</span>
                </div>
              </div>
            )}
            
            {policyDetails && (
              <>
                <div className="detail-row_pay">
                  <div className="detail-label_pay">
                    Customer Name :
                  </div>
                  <div className="detail-value_pay">
                    <span className="customer-id-span_pay">{fullName}</span>
                  </div>
                </div>
                
                {policyDetails.PremiumAmount && (
                  <div className="detail-row_pay">
                    <div className="detail-label_pay">
                      Premium Amount :
                    </div>
                    <div className="detail-value_pay">
                      <span className="customer-id-span_pay">₹{policyDetails.PremiumAmount}</span>
                    </div>
                  </div>
                )}
                
                {policyDetails.Payment_Mode && (
                  <div className="detail-row_pay">
                    <div className="detail-label_pay">
                      Payment Mode :
                    </div>
                    <div className="detail-value_pay">
                      <span className="customer-id-span_pay">{policyDetails.Payment_Mode}</span>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {/* Additional error details if available */}
            {failureDetails && failureDetails.errorCode && (
              <div className="detail-row_pay">
                <div className="detail-label_pay">
                  Error Code :
                </div>
                <div className="detail-value_pay">
                  <span className="customer-id-span_pay">{failureDetails.errorCode}</span>
                </div>
              </div>
            )}
            
            <div className="cancel-buttons_pay">
              {isPossiblySuccessful ? (
                <>
                  <button className="check-status-button_pay" onClick={handleCheckStatus}>
                    Check Payment Status
                  </button>
                  <button className="dashboard-button_pay" onClick={handleBackToDashboard}>
                    Back to Dashboard
                  </button>
                </>
              ) : (
                <>
                  <button className="retry-button_pay" onClick={handleRetry}>
                    Retry Payment
                  </button>
                  <button className="dashboard-button_pay" onClick={handleBackToDashboard}>
                    Back to Dashboard
                  </button>
                </>
              )}
            </div>
            
            <div className="footer-note_pay">
              {isPossiblySuccessful ? (
                <>
                  Your payment may have been processed, but we couldn't confirm it. Please check your bank statement 
                  and contact our support team with your payment ID if the amount was debited.
                </>
              ) : (
                <>
                  If you encounter any problem with the service, please refer to{' '}
                  <span className="contact-link_pay">
                    <a onClick={handleContactUs}>Contact Us</a>
                  </span> for our contact number, or email{' '}
                  <span className="email-link_pay">
                    customercare@interstellar.co.in 
                  </span>
                </>
              )}
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

export default RazorPayment_cancel;