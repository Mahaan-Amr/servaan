# Receipt Generation System Documentation

## Overview

The Receipt Generation System is a **Canvas-based thermal printer solution** designed for **8cm width thermal printers**. It provides pixel-perfect control over receipt layout and ensures compatibility with thermal printing hardware.

## Architecture

### Core Components

1. **ReceiptTemplate Component** (`src/frontend/app/workspaces/ordering-sales-system/pos/components/ReceiptTemplate.tsx`)
   - **Canvas-based rendering** for pixel-perfect control
   - **8cm thermal printer optimization** (302px width)
   - **Simplified drawing logic** with comprehensive logging
   - **HTML fallback** for browser compatibility

2. **POS Integration** (`src/frontend/app/workspaces/ordering-sales-system/pos/page.tsx`)
   - **Data flow management** from order to receipt
   - **Print trigger handling** with completion callbacks
   - **Debug logging** for troubleshooting

### Key Features

- **8cm Width Optimization**: Designed specifically for 8cm thermal printers
- **Canvas Rendering**: HTML5 Canvas API for precise control
- **Comprehensive Logging**: Detailed debug logs for troubleshooting
- **Print Integration**: Direct thermal printer support
- **Responsive Design**: Adapts to different screen sizes
- **RTL Support**: Full Persian text support

## Technical Specifications

### Canvas Dimensions
- **Width**: 302 pixels (8cm at 96 DPI)
- **Height**: Dynamic based on content
- **Margins**: 10px on all sides
- **Line Height**: 20px for consistent spacing

### Font Specifications
- **Large**: 16px (business name, totals)
- **Medium**: 14px (headers, labels)
- **Small**: 12px (items, details)
- **Font Family**: Tahoma, Arial, sans-serif

### Color Scheme
- **Text**: #000000 (black)
- **Lines**: #000000 (black)
- **Background**: Transparent/white

## Data Flow

### 1. Order Processing
```
POS Order → Payment Processing → Receipt Generation → Canvas Drawing → Print Output
```

### 2. Canvas Generation Process
```
useEffect Trigger → Canvas Context → Clear Canvas → Draw Sections → Adjust Height → Verify Content
```

### 3. Print Process
```
Print Button → New Window → Canvas to PNG → HTML Document → Print Dialog → Thermal Printer
```

## Drawing Logic

### Section Order
1. **Header**: Business name, address, phone, tax ID
2. **Order Details**: Date, order type, table info
3. **Items**: Name, quantity, price, total
4. **Calculations**: Subtotal, discount, tax, service, courier
5. **Total**: Final amount
6. **Payment**: Method, received amount, change
7. **Footer**: Thank you message, timestamp

### Drawing Functions
- `drawCenteredText()`: Center-aligned text
- `drawRightText()`: Right-aligned text (labels)
- `drawLeftText()`: Left-aligned text (values)
- `drawLine()`: Horizontal separator lines

## Debug Logging

### Canvas Generation Logs
```
🎨 Starting Canvas Generation...
✅ Canvas context obtained
📝 Starting to draw at Y: 10
📝 Drawing header section...
📝 Drew centered text: "Business Name" at Y: 10
📝 Drawing order details...
📝 Drawing items...
📦 Items to draw: [Array]
📦 Drawing item 1: {id, menuItem, quantity, totalPrice}
📝 Drew item name: "Item Name" at Y: 120
📝 Drew quantity: "2" at Y: 120
📝 Drew price: "40,000" at Y: 120
📝 Drew total: "80,000" at Y: 120
📝 Drawing calculations...
📝 Drew subtotal: "80,000 تومان" at Y: 200
📝 Drawing total...
📝 Drew total: "87,200 تومان" at Y: 250
📝 Drawing payment...
📝 Drew payment method: "نقدی" at Y: 280
📝 Drawing footer...
✅ Canvas generation completed. Final height: 350
🧪 Canvas has content: true
🧪 Canvas dimensions: 302 x 350
```

### Print Process Logs
```
🖨️ Starting print process...
🖨️ Print window opened
🖨️ Print document generated
🖨️ Document written to print window
🖨️ Print window loaded, triggering print...
🖨️ Print window closed
```

## Common Issues

### Canvas Not Rendering
- **Check canvas context**: Verify `getContext('2d')` returns valid context
- **Check canvas dimensions**: Ensure width and height are set
- **Check drawing functions**: Verify text alignment and positioning
- **Check canvas height adjustment**: **CRITICAL** - Changing canvas height after drawing clears the canvas

### Canvas Not Updating
- **Check useEffect dependencies**: Ensure all required props are included
- **Check useCallback dependencies**: Verify function recreation triggers
- **Check timing**: Add delay for DOM readiness

### Print Issues
- **Check popup blocker**: Ensure new windows are allowed
- **Check canvas data**: Verify `toDataURL()` produces valid image
- **Check print CSS**: Ensure proper page sizing

### Drawing Debug
- **Missing drawing logs**: Indicates drawing functions not executing
- **Empty canvas content**: Check pixel analysis results
- **Incorrect positioning**: Verify Y-coordinate calculations

## Usage

### Basic Implementation
```typescript
<ReceiptTemplate
  orderNumber="ORDER-123"
  orderDate={new Date()}
  orderItems={items}
  calculation={calculation}
  paymentData={paymentData}
  businessInfo={businessInfo}
  orderType="DINE_IN"
  onPrintComplete={() => console.log('Print completed')}
/>
```

### Required Props
- `orderNumber`: Unique order identifier
- `orderDate`: Order timestamp
- `orderItems`: Array of ordered items
- `calculation`: Order calculations (subtotal, tax, etc.)
- `paymentData`: Payment information
- `businessInfo`: Business details
- `orderType`: Order type (DINE_IN, TAKEAWAY, etc.)

## Future Enhancements

### Planned Features
- **Barcode generation**: QR codes for digital receipts
- **Logo support**: Business logo integration
- **Custom styling**: Theme customization
- **Multi-language**: Additional language support
- **Offline support**: Local receipt storage

### Performance Optimizations
- **Canvas caching**: Pre-render common elements
- **Lazy loading**: Load fonts and resources on demand
- **Memory management**: Optimize canvas memory usage

## Maintenance

### Regular Tasks
- **Font testing**: Verify Persian text rendering
- **Print testing**: Test with actual thermal printers
- **Performance monitoring**: Check canvas rendering speed
- **Error logging**: Monitor debug log patterns

### Troubleshooting
- **Canvas issues**: Check browser compatibility
- **Print issues**: Verify printer drivers and settings
- **Layout issues**: Test with different content lengths
- **Performance issues**: Monitor memory usage and rendering time

## Technical Notes

### Browser Compatibility
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

### Thermal Printer Compatibility
- **8cm width**: Optimized for standard thermal receipt printers
- **ESC/POS**: Compatible with ESC/POS commands
- **Black text**: Ensures readability on thermal paper
- **Fixed width**: Prevents layout issues

### Canvas Optimization
- **Pixel-perfect**: Exact positioning for thermal printers
- **Memory efficient**: Minimal canvas size
- **Fast rendering**: Optimized drawing operations
- **Reliable**: Consistent output across browsers
- **Height calculation**: Pre-calculate canvas height to avoid clearing content
