import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { Mail, Lock, User, Camera, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/Auth.css';

const SignupPage = () => {
  return (
    <Container fluid className="p-0 auth-wrapper">
      <Link to="/landing" className="auth-logo">
        <img src="/Logo_JotDown.png" alt="JotDown" />
        <span className="brand-name">
          <span className="brand-jot">Jot</span>
          <span className="brand-down">Down</span>
        </span>
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
            </div>

            <div className="profile-image-picker mb-2">
              <div className="profile-image-circle">
                <User size={35} className="profile-placeholder-icon" />
                <div className="profile-image-overlay">
                  <Camera size={20} />
                </div>
              </div>
              <p className="profile-image-label">Tải ảnh lên</p>
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden />
            </div>

            <Form className="auth-form">
              <Form.Group className="mb-2" controlId="fullName">
                <Form.Label>Họ và tên</Form.Label>
                <div className="input-wrapper">
                  <User className="input-icon" size={20} />
                  <Form.Control type="text" name="fullName" placeholder="Ngô Xuân Quang" />
                </div>
              </Form.Group>

              <Form.Group className="mb-2" controlId="email">
                <Form.Label>Email</Form.Label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={20} />
                  <Form.Control type="email" name="email" placeholder="name@example.com" />
                </div>
              </Form.Group>

              <Form.Group className="mb-2" controlId="password">
                <Form.Label>Mật khẩu</Form.Label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <Form.Control type="password" name="password" placeholder="••••••••" />
                  <button type="button" className="password-toggle-btn" tabIndex={-1}>
                    <EyeOff size={18} />
                  </button>
                </div>
              </Form.Group>

              <Form.Group className="mb-3" controlId="confirmPassword">
                <Form.Label>Xác nhận mật khẩu</Form.Label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <Form.Control type="password" name="confirmPassword" placeholder="••••••••" />
                  <button type="button" className="password-toggle-btn" tabIndex={-1}>
                    <EyeOff size={18} />
                  </button>
                </div>
              </Form.Group>

              <Button variant="primary" type="button" className="w-100">
                Tạo tài khoản
              </Button>
            </Form>

            <div className="auth-footer text-center mt-4">
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
