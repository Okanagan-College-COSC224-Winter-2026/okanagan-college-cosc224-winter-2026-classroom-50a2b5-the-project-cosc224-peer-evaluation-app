import { useState } from 'react'
import Button from '../../ui/Button'
import Textbox from '../../ui/Textbox'
import StatusMessage from '../../ui/StatusMessage'
import { createClass } from '../../util/api'

export default function CreateClass() {
  const [name, setName] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState<'error' | 'success'>('error')

  const attemptCreateClass = async () => {
    try {
      setStatusMessage('');
      const response = await createClass(name);

      if (!response.ok) {
        throw new Error('Failed to create class');
      }

      setStatusType('success');
      setStatusMessage('Class created successfully!');
      setName('');
    } catch (error) {
      console.error('Error creating class:', error);
      setStatusType('error');
      setStatusMessage('Error creating class.');
    }
  };

  return (
    <div className="p-16 w-3/5">
      <h1>Create Class</h1>

      <StatusMessage message={statusMessage} type={statusType} />

      <h2>Class Name</h2>
      <Textbox onInput={setName} />

      <Button onClick={() => {
        attemptCreateClass()
      }}>
        Submit
      </Button>
    </div>
  )
}
