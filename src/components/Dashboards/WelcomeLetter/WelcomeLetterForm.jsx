import React, { useState } from 'react';
import { generateWelcomeLetter, PDF_BASE_URL } from '../../../services/api';
import './WelcomeLetterForm.css';
import '../EmployeeDashboard.css';

const WelcomeLetterForm = () => {
    const [loading, setLoading] = useState(false);
    const [loadingState, setLoadingState] = useState(''); // For showing detailed loading status
    const [formData, setFormData] = useState({
        customerName: '',
        customerAddress: '',
        customerEmail: '',
        customerDate: '',
        departureDate: '',
        arrivalDate: '',
        travelDuration: '',
        policyNumber: '',
        assistanceCharges: '',
        SupportEmail: 'support@interstellarservices.com',
        SupportcontactNo: '+91-9876543210',
        contactNo: '+91-9876543210'
    });
    
    // State to track success and show details
    const [success, setSuccess] = useState(false);
    const [responseData, setResponseData] = useState(null);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setLoading(true);
        setLoadingState('Sending request to server...');
        setSuccess(false);
        setResponseData(null);
        setError(null);
        
        try {
            // Step 1: Generate the welcome letter
            setLoadingState('Generating welcome letter...');
            const response = await generateWelcomeLetter(formData);
       //     console.log('API Response:', response);
            
            // Handle the response
            if (response && response.data && response.data.Data) {
                const responseData = response.data.Data;
                
                if (responseData && responseData.pdfUrl) {
                    const fullUrl = `${PDF_BASE_URL}${responseData.pdfUrl}`;
                    
                    // Set success and response data
                    setResponseData({
                        ...responseData,
                        fullPdfUrl: fullUrl
                    });

                    // Step 2: Download the PDF
                    setLoadingState('Downloading PDF file...');
                    try {
                        const pdfResponse = await fetch(fullUrl);
                        if (!pdfResponse.ok) {
                            throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
                        }
                        
                        const blob = await pdfResponse.blob();

                        // Create a blob URL and trigger the download
                        const blobUrl = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = `WelcomeLetter_${responseData.customerId || Date.now()}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(blobUrl);
                        
                        // Finally set success after everything is done
                        setSuccess(true);
                        
                        // Scroll to the success message
                        setTimeout(() => {
                            const resultMessage = document.getElementById('resultMessage');
                            if (resultMessage) {
                                resultMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }, 100);
                    } catch (pdfError) {
                        console.error('Error downloading PDF:', pdfError);
                        setError(`PDF download failed: ${pdfError.message}`);
                    }
                } else {
                    setError('PDF generation failed: No file path returned in response data.');
                }
            } else {
                console.error('Invalid response format:', response);
                setError('PDF generation failed: Invalid response format from server.');
            }
        } catch (error) {
            console.error('Error generating welcome letter:', error);
            setError('Failed to generate welcome letter: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
            setLoadingState('');
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Welcome Letter Generator</h2>
            </div>
            <div className="card-body">
                {/* Fullscreen Loading overlay */}
                {loading && (
                    <div className="loading-overlay">
                        <div className="loading-content">
                            <div className="spinner"></div>
                            <p>{loadingState}</p>
                        </div>
                    </div>
                )}
                
                {/* Error message can stay at the top */}
                {error && (
                    <div className="alert alert-danger">
                        <h4>Error</h4>
                        <p>{error}</p>
                    </div>
                )}
                
                {/* Form first, then success message at bottom */}
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="policyNumber">Insurance Policy/Certificate Number</label>
                            <input
                                type="text"
                                id="policyNumber"
                                name="policyNumber"
                                value={formData.policyNumber}
                                onChange={handleChange}
                                className="form-control"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="customerName">Customer Name</label>
                            <input
                                type="text"
                                id="customerName"
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleChange}
                                className="form-control"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="customerAddress">Customer Full Address</label>
                            <textarea
                                id="customerAddress"
                                name="customerAddress"
                                value={formData.customerAddress}
                                onChange={handleChange}
                                className="form-control"
                                rows="2"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="customerEmail">Customer Email ID</label>
                            <input
                                type="email"
                                id="customerEmail"
                                name="customerEmail"
                                value={formData.customerEmail}
                                onChange={handleChange}
                                className="form-control"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="customerDate">Date (DD/MM/YYYY)</label>
                            <input
                                type="date"
                                id="customerDate"
                                name="customerDate"
                                value={formData.customerDate}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="departureDate">Date of Departure (from India)</label>
                            <input
                                type="date"
                                id="departureDate"
                                name="departureDate"
                                value={formData.departureDate}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="arrivalDate">Date of Arrival (in India)</label>
                            <input
                                type="date"
                                id="arrivalDate"
                                name="arrivalDate"
                                value={formData.arrivalDate}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="travelDuration">Duration of Travel</label>
                            <input
                                type="text"
                                id="travelDuration"
                                name="travelDuration"
                                value={formData.travelDuration}
                                onChange={handleChange}
                                className="form-control"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="assistanceCharges">Travel Assistance Charges (Incl. of GST)</label>
                            <input
                                type="text"
                                id="assistanceCharges"
                                name="assistanceCharges"
                                value={formData.assistanceCharges}
                                onChange={handleChange}
                                className="form-control"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="SupportEmail">Support Email</label>
                            <input
                                type="email"
                                id="SupportEmail"
                                name="SupportEmail"
                                value={formData.SupportEmail}
                                onChange={handleChange}
                                className="form-control"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="SupportcontactNo">Support Contact Number</label>
                            <input
                                type="text"
                                id="SupportcontactNo"
                                name="SupportcontactNo"
                                value={formData.SupportcontactNo}
                                onChange={handleChange}
                                className="form-control"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="contactNo">Customer Contact No</label>
                            <input
                                type="text"
                                id="contactNo"
                                name="contactNo"
                                value={formData.contactNo}
                                onChange={handleChange}
                                className="form-control"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            disabled={loading}
                        >
                            Generate Welcome Letter
                        </button>
                    </div>
                </form>
                
                {/* Success message below the form/button */}
                {success && responseData && (
                    <div className="alert alert-success mt-4" id="resultMessage">
                        <h4>Welcome Letter Generated Successfully!</h4>
                        <p><strong>Customer Name:</strong> {responseData.customerName}</p>
                        <p><strong>Policy Number:</strong> {formData.policyNumber}</p>
                        {responseData.assistanceNumber && (
                            <p><strong>Assistance Number:</strong> {responseData.assistanceNumber}</p>
                        )}
                        <p>
                            <a 
                                href={responseData.fullPdfUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn btn-sm btn-primary"
                            >
                                View PDF
                            </a>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WelcomeLetterForm;