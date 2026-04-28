import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import MagneticButton from './MagneticButton';

const Hero = () => {
  const heroRef = useRef(null);
  const navigate = useNavigate();
  const [typedText, setTypedText] = useState("");
  const fullText = "Nghĩ gì ghi nấy...";

  useEffect(() => {
    let currentText = "";
    let i = 0;
    let typingInterval;

    const startTyping = () => {
      typingInterval = setInterval(() => {
        if (i < fullText.length) {
          currentText += fullText.charAt(i);
          setTypedText(currentText);
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, 100);
    };

    const timeout = setTimeout(startTyping, 1200);

    return () => {
      clearTimeout(timeout);
      clearInterval(typingInterval);
    };
  }, []);

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
      <style>{`
        .typing-cursor {
          display: inline-block;
          width: 3px;
          height: 1em;
          background-color: var(--bs-primary, currentColor);
          margin-left: 4px;
          animation: blink 1s step-start infinite;
          vertical-align: text-bottom;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>

      <h1 className="hero-title hero-element">
        Jot Down <br />
          {typedText}
          <span className="typing-cursor"></span>
        
      </h1>

      <p className="hero-subtitle mb-5 hero-element">
        Ghi chú an toàn, hoạt động ngoại tuyến cho những ý tưởng tuyệt vời của bạn. Bảo vệ mạnh mẽ, đồng bộ liền mạch trên mọi thiết bị.
      </p>

      <div className="hero-element">
        <MagneticButton className="rounded-pill px-5 py-3 fs-5" onClick={() => navigate('/login')}>
          Khám phá ngay
        </MagneticButton>
      </div>
    </section>
  );
};

export default Hero;
