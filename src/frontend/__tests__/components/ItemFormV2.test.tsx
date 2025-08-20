import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ItemFormV2 from '@/components/ItemFormV2';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock auth service
jest.mock('@/services/authService', () => ({
  getToken: jest.fn(() => 'mock-token'),
}));

// Mock the Form component from our forms system
jest.mock('@/components/forms', () => ({
  Form: ({ config, onSubmit, children }: any) => (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(config.initialValues); }}>
      {config.fields.map((field: any) => (
        <div key={field.id}>
          <label htmlFor={field.id}>{field.label}</label>
          {field.type === 'select' ? (
            <select id={field.id} name={field.name}>
              {field.options?.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea id={field.id} name={field.name} />
          ) : (
            <input
              id={field.id}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
            />
          )}
        </div>
      ))}
      <button type="submit">Submit</button>
      {children}
    </form>
  ),
  EnhancedFormConfig: jest.fn(),
}));

describe('ItemFormV2 Component', () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders create mode correctly', () => {
    render(<ItemFormV2 mode="create" />);
    
    expect(screen.getByText('افزودن کالای جدید')).toBeInTheDocument();
    expect(screen.getByText('نام کالا *')).toBeInTheDocument();
    expect(screen.getByText('دسته‌بندی *')).toBeInTheDocument();
    expect(screen.getByText('واحد *')).toBeInTheDocument();
    expect(screen.getByText('حداقل موجودی')).toBeInTheDocument();
    expect(screen.getByText('توضیحات')).toBeInTheDocument();
    expect(screen.getByText('بارکد')).toBeInTheDocument();
  });

  it('renders edit mode correctly', () => {
    const initialData = {
      name: 'Test Item',
      category: 'Test Category',
      unit: 'kg',
      minStock: 10,
      description: 'Test Description',
      barcode: '1234567890123',
    };

    render(<ItemFormV2 mode="edit" itemId="123" initialData={initialData} />);
    
    expect(screen.getByText('ویرایش کالا')).toBeInTheDocument();
  });

  it('handles form submission correctly', async () => {
    const mockFetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );
    global.fetch = mockFetch;

    render(<ItemFormV2 mode="create" />);
    
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({
          name: '',
          category: '',
          unit: '',
          minStock: 0,
          description: undefined,
          barcode: undefined,
        }),
      });
    });

    expect(mockPush).toHaveBeenCalledWith('/items');
  });

  it('handles edit mode submission correctly', async () => {
    const mockFetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );
    global.fetch = mockFetch;

    const initialData = {
      name: 'Test Item',
      category: 'Test Category',
      unit: 'kg',
      minStock: 10,
      description: 'Test Description',
      barcode: '1234567890123',
    };

    render(<ItemFormV2 mode="edit" itemId="123" initialData={initialData} />);
    
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/items/123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({
          name: 'Test Item',
          category: 'Test Category',
          unit: 'kg',
          minStock: 10,
          description: 'Test Description',
          barcode: '1234567890123',
        }),
      });
    });

    expect(mockPush).toHaveBeenCalledWith('/items');
  });

  it('handles API errors correctly', async () => {
    const mockFetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'API Error' }),
      })
    );
    global.fetch = mockFetch;

    render(<ItemFormV2 mode="create" />);
    
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Should not redirect on error
    expect(mockPush).not.toHaveBeenCalled();
  });
});
