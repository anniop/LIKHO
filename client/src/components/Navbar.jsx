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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Left side logo */}
        <Link
          to={isAuthenticated ? '/notes' : '/login'}
          style={{ textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem' }}
        >
          MyNotes
        </Link>

        {/* Right side navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          
          {isAuthenticated ? (
            <>
              {/* Links for authenticated user */}
              <Link to="/notes" style={{ textDecoration: 'none' }}>Notes</Link>
              <Link to="/trash" style={{ textDecoration: 'none' }}>Trash</Link>

              {/* User name */}
              <span>{user?.name || user?.email}</span>

              {/* Logout button */}
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              {/* Links when logged out */}
              <Link to="/login" style={{ textDecoration: 'none' }}>Login</Link>
              <Link to="/register" style={{ textDecoration: 'none' }}>Register</Link>
            </>
          )}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;

