import { useState } from 'react';
import { Modal, Button, Form, Tab, Row, Col, Nav } from 'react-bootstrap';
import { User, Mail, PaintBucket, Shield, Globe, Camera, BookText, Lock, Eye, EyeOff, Menu, X } from 'lucide-react';
import './UserProfileModal.css';

function UserProfileModal({ open, onClose }) {
    const [activeTab, setActiveTab] = useState('profile');
    const [theme, setTheme] = useState('light');

    const [formData, setFormData] = useState({
        displayName: 'Thomas Muller',
        email: 'thomas.muller@fcbayern.com',
        bio: '',
        language: 'vi'
    });

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [showMobileNav, setShowMobileNav] = useState(false);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const submitPasswordChange = (e) => {
        e.preventDefault();
        // TODO: Xác thực và gửi yêu cầu đổi mật khẩu tới Server
        console.log('Change password payload:', passwordData);
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswords({ current: false, new: false, confirm: false });
    };

    const handleClosePasswordChange = () => {
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswords({ current: false, new: false, confirm: false });
    };

    const handleModalClose = () => {
        onClose();
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswords({ current: false, new: false, confirm: false });
        setShowMobileNav(false);
    };

    const renderNavItems = () => (
        <Nav variant="pills" className="flex-column profile-nav">
            <Nav.Item>
                <Nav.Link
                    eventKey="profile"
                    className="d-flex align-items-center gap-2 mb-2"
                    onClick={() => setShowMobileNav(false)}
                >
                    <User size={18} />
                    Cá nhân
                </Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link
                    eventKey="settings"
                    className="d-flex align-items-center gap-2 mb-2"
                    onClick={() => setShowMobileNav(false)}
                >
                    <PaintBucket size={18} />
                    Tuỳ chỉnh
                </Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link
                    eventKey="security"
                    className="d-flex align-items-center gap-2"
                    onClick={() => setShowMobileNav(false)}
                >
                    <Shield size={18} />
                    Bảo mật
                </Nav.Link>
            </Nav.Item>
        </Nav>
    );

    return (
        <Modal show={open} onHide={handleModalClose} size="lg" centered className="profile-modal">
            <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Modal.Header closeButton className="border-bottom">
                    <div className="d-flex align-items-center gap-2">
                        <button
                            type="button"
                            className="btn btn-sm btn-light d-sm-none profile-hamburger-btn"
                            onClick={() => setShowMobileNav(true)}
                        >
                            <Menu size={18} />
                        </button>
                        <Modal.Title className="h5 fw-bold mb-0">Cài đặt tài khoản</Modal.Title>
                    </div>
                </Modal.Header>

                <Modal.Body className="p-0">
                    {/* Panel sidebar mobile nằm BÊN TRONG Modal.Body */}
                    {showMobileNav && (
                        <div className="profile-mobile-overlay d-sm-none" onClick={() => setShowMobileNav(false)}>
                            <div className="profile-mobile-panel" onClick={(e) => e.stopPropagation()}>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <span className="h6 fw-bold mb-0">Danh mục</span>
                                    <button type="button" className="btn btn-sm btn-light" onClick={() => setShowMobileNav(false)}>
                                        <X size={16} />
                                    </button>
                                </div>
                                {renderNavItems()}
                            </div>
                        </div>
                    )}

                    <Row className="g-0 h-100">
                        <Col sm={4} md={3} className="border-end profile-sidebar bg-light p-3 d-none d-sm-block">
                            {renderNavItems()}
                        </Col>

                        <Col xs={12} sm={8} md={9} className="p-4 profile-content">
                            <Tab.Content>
                                {/* ---- Tab: Thông tin cá nhân ---- */}
                                <Tab.Pane eventKey="profile">
                                    <h6 className="fw-bold mb-4">Thông tin Hồ sơ</h6>

                                    <div className="d-flex align-items-center gap-4 mb-4">
                                        <div className="position-relative">
                                            <div className="profile-avatar">
                                                {formData.displayName.charAt(0).toUpperCase()}
                                            </div>
                                            <button type="button" className="btn btn-light position-absolute bottom-0 end-0 rounded-circle shadow-sm profile-camera-btn">
                                                <Camera size={14} />
                                            </button>
                                        </div>
                                        <div>
                                            <h5 className="mb-1 fw-semibold">{formData.displayName}</h5>
                                            <p className="text-secondary mb-0 small">Cập nhật ảnh đại diện và chi tiết của bạn</p>
                                        </div>
                                    </div>

                                    <Form>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-semibold">Họ và tên</Form.Label>
                                            <div className="position-relative">
                                                <span className="position-absolute text-secondary" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
                                                    <User size={18} />
                                                </span>
                                                <Form.Control
                                                    type="text"
                                                    name="displayName"
                                                    value={formData.displayName}
                                                    onChange={handleFormChange}
                                                    style={{ paddingLeft: '40px' }}
                                                />
                                            </div>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-semibold">Địa chỉ Email</Form.Label>
                                            <div className="position-relative">
                                                <span className="position-absolute text-secondary" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
                                                    <Mail size={18} />
                                                </span>
                                                <Form.Control
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    style={{ paddingLeft: '40px' }}
                                                    disabled
                                                    readOnly
                                                    className="bg-light"
                                                />
                                            </div>
                                            <Form.Text className="text-muted small">
                                                Email dùng cho đăng nhập nên không thể thay đổi.
                                            </Form.Text>
                                        </Form.Group>

                                        <div className="d-flex justify-content-end">
                                            <Button variant="primary">Lưu hồ sơ</Button>
                                        </div>
                                    </Form>
                                </Tab.Pane>

                                {/* ---- Tab: Tuỳ chỉnh ---- */}
                                <Tab.Pane eventKey="settings">
                                    <h6 className="fw-bold mb-4">Giao diện & Trải nghiệm</h6>

                                    <div className="d-flex align-items-center justify-content-between mb-4 p-3 border rounded-3">
                                        <div>
                                            <h6 className="mb-1 fw-semibold">Giao diện hiển thị</h6>
                                            <p className="text-secondary mb-0 small">Bật chế độ tối sẽ làm dịu mắt hơn.</p>
                                        </div>
                                        <div className="form-check form-switch fs-5">
                                            <input
                                                className="form-check-input cursor-pointer"
                                                type="checkbox"
                                                role="switch"
                                                id="theme-switch"
                                                checked={theme === 'dark'}
                                                onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                                            />
                                        </div>
                                    </div>
                                </Tab.Pane>

                                {/* ---- Tab: Bảo mật ---- */}
                                <Tab.Pane eventKey="security">
                                    <h6 className="fw-bold mb-4">Bảo mật & Đăng nhập</h6>

                                    {!isChangingPassword ? (
                                        <div className="p-3 border rounded-3 mb-4">
                                            <h6 className="mb-2 fw-semibold">Thay đổi mật khẩu</h6>
                                            <p className="text-secondary small mb-3">
                                                Nên sử dụng mật khẩu mạnh mà bạn chưa sử dụng ở đâu khác, có trên 8 ký tự.
                                            </p>
                                            <Button variant="outline-primary" size="sm" onClick={() => setIsChangingPassword(true)}>
                                                Tiến hành Đổi mật khẩu
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="p-3 border rounded-3 mb-4">
                                            <h6 className="mb-3 fw-semibold text-primary">Cập nhật mật khẩu mới</h6>
                                            <Form onSubmit={submitPasswordChange}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="small fw-semibold">Mật khẩu hiện tại</Form.Label>
                                                    <div className="position-relative">
                                                        <span className="position-absolute text-secondary" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
                                                            <Lock size={18} />
                                                        </span>
                                                        <Form.Control
                                                            type={showPasswords.current ? "text" : "password"}
                                                            name="currentPassword"
                                                            value={passwordData.currentPassword}
                                                            onChange={handlePasswordChange}
                                                            placeholder="Nhập mật khẩu hiện tại"
                                                            style={{ paddingLeft: '40px', paddingRight: '40px' }}
                                                            required
                                                        />
                                                        <span
                                                            className="position-absolute text-secondary"
                                                            style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, cursor: 'pointer' }}
                                                            onClick={() => togglePasswordVisibility('current')}
                                                        >
                                                            {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </span>
                                                    </div>
                                                </Form.Group>

                                                <Form.Group className="mb-3">
                                                    <Form.Label className="small fw-semibold">Mật khẩu mới</Form.Label>
                                                    <div className="position-relative">
                                                        <span className="position-absolute text-secondary" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
                                                            <Lock size={18} />
                                                        </span>
                                                        <Form.Control
                                                            type={showPasswords.new ? "text" : "password"}
                                                            name="newPassword"
                                                            value={passwordData.newPassword}
                                                            onChange={handlePasswordChange}
                                                            placeholder="Nhập mật khẩu mới"
                                                            style={{ paddingLeft: '40px', paddingRight: '40px' }}
                                                            required
                                                        />
                                                        <span
                                                            className="position-absolute text-secondary"
                                                            style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, cursor: 'pointer' }}
                                                            onClick={() => togglePasswordVisibility('new')}
                                                        >
                                                            {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </span>
                                                    </div>
                                                </Form.Group>

                                                <Form.Group className="mb-4">
                                                    <Form.Label className="small fw-semibold">Xác nhận mật khẩu mới</Form.Label>
                                                    <div className="position-relative">
                                                        <span className="position-absolute text-secondary" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
                                                            <Lock size={18} />
                                                        </span>
                                                        <Form.Control
                                                            type={showPasswords.confirm ? "text" : "password"}
                                                            name="confirmPassword"
                                                            value={passwordData.confirmPassword}
                                                            onChange={handlePasswordChange}
                                                            placeholder="Nhập lại mật khẩu mới"
                                                            style={{ paddingLeft: '40px', paddingRight: '40px' }}
                                                            required
                                                        />
                                                        <span
                                                            className="position-absolute text-secondary"
                                                            style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, cursor: 'pointer' }}
                                                            onClick={() => togglePasswordVisibility('confirm')}
                                                        >
                                                            {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </span>
                                                    </div>
                                                </Form.Group>

                                                <div className="d-flex gap-2">
                                                    <Button variant="primary" type="submit" size="sm">Lưu mật khẩu</Button>
                                                    <Button variant="outline-secondary" size="sm" onClick={handleClosePasswordChange}>Hủy</Button>
                                                </div>
                                            </Form>
                                        </div>
                                    )}

                                    {/* Không gian mở rộng tính năng bảo mật sau này */}
                                </Tab.Pane>
                            </Tab.Content>
                        </Col>
                    </Row>
                </Modal.Body>
            </Tab.Container>
        </Modal>
    );
}

export default UserProfileModal;
