import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import './Auth.css';

const LoginPage = () => {
  return (
    <Container fluid className="p-0 auth-wrapper">
      {/* Logo và brand name */}
      <Link to="/landing" className="auth-logo">
        <img src="/Logo_JotDown.png" alt="JotDown" />
        <span className="brand-name">
          <span className="brand-jot">Jot</span>
          <span className="brand-down">Down</span>
        </span>
      </Link>

      <Row className="g-0 min-vh-100">
        <Col lg={6} className="d-none d-lg-flex auth-branding">
          <div className="branding-content">
            <h2> Jot <span>Down</span> <br /> <span>Nghĩ gì</span> ghi nấy...</h2>
            <p className="lead">Đừng để những suy nghĩ vụt mất. Ghi chép nhanh chóng, đồng bộ an toàn và quản lý tri thức của bạn một cách khoa học nhất.</p>
          </div>
        </Col>

        <Col lg={6} className="auth-form-container">
          <div className="auth-card">
            <div className="auth-header mb-5">
              <h1 className="fw-bold">Đăng nhập</h1>
              <p className="text-secondary">Chào mừng trở lại! Vui lòng nhập thông tin của bạn</p>
            </div>

            <Form className="auth-form">
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
                    type="password"
                    name="password"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    tabIndex={-1}
                  >
                    < EyeOff size={18} />
                  </button>
                </div>
              </Form.Group>

              <div className="d-flex justify-content-end mb-4">
                <Link to="/forgot-password" className="auth-link text-decoration-none">
                  Quên mật khẩu?
                </Link>
              </div>

              <Button variant="primary" type="submit" className="w-100">
                Đăng nhập
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
