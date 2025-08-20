// Authentication utility functions

export const handleAuthError = (error: unknown, setError?: (message: string) => void) => {
  const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
  
  if (axiosError.response?.status === 404 && axiosError.response?.data?.message?.includes('کاربر یافت نشد')) {
    const message = 'کاربر حذف شده است. لطفاً مجدداً وارد شوید.';
    if (setError) setError(message);
    clearAuthTokens();
    redirectToLogin(3000);
    return true;
  } else if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
    const message = 'دسترسی غیرمجاز. لطفاً مجدداً وارد شوید.';
    if (setError) setError(message);
    clearAuthTokens();
    redirectToLogin(2000);
    return true;
  }
  
  return false;
};

export const clearAuthTokens = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
};

export const redirectToLogin = (delay: number = 2000) => {
  setTimeout(() => {
    window.location.href = '/login';
  }, delay);
};

export const getCurrentUserId = (): string | null => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return null;
  
  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    return tokenPayload.userId || tokenPayload.id || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const isCurrentUser = (userId: string): boolean => {
  const currentUserId = getCurrentUserId();
  return currentUserId === userId;
}; 