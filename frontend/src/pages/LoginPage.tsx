import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import Textbox from '../components/Textbox';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import { tryLogin } from '../util/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const attemptLogin = async () => {
    if (await tryLogin(email, password)) {
      window.location.href = `/home`;
    } else {
      setError('Invalid email or password');
    }
  }

  return (
    <div className="LoginPage">
      {error && <ErrorMessage message={error} className="LoginError" />}
      <div className="LoginBlock">  
        <h1>Login</h1>

        <div className="LoginInner">
          <div className="LoginInputs">
            <div className="LoginInputChunk">
              <span>Email</span>
              <Textbox
                placeholder='Email...'
                onInput={setEmail}
                className='LoginInput'
              />
            </div>

            <div className="LoginInputChunk">
              <span>Password</span>
              <Textbox
                type='password'
                placeholder='Password...'
                onInput={setPassword}
                className='LoginInput'
              />
            </div>
          </div>

        </div>
        <div>
          <Button
            onClick={()=> attemptLogin()}
            children="Login"
          />

          <Button
            onClick={() => navigate('/register')}
            type='secondary'
            children="Register"
          />
        </div>
      </div>
    </div>
  );
}
