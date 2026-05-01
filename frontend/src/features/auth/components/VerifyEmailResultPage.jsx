import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { Container } from 'react-bootstrap';
import '../styles/Auth.css';

const VerifyEmailResultPage = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const message = searchParams.get('message');
  const isSuccess = status === 'success';

  // Cập nhật localStorage nếu xác thực thành công
  useEffect(() => {
    if (isSuccess) {
      try {
        const authUser = JSON.parse(sessionStorage.getItem('auth_user') || '{}');
        authUser.email_verified = true;
        sessionStorage.setItem('auth_user', JSON.stringify(authUser));
      } catch { /* ignore */ }
    }
  }, [isSuccess]);

  return (
    <Container fluid className="p-0 auth-wrapper">
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="auth-card text-center" style={{ maxWidth: '480px' }}>
          {isSuccess ? (
            <>
              <div className="mb-4">
                <CheckCircle size={64} className="text-success" />
              </div>
              <h2 className="fw-bold mb-3">Xác thực thành công!</h2>
              <p className="text-secondary mb-4">
                Email của bạn đã được xác thực. Bạn có thể đóng trang này và quay lại ứng dụng.
              </p>
            </>
          ) : (
            <>
              <div className="mb-4">
                <XCircle size={64} className="text-danger" />
              </div>
              <h2 className="fw-bold mb-3">Xác thực thất bại</h2>
              <p className="text-secondary mb-4">
                {message || 'Link xác thực không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.'}
              </p>
            </>
          )}
          <Link to="/login" className="btn btn-primary px-4">
            Về trang đăng nhập
          </Link>
        </div>
      </div>
    </Container>
  );
};

export default VerifyEmailResultPage;
