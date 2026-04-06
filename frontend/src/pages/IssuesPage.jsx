import { useState, useEffect } from 'react';
import { issuesAPI, itemsAPI, employeesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineReply,
  HiOutlineX,
  HiOutlineClipboardList,
  HiOutlineTrash,
} from 'react-icons/hi';

export default function IssuesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState('all'); // all | active | returned
  const [loading, setLoading] = useState(true);

  // Issue modal state
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [allItems, setAllItems] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [issueForm, setIssueForm] = useState({
    employee: '',
    issuer_p_no: '',
    items: [{ item: '', quantity: 1 }],
  });

  // Return modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returningIssue, setReturningIssue] = useState(null);

  useEffect(() => {
    loadIssues();
  }, [filter]);

  const loadIssues = async () => {
    try {
      const params = {};
      if (filter === 'active') params.status = 'active';
      if (filter === 'returned') params.status = 'returned';
      const res = await issuesAPI.getAll(params);
      setIssues(res.data);
    } catch {
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const openIssueModal = async () => {
    try {
      const [itemsRes, empRes] = await Promise.all([
        itemsAPI.getAll(),
        employeesAPI.getAll(),
      ]);
      setAllItems(itemsRes.data);
      setAllEmployees(empRes.data);
      setIssueForm({
        employee: '',
        issuer_p_no: user?.p_no || '',
        items: [{ item: '', quantity: 1 }],
      });
      setIssueModalOpen(true);
    } catch {
      toast.error('Failed to load data');
    }
  };

  const addItemRow = () => {
    setIssueForm({
      ...issueForm,
      items: [...issueForm.items, { item: '', quantity: 1 }],
    });
  };

  const removeItemRow = (index) => {
    if (issueForm.items.length <= 1) return;
    setIssueForm({
      ...issueForm,
      items: issueForm.items.filter((_, i) => i !== index),
    });
  };

  const updateItemRow = (index, field, value) => {
    const updated = [...issueForm.items];
    updated[index] = { ...updated[index], [field]: value };
    setIssueForm({ ...issueForm, items: updated });
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    try {
      await issuesAPI.create({
        employee: issueForm.employee,
        issuer_p_no: issueForm.issuer_p_no,
        items: issueForm.items.map((i) => ({
          item: i.item,
          quantity: Number(i.quantity),
        })),
      });
      toast.success('Items issued successfully');
      setIssueModalOpen(false);
      loadIssues();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Issue failed');
    }
  };

  const openReturnModal = (issue) => {
    setReturningIssue(issue);
    setReturnModalOpen(true);
  };

  const handleReturnAll = async () => {
    try {
      await issuesAPI.returnItem(returningIssue._id, {});
      toast.success('All items returned');
      setReturnModalOpen(false);
      loadIssues();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Return failed');
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
            <h1 className="page-title">Issues</h1>
            <p className="page-subtitle">Track item issuance and returns</p>
          </div>
          {user && (
            <button id="issue-item-btn" className="btn btn-primary" onClick={openIssueModal}>
              <HiOutlinePlus /> Issue Items
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        <div className="table-container">
          <div className="table-toolbar">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['all', 'active', 'returned'].map((f) => (
                <button
                  key={f}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Items Issued</th>
                  <th>Issue Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                  <th>Issuer</th>
                  {user && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={user ? 7 : 6}>
                      <div className="empty-state">
                        <HiOutlineClipboardList className="icon" />
                        <p>No issues found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  issues.map((issue) => (
                    <tr key={issue._id}>
                      <td style={{ color: 'var(--text-primary)' }}>
                        {issue.employee?.name || '—'}
                        <br />
                        <span
                          style={{
                            fontSize: 'var(--font-xs)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {issue.employee?.p_no}
                        </span>
                      </td>
                      <td>
                        {issue.items?.map((i, idx) => (
                          <div
                            key={idx}
                            style={{
                              fontSize: 'var(--font-xs)',
                              marginBottom: '0.15rem',
                            }}
                          >
                            <span style={{ color: 'var(--text-primary)' }}>
                              {i.item?.title || 'Unknown'}
                            </span>
                            {' '}
                            <span className="badge badge-blue">
                              {i.returned_quantity}/{i.quantity}
                            </span>
                          </div>
                        ))}
                      </td>
                      <td>{formatDate(issue.issue_date)}</td>
                      <td>{formatDate(issue.return_date)}</td>
                      <td>
                        {issue.return_date ? (
                          <span className="badge badge-green">Returned</span>
                        ) : (
                          <span className="badge badge-amber">Active</span>
                        )}
                      </td>
                      <td>{issue.issuer_p_no}</td>
                      {user && (
                        <td>
                          {!issue.return_date && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => openReturnModal(issue)}
                              title="Return"
                            >
                              <HiOutlineReply /> Return
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Issue Modal ─────────────────────────── */}
      {issueModalOpen && (
        <div className="modal-overlay" onClick={() => setIssueModalOpen(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Issue Items to Employee</h2>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setIssueModalOpen(false)}
              >
                <HiOutlineX />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Employee *</label>
                    <select
                      className="form-select"
                      value={issueForm.employee}
                      onChange={(e) =>
                        setIssueForm({ ...issueForm, employee: e.target.value })
                      }
                      required
                    >
                      <option value="">Select employee...</option>
                      {allEmployees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} ({emp.p_no})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Issuer P.No *</label>
                    <input
                      className="form-input"
                      value={issueForm.issuer_p_no}
                      onChange={(e) =>
                        setIssueForm({ ...issueForm, issuer_p_no: e.target.value })
                      }
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <label className="form-label" style={{ margin: 0 }}>
                      Items to Issue *
                    </label>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={addItemRow}
                    >
                      <HiOutlinePlus /> Add Item
                    </button>
                  </div>

                  {issueForm.items.map((row, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                        alignItems: 'end',
                      }}
                    >
                      <div className="form-group" style={{ flex: 3 }}>
                        <select
                          className="form-select"
                          value={row.item}
                          onChange={(e) =>
                            updateItemRow(index, 'item', e.target.value)
                          }
                          required
                        >
                          <option value="">Select item...</option>
                          {allItems
                            .filter((it) => it.quantity > 0)
                            .map((it) => (
                              <option key={it._id} value={it._id}>
                                {it.title} ({it.sap_id}) — Qty: {it.quantity}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <input
                          className="form-input"
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) =>
                            updateItemRow(index, 'quantity', e.target.value)
                          }
                          placeholder="Qty"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => removeItemRow(index)}
                        disabled={issueForm.items.length <= 1}
                        style={{ flexShrink: 0 }}
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIssueModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Issue Items
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Return Modal ────────────────────────── */}
      {returnModalOpen && returningIssue && (
        <div className="modal-overlay" onClick={() => setReturnModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Return Items</h2>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setReturnModalOpen(false)}
              >
                <HiOutlineX />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Returning items issued to{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {returningIssue.employee?.name}
                </strong>{' '}
                ({returningIssue.employee?.p_no})
              </p>

              <div className="table-wrapper" style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Issued</th>
                      <th>Returned</th>
                      <th>Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returningIssue.items.map((i, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-primary)' }}>
                          {i.item?.title || 'Unknown'}
                        </td>
                        <td>{i.quantity}</td>
                        <td>{i.returned_quantity}</td>
                        <td>
                          <span
                            className={`badge ${
                              i.quantity - i.returned_quantity > 0
                                ? 'badge-amber'
                                : 'badge-green'
                            }`}
                          >
                            {i.quantity - i.returned_quantity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => setReturnModalOpen(false)}
              >
                Cancel
              </button>
              <button className="btn btn-success" onClick={handleReturnAll}>
                <HiOutlineReply /> Return All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
