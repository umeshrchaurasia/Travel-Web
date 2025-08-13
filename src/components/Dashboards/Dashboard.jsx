import React, { useState, useEffect } from 'react';
import AgentList from './AgentList';

function Dashboard({ userData, onLogout }) {
  return (
    <div className="dashboard-container">
      <div className="user-info">
        <h2>Welcome, {userData.FullName}</h2>
        <p>Employee ID: {userData.UId}</p>
        <p>Email: {userData.EmailID}</p>
        <p>Employee Type: {userData.EMPType}</p>
        <button onClick={onLogout}>Logout</button>
      </div>
      <AgentList uId={userData.UId} />
    </div>
  );
}

export default Dashboard;