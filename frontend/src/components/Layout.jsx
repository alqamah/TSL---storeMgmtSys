import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { itemsAPI, issuesAPI } from '../api';
import {
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlineClipboardList,
  HiOutlineLogout,
  HiOutlineLogin,
  HiOutlineExclamationCircle,
  HiOutlineDocumentText,
} from 'react-icons/hi';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    items: 0,
    activeIssues: 0,
    overdueItems: 0,
  });

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const [itemsRes, activeRes] = await Promise.all([
        itemsAPI.getAll(),
        issuesAPI.getActive(),
      ]);

      const now = new Date();
      const overdueCount = itemsRes.data.filter(
        (item) => item.next_due_date && new Date(item.next_due_date) < now
      ).length;

      setStats({
        items: itemsRes.data.length,
        activeIssues: activeRes.data.length,
        overdueItems: overdueCount,
      });
    } catch (err) {
      console.error('Stats load error:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/items', icon: <HiOutlineCube />, label: 'Items' },
    { to: '/issues', icon: <HiOutlineClipboardList />, label: 'Issues' },
  ];

  if (user && user.role === 'admin') {
    navItems.push({ to: '/logs', icon: <HiOutlineDocumentText />, label: 'Logs' });
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div 
          className="sidebar-header" 
          onClick={() => navigate('/')} 
          style={{ cursor: 'pointer' }}
        >
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">📦</div>
            <div>
              <div className="sidebar-logo-text">StoreMgmt</div>
              <div className="sidebar-logo-sub">Management System</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <>
              <div className="sidebar-user">
                <div className="sidebar-user-avatar">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name">{user.name}</div>
                  <div className="sidebar-user-role">{user.role}</div>
                </div>
              </div>
              <button
                className="sidebar-link"
                onClick={handleLogout}
                style={{ marginTop: '0.5rem' }}
              >
                <span className="icon">
                  <HiOutlineLogout />
                </span>
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="sidebar-link">
              <span className="icon">
                <HiOutlineLogin />
              </span>
              Login
            </NavLink>
          )}
        </div>
      </aside>

      <main className="main-content">
        <Outlet context={{ stats, loadStats }} />
      </main>
    </div>
  );
}
