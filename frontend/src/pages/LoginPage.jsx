import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { Toaster, toast } from 'sonner';
import bgLogin from '../assets/bg_login.jpg';
import './LoginPage.css';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.warning('Vui lòng nhập email');
            return;
        }
        if (!password.trim()) {
            toast.warning('Vui lòng nhập mật khẩu');
            return;
        }

        // TODO: Gọi API đăng nhập
        console.log('Login:', { email, password, remember });
    };

    return (
        <div className="login-page" style={{ backgroundImage: `url(${bgLogin})` }}>
            <Toaster position="bottom-right" richColors />
            <div className="login-overlay" />

            {/* Logo Góc Trên Bên Trái */}
            <div className="login-logo-container">
                <img src="/logo.png" alt="Note Management Logo" className="login-logo-img" />
                <div className="login-logo-text">
                    <span className="text-1st">Jot</span>
                    <span className="text-2nd">Down</span>
                </div>
            </div>

            <div className="login-card">
                <h2 className="login-card__title">Đăng nhập</h2>

                <form onSubmit={handleSubmit} noValidate className="login-form">
                    {/* Email */}
                    <div className="login-field">
                        <label htmlFor="login-email" className="login-field__label">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            className="login-field__input"
                            placeholder="balamia@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {/* Password */}
                    <div className="login-field">
                        <label htmlFor="login-password" className="login-field__label">Mật khẩu</label>
                        <div className="login-field__password-wrap">
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                className="login-field__input"
                                placeholder="Nhập mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="login-field__eye"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label="Toggle password"
                            >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                            </button>
                        </div>
                    </div>

                    {/* Remember me + Forgot password */}
                    <div className="login-options">
                        <label className="login-options__remember">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                            />
                            <span>Ghi nhớ đăng nhập</span>
                        </label>
                        <a href="#" className="login-options__forgot">Quên mật khẩu?</a>
                    </div>

                    {/* Nút đăng nhập */}
                    <button type="submit" className="login-btn">Đăng nhập</button>
                </form>

                <p className="login-card__footer">
                    Bạn chưa có tài khoản? <a href="#" className="login-card__signup">Đăng ký</a>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
