import { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal } from './ui/Modal';
import { Spinner } from './ui/Spinner';
import { AlertBox } from './ui/AlertBox';
import { Button } from './ui/Button';
import { Item } from '../types';
import { API_URL } from '../lib/apiUtils';

interface SupplierItemModalProps {
  supplierId: string;
  onClose: (refresh?: boolean) => void;
}

export const SupplierItemModal: React.FC<SupplierItemModalProps> = ({ supplierId, onClose }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    itemId: '',
    preferredSupplier: false,
    unitPrice: ''
  });

  // Fetch available items
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await axios.get(
          `${API_URL}/items`, 
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        // Get all items from the API response
        setItems(response.data);
      } catch (err) {
        console.error('Error fetching items:', err);
        setError('خطا در بارگذاری لیست کالاها');
      } finally {
        setLoading(false);
      }
    };
    
    fetchItems();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemId) {
      setError('لطفا یک کالا انتخاب کنید');
      return;
    }
    
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const payload = {
        itemId: formData.itemId,
        preferredSupplier: formData.preferredSupplier,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined
      };
      
      await axios.post(
        `${API_URL}/suppliers/${supplierId}/items`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setSuccess('کالا با موفقیت به تأمین‌کننده اضافه شد');
      
      // Reset form
      setFormData({
        itemId: '',
        preferredSupplier: false,
        unitPrice: ''
      });
      
      // Close after a short delay
      setTimeout(() => {
        onClose(true);
      }, 1500);
    } catch (err: unknown) {
      console.error('Error adding item to supplier:', err);
      const errorMessage = err instanceof Error && 'response' in err && err.response && typeof err.response === 'object' && err.response !== null && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && err.response.data !== null && 'message' in err.response.data && typeof err.response.data.message === 'string'
        ? err.response.data.message
        : 'خطا در افزودن کالا به تأمین‌کننده';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="افزودن کالا به تأمین‌کننده" onClose={() => onClose()}>
      {error && <AlertBox type="error" message={error} className="mb-4" />}
      {success && <AlertBox type="success" message={success} className="mb-4" />}
      
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Spinner size="large" />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="itemId" className="form-label">کالا</label>
            <select
              id="itemId"
              name="itemId"
              value={formData.itemId}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">انتخاب کالا...</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.category})
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="unitPrice" className="form-label">
              قیمت واحد (تومان)
            </label>
            <input
              type="number"
              id="unitPrice"
              name="unitPrice"
              value={formData.unitPrice}
              onChange={handleChange}
              className="form-input"
              placeholder="قیمت به تومان"
            />
          </div>
          
          <div className="mb-6 flex items-center">
            <input
              type="checkbox"
              id="preferredSupplier"
              name="preferredSupplier"
              checked={formData.preferredSupplier}
              onChange={handleChange}
              className="form-checkbox h-5 w-5 text-primary-500"
            />
            <label htmlFor="preferredSupplier" className="form-label mr-2 mb-0">
              تأمین‌کننده ترجیحی
            </label>
          </div>
          
          <div className="flex justify-end space-x-2 space-x-reverse mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              isLoading={submitting}
              disabled={submitting}
            >
              افزودن
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}; 