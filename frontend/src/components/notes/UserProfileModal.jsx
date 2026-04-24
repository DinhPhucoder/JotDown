import { useState } from 'react';
import { Modal, Button, Form, Tab, Row, Col, Nav } from 'react-bootstrap';
import { User, Mail, PaintBucket, Shield, Globe, Camera } from 'lucide-react';
import './UserProfileModal.css';

function UserProfileModal({ open, onClose }) {
    const [activeTab, setActiveTab] = useState('profile');
    const [theme, setTheme] = useState('light');

    // Giả lập trạng thái tạm thời cho các input
    const [formData, setFormData] = useState({
        displayName: 'Thomas Muller',
        email: 'thomas.muller@fcbayern.com',
        bio: '',
        language: 'vi'
    });

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Modal show={open} onHide={onClose} size="lg" centered className="profile-modal">
            <Modal.Header closeButton className="border-bottom">
                <Modal.Title className="h5 fw-bold">Cài đặt tài khoản</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
                <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                    <Row className="g-0 h-100">
                        {/* Sidebar (Menus bên trái) */}
                        <Col sm={4} md={3} className="border-end profile-sidebar bg-light p-3">
                            <Nav variant="pills" className="flex-column profile-nav">
                                <Nav.Item>
                                    <Nav.Link eventKey="profile" className="d-flex align-items-center gap-2 mb-2">
                                        <User size={18} />
                                        Cá nhân
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="settings" className="d-flex align-items-center gap-2 mb-2">
                                        <PaintBucket size={18} />
                                        Tuỳ chỉnh
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="security" className="d-flex align-items-center gap-2">
                                        <Shield size={18} />
                                        Bảo mật
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </Col>

                        {/* Vùng nội dung bên phải */}
                        <Col sm={8} md={9} className="p-4">
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

                                        <Form.Group className="mb-4">
                                            <Form.Label className="small fw-semibold">Tiểu sử</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleFormChange}
                                                placeholder="Giới thiệu nhanh về bạn..."
                                            />
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

                                    <div className="p-3 border rounded-3">
                                        <div className="d-flex align-items-center gap-2 mb-3">
                                            <Globe size={18} />
                                            <h6 className="mb-0 fw-semibold">Ngôn ngữ</h6>
                                        </div>
                                        <p className="text-secondary small mb-3">Tuỳ chỉnh ngôn ngữ cho các chức năng trong app.</p>
                                        <Form.Select
                                            name="language"
                                            value={formData.language}
                                            onChange={handleFormChange}
                                        >
                                            <option value="vi">Tiếng Việt (Việt Nam)</option>
                                            <option value="en">English (US)</option>
                                        </Form.Select>
                                    </div>
                                </Tab.Pane>

                                {/* ---- Tab: Bảo mật ---- */}
                                <Tab.Pane eventKey="security">
                                    <h6 className="fw-bold mb-4">Bảo mật & Đăng nhập</h6>
                                    <div className="p-3 border rounded-3 mb-4">
                                        <h6 className="mb-2 fw-semibold">Thay đổi mật khẩu</h6>
                                        <p className="text-secondary small mb-3">
                                            Nên sử dụng mật khẩu mạnh mà bạn chưa sử dụng ở đâu khác, có trên 8 ký tự.
                                        </p>
                                        <Button variant="outline-primary" size="sm">Tiến hành Đổi mật khẩu</Button>
                                    </div>

                                    {/* Không gian mở rộng tính năng bảo mật sau này */}
                                </Tab.Pane>
                            </Tab.Content>
                        </Col>
                    </Row>
                </Tab.Container>
            </Modal.Body>
        </Modal>
    );
}

export default UserProfileModal;
