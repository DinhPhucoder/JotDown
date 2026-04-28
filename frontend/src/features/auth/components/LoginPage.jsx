import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { Mail, Lock, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/Auth.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value.trim();
    const password = form.password.value;

    // Validation
    if (!email) return toast.warning('Vui lòng nhập email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.warning('Email không hợp lệ');
    if (!password) return toast.warning('Vui lòng nhập mật khẩu');
    if (password.length < 8) return toast.warning('Mật khẩu phải có ít nhất 8 ký tự');

    // Giả lập gọi API
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Đăng nhập thành công!');
      navigate('/notes');
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
            <h2>Nơi mọi ý tưởng lớn <span>bắt đầu</span></h2>
           
          </div>
        </Col>

        <Col lg={5} className="auth-form-container">
          <div className="auth-card">
            <div className="auth-header mb-3">
              <h1 className="fw-bold">Chào mừng bạn</h1>
              <p className="text-secondary">Vui lòng nhập thông tin</p>
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
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3" controlId="password">
                <Form.Label>Mật khẩu</Form.Label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </Form.Group>

              <div className="d-flex justify-content-end mb-4">
                <Link to="/forgot-password" className="auth-link text-decoration-none">
                  Quên mật khẩu?
                </Link>
              </div>

              <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Đăng nhập'}
              </Button>
            </Form>

            <div className="auth-footer text-center mt-5">
              <p className="text-secondary">
                Chưa có tài khoản?{' '}
                <Link to="/signup" className="auth-link">
                  Tạo ngay
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
