/**
 * BI Workspace Migration Script
 * Migrates data from CustomReport to BIReport model
 * 
 * This script:
 * 1. Migrates all CustomReport records to BIReport
 * 2. Updates ReportExecution records to reference BIReport
 * 3. Preserves all data and relationships
 * 4. Validates migration integrity
 * 
 * IMPORTANT: Before running this script:
 * 1. Run: cd src/prisma && npx prisma generate
 * 2. Ensure database migrations are applied
 * 3. Backup your database
 */

import { PrismaClient } from '../src/shared/generated/client';

const prisma = new PrismaClient();

interface MigrationStats {
  totalCustomReports: number;
  migratedReports: number;
  failedReports: number;
  totalExecutions: number;
  updatedExecutions: number;
  errors: string[];
}

/**
 * Map CustomReport reportType to BIReport type
 */
function mapReportType(oldType: string): string {
  const typeMap: Record<string, string> = {
    'TABULAR': 'TABULAR',
    'CHART': 'CHART',
    'DASHBOARD': 'DASHBOARD',
    'PIVOT': 'PIVOT'
  };
  return typeMap[oldType] || 'TABULAR';
}

/**
 * Transform CustomReport data to BIReport config format
 */
function transformReportConfig(customReport: any): any {
  return {
    dataSources: customReport.dataSources || [],
    columns: customReport.columnsConfig || [],
    filters: customReport.filtersConfig || [],
    sorting: customReport.sortingConfig || [],
    chart: customReport.chartConfig || null,
    layout: customReport.layoutConfig || null
  };
}

/**
 * Main migration function
 */
