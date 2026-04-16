"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  getRecordsSummary,
  getRecordsStats,
  getRecordsByModule,
  getRecordsCalendar,
  exportRecords,
  type RecordEntry,
  type ModuleStat,
  type DailySummary,
  type CalendarDay,
  type ModuleKey,
} from "@/api/records"; // adapte selon ton alias

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MODULE_LABELS: Record<ModuleKey, string> = {
  reception: "Réception",
  traceability: "Traçabilité",
  labeling: "Étiquetage",
  "oil-control": "Contrôle huile",
  "temperature-control": "Contrôle temp.",
  "nett-desi": "Nett. / Dési.",
  desinfection: "Désinfection",
};

const MODULE_COLORS: Record<ModuleKey, string> = {
  reception: "#6366f1",
  traceability: "#0ea5e9",
  labeling: "#10b981",
  "oil-control": "#f59e0b",
  "temperature-control": "#ef4444",
  "nett-desi": "#8b5cf6",
  desinfection: "#ec4899",
};

const ACTION_LABELS: Record<string, string> = {
  store: "Enregistré",
  update: "Modifié",
  destroy: "Supprimé",
  print: "Imprimé",
  status: "Statut changé",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ stat }: { stat: ModuleStat }) {
  const pct = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
  const color = MODULE_COLORS[stat.module] ?? "#6366f1";

  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-dot" style={{ background: color }} />
        <span className="stat-label">{stat.label}</span>
        <span className="stat-pct">{pct}%</span>
      </div>
      <div className="stat-bar-bg">
        <div
          className="stat-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="stat-counts">
        <span>{stat.done} faites</span>
        <span>{stat.pending} en attente</span>
      </div>
    </div>
  );
}

function EntryRow({ entry }: { entry: RecordEntry }) {
  const color = MODULE_COLORS[entry.module] ?? "#6366f1";
  const actionLabel = ACTION_LABELS[entry.action] ?? entry.action;

  return (
    <div className="entry-row">
      <span className="entry-time">{formatTime(entry.created_at)}</span>
      <span className="entry-badge" style={{ background: color + "22", color }}>
        {MODULE_LABELS[entry.module] ?? entry.module}
      </span>
      <span className="entry-action">{actionLabel}</span>
      <span className="entry-desc">{entry.description}</span>
    </div>
  );
}

