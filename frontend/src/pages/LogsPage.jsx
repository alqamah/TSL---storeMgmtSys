import { useState, useEffect } from 'react';
import { logsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { HiOutlineUser, HiOutlineClock, HiOutlineDocumentText } from 'react-icons/hi';

export default function LogsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadLogs();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await logsAPI.getAll();
      setLogs(res.data);
    } catch (err) {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="page-body">
        <div className="empty-state">
          <HiOutlineUser className="icon" />
          <p>Access denied: You must be an administrator to view logs.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Admin Logs</h1>
            <p className="page-subtitle">Track system events and user actions</p>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '200px' }}>Timestamp</th>
                  <th style={{ width: '150px' }}>User</th>
                  <th style={{ width: '180px' }}>Action</th>
                  <th style={{ width: '100px' }}>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <HiOutlineDocumentText className="icon" />
                        <p>No logs found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <HiOutlineClock /> {formatDate(log.createdAt)}
                        </div>
                      </td>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {log.user ? `${log.user.name} (${log.user.p_no})` : 'System / Unknown'}
                      </td>
                      <td>
                        <span className="badge badge-primary">{log.action}</span>
                      </td>
                      <td>
                        {log.target_type}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </td>
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
