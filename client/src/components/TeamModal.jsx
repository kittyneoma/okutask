import { useState } from 'react';
import authService from '../services/authService';
import projectService from '../services/projectService';
import './TeamModal.css';

/**
 * modal that shows full team of a project
 * if user is auth as owner they can add collaborators by email
 * n remove any collaborators
 * 
 * @param {object}   project        current project w owner n collab
 * @param {function} onClose
 * @param {function} onTeamUpdated  gets current project updated afte add/delete
 */
const TeamModal = ({ project, onClose, onTeamUpdated }) => {
  const [collabEmail, setCollabEmail] = useState('');
  const [error, setError] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  const currentUser = authService.getCurrentUser();
  const isOwner = currentUser?.id === project.owner;

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!collabEmail.trim()) return;
    setError('');
    setLoadingAction(true);
    try {
      const lookup = await authService.lookupByEmail(collabEmail.trim());
      const res = await projectService.addCollaborator(project._id, lookup.data.user.id);
      onTeamUpdated(res.data.project);
      setCollabEmail('');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not add collaborator');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRemove = async (userId) => {
    setError('');
    setLoadingAction(true);
    try {
      const res = await projectService.removeCollaborator(project._id, userId);
      onTeamUpdated(res.data.project);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not remove collaborator');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlay}>
      <div className="modal-container team-modal-container">
        <div className="team-modal-header">
          <h3>Project team</h3>
          <button className="team-modal-close" onClick={onClose}>✕</button>
        </div>

        <ul className="team-modal-list">
          <li className="team-modal-member">
            <div className="team-modal-avatar owner-avatar">
              {isOwner ? (currentUser?.name?.charAt(0).toUpperCase() || 'O') : 'O'}
            </div>
            <div className="team-modal-info">
              <span className="team-modal-name">
                {isOwner ? `${currentUser?.name} (You)` : 'Project owner'}
              </span>
              <span className="team-modal-role">Owner</span>
            </div>
          </li>

          {(project.collaborators || []).map((c) => (
            <li key={c._id} className="team-modal-member">
              <div className="team-modal-avatar">
                {c.name?.charAt(0).toUpperCase()}
              </div>
              <div className="team-modal-info">
                <span className="team-modal-name">{c.name}</span>
                <span className="team-modal-role">{c.email}</span>
              </div>
              {isOwner && (
                <button
                  className="team-modal-remove"
                  onClick={() => handleRemove(c._id)}
                  disabled={loadingAction}
                  title={`Remove ${c.name}`}
                >
                  Remove
                </button>
              )}
            </li>
          ))}

          {(project.collaborators || []).length === 0 && (
            <li className="team-modal-empty">No collaborators yet.</li>
          )}
        </ul>

        {error && <p className="team-modal-error">{error}</p>}

        {isOwner && (
          <form className="team-modal-add-form" onSubmit={handleAdd}>
            <input
              type="email"
              placeholder="Add teammate by email"
              value={collabEmail}
              onChange={(e) => setCollabEmail(e.target.value)}
              className="input"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loadingAction || !collabEmail.trim()}
            >
              {loadingAction ? 'Working...' : '+ Add'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default TeamModal;