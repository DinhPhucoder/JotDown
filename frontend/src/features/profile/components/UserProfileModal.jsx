import { useState, useRef } from 'react';
import { Modal, Button, Form, Tab, Row, Col, Nav, Spinner } from 'react-bootstrap';
import { User, Mail, PaintBucket, Shield, Camera, Lock, Eye, EyeOff, X, Type } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { noteColorOptions } from '../../../data/constants';
import { updateProfile, uploadAvatar, changePassword as changePasswordApi } from '../../auth/services/authService';
import { toast } from 'sonner';
import './UserProfileModal.css';

const noteFontSizeOptions = [
    { value: 'small', label: 'Nhỏ', preview: 'A-' },
    { value: 'medium', label: 'Trung bình', preview: 'A' },
    { value: 'large', label: 'Lớn', preview: 'A+' },
];

function UserProfileModal({ open, onClose, theme, onToggleTheme, preferences, onUpdatePreferences, user, onUserUpdate }) {
    const [activeTab, setActiveTab] = useState('profile');
    const fileInputRef = useRef(null);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const selectedFontSize = noteFontSizeOptions.some((option) => option.value === preferences?.fontSize)
        ? preferences.fontSize
        : 'medium';
    const selectedDefaultColor = noteColorOptions.some((option) => option.value === preferences?.defaultNoteColor)
        ? preferences.defaultNoteColor
        : 'default';

    const [formData, setFormData] = useState({
        displayName: user?.displayName || user?.name || '',
        email: user?.email || '',
    });

    const [avatarPreview, setAvatarPreview] = useState(null);

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [savingPassword, setSavingPassword] = useState(false);

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [showMobileNav, setShowMobileNav] = useState(false);

    const handlePreferenceChange = (patch) => {
        if (typeof onUpdatePreferences !== 'function') {
            return;
        }

        onUpdatePreferences({
            ...(preferences || {}),
            fontSize: patch.fontSize || selectedFontSize,
            defaultNoteColor: patch.defaultNoteColor || selectedDefaultColor,
        });
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!formData.displayName.trim()) return toast.warning('Vui lòng nhập họ và tên');
        setSaving(true);
        try {
            const res = await updateProfile({ name: formData.displayName.trim() });
            toast.success(res.message);
            // Cập nhật user ở parent + localStorage
            const updatedUser = res.data.user;
            localStorage.setItem('auth_user', JSON.stringify(updatedUser));
            if (typeof onUserUpdate === 'function') {
                onUserUpdate({ displayName: updatedUser.name, name: updatedUser.name });
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            return toast.warning('Ảnh đại diện không được vượt quá 5MB');
        }
        // Preview ngay
        const reader = new FileReader();
        reader.onload = () => setAvatarPreview(reader.result);
        reader.readAsDataURL(file);

        // Upload
        setUploadingAvatar(true);
        try {
            const res = await uploadAvatar(file);
            toast.success(res.message);
            const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
            authUser.avatar = res.data.avatar;
            localStorage.setItem('auth_user', JSON.stringify(authUser));
            if (typeof onUserUpdate === 'function') {
                onUserUpdate({ avatar: res.data.avatar });
            }
        } catch (err) {
            toast.error(err.message);
            setAvatarPreview(null);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const submitPasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword.length < 8) return toast.warning('Mật khẩu mới phải có ít nhất 8 ký tự');
        if (passwordData.newPassword !== passwordData.confirmPassword) return toast.warning('Mật khẩu xác nhận không khớp');

        setSavingPassword(true);
        try {
            const res = await changePasswordApi({
                current_password: passwordData.currentPassword,
                password: passwordData.newPassword,
                password_confirmation: passwordData.confirmPassword,
            });
            toast.success(res.message);
            setIsChangingPassword(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowPasswords({ current: false, new: false, confirm: false });
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSavingPassword(false);
        }
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
        setAvatarPreview(null);
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
                            className="notes-icon-btn d-sm-none profile-hamburger-btn"
                            onClick={() => setShowMobileNav(true)}
                        >
                            <FontAwesomeIcon icon={faBars} />
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
                                        <div className="profile-image-picker" onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
                                            <div className="profile-image-circle">
                                                {avatarPreview || user?.avatar ? (
                                                    <img
                                                        src={avatarPreview || user.avatar}
                                                        alt="Avatar"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                                    />
                                                ) : (
                                                    <User size={40} className="profile-placeholder-icon" />
                                                )}
                                                <div className="profile-image-overlay">
                                                    {uploadingAvatar ? <Spinner animation="border" size="sm" /> : <Camera size={20} />}
                                                </div>
                                            </div>
                                            <p className="profile-image-label mb-0">Thay đổi</p>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                accept="image/jpeg,image/png,image/webp"
                                                hidden
                                                onChange={handleAvatarChange}
                                            />
                                        </div>
                                        <div>
                                            <h5 className="mb-1 fw-semibold">{formData.displayName}</h5>
                                            <p className="text-secondary mb-0 small">Cập nhật ảnh đại diện và chi tiết của bạn</p>
                                        </div>
                                    </div>

                                    <Form onSubmit={handleSaveProfile}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-semibold">Họ và tên</Form.Label>
                                            <div className="position-relative">
                                                <span className="position-absolute profile-input-icon">
                                                    <User size={18} />
                                                </span>
                                                <Form.Control
                                                    type="text"
                                                    name="displayName"
                                                    value={formData.displayName}
                                                    onChange={handleFormChange}
                                                    className="profile-input-control"
                                                />
                                            </div>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-semibold">Địa chỉ Email</Form.Label>
                                            <div className="position-relative">
                                                <span className="position-absolute profile-input-icon">
                                                    <Mail size={18} />
                                                </span>
                                                <Form.Control
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    className="profile-input-control"
                                                    disabled
                                                    readOnly
                                                />
                                            </div>
                                            <Form.Text className="text-muted small">
                                                Email không thể thay đổi.
                                            </Form.Text>
                                        </Form.Group>

                                        <div className="d-flex justify-content-end">
                                            <Button variant="primary" type="submit" disabled={saving}>
                                                {saving ? <Spinner animation="border" size="sm" /> : 'Lưu hồ sơ'}
                                            </Button>
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
                                                onChange={(e) => onToggleTheme(e.target.checked ? 'dark' : 'light')}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-3 border rounded-3 mb-4">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <PaintBucket size={18} />
                                            <h6 className="mb-0 fw-semibold">Màu note mặc định</h6>
                                        </div>
                                        <p className="text-secondary small mb-3">Áp dụng đồng bộ cho toàn bộ note trong Notes page.</p>
                                        <div className="profile-note-colors">
                                            {noteColorOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    className={`profile-note-color-swatch ${selectedDefaultColor === option.value ? 'active' : ''}`}
                                                    style={{ background: option.swatch }}
                                                    onClick={() => handlePreferenceChange({ defaultNoteColor: option.value })}
                                                    title={option.label}
                                                    aria-label={option.label}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-3 border rounded-3">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <Type size={18} />
                                            <h6 className="mb-0 fw-semibold">Kích cỡ chữ ghi chú</h6>
                                        </div>
                                        <p className="text-secondary small mb-3">Chỉ ảnh hưởng đến Notes page, không đổi font các page khác.</p>
                                        <div className="profile-font-size-options">
                                            {noteFontSizeOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    className={`profile-font-size-option ${selectedFontSize === option.value ? 'active' : ''}`}
                                                    onClick={() => handlePreferenceChange({ fontSize: option.value })}
                                                >
                                                    <span className="profile-font-size-option__preview">{option.preview}</span>
                                                    <span className="profile-font-size-option__label">{option.label}</span>
                                                </button>
                                            ))}
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
                                                        <span className="position-absolute profile-input-icon">
                                                            <Lock size={18} />
                                                        </span>
                                                        <Form.Control
                                                            type={showPasswords.current ? "text" : "password"}
                                                            name="currentPassword"
                                                            value={passwordData.currentPassword}
                                                            onChange={handlePasswordChange}
                                                            placeholder="Nhập mật khẩu hiện tại"
                                                            className="profile-input-control profile-input-control--with-trailing-icon"
                                                            required
                                                        />
                                                        <span
                                                            className="position-absolute profile-input-icon profile-input-icon--right"
                                                            onClick={() => togglePasswordVisibility('current')}
                                                        >
                                                            {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </span>
                                                    </div>
                                                </Form.Group>

                                                <Form.Group className="mb-3">
                                                    <Form.Label className="small fw-semibold">Mật khẩu mới</Form.Label>
                                                    <div className="position-relative">
                                                        <span className="position-absolute profile-input-icon">
                                                            <Lock size={18} />
                                                        </span>
                                                        <Form.Control
                                                            type={showPasswords.new ? "text" : "password"}
                                                            name="newPassword"
                                                            value={passwordData.newPassword}
                                                            onChange={handlePasswordChange}
                                                            placeholder="Nhập mật khẩu mới"
                                                            className="profile-input-control profile-input-control--with-trailing-icon"
                                                            required
                                                        />
                                                        <span
                                                            className="position-absolute profile-input-icon profile-input-icon--right"
                                                            onClick={() => togglePasswordVisibility('new')}
                                                        >
                                                            {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </span>
                                                    </div>
                                                </Form.Group>

                                                <Form.Group className="mb-4">
                                                    <Form.Label className="small fw-semibold">Xác nhận mật khẩu mới</Form.Label>
                                                    <div className="position-relative">
                                                        <span className="position-absolute profile-input-icon">
                                                            <Lock size={18} />
                                                        </span>
                                                        <Form.Control
                                                            type={showPasswords.confirm ? "text" : "password"}
                                                            name="confirmPassword"
                                                            value={passwordData.confirmPassword}
                                                            onChange={handlePasswordChange}
                                                            placeholder="Nhập lại mật khẩu mới"
                                                            className="profile-input-control profile-input-control--with-trailing-icon"
                                                            required
                                                        />
                                                        <span
                                                            className="position-absolute profile-input-icon profile-input-icon--right"
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
