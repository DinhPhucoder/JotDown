import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWifi, faShieldHalved, faUsersViewfinder } from '@fortawesome/free-solid-svg-icons';

gsap.registerPlugin(ScrollTrigger);

const featuresData = [
  {
    title: 'Hoạt động không kết nối',
    description: 'Tiếp tục ghi chú ngay cả khi mất kết nối. Dữ liệu của bạn tự động đồng bộ với máy chủ khi quay lại trực tuyến.',
    icon: faWifi
  },
  {
    title: 'Bảo mật chặt chẽ',
    description: 'Gán mật khẩu mạnh cho những ghi chú nhạy cảm. Mã hóa đảm bảo rằng dữ liệu của bạn luôn được bảo vệ.',
    icon: faShieldHalved
  },
  {
    title: 'Cộng tác thời gian thực',
    description: 'Chia sẻ ý tưởng với đồng nghiệp hoặc bạn bè. Đồng bộ trực tiếp mà không cần làm mới.',
    icon: faUsersViewfinder
  }
];

const Features = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.feature-card', {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="container py-5 my-5 features-section">
      <div className="text-center mb-5">
        <h2 className="mb-3 hero-title" style={{ fontSize: '3rem' }}>Jot Down có gì?</h2>
        <p className="text-secondary fs-5" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Không chỉ là một ứng dụng ghi chú thông thường. Một công cụ năng suất hoàn chỉnh được thiết kế cho quy trình làm việc hiện đại.
        </p>
      </div>

      <div className="row g-4 mt-4">
        {featuresData.map((feature, idx) => (
          <div key={idx} className="col-lg-4 col-md-6 feature-card">
            <div className="card panel-dark h-100 p-5 text-center border-0">
              <div className="d-flex justify-content-center align-items-center rounded-circle bg-primary text-white mx-auto mb-4"
                style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                <FontAwesomeIcon icon={feature.icon} />
              </div>
              <h3 className="h4 feature-title mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>{feature.title}</h3>
              <p className="feature-text mb-0 px-2">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
