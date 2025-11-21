import React, { useState, useEffect } from 'react';
import { 
    Upload, 
    CheckCircle, 
    X, 
    AlertTriangle, 
    FileText,
    ThumbsUp,
    ThumbsDown,
    Eye
} from 'lucide-react';
import { getAgentListByUId, updateAgentApproval,BASE_URL } from '../../services/api';
import './Modal.css';


const DOCUMENTS_URL = `${BASE_URL}/uploads/agent-documents/`;
const UPDATE_APPROVAL_URL = `${BASE_URL}/update-approval`;



const REQUIRED_DOCS = [
    { id: 'pancard', name: 'PAN Card', required: true },
    { id: 'bankdetails', name: 'Bank Details', required: true },
    { id: 'addressproof', name: 'Address Proof', required: true },
    { id: 'gst', name: 'GST Certificate', required: false },
    { id: 'msme', name: 'MSME Certificate', required: false },   
    { id: 'other', name: 'Other Document', required: false }
];

const DocumentViewer = ({ agentId, docType, customFileName }) => {
    if (!customFileName) {
        return (
            <div className="document-viewer">
                <button 
                    className="no-document-btn"
                    disabled
                >
                    <X className="w-5 h-5" />
                    No Document
                </button>
            </div>
        );
    }

  //  const fileUrl = `${DOCUMENTS_URL}${customFileName}`;

    // Create URL that points to the public uploads directory
    // Remove '/api' from BASE_URL to get the root URL
    const rootUrl = BASE_URL.replace('/api', ''); // 
    const fileUrl = `${rootUrl}/uploads/agent-documents/${customFileName}`;
  
    

    return (
        <div className="document-viewer">
            <button 
                className="view-document-btn"
                onClick={() => window.open(fileUrl, '_blank')}
            >
                <Eye className="w-5 h-5" />
                Click to View
            </button>
        </div>
    );
};

