import { useState, useEffect } from 'react';
import { employeesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineUsers,
} from 'react-icons/hi';

const emptyEmployee = {
  p_no: '',
  name: '',
  phone: '',
  vendor_supervisor_name: '',
  vendor_supervisor_gatepass_no: '',
  job_location: '',
};

export default function EmployeesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyEmployee });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async (query) => {
    try {
      const res = await employeesAPI.getAll(query ? { search: query } : {});
      setEmployees(res.data);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    loadEmployees(val);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyEmployee });
    setModalOpen(true);
  };

  const openEdit = (emp) => {
    setEditing(emp._id);
    setForm({ ...emp });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await employeesAPI.update(editing, form);
        toast.success('Employee updated');
      } else {
        await employeesAPI.create(form);
        toast.success('Employee created');
      }
      setModalOpen(false);
      loadEmployees(search);
    } catch (err) {
      toast.error(
        err.response?.data?.error || err.response?.data?.messages?.[0] || 'Failed to save'
      );
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await employeesAPI.delete(id);
      toast.success('Employee deleted');
      loadEmployees(search);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
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
            <h1 className="page-title">Employees</h1>
            <p className="page-subtitle">{employees.length} employees registered</p>
          </div>
          {user && (
            <button id="add-employee-btn" className="btn btn-primary" onClick={openCreate}>
              <HiOutlinePlus /> Add Employee
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
                id="search-employees"
                placeholder="Search by name or P.No..."
                value={search}
                onChange={handleSearch}
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>P.No</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Job Location</th>
                  <th>Vendor Supervisor</th>
                  <th>Gatepass No.</th>
                  {user && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={user ? 7 : 6}>
                      <div className="empty-state">
                        <HiOutlineUsers className="icon" />
                        <p>No employees found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp._id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {emp.p_no}
                      </td>
                      <td style={{ color: 'var(--text-primary)' }}>{emp.name}</td>
                      <td>{emp.phone}</td>
                      <td>{emp.job_location || '—'}</td>
                      <td>{emp.vendor_supervisor_name || '—'}</td>
                      <td>{emp.vendor_supervisor_gatepass_no || '—'}</td>
                      {user && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => openEdit(emp)}
                            >
                              <HiOutlinePencil />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(emp._id)}
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editing ? 'Edit Employee' : 'Add Employee'}
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}>
                <HiOutlineX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">P.No * (6 chars)</label>
                    <input
                      className="form-input"
                      name="p_no"
                      value={form.p_no}
                      onChange={handleChange}
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input
                      className="form-input"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone * (10 digits)</label>
                    <input
                      className="form-input"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      maxLength={10}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Job Location</label>
                    <input
                      className="form-input"
                      name="job_location"
                      value={form.job_location}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Vendor Supervisor Name</label>
                    <input
                      className="form-input"
                      name="vendor_supervisor_name"
                      value={form.vendor_supervisor_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vendor Supervisor Gatepass No.</label>
                    <input
                      className="form-input"
                      name="vendor_supervisor_gatepass_no"
                      value={form.vendor_supervisor_gatepass_no}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
