const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f7fafc', // similar to Tailwind's bg-gray-100
    minHeight: '95vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0', // gray-200
    paddingBottom: '16px',
    marginBottom: '20px',
    backgroundColor:'white',
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#192F59'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
  },
  iconButton: {
    padding: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: 'white',
    border: 'none',
    boxShadow: '0 0 3px rgba(0,0,0,0.1)',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  card: {
    position: 'relative',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    cursor: 'default',
    height: '28rem'
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '25rem',
    objectFit: 'contain',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  overlayVisible: {
    opacity: 1,
  },
  overlayButton: {
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    border: 'none',
  },
  editButton: {
    backgroundColor: 'white',
    color: 'black',
  },
  deleteButton: {
    backgroundColor: '#f56565', // red-500
    color: 'white',
  },
  imageName: {
    margin: '12px 16px',
    fontWeight: '600',
    fontSize: '1rem',
    color: '#4a5568', // gray-700
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  addCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    border: '2px dashed #cbd5e0', // gray-300
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '28rem',
    color: '#a0aec0', // gray-400
    transition: 'border-color 0.3s ease',
    marginLeft: '30px'
  },
  addCardHover: {
    borderColor: '#718096', // gray-600
    color: '#4a5568',
  },
  addIconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    backgroundColor: '#edf2f7', // gray-100
    borderRadius: '50%', // makes it circular
    cursor: 'pointer',
    marginBottom: '16px',
    marginLeft: '20px'
  },
};

export default styles;