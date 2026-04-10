import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faShareAlt, faThumbtack } from '@fortawesome/free-solid-svg-icons';

gsap.registerPlugin(ScrollTrigger);

const MockNotesPreview = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stable entrance animation
      gsap.fromTo('.mock-note-card',
        { y: 60, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
          }
        }
      );

      // Smooth and stable floating animation
      gsap.to('.mock-note-card', {
        y: -12,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.3,
        delay: 1.2
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="container position-relative pb-5 mock-notes-section" style={{ marginTop: '50px', zIndex: 0 }}>
      <div className="row justify-content-center g-4">
        {/* Pinned Note */}
        <div className="col-md-4 col-sm-6">
          <div className="card panel-dark border-0 h-100 p-4 mock-note-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="badge bg-primary text-white rounded-pill px-3 py-2">
                <FontAwesomeIcon icon={faThumbtack} className="me-2" />
                Ghim
              </span>
              <small className="meta-muted">Vừa xong</small>
            </div>
            <h4 className="note-title mb-3" style={{ fontFamily: "'Google Sans Flex', sans-serif" }}>Lộ trình dự án 2026</h4>
            <p className="note-text mb-0">Mục tiêu cấp cao cho ứng dụng Jot Down. Chúng tôi cần tập trung vào khả năng hoạt động ngoại tuyến...</p>
          </div>
        </div>

        {/* Locked Note */}
        <div className="col-md-4 col-sm-6">
          <div className="card panel-dark border-0 h-100 p-4 mock-note-card" style={{ marginTop: '30px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="badge bg-danger text-white rounded-pill px-3 py-2">
                <FontAwesomeIcon icon={faLock} className="me-2" />
                Khóa
              </span>
              <small className="meta-muted">2 giờ trước</small>
            </div>
            <h4 className="note-title mb-3" style={{ fontFamily: "'Google Sans Flex', sans-serif" }}>Tài khoản ngân hàng</h4>
            <p className="note-text mb-0">
              <span style={{ filter: 'blur(4px)' }}>Chi tiết tài khoản: xxx-xxx-xxxx. Mã PIN của kho tiền là 8492.</span>
            </p>
          </div>
        </div>

        {/* Shared Note */}
        <div className="col-md-4 col-sm-6">
          <div className="card panel-dark border-0 h-100 p-4 mock-note-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="badge bg-info text-dark rounded-pill px-3 py-2">
                <FontAwesomeIcon icon={faShareAlt} className="me-2" />
                Chia sẻ với đội
              </span>
              <small className="meta-muted">Hôm qua</small>
            </div>
            <h4 className="note-title mb-3" style={{ fontFamily: "'Google Sans Flex', sans-serif" }}>Spec hệ thống thiết kế</h4>
            <p className="note-text mb-0">Sử dụng kiểu chữ cường điệu. Đảm bảo gradient deep sea được triển khai đúng cách...</p>

            <div className="mt-4 pt-3 border-top border-secondary d-flex align-items-center gap-2">
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', fontSize: '12px' }}>PD</div>
              <div className="rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', fontSize: '12px', marginLeft: '-10px', zIndex: 1 }}>KH</div>
              <small className="note-text ms-2">Đang chỉnh sửa...</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MockNotesPreview;
