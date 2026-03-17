import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../ui/Button';
import Textbox from '../../ui/Textbox';
import StatusMessage from '../../ui/StatusMessage';
import { changePassword } from '../../util/api';
import { pageClasses, blockClasses, innerClasses, inputsClasses, inputChunkClasses } from './LoginForm';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async () => {
    try {
      setError('');
      setSuccess(false);

      if (!currentPassword || !newPassword || !confirmPassword) {
        setError('All fields are required');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        return;
      }

      await changePassword(currentPassword, newPassword);
      setSuccess(true);

      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to change password');
      } else {
        setError('Failed to change password');
      }
    }
  };

  return (
    <div className={pageClasses}>
      <div className={blockClasses}>
        <h1 className="m-4">Change Password</h1>
        <p className="text-text-secondary mb-4">
          You must change your temporary password before continuing.
        </p>

        <StatusMessage message={error} type="error" />
        {success && (
          <StatusMessage
            message="Password changed successfully! Redirecting..."
            type="success"
          />
        )}

        <div className={innerClasses}>
          <div className={inputsClasses}>
            <div className={inputChunkClasses}>
              <span>Current Password</span>
              <Textbox type='password' placeholder='Current password...' onInput={setCurrentPassword} />
            </div>

            <div className={inputChunkClasses}>
              <span>New Password</span>
              <Textbox type='password' placeholder='New password...' onInput={setNewPassword} />
            </div>

            <div className={inputChunkClasses}>
              <span>Confirm New Password</span>
              <Textbox type='password' placeholder='Confirm new password...' onInput={setConfirmPassword} />
            </div>
          </div>
        </div>

        <div>
          <Button onClick={handleChangePassword} disabled={success}>
            Change Password
          </Button>
        </div>
      </div>
    </div>
  );
}
