import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { Mail, Lock, User, Camera, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import BrandLogo from '../../components/BrandLogo';
import './Auth.css';

const SignupPage = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Mat khau xac nhan chua khop');
      return;
    }

    setLoading(true);

    window.setTimeout(() => {
      toast.success(`Chao mung ${fullName || 'ban'} den voi Jot Down`);
      setLoading(false);
      navigate('/notes');
    }, 800);
  }

  return (
    <Container fluid className="p-0 auth-wrapper">
      <Link to="/" className="auth-logo" aria-label="Jot Down">
        <BrandLogo size={30} />
      </Link>

      <Row className="g-0 min-vh-100">
        <Col lg={6} className="d-none d-lg-flex auth-branding">
          <div className="branding-content">
            <h2>
              Jot <span>Down</span>
              <br />
              <span>Nghi gi</span> ghi nay...
            </h2>
            <p className="lead">Bat dau khong gian ghi chu rieng, gon gon va san sang cho moi y tuong ban muon giu lai.</p>
          </div>
        </Col>

        <Col lg={6} className="auth-form-container">
          <div className="auth-card">
            <div className="auth-header mb-4">
              <h1 className="fw-bold">Dang ky</h1>
              <p className="text-secondary">Tao tai khoan de mo note workspace ca nhan cua ban.</p>
            </div>

            <div className="profile-image-picker mb-4">
              <div className="profile-image-circle">
                <User size={40} className="profile-placeholder-icon" />
                <div className="profile-image-overlay">
                  <Camera size={20} />
                </div>
              </div>
              <p className="profile-image-label">Tai anh len sau</p>
            </div>

            <Form className="auth-form" onSubmit={handleSubmit}>
              <Form.Group className="mb-4" controlId="fullName">
                <Form.Label>Ho va ten</Form.Label>
                <div className="input-wrapper">
                  <User className="input-icon" size={20} />
                  <Form.Control
                    type="text"
                    name="fullName"
                    placeholder="Ngo Xuan Quang"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
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

              <Form.Group className="mb-4" controlId="confirmPassword">
                <Form.Label>Xac nhan mat khau</Form.Label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <Form.Control
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword((currentValue) => !currentValue)}
                  >
                    {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </Form.Group>

              <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Tao tai khoan'}
              </Button>
            </Form>

            <div className="auth-footer text-center mt-5">
              <p className="text-secondary">
                Da co tai khoan?{' '}
                <Link to="/login" className="auth-link">
                  Dang nhap
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
