import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { Mail, Lock, User, Camera, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import './Auth.css';

const SignupPage = () => {
  const [showPasswords, setShowPasswords] = useState({ password: false, confirmPassword: false });

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <Container fluid className="p-0 auth-wrapper">
      <Link to="/landing" className="auth-logo">
        <img src="/Logo_JotDown.png" alt="JotDown" />
        <span className="brand-name">JotDown</span>
      </Link>

      <Row className="g-0 min-vh-100">
        <Col lg={7} className="d-none d-lg-flex auth-branding">
          <div className="branding-content">
            <h2> Jot Down <br />Nơi mọi ý tưởng lớn <br />bắt đầu</h2>
            <p className="lead">Đừng để những suy nghĩ vụt mất. Ghi chép nhanh chóng, đồng bộ an toàn và quản lý tri thức của bạn một cách khoa học nhất.</p>
          </div>
        </Col>

        <Col lg={5} className="auth-form-container">
          <div className="auth-card">
            <div className="auth-header mb-4">
              <h1 className="fw-bold">Đăng ký</h1>
              <p className="text-secondary">Bắt đầu không gian ghi chú của riêng bạn ngay hôm nay</p>
            </div>

            {/* Chọn ảnh đại diện */}
            <div className="profile-image-picker mb-4">
              <div className="profile-image-circle">
                <User size={40} className="profile-placeholder-icon" />
                <div className="profile-image-overlay">
                  <Camera size={20} />
                </div>
              </div>
              <p className="profile-image-label">Tải ảnh lên</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
              />
            </div>

            <Form className="auth-form">
              <Form.Group className="mb-4" controlId="fullName">
                <Form.Label>Họ và tên</Form.Label>
                <div className="input-wrapper">
                  <User className="input-icon" size={20} />
                  <Form.Control
                    type="text"
                    name="fullName"
                    placeholder="Ngô Xuân Quang"
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4" controlId="email">
                <Form.Label>Email</Form.Label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={20} />
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4" controlId="password">
                <Form.Label>Mật khẩu</Form.Label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <Form.Control
                    type={showPasswords.password ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
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
                <Form.Label>Xác nhận mật khẩu</Form.Label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <Form.Control
                    type={showPasswords.confirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="••••••••"
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

              <Button variant="primary" type="button" className="w-100">
                Tạo tài khoản
              </Button>
            </Form>

            <div className="auth-footer text-center mt-5">
              <p className="text-secondary">
                Đã có tài khoản?{' '}
                <Link to="/login" className="auth-link">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default SignupPage;
