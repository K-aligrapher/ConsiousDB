import { useState, useEffect } from 'react';
import { Database, Plus, Table, Trash2, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database as DatabaseType, DatabaseTable, ColumnDefinition } from '../types';

interface DatabaseManagerProps {
  onDatabaseSelect: (database: DatabaseType | null) => void;
  selectedDatabase: DatabaseType | null;
}

export function DatabaseManager({ onDatabaseSelect, selectedDatabase }: DatabaseManagerProps) {
  const [databases, setDatabases] = useState<DatabaseType[]>([]);
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [showNewDbForm, setShowNewDbForm] = useState(false);
  const [showNewTableForm, setShowNewTableForm] = useState(false);
  const [newDbName, setNewDbName] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { name: 'id', type: 'INTEGER', nullable: false }
  ]);

  useEffect(() => {
    loadDatabases();
  }, []);

  useEffect(() => {
    if (selectedDatabase) {
      loadTables(selectedDatabase.id);
    } else {
      setTables([]);
    }
  }, [selectedDatabase]);

  const loadDatabases = async () => {
    const { data, error } = await supabase
      .from('user_databases')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setDatabases(data);
      if (data.length > 0 && !selectedDatabase) {
        onDatabaseSelect(data[0]);
      }
    }
  };

  const loadTables = async (databaseId: string) => {
    const { data, error } = await supabase
      .from('database_tables')
      .select('*')
      .eq('database_id', databaseId)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setTables(data);
    }
  };

  const createDatabase = async () => {
    if (!newDbName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_databases')
      .insert([{ name: newDbName, user_id: user.id }])
      .select()
      .single();

    if (data && !error) {
      setDatabases([data, ...databases]);
      onDatabaseSelect(data);
      setNewDbName('');
      setShowNewDbForm(false);
    }
  };

  const createTable = async () => {
    if (!newTableName.trim() || !selectedDatabase) return;

    const { data, error } = await supabase
      .from('database_tables')
      .insert([{
        database_id: selectedDatabase.id,
        table_name: newTableName,
        schema_definition: columns
      }])
      .select()
      .single();

    if (data && !error) {
      setTables([data, ...tables]);
      setNewTableName('');
      setColumns([{ name: 'id', type: 'INTEGER', nullable: false }]);
      setShowNewTableForm(false);
    }
  };

  const deleteDatabase = async (id: string) => {
    await supabase.from('user_databases').delete().eq('id', id);
    const newDatabases = databases.filter(db => db.id !== id);
    setDatabases(newDatabases);
    if (selectedDatabase?.id === id) {
      onDatabaseSelect(newDatabases[0] || null);
    }
  };

  const deleteTable = async (id: string) => {
    await supabase.from('database_tables').delete().eq('id', id);
    setTables(tables.filter(t => t.id !== id));
  };

  const addColumn = () => {
    setColumns([...columns, { name: '', type: 'TEXT', nullable: true }]);
  };

  const updateColumn = (index: number, field: keyof ColumnDefinition, value: string | boolean) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    setColumns(newColumns);
  };

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          <h2 className="font-semibold">Database Manager</h2>
        </div>
        <button
          onClick={() => setShowNewDbForm(true)}
          className="p-1.5 hover:bg-blue-500 rounded transition-colors"
          title="New Database"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showNewDbForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <input
              type="text"
              value={newDbName}
              onChange={(e) => setNewDbName(e.target.value)}
              placeholder="Database name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={createDatabase}
                className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewDbForm(false);
                  setNewDbName('');
                }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Databases</h3>
          {databases.map((db) => (
            <div
              key={db.id}
              className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                selectedDatabase?.id === db.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onDatabaseSelect(db)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-sm">{db.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDatabase(db.id);
                  }}
                  className="p-1 hover:bg-red-100 rounded text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {selectedDatabase && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tables in {selectedDatabase.name}
              </h3>
              <button
                onClick={() => setShowNewTableForm(true)}
                className="p-1 hover:bg-gray-100 rounded text-gray-600"
                title="New Table"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showNewTableForm && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Table name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">Columns</span>
                    <button
                      onClick={addColumn}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      + Add Column
                    </button>
                  </div>
                  {columns.map((col, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <input
                        type="text"
                        value={col.name}
                        onChange={(e) => updateColumn(idx, 'name', e.target.value)}
                        placeholder="Column name"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                      <select
                        value={col.type}
                        onChange={(e) => updateColumn(idx, 'type', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-xs"
                      >
                        <option value="TEXT">TEXT</option>
                        <option value="INTEGER">INTEGER</option>
                        <option value="REAL">REAL</option>
                        <option value="BOOLEAN">BOOLEAN</option>
                        <option value="DATE">DATE</option>
                      </select>
                      <button
                        onClick={() => removeColumn(idx)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                        disabled={columns.length === 1}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={createTable}
                    className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                  >
                    Create Table
                  </button>
                  <button
                    onClick={() => {
                      setShowNewTableForm(false);
                      setNewTableName('');
                      setColumns([{ name: 'id', type: 'INTEGER', nullable: false }]);
                    }}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {tables.map((table) => (
              <div
                key={table.id}
                className="p-3 rounded-lg border border-gray-200 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-sm">{table.table_name}</span>
                  </div>
                  <button
                    onClick={() => deleteTable(table.id)}
                    className="p-1 hover:bg-red-100 rounded text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  {Array.isArray(table.schema_definition) && table.schema_definition.map((col: ColumnDefinition, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-mono">{col.name}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">{col.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
