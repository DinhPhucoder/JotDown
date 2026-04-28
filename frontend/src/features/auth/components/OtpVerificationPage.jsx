import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import '../styles/Auth.css';

const OtpVerificationPage = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Đếm ngược 60s
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = () => {
    setCanResend(false);
    setCountdown(60);
    toast.success('Đã gửi lại mã xác thực!');
  };

  const handleOtpChange = (index, value) => {
    // Chỉ cho phép nhập số
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Delay focus để React kịp render giá trị
    if (value && index < 5) {
      setTimeout(() => {
        const nextInput = document.getElementById(`otp-input-${index + 1}`);
        if (nextInput) nextInput.focus();
      }, 0);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpValue = otp.join('');

    if (otpValue.length < 6) return toast.warning('Vui lòng nhập đủ 6 chữ số');
    if (!/^\d{6}$/.test(otpValue)) return toast.warning('Mã OTP chỉ chứa chữ số');

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Xác thực thành công!');
      navigate('/login');
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
            <div className="otp-header text-center mb-5">
              <div className="otp-icon-wrapper d-inline-flex justify-content-center align-items-center mb-3" style={{
                width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bs-primary-bg-subtle)'
              }}>
                <ShieldCheck size={32} className="text-primary" />
              </div>
              <h2 className="fw-bold mb-3">Xác thực Email</h2>
              <p className="text-secondary">
                Chúng tôi đã gửi mã 6 chữ số đến <br />
                <strong className="text-body mt-1 d-inline-block">name@example.com</strong>
              </p>
            </div>

            <Form onSubmit={handleSubmit} noValidate>
              <div className="d-flex justify-content-between mb-4 gap-2">
                {otp.map((digit, index) => (
                  <Form.Control
                    key={index}
                    id={`otp-input-${index}`}
                    className="otp-field form-control text-center fw-bold"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={loading}
                    autoComplete="off"
                  />
                ))}
              </div>

              <Button variant="primary" type="submit" className="w-100 mb-4" disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Xác thực & Hoàn tất'}
              </Button>
            </Form>

            <div className="text-center mb-4">
              {canResend ? (
                <>
                  <span className="text-secondary">Chưa nhận được mã? </span>
                  <button className="btn btn-link p-0 text-decoration-none fw-semibold" onClick={handleResend}>
                    Gửi lại mã
                  </button>
                </>
              ) : (
                <span className="text-secondary">Gửi lại mã sau <strong className="text-primary">{countdown}s</strong></span>
              )}
            </div>

            <div className="text-center">
              <button onClick={() => navigate(-1)} className="btn btn-link p-0 text-decoration-none text-secondary d-inline-flex align-items-center gap-2">
                <ArrowLeft size={16} /> Quay lại
              </button>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default OtpVerificationPage;
