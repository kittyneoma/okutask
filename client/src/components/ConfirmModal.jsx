import './ConfirmModal.css';

/**
 * reusbale confirmation modal
 * @param {string} message - main question
 * @param {string} detail - estra detail - optional
 * @param {string} confirmText - text button confimation
 * @param {function} onConfirm
 * @param {function} onCancel
 */

const ConfirmModal = ({
    message = 'Are you sure?',
    detail = '',
    confirmText = 'Yes, confirm',
    onConfirm,
    onCancel
}) => {
    const handleOverlay = (e) => {
        if (e.target === e.currentTarget) onCancel();
    };

    return (
        <div className="modal-overlay confirm-overlay" onClick={handleOverlay}>
            <div className="confirm-container">
                <div className="confirm-icon">⚠︎</div>
                <h3 className="confirm-message">{message}</h3>
                {detail && (
                    <p className="confirm-detail">{detail}</p>
                )}
                <div className="confirm-actions">
                    <button 
                        className="btn btn-cancel" 
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button 
                        className="btn btn-danger" 
                        onClick={onConfirm}
                        >
                        {confirmText}
                    </button>
                </div>
                </div>
            </div>
    );
};

export default ConfirmModal;