function CalendarHeatmap({ days }: { days: CalendarDay[] }) {
  const max = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="calendar-grid">
      {days.map((d) => {
        const intensity = d.count / max;
        return (
          <div
            key={d.date}
            className="cal-cell"
            title={`${d.date} — ${d.count} action(s)`}
            style={{
              background: `rgba(99,102,241,${0.1 + intensity * 0.75})`,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecordsPage() {
  const [selectedDate, setSelectedDate] = useState<string>(today());
  const [selectedModule, setSelectedModule] = useState<ModuleKey | "all">(
    "all"
  );

  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [stats, setStats] = useState<ModuleStat[]>([]);
  const [entries, setEntries] = useState<RecordEntry[]>([]);
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, statsData, entriesData, calData] = await Promise.all([
        getRecordsSummary({ date: selectedDate }),
        getRecordsStats({ from: selectedDate, to: selectedDate }),
        getRecordsByModule({
          module: selectedModule === "all" ? undefined : selectedModule,
          from: selectedDate,
          to: selectedDate,
          per_page: 50,
        }),
        getRecordsCalendar({ month: currentMonth() }),
      ]);
      setSummary(summaryData);
      setStats(statsData.by_module);
      setEntries(entriesData.data);
      setCalendar(calData);
    } catch (err) {
      setError("Impossible de charger les enregistrements.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedModule]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Export ─────────────────────────────────────────────────────────────────

  const handleExport = async (format: "csv" | "pdf") => {
    setExporting(true);
    try {
      const blob = await exportRecords({
        date: selectedDate,
        module: selectedModule === "all" ? undefined : selectedModule,
        format,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `records-${selectedDate}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Erreur lors de l'export.");
    } finally {
      setExporting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        .records-page {
          padding: 24px;
          max-width: 960px;
          margin: 0 auto;
          font-family: inherit;
        }
        /* ── Header ── */
        .rp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 24px;
        }
        .rp-title {
          font-size: 22px;
          font-weight: 600;
          color: var(--color-text-primary, #111);
        }
        .rp-subtitle {
          font-size: 13px;
          color: var(--color-text-secondary, #666);
          margin-top: 2px;
        }
        .rp-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .rp-date-input {
          border: 1px solid var(--color-border-secondary, #d1d5db);
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 13px;
          background: var(--color-background-secondary, #f9fafb);
          color: var(--color-text-primary, #111);
          cursor: pointer;
        }
        .rp-select {
          border: 1px solid var(--color-border-secondary, #d1d5db);
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 13px;
          background: var(--color-background-secondary, #f9fafb);
          color: var(--color-text-primary, #111);
          cursor: pointer;
        }
        .rp-btn {
          border: 1px solid var(--color-border-secondary, #d1d5db);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 13px;
          cursor: pointer;
          background: var(--color-background-primary, #fff);
          color: var(--color-text-primary, #111);
          transition: background 0.15s;
        }
        .rp-btn:hover { background: var(--color-background-secondary, #f3f4f6); }
        .rp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        /* ── Kpi row ── */
        .kpi-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .kpi-card {
          background: var(--color-background-secondary, #f9fafb);
          border: 1px solid var(--color-border-tertiary, #e5e7eb);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }
        .kpi-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--color-text-primary, #111);
          line-height: 1;
        }
        .kpi-label {
          font-size: 12px;
          color: var(--color-text-secondary, #666);
          margin-top: 4px;
        }
        /* ── Stats grid ── */
        .section-title {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-text-secondary, #666);
          margin-bottom: 12px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
          margin-bottom: 28px;
        }
        .stat-card {
          background: var(--color-background-secondary, #f9fafb);
          border: 1px solid var(--color-border-tertiary, #e5e7eb);
          border-radius: 10px;
          padding: 12px 14px;
        }
        .stat-header {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 8px;
        }
        .stat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .stat-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-primary, #111);
          flex: 1;
        }
        .stat-pct {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-secondary, #666);
        }
        .stat-bar-bg {
          height: 4px;
          border-radius: 2px;
          background: var(--color-border-tertiary, #e5e7eb);
          overflow: hidden;
          margin-bottom: 6px;
        }
        .stat-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.4s ease;
        }
        .stat-counts {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--color-text-secondary, #666);
        }
        /* ── Entries ── */
        .entries-section { margin-bottom: 28px; }
        .entries-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .entry-row {
          display: grid;
          grid-template-columns: 52px 130px 90px 1fr;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: var(--color-background-secondary, #f9fafb);
          border: 1px solid var(--color-border-tertiary, #e5e7eb);
          border-radius: 8px;
          font-size: 13px;
        }
        .entry-time {
          font-weight: 600;
          color: var(--color-text-secondary, #555);
          font-size: 12px;
          font-variant-numeric: tabular-nums;
        }
        .entry-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .entry-action {
          font-size: 12px;
          color: var(--color-text-secondary, #666);
        }
        .entry-desc {
          color: var(--color-text-primary, #111);
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        /* ── Calendar ── */
        .calendar-section { margin-bottom: 28px; }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(31, 1fr);
          gap: 4px;
        }
        .cal-cell {
          aspect-ratio: 1;
          border-radius: 3px;
          cursor: default;
          transition: transform 0.1s;
        }
        .cal-cell:hover { transform: scale(1.3); }
        /* ── States ── */
        .rp-loading, .rp-error, .rp-empty {
          text-align: center;
          padding: 48px 16px;
          color: var(--color-text-secondary, #666);
          font-size: 14px;
        }
        .rp-error { color: #ef4444; }
        @media (max-width: 600px) {
          .entry-row {
            grid-template-columns: 48px 1fr;
            grid-template-rows: auto auto;
          }
          .entry-action { display: none; }
          .calendar-grid { grid-template-columns: repeat(15, 1fr); }
        }
      `}</style>

      <div className="records-page">
        {/* Header */}
        <div className="rp-header">
          <div>
            <div className="rp-title">Enregistrements</div>
            <div className="rp-subtitle">
              {summary
                ? formatDate(selectedDate)
                : "Historique de vos activités"}
            </div>
          </div>
          <div className="rp-actions">
            <input
              type="date"
              className="rp-date-input"
              value={selectedDate}
              max={today()}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <select
              className="rp-select"
              value={selectedModule}
              onChange={(e) =>
                setSelectedModule(e.target.value as ModuleKey | "all")
              }
            >
              <option value="all">Tous les modules</option>
              {(Object.keys(MODULE_LABELS) as ModuleKey[]).map((m) => (
                <option key={m} value={m}>
                  {MODULE_LABELS[m]}
                </option>
              ))}
            </select>
            <button
              className="rp-btn"
              onClick={() => handleExport("csv")}
              disabled={exporting || loading}
            >
              CSV
            </button>
            <button
              className="rp-btn"
              onClick={() => handleExport("pdf")}
              disabled={exporting || loading}
            >
              PDF
            </button>
          </div>
        </div>

        {/* Error */}
        {error && <div className="rp-error">{error}</div>}

        {/* Loading */}
        {loading && <div className="rp-loading">Chargement…</div>}

        {!loading && !error && (
          <>
            {/* KPI row */}
            <div className="kpi-row">
              <div className="kpi-card">
                <div className="kpi-value">{summary?.total_actions ?? 0}</div>
                <div className="kpi-label">Actions du jour</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value">
                  {summary?.modules_active?.length ?? 0}
                </div>
                <div className="kpi-label">Modules actifs</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value">
                  {stats.reduce((s, m) => s + m.done, 0)}
                </div>
                <div className="kpi-label">Tâches faites</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value">
                  {stats.reduce((s, m) => s + m.pending, 0)}
                </div>
                <div className="kpi-label">En attente</div>
              </div>
            </div>

            {/* Stats par module */}
            {stats.length > 0 && (
              <section>
                <div className="section-title">Par module</div>
                <div className="stats-grid">
                  {stats.map((s) => (
                    <StatCard key={s.module} stat={s} />
                  ))}
                </div>
              </section>
            )}

            {/* Activité du mois */}
            {calendar.length > 0 && (
              <section className="calendar-section">
                <div className="section-title">Activité du mois</div>
                <CalendarHeatmap days={calendar} />
              </section>
            )}

            {/* Liste des enregistrements */}
            <section className="entries-section">
              <div className="section-title">
                Enregistrements
                {entries.length > 0 && (
                  <span style={{ marginLeft: 6, fontWeight: 400 }}>
                    ({entries.length})
                  </span>
                )}
              </div>
              {entries.length === 0 ? (
                <div className="rp-empty">
                  Aucun enregistrement pour cette journée.
                </div>
              ) : (
                <div className="entries-list">
                  {entries.map((e) => (
                    <EntryRow key={e.id} entry={e} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}