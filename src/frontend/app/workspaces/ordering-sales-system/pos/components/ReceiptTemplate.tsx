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
  tableInfo,
  onPrintComplete
}: ReceiptTemplateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Thermal printer constants (8cm = 302.4 pixels at 96 DPI)
  const RECEIPT_WIDTH = 302; // 8cm width
  const MARGIN = 13; // Increased margin by 5px for better spacing
  const LINE_HEIGHT = 18; // Slightly reduced for better fit
  const FONT_SIZE_LARGE = 14; // Reduced business name
  const FONT_SIZE_MEDIUM = 12; // Reduced headers and totals
  const FONT_SIZE_SMALL = 10; // Reduced regular text

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
    let totalHeight = MARGIN * 2; // Top and bottom margins
    
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
    totalHeight += orderItems.length * LINE_HEIGHT; // Items
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

    // PRODUCTION READY - Clean receipt without debug elements

    // Set default styles
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;

    let y = MARGIN + 5; // Start with small top margin

    // Helper functions for RTL layout
    const drawCenteredText = (text: string, fontSize: number = FONT_SIZE_MEDIUM) => {
      ctx.font = `bold ${fontSize}px Tahoma, Arial, sans-serif`;
      ctx.textAlign = 'center';
      
      // FIXED: NO TRUNCATION - let text render naturally
      ctx.fillText(text, RECEIPT_WIDTH / 2, y);
      y += LINE_HEIGHT;
    };

    const drawLine = () => {
      ctx.beginPath();
      ctx.moveTo(MARGIN, y);
      ctx.lineTo(RECEIPT_WIDTH - MARGIN, y);
      ctx.stroke();
      y += 15; // More space after lines
    };

    // RTL two-column layout: Label on right, value on left
    const drawRTLTwoColumn = (label: string, value: string, fontSize: number = FONT_SIZE_SMALL) => {
      ctx.font = `${fontSize}px Tahoma, Arial, sans-serif`;
      
      // FIXED: Apply same logic as table columns to prevent overflow
      const rightMargin = MARGIN + 20; // Match table column positioning
      const leftMargin = MARGIN + 20; // Match table column positioning
      
      // Label on the right (RTL) - NO TRUNCATION
      ctx.textAlign = 'right';
      ctx.fillText(label, RECEIPT_WIDTH - rightMargin, y);
      
      // Value on the left (RTL) - NO TRUNCATION
      ctx.textAlign = 'left';
      ctx.fillText(value, leftMargin, y);
      
      y += LINE_HEIGHT;
    };

    // RTL table header - REVERSED order: جمع، قیمت، تعداد، عنوان (Total, Price, Quantity, Title)
    const drawRTLTableHeader = () => {
      ctx.font = `bold ${FONT_SIZE_SMALL}px Tahoma, Arial, sans-serif`;
      ctx.textAlign = 'center';
      
      // ENHANCED: Optimized column spacing with better separation
      const col1 = MARGIN + 15; // جمع (Total) - Rightmost
      const col2 = MARGIN + 75; // قیمت (Price) - 60px spacing
      const col3 = MARGIN + 135; // تعداد (Quantity) - 60px spacing  
      const col4 = MARGIN + 240; // عنوان (Title) - 105px spacing from quantity
      
      ctx.fillText('جمع', col1, y);
      ctx.fillText('قیمت', col2, y);
      ctx.fillText('تعداد', col3, y);
      ctx.fillText('عنوان', col4, y);
      y += LINE_HEIGHT;
    };

    // RTL table row - REVERSED order: جمع، قیمت، تعداد، عنوان
    const drawRTLTableRow = (rowNum: number, itemName: string, quantity: number, totalPrice: number) => {
      ctx.font = `${FONT_SIZE_SMALL}px Tahoma, Arial, sans-serif`;
      
      // ENHANCED: Match header column positions with optimized spacing
      const col1 = MARGIN + 15; // جمع (Total)
      const col2 = MARGIN + 75; // قیمت (Price) - 60px spacing
      const col3 = MARGIN + 135; // تعداد (Quantity) - 60px spacing
      const col4 = MARGIN + 240; // عنوان (Title) - 105px spacing from quantity
      
      // Total (right-aligned) - Rightmost column
      ctx.textAlign = 'right';
      ctx.fillText(formatPrice(totalPrice), col1 + 20, y);
      
      // Price (right-aligned)
      ctx.textAlign = 'right';
      ctx.fillText(formatPrice(totalPrice / quantity), col2 + 20, y);
      
      // Quantity (center-aligned) - Fixed positioning to align under column header
      ctx.textAlign = 'center';
      ctx.fillText(quantity.toString(), col3, y);
      
      // Item name (right-aligned, NO TRUNCATION) - Optimized position with better spacing
      ctx.textAlign = 'right';
      ctx.fillText(itemName, col4 + 15, y);
      
      y += LINE_HEIGHT;
    };

    // Header - Business Information (ENHANCED: Simplified)
    drawCenteredText(businessInfo.name, FONT_SIZE_LARGE);
    drawLine();

    // Order Details - RTL Layout
    drawRTLTwoColumn('تاریخ:', formatDate(orderDate));
    const orderTypeText = orderType === 'DINE_IN' ? 'سالن' : 
                          orderType === 'TAKEAWAY' ? 'بیرون بری' : 
                          orderType === 'DELIVERY' ? 'ارسال' : 'آنلاین';
    drawRTLTwoColumn('نوع سفارش:', orderTypeText);
    if (tableInfo) {
      const tableText = tableInfo.tableName || `میز ${tableInfo.tableNumber}`;
      drawRTLTwoColumn('میز:', tableText);
    }
    drawLine();

    // Items Table - RTL Layout
    drawRTLTableHeader();
    drawLine();

    // Items
    orderItems.forEach((item, index) => {
      drawRTLTableRow(index + 1, item.menuItem.name, item.quantity, item.totalPrice);
    });

    drawLine();

    // Calculations - RTL Layout
    drawRTLTwoColumn('جمع:', `${formatPrice(calculation.subtotal)} تومان`);
    
    if (calculation.discountAmount > 0) {
      drawRTLTwoColumn('تخفیف:', `-${formatPrice(calculation.discountAmount)} تومان`);
    }

    if (calculation.taxAmount > 0) {
      drawRTLTwoColumn('مالیات:', `${formatPrice(calculation.taxAmount)} تومان`);
    }

    if (calculation.serviceAmount > 0) {
      drawRTLTwoColumn('خدمات:', `${formatPrice(calculation.serviceAmount)} تومان`);
    }

    if (calculation.courierAmount > 0) {
      drawRTLTwoColumn('پیک:', `${formatPrice(calculation.courierAmount)} تومان`);
    }

    drawLine();

    // Total - RTL Layout
    ctx.font = `bold ${FONT_SIZE_MEDIUM}px Tahoma, Arial, sans-serif`;
    drawRTLTwoColumn('مجموع:', `${formatPrice(calculation.totalAmount)} تومان`);
    drawLine();

    // Payment - RTL Layout
    ctx.font = `${FONT_SIZE_SMALL}px Tahoma, Arial, sans-serif`;
    const paymentMethod = paymentData.paymentMethod === 'CASH' ? 'نقدی' : 'اعتباری';
    drawRTLTwoColumn('پرداخت:', paymentMethod);
    drawRTLTwoColumn('دریافتی:', `${formatPrice(paymentData.amountReceived)} تومان`);
    
    if (paymentData.amountReceived > calculation.totalAmount) {
      const changeAmount = paymentData.amountReceived - calculation.totalAmount;
      drawRTLTwoColumn('تغییر:', `${formatPrice(changeAmount)} تومان`);
    }

    drawLine();

    // Footer
    ctx.font = `${FONT_SIZE_SMALL}px Tahoma, Arial, sans-serif`;
    ctx.textAlign = 'center';
    drawCenteredText('با تشکر از خرید شما');
    drawCenteredText('امیدواریم از خدمات ما راضی باشید');
    drawCenteredText('--- پایان رسید ---');
    drawCenteredText(new Date().toLocaleTimeString('fa-IR'));
  }, [orderItems, calculation, paymentData, businessInfo, orderType, tableInfo, orderDate, formatDate, formatPrice]);

  useEffect(() => {
    if (orderItems && orderItems.length > 0) {
      // Add a small delay to ensure DOM is ready and clear any cached canvas
      setTimeout(() => {
        console.log('🔄 Generating new receipt template...');
        console.log('📊 orderItems length:', orderItems.length);
        console.log('📊 Canvas ref available:', !!canvasRef.current);
        generateReceipt();
      }, 100);
    }
  }, [generateReceipt]);

  const handlePrint = () => {
    console.log('🖨️ Starting BULLETPROOF print process...');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('❌ Canvas not available for printing');
      return;
    }

    // Force canvas regeneration with cache busting
    generateReceipt();
    
    // PHASE 1: DYNAMIC DIMENSION DETECTION
    const canvasRect = canvas.getBoundingClientRect();
    const actualCanvasWidth = canvasRect.width;
    const actualCanvasHeight = canvasRect.height;
    const pixelRatio = window.devicePixelRatio || 1;
    const deviceWidth = window.innerWidth;
    const deviceHeight = window.innerHeight;
    
    console.log('📏 DYNAMIC DETECTION RESULTS:');
    console.log('📏 Canvas actual size:', actualCanvasWidth, 'x', actualCanvasHeight);
    console.log('📏 Canvas internal size:', canvas.width, 'x', canvas.height);
    console.log('📏 Device pixel ratio:', pixelRatio);
    console.log('📏 Device dimensions:', deviceWidth, 'x', deviceHeight);
    
    // PHASE 2: CALCULATE OPTIMAL PRINT DIMENSIONS
    // Force exact 302px width for thermal printer compatibility
    const optimalPrintWidth = 302; // Fixed width for 8cm thermal printer
    const optimalPrintHeight = Math.min(actualCanvasHeight, canvas.height);
    
    console.log('🎯 OPTIMAL PRINT DIMENSIONS:', optimalPrintWidth, 'x', optimalPrintHeight);
    console.log('🎯 FORCED WIDTH: 302px for thermal printer compatibility');
    
    // PHASE 3: CREATE PRINT WINDOW WITH EXACT DIMENSIONS
    const printWindow = window.open('', '_blank', 
      `width=${optimalPrintWidth},height=${optimalPrintHeight},scrollbars=no,resizable=no,toolbar=no,menubar=no,location=no,status=no`
    );
    
    if (!printWindow) {
      alert('لطفاً popup blocker را غیرفعال کنید');
      return;
    }
    
    // Add cache busting timestamp to image URL
    const timestamp = Date.now();
    const imageDataUrl = canvas.toDataURL('image/png');
    console.log('🖨️ Generated canvas image with timestamp:', timestamp);

    // PHASE 4: DYNAMIC CSS INJECTION
    const dynamicCSS = `
      @page { 
        size: ${optimalPrintWidth}px auto; 
        margin: 0; 
        padding: 0; 
      }
      body { 
        font-family: 'Tahoma', 'Arial', sans-serif;
        margin: 0; 
        padding: 0; 
        background: white; 
        direction: rtl; 
        text-align: center; 
        width: ${optimalPrintWidth}px; 
        max-width: ${optimalPrintWidth}px; 
        overflow: hidden; 
        position: fixed;
        top: 0;
        left: 0;
      }
      .receipt-container { 
        width: ${optimalPrintWidth}px; 
        max-width: ${optimalPrintWidth}px; 
        margin: 0; 
        padding: 0; 
        background: white; 
        overflow: hidden; 
        position: relative;
      }
      .receipt-image { 
        width: ${optimalPrintWidth}px; 
        height: auto; 
        display: block; 
        margin: 0; 
        padding: 0; 
        max-width: 100%;
      }
      * {
        box-sizing: border-box;
      }
    `;

    const printDocument = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>رسید سفارش - Production Ready</title>
        <style>${dynamicCSS}</style>
      </head>
      <body>
        <div class="receipt-container">
          <img src="${imageDataUrl}" alt="رسید سفارش - Production Ready" class="receipt-image" />
        </div>
        
        <script>
          // PHASE 5: REAL-TIME DIMENSION MONITORING
          console.log('🔍 PRINT WINDOW MONITORING STARTED');
          
          // Monitor window size changes
          let lastWidth = ${optimalPrintWidth};
          let lastHeight = ${optimalPrintHeight};
          
          function checkDimensions() {
            const currentWidth = window.innerWidth;
            const currentHeight = window.innerHeight;
            
            if (currentWidth !== lastWidth || currentHeight !== lastHeight) {
              console.log('🔄 Print window resized:', currentWidth, 'x', currentHeight);
              lastWidth = currentWidth;
              lastHeight = currentHeight;
              
              // Force container to match new dimensions
              const container = document.querySelector('.receipt-container');
              const image = document.querySelector('.receipt-image');
              if (container && image) {
                container.style.width = currentWidth + 'px';
                container.style.maxWidth = currentWidth + 'px';
                image.style.width = currentWidth + 'px';
                console.log('✅ Adjusted container to:', currentWidth, 'px');
              }
            }
          }
          
          // Check dimensions every 100ms
          setInterval(checkDimensions, 100);
          
          // Initial dimension check
          setTimeout(() => {
            console.log('📏 Initial print window size:', window.innerWidth, 'x', window.innerHeight);
            console.log('📏 Canvas image size:', document.querySelector('.receipt-image').naturalWidth, 'x', document.querySelector('.receipt-image').naturalHeight);
          }, 100);
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printDocument);
    printWindow.document.close();

    // PHASE 6: ENHANCED LOAD MONITORING
    printWindow.onload = () => {
      console.log('🖨️ BULLETPROOF print window loaded');
      console.log('🖨️ Print window dimensions:', printWindow.innerWidth, 'x', printWindow.innerHeight);
      console.log('🖨️ Canvas dimensions:', canvas.width, 'x', canvas.height);
      console.log('🖨️ Optimal dimensions:', optimalPrintWidth, 'x', optimalPrintHeight);
      
      // PHASE 7: DIMENSION VERIFICATION
      const img = printWindow.document.querySelector('.receipt-image') as HTMLImageElement;
      if (img) {
        img.onload = () => {
          console.log('🖨️ Image loaded in print window');
          console.log('🖨️ Image natural size:', img.naturalWidth, 'x', img.naturalHeight);
          console.log('🖨️ Image rendered size:', img.offsetWidth, 'x', img.offsetHeight);
          
          // Verify dimensions match
          if (img.offsetWidth !== optimalPrintWidth) {
            console.log('⚠️ WARNING: Image width mismatch, forcing correction');
            img.style.width = optimalPrintWidth + 'px';
          }
        };
      }
      
      // Force a small delay to ensure everything is properly loaded
      setTimeout(() => {
        console.log('🖨️ Triggering print...');
        printWindow.print();
        setTimeout(() => {
          console.log('🖨️ Print completed, closing window');
          printWindow.close();
          onPrintComplete?.();
        }, 1000);
      }, 500);
    };
  };

  return (
    <div className="bg-white p-6 max-w-md mx-auto">
      <div className="mb-4">
        <button
          onClick={handlePrint}
          className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 font-medium"
        >
          چاپ رسید
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">پیش‌نمایش رسید</h3>
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
