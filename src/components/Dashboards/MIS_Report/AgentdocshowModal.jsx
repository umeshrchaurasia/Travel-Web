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
import { getAgentListByUId, updateAgentDetails,BASE_URL } from '../../../services/api';
import '../Modal.css';


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

const AgentdocshowModal = ({ isOpen, onClose, onSuccess, agentId, userId }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [adminComment, setAdminComment] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(null); // null, "1", or "0"
   
    useEffect(() => {
        if (isOpen && agentId && userId) {
            loadDocuments();
            // Reset state when modal opens
            setSelectedStatus(null);
            setAdminComment('');
            setError('');
            setSuccess('');
           
        }
    }, [isOpen, agentId, userId]);

    const loadDocuments = async () => {
        try {
            setLoading(true);
            const response = await getAgentListByUId(userId, agentId);
            if (response.Status === 'Success' && response.MasterData) {
                setDocuments(response.MasterData);
                console.log('Loaded documents:', response.MasterData);
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

                    

                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                  
                </div>
            </div>
        </div>
    );
};

export default AgentdocshowModal;