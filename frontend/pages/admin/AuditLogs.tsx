import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, RefreshCcw, Filter } from 'lucide-react';
import { apiClient } from '../../lib/api';

interface AuditLogItem {
  id: number;
  actor_user_id: number;
  action: string;
  resource_type: string;
  resource_id?: number | null;
  details?: Record<string, any>;
  actor_email?: string | null;
  actor_full_name?: string | null;
  created_at: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);

  const loadAuditLogs = async () => {
    setLoading(true);
    const response = await apiClient.getAdminAuditLogs({
      page,
      limit,
      actor_user_id: actorFilter.trim() ? Number(actorFilter) : undefined,
      action: actionFilter.trim() || undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    });

    if (response.success && response.data) {
      const payload = response.data as any;
      setLogs(payload.logs || []);
      setTotal(Number(payload.total || 0));
      setError('');
    } else {
      setError(response.error || 'Failed to load audit logs');
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAuditLogs();
  }, [page]);

  const uniqueActions = useMemo(() => {
    const actionSet = new Set(logs.map((item) => item.action));
    return Array.from(actionSet).sort();
  }, [logs]);

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-space-grotesk font-bold text-4xl text-botai-dark mb-2">Audit Logs</h1>
          <p className="font-noto-sans text-botai-text">Track privileged actions across admin and support operations.</p>
        </div>

        <button
          type="button"
          onClick={loadAuditLogs}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-botai-grey-line hover:border-botai-dark text-botai-dark"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-botai-grey-line p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 text-sm text-botai-text">
          <Filter className="w-4 h-4" />
          Action filter
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-botai-grey-line"
        >
          <option value="">All actions</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
          placeholder="Actor user id"
          className="px-3 py-2 rounded-lg border border-botai-grey-line w-40"
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="px-3 py-2 rounded-lg border border-botai-grey-line"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="px-3 py-2 rounded-lg border border-botai-grey-line"
        />
        <button
          type="button"
          onClick={() => {
            setPage(1);
            loadAuditLogs();
          }}
          className="px-3 py-2 rounded-lg bg-botai-dark text-white hover:bg-botai-black"
        >
          Apply
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-botai-grey-line overflow-hidden">
        <div className="px-4 py-3 border-b border-botai-grey-line flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-botai-dark" />
          <span className="font-space-grotesk font-semibold text-botai-dark">Recent Events</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-botai-text">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-botai-text">No audit events found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-botai-grey-bg/60 text-left">
                  <th className="px-4 py-3 font-space-grotesk">Time</th>
                  <th className="px-4 py-3 font-space-grotesk">Action</th>
                  <th className="px-4 py-3 font-space-grotesk">Actor</th>
                  <th className="px-4 py-3 font-space-grotesk">Resource</th>
                  <th className="px-4 py-3 font-space-grotesk">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-botai-grey-line/50 align-top">
                    <td className="px-4 py-3 whitespace-nowrap">{log.created_at}</td>
                    <td className="px-4 py-3 font-medium text-botai-dark">{log.action}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-botai-dark">User #{log.actor_user_id}</div>
                      <div className="text-xs text-botai-text">{log.actor_full_name || log.actor_email || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      {log.resource_type}
                      {log.resource_id ? ` #${log.resource_id}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <pre className="text-xs text-botai-text whitespace-pre-wrap break-all max-w-[520px]">{JSON.stringify(log.details || {}, null, 2)}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && total > 0 && (
          <div className="px-4 py-3 border-t border-botai-grey-line flex items-center justify-between text-sm">
            <span className="text-botai-text">Showing page {page} of {Math.max(1, Math.ceil(total / limit))} · total {total}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-lg border border-botai-grey-line disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage((prev) => prev + 1)}
                className="px-3 py-1.5 rounded-lg border border-botai-grey-line disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
