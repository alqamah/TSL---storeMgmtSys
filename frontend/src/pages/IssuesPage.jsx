import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { issuesAPI, itemsAPI } from '../api';
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
  const { stats, loadStats } = useOutletContext() || { stats: {} };
  const { user } = useAuth();
  const toast = useToast();
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState('all'); // all | active | returned
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  // Issue modal state
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [allItems, setAllItems] = useState([]);

  const [issueForm, setIssueForm] = useState({
    employee_p_no: '',
    employee_name: '',
    employee_phone: '',
    vendor_supervisor_name: '',
    vendor_supervisor_gatepass_no: '',
    job_location: '',
    issuer_p_no: '',
    issue_date: new Date().toISOString().split('T')[0],
    expected_return_date: '',
    remarks: '',
    items: [{ item: '', quantity: 1, search: '' }],
    is_permanent: false,
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
      if (filter === 'permanent') params.status = 'permanent';
      const res = await issuesAPI.getAll(params);
      setIssues(res.data);
      if (loadStats) loadStats();
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.messages?.length ? data.messages.join(' | ') : (data?.error || 'Failed to load issues'));
    } finally {
      setLoading(false);
    }
  };

  const openIssueModal = async () => {
    try {
      const itemsRes = await itemsAPI.getAll();
      setAllItems(itemsRes.data);
      setIssueForm({
        employee_p_no: '',
        employee_name: '',
        employee_phone: '',
        vendor_supervisor_name: '',
        vendor_supervisor_gatepass_no: '',
        job_location: '',
        issuer_p_no: user?.p_no || '',
        issue_date: new Date().toISOString().split('T')[0],
        expected_return_date: '',
        remarks: '',
        items: [{ item: '', quantity: 1, search: '' }],
        is_permanent: false,
      });
      setIssueModalOpen(true);
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.messages?.length ? data.messages.join(' | ') : (data?.error || 'Failed to load items'));
    }
  };

  const addItemRow = () => {
    setIssueForm({
      ...issueForm,
      items: [...issueForm.items, { item: '', quantity: 1, search: '' }],
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
    if (!issueForm.is_permanent && issueForm.expected_return_date && new Date(issueForm.expected_return_date) < new Date(issueForm.issue_date)) {
      toast.error('Expected return date cannot be before issue date');
      return;
    }

    try {
      await issuesAPI.create({
        employee_p_no: issueForm.employee_p_no,
        employee_name: issueForm.employee_name,
        employee_phone: issueForm.employee_phone,
        vendor_supervisor_name: issueForm.vendor_supervisor_name,
        vendor_supervisor_gatepass_no: issueForm.vendor_supervisor_gatepass_no,
        job_location: issueForm.job_location,
        issuer_p_no: issueForm.issuer_p_no,
        remarks: issueForm.remarks,
        items: issueForm.items.map((i) => ({
          item: i.item,
          quantity: Number(i.quantity),
        })),
        issue_date: issueForm.issue_date,
        expected_return_date: (issueForm.is_permanent ? null : issueForm.expected_return_date) || null,
        is_permanent: issueForm.is_permanent,
      });
      toast.success('Items issued successfully');
      setIssueModalOpen(false);
      loadIssues();
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.messages?.length ? data.messages.join(' | ') : (data?.error || 'Issue failed'));
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
      const data = err.response?.data;
      toast.error(data?.messages?.length ? data.messages.join(' | ') : (data?.error || 'Return failed'));
    }
  };

  const handleDelete = async (issueId) => {
    if (!window.confirm('Are you sure you want to delete this issue? Stock will be restored for un-returned items.')) {
      return;
    }
    try {
      await issuesAPI.delete(issueId);
      toast.success('Issue deleted and stock restored');
      loadIssues();
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.messages?.length ? data.messages.join(' | ') : (data?.error || 'Deletion failed'));
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

  const displayedIssues = issues.filter(issue => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const empName = (issue.employee_name || '').toLowerCase();
    const empPno = (issue.employee_p_no || '').toLowerCase();
    const issuerPno = (issue.issuer_p_no || '').toLowerCase();
    const itemsStr = (issue.items || []).map(i => i.item?.title || '').join(' ').toLowerCase();
    const remarks = (issue.remarks || '').toLowerCase();
    
    return empName.includes(q) || 
           empPno.includes(q) || 
           issuerPno.includes(q) || 
           itemsStr.includes(q) || 
           remarks.includes(q);
  });

  const isAllSelected = displayedIssues.length > 0 && selected.length === displayedIssues.length;
  
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(displayedIssues.map(i => i._id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (e, id) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelected([...selected, id]);
    } else {
      setSelected(selected.filter(s => s !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selected.length} selected issues? Stock will be restored for un-returned items.`)) return;
    try {
      await Promise.all(selected.map((id) => issuesAPI.delete(id)));
      toast.success(`${selected.length} issues deleted and stock restored`);
      setSelected([]);
      loadIssues();
    } catch (err) {
      toast.error('Some issues could not be deleted');
      loadIssues();
    }
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
            <h1 className="page-title">Issued Items</h1>
            <p className="page-subtitle">Track item issuance and returns</p>
          </div>
          
          {user && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
              <div className="stat-card" style={{ padding: '0.5rem 1.5rem', margin: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="stat-value" style={{ fontSize: '1.5rem' }}>{stats?.items || 0}</div>
                  <div className="stat-label" style={{ fontSize: '0.7rem' }}>Total Items</div>
                </div>
              </div>
              <div className="stat-card" style={{ padding: '0.5rem 1.5rem', margin: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="stat-value" style={{ fontSize: '1.5rem' }}>{stats?.activeIssues || 0}</div>
                  <div className="stat-label" style={{ fontSize: '0.7rem' }}>Active Issues</div>
                </div>
              </div>
              <div className="stat-card" style={{ padding: '0.5rem 1.5rem', margin: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="stat-value" style={{ fontSize: '1.5rem', color: stats?.overdueItems > 0 ? 'var(--accent-red)' : 'inherit' }}>{stats?.overdueItems || 0}</div>
                  <div className="stat-label" style={{ fontSize: '0.7rem' }}>Overdue Items</div>
                </div>
              </div>
            </div>
          )}

          {user && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {selected.length > 0 && (
                <button className="btn btn-danger" onClick={handleDeleteSelected}>
                  <HiOutlineTrash /> {selected.length} Selected
                </button>
              )}
              <button id="issue-item-btn" className="btn btn-primary" onClick={openIssueModal}>
                <HiOutlinePlus /> Issue Items
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="page-body">
        <div className="table-container">
          <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['all', 'active', 'returned', 'permanent'].map((f) => (
                <button
                  key={f}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '250px' }}>
              <HiOutlineSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search issued items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', width: '100%', margin: 0 }}
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {user && (
                    <th style={{ width: '40px' }}>
                      <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} style={{ cursor: 'pointer' }} />
                    </th>
                  )}
                  <th>Employee</th>
                  <th>Items Issued</th>
                  <th>Issue Date</th>
                  <th>Exp. Return</th>
                  <th>Return Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Issuer</th>
                  {user && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {displayedIssues.length === 0 ? (
                  <tr>
                    <td colSpan={user ? 9 : 8}>
                      <div className="empty-state">
                        <HiOutlineClipboardList className="icon" />
                        <p>No issues found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedIssues.map((issue) => (
                    <tr key={issue._id}>
                      {user && (
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.includes(issue._id)}
                            onChange={(e) => handleSelectOne(e, issue._id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                      )}
                      <td style={{ color: 'var(--text-primary)' }}>
                        {issue.employee_name || '—'}
                        <br />
                        <span
                          style={{
                            fontSize: 'var(--font-xs)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {issue.employee_p_no}
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
                      <td>{formatDate(issue.expected_return_date)}</td>
                      <td>{formatDate(issue.return_date)}</td>
                      <td>
                        {issue.is_permanent ? (
                          <span className="badge badge-blue">Permanent</span>
                        ) : issue.return_date ? (
                          <span className="badge badge-green">Returned</span>
                        ) : (
                          <span className="badge badge-amber">Active</span>
                        )}
                      </td>
                      <td>{issue.remarks || '—'}</td>
                      <td>{issue.issuer_p_no}</td>
                      {user && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {!issue.is_permanent && !issue.return_date && (
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => openReturnModal(issue)}
                                title="Return"
                              >
                                <HiOutlineReply /> Return
                              </button>
                            )}
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              style={{ color: 'var(--red-500)' }}
                              onClick={() => handleDelete(issue._id)}
                              title="Delete"
                            >
                              <HiOutlineTrash />
                            </button>
                          </div>
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
                    <label className="form-label">Employee P.No *</label>
                    <input
                      className="form-input"
                      value={issueForm.employee_p_no}
                      onChange={(e) =>
                        setIssueForm({ ...issueForm, employee_p_no: e.target.value })
                      }
                      placeholder="6 characters"
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Employee Name *</label>
                    <input
                      className="form-input"
                      value={issueForm.employee_name}
                      onChange={(e) =>
                        setIssueForm({ ...issueForm, employee_name: e.target.value })
                      }
                      placeholder="Full name"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Employee Phone *</label>
                    <input
                      className="form-input"
                      value={issueForm.employee_phone}
                      onChange={(e) =>
                        setIssueForm({ ...issueForm, employee_phone: e.target.value })
                      }
                      placeholder="10 digits"
                      maxLength={10}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Job Location</label>
                    <input
                      className="form-input"
                      value={issueForm.job_location}
                      onChange={(e) =>
                        setIssueForm({ ...issueForm, job_location: e.target.value })
                      }
                      placeholder="Work area"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Vendor Supervisor</label>
                    <input
                      className="form-input"
                      value={issueForm.vendor_supervisor_name}
                      onChange={(e) =>
                        setIssueForm({ ...issueForm, vendor_supervisor_name: e.target.value })
                      }
                      placeholder="Supervisor name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Supervisor Gatepass No</label>
                    <input
                      className="form-input"
                      value={issueForm.vendor_supervisor_gatepass_no}
                      onChange={(e) =>
                        setIssueForm({ ...issueForm, vendor_supervisor_gatepass_no: e.target.value })
                      }
                      placeholder="Gatepass number"
                    />
                  </div>
                </div>

                <div className="form-row-4">
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
                  <div className="form-group">
                    <label className="form-label">Issue Date *</label>
                    <input
                      className="form-input"
                      type="date"
                      value={issueForm.issue_date}
                      onChange={(e) =>
                        setIssueForm({ ...issueForm, issue_date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expected Return</label>
                    <input
                      className="form-input"
                      type="date"
                      min={issueForm.issue_date}
                      value={issueForm.expected_return_date}
                      onChange={(e) =>
                        setIssueForm({ ...issueForm, expected_return_date: e.target.value })
                      }
                      disabled={issueForm.is_permanent}
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      type="button"
                      className={`btn ${issueForm.is_permanent ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ width: '100%', height: '42px' }}
                      onClick={() => setIssueForm({ ...issueForm, is_permanent: !issueForm.is_permanent, expected_return_date: '' })}
                    >
                      {issueForm.is_permanent ? 'Permanent Issue ✓' : 'Permanent Issue'}
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Remarks</label>
                    <input
                      className="form-input"
                      value={issueForm.remarks}
                      onChange={(e) =>
                        setIssueForm({ ...issueForm, remarks: e.target.value })
                      }
                      placeholder="Optional remarks"
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

                  {issueForm.items.map((row, index) => {
                    const filteredItems = (allItems || []).filter((it) => {
                      if (it._id === row.item) return true;
                      if (it.quantity <= 0) return false;
                      const s = (row.search || '').toLowerCase();
                      if (!s) return true;
                      return (
                        (it.sap_id || '').toLowerCase().includes(s) ||
                        (it.title || '').toLowerCase().includes(s) ||
                        (it.category || '').toLowerCase().includes(s) ||
                        (it.make || '').toLowerCase().includes(s) ||
                        (it.location || '').toLowerCase().includes(s) ||
                        (it.owner || '').toLowerCase().includes(s) ||
                        (it.certificate_no || '').toLowerCase().includes(s) ||
                        (it.description || '').toLowerCase().includes(s) ||
                        (it.remarks || '').toLowerCase().includes(s)
                      );
                    });

                    return (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          marginBottom: '1rem',
                          padding: '1rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-default)',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
                          <div className="form-group" style={{ flex: 2 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Search Item (SAP ID, Title, etc.)</label>
                            <div style={{ position: 'relative' }}>
                              <HiOutlineSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                              <input
                                className="form-input"
                                style={{ paddingLeft: '32px' }}
                                placeholder="Search..."
                                value={row.search || ''}
                                onChange={(e) => updateItemRow(index, 'search', e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="form-group" style={{ flex: 3 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Select Item *</label>
                            <select
                              className="form-select"
                              value={row.item}
                              onChange={(e) =>
                                updateItemRow(index, 'item', e.target.value)
                              }
                              required
                            >
                              <option value="">
                                {row.search ? `Matches for "${row.search}" (${filteredItems.length})` : 'Select item...'}
                              </option>
                              {filteredItems.map((it) => (
                                <option key={it._id} value={it._id}>
                                  {it.title} ({it.sap_id}) — Qty: {it.quantity}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Qty *</label>
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
                            className="btn btn-ghost btn-icon"
                            onClick={() => removeItemRow(index)}
                            disabled={issueForm.items.length <= 1}
                            style={{ flexShrink: 0, height: '42px', width: '42px' }}
                          >
                            <HiOutlineTrash />
                          </button>
                        </div>
                        {row.item && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
                            {(() => {
                              const it = allItems.find(i => i._id === row.item);
                              return it ? (
                                <>
                                  <span><strong>Category:</strong> {it.category || '—'}</span>
                                  <span><strong>Make:</strong> {it.make || '—'}</span>
                                  <span><strong>Location:</strong> {it.location || '—'}</span>
                                </>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                  {returningIssue.employee_name}
                </strong>{' '}
                ({returningIssue.employee_p_no})
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
