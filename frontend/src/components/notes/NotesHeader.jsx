import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faBorderAll,
  faGear,
  faList,
  faMoon,
  faRightFromBracket,
  faSearch,
  faSun,
} from '@fortawesome/free-solid-svg-icons';
import { Dropdown } from 'react-bootstrap';
import AppLogo from '../AppLogo';

function NotesHeader({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  userName,
  isVerified,
  theme,
  onToggleTheme,
  onLogout,
  onOpenSettings,
  onToggleMobileSidebar,
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
            aria-label="Mo bo loc"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

            <AppLogo to="/notes" size={45} />
        </div>

        <div className="notes-search">
          <FontAwesomeIcon icon={faSearch} className="notes-search__icon" />
          <input
            className="form-control notes-search__input"
            type="search"
            placeholder="Tim theo tieu de, noi dung..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="notes-icon-btn"
            onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
            title={viewMode === 'grid' ? 'Che do danh sach' : 'Che do luoi'}
            aria-label={viewMode === 'grid' ? 'Che do danh sach' : 'Che do luoi'}
          >
            <FontAwesomeIcon icon={viewMode === 'grid' ? faList : faBorderAll} />
          </button>

          <button
            type="button"
            className="notes-icon-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Chuyen sang giao dien sang' : 'Chuyen sang giao dien toi'}
            aria-label="Doi giao dien"
          >
            <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} />
          </button>

          <Dropdown align="end">
            <Dropdown.Toggle className="notes-avatar-toggle" variant="link">
              {userName.charAt(0).toUpperCase()}
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
                Dang xuat
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}

export default NotesHeader;
