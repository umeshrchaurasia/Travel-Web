import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserCircle, ChevronDown, RefreshCw, AlertTriangle, Search,
  LogOut, Home, Download, Eye, X, ArrowLeft, Filter, Edit, FileText
} from 'lucide-react';
import { logout } from '../../../services/auth';
import {
  getUpdateProposalDetailsByAgent,
  getProposalByPassport, getPolicyDetailsbyPolicyno, PDF_BASE_URL,
  generatePolicybyPolicyno
} from '../../../services/api';
import logo from '../../../../src/assets/img/TravelAssist.webp';
import './generatecoi.css'; // Import CSS file

// Helper function to normalize URL paths
const processUrl = (url, type) => {
  if (!url) return '';

  // For all URLs: Replace backslashes with forward slashes
  let processedUrl = url.replace(/\\/g, '/');

  // Special handling for Policy URLs
  if (type === 'policy' && processedUrl.includes('public/policy')) {
    // Remove 'public/' prefix for policy URLs
    processedUrl = processedUrl.replace('public/', '');
    console.log('Policy URL after removing public prefix:', processedUrl);
  }

  return processedUrl;
};

const GenerateCOI = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState([]);
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [error, setError] = useState('');
  const [agentData, setAgentData] = useState(null);
  const [passportNumber, setPassportNumber] = useState('');
  const [searchPassport, setSearchPassport] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [generatingPolicies, setGeneratingPolicies] = useState({});

  // For pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    // Load agent data from location state or sessionStorage
    const data = location.state?.agentData || JSON.parse(sessionStorage.getItem('coiAgentData'));

    if (!data) {
      navigate('/AgentDashboard');
      return;
    }

    setAgentData(data);

    // Determine data source - passport number or agent ID with approved status
    const passport = location.state?.passportNumber || sessionStorage.getItem('coiPassport');

    if (passport) {
      // If passport number is provided, search by passport
      setPassportNumber(passport);
      setSearchPassport(passport);
      fetchProposalsByPassport(passport);
    } else if (data.AgentId) {
      // Otherwise, get all approved proposals for this agent
      fetchProposalsByAgent(data.AgentId);
    } else {
      setLoading(false);
      setError('No search criteria provided');
    }
  }, [location, navigate]);

  const filterProposalsBySearchCriteria = (proposals, searchText) => {
    if (!searchText.trim()) {
      return proposals;
    }

    const lowerFilter = searchText.toLowerCase();

    return proposals.filter(proposal => {
      // Search in multiple fields
      const fullName = `${proposal.InsuredFirstName || ''} ${proposal.InsuredMiddleName || ''} ${proposal.InsuredLastName || ''} ${proposal.InsuredFullName || ''}`.toLowerCase();
      const certificateNumber = (proposal.Certificate_Number || '').toLowerCase();
      const policyNo = (proposal.Policy_No || '').toLowerCase();
      const passportNo = (proposal.PassportNo || '').toLowerCase();
      const countryVisiting = (proposal.CountryVisiting || '').toLowerCase();
      const agentCode = (proposal.Agent_Code || '').toLowerCase();

      return (
        fullName.includes(lowerFilter) ||
        certificateNumber.includes(lowerFilter) ||
        policyNo.includes(lowerFilter) ||
        passportNo.includes(lowerFilter) ||
        countryVisiting.includes(lowerFilter) ||
        agentCode.includes(lowerFilter)
      );
    });
  };

  // Filter proposals based on search text
  useEffect(() => {
    if (!searchFilter.trim()) {
      setFilteredProposals(proposals);
      return;
    }

    const filtered = filterProposalsBySearchCriteria(proposals, searchFilter);
    setFilteredProposals(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchFilter, proposals]);

  // Get current items for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProposals.slice(indexOfFirstItem, indexOfLastItem);

  // Calculate total pages
  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);

  const fetchProposalsByAgent = async (agentId) => {
    try {
      setLoading(true);
      setError('');

      // Call the API with agent ID and approved status
      const response = await getUpdateProposalDetailsByAgent(agentId, 'Approved');

      if (response.Status === 'Success' && response.MasterData?.proposals?.length > 0) {
        setProposals(response.MasterData.proposals);
        setFilteredProposals(response.MasterData.proposals);
      } else {
        setError('No approved proposals found for this agent');
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

  const fetchProposalsByPassport = async (passport) => {
    try {
      setLoading(true);
      setError('');

      // Call the API with the passport number
      const response = await getProposalByPassport(passport);

      if (response.Status === 'Success' && response.MasterData?.length > 0) {
        setProposals(response.MasterData);
        setFilteredProposals(response.MasterData);
      } else {
        setError('No proposals found for this passport number');
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

  const handleSearch = () => {
    if (!searchFilter.trim()) {
      setError('Please enter search criteria');
      return;
    }

    // Filter the existing proposals based on the search filter
    const filtered = filterProposalsBySearchCriteria(proposals, searchFilter);
    setFilteredProposals(filtered);
    if (filtered.length === 0) {
      setError('No results found matching your search criteria');
    } else {
      setError('');
    }
  };

  const handleDownload = (downloadUrl) => {
    if (!downloadUrl) {
      alert('Download link not available for this proposal');
      return;
    }

    window.open(downloadUrl, '_blank');
  };

  const newGeneratePolicy = async (policyNo) => {
    if (!policyNo) {
      alert('Policy number not found');
      return;
    }

    try {
      // Update the generating state for this policy
      setGeneratingPolicies(prev => ({
        ...prev,
        [policyNo]: true
      }));

      console.log(`Generating policy for: ${policyNo}`);

      // Call the generatePolicybyPolicyno API
      const response = await generatePolicybyPolicyno({
        Policyno: policyNo
      });

      console.log('Generate policy response:', response);

      if (response?.Status !== 'Success') {
        throw new Error(response?.Message || 'Failed to generate policy');
      }

      // Extract the PDF URL from the response
      const pdfUrl = response.MasterData?.pdfUrl;

      if (!pdfUrl) {
        throw new Error('PDF URL not found in response');
      }

      // Update the proposal in state with the new PDF URL
      const updatedProposals = proposals.map(proposal => {
        if (proposal.Policy_No === policyNo || proposal.Certificate_Number === policyNo) {
          return {
            ...proposal,
            PolicypdfUrl: pdfUrl,
            Policy_Url: pdfUrl // Also update this for UI consistency
          };
        }
        return proposal;
      });

      setProposals(updatedProposals);
      setFilteredProposals(prevFiltered => {
        return prevFiltered.map(proposal => {
          if (proposal.Policy_No === policyNo || proposal.Certificate_Number === policyNo) {
            return {
              ...proposal,
              PolicypdfUrl: pdfUrl,
              Policy_Url: pdfUrl
            };
          }
          return proposal;
        });
      });

      // Open the PDF in a new tab
      window.open(`${PDF_BASE_URL}${pdfUrl}`, '_blank');

      // Show success message
      alert('Policy successfully generated and opened');

    } catch (error) {
      console.error('Error generating policy:', error);
      alert(`Failed to generate policy: ${error.message || 'Unknown error'}`);
    } finally {
      // Reset the generating state for this policy
      setGeneratingPolicies(prev => ({
        ...prev,
        [policyNo]: false
      }));
    }
  };

  const handleUpdatePolicy = (proposal) => {
    // Get the policy number to use for the detailed fetch
    const policyNo = proposal.Policy_No || proposal.Certificate_Number;

    if (policyNo) {
      // First fetch complete policy details using the policy number
      fetchPolicyDetails(policyNo, proposal);
    } else {
      // If no policy number, just use the existing proposal data
      navigateToUpdatePolicy(proposal);
    }
  };

  const fetchPolicyDetails = async (policyNo, fallbackProposal) => {
    try {
      setLoading(true); // Show loading state

      // Call the API to get detailed policy information
      const response = await getPolicyDetailsbyPolicyno(policyNo);

      if (response.Status === 'Success' && response.MasterData?.proposals?.length > 0) {
        // Use the detailed policy data for navigation
        navigateToUpdatePolicy(response.MasterData.proposals[0]);
      } else {
        // If no details found, fall back to the original proposal data
        navigateToUpdatePolicy(fallbackProposal);
      }
    } catch (error) {
      console.error('Error fetching policy details:', error);
      // Fall back to the original proposal data
      navigateToUpdatePolicy(fallbackProposal);
    } finally {
      setLoading(false);
    }
  };

  // Function to navigate to update policy page with provided data
  const navigateToUpdatePolicy = (proposal) => {
    // Store the complete proposal data in sessionStorage for the update page
    sessionStorage.setItem('proposalData', JSON.stringify({
      ...proposal,
      agentDetails: {
        AgentId: proposal.AgentId || agentData.AgentId,
        Agent_Code: proposal.Agent_Code || agentData.Agent_Code,
        FullName: proposal.UserName || agentData.FullName || agentData.name
      },
      travelDetails: {
        departureDate: proposal.PolicyStartDate,
        arrivalDate: proposal.PolicyEndDate,
        numberOfDays: Math.ceil(
          (new Date(proposal.PolicyEndDate) - new Date(proposal.PolicyStartDate)) /
          (1000 * 60 * 60 * 24)
        ) || 30, // Default to 30 days if calculation fails
        geographicalCover: proposal.NameofPlan?.includes('USA') ? 'USA' : 'Worldwide',
      },
      insuranceDetails: {
        premium: parseFloat(proposal.Selected_PremiumAmount || proposal.PremiumAmount || 0),
        planAmount: '500000', // Default value
        radiobtn_selectedOption: proposal.Selected_Payment_Mode || proposal.Payment_Mode || 'Full Pay',
        radiobtn_selectedAmount: proposal.Selected_PremiumAmount || proposal.PremiumAmount || '0',
        dateOfBirth: proposal.DateOfBirth
      }
    }));

    // Navigate to the update policy page
    navigate('/UpdatePolicyInsurance');
  };

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
    navigate('/AgentDashboard');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const handleFilterChange = (e) => {
    setSearchFilter(e.target.value);
  };

  const handleFilterKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Pagination handlers
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  return (
    <div className="coi-container">
      {/* Header */}
      <header className="coi-header">
        <div className="coi-header-content">
          <img src={logo} alt="ZextrA Travel Assist" className="logo-image" style={{ maxHeight: '60px', width: 'auto' }} />
          <div className="d-flex justify-content-center py-4">
            <div className="logo d-flex align-items-center w-auto">
              <span className="page-title">Travel Assistance Service</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button
              onClick={goBack}
              className="coi-button"
            >
              <Home size={18} />
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="coi-button"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="coi-main-content">
        <div className="coi-card">
          <div className="coi-card-header">
            <h2 className="coi-card-title">
              Insurance Policy Documents
            </h2>
          </div>

          {/* Filter input */}
          <div className="coi-filter-container">
            <div className="coi-filter-input-container">
              <Filter size={16} style={{ color: '#6b7280', marginRight: '8px' }} />
              <input
                type="text"
                placeholder="Filter results (name, policy number)"
                value={searchFilter}
                autoFocus
                onChange={handleFilterChange}
                onKeyDown={handleFilterKeyDown}
                className="coi-filter-input"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="coi-clear-button"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="coi-search-container">
              <div className="coi-passport-search">
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="coi-search-button"
                >
                  <Search size={16} style={{ marginRight: '5px' }} />
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            <div className="coi-results-count">
              {filteredProposals.length} {filteredProposals.length === 1 ? 'result' : 'results'} found
            </div>
          </div>



           {/* Results */}

          {loading ? (
            <div className="coi-loading-container">
              <div className="coi-spinner"></div>
              <p>Loading proposals...</p>
            </div>
          ) : error ? (
            <div className="coi-error-container">
              <AlertTriangle size={24} color="#ef4444" />
              <p className="coi-error-text">{error}</p>
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="coi-empty-container">
              <p>No proposals found. Please search with a valid passport number or check your filter criteria.</p>
            </div>
          ) : (
            <>
              <div className="coi-table-container">
                <table className="coi-table">
                  <thead>
                    <tr>
                      <th className="coi-table-header">Name</th>
                      <th className="coi-table-header">Policy No.</th>
                      <th className="coi-table-header">Policy Start</th>
                      <th className="coi-table-header">Policy End</th>
                      <th className="coi-table-header">Premium</th>
                      <th className="coi-table-header">Status</th>
                      <th className="coi-table-header">Invoice</th>
                      <th className="coi-table-header">Policy</th>
                    
                      <th className="coi-table-header">New Policy Generate</th>
                    
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((proposal, index) => {
                      const policyNo = proposal.Policy_No || proposal.Certificate_Number || '';
                      const isGenerating = generatingPolicies[policyNo];

                      return (
                        <tr key={index} className={index % 2 === 0 ? "coi-table-row-even" : "coi-table-row-odd"}>
                          <td className="coi-table-cell">
                            {proposal.InsuredFullName || `${proposal.InsuredFirstName || ''} ${proposal.InsuredMiddleName || ''} ${proposal.InsuredLastName || ''}`}
                          </td>
                          <td className="coi-table-cell">{policyNo}</td>
                          <td className="coi-table-cell">{formatDate(proposal.PolicyStartDate)}</td>
                          <td className="coi-table-cell">{formatDate(proposal.PolicyEndDate)}</td>
                          <td className="coi-table-cell">₹{parseFloat(proposal.PremiumAmount || proposal.Selected_PremiumAmount || 0).toLocaleString()}</td>
                          <td className="coi-table-cell">
                            <span className="coi-status-badge">
                              {proposal.Payment_Status || 'Approved'}
                            </span>
                          </td>

                          <td className="coi-table-cell">
                            {proposal.Invoice_Url ? (
                              <a
                                href={`${PDF_BASE_URL}${(proposal.Invoice_Url)}`}
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

                          <td className="coi-table-cell">
                            {proposal.Policy_Url ? (
                              <a
                                href={`${PDF_BASE_URL}${(proposal.Policy_Url)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="coi-button1"
                              >
                                <Download size={16} className="mr-1" />
                                Policy
                              </a>
                            ) : (
                              <span style={{ color: '#9ca3af', fontSize: '12px' }}>No Policy</span>
                            )}
                          </td>


                         

                          {/* New Policy Generate Button */}
                          <td className="coi-table-cell">
                            <button
                              onClick={() => newGeneratePolicy(policyNo)}
                              disabled={isGenerating || !policyNo}
                              className="coi-button1"
                              style={{
                                backgroundColor: isGenerating ? '#6b7280' : '#4f46e5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                            >
                              {isGenerating ? (
                                <>
                                  <RefreshCw size={16} className="animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <FileText size={16} />
                                  Generate
                                </>
                              )}
                            </button>
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
                        // If there's a gap in the sequence, show ellipsis
                        if (index > 0 && number - array[index - 1] > 1) {
                          return (
                            <React.Fragment key={`ellipsis-${number}`}>
                              <span className="coi-ellipsis">...</span>
                              <button
                                key={number}
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

export default GenerateCOI;