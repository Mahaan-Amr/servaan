import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItemForm from '@/components/ItemForm';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock fetch
global.fetch = jest.fn();

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
}));

// Test wrapper with AuthContext
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    {children}
  </AuthProvider>
);

describe('ItemForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Create Mode', () => {
    test('should render create form correctly', () => {
      render(
        <TestWrapper>
          <ItemForm mode="create" />
        </TestWrapper>
      );

      expect(screen.getByText('افزودن کالای جدید')).toBeInTheDocument();
      expect(screen.getByLabelText(/نام کالا/)).toBeInTheDocument();
      expect(screen.getByLabelText(/دسته‌بندی/)).toBeInTheDocument();
      expect(screen.getByLabelText(/واحد/)).toBeInTheDocument();
      expect(screen.getByLabelText(/حداقل موجودی/)).toBeInTheDocument();
      expect(screen.getByLabelText(/توضیحات/)).toBeInTheDocument();
      expect(screen.getByLabelText(/بارکد/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ثبت کالا/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /انصراف/ })).toBeInTheDocument();
    });

    test('should validate required fields', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ItemForm mode="create" />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /ثبت کالا/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('نام کالا الزامی است')).toBeInTheDocument();
        expect(screen.getByText('دسته‌بندی الزامی است')).toBeInTheDocument();
        expect(screen.getByText('واحد الزامی است')).toBeInTheDocument();
      });
    });

    test('should validate name length', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ItemForm mode="create" />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(/نام کالا/);
      await user.type(nameInput, 'A'); // Too short

      const submitButton = screen.getByRole('button', { name: /ثبت کالا/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('نام کالا باید حداقل ۲ کاراکتر باشد')).toBeInTheDocument();
      });
    });

    test('should validate minimum stock', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ItemForm mode="create" />
        </TestWrapper>
      );

      const minStockInput = screen.getByLabelText(/حداقل موجودی/);
      await user.type(minStockInput, '-5'); // Negative value

      const submitButton = screen.getByRole('button', { name: /ثبت کالا/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('حداقل موجودی نمی‌تواند منفی باشد')).toBeInTheDocument();
      });
    });

    test('should validate barcode format', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ItemForm mode="create" />
        </TestWrapper>
      );

      const barcodeInput = screen.getByLabelText(/بارکد/);
      await user.type(barcodeInput, '12345'); // Too short

      const submitButton = screen.getByRole('button', { name: /ثبت کالا/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('بارکد باید ۱۳ رقم باشد')).toBeInTheDocument();
      });
    });

    test('should submit valid form data', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        id: '1',
        name: 'تست کالا',
        category: 'تست',
        unit: 'kg',
        minStock: 10,
        description: 'توضیحات تست',
        barcode: '1234567890123',
        isActive: true
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(
        <TestWrapper>
          <ItemForm mode="create" />
        </TestWrapper>
      );

      // Fill form
      await user.type(screen.getByLabelText(/نام کالا/), 'تست کالا');
      await user.type(screen.getByLabelText(/دسته‌بندی/), 'تست');
      await user.selectOptions(screen.getByLabelText(/واحد/), 'kg');
      await user.type(screen.getByLabelText(/حداقل موجودی/), '10');
      await user.type(screen.getByLabelText(/توضیحات/), 'توضیحات تست');
      await user.type(screen.getByLabelText(/بارکد/), '1234567890123');

      const submitButton = screen.getByRole('button', { name: /ثبت کالا/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer'),
          },
          body: JSON.stringify({
            name: 'تست کالا',
            category: 'تست',
            unit: 'kg',
            minStock: 10,
            description: 'توضیحات تست',
            barcode: '1234567890123',
          }),
        });
      });

      expect(mockPush).toHaveBeenCalledWith('/items');
    });

    test('should handle API errors', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'کالا با این نام قبلا ثبت شده است' }),
      });

      render(
        <TestWrapper>
          <ItemForm mode="create" />
        </TestWrapper>
      );

      // Fill valid form
      await user.type(screen.getByLabelText(/نام کالا/), 'کالای تکراری');
      await user.type(screen.getByLabelText(/دسته‌بندی/), 'تست');
      await user.selectOptions(screen.getByLabelText(/واحد/), 'kg');

      const submitButton = screen.getByRole('button', { name: /ثبت کالا/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('کالا با این نام قبلا ثبت شده است')).toBeInTheDocument();
      });
    });

    test('should handle network errors', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <ItemForm mode="create" />
        </TestWrapper>
      );

      // Fill valid form
      await user.type(screen.getByLabelText(/نام کالا/), 'تست کالا');
      await user.type(screen.getByLabelText(/دسته‌بندی/), 'تست');
      await user.selectOptions(screen.getByLabelText(/واحد/), 'kg');

      const submitButton = screen.getByRole('button', { name: /ثبت کالا/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('خطا در ارتباط با سرور')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    const mockItem = {
      id: '1',
      name: 'کالای موجود',
      category: 'لبنیات',
      unit: 'liter',
      minStock: 20,
      description: 'توضیحات موجود',
      barcode: '9876543210987',
      isActive: true
    };

    test('should render edit form with existing data', () => {
      render(
        <TestWrapper>
          <ItemForm mode="edit" item={mockItem} />
        </TestWrapper>
      );

      expect(screen.getByText('ویرایش کالا')).toBeInTheDocument();
      expect(screen.getByDisplayValue('کالای موجود')).toBeInTheDocument();
      expect(screen.getByDisplayValue('لبنیات')).toBeInTheDocument();
      expect(screen.getByDisplayValue('liter')).toBeInTheDocument();
      expect(screen.getByDisplayValue('20')).toBeInTheDocument();
      expect(screen.getByDisplayValue('توضیحات موجود')).toBeInTheDocument();
      expect(screen.getByDisplayValue('9876543210987')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ذخیره تغییرات/ })).toBeInTheDocument();
    });

    test('should submit updated data', async () => {
      const user = userEvent.setup();
      const mockResponse = { ...mockItem, name: 'نام جدید' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(
        <TestWrapper>
          <ItemForm mode="edit" item={mockItem} />
        </TestWrapper>
      );

      const nameInput = screen.getByDisplayValue('کالای موجود');
      await user.clear(nameInput);
      await user.type(nameInput, 'نام جدید');

      const submitButton = screen.getByRole('button', { name: /ذخیره تغییرات/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/items/1', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer'),
          },
          body: JSON.stringify({
            name: 'نام جدید',
            category: 'لبنیات',
            unit: 'liter',
            minStock: 20,
            description: 'توضیحات موجود',
            barcode: '9876543210987',
          }),
        });
      });
    });

    test('should handle edit API errors', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'شما دسترسی لازم برای این عملیات را ندارید' }),
      });

      render(
        <TestWrapper>
          <ItemForm mode="edit" item={mockItem} />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /ذخیره تغییرات/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('شما دسترسی لازم برای این عملیات را ندارید')).toBeInTheDocument();
      });
    });
  });

  describe('Form Interactions', () => {
    test('should clear form on reset', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ItemForm mode="create" />
        </TestWrapper>
      );

      // Fill some fields
      await user.type(screen.getByLabelText(/نام کالا/), 'تست');
      await user.type(screen.getByLabelText(/دسته‌بندی/), 'دسته تست');

      // Reset form (usually through a button or action)
      const cancelButton = screen.getByRole('button', { name: /انصراف/ });
      await user.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith('/items');
    });

    test('should show loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ id: '1' })
          }), 100)
        )
      );

      render(
        <TestWrapper>
          <ItemForm mode="create" />
        </TestWrapper>
      );

      // Fill valid form
      await user.type(screen.getByLabelText(/نام کالا/), 'تست');
      await user.type(screen.getByLabelText(/دسته‌بندی/), 'تست');
      await user.selectOptions(screen.getByLabelText(/واحد/), 'kg');

      const submitButton = screen.getByRole('button', { name: /ثبت کالا/ });
      await user.click(submitButton);

      expect(screen.getByText(/در حال ثبت/)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    test('should validate form on field blur', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ItemForm mode="create" />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(/نام کالا/);
      await user.click(nameInput);
      await user.tab(); // Move focus away

      await waitFor(() => {
        expect(screen.getByText('نام کالا الزامی است')).toBeInTheDocument();
      });
    });

    test('should provide autocomplete suggestions for category', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ItemForm mode="create" />
        </TestWrapper>
      );

      const categoryInput = screen.getByLabelText(/دسته‌بندی/);
      await user.type(categoryInput, 'لب');

      await waitFor(() => {
        expect(screen.getByText('لبنیات')).toBeInTheDocument();
        expect(screen.getByText('لوازم')).toBeInTheDocument();
      });
    });

    test('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ItemForm mode="create" />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(/نام کالا/);
      await user.click(nameInput);
      
      // Tab through fields
      await user.tab();
      expect(screen.getByLabelText(/دسته‌بندی/)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/واحد/)).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <ItemForm mode="create" />
        </TestWrapper>
      );

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/نام کالا/)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/دسته‌بندی/)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/واحد/)).toHaveAttribute('aria-required', 'true');
    });

    test('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ItemForm mode="create" />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /ثبت کالا/ });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('نام کالا الزامی است');
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    test('should support high contrast mode', () => {
      render(
        <TestWrapper>
          <ItemForm mode="create" />
        </TestWrapper>
      );

      const form = screen.getByRole('form');
      expect(form).toHaveClass('high-contrast-support');
    });
  });
}); 