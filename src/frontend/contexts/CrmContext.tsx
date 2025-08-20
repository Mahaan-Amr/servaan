'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  Customer,
  CustomerVisit,
  LoyaltyTransaction,
  CustomerFilter,
  VisitFilter
} from '../types/crm';

// CRM State interface
interface CrmState {
  customers: Customer[];
  currentCustomer: Customer | null;
  visits: CustomerVisit[];
  loyaltyTransactions: LoyaltyTransaction[];
  loading: boolean;
  error: string | null;
  filters: {
    customer: CustomerFilter;
    visit: VisitFilter;
  };
  pagination: {
    customers: {
      currentPage: number;
      total: number;
      pages: number;
      limit: number;
    };
    visits: {
      currentPage: number;
      total: number;
      pages: number;
      limit: number;
    };
  };
}

// Initial state
const initialState: CrmState = {
  customers: [],
  currentCustomer: null,
  visits: [],
  loyaltyTransactions: [],
  loading: false,
  error: null,
  filters: {
    customer: {},
    visit: {}
  },
  pagination: {
    customers: {
      currentPage: 1,
      total: 0,
      pages: 0,
      limit: 20
    },
    visits: {
      currentPage: 1,
      total: 0,
      pages: 0,
      limit: 20
    }
  }
};

// Action types
type CrmAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CUSTOMERS'; payload: { customers: Customer[]; pagination: any } }
  | { type: 'SET_CURRENT_CUSTOMER'; payload: Customer | null }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: { id: string; customer: Customer } }
  | { type: 'REMOVE_CUSTOMER'; payload: string }
  | { type: 'SET_VISITS'; payload: { visits: CustomerVisit[]; pagination: any } }
  | { type: 'ADD_VISIT'; payload: CustomerVisit }
  | { type: 'UPDATE_VISIT'; payload: { id: string; visit: CustomerVisit } }
  | { type: 'REMOVE_VISIT'; payload: string }
  | { type: 'SET_LOYALTY_TRANSACTIONS'; payload: LoyaltyTransaction[] }
  | { type: 'ADD_LOYALTY_TRANSACTION'; payload: LoyaltyTransaction }
  | { type: 'SET_CUSTOMER_FILTER'; payload: CustomerFilter }
  | { type: 'SET_VISIT_FILTER'; payload: VisitFilter }
  | { type: 'RESET_FILTERS' }
  | { type: 'RESET_STATE' };

// Reducer function
function crmReducer(state: CrmState, action: CrmAction): CrmState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_CUSTOMERS':
      return {
        ...state,
        customers: action.payload.customers,
        pagination: { ...state.pagination, customers: action.payload.pagination },
        loading: false,
        error: null
      };

    case 'SET_CURRENT_CUSTOMER':
      return { ...state, currentCustomer: action.payload };

    case 'ADD_CUSTOMER':
      return {
        ...state,
        customers: [action.payload, ...state.customers],
        pagination: {
          ...state.pagination,
          customers: {
            ...state.pagination.customers,
            total: state.pagination.customers.total + 1
          }
        }
      };

    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(customer =>
          customer.id === action.payload.id ? action.payload.customer : customer
        ),
        currentCustomer: state.currentCustomer?.id === action.payload.id
          ? action.payload.customer
          : state.currentCustomer
      };

    case 'REMOVE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(customer => customer.id !== action.payload),
        currentCustomer: state.currentCustomer?.id === action.payload ? null : state.currentCustomer,
        pagination: {
          ...state.pagination,
          customers: {
            ...state.pagination.customers,
            total: Math.max(0, state.pagination.customers.total - 1)
          }
        }
      };

    case 'SET_VISITS':
      return {
        ...state,
        visits: action.payload.visits,
        pagination: { ...state.pagination, visits: action.payload.pagination },
        loading: false,
        error: null
      };

    case 'ADD_VISIT':
      return {
        ...state,
        visits: [action.payload, ...state.visits],
        pagination: {
          ...state.pagination,
          visits: {
            ...state.pagination.visits,
            total: state.pagination.visits.total + 1
          }
        }
      };

    case 'UPDATE_VISIT':
      return {
        ...state,
        visits: state.visits.map(visit =>
          visit.id === action.payload.id ? action.payload.visit : visit
        )
      };

    case 'REMOVE_VISIT':
      return {
        ...state,
        visits: state.visits.filter(visit => visit.id !== action.payload),
        pagination: {
          ...state.pagination,
          visits: {
            ...state.pagination.visits,
            total: Math.max(0, state.pagination.visits.total - 1)
          }
        }
      };

    case 'SET_LOYALTY_TRANSACTIONS':
      return { ...state, loyaltyTransactions: action.payload };

    case 'ADD_LOYALTY_TRANSACTION':
      return {
        ...state,
        loyaltyTransactions: [action.payload, ...state.loyaltyTransactions]
      };

    case 'SET_CUSTOMER_FILTER':
      return {
        ...state,
        filters: { ...state.filters, customer: action.payload }
      };

    case 'SET_VISIT_FILTER':
      return {
        ...state,
        filters: { ...state.filters, visit: action.payload }
      };

    case 'RESET_FILTERS':
      return {
        ...state,
        filters: { customer: {}, visit: {} }
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Context
const CrmContext = createContext<{
  state: CrmState;
  dispatch: React.Dispatch<CrmAction>;
} | null>(null);

// Provider component
interface CrmProviderProps {
  children: ReactNode;
}

export function CrmProvider({ children }: CrmProviderProps) {
  const [state, dispatch] = useReducer(crmReducer, initialState);

  return (
    <CrmContext.Provider value={{ state, dispatch }}>
      {children}
    </CrmContext.Provider>
  );
}

// Hook to use CRM context
export function useCrm() {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
} 