import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import ItemsPage from './pages/ItemsPage';
import { Navigate } from 'react-router-dom';
import IssuesPage from './pages/IssuesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LogsPage from './pages/LogsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Auth pages — no sidebar */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Main app — with sidebar */}
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/items" replace />} />
              <Route path="/items" element={<ItemsPage />} />

              <Route path="/issues" element={<IssuesPage />} />
              
              <Route path="/logs" element={<LogsPage />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
