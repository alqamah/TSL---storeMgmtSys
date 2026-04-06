import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { itemsAPI, employeesAPI, issuesAPI } from '../api';
import {
  HiOutlineCube,
  HiOutlineUsers,
  HiOutlineClipboardList,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    items: 0,
    employees: 0,
    activeIssues: 0,
    overdueItems: 0,
  });
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [itemsRes, employeesRes, activeRes, allIssuesRes] = await Promise.all([
        itemsAPI.getAll(),
        employeesAPI.getAll(),
        issuesAPI.getActive(),
        issuesAPI.getAll(),
      ]);

      // Count overdue items (next_due_date in the past)
      const now = new Date();
      const overdueCount = itemsRes.data.filter(
        (item) => item.next_due_date && new Date(item.next_due_date) < now
      ).length;

      setStats({
        items: itemsRes.data.length,
        employees: employeesRes.data.length,
        activeIssues: activeRes.data.length,
        overdueItems: overdueCount,
      });

      setRecentIssues(allIssuesRes.data.slice(0, 8));
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              {user ? `Welcome, ${user.name}` : 'Dashboard'}
            </h1>
            <p className="page-subtitle">Store management overview</p>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <HiOutlineCube />
            </div>
            <div>
              <div className="stat-value">{stats.items}</div>
              <div className="stat-label">Total Items</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <HiOutlineUsers />
            </div>
            <div>
              <div className="stat-value">{stats.employees}</div>
              <div className="stat-label">Employees</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon amber">
              <HiOutlineClipboardList />
            </div>
            <div>
              <div className="stat-value">{stats.activeIssues}</div>
              <div className="stat-label">Active Issues</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon red">
              <HiOutlineExclamationCircle />
            </div>
            <div>
              <div className="stat-value">{stats.overdueItems}</div>
              <div className="stat-label">Overdue Items</div>
            </div>
          </div>
        </div>

        {/* Recent Issues Table */}
        <div className="table-container">
          <div className="table-toolbar">
            <h2 className="card-title">Recent Issues</h2>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Items</th>
                  <th>Issue Date</th>
                  <th>Status</th>
                  <th>Issuer</th>
                </tr>
              </thead>
              <tbody>
                {recentIssues.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                      No issues recorded yet
                    </td>
                  </tr>
                ) : (
                  recentIssues.map((issue) => (
                    <tr key={issue._id}>
                      <td style={{ color: 'var(--text-primary)' }}>
                        {issue.employee?.name || '—'}
                        <br />
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                          {issue.employee?.p_no}
                        </span>
                      </td>
                      <td>
                        {issue.items?.map((i, idx) => (
                          <div key={idx} style={{ fontSize: 'var(--font-xs)' }}>
                            {i.item?.title || 'Unknown'} ×{i.quantity}
                          </div>
                        ))}
                      </td>
                      <td>{formatDate(issue.issue_date)}</td>
                      <td>
                        {issue.return_date ? (
                          <span className="badge badge-green">Returned</span>
                        ) : (
                          <span className="badge badge-amber">Active</span>
                        )}
                      </td>
                      <td>{issue.issuer_p_no}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
