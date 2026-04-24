import { Modal, Button, Form } from 'react-bootstrap';

function UserProfileModal({ open, onClose }) {
    // TODO: Tích hợp lấy dữ liệu người dùng thật từ API Backend ở đây
    // Hiện tại có thể thiết kế UI tĩnh trước.

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: Gửi form cập nhật hồ sơ
        onClose();
    };

    return (
        <Modal show={open} onHide={onClose} centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="h5 fw-bold">Sửa hồ sơ cá nhân</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Tên hiển thị</Form.Label>
                        <Form.Control type="text" placeholder="Nhập tên của bạn" />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" placeholder="email@example.com" disabled />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Số điện thoại</Form.Label>
                        <Form.Control type="tel" placeholder="Nhập số điện thoại" />
                    </Form.Group>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button variant="outline-secondary" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button variant="primary" type="submit">
                            Lưu thay đổi
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

export default UserProfileModal;
