/*
  # ConsciousDB Schema - Energy-Aware Database Analysis System

  ## Overview
  This migration creates the database schema for ConsciousDB, a tool that analyzes SQL queries
  for energy consumption and carbon emissions, providing optimization recommendations.

  ## New Tables
  
  ### `user_databases`
  Stores virtual database definitions created by users
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - Reference to auth user
  - `name` (text) - Database name
  - `description` (text) - Optional description
  - `created_at` (timestamptz) - Creation timestamp
  
  ### `database_tables`
  Stores table definitions within user databases
  - `id` (uuid, primary key) - Unique identifier
  - `database_id` (uuid) - Reference to user_databases
  - `table_name` (text) - Name of the table
  - `schema_definition` (jsonb) - Column definitions and types
  - `estimated_rows` (bigint) - Estimated number of rows
  - `created_at` (timestamptz) - Creation timestamp
  
  ### `query_analyses`
  Stores SQL query analysis results
  - `id` (uuid, primary key) - Unique identifier
  - `database_id` (uuid) - Reference to user_databases
  - `original_query` (text) - Original SQL query
  - `optimized_query` (text) - Suggested optimized query
  - `cpu_cost` (decimal) - CPU cost in arbitrary units
  - `io_cost` (decimal) - I/O cost in arbitrary units
  - `execution_time_s` (decimal) - Estimated execution time
  - `energy_joules` (decimal) - Energy consumption in joules
  - `co2_emissions_g` (decimal) - CO2 emissions in grams
  - `optimized_energy_joules` (decimal) - Energy after optimization
  - `optimized_co2_emissions_g` (decimal) - CO2 after optimization
  - `optimization_suggestions` (text) - Optimization recommendations
  - `created_at` (timestamptz) - Analysis timestamp
  
  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Authenticated users can create and manage their databases and analyses
*/

-- Create user_databases table
CREATE TABLE IF NOT EXISTS user_databases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create database_tables table
CREATE TABLE IF NOT EXISTS database_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id uuid REFERENCES user_databases(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  schema_definition jsonb DEFAULT '[]'::jsonb,
  estimated_rows bigint DEFAULT 10000000,
  created_at timestamptz DEFAULT now(),
  UNIQUE(database_id, table_name)
);

-- Create query_analyses table
CREATE TABLE IF NOT EXISTS query_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id uuid REFERENCES user_databases(id) ON DELETE CASCADE,
  original_query text NOT NULL,
  optimized_query text,
  cpu_cost decimal(15,4) DEFAULT 0,
  io_cost decimal(15,4) DEFAULT 0,
  execution_time_s decimal(10,6) DEFAULT 0,
  energy_joules decimal(15,4) DEFAULT 0,
  co2_emissions_g decimal(15,6) DEFAULT 0,
  optimized_energy_joules decimal(15,4) DEFAULT 0,
  optimized_co2_emissions_g decimal(15,6) DEFAULT 0,
  optimization_suggestions text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_databases
CREATE POLICY "Users can view own databases"
  ON user_databases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own databases"
  ON user_databases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own databases"
  ON user_databases FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own databases"
  ON user_databases FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for database_tables
CREATE POLICY "Users can view tables in own databases"
  ON database_tables FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_databases
      WHERE user_databases.id = database_tables.database_id
      AND user_databases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tables in own databases"
  ON database_tables FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_databases
      WHERE user_databases.id = database_tables.database_id
      AND user_databases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tables in own databases"
  ON database_tables FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_databases
      WHERE user_databases.id = database_tables.database_id
      AND user_databases.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_databases
      WHERE user_databases.id = database_tables.database_id
      AND user_databases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tables in own databases"
  ON database_tables FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_databases
      WHERE user_databases.id = database_tables.database_id
      AND user_databases.user_id = auth.uid()
    )
  );

-- RLS Policies for query_analyses
CREATE POLICY "Users can view analyses in own databases"
  ON query_analyses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_databases
      WHERE user_databases.id = query_analyses.database_id
      AND user_databases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create analyses in own databases"
  ON query_analyses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_databases
      WHERE user_databases.id = query_analyses.database_id
      AND user_databases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own analyses"
  ON query_analyses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_databases
      WHERE user_databases.id = query_analyses.database_id
      AND user_databases.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_databases_user_id ON user_databases(user_id);
CREATE INDEX IF NOT EXISTS idx_database_tables_database_id ON database_tables(database_id);
CREATE INDEX IF NOT EXISTS idx_query_analyses_database_id ON query_analyses(database_id);
CREATE INDEX IF NOT EXISTS idx_query_analyses_created_at ON query_analyses(created_at DESC);