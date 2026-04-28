import { Link } from 'react-router-dom';

function AppLogo({ to = '/landing', size = 40, className = '' }) {
  return (
    <Link to={to} className={`app-logo ${className}`.trim()} style={{ textDecoration: 'none' }}>
      <img
        src="/Logo_JotDown.png"
        alt="JotDown"
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: '8px' }}
      />
      <span className="app-logo__name">JotDown</span>
    </Link>
  );
}

export default AppLogo;
