import { useState } from 'react'
import Button from '../components/Button'
import Textbox from '../components/Textbox'
import './CreateClass.css'
import { createClass } from '../util/api'

export default function CreateClass() {
  const [name, setName] = useState('')

  const attemptCreateClass = async () => {
    try {
      const response = await createClass(name);
      
      if (!response.ok) {
        throw new Error('Failed to create class');
      }

      alert('Class created successfully!');//stay on page - as per Ruth.
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Error creating class.');
    }
  };

  return (
    <div className="CreateClass">
      <h1>Create Class</h1>

      <h2>Class Name</h2>
      <Textbox onInput={setName} />
      
      <Button onClick={() => {
        // Send API req
        attemptCreateClass()
      }}>
        Submit
      </Button>
    </div>
  )
}

