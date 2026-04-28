import React, { useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const OtpVerificationPage = () => {
  const navigate = useNavigate();
  // Khởi tạo state cho 6 ô OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Chỉ lấy 1 ký tự
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Tự động focus sang ô kế tiếp nếu nhập xong
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Xoá lùi và focus về ô trước đó
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    console.log('Verifying OTP:', otpValue);
    // TODO: Bổ sung logic API
    // Giả sử thành công:
    // navigate('/login');
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
            <div className="otp-verification-step">
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

              <Form onSubmit={handleSubmit}>
                <div className="d-flex justify-content-between mb-4 gap-2">
                  {otp.map((digit, index) => (
                    <Form.Control
                      key={index}
                      id={`otp-input-${index}`}
                      className="text-center fw-bold"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      style={{ width: '48px', height: '56px', fontSize: '1.25rem' }}
                    />
                  ))}
                </div>

                <Button variant="primary" type="submit" className="w-100 mb-4">
                  Xác thực & Hoàn tất
                </Button>
              </Form>

              <div className="text-center mb-4">
                <span className="text-secondary">Chưa nhận được mã? </span>
                <button className="btn btn-link p-0 text-decoration-none fw-semibold">
                  Gửi lại mã
                </button>
              </div>

              <div className="text-center">
                <button onClick={() => navigate(-1)} className="btn btn-link p-0 text-decoration-none text-secondary d-inline-flex align-items-center gap-2">
                  <ArrowLeft size={16} /> Quay lại
                </button>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default OtpVerificationPage;
