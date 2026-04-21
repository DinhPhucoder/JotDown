import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import BrandLogo from '../../components/BrandLogo';
import './Auth.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    window.setTimeout(() => {
      toast.success('Da dang nhap vao khong gian ghi chu demo');
      setLoading(false);
      navigate('/notes');
    }, 700);
  }

  return (
    <Container fluid className="p-0 auth-wrapper">
      <Link to="/" className="auth-logo" aria-label="Jot Down">
        <BrandLogo size={32} />
      </Link>

      <Row className="g-0 min-vh-100">
        <Col lg={6} className="d-none d-lg-flex auth-branding">
          <div className="branding-content">
            <h2>
              Jot <span>Down</span>
              <br />
              <span>Nghi gi</span> ghi nay...
            </h2>
            <p className="lead">
              Don gian hoa viec ghi chu, sap xep y tuong va quay lai dung viec dang lam chi trong vai giay.
            </p>
          </div>
        </Col>

        <Col lg={6} className="auth-form-container">
          <div className="auth-card">
            <div className="auth-header mb-5">
              <h1 className="fw-bold">Dang nhap</h1>
              <p className="text-secondary">Chao mung tro lai. Dang nhap de mo kho ghi chu cua ban.</p>
            </div>

            <Form className="auth-form" onSubmit={handleSubmit}>
              <Form.Group className="mb-4" controlId="email">
                <Form.Label>Email</Form.Label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={20} />
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4" controlId="password">
                <Form.Label>Mat khau</Form.Label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    tabIndex={-1}
                    onClick={() => setShowPassword((currentValue) => !currentValue)}
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </Form.Group>

              <div className="d-flex justify-content-end mb-4">
                <Link to="/forgot-password" className="auth-link text-decoration-none">
                  Quen mat khau?
                </Link>
              </div>

              <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Dang nhap'}
              </Button>
            </Form>

            <div className="auth-footer text-center mt-5">
              <p className="text-secondary">
                Chua co tai khoan?{' '}
                <Link to="/signup" className="auth-link">
                  Tao ngay
                </Link>
              </p>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
