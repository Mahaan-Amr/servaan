/**
 * Chart Export Utility
 * Provides functions to export Recharts charts to PNG and SVG formats
 */

/**
 * Export chart container to PNG
 * @param containerId - ID of the chart container element
 * @param filename - Optional filename (default: 'chart.png')
 */
export async function exportChartToPNG(containerId: string, filename: string = 'chart.png'): Promise<void> {
  try {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error('Chart container not found');
    }

    // Find the SVG element within the container
    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      throw new Error('SVG element not found in chart container');
    }

    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    
    // Get computed styles for all elements
    const allElements = clonedSvg.querySelectorAll('*');
    allElements.forEach((element) => {
      const className = element.className;
      const classNameStr = typeof className === 'string' 
        ? className 
        : (className as SVGAnimatedString)?.baseVal || '';
      const selector = element.tagName + 
        (element.id ? `#${element.id}` : '') + 
        (classNameStr ? `.${classNameStr.split(' ')[0]}` : '');
      const originalElement = svgElement.querySelector(selector);
      
      if (originalElement) {
        const computedStyle = window.getComputedStyle(originalElement as Element);
        const style = (element as HTMLElement).style;
        
        // Copy important styles
        ['fill', 'stroke', 'strokeWidth', 'fontFamily', 'fontSize', 'fontWeight'].forEach((prop) => {
          const value = computedStyle.getPropertyValue(prop);
          if (value) {
            style.setProperty(prop, value);
          }
        });
      }
    });

    // Get SVG dimensions
    const svgRect = svgElement.getBoundingClientRect();
    const svgWidth = svgRect.width || parseInt(svgElement.getAttribute('width') || '800');
    const svgHeight = svgRect.height || parseInt(svgElement.getAttribute('height') || '400');

    // Set explicit dimensions on cloned SVG
    clonedSvg.setAttribute('width', svgWidth.toString());
    clonedSvg.setAttribute('height', svgHeight.toString());
    clonedSvg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create canvas to convert SVG to PNG
    const canvas = document.createElement('canvas');
    canvas.width = svgWidth;
    canvas.height = svgHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Create image from SVG
    const img = new Image();
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        try {
          // Draw image on canvas
          ctx.fillStyle = '#ffffff'; // White background
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          // Convert canvas to blob and download
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            URL.revokeObjectURL(svgUrl);
            
            resolve();
          }, 'image/png');
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('Failed to load SVG image'));
      };
      
      img.src = svgUrl;
    });
  } catch (error) {
    console.error('Error exporting chart to PNG:', error);
    throw error;
  }
}

/**
 * Export chart container to SVG
 * @param containerId - ID of the chart container element
 * @param filename - Optional filename (default: 'chart.svg')
 */
export function exportChartToSVG(containerId: string, filename: string = 'chart.svg'): void {
  try {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error('Chart container not found');
    }

    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      throw new Error('SVG element not found in chart container');
    }

    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    
    // Get SVG dimensions
    const svgRect = svgElement.getBoundingClientRect();
    const svgWidth = svgRect.width || parseInt(svgElement.getAttribute('width') || '800');
    const svgHeight = svgRect.height || parseInt(svgElement.getAttribute('height') || '400');

    // Set explicit dimensions
    clonedSvg.setAttribute('width', svgWidth.toString());
    clonedSvg.setAttribute('height', svgHeight.toString());
    clonedSvg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

    // Serialize SVG to string
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    
    // Add XML declaration
    const svgWithDeclaration = `<?xml version="1.0" encoding="UTF-8"?>\n${svgData}`;
    
    // Create blob and download
    const blob = new Blob([svgWithDeclaration], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting chart to SVG:', error);
    throw error;
  }
}

