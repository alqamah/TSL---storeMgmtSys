import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineSearch,
  HiOutlineCube,
  HiOutlineX,
  HiOutlineLogin,
} from 'react-icons/hi';
import { publicAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { fuzzySearch } from '../utils/fuzzy';

const SEARCH_FIELDS = ['title', 'umc', 'category', 'location', 'make'];

export default function PublicItemsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const res = await publicAPI.getAll();
      setItems(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (item) => {
    setViewing(item);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await publicAPI.getById(item._id);
      setDetail(res.data);
    } catch {
      setDetail(item);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    setViewing(null);
    setDetail(null);
    setDetailLoading(false);
  };

  const results = useMemo(
    () => fuzzySearch(items, search, SEARCH_FIELDS),
    [items, search]
  );

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
            <h1 className="page-title">Catalog</h1>
            <p className="page-subtitle">
              Browse items available in store{user ? '' : ' — no login required'}
            </p>
          </div>
          {!user && (
            <Link to="/login" className="btn btn-ghost">
              <HiOutlineLogin /> Staff Login
            </Link>
          )}
        </div>
      </div>

      <div className="page-body">
        {error ? (
          <div className="empty-state">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="table-container" style={{ padding: 'var(--space-4) var(--space-6)' }}>
              <div className="table-toolbar" style={{ padding: 0, borderBottom: 'none' }}>
                <div className="table-search">
                  <HiOutlineSearch className="icon" />
                  <input
                    placeholder="Search Items, UMC or Item-Description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      className="catalog-clear-btn"
                      onClick={() => setSearch('')}
                      title="Clear search"
                    >
                      <HiOutlineX />
                    </button>
                  )}
                </div>
                <span className="table-count">
                  {results.length} of {items.length} items
                </span>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="empty-state">
                <HiOutlineCube className="icon" />
                <p>No items match “{search}”</p>
              </div>
            ) : (
              <div className="catalog-grid">
                {results.map(({ item }) => (
                  <button
                    key={item._id}
                    type="button"
                    className="catalog-card"
                    onClick={() => openDetails(item)}
                  >
                    <span className="catalog-card-title">{item.title}</span>
                    <span className="catalog-card-meta">
                      <span className="badge badge-blue">UMC: {item.umc || '—'}</span>
                      <span className={`badge ${item.quantity > 0 ? 'badge-green' : 'badge-red'}`}>
                        Qty: {item.quantity}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Details Modal ──────────────────────── */}
      {viewing && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Item Details</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeDetails}>
                <HiOutlineX />
              </button>
            </div>
            <div className="modal-body">
              {detailLoading || !detail ? (
                <div className="loading-page"><div className="spinner" /></div>
              ) : (
                <>
                  <div className="item-details-grid">
                    <p style={{ gridColumn: '1 / -1' }}>
                      <span className="label">Title</span>
                      <span className="value" style={{ fontWeight: 600 }}>{detail.title}</span>
                    </p>
                    <p>
                      <span className="label">Quantity Available</span>
                      <span className="value">
                        <span className={`badge ${detail.quantity > 0 ? 'badge-green' : 'badge-red'}`}>
                          {detail.quantity}
                        </span>
                      </span>
                    </p>
                    <p><span className="label">UMC</span><span className="value">{detail.umc || '—'}</span></p>
                    <p><span className="label">Category</span><span className="value">{detail.category || '—'}</span></p>
                    <p><span className="label">Location</span><span className="value">{detail.location || '—'}</span></p>
                    <p><span className="label">Capacity</span><span className="value">{detail.capacity || '—'}</span></p>
                    <p><span className="label">Make</span><span className="value">{detail.make || '—'}</span></p>
                  </div>
                  {detail.description && (
                    <p className="catalog-desc"><span className="label">Description</span><span className="value">{detail.description}</span></p>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeDetails}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .catalog-clear-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
        }
        .catalog-clear-btn:hover {
          color: var(--text-primary);
        }
        .table-count {
          font-size: var(--font-sm);
          color: var(--text-muted);
          white-space: nowrap;
        }
        .catalog-grid {
          margin-top: var(--space-6);
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: var(--space-4);
          align-items: start;
        }
        @media (max-width: 1024px) {
          .catalog-grid {
            grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          }
        }
        .catalog-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          padding: var(--space-5);
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          color: inherit;
          font-family: var(--font-family);
          text-align: left;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .catalog-card:hover {
          border-color: var(--border-focus);
          background: var(--bg-card-hover);
        }
        .catalog-card-title {
          font-size: var(--font-base);
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.4;
          min-height: 2.6em;
        }
        .catalog-card-meta {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
        }
        .catalog-desc {
          border-top: 1px solid var(--border-subtle);
          padding-top: var(--space-4);
        }
        .catalog-desc span.label {
          color: var(--text-muted);
          font-weight: 600;
          display: block;
          margin-bottom: var(--space-1);
          font-size: var(--font-xs);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .item-details-grid p {
          margin: 0;
        }
        @media (max-width: 640px) {
          .catalog-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: var(--space-3);
          }
          .catalog-card {
            padding: var(--space-4);
          }
        }
      `}</style>
    </>
  );
}