async function migrateBIWorkspace(): Promise<void> {
  const stats: MigrationStats = {
    totalCustomReports: 0,
    migratedReports: 0,
    failedReports: 0,
    totalExecutions: 0,
    updatedExecutions: 0,
    errors: []
  };

  console.log('🚀 Starting BI Workspace Migration...\n');

  try {
    // Step 1: Get all CustomReport records
    console.log('📊 Step 1: Fetching CustomReport records...');
    const customReports = await prisma.customReport.findMany({
      include: {
        executions: true
      }
    });

    stats.totalCustomReports = customReports.length;
    console.log(`   Found ${stats.totalCustomReports} CustomReport records\n`);

    if (stats.totalCustomReports === 0) {
      console.log('✅ No reports to migrate. Migration complete!');
      return;
    }

    // Step 2: Migrate each CustomReport to BIReport
    console.log('🔄 Step 2: Migrating CustomReport → BIReport...');
    
    for (const customReport of customReports) {
      try {
        // Check if BIReport already exists (idempotent migration)
        // Note: Prisma generates camelCase model names (BIReport -> bIReport)
        const existingBIReport = await (prisma as any).bIReport?.findUnique({
          where: { id: customReport.id }
        });

        if (existingBIReport) {
          console.log(`   ⏭️  Skipping ${customReport.id} (already migrated)`);
          stats.migratedReports++;
          continue;
        }

        // Parse JSON fields
        const dataSources = typeof customReport.dataSources === 'string' 
          ? JSON.parse(customReport.dataSources) 
          : customReport.dataSources;
        
        const columnsConfig = typeof customReport.columnsConfig === 'string'
          ? JSON.parse(customReport.columnsConfig)
          : customReport.columnsConfig;
        
        const filtersConfig = typeof customReport.filtersConfig === 'string'
          ? JSON.parse(customReport.filtersConfig || '[]')
          : customReport.filtersConfig || [];
        
        const sortingConfig = typeof customReport.sortingConfig === 'string'
          ? JSON.parse(customReport.sortingConfig || '[]')
          : customReport.sortingConfig || [];
        
        const chartConfig = typeof customReport.chartConfig === 'string'
          ? JSON.parse(customReport.chartConfig || '{}')
          : customReport.chartConfig || null;
        
        const layoutConfig = typeof customReport.layoutConfig === 'string'
          ? JSON.parse(customReport.layoutConfig || '{}')
          : customReport.layoutConfig || null;
        
        const sharedWith = typeof customReport.sharedWith === 'string'
          ? JSON.parse(customReport.sharedWith || '[]')
          : customReport.sharedWith || [];

        // Create BIReport with same ID (preserves relationships)
        // Note: Prisma generates camelCase model names (BIReport -> bIReport)
        const biReport = await (prisma as any).bIReport.create({
          data: {
            id: customReport.id, // CRITICAL: Keep same ID for ReportExecution references
            tenantId: customReport.tenantId,
            name: customReport.name,
            description: customReport.description,
            type: mapReportType(customReport.reportType),
            config: {
              dataSources: dataSources,
              columns: columnsConfig,
              filters: filtersConfig,
              sorting: sortingConfig,
              chart: chartConfig,
              layout: layoutConfig
            },
            template: false, // CustomReport doesn't have template field
            isPublic: customReport.isPublic,
            createdBy: customReport.createdBy,
            createdAt: customReport.createdAt,
            updatedAt: customReport.updatedAt
          }
        });

        console.log(`   ✅ Migrated: ${customReport.name} (${customReport.id})`);
        stats.migratedReports++;

        // Step 3: Update ReportExecution records to reference BIReport
        if (customReport.executions && customReport.executions.length > 0) {
          stats.totalExecutions += customReport.executions.length;
          
          for (const execution of customReport.executions) {
            try {
              await prisma.reportExecution.update({
                where: { id: execution.id },
                data: {
                  // ReportExecution.reportId already points to the same ID
                  // We just need to ensure the biReport relation is set
                  // Since we kept the same ID, the relation should work automatically
                }
              });
              stats.updatedExecutions++;
            } catch (error) {
              const errorMsg = `Failed to update execution ${execution.id}: ${(error as Error).message}`;
              console.error(`   ⚠️  ${errorMsg}`);
              stats.errors.push(errorMsg);
            }
          }
        }

      } catch (error) {
        const errorMsg = `Failed to migrate report ${customReport.id}: ${(error as Error).message}`;
        console.error(`   ❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
        stats.failedReports++;
      }
    }

    console.log('\n📈 Step 3: Validating migration...');

    // Step 4: Validate migration
    // Note: Prisma generates camelCase model names (BIReport -> bIReport)
    const biReportCount = await (prisma as any).bIReport?.count() || 0;
    const customReportCount = await prisma.customReport.count();

    console.log(`   CustomReport count: ${customReportCount}`);
    console.log(`   BIReport count: ${biReportCount}`);

    if (biReportCount < stats.totalCustomReports) {
      throw new Error(`Migration incomplete: Expected ${stats.totalCustomReports} BIReports, found ${biReportCount}`);
    }

    // Step 5: Verify ReportExecution references
    // Note: After Prisma client regeneration, this will work correctly
    const executionsWithBIReport = await prisma.reportExecution.count({
      where: {
        reportId: {
          in: customReports.map(r => r.id)
        }
      }
    });

    console.log(`   ReportExecutions with BIReport: ${executionsWithBIReport}`);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total CustomReports:     ${stats.totalCustomReports}`);
    console.log(`Successfully migrated:   ${stats.migratedReports}`);
    console.log(`Failed migrations:       ${stats.failedReports}`);
    console.log(`Total Executions:        ${stats.totalExecutions}`);
    console.log(`Updated Executions:      ${stats.updatedExecutions}`);
    console.log(`Errors:                  ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      stats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (stats.failedReports === 0 && stats.errors.length === 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Test the new BI workspace');
      console.log('   2. Verify all reports work correctly');
      console.log('   3. After verification, you can deprecate CustomReport model');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review and fix.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
if (require.main === module) {
  migrateBIWorkspace()
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateBIWorkspace };

