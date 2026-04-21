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
import { Link } from 'react-router-dom';
import BrandLogo from '../BrandLogo';

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
}) {
  return (
    <header className="notes-topbar sticky-top">
      {!isVerified ? (
        <div className="notes-verification-banner">
          Tai khoan chua xac minh email. Ban van co the trai nghiem note app o che do demo.
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

          <Link to="/notes" className="text-decoration-none">
            <BrandLogo size={34} />
          </Link>
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
              <Dropdown.Item onClick={onOpenSettings}>
                <FontAwesomeIcon icon={faGear} fixedWidth className="me-2" />
                Cai dat
              </Dropdown.Item>
              <Dropdown.Item onClick={onToggleTheme}>
                <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} fixedWidth className="me-2" />
                {theme === 'dark' ? 'Che do sang' : 'Che do toi'}
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
