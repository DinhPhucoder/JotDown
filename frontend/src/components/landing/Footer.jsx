import React from 'react';

const Footer = () => {
  return (
    <footer className="py-4 mt-auto border-top bg-body">
      <div className="container text-center text-muted">
        <small>&copy; {new Date().getFullYear()} Jot Down. Tất cả quyền được bảo lưu</small>
      </div>
    </footer>
  );
};

export default Footer;
