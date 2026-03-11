import { useState } from 'react';
import Textbox from '../components/Textbox';
import Button from '../components/Button';
import StatusMessage from '../components/StatusMessage';
import { tryRegister } from '../util/api';
import { useNavigate } from 'react-router-dom';
import { pageClasses, blockClasses, innerClasses, inputsClasses, inputChunkClasses } from './LoginPage';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const attemptRegister = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (await tryRegister(name, email, password)) {
      navigate('/');
    }
  }

  return (
    <div className={pageClasses}>
      {error && <StatusMessage message={error} type="error" />}
      <div className={blockClasses}>
        <h1 className="m-4">Register</h1>

        <div className={innerClasses}>
          <div className={inputsClasses}>
            <div className={inputChunkClasses}>
              <span>Name</span>
              <Textbox placeholder='Name...' onInput={setName} />
            </div>

            <div className={inputChunkClasses}>
              <span>Email</span>
              <Textbox type='email' placeholder='Email...' onInput={setEmail} />
            </div>

            <div className={inputChunkClasses}>
              <span>Password</span>
              <Textbox type='password' placeholder='Password...' onInput={setPassword} />
            </div>

            <div className={inputChunkClasses}>
              <span>Confirm Password</span>
              <Textbox type='password' placeholder='Confirm Password...' onInput={setConfirmPassword} />
            </div>
          </div>
        </div>

        <Button onClick={() => attemptRegister()} children="Register" />
      </div>
    </div>
  );
}
