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

  // ENHANCED: Increased font sizes for better print quality
  const RECEIPT_WIDTH = 302; // 8cm width
  const MARGIN = 13;
  const LINE_HEIGHT = 20; // Increased from 18 for better spacing
  const FONT_SIZE_LARGE = 16; // Increased from 14
  const FONT_SIZE_MEDIUM = 14; // Increased from 12
  const FONT_SIZE_SMALL = 12; // Increased from 10

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

    // ENHANCED: Better contrast and visibility settings
    ctx.fillStyle = '#000000'; // Pure black for maximum contrast
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2; // Increased line width for better visibility

    let y = MARGIN + 5;

    // ENHANCED: Helper functions with better text rendering
    const drawCenteredText = (text: string, fontSize: number = FONT_SIZE_MEDIUM, isBold: boolean = true) => {
      // ENHANCED: Use bold font weight for better visibility
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

    // ENHANCED: RTL two-column layout with better text rendering
    const drawRTLTwoColumn = (label: string, value: string, fontSize: number = FONT_SIZE_SMALL, isBold: boolean = false) => {
      const fontWeight = isBold ? 'bold' : 'normal';
      ctx.font = `${fontWeight} ${fontSize}px Tahoma, Arial, sans-serif`;
      
      const rightMargin = MARGIN + 20;
      const leftMargin = MARGIN + 20;
      
      // Label on the right (RTL)
      ctx.textAlign = 'right';
      ctx.fillText(label, RECEIPT_WIDTH - rightMargin, y);
      
      // Value on the left (RTL)
      ctx.textAlign = 'left';
      ctx.fillText(value, leftMargin, y);
      
      y += LINE_HEIGHT;
    };

    // ENHANCED: RTL table header with better visibility
    const drawRTLTableHeader = () => {
      ctx.font = `bold ${FONT_SIZE_SMALL}px Tahoma, Arial, sans-serif`;
      ctx.textAlign = 'center';
      
      const col1 = MARGIN + 15; // جمع (Total)
      const col2 = MARGIN + 75; // قیمت (Price)
      const col3 = MARGIN + 135; // تعداد (Quantity)
      const col4 = MARGIN + 240; // عنوان (Title)
      
      ctx.fillText('جمع', col1, y);
      ctx.fillText('قیمت', col2, y);
      ctx.fillText('تعداد', col3, y);
      ctx.fillText('عنوان', col4, y);
      y += LINE_HEIGHT;
    };

    // ENHANCED: RTL table row with better text rendering
    const drawRTLTableRow = (rowNum: number, itemName: string, quantity: number, totalPrice: number) => {
      ctx.font = `${FONT_SIZE_SMALL}px Tahoma, Arial, sans-serif`;
      
      const col1 = MARGIN + 15; // جمع (Total)
      const col2 = MARGIN + 75; // قیمت (Price)
      const col3 = MARGIN + 135; // تعداد (Quantity)
      const col4 = MARGIN + 240; // عنوان (Title)
      
      // Total (right-aligned)
      ctx.textAlign = 'right';
      ctx.fillText(formatPrice(totalPrice), col1 + 20, y);
      
      // Price (right-aligned)
      ctx.textAlign = 'right';
      ctx.fillText(formatPrice(totalPrice / quantity), col2 + 20, y);
      
      // Quantity (center-aligned)
      ctx.textAlign = 'center';
      ctx.fillText(quantity.toString(), col3, y);
      
      // Item name (right-aligned)
      ctx.textAlign = 'right';
      ctx.fillText(itemName, col4 + 15, y);
      
      y += LINE_HEIGHT;
    };

    // ENHANCED: Header with bold business name
    drawCenteredText(businessInfo.name, FONT_SIZE_LARGE, true);
    drawLine();

    // ENHANCED: Order Details with better visibility
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

    // ENHANCED: Items Table with bold header
    drawRTLTableHeader();
    drawLine();

    // Items
    orderItems.forEach((item, index) => {
      drawRTLTableRow(index + 1, item.menuItem.name, item.quantity, item.totalPrice);
    });

    drawLine();

    // ENHANCED: Calculations with better visibility
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

    // ENHANCED: Total with bold text for emphasis
    drawRTLTwoColumn('مجموع:', `${formatPrice(calculation.totalAmount)} تومان`, FONT_SIZE_MEDIUM, true);
    drawLine();

    // ENHANCED: Payment with better visibility
    const paymentMethod = paymentData.paymentMethod === 'CASH' ? 'نقدی' : 'اعتباری';
    drawRTLTwoColumn('پرداخت:', paymentMethod, FONT_SIZE_SMALL, false);
    drawRTLTwoColumn('دریافتی:', `${formatPrice(paymentData.amountReceived)} تومان`, FONT_SIZE_SMALL, false);
    
    if (paymentData.amountReceived > calculation.totalAmount) {
      const changeAmount = paymentData.amountReceived - calculation.totalAmount;
      drawRTLTwoColumn('تغییر:', `${formatPrice(changeAmount)} تومان`, FONT_SIZE_SMALL, false);
    }

    drawLine();

    // ENHANCED: Footer with bold text
    drawCenteredText('با تشکر از خرید شما', FONT_SIZE_SMALL, true);
    drawCenteredText('امیدواریم از خدمات ما راضی باشید', FONT_SIZE_SMALL, true);
    drawCenteredText('--- پایان رسید ---', FONT_SIZE_SMALL, true);
    drawCenteredText(new Date().toLocaleTimeString('fa-IR'), FONT_SIZE_SMALL, false);
  }, [orderItems, calculation, paymentData, businessInfo, orderType, tableInfo, orderDate, formatDate, formatPrice]);

  useEffect(() => {
    if (orderItems && orderItems.length > 0) {
      setTimeout(() => {
        console.log('🔄 Generating enhanced receipt template...');
        console.log('📊 orderItems length:', orderItems.length);
        console.log('📊 Canvas ref available:', !!canvasRef.current);
        generateReceipt();
      }, 100);
    }
  }, [generateReceipt]);

  const handlePrint = () => {
    console.log('🖨️ Starting ENHANCED print process...');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('❌ Canvas not available for printing');
      return;
    }

    // Force canvas regeneration
    generateReceipt();
    
    const canvasRect = canvas.getBoundingClientRect();
    const actualCanvasWidth = canvasRect.width;
    const actualCanvasHeight = canvasRect.height;
    const pixelRatio = window.devicePixelRatio || 1;
    const deviceWidth = window.innerWidth;
    const deviceHeight = window.innerHeight;
    
    console.log('📏 ENHANCED DETECTION RESULTS:');
    console.log('📏 Canvas actual size:', actualCanvasWidth, 'x', actualCanvasHeight);
    console.log('📏 Canvas internal size:', canvas.width, 'x', canvas.height);
    console.log('📏 Device pixel ratio:', pixelRatio);
    console.log('📏 Device dimensions:', deviceWidth, 'x', deviceHeight);
    
    const optimalPrintWidth = 302;
    const optimalPrintHeight = Math.min(actualCanvasHeight, canvas.height);
    
    console.log('🎯 ENHANCED PRINT DIMENSIONS:', optimalPrintWidth, 'x', optimalPrintHeight);
    console.log('🎯 FORCED WIDTH: 302px for thermal printer compatibility');
    
    const printWindow = window.open('', '_blank', 
      `width=${optimalPrintWidth},height=${optimalPrintHeight},scrollbars=no,resizable=no,toolbar=no,menubar=no,location=no,status=no`
    );
    
    if (!printWindow) {
      alert('لطفاً popup blocker را غیرفعال کنید');
      return;
    }
    
    const timestamp = Date.now();
    const imageDataUrl = canvas.toDataURL('image/png');
    console.log('🖨️ Generated enhanced canvas image with timestamp:', timestamp);

    // ENHANCED: Better CSS for improved print quality
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
        /* ENHANCED: Better image rendering for thermal printers */
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
        filter: contrast(1.2) brightness(1.1);
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
        <title>رسید سفارش - Enhanced Print Quality</title>
        <style>${dynamicCSS}</style>
      </head>
      <body>
        <div class="receipt-container">
          <img src="${imageDataUrl}" alt="رسید سفارش - Enhanced Print Quality" class="receipt-image" />
        </div>
        
        <script>
          console.log('🔍 ENHANCED PRINT WINDOW MONITORING STARTED');
          
          let lastWidth = ${optimalPrintWidth};
          let lastHeight = ${optimalPrintHeight};
          
          function checkDimensions() {
            const currentWidth = window.innerWidth;
            const currentHeight = window.innerHeight;
            
            if (currentWidth !== lastWidth || currentHeight !== lastHeight) {
              console.log('🔄 Print window resized:', currentWidth, 'x', currentHeight);
              lastWidth = currentWidth;
              lastHeight = currentHeight;
              
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
          
          setInterval(checkDimensions, 100);
          
          setTimeout(() => {
            console.log('📏 Enhanced print window size:', window.innerWidth, 'x', window.innerHeight);
            console.log('📏 Enhanced canvas image size:', document.querySelector('.receipt-image').naturalWidth, 'x', document.querySelector('.receipt-image').naturalHeight);
          }, 100);
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printDocument);
    printWindow.document.close();

    printWindow.onload = () => {
      console.log('🖨️ ENHANCED print window loaded');
      console.log('🖨️ Print window dimensions:', printWindow.innerWidth, 'x', printWindow.innerHeight);
      console.log('🖨️ Canvas dimensions:', canvas.width, 'x', canvas.height);
      console.log('🖨️ Optimal dimensions:', optimalPrintWidth, 'x', optimalPrintHeight);
      
      const img = printWindow.document.querySelector('.receipt-image') as HTMLImageElement;
      if (img) {
        img.onload = () => {
          console.log('🖨️ Enhanced image loaded in print window');
          console.log('🖨️ Image natural size:', img.naturalWidth, 'x', img.naturalHeight);
          console.log('🖨️ Image rendered size:', img.offsetWidth, 'x', img.offsetHeight);
          
          if (img.offsetWidth !== optimalPrintWidth) {
            console.log('⚠️ WARNING: Image width mismatch, forcing correction');
            img.style.width = optimalPrintWidth + 'px';
          }
        };
      }
      
      setTimeout(() => {
        console.log('🖨️ Triggering enhanced print...');
        printWindow.print();
        setTimeout(() => {
          console.log('🖨️ Enhanced print completed, closing window');
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
          چاپ رسید (کیفیت بالا)
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">پیش‌نمایش رسید (کیفیت بالا)</h3>
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
