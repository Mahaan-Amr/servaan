import { PrismaClient } from '../../../shared/generated/client';
import { calculateCurrentStock } from './inventoryService';

const prisma = new PrismaClient();

export interface CreateAuditCycleData {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
}

export interface CreateAuditEntryData {
  auditCycleId: string;
  itemId: string;
  countedQuantity: number;
  reason?: string;
}

export interface DiscrepancyReport {
  auditCycleId: string;
  auditCycle: {
    id: string;
    name: string;
    status: string;
    startDate: Date;
    endDate: Date;
  };
  totalItems: number;
  itemsWithDiscrepancy: number;
  totalDiscrepancyValue: number;
  discrepancies: Array<{
    id: string;
    itemId: string;
    itemName: string;
    itemCategory: string;
    itemUnit: string;
    countedQuantity: number;
    systemQuantity: number;
    discrepancy: number;
    reason?: string;
    correctionApplied: boolean;
  }>;
}

/**
 * Create a new audit cycle
 */
export async function createAuditCycle(
  data: CreateAuditCycleData,
  createdBy: string,
  tenantId: string
) {
  // Validate dates
  if (data.startDate >= data.endDate) {
    throw new Error('تاریخ شروع باید قبل از تاریخ پایان باشد');
  }

  return await prisma.inventoryAuditCycle.create({
    data: {
      ...data,
      createdBy,
      tenantId,
      status: 'DRAFT'
    },
    include: {
      createdByUser: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

/**
 * Start an audit cycle (change status to IN_PROGRESS)
 */
export async function startAuditCycle(
  auditCycleId: string,
  tenantId: string
) {
  const cycle = await prisma.inventoryAuditCycle.findFirst({
    where: {
      id: auditCycleId,
      tenantId,
      status: 'DRAFT'
    }
  });

  if (!cycle) {
    throw new Error('چرخه انبارگردانی یافت نشد یا قابل شروع نیست');
  }

  return await prisma.inventoryAuditCycle.update({
    where: { id: auditCycleId },
    data: {
      status: 'IN_PROGRESS'
    }
  });
}

/**
 * Add an audit entry (counted stock for an item)
 */
export async function addAuditEntry(
  data: CreateAuditEntryData,
  countedBy: string,
  createdBy: string,
  tenantId: string
) {
  // Verify audit cycle exists and is in progress
  const auditCycle = await prisma.inventoryAuditCycle.findFirst({
    where: {
      id: data.auditCycleId,
      tenantId,
      status: 'IN_PROGRESS'
    }
  });

  if (!auditCycle) {
    throw new Error('چرخه انبارگردانی یافت نشد یا در حال انجام نیست');
  }

  // Verify item exists and belongs to tenant
  const item = await prisma.item.findFirst({
    where: {
      id: data.itemId,
      tenantId,
      deletedAt: null,
      isActive: true
    }
  });

  if (!item) {
    throw new Error('کالا یافت نشد یا غیرفعال است');
  }

  // Calculate current system stock
  const systemQuantity = await calculateCurrentStock(data.itemId, tenantId);

  // Calculate discrepancy
  const discrepancy = data.countedQuantity - systemQuantity;

  // Check if entry already exists for this item in this cycle
  const existingEntry = await prisma.inventoryAuditEntry.findFirst({
    where: {
      auditCycleId: data.auditCycleId,
      itemId: data.itemId
    }
  });

  if (existingEntry) {
    // Update existing entry
    return await prisma.inventoryAuditEntry.update({
      where: { id: existingEntry.id },
      data: {
        countedQuantity: data.countedQuantity,
        systemQuantity,
        discrepancy,
        reason: data.reason,
        countedBy,
        countedAt: new Date()
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            category: true,
            unit: true
          }
        },
        countedByUser: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  // Create new entry
  return await prisma.inventoryAuditEntry.create({
    data: {
      auditCycleId: data.auditCycleId,
      tenantId,
      itemId: data.itemId,
      countedQuantity: data.countedQuantity,
      systemQuantity,
      discrepancy,
      reason: data.reason,
      countedBy,
      createdBy
    },
    include: {
      item: {
        select: {
          id: true,
          name: true,
          category: true,
          unit: true
        }
      },
      countedByUser: {
        select: {
          id: true,
          name: true
        }
      },
      createdByUser: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
}

/**
 * Add multiple audit entries in bulk
 */
export async function addBulkAuditEntries(
  entries: CreateAuditEntryData[],
  countedBy: string,
  createdBy: string,
  tenantId: string
) {
  const results = {
    created: [] as any[],
    errors: [] as Array<{ itemId: string; error: string }>
  };

  // Process all entries in a transaction
  await prisma.$transaction(async (tx) => {
    // Verify audit cycle exists and is in progress (use first entry's cycle ID)
    if (entries.length === 0) {
      throw new Error('حداقل یک ورودی الزامی است');
    }

    const auditCycle = await tx.inventoryAuditCycle.findFirst({
      where: {
        id: entries[0].auditCycleId,
        tenantId,
        status: 'IN_PROGRESS'
      }
    });

    if (!auditCycle) {
      throw new Error('چرخه انبارگردانی یافت نشد یا در حال انجام نیست');
    }

    // Process each entry
    for (const entryData of entries) {
      try {
        // Verify item exists and belongs to tenant
        const item = await tx.item.findFirst({
          where: {
            id: entryData.itemId,
            tenantId,
            deletedAt: null,
            isActive: true
          }
        });

        if (!item) {
          results.errors.push({
            itemId: entryData.itemId,
            error: 'کالا یافت نشد یا غیرفعال است'
          });
          continue;
        }

        // Calculate current system stock
        const systemQuantity = await calculateCurrentStock(entryData.itemId, tenantId);

        // Calculate discrepancy
        const discrepancy = entryData.countedQuantity - systemQuantity;

        // Check if entry already exists for this item in this cycle
        const existingEntry = await tx.inventoryAuditEntry.findFirst({
          where: {
            auditCycleId: entryData.auditCycleId,
            itemId: entryData.itemId
          }
        });

        if (existingEntry) {
          // Update existing entry
          const updated = await tx.inventoryAuditEntry.update({
            where: { id: existingEntry.id },
            data: {
              countedQuantity: entryData.countedQuantity,
              systemQuantity,
              discrepancy,
              reason: entryData.reason,
              countedBy,
              countedAt: new Date()
            },
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  unit: true
                }
              },
              countedByUser: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          });
          results.created.push(updated);
        } else {
          // Create new entry
          const created = await tx.inventoryAuditEntry.create({
            data: {
              auditCycleId: entryData.auditCycleId,
              tenantId,
              itemId: entryData.itemId,
              countedQuantity: entryData.countedQuantity,
              systemQuantity,
              discrepancy,
              reason: entryData.reason,
              countedBy,
              createdBy
            },
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  unit: true
                }
              },
              countedByUser: {
                select: {
                  id: true,
                  name: true
                }
              },
              createdByUser: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          });
          results.created.push(created);
        }
      } catch (error) {
        results.errors.push({
          itemId: entryData.itemId,
          error: error instanceof Error ? error.message : 'خطای نامشخص'
        });
      }
    }
  }, {
    isolationLevel: 'Serializable',
    timeout: 30000 // 30 seconds timeout for bulk operations
  });

  return results;
}

/**
 * Generate discrepancy report for an audit cycle
 */
export async function generateDiscrepancyReport(
  auditCycleId: string,
  tenantId: string
): Promise<DiscrepancyReport> {
  const auditCycle = await prisma.inventoryAuditCycle.findFirst({
    where: {
      id: auditCycleId,
      tenantId
    },
    include: {
      entries: {
        include: {
          item: {
            select: {
              id: true,
              name: true,
              category: true,
              unit: true
            }
          }
        }
      }
    }
  });

  if (!auditCycle) {
    throw new Error('چرخه انبارگردانی یافت نشد');
  }

  const entries = auditCycle.entries;
  const itemsWithDiscrepancy = entries.filter(e => Math.abs(e.discrepancy) > 0.01);
  const totalDiscrepancyValue = entries.reduce((sum, e) => sum + Math.abs(e.discrepancy), 0);

  return {
    auditCycleId: auditCycle.id,
    auditCycle: {
      id: auditCycle.id,
      name: auditCycle.name,
      status: auditCycle.status,
      startDate: auditCycle.startDate,
      endDate: auditCycle.endDate
    },
    totalItems: entries.length,
    itemsWithDiscrepancy: itemsWithDiscrepancy.length,
    totalDiscrepancyValue,
    discrepancies: entries
      .filter(e => Math.abs(e.discrepancy) > 0.01)
      .map(e => ({
        id: e.id,
        itemId: e.itemId,
        itemName: e.item.name,
        itemCategory: e.item.category,
        itemUnit: e.item.unit,
        countedQuantity: e.countedQuantity,
        systemQuantity: e.systemQuantity,
        discrepancy: e.discrepancy,
        reason: e.reason || undefined,
        correctionApplied: e.correctionApplied
      }))
  };
}

/**
 * Apply correction for a discrepancy (create inventory entry)
 */
export async function applyCorrection(
  auditEntryId: string,
  reason: string,
  userId: string,
  tenantId: string
) {
  const auditEntry = await prisma.inventoryAuditEntry.findFirst({
    where: {
      id: auditEntryId,
      tenantId,
      correctionApplied: false
    },
    include: {
      item: true
    }
  });

  if (!auditEntry) {
    throw new Error('ورودی انبارگردانی یافت نشد یا قبلاً اصلاح شده است');
  }

  if (Math.abs(auditEntry.discrepancy) < 0.01) {
    throw new Error('این مورد اختلاف ندارد و نیازی به اصلاح نیست');
  }

  // Create correction inventory entry
  const correctionQuantity = auditEntry.discrepancy; // Positive for IN, negative for OUT
  const entryType = correctionQuantity > 0 ? 'IN' : 'OUT';

  return await prisma.$transaction(async (tx) => {
    // Create inventory entry
    const inventoryEntry = await tx.inventoryEntry.create({
      data: {
        itemId: auditEntry.itemId,
        quantity: Math.abs(correctionQuantity),
        type: entryType,
        note: `اصلاح انبارگردانی: ${reason}`,
        userId,
        tenantId
      }
    });

    // Update audit entry to mark correction as applied
    await tx.inventoryAuditEntry.update({
      where: { id: auditEntryId },
      data: {
        correctionApplied: true,
        correctionEntryId: inventoryEntry.id,
        reason: reason || auditEntry.reason
      }
    });

    return {
      inventoryEntry,
      auditEntry: await tx.inventoryAuditEntry.findUnique({
        where: { id: auditEntryId },
        include: {
          item: true,
          correctionEntry: true
        }
      })
    };
  });
}

/**
 * Complete an audit cycle
 */
export async function completeAuditCycle(
  auditCycleId: string,
  completedBy: string,
  tenantId: string
) {
  const auditCycle = await prisma.inventoryAuditCycle.findFirst({
    where: {
      id: auditCycleId,
      tenantId,
      status: 'IN_PROGRESS'
    }
  });

  if (!auditCycle) {
    throw new Error('چرخه انبارگردانی یافت نشد یا قابل تکمیل نیست');
  }

  return await prisma.inventoryAuditCycle.update({
    where: { id: auditCycleId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      completedBy
    }
  });
}

/**
 * Cancel an audit cycle
 */
export async function cancelAuditCycle(
  auditCycleId: string,
  cancelledBy: string,
  cancelledReason: string,
  tenantId: string
) {
  const auditCycle = await prisma.inventoryAuditCycle.findFirst({
    where: {
      id: auditCycleId,
      tenantId,
      status: { in: ['DRAFT', 'IN_PROGRESS'] }
    }
  });

  if (!auditCycle) {
    throw new Error('چرخه انبارگردانی یافت نشد یا قابل لغو نیست');
  }

  return await prisma.inventoryAuditCycle.update({
    where: { id: auditCycleId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy,
      cancelledReason
    }
  });
}

/**
 * Get all audit cycles for a tenant
 */
export async function getAuditCycles(
  tenantId: string,
  filters?: {
    status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    startDate?: Date;
    endDate?: Date;
  }
) {
  const where: any = {
    tenantId
  };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.startDate || filters?.endDate) {
    where.startDate = {};
    if (filters.startDate) {
      where.startDate.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.startDate.lte = filters.endDate;
    }
  }

  return await prisma.inventoryAuditCycle.findMany({
    where,
    include: {
      createdByUser: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      completedByUser: {
        select: {
          id: true,
          name: true
        }
      },
      cancelledByUser: {
        select: {
          id: true,
          name: true
        }
      },
      _count: {
        select: {
          entries: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

/**
 * Get audit cycle by ID
 */
export async function getAuditCycleById(
  auditCycleId: string,
  tenantId: string
) {
  return await prisma.inventoryAuditCycle.findFirst({
    where: {
      id: auditCycleId,
      tenantId
    },
    include: {
      createdByUser: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      completedByUser: {
        select: {
          id: true,
          name: true
        }
      },
      cancelledByUser: {
        select: {
          id: true,
          name: true
        }
      },
      entries: {
        include: {
          item: {
            select: {
              id: true,
              name: true,
              category: true,
              unit: true
            }
          },
          countedByUser: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });
}

