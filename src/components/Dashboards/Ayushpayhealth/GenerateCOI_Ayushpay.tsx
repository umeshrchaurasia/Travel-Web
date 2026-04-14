import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut, Home, Download, X, Filter, AlertTriangle, Search, ArrowLeftCircle
} from 'lucide-react';  
import { logout } from '../../../services/auth';
import { 
  getProposalByPassport_AyushPay, 
  PDF_BASE_URL 
} from '../../../services/api';
import logo from '../../../../src/assets/img/TravelAssist_practo.webp';
import '../UpdatePolicy/generatecoi.css';

// --- Interfaces mapped to sp_GetProposalByagent_Ayushpay ---
interface AgentData {
  AgentId?: string | number;
  Agent_Code?: string;
  FullName?: string;
  name?: string;
}

interface Proposal {
  Ayush_id?: number;
  Certificate_Number?: string; 
  AyushApplicationId?: string;
  SubscriptionId?: string;
  FullName?: string;
  EmailID?: string;
  MobileNumber?: string;
  Selected_PremiumAmount?: string | number;
  Actual_PremiumAmount?: string | number;
  Selected_Payment_Mode?: string;
  Payment_Status_Admin?: string; 
  InvoicepdfUrl?: string; 
  CreateDate?: string;
  Payout_Ayush?: string | number; 
}

interface LocationState {
  agentData?: AgentData;
}

