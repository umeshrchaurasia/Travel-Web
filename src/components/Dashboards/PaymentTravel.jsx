import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Home, 
  Download,
  CheckCircle
} from 'lucide-react';
import { logout } from '../../services/auth';
import logo from '../../../src/assets/img/TravelAssist.webp';

const PaymentTravel = ({ userData = null, onLogout = () => {} }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [insuranceData, setInsuranceData] = useState(null);
  const [userProfile, setUserProfile] = useState(() => {
    const savedProfile = localStorage.getItem('userData');
    return savedProfile ? JSON.parse(savedProfile) : userData;
  });

  useEffect(() => {
    const storedInsuranceData = sessionStorage.getItem('insuranceData');
    if (storedInsuranceData) {
      setInsuranceData(JSON.parse(storedInsuranceData));
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogout = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      logout();
      if (onLogout) {
        onLogout();
      }
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleDownloadInsurance = () => {
    if (insuranceData && insuranceData.downloadFilePath) {
      window.open(insuranceData.downloadFilePath, '_blank');
    }
  };

  if (loading || !insuranceData) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div className="spinner" />
      </div>
    );
  }

  const displayData = userData || userProfile;

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
          <div style={{ display: 'flex', gap: '20px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={styles.button}
            >
              <Home size={18} />
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              style={{
                ...styles.button,
                backgroundColor: '#ef4444'
              }}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.mainContent}>
        <div style={styles.card}>
          <div style={styles.successHeader}>
            <CheckCircle size={24} color="#059669" />
            <h2 style={styles.successTitle}>Insurance Processed Successfully!</h2>
          </div>

          <div style={styles.detailsContainer}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Full Name:</span>
              <span style={styles.detailValue}>{insuranceData.fullName}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>PaxId:</span>
              <span style={styles.detailValue}>{insuranceData.paxId}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>PSO Number:</span>
              <span style={styles.detailValue}>{insuranceData.psoNumber}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Certificate Number:</span>
              <span style={styles.detailValue}>{insuranceData.certificateNumber}</span>
            </div>
          </div>

          <div style={styles.downloadSection}>
            <button 
              onClick={handleDownloadInsurance}
              style={styles.downloadButton}
            >
              <Download size={18} />
              Download Insurance
            </button>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#f3f4f6',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    backgroundColor: '#6c63ff',
    padding: '1rem',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    color: 'white'
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    height: '40px'
  },
  button: {
    backgroundColor: '#6c63ff',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  mainContent: {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '0 20px',
    flex: '1 0 auto'
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  successHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '25px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '20px'
  },
  successTitle: {
    color: '#059669',
    margin: 0,
    fontSize: '24px',
    fontWeight: '600'
  },
  detailsContainer: {
    marginBottom: '30px'
  },
  detailRow: {
    display: 'flex',
    borderBottom: '1px solid #f3f4f6',
    padding: '12px 0'
  },
  detailLabel: {
    fontWeight: '600',
    width: '200px',
    color: '#4b5563'
  },
  detailValue: {
    flex: 1,
    color: '#1f2937'
  },
  downloadSection: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '30px'
  },
  downloadButton: {
    backgroundColor: '#6c63ff',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.2s'
  },
  footer: {
    background: '#6c63ff',
    color: 'white',
    padding: '1rem',
    textAlign: 'center',
    marginTop: 'auto'
  }
};

export default PaymentTravel;