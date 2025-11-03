import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CPU_POWER_W = 30.0;
const DISK_POWER_W = 5.0;
const GRID_EMISSION_FACTOR_KG_PER_KWH = 0.475;
const KWH_PER_JOULE = 1 / 3_600_000;
const COST_TO_TIME_FACTOR = 0.00015;
const SIMULATED_TABLE_ROWS = 10_000_000;

interface QueryMetrics {
  cpu_cost_au: number;
  io_cost_au: number;
  estimated_time_s: number;
  energy_joules: number;
  co2_emissions_g: number;
}

function analyzeQueryComplexity(sqlQuery: string) {
  const upperQuery = sqlQuery.toUpperCase();
  let cpu_cost_au = 0;
  let io_cost_au = SIMULATED_TABLE_ROWS * 0.0005;
  const suggestions: string[] = [];
  let optimized_query = sqlQuery;

  if (upperQuery.includes('SELECT *')) {
    cpu_cost_au += SIMULATED_TABLE_ROWS * 0.0002;
    io_cost_au += SIMULATED_TABLE_ROWS * 0.0003;
    suggestions.push("Avoid 'SELECT *'; specify columns explicitly.");
    optimized_query = optimized_query.replace(/SELECT\s+\*/i, 'SELECT col1, col2');
  }

  if (upperQuery.includes('ORDER BY') || upperQuery.includes('GROUP BY')) {
    cpu_cost_au += SIMULATED_TABLE_ROWS * Math.log(SIMULATED_TABLE_ROWS) * 0.000001;
    suggestions.push("Ensure ORDER BY/GROUP BY columns are indexed.");
  }

  const numJoins = (sqlQuery.match(/JOIN/gi) || []).length;
  if (numJoins > 0) {
    cpu_cost_au += numJoins * SIMULATED_TABLE_ROWS * 0.00005;
    io_cost_au += numJoins * SIMULATED_TABLE_ROWS * 0.0001;
    suggestions.push(`Review JOIN strategy (${numJoins} join${numJoins > 1 ? 's' : ''} detected); consider hash joins.`);
  }

  if (upperQuery.includes('WHERE') && !upperQuery.includes('INDEXED_COLUMN')) {
    io_cost_au += SIMULATED_TABLE_ROWS * 0.0003;
    suggestions.push("Add index to WHERE filter column(s).");
  }

  if (upperQuery.includes('DISTINCT')) {
    cpu_cost_au += SIMULATED_TABLE_ROWS * 0.0001;
    suggestions.push("DISTINCT operations are expensive; ensure it's necessary.");
  }

  if ((sqlQuery.match(/\(/g) || []).length > 3) {
    cpu_cost_au += SIMULATED_TABLE_ROWS * 0.00003;
    suggestions.push("Complex nested queries detected; consider CTEs or temp tables.");
  }

  return {
    cpu_cost_au: Math.max(cpu_cost_au, 100),
    io_cost_au: Math.max(io_cost_au, 100),
    optimization_suggestion: suggestions.join(' '),
    optimization_query: optimized_query
  };
}

function modelEnergy(cpu_cost: number, io_cost: number): QueryMetrics {
  const cpu_time = cpu_cost * COST_TO_TIME_FACTOR;
  const io_time = io_cost * COST_TO_TIME_FACTOR;
  const total_time = cpu_time + io_time;

  const energy = (cpu_time * CPU_POWER_W) + (io_time * DISK_POWER_W);
  const co2 = energy * KWH_PER_JOULE * GRID_EMISSION_FACTOR_KG_PER_KWH * 1000;

  return {
    cpu_cost_au: cpu_cost,
    io_cost_au: io_cost,
    estimated_time_s: total_time,
    energy_joules: energy,
    co2_emissions_g: co2
  };
}

function optimizeQuery(metrics: QueryMetrics): QueryMetrics {
  const CPU_EFFICIENCY = 0.55;
  const IO_EFFICIENCY = 0.35;

  return modelEnergy(
    metrics.cpu_cost_au * CPU_EFFICIENCY,
    metrics.io_cost_au * IO_EFFICIENCY
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required and must be a string' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const analysis = analyzeQueryComplexity(query);
    const baseMetrics = modelEnergy(analysis.cpu_cost_au, analysis.io_cost_au);
    const optimizedMetrics = optimizeQuery(baseMetrics);

    const result = {
      original: {
        query: query,
        cpu_cost: baseMetrics.cpu_cost_au,
        io_cost: baseMetrics.io_cost_au,
        execution_time_s: baseMetrics.estimated_time_s,
        energy_joules: baseMetrics.energy_joules,
        co2_emissions_g: baseMetrics.co2_emissions_g
      },
      optimized: {
        query: analysis.optimization_query,
        execution_time_s: optimizedMetrics.estimated_time_s,
        energy_joules: optimizedMetrics.energy_joules,
        co2_emissions_g: optimizedMetrics.co2_emissions_g
      },
      suggestions: analysis.optimization_suggestion,
      savings: {
        time_percent: ((baseMetrics.estimated_time_s - optimizedMetrics.estimated_time_s) / baseMetrics.estimated_time_s * 100),
        energy_percent: ((baseMetrics.energy_joules - optimizedMetrics.energy_joules) / baseMetrics.energy_joules * 100),
        co2_percent: ((baseMetrics.co2_emissions_g - optimizedMetrics.co2_emissions_g) / baseMetrics.co2_emissions_g * 100)
      }
    };

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
