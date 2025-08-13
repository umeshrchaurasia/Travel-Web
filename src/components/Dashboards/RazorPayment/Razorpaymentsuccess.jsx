import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getPolicyDetailsbyPolicyno, getPaymentStatus } from '../../../services/api';
import logo from '../../../../src/assets/img/TravelAssist.webp';
import successImg from '../../../assets/img/sucessful.jpg';
import './RazorPayment.css';

const Razorpaymentsuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [policyDetails, setPolicyDetails] = useState(null);
  const [error, setError] = useState(null);
  const [razorpayResponse, setRazorpayResponse] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Extract the customer ID from URL parameters
        const queryParams = new URLSearchParams(location.search);
        const cid = queryParams.get('cid');
        const paymentId = queryParams.get('paymentId');
        
        if (!cid) {
          setError("No certificate ID provided. Cannot display payment details.");
          setLoading(false);
          return;
        }
        
        setCustomerId(cid);
        
        // Try to get payment success data from session storage
        const storedPaymentSuccess = sessionStorage.getItem('paymentSuccessData');
        if (storedPaymentSuccess) {
          const parsedPaymentData = JSON.parse(storedPaymentSuccess);
          setPaymentDetails(parsedPaymentData);
          
          // If we have the full Razorpay response stored
          if (parsedPaymentData.razorpayFullResponse) {
            setRazorpayResponse(parsedPaymentData.razorpayFullResponse);
          }
        } else {
          // If payment details are not in session storage, try to fetch from API
          try {
            const paymentResponse = await getPaymentStatus(cid);
            if (paymentResponse?.Status === "Success" && 
                paymentResponse?.MasterData && 
                paymentResponse.MasterData.length > 0) {
              
              const apiPaymentData = paymentResponse.MasterData[0];
              // Format payment data from API response
              setPaymentDetails({
                paymentId: apiPaymentData.PayId || paymentId || 'N/A',
                policyNo: apiPaymentData.Policy_No || cid,
                customerName: apiPaymentData.customerName || '',
                amount: apiPaymentData.amt || apiPaymentData.actual_amt || 'N/A',
                bankRRN: apiPaymentData.RRN || '',
                paymentDate: apiPaymentData.payment_date || new Date().toISOString(),
                paymentStatus: apiPaymentData.payment_status || 'Success',
                paymentMode: apiPaymentData.payment_mode || 'Online'
              });
            }
          } catch (paymentError) {
            console.error('Error fetching payment details:', paymentError);
            // Continue without payment details from API
          }
        }
        
        // Check if we have raw razorpay response stored
        const storedRazorpayResponse = sessionStorage.getItem('razorpayResponse');
        if (storedRazorpayResponse && !razorpayResponse) {
          setRazorpayResponse(JSON.parse(storedRazorpayResponse));
        }
        
        // Fetch policy details if not already in session storage
        let policyData = null;
        const storedPolicyDetails = sessionStorage.getItem('policyDetails');
        
        if (storedPolicyDetails) {
          policyData = JSON.parse(storedPolicyDetails);
          setPolicyDetails(policyData);
        } else {
          // Fetch policy details using API
          try {
            const apiResponse = await getPolicyDetailsbyPolicyno(cid);
            
            if (apiResponse?.Status === "Success" && 
              apiResponse?.MasterData?.proposals && 
              apiResponse.MasterData.proposals.length > 0) {
                policyData = apiResponse.MasterData.proposals[0];
                setPolicyDetails(policyData);
                
              // Store in session storage for future use
              sessionStorage.setItem('policyDetails', JSON.stringify(policyData));
            }
          } catch (policyError) {
            console.error('Error fetching policy details:', policyError);
            // Continue without policy details
          }
        }
        
        // If we don't have payment details from session storage or API, create minimal details
        if (!paymentDetails) {
          setPaymentDetails({
            paymentId: paymentId || 'N/A',
            policyNo: cid,
            amount: policyData?.PremiumAmount || 'N/A',
            paymentDate: new Date().toISOString(),
            paymentMode: policyData?.Payment_Mode || 'Online'
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load payment confirmation. Please contact support.');
        setLoading(false);
      }
    };

    fetchData();
  }, [location]);
  
  const handleContactUs = () => {
    // Redirect to contact page
    window.location.href = 'http://bo.magicfinmart.com/';
  };
  
  const handleBackToDashboard = () => {
    // Redirect to dashboard
    navigate('/dashboard');
  };
  
  const handlePolicyDownload = () => {
    // Navigate to policy download page with certificate number
    navigate(`/PolicyDownload?certificateNo=${customerId}`);
  };

  if (loading) {
    return <div className="loading_pay">Loading payment confirmation...</div>;
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

  // Format full name from policy details or payment details
  const fullName = policyDetails ? 
    `${policyDetails.FirstName || ''} ${policyDetails.MiddleName || ''} ${policyDetails.LastName || ''}`.trim() : 
    (paymentDetails.customerName || 'Customer');

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
            <div className="success-header_pay">
              <img src={successImg} alt="Success" /><br />
              Your payment transaction was successful
            </div>
            
            <div className="success-text-info_pay">
              <div className="detail-row_pay">
                <div className="detail-label_pay">
                  Customer Name:
                </div>
                <div className="detail-value_pay">
                  <span className="status-span_pay">{fullName}</span>
                </div>
              </div>
              
              <div className="detail-row_pay">
                <div className="detail-label_pay">
                  Certificate Number:
                </div>
                <div className="detail-value_pay">
                  <span className="status-span_pay">{customerId}</span>
                </div>
              </div>
              
              {paymentDetails && (
                <>
                  {paymentDetails.paymentId && paymentDetails.paymentId !== 'N/A' && (
                    <div className="detail-row_pay">
                      <div className="detail-label_pay">
                        Payment ID:
                      </div>
                      <div className="detail-value_pay">
                        <span className="status-span_pay">{paymentDetails.paymentId}</span>
                      </div>
                    </div>
                  )}
                  
                  {paymentDetails.bankRRN && (
                    <div className="detail-row_pay">
                      <div className="detail-label_pay">
                        Bank RRN:
                      </div>
                      <div className="detail-value_pay">
                        <span className="status-span_pay">{paymentDetails.bankRRN}</span>
                      </div>
                    </div>
                  )}
                  
                  {paymentDetails.amount && (
                    <div className="detail-row_pay">
                      <div className="detail-label_pay">
                        Amount Paid:
                      </div>
                      <div className="detail-value_pay">
                        <span className="status-span_pay">₹{paymentDetails.amount}</span>
                      </div>
                    </div>
                  )}
                  
                  {paymentDetails.paymentMode && (
                    <div className="detail-row_pay">
                      <div className="detail-label_pay">
                        Payment Mode:
                      </div>
                      <div className="detail-value_pay">
                        <span className="status-span_pay">{paymentDetails.paymentMode}</span>
                      </div>
                    </div>
                  )}
                  
                  {paymentDetails.paymentDate && (
                    <div className="detail-row_pay">
                      <div className="detail-label_pay">
                        Payment Date:
                      </div>
                      <div className="detail-value_pay">
                        <span className="status-span_pay">
                          {new Date(paymentDetails.paymentDate).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {paymentDetails.mobileNumber && (
                    <div className="detail-row_pay">
                      <div className="detail-label_pay">
                        Mobile Number:
                      </div>
                      <div className="detail-value_pay">
                        <span className="status-span_pay">
                          {paymentDetails.mobileNumber}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {paymentDetails.email && (
                    <div className="detail-row_pay">
                      <div className="detail-label_pay">
                        Email:
                      </div>
                      <div className="detail-value_pay">
                        <span className="status-span_pay">
                          {paymentDetails.email}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {policyDetails && policyDetails.PolicyStartDate && policyDetails.PolicyEndDate && (
                <div className="detail-row_pay">
                  <div className="detail-label_pay">
                    Policy Period:
                  </div>
                  <div className="detail-value_pay">
                    <span className="status-span_pay">
                      {new Date(policyDetails.PolicyStartDate).toLocaleDateString()} - 
                      {new Date(policyDetails.PolicyEndDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
              
              {policyDetails && policyDetails.Payment_Status && (
                <div className="detail-row_pay">
                  <div className="detail-label_pay">
                    Payment Status:
                  </div>
                  <div className="detail-value_pay">
                    <span className="status-span_pay">{policyDetails.Payment_Status}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="success-buttons_pay">
              <button className="dashboard-button_pay" onClick={handlePolicyDownload}>
                Policy Download
              </button>
              <button className="dashboard-button_pay" onClick={handleBackToDashboard}>
                Back to Dashboard
              </button>
            </div>
            
            <div className="footer-note_pay">
              If you encounter any problem with the service, please refer to{' '}
              <span className="contact-link_pay">
                <a onClick={handleContactUs}>Contact Us</a>
              </span> for our contact number, or email{' '}
              <span className="email-link_pay">
              customercare@interstellar.co.in 
              </span>
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
export default Razorpaymentsuccess;