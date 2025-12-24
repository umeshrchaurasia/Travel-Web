import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, X, AlertTriangle, FileText } from 'lucide-react';
import { uploadDocument, getAgentDocuments } from '../../services/api';
import './Modal.css';

const REQUIRED_DOCS = [
    { id: 'pancard', name: 'PAN Card', required: true },
    { id: 'bankdetails', name: 'Bank Details', required: true },
    { id: 'addressproof', name: 'Address Proof', required: true },
    { id: 'gst', name: 'GST Certificate', required: false },
    { id: 'msme', name: 'MSME Certificate', required: false },
    { id: 'other', name: 'Other Document', required: false }
];

const AddAgentdocModal = ({ isOpen, onClose, onSuccess, agentId, userId, adminApproved }) => {
    const [documents, setDocuments] = useState({});
    const [uploadStatus, setUploadStatus] = useState({});
    const [uploadingDocId, setUploadingDocId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [allRequiredUploaded, setAllRequiredUploaded] = useState(false);

    useEffect(() => {
        if (isOpen && agentId) {
            setDocuments({});
            setUploadStatus({});
            setError('');
            setSuccess('');
            setUploadingDocId(null);
            setAllRequiredUploaded(false);

            if (adminApproved !== "2") {
                checkExistingDocuments();
            }
        }
    }, [isOpen, agentId, adminApproved]);

    const checkExistingDocuments = async () => {
        try {
            const response = await getAgentDocuments(agentId);
            if (response.Status === 'Success' && response.MasterData) {
                const status = {};
                response.MasterData.forEach(doc => {
                    status[doc.DocType.toLowerCase()] = true;
                });
                setUploadStatus(status);
                checkRequiredDocuments(status);
            }
        } catch (error) {
            console.error('Error checking documents:', error);
        }
    };

    const checkRequiredDocuments = (status) => {
        const required = REQUIRED_DOCS.filter(doc => doc.required);
        const allUploaded = required.every(doc => status[doc.id]);
        setAllRequiredUploaded(allUploaded);
    };

    const validateFile = (file) => {
        const maxSize = 4 * 1024 * 1024; // 4MB
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (file.size > maxSize) {
            // This error was previously hidden at the bottom
            throw new Error('File size should not exceed 4MB');
        }

        if (!allowedTypes.includes(file.type)) {
            throw new Error('Invalid file type. Only PDF, JPEG, PNG, DOC files are allowed');
        }
    };

    const handleFileChange = async (e, docType) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Reset messages immediately
            setError('');
            setSuccess('');
            
            validateFile(file);
            setUploadingDocId(docType);

            const formData = new FormData();
            formData.append('document', file);
            formData.append('agentId', agentId);
            formData.append('uId', userId);
            formData.append('docType', docType);

            const response = await uploadDocument(formData);

            if (response.Status === 'Success') {
                const newStatus = { ...uploadStatus, [docType]: true };
                setUploadStatus(newStatus);
                checkRequiredDocuments(newStatus);
                setSuccess(`${docType} uploaded successfully`);
            } else {
                setError(response.Message || 'Upload failed');
            }
        } catch (err) {
            // This will now show at the top of the modal
            setError(err.message || 'Error uploading document');
        } finally {
            setUploadingDocId(null);
        }
    };

    const handleClose = () => {
        if (allRequiredUploaded) {
            onSuccess();
        }
        onClose();
    };

    const isDocumentUploaded = (docType) => {
        if (adminApproved === "2") return false;
        return uploadStatus[docType];
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{adminApproved === "2" ? 'Reupload Documents' : 'Upload Documents'}</h2>
                    <button className="close-button" onClick={onClose}>
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="document-info">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        <span>PAN Card, Bank Details, Address Proof documents are mandatory</span>
                    </div>

                    {/* MOVED ALERTS TO TOP FOR VISIBILITY */}
                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success} </div>}

                    {adminApproved === "2" && (
                        <div className="alert alert-error mb-4">
                            Documents were rejected. Please reupload all required documents.
                        </div>
                    )}

                    <div className="document-grid">
                        {REQUIRED_DOCS.map((doc) => {
                            const isUploadingThis = uploadingDocId === doc.id;
                            const isUploaded = isDocumentUploaded(doc.id);

                            return (
                                <div
                                    key={doc.id}
                                    className={`document-item ${doc.required ? 'required' : ''} ${isUploaded ? 'uploaded' : ''}`}
                                >
                                    <div className="doc-header">
                                        <FileText className="w-5 h-5" />
                                        <span>{doc.name}</span>
                                        {doc.required && <span className="required-badge">Required</span>}
                                    </div>

                                    <div className="upload-container">
                                        <input
                                            type="file"
                                            id={`file-${doc.id}`}
                                            onChange={(e) => handleFileChange(e, doc.id)}
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                            disabled={isUploaded || uploadingDocId !== null}
                                            hidden
                                        />
                                        <label
                                            htmlFor={`file-${doc.id}`}
                                            className={`upload-button ${isUploaded ? 'uploaded' : ''} ${isUploadingThis ? 'uploading' : ''}`}
                                        >
                                            {isUploadingThis ? (
                                                <>
                                                    <div className="mini-loader"></div>
                                                    <span>Uploading...</span>
                                                </>
                                            ) : isUploaded ? (
                                                <>
                                                    <CheckCircle className="w-5 h-5" />
                                                    <span>Uploaded</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-5 h-5" />
                                                    <span>Choose File</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="modal-footer" style={{ marginBottom: "0.3rem", marginRight: "0.2rem" }}>
                        <button
                            className={`submit-button ${allRequiredUploaded ? 'completed' : ''}`}
                            onClick={handleClose}
                            disabled={uploadingDocId !== null}
                        >
                            {allRequiredUploaded ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Completed
                                </>
                            ) : (
                                'Close'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddAgentdocModal;