import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { itemsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as XLSX from 'xlsx';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineCube,
} from 'react-icons/hi';

const emptyItem = {
  sap_id: '',
  title: '',
  capacity: '',
  quantity: '',
  description: '',
  certificate_no: '',
  make: '',
  prev_due_date: '',
  next_due_date: '',
  location: '',
  owner: '',
  umc: '',
  remarks: '',
};

export default function ItemsPage() {
  const { stats, loadStats } = useOutletContext() || { stats: {} };
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, id = edit
  const [viewing, setViewing] = useState(null); // item to view
  const [form, setForm] = useState({ ...emptyItem });
  const [filters, setFilters] = useState({
    category: '',
    make: '',
    location: '',
    owner: '',
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async (query) => {
    try {
      const res = await itemsAPI.getAll(query ? { search: query } : {});
      setItems(res.data);
      if (loadStats) loadStats();
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.messages?.length ? data.messages.join(' | ') : (data?.error || 'Failed to load items'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    loadItems(val);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        const mappedItems = json.map(rawRow => {
          const row = {};
          Object.keys(rawRow).forEach(k => {
            row[k.trim().toUpperCase()] = rawRow[k];
          });

          let parsedQty = Number(row.QUANTITY);
          if (isNaN(parsedQty)) {
            parsedQty = 0;
          }

          return {
            part_no: String(row.PART_NO || ''),
            sap_id: String(row.SAP_ID || ''),
            title: row.TITLE || '',
            quantity: parsedQty,
            description: row.DESCRIPTION || '',
            category: row.CATEGORY || '',
            location: row.LOCATION || '',
            capacity: String(row.CAPACITY || ''),
            certificate_no: String(row.CERTIFICATE_NO || ''),
            make: row.MAKE || '',
            prev_due_date: row.PREV_DUE_DATE || null,
            next_due_date: row.NEXT_DUE_DATE || null,
            owner: row.OWNER || '',
            umc: row.UMC || '',
            date_added: row.DATE_ADDED || null,
            remarks: row.REMARKS || '',
          };
        });

        toast.success(`Uploading ${mappedItems.length} items...`);
        const res = await itemsAPI.bulkCreate({ items: mappedItems });
        
        if (res.data.stats.failedValidation > 0) {
            toast.error(res.data.message);
            console.error("Validation Errors:", res.data.errors);
        } else {
            toast.success(res.data.message);
        }
        loadItems(search);
      } catch (err) {
        toast.error('Failed to parse or upload Excel file');
        console.error(err);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyItem });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item._id);
    setForm({
      ...item,
      prev_due_date: item.prev_due_date
        ? item.prev_due_date.substring(0, 10)
        : '',
      next_due_date: item.next_due_date
        ? item.next_due_date.substring(0, 10)
        : '',
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.next_due_date && form.prev_due_date && new Date(form.next_due_date) < new Date(form.prev_due_date)) {
      toast.error('Next due date cannot be before prev due date');
      return;
    }

    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        prev_due_date: form.prev_due_date || null,
        next_due_date: form.next_due_date || null,
      };

      if (editing) {
        await itemsAPI.update(editing, payload);
        toast.success('Item updated');
      } else {
        await itemsAPI.create(payload);
        toast.success('Item created');
      }
      setModalOpen(false);
      loadItems(search);
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.messages?.length ? data.messages.join(' | ') : (data?.error || 'Failed to save'));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await itemsAPI.delete(id);
      toast.success('Item deleted');
      loadItems(search);
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.messages?.length ? data.messages.join(' | ') : (data?.error || 'Delete failed'));
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

  const isOverdue = (d) => {
    if (!d) return false;
    return new Date(d) < new Date();
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
            <h1 className="page-title">Items</h1>
            <p className="page-subtitle">{items.length} items in store</p>
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
              <input
                type="file"
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <a href="/addItems_uploadFormat.xlsx" download className="btn btn-ghost">
                Download Bulk<br />Upload Template
              </a>
              <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                Bulk Upload
              </button>
              <button id="add-item-btn" className="btn btn-primary" onClick={openCreate}>
                <HiOutlinePlus /> Add Item
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="page-body">
        <div className="table-container">
          <div className="table-toolbar">
            <div className="table-search">
              <HiOutlineSearch className="icon" />
              <input
                id="search-items"
                placeholder="Search by title or SAP ID..."
                value={search}
                onChange={handleSearch}
              />
            </div>

            <div className="table-filters-row">
              <select className="form-select select-sm" value={filters.category} onChange={(e) => setFilters({...filters, category: e.target.value})}>
                <option value="">All Categories</option>
                {[...new Set(items.map(i => i.category).filter(Boolean))].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="form-select select-sm" value={filters.make} onChange={(e) => setFilters({...filters, make: e.target.value})}>
                <option value="">All Makes</option>
                {[...new Set(items.map(i => i.make).filter(Boolean))].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select className="form-select select-sm" value={filters.location} onChange={(e) => setFilters({...filters, location: e.target.value})}>
                <option value="">All Locations</option>
                {[...new Set(items.map(i => i.location).filter(Boolean))].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <select className="form-select select-sm" value={filters.owner} onChange={(e) => setFilters({...filters, owner: e.target.value})}>
                <option value="">All Owners</option>
                {[...new Set(items.map(i => i.owner).filter(Boolean))].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>SAP ID</th>
                  <th>Title</th>
                  <th>Qty</th>
                  <th>Location</th>
                  <th>Description</th>
                  {user && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={user ? 9 : 8}>
                      <div className="empty-state">
                        <HiOutlineCube className="icon" />
                        <p>No items found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items
                    .filter(item => {
                      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                                           item.sap_id.toLowerCase().includes(search.toLowerCase());
                      const matchesCategory = !filters.category || item.category === filters.category;
                      const matchesMake = !filters.make || item.make === filters.make;
                      const matchesLocation = !filters.location || item.location === filters.location;
                      const matchesOwner = !filters.owner || item.owner === filters.owner;
                      return matchesSearch && matchesCategory && matchesMake && matchesLocation && matchesOwner;
                    })
                    .map((item) => (
                      <tr key={item._id} onClick={() => setViewing(item)} style={{ cursor: 'pointer' }}>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {item.sap_id}
                        </td>
                        <td style={{ color: 'var(--text-primary)' }}>{item.title}</td>
                        <td>
                          <span className={`badge ${item.quantity > 0 ? 'badge-green' : 'badge-red'}`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td>{item.location || '—'}</td>
                        <td>{item.description || '—'}</td>
                        {user && (
                          <td>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                                title="Edit"
                              >
                                <HiOutlinePencil />
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
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

      <style>{`
        .item-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .item-details-grid p {
          margin: 0;
          font-size: var(--font-sm);
        }
        .item-details-grid span.label {
          color: var(--text-muted);
          font-weight: 600;
          display: block;
          margin-bottom: 0.25rem;
          font-size: var(--font-xs);
          text-transform: uppercase;
        }
        .item-details-grid span.value {
          color: var(--text-primary);
        }
      `}</style>

      {/* ── Details Modal ──────────────────────── */}
      {viewing && (
        <div className="modal-overlay" onClick={() => setViewing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Item Details</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setViewing(null)}>
                <HiOutlineX />
              </button>
            </div>
            <div className="modal-body">
              <div className="item-details-grid">
                <p><span className="label">SAP ID</span><span className="value">{viewing.sap_id}</span></p>
                <p><span className="label">Title</span><span className="value">{viewing.title}</span></p>
                <p><span className="label">Category</span><span className="value">{viewing.category || '—'}</span></p>
                <p><span className="label">Capacity</span><span className="value">{viewing.capacity || '—'}</span></p>
                <p>
                  <span className="label">Quantity</span>
                  <span className="value">
                    <span className={`badge ${viewing.quantity > 0 ? 'badge-green' : 'badge-red'}`}>
                      {viewing.quantity}
                    </span>
                  </span>
                </p>
                <p><span className="label">Location</span><span className="value">{viewing.location || '—'}</span></p>
                <p><span className="label">Make</span><span className="value">{viewing.make || '—'}</span></p>
                <p><span className="label">Owner</span><span className="value">{viewing.owner || '—'}</span></p>
                <p><span className="label">Certificate No.</span><span className="value">{viewing.certificate_no || '—'}</span></p>
                <p><span className="label">UMC</span><span className="value">{viewing.umc || '—'}</span></p>
                <p><span className="label">Previous Due Date</span><span className="value">{formatDate(viewing.prev_due_date)}</span></p>
                <p>
                  <span className="label">Next Due Date</span>
                  <span className="value">
                    {viewing.next_due_date ? (
                      <span className={`badge ${isOverdue(viewing.next_due_date) ? 'badge-red' : 'badge-green'}`}>
                        {formatDate(viewing.next_due_date)}
                      </span>
                    ) : '—'}
                  </span>
                </p>
                <p style={{ gridColumn: '1 / -1' }}><span className="label">Description</span><span className="value">{viewing.description || '—'}</span></p>
                <p style={{ gridColumn: '1 / -1' }}><span className="label">Remarks</span><span className="value">{viewing.remarks || '—'}</span></p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit/Create Modal ──────────────────── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editing ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}>
                <HiOutlineX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">SAP ID *</label>
                    <input
                      className="form-input"
                      name="sap_id"
                      value={form.sap_id}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input
                      className="form-input"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-4">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                    >
                      <option value="">Select...</option>
                      {['C1', 'C2', 'C3', 'C4', 'C5'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Capacity</label>
                    <input
                      className="form-input"
                      name="capacity"
                      value={form.capacity}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantity *</label>
                    <input
                      className="form-input"
                      name="quantity"
                      type="number"
                      min="0"
                      value={form.quantity}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Certificate No.</label>
                    <input
                      className="form-input"
                      name="certificate_no"
                      value={form.certificate_no}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row-4">
                  <div className="form-group">
                    <label className="form-label">Make</label>
                    <input
                      className="form-input"
                      name="make"
                      value={form.make}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      className="form-input"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Owner</label>
                    <input
                      className="form-input"
                      name="owner"
                      value={form.owner}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">UMC</label>
                    <input
                      className="form-input"
                      name="umc"
                      value={form.umc}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Prev Due Date</label>
                    <input
                      className="form-input"
                      name="prev_due_date"
                      type="date"
                      value={form.prev_due_date}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Next Due Date</label>
                    <input
                      className="form-input"
                      name="next_due_date"
                      type="date"
                      min={form.prev_due_date}
                      value={form.next_due_date}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <textarea
                    className="form-textarea"
                    name="remarks"
                    value={form.remarks}
                    onChange={handleChange}
                    rows={2}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
