import React, { useState, useRef } from 'react';
import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { Mail, Lock, User, Camera, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import '../styles/Auth.css';

const SignupPage = () => {
  const navigate = useNavigate();
  const [showPasswords, setShowPasswords] = useState({ password: false, confirmPassword: false });
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Ảnh đại diện không được vượt quá 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
    toast.success('Đã chọn ảnh đại diện!');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const fullName = form.fullName.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    // Validation
    if (!fullName) return toast.warning('Vui lòng nhập họ và tên');
    if (!email) return toast.warning('Vui lòng nhập email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.warning('Email không hợp lệ');
    if (!password) return toast.warning('Vui lòng nhập mật khẩu');
    if (password.length < 8) return toast.warning('Mật khẩu phải có ít nhất 8 ký tự');
    if (password !== confirmPassword) return toast.warning('Mật khẩu xác nhận không khớp');

    // Giả lập gọi API
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Đăng ký thành công! Vui lòng xác thực email.');
      navigate('/verify-otp');
    }, 1500);
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
            <h2>Ghi chú ngay cùng <span>JotDown</span> </h2>
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
              <div className="profile-image-circle" onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <User size={40} className="profile-placeholder-icon" />
                )}
                <div className="profile-image-overlay">
                  <Camera size={20} />
                </div>
              </div>
              <p className="profile-image-label">{avatarPreview ? 'Thay đổi' : 'Tải ảnh lên'}</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                hidden
              />
            </div>

            <Form className="auth-form" onSubmit={handleSubmit} noValidate>
              <Form.Group className="mb-4" controlId="fullName">
                <Form.Label>Họ và tên</Form.Label>
                <div className="input-wrapper">
                  <User className="input-icon" size={20} />
                  <Form.Control
                    type="text"
                    name="fullName"
                    placeholder="Ngô Xuân Quang"
                    disabled={loading}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4" controlId="email">
                <Form.Label>Email</Form.Label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={20} />
                  <Form.Control
                    type="text"
                    name="email"
                    placeholder="name@example.com"
                    disabled={loading}
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
                <Form.Label>Xác nhận mật khẩu</Form.Label>
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
                {loading ? <Spinner animation="border" size="sm" /> : 'Tạo tài khoản'}
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
