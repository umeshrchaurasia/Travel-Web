import React from 'react';
import { Link } from 'react-router-dom';

function Sidebar({ userData }) {
  const menuItems = {
    Admin: [
      { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
      { label: 'Agents', icon: 'people', path: '/agents' },
      { label: 'Reports', icon: 'report', path: '/reports' }
    ],
    Emp: [
      { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
      { label: 'My Agents', icon: 'people', path: '/my-agents' },
      { label: 'Profile', icon: 'person', path: '/profile' }
    ],
    Agent: [
      { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
      { label: 'Clients', icon: 'clients', path: '/clients' },
      { label: 'Performance', icon: 'chart', path: '/performance' }
    ]
  };

  const userMenuItems = menuItems[userData.EMPType] || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>{userData.FullName}</h3>
        <p>{userData.EMPType} Profile</p>
      </div>
      <nav className="sidebar-menu">
        {userMenuItems.map((item, index) => (
          <Link 
            key={index} 
            to={item.path} 
            className="sidebar-menu-item"
          >
            <span className={`icon icon-${item.icon}`}></span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;