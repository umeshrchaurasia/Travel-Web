import React from 'react';

function Header({ userData, onLogout }) {
  return (
    <header className="main-header">
      <div className="header-logo">
        Employee Management
      </div>
      <div className="header-user">
        <span>{userData.FullName}</span>
        <button onClick={onLogout} className="btn-logout">Logout</button>
      </div>
    </header>
  );
}

export default Header;