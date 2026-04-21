import './BrandLogo.css';

function BrandLogo({ size = 30, showName = true, className = '' }) {
  return (
    <span className={`jd-brand ${className}`.trim()} style={{ '--jd-brand-size': `${size}px` }}>
      <img className="jd-brand__img jd-brand__img--dark" src="/LogoDark.png" alt="JotDown" />
      <img className="jd-brand__img jd-brand__img--light" src="/LogoLight.png" alt="JotDown" />
      {showName ? (
        <span className="jd-brand__name" aria-label="Jot Down">
          <span className="jd-brand__name-strong">Jot</span> Down
        </span>
      ) : null}
    </span>
  );
}

export default BrandLogo;
