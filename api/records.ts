import axios from "@/lib/axios"; // adapte selon ton alias

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModuleKey =
  | "reception"
  | "traceability"
  | "labeling"
  | "oil-control"
  | "temperature-control"
  | "nett-desi"
  | "desinfection";

export interface RecordEntry {
  id: number;
  module: ModuleKey;
  action: string;           // ex: "store", "update", "print"
  description: string;      // ex: "Lot #A12 enregistré"
  created_at: string;       // ISO 8601
  meta?: Record<string, unknown>;
}

export interface ModuleStat {
  module: ModuleKey;
  label: string;
  done: number;
  pending: number;
  total: number;
}

export interface DailySummary {
  date: string;             // "2025-04-16"
  total_actions: number;
  modules_active: ModuleKey[];
  entries: RecordEntry[];
}

export interface RecordStats {
  period_from: string;
  period_to: string;
  by_module: ModuleStat[];
  total_done: number;
  total_pending: number;
}

export interface CalendarDay {
  date: string;             // "2025-04-16"
  count: number;            // nombre d'actions ce jour
}

// ─── Params ───────────────────────────────────────────────────────────────────

export interface SummaryParams {
  date?: string;            // default: today
}

export interface ByModuleParams {
  module?: ModuleKey;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}

export interface DailyReportParams {
  date?: string;
}

export interface StatsParams {
  from?: string;
  to?: string;
}

export interface CalendarParams {
  month?: string;           // "2025-04"
}

export interface ExportParams {
  date?: string;
  module?: ModuleKey;
  format?: "csv" | "pdf";
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Vue d'ensemble de la journée pour l'utilisateur connecté.
 * Tous les modules actifs + total des actions.
 */
export const getRecordsSummary = async (
  params?: SummaryParams
): Promise<DailySummary> => {
  const { data } = await axios.get("/api/v1/records/summary", { params });
  return data;
};

/**
 * Liste paginée des enregistrements, filtrée par module et/ou période.
 */
export const getRecordsByModule = async (
  params?: ByModuleParams
): Promise<{ data: RecordEntry[]; total: number; current_page: number }> => {
  const { data } = await axios.get("/api/v1/records/by-module", { params });
  return data;
};

/**
 * Rapport complet d'une journée (toutes actions triées par heure).
 */
export const getDailyReport = async (
  params?: DailyReportParams
): Promise<DailySummary> => {
  const { data } = await axios.get("/api/v1/records/daily-report", { params });
  return data;
};

/**
 * Compteurs agrégés : tâches faites / en attente par module.
 */
export const getRecordsStats = async (
  params?: StatsParams
): Promise<RecordStats> => {
  const { data } = await axios.get("/api/v1/records/stats", { params });
  return data;
};

/**
 * Enregistrements détaillés d'un seul module.
 */
export const getModuleRecords = async (
  module: ModuleKey,
  params?: ByModuleParams
): Promise<{ data: RecordEntry[]; total: number; current_page: number }> => {
  const { data } = await axios.get(`/api/v1/records/${module}/records`, {
    params,
  });
  return data;
};

/**
 * Jours actifs du mois — pour afficher une heatmap / calendrier.
 */
export const getRecordsCalendar = async (
  params?: CalendarParams
): Promise<CalendarDay[]> => {
  const { data } = await axios.get("/api/v1/records/calendar", { params });
  return data;
};

/**
 * Export CSV ou PDF du rapport journalier.
 * Retourne un Blob pour déclencher le téléchargement.
 */
export const exportRecords = async (params?: ExportParams): Promise<Blob> => {
  const { data } = await axios.get("/api/v1/records/export", {
    params,
    responseType: "blob",
  });
  return data;
};