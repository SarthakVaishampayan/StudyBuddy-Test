import {
  LayoutDashboard, BookOpen, Book,
  MessageSquare, LogOut, User, Brain,
  ChevronLeft, ChevronRight, Info, Sparkles, Calendar
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 992);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'Analytics', icon: <BookOpen size={20} />,        path: '/analytics' },
    { name: 'Subjects',  icon: <Book size={20} />,            path: '/subjects' },
    { name: 'Calendar',  icon: <Calendar size={20} />,        path: '/calendar' },
    { name: 'Your Space', icon: <Sparkles size={20} />,       path: '/space' },

    { name: 'Ask AI',    icon: <Brain size={20} />,   path: '/ask-ai' },
  ];

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileOpen(false);
      }
    };

    const handleToggleSidebar = () => {
      if (window.innerWidth < 992) {
        setIsMobileOpen((prev) => !prev);
        return;
      }
      setIsDesktopCollapsed((prev) => !prev);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('studybuddy:toggle-sidebar', handleToggleSidebar);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('studybuddy:toggle-sidebar', handleToggleSidebar);
    };
  }, []);

  const isCollapsed = isMobile ? false : isDesktopCollapsed;

  const closeMobileSidebar = () => {
    if (isMobile) setIsMobileOpen(false);
  };

  const navigateFromSidebar = (path) => {
    navigate(path);
    closeMobileSidebar();
  };

  const handleLogout = (e) => {
    e.stopPropagation();
    closeMobileSidebar();
    logout();
  };

  return (
    <>
      {isMobile && isMobileOpen && (
        <div
          className="sidebar-backdrop d-lg-none"
          onClick={closeMobileSidebar}
        />
      )}

      <div
        className={`bg-white border-end d-flex flex-column transition-all studybuddy-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: isCollapsed ? '80px' : '260px',
          transition: 'width 0.3s, transform 0.3s ease',
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          flexShrink: 0,
          zIndex: 1045,
          height: '100vh',
        }}
      >
        <div className="p-3 d-flex justify-content-end">
          <button
            className="btn btn-sm btn-light rounded-circle"
            onClick={() => {
              if (isMobile) setIsMobileOpen((prev) => !prev);
              else setIsDesktopCollapsed((prev) => !prev);
            }}
          >
            {isMobile || isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <div
          className={`px-4 mb-4 d-flex align-items-center gap-2 ${
            isCollapsed ? 'justify-content-center' : ''
          }`}
        >
          <div className="p-1 rounded-2" style={{ backgroundColor: '#8b5cf6' }}>
            <BookOpen color="white" size={24} />
          </div>
          {!isCollapsed && <h5 className="mb-0 fw-bold">StudyBuddy</h5>}
        </div>

        <div className="flex-grow-1 mt-2">
          {menuItems.map((item, idx) => (
            <div
              key={idx}
              className={`d-flex align-items-center px-4 py-3 nav-link-custom
                ${location.pathname === item.path ? 'nav-link-active' : ''}
                ${isCollapsed ? 'justify-content-center px-0' : ''}
              `}
              role="button"
              style={{ cursor: 'pointer' }}
              onClick={() => navigateFromSidebar(item.path)}
              title={isCollapsed ? item.name : ''}
            >
              <span className={isCollapsed ? '' : 'me-3'}>{item.icon}</span>
              {!isCollapsed && <span className="fw-medium">{item.name}</span>}
            </div>
          ))}
        </div>

        <div className="p-4 border-top">
          <div
            className={`d-flex align-items-center gap-3 ${
              isCollapsed ? 'justify-content-center px-0' : ''
            }`}
            style={{ cursor: 'pointer' }}
            onClick={() => navigateFromSidebar('/profile')}
          >
            <div className="bg-light rounded-circle p-2 border">
              <User size={20} className="text-primary" />
            </div>
            {!isCollapsed && (
              <div>
                <p className="mb-0 fw-bold small text-dark">{user?.name || 'User'}</p>
                <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>View Profile</p>
              </div>
            )}
          </div>

          <div
            className={`d-flex align-items-center gap-3 mt-3 ${
              isCollapsed ? 'justify-content-center px-0' : ''
            }`}
            style={{ cursor: 'pointer' }}
            onClick={() => navigateFromSidebar('/about')}
            title={isCollapsed ? 'About Us' : ''}
          >
            <div className="bg-light rounded-circle p-2 border">
              <Info size={18} className="text-secondary" />
            </div>
            {!isCollapsed && (
              <div>
                <p className="mb-0 fw-bold small text-dark">About Us</p>
                <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Developer & contact</p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div
              className="mt-3 text-danger small d-flex align-items-center gap-2"
              role="button"
              style={{ cursor: 'pointer' }}
              onClick={handleLogout}
            >
              <LogOut size={16} /> Logout
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
