import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import AppLogo from '../AppLogo';
import MagneticButton from './MagneticButton';

const Header = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();

  return (
    <header className="navbar navbar-expand-lg border-bottom bg-body">
      <div className="container">
        <div className="navbar-brand fw-bold d-flex align-items-center">
          <AppLogo to="/landing" size={45} />
        </div>
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-link text-body p-0 border-0"
            onClick={toggleTheme}
            aria-label="Chuyển đổi chế độ sáng/tối"
            title="Chuyển đổi chế độ sáng/tối"
          >
            {theme === 'dark' ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )}
          </button>
          <MagneticButton className="btn btn-primary p-3 fw-medium" onClick={() => navigate('/login')}>
            Đăng nhập
          </MagneticButton>
        </div>
      </div>
    </header>
  );
};

export default Header;
