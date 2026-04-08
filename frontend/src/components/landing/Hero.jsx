import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import MagneticButton from './MagneticButton';

const Hero = () => {
  const heroRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Staggered reveal animation
      gsap.from('.hero-element', {
        y: 100,
        opacity: 0,
        duration: 1.2,
        stagger: 0.2,
        ease: 'power4.out',
        delay: 0.2
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="container d-flex flex-column align-items-center justify-content-center text-center" style={{ minHeight: '80vh', paddingTop: '100px' }}>
      <h1 className="hero-title hero-element">
        Jot Down <br />Nghĩ gì ghi nấy 
      </h1>

      <p className="hero-subtitle mb-5 hero-element">
        Ghi chú an toàn, hoạt động ngoại tuyến cho những ý tưởng tuyệt vời của bạn. Bảo vệ mạnh mẽ, đồng bộ liền mạch trên mọi thiết bị.
      </p>

      <div className="hero-element">
        <MagneticButton className="rounded-pill px-5 py-3 fs-5">
          Khám phá ngay
        </MagneticButton>
      </div>
    </section>
  );
};

export default Hero;
