import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { forgotPassword as forgotPasswordApi } from '../services/authService';
import '../styles/Auth.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email?.value?.trim() || '';

    if (!email) return toast.warning('Vui lòng nhập email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.warning('Email không hợp lệ');

    setLoading(true);
    try {
      const res = await forgotPasswordApi({ email });
      // Lưu email để trang OTP sử dụng
      localStorage.setItem('reset_email', email);
      toast.success(res.message);
      navigate('/verify-otp?purpose=reset');
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
            <h2>Lấy lại quyền truy cập một cách <span>nhẹ nhàng</span></h2>
          </div>
        </Col>

        {/* Cột Form */}
        <Col lg={5} className="auth-form-container">
          <div className="auth-card">
            {/* Nút Trở về */}
            <Link to="/login" className="d-flex align-items-center mb-4 text-decoration-none auth-link">
              <ArrowLeft size={18} className="me-2" /> Trở về Đăng nhập
            </Link>

            <div className="auth-header mb-4">
              <h1 className="fw-bold">Quên mật khẩu?</h1>
              <p className="text-secondary">
                Chúng tôi sẽ gửi liên kết về email của bạn
              </p>
            </div>

            <Form className="auth-form" onSubmit={handleSubmit} noValidate>
              <Form.Group className="mb-4" controlId="email">
                <Form.Label>Email</Form.Label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={20} />
                  <Form.Control
                    type="text"
                    name="email"
                    placeholder="name@example.com"
                    disabled={loading}
                    style={{ cursor: 'text' }}
                  />
                </div>
              </Form.Group>

              <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Gửi'}
              </Button>
            </Form>

          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPasswordPage;