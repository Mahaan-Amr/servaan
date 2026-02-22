/**
 * Workspace Connector Interface
 * Defines the contract for connecting to different workspaces
 * All connectors MUST implement tenant isolation
 */

export interface Schema {
  tables: Table[];
  relationships: Relationship[];
}

export interface Table {
  name: string;
  fields: Field[];
  primaryKey: string;
  indexes: string[];
}

export interface Field {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'json';
  nullable: boolean;
  description?: string;
}

export interface Relationship {
  from: string;
  to: string;
  type: 'one-to-many' | 'many-to-one' | 'many-to-many';
  key: string; // e.g., "id -> orderId"
}

export interface Query {
  select: SelectField[];
  from: string;
  where?: any;
  groupBy?: string[];
  orderBy?: OrderBy[];
  limit?: number;
  offset?: number;
}

export interface SelectField {
  field: string;
  table: string;
  alias?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
}

export interface OrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

export interface Data {
  rows: any[];
  columns: string[];
  rowCount: number;
}

/**
 * Base interface for all workspace connectors
 * CRITICAL: All methods MUST require tenantId parameter
 */
export interface WorkspaceConnector {
  workspaceId: string;
  name: string;
  
  /**
   * Connect to workspace (optional initialization)
   */
  connect(): Promise<void>;
  
  /**
   * Disconnect from workspace (optional cleanup)
   */
  disconnect(): Promise<void>;
  
  /**
   * Get workspace schema
   * CRITICAL: tenantId required for tenant-specific schema
   */
  getSchema(tenantId: string): Promise<Schema>;
  
  /**
   * Execute query against workspace
   * CRITICAL: tenantId required for tenant isolation
   */
  executeQuery(query: Query, tenantId: string): Promise<Data>;
  
  /**
   * Validate connector configuration
   */
  validate(): Promise<boolean>;
  
  /**
   * Get connector health status
   */
  getHealth(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }>;
}

