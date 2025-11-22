// client/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotesPage from './pages/NotesPage';
import NoteEditorPage from './pages/NoteEditorPage';
import Navbar from './components/Navbar';
import TrashPage from './pages/TrashPage';
import ShareView from './pages/ShareView';

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      <Navbar />

      {/* Centered main content container */}
      <main
        style={{
          maxWidth: '900px',
          margin: '20px auto',
        }}
      >
        <Routes>
          {/* Default: go to notes if logged in, otherwise login */}
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/notes" /> : <Navigate to="/login" />}
          />

          {/* Auth routes */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/notes" /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/notes" /> : <RegisterPage />}
          />

          {/* Protected routes */}
          <Route
            path="/notes"
            element={isAuthenticated ? <NotesPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/notes/:id"
            element={isAuthenticated ? <NoteEditorPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/trash"
            element={isAuthenticated ? <TrashPage /> : <Navigate to="/login" />}
          />

          {/* Public shared view (no auth) */}
          <Route path="/share/:publicId" element={<ShareView />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;

