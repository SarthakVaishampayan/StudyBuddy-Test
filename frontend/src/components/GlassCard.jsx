const GlassCard = ({ title, value, icon, color }) => {
  return (
    <div className="glass p-4 h-100">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div className={`p-2 rounded-3 bg-opacity-25 ${color}`} style={{ background: 'rgba(255,255,255,0.1)' }}>
          <i className={`bi ${icon} fs-4`}></i>
        </div>
      </div>
      <h6 className="text-white-50 mb-1">{title}</h6>
      <h3 className="fw-bold mb-0">{value}</h3>
    </div>
  );
};

export default GlassCard;
