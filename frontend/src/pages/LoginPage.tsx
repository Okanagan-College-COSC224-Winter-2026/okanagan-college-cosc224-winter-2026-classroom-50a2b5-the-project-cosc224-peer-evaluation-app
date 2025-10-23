import { useState } from 'react';
import './LoginPage.css';
import Textbox from '../components/Textbox';
import Button from '../components/Button';
import { tryLogin } from '../util/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const attemptLogin = async () => {
    //const result = await tryLogin(username, password);
    const result = await tryLogin(username, password);

    if (result.token) {
      window.location.href = `/home`;
    }

    // TODO show error message
  }

  return (
    <div className="LoginPage">
      <div className="LoginBlock">
        <h1>Login</h1>

        <div className="LoginInner">
          <div className="LoginInputs">
            <div className="LoginInputChunk">
              <span>Username</span>
              <Textbox
                placeholder='Username...'
                onInput={setUsername}
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

        <Button
          onClick={()=> attemptLogin()}
          children="Login"
        />

      </div>
    </div>
  );
}
