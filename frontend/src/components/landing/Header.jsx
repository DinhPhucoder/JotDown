import React from 'react';
import MagneticButton from './MagneticButton';

const Header = ({ theme, toggleTheme }) => {
  return (
    <header className="navbar navbar-expand-lg border-bottom bg-body">
      <div className="container">
        <a className="navbar-brand fw-bold d-flex align-items-center" href="#">
        <i class="fa-solid fa-pen-nib"></i> <span className="ps-2">Jot Down</span>
        </a>
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-link text-body p-0 border-0"
            onClick={toggleTheme}
            aria-label="Chuyển đổi chế độ sáng/tối"
            title="Chuyển đổi chế độ sáng/tối"
          >
            {theme === 'dark' ? (
              <i className="fa-regular fa-sun fs-5"></i>
            ) : (
              <i className="fa-regular fa-moon fs-5"></i>
            )}
          </button>
          <MagneticButton className="btn btn-primary p-3 fw-medium">
            Đăng nhập
          </MagneticButton>
        </div>
      </div>
    </header>
  );
};

export default Header;