const AddApprovalAgentdocModal = ({ isOpen, onClose, onSuccess, agentId, userId, walletAmount }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [adminComment, setAdminComment] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(null); // null, "1", or "0"
    const [selectedWalletAmount, setSelectedWalletAmount] = useState(walletAmount || "5000");

    useEffect(() => {
        if (isOpen && agentId && userId) {
            loadDocuments();
            // Reset state when modal opens
            setSelectedStatus(null);
            setAdminComment('');
            setError('');
            setSuccess('');
            // Set wallet amount if provided
            if (walletAmount) {
                setSelectedWalletAmount(walletAmount);
            }
        }
    }, [isOpen, agentId, userId, walletAmount]);

    const loadDocuments = async () => {
        try {
            setLoading(true);
            const response = await getAgentListByUId(userId, agentId);
            if (response.Status === 'Success' && response.MasterData) {
                setDocuments(response.MasterData);
              //  console.log('Loaded documents:', response.MasterData);
            }
        } catch (error) {
            console.error('Error loading documents:', error);
            setError('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleCommentChange = (e) => {
        const comment = e.target.value;
        if (comment.length <= 300) {
            setAdminComment(comment);
        }
    };

    const handleStatusSelect = (status) => {
        setSelectedStatus(status);
        setError(''); // Clear any existing errors
    };

    const handleWalletAmountChange = (e) => {
        setSelectedWalletAmount(e.target.value);
    };

    const validateSubmission = () => {
        if (selectedStatus === null) {
            setError('Please select either Approve or Not Approve');
            return false;
        }

        if (!adminComment.trim()) {
            setError('Please add a comment before submitting');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateSubmission()) {
            return;
        }

        try {
            setLoading(true);
            setError('');

            const approvalData = {
                "uId": userId,
                "agentId": String(agentId),
                "adminApproved": selectedStatus,
                "adminComment": adminComment.trim(),
                "walletAmount": selectedWalletAmount
            };

            console.log('Submitting approval with data:', {
                endpoint: UPDATE_APPROVAL_URL,
                method: 'POST',
                data: approvalData,
                timestamp: new Date().toISOString()
            });

            const response = await updateAgentApproval(approvalData);

            console.log('Update approval response:', {
                status: response.Status,
                message: response.Message,
                data: response.MasterData,
                timestamp: new Date().toISOString()
            });

            if (response.Status === 'Success') {
                setSuccess('Documents review submitted successfully');
                
                // Update documents list to get latest status
                await loadDocuments();
                
                setTimeout(() => {
                    onSuccess(); // This will refresh the parent list
                    onClose();
                }, 1500);
            } else {
                setError(response.Message || 'Failed to update approval status');
            }
        } catch (error) {
            console.error('Error updating approval:', {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            setError('Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    const getDocumentForType = (docType) => {
        return documents.find(doc => doc.DocType.toLowerCase() === docType.toLowerCase());
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Review Documents</h2>
                    <button className="close-button" onClick={onClose}>
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="document-info">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        <span>Please review all required documents carefully</span>
                    </div>

                    <div className="document-grid">
                        {REQUIRED_DOCS.map((doc) => {
                            const uploadedDoc = getDocumentForType(doc.id);
                            
                            return (
                                <div 
                                    key={doc.id} 
                                    className={`document-item ${doc.required ? 'required' : ''}`}
                                >
                                    <div className="doc-header">
                                        <FileText className="w-5 h-5" />
                                        <span>{doc.name}</span>
                                        {doc.required && (
                                            <span className="required-badge">Required</span>
                                        )}
                                    </div>

                                    <div className="upload-container">
                                        <div className="document-review-section">
                                            <div className="document-info-row">
                                                <span className="document-name">
                                                    {doc.name}
                                                </span>
                                                <DocumentViewer 
                                                    agentId={agentId} 
                                                    docType={doc.id}
                                                    customFileName={uploadedDoc?.Doct_Filename}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="approval-section">
                        <div className="approval-buttons">
                            <button
                                className={`approve-btn ${selectedStatus === "1" ? 'selected' : ''}`}
                                onClick={() => handleStatusSelect("1")}
                                disabled={loading}
                            >
                                <ThumbsUp className="w-5 h-5" />
                                Approve
                            </button>
                            <button
                                className={`not-approve-btn ${selectedStatus === "2" ? 'selected' : ''}`}
                                onClick={() => handleStatusSelect("2")}
                                disabled={loading}
                            >
                                <ThumbsDown className="w-5 h-5" />
                                Not Approve
                            </button>
                        </div>

                        <div className="comment-section">
                            <label htmlFor="adminComment">Review Comment (Max 300 characters)</label>
                            <textarea
                                id="adminComment"
                                value={adminComment}
                                onChange={handleCommentChange}
                                maxLength={300}
                                placeholder="Enter your review comments here..."
                                rows={3}
                                className="form-control"
                            />
                            <span className="character-count">
                                {adminComment.length}/300 characters
                            </span>
                        </div>

                        <div className="form-row">
                        <div className="form-group">
                          <label
                            htmlFor="Wallet_Amount"
                            style={{
                              fontWeight: '500',
                              color: '#333',
                              fontSize: '16px'
                            }}
                          >
                            Wallet Amount:
                          </label>
                          <select
                            id="Wallet_Amount"
                            name="Wallet_Amount"
                            value={selectedWalletAmount}
                            onChange={handleWalletAmountChange}
                            style={{
                              padding: '8px 15px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '16px',
                              backgroundColor: 'white',
                              width: '250px'
                            }}
                          >
                            <option value="5000">₹ 5,000</option>
                            <option value="10000">₹ 10,000</option>
                            <option value="15000">₹ 15,000</option>
                            <option value="20000">₹ 20,000</option>
                            <option value="25000">₹ 25,000</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    <div className="modal-footer"  style={{marginBottom:"0.3rem",marginRight:"0.2rem"}}>
                        <button 
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                       
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={loading || selectedStatus === null}
                        >
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddApprovalAgentdocModal;