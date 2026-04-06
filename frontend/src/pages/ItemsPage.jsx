import { useState, useEffect } from 'react';
import { itemsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
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
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, id = edit
  const [form, setForm] = useState({ ...emptyItem });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async (query) => {
    try {
      const res = await itemsAPI.getAll(query ? { search: query } : {});
      setItems(res.data);
    } catch (err) {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    loadItems(val);
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
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
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
      toast.error(err.response?.data?.error || err.response?.data?.messages?.[0] || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await itemsAPI.delete(id);
      toast.success('Item deleted');
      loadItems(search);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
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
            <button id="add-item-btn" className="btn btn-primary" onClick={openCreate}>
              <HiOutlinePlus /> Add Item
            </button>
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
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>SAP ID</th>
                  <th>Title</th>
                  <th>Qty</th>
                  <th>Capacity</th>
                  <th>Make</th>
                  <th>Location</th>
                  <th>Next Due</th>
                  <th>Owner</th>
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
                  items.map((item) => (
                    <tr key={item._id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {item.sap_id}
                      </td>
                      <td style={{ color: 'var(--text-primary)' }}>{item.title}</td>
                      <td>
                        <span className={`badge ${item.quantity > 0 ? 'badge-green' : 'badge-red'}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td>{item.capacity}</td>
                      <td>{item.make || '—'}</td>
                      <td>{item.location || '—'}</td>
                      <td>
                        {item.next_due_date ? (
                          <span
                            className={`badge ${
                              isOverdue(item.next_due_date) ? 'badge-red' : 'badge-green'
                            }`}
                          >
                            {formatDate(item.next_due_date)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{item.owner || '—'}</td>
                      {user && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => openEdit(item)}
                              title="Edit"
                            >
                              <HiOutlinePencil />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(item._id)}
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

      {/* ── Modal ──────────────────────────────── */}
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

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Capacity *</label>
                    <input
                      className="form-input"
                      name="capacity"
                      type="number"
                      min="0"
                      value={form.capacity}
                      onChange={handleChange}
                      required
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

                <div className="form-row">
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
                      value={form.next_due_date}
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
