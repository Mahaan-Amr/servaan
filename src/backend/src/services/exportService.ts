import puppeteer from 'puppeteer';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

export interface ExportOptions {
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON' | 'PNG' | 'SVG';
  data: any[];
  reportName: string;
  columns?: { key: string; label: string }[];
}

export class ExportService {
  /**
   * Export data to specified format
   */
  static async exportData(options: ExportOptions): Promise<{ filePath: string; mimeType: string; filename: string }> {
    const { format, data, reportName } = options;
    
    switch (format) {
      case 'PDF':
        return await this.exportToPDF(data, reportName);
      case 'EXCEL':
        return await this.exportToExcel(data, reportName);
      case 'CSV':
        return await this.exportToCSV(data, reportName);
      case 'JSON':
        return await this.exportToJSON(data, reportName);
      case 'PNG':
        return await this.exportToPNG(data, reportName);
      case 'SVG':
        return await this.exportToSVG(data, reportName);
      default:
        throw new Error('فرمت صادرات پشتیبانی نمی‌شود');
    }
  }

  /**
   * Export to PDF using Puppeteer
   */
  private static async exportToPDF(data: any[], reportName: string): Promise<{ filePath: string; mimeType: string; filename: string }> {
    try {
      if (!data || data.length === 0) {
        throw new Error('داده‌ای برای صادرات وجود ندارد');
      }

      // Determine if we need landscape orientation based on number of columns
      const columnCount = Object.keys(data[0]).length;
      const isLandscape = columnCount > 6; // Use landscape for more than 6 columns
      
      // Generate HTML table with responsive design
      const htmlContent = this.generateHTMLTable(data, reportName, isLandscape);
      
      // Create PDF using Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Set page size based on content
      if (isLandscape) {
        await page.setViewport({ width: 1200, height: 800 });
      } else {
        await page.setViewport({ width: 800, height: 1200 });
      }
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Create temporary file path
      const filename = this.createSafeFilename(reportName, 'pdf');
      const filePath = path.join(process.cwd(), 'temp', filename);
      
      // Ensure temp directory exists
      const tempDir = path.dirname(filePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      await page.pdf({
        path: filePath,
        format: 'A4',
        landscape: isLandscape, // Dynamic orientation
        margin: {
          top: '15px',
          right: '10px',
          bottom: '15px',
          left: '10px',
        },
        printBackground: true,
        preferCSSPageSize: false
      });
      
      await browser.close();
      
      return {
        filePath,
        mimeType: 'application/pdf',
        filename
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('خطا در تولید فایل PDF');
    }
  }

  /**
   * Export to Excel using ExcelJS
   */
  private static async exportToExcel(data: any[], reportName: string): Promise<{ filePath: string; mimeType: string; filename: string }> {
    try {
      if (!data || data.length === 0) {
        throw new Error('داده‌ای برای صادرات وجود ندارد');
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('گزارش');
      
      // Get column headers from first data row
      const headers = Object.keys(data[0]);
      const columnCount = headers.length;
      
      // Add headers with better formatting
      const headerRow = worksheet.addRow(headers);
      
      // Style headers
      headerRow.font = { bold: true, size: columnCount > 10 ? 9 : 11 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      headerRow.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
      headerRow.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      // Add data rows with formatting
      data.forEach(row => {
        const values = headers.map(header => row[header] || '');
        const dataRow = worksheet.addRow(values);
        
        // Style data cells
        dataRow.font = { size: columnCount > 10 ? 8 : 10 };
        dataRow.alignment = { horizontal: 'right', vertical: 'top', wrapText: true };
        dataRow.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      // Intelligent column width adjustment
      worksheet.columns.forEach((column, index) => {
        if (column && column.eachCell) {
          let maxLength = 0;
          
          // Check header length
          const headerLength = headers[index] ? headers[index].toString().length : 0;
          maxLength = Math.max(maxLength, headerLength);
          
          // Check data cell lengths (sample first 100 rows for performance)
          column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
            if (rowNumber <= 101) { // Header + 100 data rows
              const cellValue = cell.value ? cell.value.toString() : '';
              maxLength = Math.max(maxLength, cellValue.length);
            }
          });
          
          // Set intelligent column width based on content and number of columns
          let columnWidth;
          if (columnCount > 15) {
            columnWidth = Math.min(Math.max(maxLength * 0.8, 8), 20);
          } else if (columnCount > 10) {
            columnWidth = Math.min(Math.max(maxLength * 1.0, 10), 25);
          } else if (columnCount > 6) {
            columnWidth = Math.min(Math.max(maxLength * 1.2, 12), 30);
          } else {
            columnWidth = Math.min(Math.max(maxLength * 1.4, 15), 50);
          }
          
          column.width = columnWidth;
        }
      });
      
      // Set row heights for better readability
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          // Header row
          row.height = columnCount > 10 ? 25 : 30;
        } else {
          // Data rows
          row.height = columnCount > 10 ? 18 : 22;
        }
      });
      
      // Add report information as a separate sheet if there are many columns
      if (columnCount > 10) {
        const infoSheet = workbook.addWorksheet('اطلاعات گزارش');
        infoSheet.addRow(['نام گزارش', reportName]);
        infoSheet.addRow(['تاریخ تولید', new Date().toLocaleDateString('fa-IR')]);
        infoSheet.addRow(['تعداد ستون‌ها', columnCount]);
        infoSheet.addRow(['تعداد رکوردها', data.length]);
        infoSheet.addRow(['توضیحات', 'این گزارش حاوی تعداد زیادی ستون است. برای مشاهده بهتر، از نمای افقی استفاده کنید.']);
        
        // Style info sheet
        infoSheet.columns = [
          { width: 20 },
          { width: 40 }
        ];
        
        infoSheet.eachRow((row, rowNumber) => {
          row.getCell(1).font = { bold: true };
          row.getCell(1).alignment = { horizontal: 'right' };
          row.getCell(2).alignment = { horizontal: 'right' };
        });
      }
      
      // Create temporary file path
      const filename = this.createSafeFilename(reportName, 'xlsx');
      const filePath = path.join(process.cwd(), 'temp', filename);
      
      // Ensure temp directory exists
      const tempDir = path.dirname(filePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      await workbook.xlsx.writeFile(filePath);
      
      return {
        filePath,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename
      };
    } catch (error) {
      console.error('Error generating Excel:', error);
      throw new Error('خطا در تولید فایل Excel');
    }
  }

  /**
   * Export to CSV
   */
  private static async exportToCSV(data: any[], reportName: string): Promise<{ filePath: string; mimeType: string; filename: string }> {
    try {
      if (!data || data.length === 0) {
        throw new Error('داده‌ای برای صادرات وجود ندارد');
      }

      const headers = Object.keys(data[0]);
      const filename = this.createSafeFilename(reportName, 'csv');
      const filePath = path.join(process.cwd(), 'temp', filename);
      
      // Ensure temp directory exists
      const tempDir = path.dirname(filePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const csvWriter = createCsvWriter({
        path: filePath,
        header: headers.map(h => ({ id: h, title: h })),
        encoding: 'utf8'
      });
      
      await csvWriter.writeRecords(data);
      
      return {
        filePath,
        mimeType: 'text/csv',
        filename
      };
    } catch (error) {
      console.error('Error generating CSV:', error);
      throw new Error('خطا در تولید فایل CSV');
    }
  }

  /**
   * Generate HTML table for PDF
   */
  private static generateHTMLTable(data: any[], reportName: string, isLandscape: boolean = false): string {
    if (!data || data.length === 0) {
      return '<html><body><h1>داده‌ای یافت نشد</h1></body></html>';
    }
    
    const headers = Object.keys(data[0]);
    const columnCount = headers.length;
    
    // Dynamic font size based on number of columns
    let fontSize = '12px';
    let headerFontSize = '13px';
    let cellPadding = '6px';
    
    if (columnCount > 10) {
      fontSize = '8px';
      headerFontSize = '9px';
      cellPadding = '3px';
    } else if (columnCount > 8) {
      fontSize = '9px';
      headerFontSize = '10px';
      cellPadding = '4px';
    } else if (columnCount > 6) {
      fontSize = '10px';
      headerFontSize = '11px';
      cellPadding = '5px';
    }
    
    // Calculate dynamic column width
    const maxColumnWidth = isLandscape ? 
      Math.max(60, Math.floor(1100 / columnCount)) : 
      Math.max(40, Math.floor(750 / columnCount));
    
    const headerRow = headers.map(header => 
      `<th style="
        border: 1px solid #ddd; 
        padding: ${cellPadding}; 
        background-color: #f8f9fa; 
        text-align: right;
        font-size: ${headerFontSize};
        font-weight: bold;
        max-width: ${maxColumnWidth}px;
        min-width: 40px;
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: normal;
      ">${this.truncateText(header, 20)}</th>`
    ).join('');
    
    const dataRows = data.map(row => {
      const cells = headers.map(header => {
        const value = row[header];
        const displayValue = value != null ? String(value) : '-';
        return `<td style="
          border: 1px solid #ddd; 
          padding: ${cellPadding}; 
          text-align: right;
          font-size: ${fontSize};
          max-width: ${maxColumnWidth}px;
          min-width: 40px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
          line-height: 1.2;
        ">${this.truncateText(displayValue, 30)}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    
    // Page orientation class
    const pageClass = isLandscape ? 'landscape' : 'portrait';
    
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reportName}</title>
        <style>
          body {
            font-family: 'Tahoma', 'Arial', sans-serif;
            margin: 10px;
            direction: rtl;
            font-size: ${fontSize};
          }
          .landscape {
            width: 100%;
            max-width: 1100px;
          }
          .portrait {
            width: 100%;
            max-width: 750px;
          }
          h1 {
            color: #333;
            text-align: center;
            margin-bottom: 15px;
            font-size: ${isLandscape ? '18px' : '16px'};
            page-break-inside: avoid;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            table-layout: fixed;
            page-break-inside: auto;
          }
          th, td {
            border: 1px solid #ddd;
            text-align: right;
            vertical-align: top;
            box-sizing: border-box;
          }
          th {
            background-color: #f8f9fa !important;
            font-weight: bold;
            page-break-inside: avoid;
            position: sticky;
            top: 0;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .report-info {
            text-align: center;
            margin-bottom: 15px;
            color: #666;
            font-size: ${isLandscape ? '10px' : '9px'};
            page-break-inside: avoid;
          }
          @media print {
            body {
              margin: 0;
              font-size: ${fontSize};
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            th {
              page-break-inside: avoid;
            }
          }
          /* Ensure content fits in page */
          .table-container {
            width: 100%;
            overflow: hidden;
          }
        </style>
      </head>
      <body class="${pageClass}">
        <h1>${reportName}</h1>
        <div class="report-info">
          <p>تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')} | تعداد ستون‌ها: ${columnCount.toLocaleString('fa-IR')} | تعداد رکوردها: ${data.length.toLocaleString('fa-IR')}</p>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>${headerRow}</tr>
            </thead>
            <tbody>
              ${dataRows}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Truncate text to fit in table cells
   */
  private static truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Clean up temporary files
   */
  static async cleanupTempFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  }

  /**
   * Export to JSON
   */
  private static async exportToJSON(data: any[], reportName: string): Promise<{ filePath: string; mimeType: string; filename: string }> {
    try {
      if (!data || data.length === 0) {
        throw new Error('داده‌ای برای صادرات وجود ندارد');
      }

      // Create JSON structure with metadata
      const jsonData = {
        reportName,
        generatedAt: new Date().toISOString(),
        recordCount: data.length,
        columns: Object.keys(data[0] || {}),
        data
      };

      const filename = this.createSafeFilename(reportName, 'json');
      const filePath = path.join(process.cwd(), 'temp', filename);
      
      // Ensure temp directory exists
      const tempDir = path.dirname(filePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Write JSON file with pretty formatting
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
      
      return {
        filePath,
        mimeType: 'application/json',
        filename
      };
    } catch (error) {
      console.error('Error generating JSON:', error);
      throw new Error('خطا در تولید فایل JSON');
    }
  }

  /**
   * Export to PNG image (table visualization)
   */
  private static async exportToPNG(data: any[], reportName: string): Promise<{ filePath: string; mimeType: string; filename: string }> {
    try {
      if (!data || data.length === 0) {
        throw new Error('داده‌ای برای صادرات وجود ندارد');
      }

      // Generate HTML table
      const htmlContent = this.generateHTMLTable(data, reportName, false);
      
      // Use Puppeteer to render HTML and capture as PNG
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 800 });
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Create temporary file path - ensure it ends with .png
      const filename = this.createSafeFilename(reportName, 'png');
      const filePath = path.join(process.cwd(), 'temp', filename);
      
      // Ensure temp directory exists
      const tempDir = path.dirname(filePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Capture screenshot - use Buffer approach to avoid type issues
      const screenshotBuffer = await page.screenshot({
        fullPage: true,
        type: 'png'
      });
      
      // Write buffer to file
      fs.writeFileSync(filePath, screenshotBuffer);
      
      await browser.close();
      
      return {
        filePath,
        mimeType: 'image/png',
        filename
      };
    } catch (error) {
      console.error('Error generating PNG:', error);
      throw new Error('خطا در تولید فایل PNG');
    }
  }

  /**
   * Export to SVG (table visualization)
   */
  private static async exportToSVG(data: any[], reportName: string): Promise<{ filePath: string; mimeType: string; filename: string }> {
    try {
      if (!data || data.length === 0) {
        throw new Error('داده‌ای برای صادرات وجود ندارد');
      }

      const headers = Object.keys(data[0]);
      
      // Generate SVG table
      const svgContent = this.generateSVGTable(data, reportName, headers);
      
      const filename = this.createSafeFilename(reportName, 'svg');
      const filePath = path.join(process.cwd(), 'temp', filename);
      
      // Ensure temp directory exists
      const tempDir = path.dirname(filePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Write SVG file
      fs.writeFileSync(filePath, svgContent, 'utf8');
      
      return {
        filePath,
        mimeType: 'image/svg+xml',
        filename
      };
    } catch (error) {
      console.error('Error generating SVG:', error);
      throw new Error('خطا در تولید فایل SVG');
    }
  }

  /**
   * Generate SVG table
   */
  private static generateSVGTable(data: any[], reportName: string, headers: string[]): string {
    const cellPadding = 8;
    const cellHeight = 30;
    const headerHeight = 40;
    const fontSize = 12;
    const headerFontSize = 14;
    
    // Calculate column widths
    const columnWidths = headers.map(header => {
      const headerLength = header.length;
      const maxDataLength = Math.max(
        ...data.slice(0, 100).map(row => {
          const value = row[header];
          return value ? String(value).length : 0;
        })
      );
      return Math.max(headerLength, maxDataLength) * 8 + cellPadding * 2;
    });
    
    const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const tableHeight = headerHeight + (data.length * cellHeight);
    
    let currentX = 0;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tableWidth}" height="${tableHeight + 60}" dir="rtl">
      <defs>
        <style>
          .header { font-weight: bold; fill: #333; }
          .cell { fill: #fff; }
          .row-even { fill: #f9f9f9; }
        </style>
      </defs>
      <text x="${tableWidth / 2}" y="25" text-anchor="middle" font-size="16" font-weight="bold">${reportName}</text>
      <text x="${tableWidth / 2}" y="45" text-anchor="middle" font-size="10" fill="#666">${new Date().toLocaleDateString('fa-IR')} | ${data.length} رکورد</text>
      <g transform="translate(0, 60)">`;
    
    // Header row
    currentX = 0;
    svg += `<rect x="0" y="0" width="${tableWidth}" height="${headerHeight}" fill="#f8f9fa" stroke="#ddd"/>`;
    headers.forEach((header, index) => {
      const width = columnWidths[index];
      svg += `<rect x="${currentX}" y="0" width="${width}" height="${headerHeight}" fill="#f8f9fa" stroke="#ddd"/>`;
      svg += `<text x="${currentX + width / 2}" y="${headerHeight / 2 + 5}" text-anchor="middle" font-size="${headerFontSize}" class="header">${this.escapeXml(header)}</text>`;
      currentX += width;
    });
    
    // Data rows
    data.forEach((row, rowIndex) => {
      const y = headerHeight + (rowIndex * cellHeight);
      const rowClass = rowIndex % 2 === 0 ? 'cell' : 'row-even';
      
      currentX = 0;
      headers.forEach((header, colIndex) => {
        const width = columnWidths[colIndex];
        const value = row[header] != null ? String(row[header]) : '-';
        svg += `<rect x="${currentX}" y="${y}" width="${width}" height="${cellHeight}" class="${rowClass}" stroke="#ddd"/>`;
        svg += `<text x="${currentX + cellPadding}" y="${y + cellHeight / 2 + 5}" font-size="${fontSize}" fill="#333">${this.escapeXml(value)}</text>`;
        currentX += width;
      });
    });
    
    svg += `</g></svg>`;
    return svg;
  }

  /**
   * Escape XML special characters
   */
  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Create a safe filename for exports
   */
  private static createSafeFilename(reportName: string, extension: string): string {
    // Remove or replace problematic characters
    const safeName = reportName
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '') // Keep only alphanumeric, Persian, and spaces
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length
    
    const timestamp = Date.now();
    return `${safeName}_${timestamp}.${extension}`;
  }
} 
