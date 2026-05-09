import { useState, useEffect, useRef } from 'react';
import { Bell, Search, Settings, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ notifications = [] }) => {
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const imminent = notifications.filter((r) => {
    if (r.completed) return false;
    const deadlineDay = new Date(new Date(r.deadline).setHours(0, 0, 0, 0));
    const today      = new Date(new Date().setHours(0, 0, 0, 0));
    const diffDays   = (deadlineDay - today) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 1;
  });

  return (
    <nav
      className="bg-white border-bottom px-4 py-2 d-flex justify-content-between align-items-center sticky-top shadow-sm"
      style={{ zIndex: 100 }}
    >
      <div className="d-flex align-items-center gap-2">
        <button
          className="btn btn-light rounded-circle shadow-sm d-lg-none"
          onClick={() => window.dispatchEvent(new Event('studybuddy:toggle-sidebar'))}
          title="Toggle sidebar"
          type="button"
        >
          <Menu size={20} />
        </button>
        <h5 className="mb-0 fw-bold text-dark">StudyBuddy</h5>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Search — desktop only */}
        <div className="position-relative d-none d-md-block">
          <Search
            className="position-absolute top-50 translate-middle-y ms-3 text-muted"
            size={16}
          />
          <input
            className="form-control bg-light border-0 ps-5 rounded-pill"
            style={{ width: '260px' }}
            placeholder="Search..."
          />
        </div>

        {/* Notification Bell */}
        <div className="position-relative" ref={notifRef}>
          <button
            className={`btn rounded-circle shadow-sm position-relative ${
              showNotif ? 'btn-primary text-white' : 'btn-light text-dark'
            }`}
            onClick={() => setShowNotif(!showNotif)}
            title="Notifications"
          >
            <Bell size={20} />
            {imminent.length > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white"
                style={{ fontSize: '10px' }}
              >
                {imminent.length}
              </span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {showNotif && (
            <div
              className="position-absolute end-0 mt-2 bg-white shadow-lg border rounded-4 p-3"
              style={{ width: '320px', maxWidth: 'calc(100vw - 2rem)', zIndex: 200 }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h6 className="fw-bold mb-0">Notifications</h6>
                <span className="badge bg-light text-dark border">
                  {imminent.length} Pending
                </span>
              </div>

              {imminent.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  <Bell size={32} className="mb-2 opacity-25" />
                  <p className="mb-0">You're all caught up!</p>
                </div>
              ) : (
                <div
                  className="d-flex flex-column gap-2"
                  style={{ maxHeight: '300px', overflowY: 'auto' }}
                >
                  {imminent.map((r) => {
                    const isToday =
                      new Date(r.deadline).toDateString() ===
                      new Date().toDateString();
                    return (
                      <div
                        key={r._id}
                        className="p-2 px-3 bg-light rounded-3 border-start border-danger border-4"
                      >
                        <div className="fw-bold small text-dark mb-1">{r.text}</div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span
                            className="text-danger fw-bold text-uppercase"
                            style={{ fontSize: '10px' }}
                          >
                            ⚠ Deadline Warning
                          </span>
                          <span className="text-muted" style={{ fontSize: '11px' }}>
                            {isToday ? 'Today' : 'Tomorrow'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings Button → navigates to /settings */}
        <button
          className="btn btn-light rounded-circle shadow-sm"
          onClick={() => navigate('/settings')}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
