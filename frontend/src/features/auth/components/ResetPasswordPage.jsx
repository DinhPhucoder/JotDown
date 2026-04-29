import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { resetPassword as resetPasswordApi } from '../services/authService';
import '../styles/Auth.css';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [showPasswords, setShowPasswords] = useState({ password: false, confirmPassword: false });
  const [loading, setLoading] = useState(false);

  const emailRef = useRef(localStorage.getItem('reset_email') || '');
  const otpRef = useRef(localStorage.getItem('reset_otp') || '');

  useEffect(() => {
    if (!emailRef.current || !otpRef.current) {
      toast.error('Phiên đặt lại mật khẩu đã hết hạn. Vui lòng thực hiện lại.');
      navigate('/forgot-password', { replace: true });
    }
  }, [navigate]);

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    // Frontend validation
    if (!password) return toast.warning('Vui lòng nhập mật khẩu mới');
    if (password.length < 8) return toast.warning('Mật khẩu phải có ít nhất 8 ký tự');
    if (password !== confirmPassword) return toast.warning('Mật khẩu xác nhận không khớp');

    setLoading(true);
    try {
      const res = await resetPasswordApi({
        email: emailRef.current,
        otp: otpRef.current,
        password,
        password_confirmation: confirmPassword,
      });
      toast.success(res.message);
      // Dọn dẹp localStorage
      localStorage.removeItem('reset_email');
      localStorage.removeItem('reset_otp');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="p-0 auth-wrapper">
      {/* Logo */}
      <Link to="/landing" className="auth-logo text-decoration-none">
        <img src="/Logo_JotDown.png" alt="JotDown" />
        <span className="brand-name">JotDown</span>
      </Link>

      <Row className="g-0 min-vh-100">
        {/* Branding */}
        <Col lg={7} className="d-none d-lg-flex auth-branding">
          <div className="branding-content">
            <h2>Mật khẩu mới, <span>khởi đầu mới</span></h2>
          </div>
        </Col>

        <Col lg={5} className="auth-form-container">
          <div className="auth-card">
            <div className="auth-header mb-3">
              <Link to="/login" className="text-decoration-none d-inline-flex align-items-center mb-3 auth-link">
                <ArrowLeft size={18} className="me-1" /> Quay lại đăng nhập
              </Link>
              <h1 className="fw-bold">Đặt lại mật khẩu</h1>
              <p className="text-secondary">Nhập mật khẩu mới cho tài khoản của bạn</p>
            </div>

            <Form className="auth-form" onSubmit={handleSubmit} noValidate>
              <Form.Group className="mb-4" controlId="password">
                <Form.Label>Mật khẩu mới</Form.Label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <Form.Control
                    type={showPasswords.password ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    tabIndex={-1}
                    onClick={() => togglePasswordVisibility('password')}
                  >
                    {showPasswords.password ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </Form.Group>

              <Form.Group className="mb-4" controlId="confirmPassword">
                <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <Form.Control
                    type={showPasswords.confirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    tabIndex={-1}
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                  >
                    {showPasswords.confirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </Form.Group>

              <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Đặt lại mật khẩu'}
              </Button>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ResetPasswordPage;
