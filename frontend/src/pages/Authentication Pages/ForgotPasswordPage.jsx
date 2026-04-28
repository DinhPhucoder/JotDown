import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import './Auth.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = e.target.email?.value?.trim() || '';

    if (!email) return toast.warning('Vui lòng nhập email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.warning('Email không hợp lệ');

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Đã gửi mã xác thực! Vui lòng kiểm tra email.');
      navigate('/verify-otp');
    }, 1500);
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
            <h2> Jot Down <br />Nơi mọi ý tưởng lớn <br />bắt đầu</h2>
            <p className="lead">
              Đừng để những suy nghĩ vụt mất. Ghi chép nhanh chóng, đồng bộ an toàn và quản lý tri thức của bạn một cách khoa học nhất.
            </p>
          </div>
        </Col>

        {/* Cột Form */}
        <Col lg={5} className="auth-form-container">
          <div className="auth-card">
            {/* Nút Trở về */}
            <Link to="/login" className="d-flex align-items-center mb-4 text-decoration-none auth-link">
              <ArrowLeft size={18} className="me-2" /> Trở về Đăng nhập
            </Link>

            {/* Tiêu đề */}
            <div className="auth-header mb-5">
              <h1 className="fw-bold">Quên mật khẩu ?</h1>
              <p className="text-secondary">
                Vui lòng nhập địa chỉ email của bạn, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu
              </p>
            </div>

            {/* Form */}
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
                {loading ? <Spinner animation="border" size="sm" /> : 'Gửi liên kết'}
              </Button>
            </Form>

          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPasswordPage;