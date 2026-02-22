/**
 * Dashboard Export Utility
 * Provides functions to export BI dashboards to PDF and Excel formats
 */

import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export interface DashboardExportData {
  title: string;
  period: string;
  kpis: {
    [key: string]: {
      value: number;
      previousValue?: number;
      change?: number;
      changePercent?: number;
      trend?: 'UP' | 'DOWN' | 'STABLE';
      unit?: string;
      description?: string;
    };
  };
  charts?: {
    revenueChart?: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
      }>;
    };
    topProductsChart?: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
      }>;
    };
    categoryChart?: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
      }>;
    };
  };
  workspace: 'ordering' | 'inventory' | 'merged';
  generatedAt: Date;
  generatedBy?: string;
}

/**
 * Export dashboard to PDF
 */
export function exportDashboardToPDF(data: DashboardExportData): void {
  const doc = new jsPDF();
  
  // Cover page
  doc.setFillColor(139, 92, 246); // Purple color
  doc.rect(0, 0, 210, 297, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('Business Intelligence Dashboard', 105, 120, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text(data.title, 105, 140, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Workspace: ${data.workspace.toUpperCase()}`, 105, 160, { align: 'center' });
  doc.text(`Period: ${data.period}`, 105, 170, { align: 'center' });
  doc.text(`Generated: ${data.generatedAt.toLocaleDateString('en-US')}`, 105, 180, { align: 'center' });
  
  // Page 2 - KPIs
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.text('Key Performance Indicators (KPIs)', 20, 30);
  
  let yPos = 50;
  const kpiEntries = Object.entries(data.kpis);
  
  kpiEntries.forEach(([key, kpi]) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 30;
    }
    
    // KPI Card
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(249, 250, 251);
    doc.rect(15, yPos - 10, 180, 25, 'F');
    doc.rect(15, yPos - 10, 180, 25);
    
    // KPI Name
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(key.replace(/([A-Z])/g, ' $1').trim(), 25, yPos);
    
    // KPI Value
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const valueText = `${kpi.value.toLocaleString('en-US')} ${kpi.unit || ''}`;
    doc.text(valueText, 25, yPos + 8);
    
    // Change percentage
    if (kpi.changePercent !== undefined) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const changeColor = kpi.changePercent >= 0 ? [34, 197, 94] : [239, 68, 68];
      doc.setTextColor(changeColor[0], changeColor[1], changeColor[2]);
      const changeText = `${kpi.changePercent >= 0 ? '+' : ''}${kpi.changePercent.toFixed(1)}%`;
      doc.text(changeText, 160, yPos + 8);
    }
    
    // Description
    if (kpi.description) {
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(kpi.description, 25, yPos + 15);
    }
    
    yPos += 35;
  });
  
  // Charts data (if available)
  if (data.charts) {
    // Revenue Chart Data
    if (data.charts.revenueChart && data.charts.revenueChart.labels.length > 0) {
      doc.addPage();
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text('Revenue Trend Data', 20, 30);
      
      // Table header
      doc.setDrawColor(229, 231, 235);
      doc.setFillColor(249, 250, 251);
      doc.rect(15, 40, 180, 10, 'F');
      doc.rect(15, 40, 180, 10);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Date', 25, 47);
      doc.text('Revenue', 80, 47);
      doc.text('Cost', 120, 47);
      doc.text('Profit', 160, 47);
      
      yPos = 55;
      const revenueData = data.charts.revenueChart;
      revenueData.labels.slice(0, 20).forEach((label, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 30;
        }
        
        doc.rect(15, yPos - 5, 180, 10);
        doc.text(label, 25, yPos);
        doc.text((revenueData.datasets[0]?.data[index] || 0).toLocaleString('en-US'), 80, yPos);
        doc.text((revenueData.datasets[1]?.data[index] || 0).toLocaleString('en-US'), 120, yPos);
        doc.text((revenueData.datasets[2]?.data[index] || 0).toLocaleString('en-US'), 160, yPos);
        
        yPos += 12;
      });
    }
    
    // Top Products Chart Data
    if (data.charts.topProductsChart && data.charts.topProductsChart.labels.length > 0) {
      doc.addPage();
      doc.setFontSize(18);
      doc.text('Top Products Data', 20, 30);
      
      doc.setDrawColor(229, 231, 235);
      doc.setFillColor(249, 250, 251);
      doc.rect(15, 40, 180, 10, 'F');
      doc.rect(15, 40, 180, 10);
      doc.setFontSize(10);
      doc.text('Product', 25, 47);
      doc.text('Revenue', 160, 47);
      
      yPos = 55;
      const productsData = data.charts.topProductsChart;
      productsData.labels.forEach((label, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 30;
        }
        
        doc.rect(15, yPos - 5, 180, 10);
        doc.text(label, 25, yPos);
        doc.text((productsData.datasets[0]?.data[index] || 0).toLocaleString('en-US'), 160, yPos);
        
        yPos += 12;
      });
    }
    
    // Category Chart Data
    if (data.charts.categoryChart && data.charts.categoryChart.labels.length > 0) {
      doc.addPage();
      doc.setFontSize(18);
      doc.text('Category Distribution Data', 20, 30);
      
      doc.setDrawColor(229, 231, 235);
      doc.setFillColor(249, 250, 251);
      doc.rect(15, 40, 180, 10, 'F');
      doc.rect(15, 40, 180, 10);
      doc.setFontSize(10);
      doc.text('Category', 25, 47);
      doc.text('Revenue', 160, 47);
      
      yPos = 55;
      const categoryData = data.charts.categoryChart;
      categoryData.labels.forEach((label, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 30;
        }
        
        doc.rect(15, yPos - 5, 180, 10);
        doc.text(label, 25, yPos);
        doc.text((categoryData.datasets[0]?.data[index] || 0).toLocaleString('en-US'), 160, yPos);
        
        yPos += 12;
      });
    }
  }
  
  // Footer on last page
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    if (data.generatedBy) {
      doc.text(`Generated by: ${data.generatedBy}`, 105, 290, { align: 'center' });
    }
  }
  
  // Save PDF
  const filename = `BI_Dashboard_${data.workspace}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Export dashboard to Excel
 */
export function exportDashboardToExcel(data: DashboardExportData): void {
  const workbook = XLSX.utils.book_new();
  
  // Sheet 1: KPIs
  const kpiRows: (string | number)[][] = [
    ['KPI Name', 'Value', 'Previous Value', 'Change', 'Change %', 'Trend', 'Unit', 'Description']
  ];
  
  Object.entries(data.kpis).forEach(([key, kpi]) => {
    kpiRows.push([
      key.replace(/([A-Z])/g, ' $1').trim(),
      kpi.value,
      kpi.previousValue || '',
      kpi.change || '',
      kpi.changePercent !== undefined ? `${kpi.changePercent.toFixed(2)}%` : '',
      kpi.trend || '',
      kpi.unit || '',
      kpi.description || ''
    ]);
  });
  
  const kpiSheet = XLSX.utils.aoa_to_sheet(kpiRows);
  XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPIs');
  
  // Sheet 2: Revenue Chart Data
  if (data.charts?.revenueChart && data.charts.revenueChart.labels.length > 0) {
    const revenueRows: (string | number)[][] = [
      ['Date', 'Revenue', 'Cost', 'Profit']
    ];
    
    const revenueData = data.charts.revenueChart;
    revenueData.labels.forEach((label, index) => {
      revenueRows.push([
        label,
        revenueData.datasets[0]?.data[index] || 0,
        revenueData.datasets[1]?.data[index] || 0,
        revenueData.datasets[2]?.data[index] || 0
      ]);
    });
    
    const revenueSheet = XLSX.utils.aoa_to_sheet(revenueRows);
    XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue Trend');
  }
  
  // Sheet 3: Top Products
  if (data.charts?.topProductsChart && data.charts.topProductsChart.labels.length > 0) {
    const productsRows: (string | number)[][] = [
      ['Product', 'Revenue']
    ];
    
    const productsData = data.charts.topProductsChart;
    productsData.labels.forEach((label, index) => {
      productsRows.push([
        label,
        productsData.datasets[0]?.data[index] || 0
      ]);
    });
    
    const productsSheet = XLSX.utils.aoa_to_sheet(productsRows);
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Top Products');
  }
  
  // Sheet 4: Category Distribution
  if (data.charts?.categoryChart && data.charts.categoryChart.labels.length > 0) {
    const categoryRows: (string | number)[][] = [
      ['Category', 'Revenue']
    ];
    
    const categoryData = data.charts.categoryChart;
    categoryData.labels.forEach((label, index) => {
      categoryRows.push([
        label,
        categoryData.datasets[0]?.data[index] || 0
      ]);
    });
    
    const categorySheet = XLSX.utils.aoa_to_sheet(categoryRows);
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Category Distribution');
  }
  
  // Sheet 5: Metadata
  const metadataRows: (string | number)[][] = [
    ['Dashboard Information'],
    ['Title', data.title],
    ['Workspace', data.workspace],
    ['Period', data.period],
    ['Generated At', data.generatedAt.toISOString()],
    ['Generated By', data.generatedBy || 'System']
  ];
  
  const metadataSheet = XLSX.utils.aoa_to_sheet(metadataRows);
  XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
  
  // Save Excel file
  const filename = `BI_Dashboard_${data.workspace}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

