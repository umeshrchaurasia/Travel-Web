import React, { useState, useEffect } from 'react';
import { fetchAgentsList } from '../../services/api';

function AgentList({ uId }) {
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        setLoading(true);
        const result = await fetchAgentsList(uId);
        if (result.Status === 'Success') {
          setAgents(result.MasterData);
        } else {
          setError(result.Message || 'Failed to fetch agents');
        }
      } catch (err) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, [uId]);

  if (loading) return <div>Loading agents...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="agent-list-container">
      <h3>Agent List</h3>
      <table>
        <thead>
          <tr>
            <th>Agent ID</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Gender</th>
            <th>Date of Birth</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {agents.map(agent => (
            <tr key={agent.AgentId}>
              <td>{agent.AgentId}</td>
              <td>{agent.FullName}</td>
              <td>{agent.EmailID}</td>
              <td>{agent.MobileNumber}</td>
              <td>{agent.Gender}</td>
              <td>{new Date(agent.DOB).toLocaleDateString()}</td>
              <td>{agent.isactive ? 'Active' : 'Inactive'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AgentList;