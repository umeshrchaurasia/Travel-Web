import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Download } from 'lucide-react';
import { getProposalDetailsByEmployee, PDF_BASE_URL } from '../../../services/api';

// Type definitions
interface Proposal {
  InsuredFullName?: string;
  Policy_No?: string;
  Agent_Code?: string;
  PolicyStartDate?: string;
  PolicyEndDate?: string;
  PremiumAmount?: string | number;
  Payment_Status?: string;
  Payment_Mode?: string;
  Wallet_Amount?: string | number;
  Invoice_Url?: string;
  Policy_Url?: string;
  RelianceUrl?: string;
}

interface ApiResponse {
  Status: string;
  MasterData?: {
    proposals?: Proposal[];
  };
}

interface LocationState {
  empid?: string;
  agentData?: any;
}

interface TestempcoiProps {
  userData?: any;
  onLogout?: () => void;
}

const Testempcois: React.FC<TestempcoiProps> = ({ userData, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [empId, setEmpId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    // Get employee ID from navigation
    const empIdFromState = state?.empid;
    if (empIdFromState) {
      setEmpId(empIdFromState);
    }

    // Set dates: 7 days ago to today
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);

    // Auto search if employee ID exists
    if (empIdFromState) {
      searchData(empIdFromState, sevenDaysAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
    }
  }, [location, state]);

  const searchData = async (employeeId: string, fromDate: string, toDate: string): Promise<void> => {
    if (!employeeId || !fromDate || !toDate) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response: ApiResponse = await getProposalDetailsByEmployee(employeeId, fromDate, toDate);
      
      if (response.Status === 'Success' && response.MasterData?.proposals && response.MasterData.proposals.length > 0) {
        setProposals(response.MasterData.proposals);
        setError('');
      } else {
        setProposals([]);
        setError('No data found');
      }
    } catch (err) {
      setProposals([]);
      setError('Error loading data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (): void => {
    searchData(empId, startDate, endDate);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount?: string | number): string => {
    if (!amount) return '₹0';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '₹0';
    return `₹${numAmount.toLocaleString()}`;
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => 
    (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Employee Proposal Details</h2>
      
      {empId && <p><strong>Employee ID: {empId}</strong></p>}

      {/* Search Form */}
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '5px', 
        marginBottom: '20px',
        display: 'flex',
        gap: '10px',
        alignItems: 'end'
      }}>
        <div>
          <label htmlFor="empId">Employee ID:</label><br/>
          <input 
            id="empId"
            type="text" 
            value={empId}
            onChange={handleInputChange(setEmpId)}
            placeholder="Enter Employee ID"
            style={{ padding: '5px', width: '150px' }}
          />
        </div>
        
        <div>
          <label htmlFor="startDate">From Date:</label><br/>
          <input 
            id="startDate"
            type="date" 
            value={startDate}
            onChange={handleInputChange(setStartDate)}
            style={{ padding: '5px', width: '150px' }}
          />
        </div>
        
        <div>
          <label htmlFor="endDate">To Date:</label><br/>
          <input 
            id="endDate"
            type="date" 
            value={endDate}
            onChange={handleInputChange(setEndDate)}
            style={{ padding: '5px', width: '150px' }}
          />
        </div>
        
        <button 
          onClick={handleSearch}
          disabled={loading}
          style={{ 
            padding: '8px 15px', 
            backgroundColor: loading ? '#6c757d' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '3px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          <Search size={16} style={{ marginRight: '5px' }} />
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Results */}
      {loading && <p>Loading...</p>}
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {proposals.length > 0 && (
        <div>
          <p><strong>{proposals.length} proposals found</strong></p>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              border: '1px solid #ddd',
              minWidth: '800px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Sr.No</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Name</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Policy No</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Agent Code</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Start Date</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>End Date</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Premium</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Invoice</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Policy</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((proposal: Proposal, index: number) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{index + 1}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {proposal.InsuredFullName || 'N/A'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {proposal.Policy_No || 'N/A'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {proposal.Agent_Code || 'N/A'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {formatDate(proposal.PolicyStartDate)}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {formatDate(proposal.PolicyEndDate)}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {formatCurrency(proposal.PremiumAmount)}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backgroundColor: proposal.Payment_Status === 'Approved' ? '#d4edda' : '#fff3cd',
                        color: proposal.Payment_Status === 'Approved' ? '#155724' : '#856404'
                      }}>
                        {proposal.Payment_Status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {proposal.Invoice_Url ? (
                        <a 
                          href={`${PDF_BASE_URL}${proposal.Invoice_Url}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: '#007bff', 
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Download size={14} /> Invoice
                        </a>
                      ) : (
                        <span style={{ color: '#6c757d' }}>No Invoice</span>
                      )}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {proposal.Policy_Url ? (
                        <a 
                          href={`${PDF_BASE_URL}${proposal.Policy_Url}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: '#007bff', 
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Download size={14} /> Policy
                        </a>
                      ) : (
                        <span style={{ color: '#6c757d' }}>No Policy</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Testempcois;