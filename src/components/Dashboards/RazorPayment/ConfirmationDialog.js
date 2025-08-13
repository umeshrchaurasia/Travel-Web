// ConfirmationDialog.js
import React from 'react';

const ConfirmationDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.dialogContainer}>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.message}>{message}</p>
        <div style={styles.buttonContainer}>
          <button 
            style={styles.cancelButton} 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            style={styles.confirmButton} 
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialogContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  title: {
    margin: '0 0 16px 0',
    color: '#333',
    fontSize: '20px',
  },
  message: {
    margin: '0 0 24px 0',
    color: '#555',
    fontSize: '16px',
    lineHeight: '1.5',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#f1f1f1',
    color: '#333',
    cursor: 'pointer',
    fontSize: '14px',
  },
  confirmButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#6c63ff',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default ConfirmationDialog;