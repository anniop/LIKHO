import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ padding: '10px 20px', borderBottom: '1px solid #ddd' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Link to={isAuthenticated ? '/notes' : '/login'} style={{ textDecoration: 'none' }}>
          <strong>MyNotes</strong>
        </Link>
        <div>
          {isAuthenticated ? (
            <>
              <span style={{ marginRight: '10px' }}>
                {user?.name || user?.email}
              </span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ marginRight: '10px' }}>Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
