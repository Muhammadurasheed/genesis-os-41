
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const { handleAuthCallback } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await handleAuthCallback();
        navigate('/');
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/auth?error=callback_failed');
      }
    };

    handleCallback();
  }, [handleAuthCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
