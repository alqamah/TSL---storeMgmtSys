import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlineUsers,
  HiOutlineClipboardList,
  HiOutlineLogout,
  HiOutlineLogin,
} from 'react-icons/hi';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: <HiOutlineViewGrid />, label: 'Dashboard' },
    { to: '/items', icon: <HiOutlineCube />, label: 'Items' },
    { to: '/employees', icon: <HiOutlineUsers />, label: 'Employees' },
    { to: '/issues', icon: <HiOutlineClipboardList />, label: 'Issues' },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
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
        <Outlet />
      </main>
    </div>
  );
}
