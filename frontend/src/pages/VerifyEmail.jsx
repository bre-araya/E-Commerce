import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/axios';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return setLoading(false);
    api.get(`/auth/verify/${token}`)
      .then(() => { setSuccess(true); toast.success('Email verified'); })
      .catch(() => { setSuccess(false); toast.error('Invalid or expired verification link'); })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="p-8 text-center">Verifying...</div>;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        {success ? (
          <>
            <h2 className="text-2xl font-bold mb-4">Email Verified</h2>
            <p className="text-gray-600 mb-6">You can now continue to the app.</p>
            <Link to="/" className="btn-primary">Go to Home</Link>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">Verification Failed</h2>
            <p className="text-gray-600 mb-6">The verification link is invalid or expired.</p>
            <Link to="/" className="btn-secondary">Back to Home</Link>
          </>
        )}
      </div>
    </div>
  );
}
