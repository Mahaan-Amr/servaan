'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_URL } from '../lib/apiUtils';

interface Tenant {
  id: string;
  subdomain: string;
  name: string;
  displayName: string;
  description?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  plan: 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
  isActive: boolean;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  businessType?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface TenantFeatures {
  hasInventoryManagement: boolean;
  hasCustomerManagement: boolean;
  hasAccountingSystem: boolean;
  hasReporting: boolean;
  hasNotifications: boolean;
  hasAdvancedReporting: boolean;
  hasApiAccess: boolean;
  hasCustomBranding: boolean;
  hasMultiLocation: boolean;
  hasAdvancedCRM: boolean;
  hasWhatsappIntegration: boolean;
  hasInstagramIntegration: boolean;
  hasAnalyticsBI: boolean;
}

interface TenantContextType {
  tenant: Tenant | null;
  features: TenantFeatures | null;
  subdomain: string | null;
  loading: boolean;
  error: string | null;
  hasFeature: (feature: keyof TenantFeatures) => boolean;
  getTenantFromSubdomain: (subdomain: string) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [features, setFeatures] = useState<TenantFeatures | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Extract subdomain from current hostname
  const extractSubdomain = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // For development: localhost:3000 -> no default tenant (allow universal login)
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Check if we're on a subdomain
        const parts = hostname.split('.');
        if (parts.length > 1 && parts[0] !== 'localhost') {
          return parts[0]; // Return subdomain if present
        }
        return null; // No subdomain, allow universal login
      }
      
      // For production: subdomain.servaan.ir -> extract subdomain
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        return parts[0];
      }
    }
    return null;
  };

  const getTenantFromSubdomain = async (subdomainToFetch: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tenant information from backend
      const response = await fetch(`${API_URL}/tenants/${subdomainToFetch}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('تنانت یافت نشد. لطفاً آدرس را بررسی کنید.');
        }
        throw new Error('خطا در دریافت اطلاعات تنانت');
      }

      const data = await response.json();
      setTenant(data.tenant);
      setFeatures(data.features);
      setSubdomain(subdomainToFetch);
      
      // Apply tenant branding if available
      if (data.tenant.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', data.tenant.primaryColor);
      }
      if (data.tenant.secondaryColor) {
        document.documentElement.style.setProperty('--secondary-color', data.tenant.secondaryColor);
      }
      
    } catch (err) {
      console.error('Error fetching tenant:', err);
      setError(err instanceof Error ? err.message : 'خطای ناشناخته');
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (feature: keyof TenantFeatures): boolean => {
    return features?.[feature] || false;
  };

  // Initialize tenant on mount
  useEffect(() => {
    const currentSubdomain = extractSubdomain();
    if (currentSubdomain) {
      getTenantFromSubdomain(currentSubdomain);
    } else {
      // No subdomain detected - this is OK for universal login
      setLoading(false);
      // Don't set error, just allow the app to work without tenant context
      // The user will be redirected to their tenant after login
    }
  }, []);

  return (
    <TenantContext.Provider value={{
      tenant,
      features,
      subdomain,
      loading,
      error,
      hasFeature,
      getTenantFromSubdomain
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
} 