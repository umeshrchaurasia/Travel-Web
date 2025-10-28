import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
import { calculatePremiumIncluding, calculatePremiumExcluding } from '../../../services/api';
import { useNavigate } from 'react-router-dom';

const PremiumCalculator = ({ agentData, walletStatus }) => {
    const navigate = useNavigate();

    // Calculate the date 3 months ago from the current date
    const getMaxDateOfBirth = () => {
        const now = new Date();
        // Go back 3 months
        now.setMonth(now.getMonth() - 3);
        // Format to YYYY-MM-DD for input element
        return now.toISOString().split('T')[0];
    };

    // Calculate the minimum date of birth (80-81 years ago)
    // const getMinDateOfBirth = () => {
    //     const now = new Date();
    //     // Go back 80-81 years
    //     now.setFullYear(now.getFullYear() - 81);
    //     // Format to YYYY-MM-DD for input element
    //     return now.toISOString().split('T')[0];
    // };

    // Calculate the minimum date of birth to enforce a maximum age of 80 years and 364 days.
    const getMinDateOfBirth = () => {
        const now = new Date();
        // Go back exactly 81 years from today's date.
        now.setFullYear(now.getFullYear() - 81);
        // Add one day. This makes the minimum selectable date the day *after* the 81st birthday.
        // This effectively caps the age at 80 years and 364 days.
        now.setDate(now.getDate() + 1);
        // Format to YYYY-MM-DD for the input element's min attribute
        return now.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState({
        departureDate: '',
        arrivalDate: '',
        numberOfDays: '',
        geographicalCover: 'INCL',
        dateOfBirth: '',
        planAmount: '60000',
        agentid: agentData?.AgentId || 0,
    });

    const handleProceedToProposal = () => {
        // Check if agent is eligible to proceed
        if (walletStatus && !walletStatus.eligibleProposal) {
            // Show ineligibility message - already handled in render logic
            return;
        }

        const radiobtn_selectedAmount = selectedOption === 'full' ? premium : agentcollected;

        const currentWalletAmount = parseFloat(agentData?.Wallet_Amount || 0);

        if (radiobtn_selectedAmount > currentWalletAmount) {
            const shortfall = radiobtn_selectedAmount - currentWalletAmount;
            setError(`Insufficient wallet balance! Required: ₹${radiobtn_selectedAmount.toFixed(0)}, Available: ₹${currentWalletAmount.toFixed(0)}. You need ₹${shortfall.toFixed(0)} more to proceed. Please contact admin to top up your wallet.`);
            return; // Stop execution, don't navigate
        }
        setError('');

        const proposalData = {
            agentDetails: {
                AgentId: agentData.AgentId,
                Agent_Code: agentData.Agent_Code,
                FullName: agentData.FullName,
                EmailID: agentData.EmailID,
                MobileNumber: agentData.MobileNumber,
                Payout: agentData.Payout,
                Paymentmode: paymentmode

            },
            travelDetails: {
                departureDate: formData.departureDate,
                arrivalDate: formData.arrivalDate,
                numberOfDays: formData.numberOfDays,
                geographicalCover: formData.geographicalCover,
                NameofPlan: getNameOfPlan()
            },
            insuranceDetails: {
                dateOfBirth: formData.dateOfBirth,
                planAmount: formData.planAmount,
                premium: premium,
                reliance_premium_amount: reliancePremiumAmount,
                agentCollection: agentcollected,
                radiobtn_selectedOption: selectedOption,
                radiobtn_selectedAmount: radiobtn_selectedAmount,
                selectedOption: selectedOption
            }
        };

        // Store in sessionStorage to persist through navigation
        sessionStorage.setItem('proposalData', JSON.stringify(proposalData));
        navigate('/ProposalDocument');
    };

    const [age, setAge] = useState({ years: 0, months: 0 });
    const [premium, setPremium] = useState(null);
    const [originalPremium, setOriginalPremium] = useState(null);
    const [agentcollected, setagentcollected] = useState(null);
    const [originalAgentCollected, setOriginalAgentCollected] = useState(null);
    const [paymentmode, setpaymentmode] = useState(null);
    const [selectedOption, setSelectedOption] = useState('');
    const [error, setError] = useState('');
    const [lastApiResponse, setLastApiResponse] = useState(null);
    const [showEligibilityMessage, setShowEligibilityMessage] = useState(false);
    const [reliancePremiumAmount, setReliancePremiumAmount] = useState(null);
    // FIX: Added state to control which radio buttons are visible
    const [availableOptions, setAvailableOptions] = useState(new Set());


    const plans = [
        { value: '60000', label: '60,000 USD' },
        { value: '120000', label: '120,000 USD' },
        { value: '300000', label: '300,000 USD' },
        { value: '500000', label: '500,000 USD' },
    ];

    const getNameOfPlan = () => {
        const amountMap = {
            '60000': '60K PLAN',
            '120000': '120K PLAN',
            '300000': '3L PLAN',
            '500000': '5L PLAN'
        };

        const baseLabel = amountMap[formData.planAmount] || '';
        const geo = formData.geographicalCover === 'EXCL' ? 'TRAVEL EXCL USA & CANADA' : 'TRAVEL INCL USA & CANADA';

        return `${geo} ${baseLabel}`;
    };

    // Radio button styles
    const radioStyles = {
        radioGroup: {
            display: 'flex',
            gap: '20px',
            margin: '15px 0',
            justifyContent: 'center'
        },
        radioLabel: {
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            backgroundColor: '#f9fafb'
        },
        radioLabelSelected: {
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '8px 16px',
            border: '2px solid #2563eb',
            borderRadius: '6px',
            backgroundColor: '#eff6ff',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
        },
        radioInput: {
            marginRight: '8px'
        },
        radioText: {
            fontWeight: '500',
            fontSize: '14px'
        }
    };

    const calculateArrivalDate = (departureDate, days) => {
        if (departureDate && days) {
            const departure = new Date(departureDate);
            const arrival = new Date(departure);
            arrival.setDate(departure.getDate() + parseInt(days) - 1);
            return arrival.toISOString().split('T')[0];
        }
        return '';
    };

    const calculateDays = (departureDate, arrivalDate) => {
        if (departureDate && arrivalDate) {
            const departure = new Date(departureDate);
            const arrival = new Date(arrivalDate);
            const diffTime = Math.abs(arrival - departure);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }
        return '';
    };

    // Calculate age effect
    useEffect(() => {
        if (formData.dateOfBirth) {
            const birth = new Date(formData.dateOfBirth);
            const today = new Date();
            let years = today.getFullYear() - birth.getFullYear();
            let months = today.getMonth() - birth.getMonth();

            if (months < 0) {
                years--;
                months += 12;
            }

            setAge({ years, months });
        }
    }, [formData.dateOfBirth]);

    // FIX: This effect now correctly sets the available radio buttons and initial selection
    useEffect(() => {
        if (lastApiResponse && lastApiResponse.MasterData) {
            const data = lastApiResponse.MasterData;
            const apiPaymentMode = data.paymentmode;
            const newOptions = new Set();
            let initialSelectedOption = '';

            if (apiPaymentMode === 'Full Pay' || apiPaymentMode === 'Discount') {
                newOptions.add('full');
                newOptions.add('discount');
                initialSelectedOption = apiPaymentMode === 'Discount' ? 'discount' : 'full';
            } else if (apiPaymentMode === 'Upfront Commission') {
                //  newOptions.add('full');
                newOptions.add('Upfront');
                initialSelectedOption = 'Upfront';
            }

            setAvailableOptions(newOptions);
            setSelectedOption(initialSelectedOption);

            // Set initial amounts based on the default selected option
            if (initialSelectedOption === 'full') {
                setPremium(parseFloat(data.fullpay_amount || data.premium_amount));
                setagentcollected(parseFloat(data.fullpay_agentcollected || data.agentcollected));
            } else if (initialSelectedOption === 'Upfront') {
                setPremium(parseFloat(data.premium_amount));

                setagentcollected(parseFloat(data.upfront_agent_commission));
            }
            else {
                setPremium(parseFloat(data.premium_amount));
                setagentcollected(parseFloat(data.agentcollected));
            }
            setpaymentmode(apiPaymentMode);
        }
    }, [lastApiResponse]);


    // FIX: This is your original handleRadioChange with the NaN bug fixed.
    const handleRadioChange = (e) => {
        const newOption = e.target.value;
        setSelectedOption(newOption);

        if (lastApiResponse) {
            const data = lastApiResponse.MasterData;

            // Set payment mode based on selection for proposal data
            if (newOption === 'full') {
                setpaymentmode('Full Pay');
            } else {
                setpaymentmode(data.paymentmode);
            }

            // Update amounts based on selection
            if (newOption === 'full') {
                // Fallback to premium_amount if fullpay_amount is not present
                setPremium(parseFloat(data.fullpay_amount || data.premium_amount));
                setagentcollected(parseFloat(data.fullpay_agentcollected || data.agentcollected));
            } else if (newOption === 'discount' || newOption === 'Upfront') {
                setPremium(parseFloat(data.premium_amount));

                if (newOption === 'Upfront') {

                    setagentcollected(parseFloat(data.upfront_agent_commission));
                } else {
                    setagentcollected(parseFloat(data.agentcollected));
                }

            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'numberOfDays' && parseInt(value) > 182) {
            setError('Duration cannot exceed 182 days. Please enter a value less than 182 days.');
            return;
        }

        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            if (name === 'departureDate' && newData.numberOfDays) {
                newData.arrivalDate = calculateArrivalDate(newData.departureDate, newData.numberOfDays);
            } else if (name === 'arrivalDate' && newData.departureDate) {
                newData.numberOfDays = calculateDays(newData.departureDate, newData.arrivalDate);
            } else if (name === 'numberOfDays' && newData.departureDate) {
                newData.arrivalDate = calculateArrivalDate(newData.departureDate, newData.numberOfDays);
            }

            if (newData.numberOfDays > 182) {
                setError('Duration cannot exceed 182 days. Please adjust your dates.');
            } else {
                setError('');
            }

            return newData;
        });
    };

    const validateForm = () => {
        if (!formData.departureDate || !formData.arrivalDate || !formData.dateOfBirth || !formData.numberOfDays) {
            setError('Please fill in all required fields');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear previous results
        setLastApiResponse(null);
        setPremium(null);
        setagentcollected(null);
        setError('');

        if (!validateForm()) return;

        if (walletStatus && !walletStatus.eligibleProposal) {
            setShowEligibilityMessage(true);
            return;
        }

        try {
            const payload = {
                duration: parseInt(formData.numberOfDays),
                age_years: age.years,
                age_months: age.months,
                plan_amount: parseFloat(formData.planAmount),
                agentid: parseInt(agentData?.AgentId),
                paymentmode: agentData.Paymentmode
            };

            const response = formData.geographicalCover === 'INCL'
                ? await calculatePremiumIncluding(payload)
                : await calculatePremiumExcluding(payload);

            if (response?.Status === 'Success' && response?.MasterData) {
                setLastApiResponse(response); // This will trigger the useEffect to set states
                if (response.MasterData.reliance_premium_amount) {
                    setReliancePremiumAmount(parseFloat(response.MasterData.reliance_premium_amount));
                }
            } else {
                setError(response?.Message || 'Failed to calculate premium');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Error calculating premium. Please try again.');
        }
    };

    const handleCancel = () => {
        setFormData({
            departureDate: '',
            arrivalDate: '',
            numberOfDays: '',
            geographicalCover: 'INCL',
            dateOfBirth: '',
            planAmount: '60000'
        });
        setPremium(null);
        setagentcollected(null);
        setpaymentmode(null);
        setSelectedOption('');
        setError('');
        setLastApiResponse(null);
        setShowEligibilityMessage(false);
    };

    const renderProceedButton = () => {
        if (walletStatus && !walletStatus.eligibleProposal) {
            return (
                <div style={{ textAlign: 'center' }}>
                    <button disabled={true} style={{ padding: '12px 24px', backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: '6px', cursor: 'not-allowed', fontWeight: '500', opacity: 0.7 }}>
                        Proceed to Proposal
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px', color: '#ef4444', fontSize: '14px' }}>
                        <AlertTriangle size={16} style={{ marginRight: '5px' }} />
                        <span>Wallet update required. Please update your wallet.</span>
                    </div>
                </div>
            );
        }

        return (
            <button onClick={handleProceedToProposal} style={{ padding: '12px 24px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
                Proceed to Proposal
            </button>
        );
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>Travel Insurance Premium Calculator</h2>

            {showEligibilityMessage && (
                <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '15px', borderRadius: '5px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle size={20} />
                    <div><p style={{ fontWeight: 'bold', margin: 0 }}>Wallet Not Eligible</p><p style={{ margin: '5px 0 0 0' }}>Your wallet needs to be updated before calculating premium.</p></div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Departure Date</label><input type="date" name="departureDate" min={new Date().toISOString().split('T')[0]} value={formData.departureDate} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} required /></div>
                    <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Days/Duration</label><input type="number" name="numberOfDays" value={formData.numberOfDays} onChange={handleChange} min="1" max="182" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} required /></div>
                    <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Arrival Date</label><input type="date" name="arrivalDate" min={formData.departureDate || new Date().toISOString().split('T')[0]} value={formData.arrivalDate} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} required /></div>
                    <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Geographical Cover</label><select name="geographicalCover" value={formData.geographicalCover} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} required><option value="INCL">TRAVEL INCL USA & CANADA</option><option value="EXCL">TRAVEL EXCL USA & CANADA</option></select></div>
                    <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Date of Birth</label><input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} max={getMaxDateOfBirth()} min={getMinDateOfBirth()} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} required /></div>
                    <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Available Plans</label><select name="planAmount" value={formData.planAmount} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} required>{plans.map(plan => (<option key={plan.value} value={plan.value}>{plan.label}</option>))}</select></div>
                </div>

                {error && (<div style={{ color: '#dc2626', padding: '10px', backgroundColor: '#fee2e2', borderRadius: '4px', marginBottom: '15px', textAlign: 'center' }}>{error}</div>)}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button className='Premium-btn'  type="submit" >Calculate Premium</button>
                    <button className='apply-btn-emp'  type="button" onClick={handleCancel}>Cancel</button>
                </div>

                {lastApiResponse && (
                    <div style={{ padding: '20px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', marginTop: '20px' }}>
                        <div style={radioStyles.radioGroup}>
                            {availableOptions.has('full') && (
                                <label style={selectedOption === 'full' ? radioStyles.radioLabelSelected : radioStyles.radioLabel}><input type="radio" name="paymentOption" value="full" checked={selectedOption === 'full'} onChange={handleRadioChange} style={radioStyles.radioInput} /><span style={radioStyles.radioText}>Full Pay</span></label>
                            )}
                            {availableOptions.has('discount') && (
                                <label style={selectedOption === 'discount' ? radioStyles.radioLabelSelected : radioStyles.radioLabel}><input type="radio" name="paymentOption" value="discount" checked={selectedOption === 'discount'} onChange={handleRadioChange} style={radioStyles.radioInput} /><span style={radioStyles.radioText}>Discount</span></label>
                            )}
                            {availableOptions.has('Upfront') && (
                                <label style={selectedOption === 'Upfront' ? radioStyles.radioLabelSelected : radioStyles.radioLabel}><input type="radio" name="paymentOption" value="Upfront" checked={selectedOption === 'Upfront'} onChange={handleRadioChange} style={radioStyles.radioInput} /><span style={radioStyles.radioText}>Upfront Commission</span></label>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '20px', flexWrap: 'wrap', textAlign: 'center' }}>
                            {premium !== null && (
                                <div style={{ padding: '15px 25px', borderRadius: '8px', backgroundColor: '#ecfdf5', border: '2px solid #10b981', transition: 'all 0.3s ease' }}>
                                    <span style={{ fontSize: '18px', fontWeight: '500', color: '#047857' }}>Assistance charges (Incl GST)<br /><b>₹{premium.toFixed(0)}</b></span>
                                </div>
                            )}
                            {(selectedOption === 'full' || selectedOption === 'discount') && agentcollected !== null && (
                                <div style={{ padding: '15px 25px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '2px solid #ef4444', transition: 'all 0.3s ease' }}>
                                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#b91c1c' }}>To be collected from Agent<br /><b>₹{agentcollected.toFixed(0)}</b></span>
                                </div>
                            )}
                            {selectedOption === 'Upfront' && agentcollected !== null && (
                                <div style={{ padding: '15px 25px', borderRadius: '8px', backgroundColor: '#f5f3ff', border: '2px solid #7c3aed', transition: 'all 0.3s ease' }}>
                                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#6d28d9' }}>Agent to be collected<br /><b>₹{agentcollected.toFixed(0)}</b></span>
                                </div>
                            )}
                        </div>

                        <div style={{ paddingTop: '30px', display: 'flex', justifyContent: 'center' }}>
                            {renderProceedButton()}
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default PremiumCalculator;
