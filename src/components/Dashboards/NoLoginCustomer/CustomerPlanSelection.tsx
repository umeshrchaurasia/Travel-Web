import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserCircle, Mail, FileText, Heart, ArrowRight } from 'lucide-react';
import { getAgentByAgentCode } from '../../../services/api';

// Importing your existing CSS (remains unchanged)
import '../PlanSelection/PlanSelection.css';
import logo from '../../../../src/assets/img/TravelAssist_practo.webp';

import ayushlogo from '../../../../src/assets/img/ayushlogo.png';

// FIXED: Use the typed hooks instead of regular useDispatch
import { useAppDispatch } from '../../../redux/NoLoginCustomer/hooks';
import { customerAgentData } from '../../../redux/NoLoginCustomer/agentSlice';

const CustomerPlanSelection = () => {

    // FIXED: Use useAppDispatch instead of useDispatch<AppDispatch>
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { Agent_Code } = useParams<{ Agent_Code: string }>();

    const [agentData, setAgentData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAgent = async () => {
            if (Agent_Code) {
                try {
                    const response = await getAgentByAgentCode(Agent_Code);
                    if (response.Status === 'Success' && response.MasterData?.length > 0) {
                        setAgentData(response.MasterData[0]);
                    }
                } catch (error) { console.error('Error fetching agent:', error); }
            }
            setLoading(false);
        };
        fetchAgent();
    }, [Agent_Code]);

    const navigateToDetails = (plan: string) => {

        if (!agentData) return;
        // 4. Construct data object
        const dataToSave = {
            PlanSelection: plan,
            agentEmail: agentData.EmailID || "",
            UId: agentData.UId || "",
            agentId: agentData.AgentId || null,
            FullName: agentData.FullName || ""
        };

        // 5. DISPATCH - Now this will work correctly
        dispatch(customerAgentData(dataToSave));

        // NAVIGATE: No longer need to pass "state: {}" here
        navigate(`/CustomerDetails/`);
    };

    if (loading) return <div className="loading-container">Loading...</div>;
    if (!agentData) return <div className="loading-container">Invalid Agent Link.</div>;

    return (
        <div style={commonStyles.container}>
            {/* NEW SCOPED CSS: Using a unique class name to avoid touching existing PlanSelection.css */}
            <style>
                {`
                .customer-selection-card {
                    background: #ffffff;
                    border-radius: 0.75rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
                    padding: 2.5rem;
                    width: 470px; /* Specific width as requested */
                    text-align: center;
                    cursor: pointer;
                    border: 1px solid #e0e0e0;
                    border-top: 4px solid #e0e0e0;
                    transition: all 0.3s ease;
                    overflow: hidden;
                    position: relative;
                }

                /* Practo Hover Effect (Purple) */
                .practo-hover-card:hover {
                    border: 2px solid #6c63ff !important;
                    border-top: 4px solid #6c63ff !important;
                    background-color: #f5f3ff !important;
                    transform: translateY(-10px);
                    box-shadow: 0 10px 20px rgba(108, 99, 255, 0.2) !important;
                }

                /* AyushPay Hover Effect (Pink) */
                .ayush-hover-card:hover {
                    border: 2px solid #ec4899 !important;
                    border-top: 4px solid #ec4899 !important;
                    background-color: #fdf2f8 !important;
                    transform: translateY(-10px);
                    box-shadow: 0 10px 20px rgba(236, 72, 153, 0.2) !important;
                }

                /* Active/Selected Animation */
                .customer-selection-card:active {
                    transform: scale(0.97);
                    opacity: 0.9;
                }
                `}
            </style>

            <header style={commonStyles.header}>
                <div style={commonStyles.headerContent}>
                    <div style={commonStyles.leftSection}><img src={logo} alt="Logo" style={{ maxHeight: '60px' }} /></div>
                    <div style={commonStyles.centerSection}>
                        <div className="logo  align-items-center w-auto">
                            <span className="logo-text" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Zextra Wellness</span>
                        </div></div>
                    <div style={commonStyles.rightSection}></div>
                </div>
            </header>

            <main style={commonStyles.mainContent1}>
                <div className="card">
                    <div className="card-header"><h2 className="welcome-title">Welcome, {agentData.FullName}</h2></div>
                    <div className="employee-info">
                        <div className="info-row">
                            <div className="info-item" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
                                <UserCircle className="inline mr-2" /> Agent Code: {agentData.Agent_Code}
                                <Mail className="inline ml-4 mr-2" /> {agentData.EmailID}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h4 style={{
                        textAlign: 'center',
                        margin: '2rem 0',
                        color: '#6c63ff',
                        fontWeight: '700',
                        letterSpacing: '-0.02em',
                        lineHeight: '1.1'
                    }}>
                        Access to doctors has never been easier — plus enjoy great discounts on medicines and diagnostics
                    </h4>
                    <p style={{ fontSize: '1.1rem', color: '#4b5563', maxWidth: '700px', margin: '0 auto' }}>
                        <h3 style={{
                            textAlign: 'center',
                            margin: '2rem 0',
                            color: '#6c63ff',
                            fontWeight: '700',
                            letterSpacing: '-0.02em',
                            lineHeight: '1.1'
                        }}><span style={{ color: '#1c8721' }}>Choose your plan</span>
                        </h3>   </p>
                </div>
                <div className="selection-container" style={{ marginTop: '-3rem', display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>

                    {/* Card 1: Practo Subscription */}
                    <div
                        className="customer-selection-card practo-hover-card"
                        onClick={() => navigateToDetails('PractoSubscription')}>
                        <div style={commonStyles.leftSection}><img src={logo} alt="Logo" style={{ maxHeight: '60px' }} /></div>

                        <h3>Practo Subscription</h3>
                        <p style={{ fontWeight: 'bold', color: '#6c63ff' }}>(Rs. 699 + 18% GST)</p>

                        <div style={benefitListStyle}>
                            <p>✓ Covers up to 2 adults and 1 kid under one subscription</p>
                            <p>✓ Unlimited chat, audio, and video consultations with doctors</p>
                            <p>✓ One free, in-person OPD consultation per year at any Practo Cashless Network clinic</p>
                            <p>✓ Discount on diagnostic tests up to 20% and medicines up to 5%</p>
                            <p>-</p><p>-</p>
                        </div>

                        <button className="ayush-premium-btn" style={{ width: '100%', marginTop: '1.5rem', backgroundColor: '#6c63ff' }}>
                            Click Here <ArrowRight size={18} className="inline ml-2" />
                        </button>
                    </div>

                    {/* Card 2: AyushPay Subscription */}
                    <div
                        className="customer-selection-card ayush-hover-card"
                        onClick={() => navigateToDetails('AyushPayHealth')}
                    >

                        <div style={commonStyles.leftSection}><img src={logo} alt="Logo" style={{ maxHeight: '60px' }} /></div>


                        <h3>Medical Emergency Landing</h3>
                        <p style={{ fontWeight: 'bold', color: '#ec4899' }}>(Rs. 499 + 18% GST)</p>

                        <div style={benefitListStyle}>
                            <p>✓ Covers up to 2 adults under one subscription</p>
                            <p>✓ Unlimited video consultations with doctors (General Physicians only)</p>
                            <p>✓ No, in-person OPD consultation available</p>
                            <p>✓ Discount on diagnostic tests and medicines up to 25%</p>
                            <p>✓ 0% Interest Medical Loans up to 1 year - Max ₹15 Lakhs.Subject to min CIBIL score of rs.650+</p>
                            <p>✓ Max 10% Cashback on Hospital Treatment cost</p>
                            <p>✓ ₹500 per day Hospital Admission Allowance (Max 3 days)</p>
                            <p>✓ ₹5,00 Health Wallet Credit on the above subscription</p>
                        </div>

                        <button className="ayush-premium-btn" style={{ width: '100%', marginTop: '1.5rem', backgroundColor: '#ec4899' }}>
                            Click Here <ArrowRight size={18} className="inline ml-2" />
                        </button>
                        <footer style={{marginTop:'1.5rem'}}>
                        
                          <p>  <img src={ayushlogo} style={{ maxHeight: '20px' }}/> powered by Ayushpay</p>
                        </footer>
                    </div>
                </div>
            </main>
            <footer className="footer">
                <p>© {new Date().getFullYear()} Interstellar Services Pvt. Ltd., All rights reserved</p>
            </footer>
        </div>
    );
};

// Inline benefit styles
const benefitListStyle = {
    textAlign: 'left' as const,
    marginTop: '15px',
    padding: '10px',
    background: '#f9fafb',
    borderRadius: '8px',
    fontSize: '0.85rem',
    lineHeight: '1.6'
};

const commonStyles: any = {
    container: { backgroundColor: '#f3f4f6', minHeight: '100vh' },
    header: { backgroundColor: '#6c63ff', padding: '1rem', color: 'white' },
    headerContent: { maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center' },
    leftSection: { flex: 1 },
    centerSection: { flex: 2, textAlign: 'center' },
    rightSection: { flex: 1 },
    mainContent1: { maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }
};

export default CustomerPlanSelection;