const GenerateCOI_Ayushpay: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [error, setError] = useState<string>('');
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  
  const [searchFilter, setSearchFilter] = useState<string>('');

  // For pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);

  useEffect(() => {
    // Load agent data from location state or sessionStorage
    const state = location.state as LocationState;
    const storedAgentData = sessionStorage.getItem('coiAgentData_Ayush');
    const data: AgentData | null = state?.agentData || (storedAgentData ? JSON.parse(storedAgentData) : null);

    if (!data) {
      navigate('/Ayushpay');
      return;
    }

    setAgentData(data);
    sessionStorage.setItem('coiAgentData_Ayush', JSON.stringify(data));

    // Fetch by AgentId
    if (data.AgentId) {
      fetchProposalsByAgent(data.AgentId.toString());
    } else {
      setLoading(false);
      setError('No Agent ID found to load proposals.');
    }
  }, [location, navigate]);

  const fetchProposalsByAgent = async (agentId: string) => {
    try {
      setLoading(true);
      setError('');

      const response: any = await getProposalByPassport_AyushPay(agentId);

      if (response.Status === 'Success' && response.MasterData?.length > 0) {
        setProposals(response.MasterData);
        setFilteredProposals(response.MasterData);
      } else {
        setError('No proposals found for this agent.');
        setProposals([]);
        setFilteredProposals([]);
      }
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError('Failed to fetch proposal data. Please try again.');
      setProposals([]);
      setFilteredProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProposalsBySearchCriteria = (proposalsList: Proposal[], searchText: string): Proposal[] => {
    if (!searchText.trim()) {
      return proposalsList;
    }

    const lowerFilter = searchText.toLowerCase();

    return proposalsList.filter(proposal => {
      const fullName = (proposal.FullName || '').toLowerCase();
      const certNumber = (proposal.Certificate_Number || '').toLowerCase();
      const appId = (proposal.AyushApplicationId || '').toLowerCase();
      const mobile = (proposal.MobileNumber || '').toLowerCase();

      return (
        fullName.includes(lowerFilter) ||
        certNumber.includes(lowerFilter) ||
        appId.includes(lowerFilter) ||
        mobile.includes(lowerFilter)
      );
    });
  };

  // Filter proposals based on search text dynamically
  useEffect(() => {
    const filtered = filterProposalsBySearchCriteria(proposals, searchFilter);
    setFilteredProposals(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchFilter, proposals]);

  // Get current items for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProposals.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);

  const handleLogout = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const goBack = () => {
    // IMPORTANT: Pass agentData state back so the AyushPay form can load properly
    navigate('/Ayushpay', { state: { agentData } });
  };

  const goDashboard = () => {
    navigate('/dashboard');
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(e.target.value);
  };

  const clearFilter = () => {
    setSearchFilter('');
  };

  // Pagination handlers
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  return (
    <div className="coi-container">
      {/* Header */}
      <header className="coi-header">
        <div className="coi-header-content">
          <img src={logo} alt="ZextrA Wellness" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
          <div className="d-flex justify-content-center py-4">
            <div className="logo d-flex align-items-center w-auto">
              <span className="page-title">AyushPay Subscriptions</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button onClick={goDashboard} className="coi-button">
              <Home size={18} />
              Dashboard
            </button>
            <button onClick={handleLogout} className="coi-button">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="coi-main-content">
        
        {/* NEW BACK BUTTON (Styled like AyushPay's top button) */}
        <div style={{ marginBottom: '15px', display: 'flex', width: '100%' }}>
          <button 
            onClick={goBack} 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              backgroundColor: '#e0e7ff',
              color: '#3b82f6',
              border: '1px solid #bfdbfe',
              borderRadius: '0.375rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#bfdbfe';
              e.currentTarget.style.color = '#2563eb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e7ff';
              e.currentTarget.style.color = '#3b82f6';
            }}
          >
            <ArrowLeftCircle size={18} />
            <span>Back To AyushPay</span>
          </button>
        </div>

        <div className="coi-card">
          <div className="coi-card-header">
            <h2 className="coi-card-title">Subscription Documents</h2>
          </div>

          {/* Filter input */}
          <div className="coi-filter-container">
            <div className="coi-filter-input-container">
              <Filter size={16} style={{ color: '#6b7280', marginRight: '8px' }} />
              <input
                type="text"
                placeholder="Filter results (name, transaction ID, application ID, mobile)"
                value={searchFilter}
                autoFocus
                onChange={handleFilterChange}
                className="coi-filter-input"
              />
              {searchFilter && (
                <button onClick={clearFilter} className="coi-clear-button">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="coi-results-count">
              {filteredProposals.length} {filteredProposals.length === 1 ? 'result' : 'results'} found
            </div>
          </div>

           {/* Results */}
          {loading ? (
            <div className="coi-loading-container">
              <div className="coi-spinner"></div>
              <p>Loading records...</p>
            </div>
          ) : error ? (
            <div className="coi-error-container">
              <AlertTriangle size={24} color="#ef4444" />
              <p className="coi-error-text">{error}</p>
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="coi-empty-container">
              <p>No proposals found. Please check your filter criteria.</p>
            </div>
          ) : (
            <>
              <div className="coi-table-container">
                <table className="coi-table">
                  <thead>
                    <tr>
                      <th className="coi-table-header">Name</th>
                      <th className="coi-table-header">Transaction/Cert No.</th>
                      <th className="coi-table-header">Application ID</th>
                      <th className="coi-table-header">Date</th>
                      <th className="coi-table-header">Mobile</th>
                      <th className="coi-table-header">Actual Premium</th>
                      <th className="coi-table-header">Selected Premium</th>
                      <th className="coi-table-header">Payout</th>
                      <th className="coi-table-header">Payment Mode</th>
                      <th className="coi-table-header">Status</th>
                      <th className="coi-table-header">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((proposal, index) => {
                      return (
                        <tr key={index} className={index % 2 === 0 ? "coi-table-row-even" : "coi-table-row-odd"}>
                          <td className="coi-table-cell">{proposal.FullName || 'N/A'}</td>
                          <td className="coi-table-cell">{proposal.Certificate_Number || 'N/A'}</td>
                          <td className="coi-table-cell">{proposal.AyushApplicationId || 'N/A'}</td>
                          <td className="coi-table-cell">{formatDate(proposal.CreateDate)}</td>
                          <td className="coi-table-cell">{proposal.MobileNumber || 'N/A'}</td>
                          
                          {/* Actual Premium */}
                          <td className="coi-table-cell">
                            ₹{parseFloat(String(proposal.Actual_PremiumAmount || 0)).toLocaleString()}
                          </td>
                          
                          {/* Selected Premium */}
                          <td className="coi-table-cell" style={{ fontWeight: '600' }}>
                            ₹{parseFloat(String(proposal.Selected_PremiumAmount || 0)).toLocaleString()}
                          </td>
                          
                          {/* Payout */}
                          <td className="coi-table-cell">
                            {proposal.Payout_Ayush ? `${proposal.Payout_Ayush}%` : 'N/A'}
                          </td>

                          <td className="coi-table-cell">{proposal.Selected_Payment_Mode || 'N/A'}</td>
                          
                          <td className="coi-table-cell">
                            <span className="coi-status-badge">
                              {proposal.Payment_Status_Admin || 'Approved'}
                            </span>
                          </td>

                          <td className="coi-table-cell">
                            {proposal.InvoicepdfUrl ? (
                              <a
                                href={`${PDF_BASE_URL}${proposal.InvoicepdfUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="coi-button1"
                              >
                                <Download size={16} className="mr-1" />
                                Invoice
                              </a>
                            ) : (
                              <span style={{ color: '#9ca3af', fontSize: '12px' }}>No Invoice</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="coi-pagination">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`coi-pagination-button ${currentPage === 1 ? 'coi-pagination-button-disabled' : ''}`}
                  >
                    Previous
                  </button>

                  <div className="coi-page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(num => (
                        num === 1 ||
                        num === totalPages ||
                        (num >= currentPage - 1 && num <= currentPage + 1)
                      ))
                      .map((number, index, array) => {
                        if (index > 0 && number - array[index - 1] > 1) {
                          return (
                            <React.Fragment key={`ellipsis-${number}`}>
                              <span className="coi-ellipsis">...</span>
                              <button
                                onClick={() => paginate(number)}
                                className={`coi-page-number ${currentPage === number ? 'coi-active-page' : ''}`}
                              >
                                {number}
                              </button>
                            </React.Fragment>
                          );
                        }

                        return (
                          <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`coi-page-number ${currentPage === number ? 'coi-active-page' : ''}`}
                          >
                            {number}
                          </button>
                        );
                      })}
                  </div>

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`coi-pagination-button ${currentPage === totalPages ? 'coi-pagination-button-disabled' : ''}`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="coi-footer">
        <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
      </footer>
    </div>
  );
};

export default GenerateCOI_Ayushpay;