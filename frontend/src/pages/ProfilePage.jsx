import React, { useState } from 'react';
import './ProfilePage.css';

const menuItems = [
  { label: 'Tài Khoản Của Tôi' },
  { label: 'Dữ Liệu & Bảo Mật' },
  { label: 'Nội Dung & Cộng Đồng' },
  { label: 'Các Thông Báo' },
  { label: 'Thiết bị' },
  { label: 'Kết Nối' },
];

const ProfilePage = () => {
  const [displayName, setDisplayName] = useState('Quang');
  const [bio, setBio] = useState('');
  const avatar = 'favicon.svg';

  return (
    <div className="profile-page-container">
      {/* Sidebar menu */}
      <aside className="profile-sidebar">
        <div style={{ marginBottom: 32 }}>
          <img src={avatar} alt="avatar" className="avatar" />
          <div className="username">Quang</div>
          <button className="edit-btn">Chỉnh sửa hồ sơ</button>
        </div>
        <input type="text" placeholder="Tìm kiếm" className="search" />
        <nav>
          {menuItems.map((item, idx) => (
            <div key={idx} className="menu-item">
              {item.label}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main profile content */}
      <main className="profile-main">
        <div className="profile-title">Hồ sơ</div>
        <div className="profile-content">
          {/* Form profile */}
          <section className="profile-form-section">
            <div className="profile-form-card">
              <div className="form-title">Hồ Sơ Chính</div>
              <form>
                <div style={{ marginBottom: 18 }}>
                  <label>Tên hiển thị</label>
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label>Biệt danh</label>
                  <input type="text" placeholder="Thêm biệt danh của bạn" />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label>Tiểu sử</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Giới thiệu về bạn..." />
                </div>
                <button type="submit" className="save-btn">Lưu thay đổi</button>
              </form>
            </div>
          </section>
          {/* Preview profile */}
          <section className="profile-preview-section">
            <div className="profile-preview-card">
              <div className="preview-title">Xem trước</div>
              <div className="preview-banner">
                <img src={avatar} alt="avatar" />
              </div>
              <div className="preview-name">{displayName}</div>
              <div className="preview-id">Quang da Vinci</div>
              <button className="example-btn">Lưu</button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
