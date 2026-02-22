import { QueryBuilder, QueryBuilderValidationError } from '../../src/services/queryBuilder';

describe('QueryBuilder security hardening', () => {
  test('rejects missing tenantId', async () => {
    await expect(
      QueryBuilder.buildQuery({
        dataSources: [],
        columns: [{ id: 'item_name' }]
      })
    ).rejects.toBeInstanceOf(QueryBuilderValidationError);
  });

  test('rejects unknown fields', async () => {
    await expect(
      QueryBuilder.buildQuery({
        dataSources: [],
        tenantId: 'tenant-1',
        columns: [{ id: 'non_existing_field' }]
      })
    ).rejects.toBeInstanceOf(QueryBuilderValidationError);
  });

  test('rejects unsupported operators', async () => {
    await expect(
      QueryBuilder.buildQuery({
        dataSources: [],
        tenantId: 'tenant-1',
        columns: [{ id: 'item_name' }],
        filters: [
          {
            field: 'item_name',
            operator: 'raw',
            value: 'x'
          }
        ]
      })
    ).rejects.toBeInstanceOf(QueryBuilderValidationError);
  });

  test('binds filter values as parameters', async () => {
    const sql = await QueryBuilder.buildQuery({
      dataSources: [],
      tenantId: 'tenant-1',
      columns: [{ id: 'item_name' }],
      filters: [
        {
          field: 'item_name',
          operator: 'equals',
          value: `x' OR 1=1 --`
        }
      ]
    });

    const rawValues = (sql as any).values || [];
    expect(rawValues).toContain(`x' OR 1=1 --`);
  });
});
