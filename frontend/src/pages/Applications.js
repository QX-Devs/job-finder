import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import applicationService from '../services/applicationService';
import authService from '../services/authService';
import { Briefcase, ExternalLink, MapPin, Calendar, Link as LinkIcon, Loader2 } from 'lucide-react';
import './Applications.css';

const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'saved', label: 'Saved' },
];

const Applications = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  const user = authService.getStoredUser();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await applicationService.list();
        if (!mounted) return;
        const rows = (res?.data || []).filter(i => i.status !== 'saved');
        setItems(rows);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load applications');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    let list = items;
    if (filterStatus !== 'all') list = list.filter(i => i.status === filterStatus);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(i => (i.jobTitle || '').toLowerCase().includes(s) || (i.company || '').toLowerCase().includes(s));
    }
    return list;
  }, [items, filterStatus, search]);

  // Read-only page: no create/update/delete handlers

  return (
    <div className="page-container">
      <div className="apps-header">
        <div className="apps-title">
          <Briefcase size={20} />
          <h1>My Applications</h1>
        </div>
        <div className="apps-actions">
          <div className="apps-filter">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
          </div>
          <input className="apps-search" placeholder="Search title or company" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Read-only: creation form removed */}

      {loading ? (
        <div className="apps-loading"><Loader2 className="spin" size={22} /> Loading applications...</div>
      ) : error ? (
        <div className="apps-error" role="alert">{error}</div>
      ) : (
        <div className="apps-list">
          {filtered.map(app => (
            <div key={app.id} className="app-card">
              <div className="app-main">
                <div className="app-title">{app.jobTitle}</div>
                <div className="app-meta">
                  <span className="meta"><Briefcase size={14} /> {app.company}</span>
                  {app.location && (<span className="meta"><MapPin size={14} /> {app.location}</span>)}
                  <span className="meta"><Calendar size={14} /> {new Date(app.appliedAt).toLocaleDateString()}</span>
                  {app.sourceUrl && (
                    <a className="meta link" href={app.sourceUrl} target="_blank" rel="noreferrer">
                      <LinkIcon size={14} /> Source <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
              <div className="app-actions">
                <span className={`status ${app.status}`}>{(STATUS_OPTIONS.find(s => s.value === app.status) || {}).label || app.status}</span>
              </div>
              {app.notes && <div className="app-notes">{app.notes}</div>}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="apps-empty">No applications found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Applications;


