import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { updateAgentDetails } from '../../../services/api';
import '../Modal.css'; // Assuming you have a CSS file for modals

interface EditAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    agent: Agent | null;
}

interface Agent {
    AgentId?: number;
    FullName?: string;
    MobileNumber?: string;
    Paymentmode?: string;
    Payout?: string;
    Wallet_Amount?: string;
}

const EditAgentModal: React.FC<EditAgentModalProps> = ({ isOpen, onClose, onSuccess, agent }) => {
    const [formData, setFormData] = useState({
        Payout: '',
        Wallet_Amount: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        // When the agent prop changes, update the form data
        if (agent) {
            setFormData({
                Payout: agent.Payout || '',
                Wallet_Amount: agent.Wallet_Amount || ''
            });
        }
        // Reset messages when modal opens
        setError(null);
        setSuccess(null);
    }, [agent]);

    if (!isOpen || !agent) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

       const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow backspace, delete, tab, escape, enter, and arrow keys
        if ([46, 8, 9, 27, 13, 110].includes(e.keyCode) ||
            (e.keyCode === 65 && e.ctrlKey === true) || // Ctrl+A
            (e.keyCode >= 35 && e.keyCode <= 39)) { // Home, End, Arrows
                 return;
        }
        // Ensure that it is a number and stop the keypress if not
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const payload = {
                AgentId: agent.AgentId,
                ...formData
            };
            const response = await updateAgentDetails(payload);
            if (response.Status === 'Success') {
                setSuccess('Agent details updated successfully!');
                setTimeout(() => {
                    onSuccess(); // This will close the modal and refresh the list
                }, 1500);
            } else {
                setError(response.Message || 'Failed to update agent details.');
            }
        } catch (err) {
            setError('An error occurred while updating.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" >
            <div className="modal-container">
                <div className="modal-header">
                    <h3>Edit Agent Details</h3>
                    <button onClick={onClose} className="modal-close-button">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} style={{backgroundColor:"white"}}>
                    <div className="modal-body">
                        {/* Read-only fields */}
                        <div className="form-group-readonly">
                            <label>Agent ID:</label>
                            <span>{agent.AgentId}</span>
                        </div>
                        <div className="form-group-readonly">
                            <label>Agent Name:</label>
                            <span>{agent.FullName}</span>
                        </div>
                        <div className="form-group-readonly">
                            <label>Mobile:</label>
                            <span>{agent.MobileNumber}</span>
                        </div>
                        <div className="form-group-readonly">
                            <label>Payment Mode:</label>
                            <span>{agent.Paymentmode}</span>
                        </div>
                        <hr />
                        {/* Editable fields */}
                        <div className="form-group">
                            <label htmlFor="Payout">Payout (%)</label>
                            <input
                                id="Payout"
                                name="Payout"
                                type="number"
                                value={formData.Payout}
                                onChange={handleChange}
                                placeholder="e.g., 10"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="Wallet_Amount">Wallet Balance (₹)</label>
                            <input
                                id="Wallet_Amount"
                                name="Wallet_Amount"
                                type="number"
                                value={formData.Wallet_Amount}
                                onChange={handleChange}
                                onKeyDown={handleNumericKeyDown}
                                placeholder="e.g., 5000"
                                required
                            />
                        </div>
                        {error && <div className="form-message error">{error}</div>}
                        {success && <div className="form-message success">{success}</div>}
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="coi-button secondary">
                            Cancel
                        </button>
                        <button type="submit" className="coi-button primary" disabled={loading}>
                            <Save size={18} /> {loading ? 'Saving...' : 'Update'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditAgentModal;
