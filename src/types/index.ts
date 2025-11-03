export interface Database {
  id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface DatabaseTable {
  id: string;
  database_id: string;
  table_name: string;
  schema_definition: ColumnDefinition[];
  estimated_rows: number;
  created_at: string;
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
}

export interface QueryAnalysis {
  id: string;
  database_id: string;
  original_query: string;
  optimized_query: string | null;
  cpu_cost: number;
  io_cost: number;
  execution_time_s: number;
  energy_joules: number;
  co2_emissions_g: number;
  optimized_energy_joules: number;
  optimized_co2_emissions_g: number;
  optimization_suggestions: string;
  created_at: string;
}

export interface AnalysisResult {
  original: {
    query: string;
    cpu_cost: number;
    io_cost: number;
    execution_time_s: number;
    energy_joules: number;
    co2_emissions_g: number;
  };
  optimized: {
    query: string;
    execution_time_s: number;
    energy_joules: number;
    co2_emissions_g: number;
  };
  suggestions: string;
  savings: {
    time_percent: number;
    energy_percent: number;
    co2_percent: number;
  };
}
