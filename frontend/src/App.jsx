import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import ItemsPage from './pages/ItemsPage';
import IssuesPage from './pages/IssuesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PublicItemsPage from './pages/PublicItemsPage';

function HomeRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  if (user) return <Navigate to="/items" replace />;
  if (location.pathname === '/') return <Navigate to="/catalog" replace />;
  return null;
}
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
          <Routes>
            {/* Auth pages — no sidebar */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Main app — with sidebar */}
            <Route element={<Layout />}>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/catalog" element={<PublicItemsPage />} />
              <Route path="/items" element={<ItemsPage />} />

              <Route path="/issues" element={<IssuesPage />} />
            </Route>
          </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
