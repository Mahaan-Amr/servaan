'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import type { OrderCalculation, OrderOptions } from '../../../../../services/orderingService';

interface ReceiptTemplateProps {
  orderNumber: string;
  orderDate: Date;
  orderItems: Array<{
    id: string;
    menuItem: {
      id: string;
      name: string;
      price: number;
    };
    quantity: number;
    totalPrice: number;
  }>;
  calculation: OrderCalculation;
  options: OrderOptions;
  paymentData: {
    paymentMethod: 'CASH' | 'CARD';
    amountReceived: number;
    notes?: string;
  };
  businessInfo: {
    name: string;
    address?: string;
    phone?: string;
    taxId?: string;
  };
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'ONLINE';
  tableInfo?: {
    tableNumber: string;
    tableName?: string;
  };
  onPrintComplete?: () => void;
}

export default function ReceiptTemplate({
  orderDate,
  orderItems,
  calculation,
  paymentData,
  businessInfo,
  orderType,
  tableInfo
}: ReceiptTemplateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // OPTIMIZED: Font sizes for direct printing
  const RECEIPT_WIDTH = 302; // 8cm width
  const MARGIN = 15; // Increased margin to prevent overflow
  const LINE_HEIGHT = 20;
  const FONT_SIZE_LARGE = 16;
  const FONT_SIZE_MEDIUM = 14;
  const FONT_SIZE_SMALL = 12;

  // Helper function to wrap text for RTL layout with intelligent word grouping
  const wrapText = (text: string, maxWidth: number, ctx: CanvasRenderingContext2D): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    
    // RTL: Process words from right to left
    let currentLine = '';
    
    for (let i = words.length - 1; i >= 0; i--) {
      const word = words[i];
      
      // Try to add the word to the current line
      const testLine = currentLine ? `${word} ${currentLine}` : word;
      const metrics = ctx.measureText(testLine);
      
      // Only wrap if the text actually exceeds the width
      if (metrics.width > maxWidth && currentLine) {
        // Save current line and start a new one
        lines.unshift(currentLine);
        currentLine = word;
      } else {
        // Add word to current line
        currentLine = testLine;
      }
    }
    
    // Add the last line if it has content
    if (currentLine) {
      lines.unshift(currentLine);
    }
    
    return lines;
  };

  const formatPrice = useCallback((amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount);
  }, []);

  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }, []);

  const generateReceipt = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate total height needed
    let totalHeight = MARGIN * 2;
    
    // Header section
    totalHeight += LINE_HEIGHT; // Business name
    if (businessInfo.address) totalHeight += LINE_HEIGHT;
    if (businessInfo.phone) totalHeight += LINE_HEIGHT;
    if (businessInfo.taxId) totalHeight += LINE_HEIGHT;
    totalHeight += 20; // Separator
    
    // Order details
    totalHeight += LINE_HEIGHT * 2; // Date and order type
    if (tableInfo) totalHeight += LINE_HEIGHT;
    totalHeight += 20; // Separator
    
    // Items section
    totalHeight += LINE_HEIGHT; // Header
    
    // Calculate height for items with text wrapping
    let itemsHeight = 0;
    const tempCtx = canvas.getContext('2d');
    if (tempCtx) {
      tempCtx.font = `${FONT_SIZE_SMALL}px Tahoma, Arial, sans-serif`;
      orderItems.forEach(item => {
        const titleMaxWidth = 80; // Increased width to match new column spacing (100 - 20 = 80px)
        const wrappedLines = wrapText(item.menuItem.name, titleMaxWidth, tempCtx);
        itemsHeight += Math.max(LINE_HEIGHT, wrappedLines.length * LINE_HEIGHT);
      });
    }
    totalHeight += itemsHeight;
    totalHeight += 20; // Separator
    
    // Calculations
    totalHeight += LINE_HEIGHT; // Subtotal
    if (calculation.discountAmount > 0) totalHeight += LINE_HEIGHT;
    if (calculation.taxAmount > 0) totalHeight += LINE_HEIGHT;
    if (calculation.serviceAmount > 0) totalHeight += LINE_HEIGHT;
    if (calculation.courierAmount > 0) totalHeight += LINE_HEIGHT;
    totalHeight += 20; // Separator
    
    // Total
    totalHeight += LINE_HEIGHT;
    totalHeight += 20; // Separator
    
    // Payment
    totalHeight += LINE_HEIGHT * 2; // Method and amount
    if (paymentData.amountReceived > calculation.totalAmount) totalHeight += LINE_HEIGHT;
    totalHeight += 20; // Separator
    
    // Footer
    totalHeight += LINE_HEIGHT * 4; // 4 footer lines

    // Set canvas dimensions
    canvas.width = RECEIPT_WIDTH;
    canvas.height = totalHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log('🎨 Canvas cleared, dimensions:', canvas.width, 'x', canvas.height);

    // OPTIMIZED: Direct print settings for maximum quality
    ctx.fillStyle = '#000000'; // Pure black
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    let y = MARGIN + 5;

    // Helper functions for direct printing
    const drawCenteredText = (text: string, fontSize: number = FONT_SIZE_MEDIUM, isBold: boolean = true) => {
      const fontWeight = isBold ? 'bold' : 'normal';
      ctx.font = `${fontWeight} ${fontSize}px Tahoma, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(text, RECEIPT_WIDTH / 2, y);
      y += LINE_HEIGHT;
    };

    const drawLine = () => {
      ctx.beginPath();
      ctx.moveTo(MARGIN, y);
      ctx.lineTo(RECEIPT_WIDTH - MARGIN, y);
      ctx.stroke();
      y += 15;
    };

    const drawRTLTwoColumn = (label: string, value: string, fontSize: number = FONT_SIZE_SMALL, isBold: boolean = false) => {
      const fontWeight = isBold ? 'bold' : 'normal';
      ctx.font = `${fontWeight} ${fontSize}px Tahoma, Arial, sans-serif`;
      
      const rightMargin = MARGIN + 20; // Increased margin for RTL
      const leftMargin = MARGIN + 20; // Increased margin for RTL
      
      // Label on the right (RTL)
      ctx.textAlign = 'right';
      ctx.fillText(label, RECEIPT_WIDTH - rightMargin, y);
      
      // Value on the left (RTL)
      ctx.textAlign = 'left';
      ctx.fillText(value, leftMargin, y);
      
      y += LINE_HEIGHT;
    };

    const drawRTLTableHeader = () => {
      ctx.font = `bold ${FONT_SIZE_SMALL}px Tahoma, Arial, sans-serif`;
      ctx.textAlign = 'center';
      
      // CORRECTED RTL Layout: عنوان | تعداد | قیمت | جمع (Title | Quantity | Price | Total)
      const col1 = RECEIPT_WIDTH - MARGIN - 20; // عنوان (Title) - Rightmost
      const col2 = RECEIPT_WIDTH - MARGIN - 100; // تعداد (Quantity) - 80px spacing from right (increased space for title)
      const col3 = RECEIPT_WIDTH - MARGIN - 150; // قیمت (Price) - 50px spacing from right
      const col4 = RECEIPT_WIDTH - MARGIN - 200; // جمع (Total) - 50px spacing from right
      
      ctx.fillText('عنوان', col1, y);
      ctx.fillText('تعداد', col2, y);
      ctx.fillText('قیمت', col3, y);
      ctx.fillText('جمع', col4, y);
      y += LINE_HEIGHT;
    };

    const drawRTLTableRow = (rowNum: number, itemName: string, quantity: number, totalPrice: number) => {
      ctx.font = `${FONT_SIZE_SMALL}px Tahoma, Arial, sans-serif`;
      
      // CORRECTED RTL Layout: عنوان | تعداد | قیمت | جمع (Title | Quantity | Price | Total)
      const col1 = RECEIPT_WIDTH - MARGIN - 20; // عنوان (Title) - Rightmost
      const col2 = RECEIPT_WIDTH - MARGIN - 100; // تعداد (Quantity) - 80px spacing from right (increased space for title)
      const col3 = RECEIPT_WIDTH - MARGIN - 150; // قیمت (Price) - 50px spacing from right
      const col4 = RECEIPT_WIDTH - MARGIN - 200; // جمع (Total) - 50px spacing from right
      
      // Item name with text wrapping (right-aligned)
      ctx.textAlign = 'right';
      const titleMaxWidth = col2 - col1 - 10; // Space between title and quantity columns
      console.log('🔍 Text wrapping debug:', {
        itemName,
        titleMaxWidth,
        col1,
        col2,
        availableSpace: col2 - col1 - 10
      });
      const wrappedLines = wrapText(itemName, titleMaxWidth, ctx);
      console.log('🔍 Wrapped lines:', wrappedLines);
      
      // Draw wrapped text lines
      let currentY = y;
      wrappedLines.forEach((line, lineIndex) => {
        ctx.fillText(line, col1 + 15, currentY);
        if (lineIndex < wrappedLines.length - 1) {
          currentY += LINE_HEIGHT;
        }
      });
      
      // Quantity (center-aligned)
      ctx.textAlign = 'center';
      ctx.fillText(quantity.toString(), col2, y);
      
      // Price (right-aligned)
      ctx.textAlign = 'right';
      ctx.fillText(formatPrice(totalPrice / quantity), col3 + 15, y);
      
      // Total (right-aligned)
      ctx.textAlign = 'right';
      ctx.fillText(formatPrice(totalPrice), col4 + 15, y);
      
      // Adjust y position based on number of wrapped lines
      y += Math.max(LINE_HEIGHT, wrappedLines.length * LINE_HEIGHT);
    };

    // Header with bold business name
    drawCenteredText(businessInfo.name, FONT_SIZE_LARGE, true);
    drawLine();

    // Order Details
    drawRTLTwoColumn('تاریخ:', formatDate(orderDate), FONT_SIZE_SMALL, false);
    const orderTypeText = orderType === 'DINE_IN' ? 'سالن' : 
                          orderType === 'TAKEAWAY' ? 'بیرون بری' : 
                          orderType === 'DELIVERY' ? 'ارسال' : 'آنلاین';
    drawRTLTwoColumn('نوع سفارش:', orderTypeText, FONT_SIZE_SMALL, false);
    if (tableInfo) {
      const tableText = tableInfo.tableName || `میز ${tableInfo.tableNumber}`;
      drawRTLTwoColumn('میز:', tableText, FONT_SIZE_SMALL, false);
    }
    drawLine();

    // Items Table
    drawRTLTableHeader();
    drawLine();

    // Items
    orderItems.forEach((item, index) => {
      drawRTLTableRow(index + 1, item.menuItem.name, item.quantity, item.totalPrice);
    });

    drawLine();

    // Calculations
    drawRTLTwoColumn('جمع:', `${formatPrice(calculation.subtotal)} تومان`, FONT_SIZE_SMALL, false);
    
    if (calculation.discountAmount > 0) {
      drawRTLTwoColumn('تخفیف:', `-${formatPrice(calculation.discountAmount)} تومان`, FONT_SIZE_SMALL, false);
    }

    if (calculation.taxAmount > 0) {
      drawRTLTwoColumn('مالیات:', `${formatPrice(calculation.taxAmount)} تومان`, FONT_SIZE_SMALL, false);
    }

    if (calculation.serviceAmount > 0) {
      drawRTLTwoColumn('خدمات:', `${formatPrice(calculation.serviceAmount)} تومان`, FONT_SIZE_SMALL, false);
    }

    if (calculation.courierAmount > 0) {
      drawRTLTwoColumn('پیک:', `${formatPrice(calculation.courierAmount)} تومان`, FONT_SIZE_SMALL, false);
    }

    drawLine();

    // Total with bold text
    drawRTLTwoColumn('مجموع:', `${formatPrice(calculation.totalAmount)} تومان`, FONT_SIZE_MEDIUM, true);
    drawLine();

    // Payment
    const paymentMethod = paymentData.paymentMethod === 'CASH' ? 'نقدی' : 'اعتباری';
    drawRTLTwoColumn('پرداخت:', paymentMethod, FONT_SIZE_SMALL, false);
    drawRTLTwoColumn('دریافتی:', `${formatPrice(paymentData.amountReceived)} تومان`, FONT_SIZE_SMALL, false);
    
    if (paymentData.amountReceived > calculation.totalAmount) {
      const changeAmount = paymentData.amountReceived - calculation.totalAmount;
      drawRTLTwoColumn('تغییر:', `${formatPrice(changeAmount)} تومان`, FONT_SIZE_SMALL, false);
    }

    drawLine();

    // Footer
    drawCenteredText('با تشکر از خرید شما', FONT_SIZE_SMALL, true);
    drawCenteredText('امیدواریم از خدمات ما راضی باشید', FONT_SIZE_SMALL, true);
    drawCenteredText('--- پایان رسید ---', FONT_SIZE_SMALL, true);
    drawCenteredText(new Date().toLocaleTimeString('fa-IR'), FONT_SIZE_SMALL, false);
  }, [orderItems, calculation, paymentData, businessInfo, orderType, tableInfo, orderDate, formatDate, formatPrice]);

  useEffect(() => {
    if (orderItems && orderItems.length > 0) {
      setTimeout(() => {
        console.log('🔄 Generating receipt template...');
        console.log('📊 orderItems length:', orderItems.length);
        console.log('📊 Canvas ref available:', !!canvasRef.current);
        generateReceipt();
      }, 100);
    }
  }, [generateReceipt]);

  const handlePrint = () => {
    console.log('🖨️ Starting DIRECT print process...');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('❌ Canvas not available for printing');
      return;
    }

    // Force canvas regeneration
    generateReceipt();
    
    // OPTIMIZED: Direct print approach - no image conversion
    const printWindow = window.open('', '_blank', 
      'width=302,height=600,scrollbars=no,resizable=no,toolbar=no,menubar=no,location=no,status=no'
    );
    
    if (!printWindow) {
      alert('لطفاً popup blocker را غیرفعال کنید');
      return;
    }

    // OPTIMIZED: Direct canvas printing without PNG conversion
    const directPrintCSS = `
      @page { 
        size: 302px auto; 
        margin: 0; 
        padding: 0; 
      }
      body { 
        margin: 0; 
        padding: 0; 
        background: white; 
        direction: rtl; 
        text-align: center; 
        width: 302px; 
        max-width: 302px; 
        overflow: hidden; 
      }
      .receipt-canvas { 
        width: 302px; 
        height: auto; 
        display: block; 
        margin: 0; 
        padding: 0; 
        max-width: 100%;
        /* OPTIMIZED: Direct canvas rendering for maximum quality */
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
      }
      * {
        box-sizing: border-box;
      }
    `;

    // OPTIMIZED: Direct canvas element instead of PNG image
    const printDocument = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>رسید سفارش - Direct Print</title>
        <style>${directPrintCSS}</style>
      </head>
      <body>
        <canvas 
          class="receipt-canvas" 
          width="${canvas.width}" 
          height="${canvas.height}"
          style="width: 302px; height: auto;"
        ></canvas>
        
        <script>
          // OPTIMIZED: Direct canvas copy without image conversion
          const printCanvas = document.querySelector('.receipt-canvas');
          const printCtx = printCanvas.getContext('2d');
          
          // Copy the original canvas content directly
          const originalCanvas = window.opener.document.querySelector('canvas');
          if (originalCanvas && printCtx) {
            printCtx.drawImage(originalCanvas, 0, 0);
            console.log('✅ Direct canvas copy completed');
          }
          
                     // Trigger print after canvas is ready
           setTimeout(() => {
             window.print();
             setTimeout(() => {
               window.close();
             }, 1000);
           }, 100);
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printDocument);
    printWindow.document.close();

    printWindow.onload = () => {
      console.log('🖨️ Direct print window loaded');
      console.log('🖨️ Canvas dimensions:', canvas.width, 'x', canvas.height);
    };
  };

  return (
    <div className="bg-white p-6 max-w-md mx-auto">
      <div className="mb-4">
        <button
          onClick={handlePrint}
          className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 font-medium"
        >
          چاپ رسید (مستقیم)
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">پیش‌نمایش رسید (مستقیم)</h3>
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
          <canvas
            ref={canvasRef}
            className="mx-auto block border border-gray-200"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>
    </div>
  );
}
