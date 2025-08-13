import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPolicyDetailsbyPolicyno, addRazorpayData } from '../../../services/api';

import logo from '../../../../src/assets/img/TravelAssist.webp';
import paymentImg from '../../../assets/img/Payment.png';
import './RazorPayment.css';

const RazorPayment_input = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [policyDetails, setPolicyDetails] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    // Load Razorpay script dynamically
    const loadRazorpay = () => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setIsRazorpayLoaded(true);
        console.log('Razorpay script loaded successfully');
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        setError('Failed to load payment gateway. Please refresh the page or try again later.');
      };
      document.body.appendChild(script);
    };

    // Load Razorpay script
    loadRazorpay();

    // Fetch policy details
    const fetchPolicyDetails = async () => {
      try {
        // First check if we already have policy details in session storage
        const storedPolicyDetails = sessionStorage.getItem('policyDetails');
        
        if (storedPolicyDetails) {
          setPolicyDetails(JSON.parse(storedPolicyDetails));
          setLoading(false);
          return;
        }
        
        // If not in session storage, check payment data
        const storedPaymentData = sessionStorage.getItem('paymentData');
        
        if (storedPaymentData) {
          const paymentData = JSON.parse(storedPaymentData);
          
          // If certificate number exists in payment data, fetch policy details
          if (paymentData.certificateNumber) {
           
            const apiResponse = await getPolicyDetailsbyPolicyno(paymentData.certificateNumber);
            
            if (apiResponse?.Status === "Success" && apiResponse?.MasterData?.proposals && 
              apiResponse.MasterData.proposals.length > 0) {

                const policyData = apiResponse.MasterData.proposals[0];
                setPolicyDetails(policyData);
              
              // Store policy details in session storage for future use
              sessionStorage.setItem('policyDetails', JSON.stringify(policyData));
              
              setLoading(false);
              return;
            }
          }
          
          
          // If we can't fetch from API but have some payment data, use that
          if (paymentData) {
            // Create a minimal policy details object from payment data
            const minimumPolicyDetails = {
              Policy_No: paymentData.certificateNumber || '',
              FirstName: paymentData.fullName?.split(' ')[0] || '',
              LastName: paymentData.fullName?.split(' ').slice(1).join(' ') || '',
              PremiumAmount: paymentData.radiobtn_selectedAmount || paymentData.PremiumAmount || '',
              Payment_Mode: paymentData.radiobtn_selectedOption || paymentData.SelectedMode || '',
              AgentId: paymentData.AgentId || '',
              EmailID: paymentData.email || '',
              MobileNumber: paymentData.mobile || ''
            };
            
            setPolicyDetails(minimumPolicyDetails);
            setLoading(false);
            return;
          }
        }
        
        // If no data was found from anywhere, redirect to payment page
        navigate('/payment');
        
      } catch (error) {
        console.error("Error fetching policy details:", error);
        setError("Failed to load policy details. Please try again.");
        setLoading(false);
      }
    };

    fetchPolicyDetails();

    // Cleanup function to remove script when component unmounts
    return () => {
      const razorpayScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (razorpayScript) {
        document.body.removeChild(razorpayScript);
      }
    };
  }, [navigate]);

  // Helper function to handle redirections to the cancel page
  const handleRedirectToCancel = (cid, reason, paymentId = null) => {
    let url = `/RazorPayment_cancel?cid=${cid}&reason=${encodeURIComponent(reason)}`;
    if (paymentId) {
      url += `&paymentId=${paymentId}`;
    }
    
    console.log("Redirecting to:", url);
    
    // First try navigate, if that doesn't work use direct window.location
    try {
      navigate(url);
      // Add a fallback in case navigate doesn't trigger a page change
      setTimeout(() => {
        if (window.location.pathname !== '/RazorPayment_cancel') {
          window.location.href = url;
        }
      }, 500);
    } catch (navError) {
      console.error("Navigation error:", navError);
      window.location.href = url;
    }
  };

  const handlePaymentSuccess = async (response) => {
    try {
      setProcessingPayment(true);
      
      if (!policyDetails || !policyDetails.AgentId || !policyDetails.Policy_No) {
        setError("Missing policy information. Cannot process payment.");
        setProcessingPayment(false);
        return;
      }
      
      console.log("Payment Success Response:", response);
      
      // Save all Razorpay response details
      const fullPaymentDetails = {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id || '', 
        razorpay_signature: response.razorpay_signature || '',
        policyDetails: {
          certificateNumber: policyDetails.Policy_No,
          customerName: `${policyDetails.FirstName || ''} ${policyDetails.MiddleName || ''} ${policyDetails.LastName || ''}`.trim(),
          mobileNumber: policyDetails.MobileNumber,
          email: policyDetails.EmailID,
          amount: policyDetails.PremiumAmount
        }
      };
      
      // Store raw payment response for debugging if needed
      sessionStorage.setItem('razorpayResponse', JSON.stringify(response));
      
      const objdata = {
        "AgentId": policyDetails.AgentId,
        "Policy_No": policyDetails.Policy_No,
        "PayId": response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id || '', 
        razorpay_signature: response.razorpay_signature || '',
        certificateNumber: policyDetails.Policy_No,
        customerName: `${policyDetails.FirstName || ''} ${policyDetails.MiddleName || ''} ${policyDetails.LastName || ''}`.trim(),
        mobileNumber: policyDetails.MobileNumber,
        email: policyDetails.EmailID,
        amount: policyDetails.PremiumAmount,
        payment_mode: response.method || policyDetails.Payment_Mode || ''
      };

      console.log("Sending to backend API:", objdata);

      // Wrap API call in a try/catch to handle any network issues
      try {
        // Use our API service instead of direct axios call
        const apiResponse = await addRazorpayData(objdata);

        console.log("API Response:", apiResponse);

        if (apiResponse && apiResponse.data && 
            (apiResponse.data.Status === "success" || apiResponse.data.Status === "Success")) {
          // Extract response details
          const responseData = apiResponse.data.MasterData && apiResponse.data.MasterData[0] ? 
                               apiResponse.data.MasterData[0] : {};
          const responseMsg = responseData.respmsg || policyDetails.Policy_No;
          
          // Store comprehensive payment success information in session storage
          const paymentSuccessData = {
            paymentId: response.razorpay_payment_id,
            orderReferenceId: response.razorpay_order_id || '',
            bankRRN: responseData.RRN || response.razorpay_signature || '',
            policyNo: policyDetails.Policy_No,
            customerName: `${policyDetails.FirstName || ''} ${policyDetails.MiddleName || ''} ${policyDetails.LastName || ''}`.trim(),
            mobileNumber: policyDetails.MobileNumber || '',
            email: policyDetails.EmailID || '',
            amount: responseData.amt || responseData.actual_amt || policyDetails.PremiumAmount,
            responseMessage: responseMsg,
            paymentDate: new Date().toISOString(),
            paymentMode: response.method || policyDetails.Payment_Mode || '',
            razorpayFullResponse: response
          };
          
          console.log("Payment Success Data:", paymentSuccessData);
          sessionStorage.setItem('paymentSuccessData', JSON.stringify(paymentSuccessData));
          
          // Navigate to success page
          let successUrl = `/Razorpaymentsuccess?cid=${responseMsg}`;
          console.log("Redirecting to success:", successUrl);
          
          try {
            navigate(successUrl);
            // Add a fallback
            setTimeout(() => {
              if (window.location.pathname !== '/Razorpaymentsuccess') {
                window.location.href = successUrl;
              }
            }, 500);
          } catch (navError) {
            console.error("Navigation error:", navError);
            window.location.href = successUrl;
          }
        } else {
          console.error("Payment recording API failure:", apiResponse);
          const errorMsg = apiResponse && apiResponse.data ? 
                          apiResponse.data.Message || "Payment verification failed" : 
                          "Payment verification failed";
          
          // Store failure data
          const failureData = {
            error: errorMsg,
            paymentId: response.razorpay_payment_id,
            certificateNumber: policyDetails.Policy_No
          };
          sessionStorage.setItem('paymentFailureData', JSON.stringify(failureData));
          
          // Use the redirect helper
          handleRedirectToCancel(policyDetails.Policy_No, errorMsg, response.razorpay_payment_id);
        }
      } catch (apiError) {
        console.error("API call error:", apiError);
        
        // Even if the API call fails, the payment might have succeeded on Razorpay's end
        // Store the payment details for reference
        const paymentSuccessData = {
          paymentId: response.razorpay_payment_id,
          policyNo: policyDetails.Policy_No,
          customerName: `${policyDetails.FirstName || ''} ${policyDetails.MiddleName || ''} ${policyDetails.LastName || ''}`.trim(),
          amount: policyDetails.PremiumAmount,
          paymentDate: new Date().toISOString(),
          razorpayResponse: response,
          apiError: "API verification failed but payment may have succeeded"
        };
        
        sessionStorage.setItem('paymentSuccessData', JSON.stringify(paymentSuccessData));
        
        // Store failure data for the cancel page
        const failureData = {
          error: "API communication error, but payment may have succeeded",
          paymentId: response.razorpay_payment_id,
          certificateNumber: policyDetails.Policy_No
        };
        sessionStorage.setItem('paymentFailureData', JSON.stringify(failureData));
        
        // Use the redirect helper with API_error reason
        handleRedirectToCancel(policyDetails.Policy_No, "API_error", response.razorpay_payment_id);
      }
    } catch (error) {
      console.error("Error in payment success handler:", error);
      
      // Store any available payment data
      if (response && response.razorpay_payment_id) {
        const failureData = {
          error: "Error processing payment response",
          paymentId: response.razorpay_payment_id,
          certificateNumber: policyDetails?.Policy_No || ''
        };
        sessionStorage.setItem('paymentFailureData', JSON.stringify(failureData));
      }
      
      // Use the redirect helper
      handleRedirectToCancel(policyDetails?.Policy_No || '', "Payment processing error", 
        response?.razorpay_payment_id);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePaymentCancel = () => {
    const cancelData = {
      cancelReason: "User cancelled the payment",
      certificateNumber: policyDetails?.Policy_No || '',
      timestamp: new Date().toISOString()
    };
    sessionStorage.setItem('paymentCancelData', JSON.stringify(cancelData));
    
    // Use the redirect helper
    handleRedirectToCancel(policyDetails?.Policy_No || '', "Payment cancelled by user");
  };

  const handlePayNow = () => {
    if (!policyDetails || !policyDetails.PremiumAmount) {
      setError('Payment amount information is missing. Please try again or contact support.');
      return;
    }

    // Check if Razorpay is loaded
    if (!isRazorpayLoaded || typeof window.Razorpay !== 'function') {
      setError('Payment gateway is still loading. Please try again in a moment.');
      return;
    }

    if (processingPayment) {
      setError('A payment is already being processed. Please wait.');
      return;
    }

    // Format full name from policy details
    const fullName = policyDetails.FirstName && policyDetails.LastName 
      ? `${policyDetails.FirstName} ${policyDetails.LastName}`
      : policyDetails.FirstName || 'Customer';

    // Razorpay options
    const options = {
      key: "rzp_live_DFxDFYDslN2DIq", // Your Razorpay Key ID
      amount: parseFloat(policyDetails.PremiumAmount) * 100, // Convert to paisa
      currency: "INR",
      name: `${fullName}-${policyDetails.Policy_No || 'ID'}`,
      description: "Payment for Interstellar for Travel",
      image: "http://inv.policyboss.com/travel-api/images/TravelAssist.webp",
      handler: handlePaymentSuccess,
      prefill: {
        name: fullName,
        email: policyDetails.EmailID || '',
        contact: policyDetails.MobileNumber || ''
      },
      notes: {
        address: "note value",
        policy_number: policyDetails.Policy_No || '',
        agent_id: policyDetails.AgentId || '',
        payment_mode: policyDetails.Payment_Mode || ''
      },
      theme: {
        color: "#528FF0"
      },
      modal: {
        escape: false,
        ondismiss: function() {
          handlePaymentCancel();
        }
      }
    };

    try {
      // Initialize Razorpay
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function(failedResponse){
        console.log("Payment Failed Response:", failedResponse);
        
        // Save failure details
        const failureData = {
          error: failedResponse.error?.description || "Payment failed",
          errorCode: failedResponse.error?.code || "unknown",
          errorSource: failedResponse.error?.source || "unknown",
          errorStep: failedResponse.error?.step || "unknown",
          errorReason: failedResponse.error?.reason || "unknown",
          paymentId: failedResponse.error?.metadata?.payment_id || "unknown",
          certificateNumber: policyDetails?.Policy_No || ''
        };
        
        sessionStorage.setItem('paymentFailureData', JSON.stringify(failureData));
        
        // Use the redirect helper
        const reason = failedResponse.error?.description || "Payment failed";
        handleRedirectToCancel(policyDetails?.Policy_No || '', reason, 
          failedResponse.error?.metadata?.payment_id);
      });
      
      rzp.open();
    } catch (error) {
      console.error("Error initializing Razorpay:", error);
      setError('Unable to initialize payment gateway. Please try again later.');
    }
  };

  if (loading) {
    return <div className="loading_pay">Loading payment details...</div>;
  }

  if (!policyDetails) {
    return (
      <div className="error-container_pay">
        <div className="error-message_pay">
          Policy details not found. Please go back and try again.
        </div>
        <button 
          className="dashboard-button_pay"
          onClick={() => navigate('/payment')}
        >
          Back to Payment Page
        </button>
      </div>
    );
  }

  // Format full name from policy details
  const fullName = policyDetails.FirstName && policyDetails.LastName 
    ? `${policyDetails.FirstName} ${policyDetails.LastName}`
    : policyDetails.FirstName || 'Customer';

  return (
    <div className="container_pay">
      <div className="infoContainer_pay">
        <div>
         <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '50px', width: 'auto' }} />
        </div>
        <div className="row_pay" id="divpayment">
          <div className="image-container_pay">
            <img src={paymentImg} alt="Payment" />
          </div>
          <div className="details_pay">
            <p>PAYMENT DETAILS</p>
            {error && (
              <div className="error-message_pay">
                {error}
              </div>
            )}
            <div className="detail-item_pay">
              <span>Customer Name :</span><br />
              <strong id="name">{fullName}</strong>
            </div>
            <div className="detail-item_pay">
              <span>Certificate Number :</span><br />
              <strong id="certificateNumber">{policyDetails.Policy_No}</strong>
            </div>
            {policyDetails.PolicyStartDate && policyDetails.PolicyEndDate && (
              <div className="detail-item_pay">
                <span>Policy Period :</span><br />
                <strong>
                  {new Date(policyDetails.PolicyStartDate).toLocaleDateString()} - {new Date(policyDetails.PolicyEndDate).toLocaleDateString()}
                </strong>
              </div>
            )}
            <div className="detail-item_pay">
              <span>Payable Amount :</span><br />
              <strong>₹ </strong><strong id="PayableAmount">{policyDetails.PremiumAmount}</strong>
            </div>
            <div className="button-container_pay">
              <button 
                className="payment-button_pay" 
                onClick={handlePayNow}
                disabled={!isRazorpayLoaded || processingPayment}
              >
                {processingPayment ? 'Processing...' : (isRazorpayLoaded ? 'BUY NOW' : 'Loading Payment Gateway...')}
              </button>
              <button 
                className="cancel-button_pay" 
                onClick={handlePaymentCancel}
                disabled={processingPayment}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RazorPayment_input;