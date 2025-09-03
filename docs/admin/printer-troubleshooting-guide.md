# Printer Troubleshooting Guide

## Issue: Faded/Pale Receipt Printing

### **Problem Description**
- Receipt text appears extremely light and barely legible
- Vertical band of faded printing in the center
- Poor contrast with darker edges and lighter center
- Inconsistent ink/toner distribution

### **Root Cause**
This is a **thermal printer hardware issue**, not a software problem. The current receipt template is correctly configured for 8cm thermal printers.

## **Immediate Hardware Solutions**

### **1. Thermal Printer Maintenance**

#### **Clean Print Head**
```bash
# Turn off printer
# Remove paper roll
# Clean print head with isopropyl alcohol (90%+)
# Use cotton swab, gently clean print head surface
# Allow to dry completely (5-10 minutes)
# Reinstall paper roll
```

#### **Check Paper Quality**
- **Use thermal paper only** (not regular paper)
- **Check paper expiration date** - thermal paper degrades over time
- **Store paper in cool, dry place** away from sunlight
- **Avoid touching thermal surface** with fingers

#### **Adjust Print Density**
Most thermal printers have a **print density setting**:
- **Access printer settings** (usually via buttons on printer)
- **Increase print density** to maximum setting
- **Test print** to verify improvement

### **2. Printer Settings Optimization**

#### **Thermal Printer Configuration**
```javascript
// Current receipt template is optimized for:
// - Width: 302px (8cm thermal printer)
// - Font: Tahoma, Arial, sans-serif
// - Color: Black only (#000000)
// - Line height: 18px
// - Margins: 13px
```

#### **Recommended Printer Settings**
- **Print Quality**: High/Dark
- **Print Speed**: Normal (not fast)
- **Paper Width**: 80mm (8cm)
- **Density**: Maximum
- **Temperature**: High (if adjustable)

### **3. Software Enhancements for Better Print Quality**

#### **Enhanced Receipt Template with Print Quality Options**
```typescript
// Add print quality settings to receipt template
const PRINT_QUALITY_SETTINGS = {
  density: 'high', // 'low' | 'medium' | 'high'
  contrast: 'maximum', // 'minimum' | 'medium' | 'maximum'
  fontSize: 'large', // 'small' | 'medium' | 'large'
  boldText: true, // Enable bold text for better visibility
};
```

## **Advanced Solutions**

### **1. Printer Driver Settings**
- **Update printer drivers** to latest version
- **Check printer properties** in Windows
- **Set print quality** to "Best" or "High Quality"
- **Disable "Fast Print"** mode if available

### **2. Alternative Print Methods**

#### **Direct ESC/POS Commands**
```javascript
// For advanced users - direct thermal printer commands
const ESC_POS_COMMANDS = {
  initialize: '\x1B\x40', // Initialize printer
  boldOn: '\x1B\x45\x01', // Bold text on
  boldOff: '\x1B\x45\x00', // Bold text off
  doubleHeight: '\x1B\x21\x10', // Double height text
  alignCenter: '\x1B\x61\x01', // Center alignment
  cutPaper: '\x1D\x56\x00', // Cut paper
};
```

#### **USB Direct Connection**
- **Connect printer directly** via USB (not network)
- **Use manufacturer's software** for configuration
- **Test print** directly from printer settings

### **3. Printer Replacement Considerations**

#### **When to Replace Printer**
- **Print head worn out** (after 2-3 years of heavy use)
- **Consistent poor quality** despite maintenance
- **Hardware damage** to print mechanism
- **Outdated thermal technology**

#### **Recommended Thermal Printers**
- **Star TSP100** series
- **Epson TM-T88VI**
- **Citizen CT-S310II**
- **Bixolon SRP-350III**

## **Testing and Verification**

### **1. Print Quality Test**
```javascript
// Test receipt with different settings
const testReceipt = {
  businessName: 'تست چاپ',
  items: [
    { name: 'آیتم تست ۱', quantity: 1, price: 1000 },
    { name: 'آیتم تست ۲', quantity: 2, price: 2000 }
  ],
  total: 5000
};
```

### **2. Quality Checklist**
- [ ] **Text is dark and legible**
- [ ] **No faded areas** in center
- [ ] **Consistent contrast** across entire receipt
- [ ] **Proper alignment** of columns
- [ ] **Clean edges** without smudging

## **Prevention**

### **1. Regular Maintenance Schedule**
- **Weekly**: Clean print head
- **Monthly**: Check paper quality
- **Quarterly**: Update printer drivers
- **Annually**: Professional service

### **2. Environment Control**
- **Temperature**: 15-25°C (59-77°F)
- **Humidity**: 40-60%
- **Dust**: Keep area clean
- **Sunlight**: Avoid direct exposure

## **Emergency Solutions**

### **1. Temporary Workarounds**
- **Increase font size** in receipt template
- **Use bold text** for all content
- **Reduce line spacing** for better density
- **Print multiple copies** for better visibility

### **2. Alternative Receipt Methods**
- **Email receipt** to customer
- **SMS receipt** with order details
- **Digital receipt** via mobile app
- **Paper receipt** with regular printer (temporary)

## **Contact Information**

### **Technical Support**
- **Printer Manufacturer**: Check warranty and support
- **Local Technician**: Professional maintenance
- **Software Support**: For receipt template modifications

### **Documentation Updates**
- **Last Updated**: [Current Date]
- **Version**: 1.0
- **Status**: Active troubleshooting guide
