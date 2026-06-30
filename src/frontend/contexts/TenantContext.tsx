'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

function extractSubdomainFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  if (window.location.pathname.startsWith('/native')) return null;

  const hostname = window.location.hostname.toLowerCase();

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return null;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return null;

  if (hostname.endsWith('.localhost')) {
    return hostname.split('.')[0] || null;
  }

  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [features, setFeatures] = useState<TenantFeatures | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getTenantFromSubdomain = async (subdomainToFetch: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/tenants/${subdomainToFetch}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('مستاجر پیدا نشد. لطفا آدرس را بررسی کنید.');
        }
        throw new Error('خطا در دریافت اطلاعات مستاجر');
      }

      const data = await response.json();
      setTenant(data.tenant);
      setFeatures(data.features);
      setSubdomain(subdomainToFetch);

      if (data.tenant.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', data.tenant.primaryColor);
      }
      if (data.tenant.secondaryColor) {
        document.documentElement.style.setProperty('--secondary-color', data.tenant.secondaryColor);
      }
    } catch (err) {
      console.error('خطا در دریافت اطلاعات مستاجر:', err);
      setError(err instanceof Error ? err.message : 'خطای ناشناخته');
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (feature: keyof TenantFeatures): boolean => {
    return features?.[feature] || false;
  };

  useEffect(() => {
    const currentSubdomain = extractSubdomainFromLocation();
    if (currentSubdomain) {
      getTenantFromSubdomain(currentSubdomain);
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        features,
        subdomain,
        loading,
        error,
        hasFeature,
        getTenantFromSubdomain
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant باید داخل TenantProvider استفاده شود');
  }
  return context;
}

