// Region and Location types
export interface Region {
  id: string;
  name: string;
  provinsi?: string;
  type?: string;
  count?: number;
}

export interface Location {
  id: string;
  name: string;
  provinsi: string;
  type?: string;
  count?: number;
}

// Filter types
export interface Filters {
  searchQuery?: string;
  year?: number;
  regionId?: string | null;
  provinsi?: string | null;
  daerahTingkat?: string | null;
  kotaKab?: string | null;
  page?: number;
  limit?: number;
  minPagu?: number;
  maxPagu?: number;
  metode?: string;
  jenisPengadaan?: string;
  countOnly?: boolean;
  include_count?: boolean;
  [key: string]: any; // Allow additional properties
}

// Loading state type
export interface LoadingState {
  initial: boolean;
  dashboard: boolean;
  regions: boolean;
  stats: boolean;
  charts: boolean;
  table: boolean;
  [key: string]: boolean;
}

// Error state type
export interface ErrorState {
  dashboard: string | null;
  regions: string | null;
  table: string | null;
  charts: string | null;
  [key: string]: string | null;
}

// Chart data types
export interface ChartData {
  pie: any[];
  bar: any[];
  [key: string]: any[];
}

// Dashboard stats type
export interface DashboardStats {
  totalAnggaran: string;
  totalPaket: number;
  tender: number;
  dikecualikan: number;
  epkem: number;
  pengadaanLangsung: number;
  [key: string]: string | number;
}

// Table data type
export interface TableData {
  data: any[];
  totalItems: number;
  hasFullPage?: boolean;
}

// Dashboard data type
export interface DashboardData {
  stats: DashboardStats;
  charts: ChartData;
  table: TableData;
  regions: Region[];
}

// Data context type
export interface DataContextType {
  dashboardStats: DashboardStats;
  chartData: ChartData;
  tableData: any[];
  totalItems: number;
  regions: Region[];
  filters: Filters;
  loading: LoadingState;
  error: ErrorState;
  updateFilters: (newFilters: Filters) => Filters;
  fetchAllDashboardData: (currentFilters?: Filters | null) => Promise<any>;
  fetchTotalItemCount: (currentFilters?: Filters | null) => Promise<number>;
  fetchDashboardStats: (currentFilters?: Filters | null) => Promise<DashboardStats>;
  fetchChartData: (chartType: string, currentFilters?: Filters | null) => Promise<any[]>;
  fetchTableData: (page?: number, limit?: number, currentFilters?: Filters | null) => Promise<any[]>;
}