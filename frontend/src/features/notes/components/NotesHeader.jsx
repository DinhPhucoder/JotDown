import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faBorderAll,
  faGear,
  faList,
  faRightFromBracket,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
import { Dropdown } from 'react-bootstrap';
import AppLogo from '../../../components/AppLogo';

function NotesHeader({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  userName,
  userAvatar,
  isVerified,
  selectedLabel,
  onLogout,
  onOpenSettings,
  onToggleMobileSidebar,
  onToggleDesktopSidebar,
  onOpenProfile
}) {
  return (
    <header className="notes-topbar sticky-top">
      {!isVerified ? (
        <div className="notes-verification-banner">
          Tài khoản chưa xác thực. Vui lòng kiểm tra email
        </div>
      ) : null}

      <div className="container-fluid notes-topbar__inner">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="notes-icon-btn d-lg-none"
            onClick={onToggleMobileSidebar}
            aria-label="Mở bộ lọc"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          
          <button
            type="button"
            className="notes-icon-btn d-none d-lg-inline-flex"
            onClick={onToggleDesktopSidebar}
            aria-label="Ẩn hiện thanh bên"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          {selectedLabel ? (
            <h2 className="mb-0 fs-5 text-truncate" style={{ maxWidth: '200px' }} title={selectedLabel}>
              {selectedLabel}
            </h2>
          ) : (
            <AppLogo to="/notes" size={45} />
          )}
        </div>

        <div className="notes-search">
          <FontAwesomeIcon icon={faSearch} className="notes-search__icon" />
          <input
            className="form-control notes-search__input"
            type="search"
            placeholder="Tìm theo tiêu đề, nội dung..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="notes-icon-btn d-none d-md-inline-flex"
            onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
            title={viewMode === 'grid' ? 'Chế độ danh sách' : 'Chế độ lưới'}
            aria-label={viewMode === 'grid' ? 'Chế độ danh sách' : 'Chế độ lưới'}
          >
            <FontAwesomeIcon icon={viewMode === 'grid' ? faList : faBorderAll} />
          </button>

          <Dropdown align="end">
            <Dropdown.Toggle className={`notes-avatar-toggle${userAvatar ? ' has-avatar' : ''}`} variant="link">
              {userAvatar ? (
                <img src={userAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </Dropdown.Toggle>
            <Dropdown.Menu className="notes-account-menu">
              <Dropdown.Header>{userName}</Dropdown.Header>
              <Dropdown.Item onClick={onOpenProfile}>
                <FontAwesomeIcon icon={faGear} fixedWidth className="me-2" />
                Cài đặt
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={onLogout}>
                <FontAwesomeIcon icon={faRightFromBracket} fixedWidth className="me-2" />
                Đăng xuất
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}

export default NotesHeader;
