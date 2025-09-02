/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'vazir': ['Vazirmatn', 'Inter', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        // Admin-specific color palette
        'admin-primary': '#1E40AF',      // Blue-800
        'admin-secondary': '#3B82F6',    // Blue-500
        'admin-accent': '#8B5CF6',       // Violet-500
        'admin-success': '#10B981',      // Emerald-500
        'admin-warning': '#F59E0B',      // Amber-500
        'admin-danger': '#EF4444',       // Red-500
        'admin-info': '#06B6D4',         // Cyan-500
        
        // Background colors
        'admin-bg': '#F8FAFC',           // Slate-50
        'admin-card': '#FFFFFF',         // White
        'admin-border': '#E2E8F0',       // Slate-200
        
        // Text colors
        'admin-text': '#1E293B',         // Slate-800
        'admin-text-light': '#64748B',   // Slate-500
        'admin-text-muted': '#94A3B8',  // Slate-400
        
        // Status colors
        'admin-healthy': '#10B981',      // Green
        'admin-warning': '#F59E0B',      // Yellow
        'admin-critical': '#EF4444',     // Red
        'admin-maintenance': '#8B5CF6',  // Purple
      },
      boxShadow: {
        'admin-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'admin': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'admin-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'admin-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'admin-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'admin': '0.5rem',
        'admin-lg': '0.75rem',
        'admin-xl': '1rem',
      },
      spacing: {
        'admin-sidebar': '16rem',
        'admin-header': '4rem',
      },
      animation: {
        'admin-fade-in': 'fadeIn 0.3s ease-in-out',
        'admin-slide-up': 'slideUp 0.3s ease-out',
        'admin-pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
  // RTL support
  corePlugins: {
    preflight: true,
  },
}
