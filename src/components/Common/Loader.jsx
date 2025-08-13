import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Spinner from './Spinner';

function Loader() {
  const { loading } = useAuth();

  if (!loading) return null;

  return (
    <div className="global-loader">
      <Spinner />
    </div>
  );
}

function Spinner() {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
    </div>
  );
}

export default Loader;