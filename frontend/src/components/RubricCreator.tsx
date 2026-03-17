import { useState } from 'react';
import Button from './Button';
import StatusMessage from './StatusMessage';
import { createCriteria, createRubric } from '../util/api';

interface RubricCreatorProps {
    onRubricCreated?: (rubricId: number) => void;
    id: number;
}

export default function RubricCreator({ onRubricCreated, id }: RubricCreatorProps) {
    const [newCriteria, setNewCriteria] = useState<Omit<Criterion, 'id'>[]>([{ rubricID: 0, question: '', scoreMax: 0, hasScore: true }]);
    const [canComment, setCanComment] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [statusType, setStatusType] = useState<'error' | 'success'>('error');

    const handleCreate = async () => {
        try {
            setStatusMessage('');
            const rubricResponse = await createRubric(id, canComment);
            const newRubricID = rubricResponse.id;
            await Promise.all(newCriteria.map(({ question, scoreMax, hasScore }) =>
                createCriteria(newRubricID, question, scoreMax, canComment, hasScore)
            ));
            setStatusType('success');
            setStatusMessage('Rubric created successfully!');
            if (onRubricCreated) {
                onRubricCreated(newRubricID);
            }
        } catch (error) {
            console.error("Error creating criteria:", error);
            setStatusType('error');
            setStatusMessage('Error creating rubric.');
        }
    };

    const handleQuestionChange = (index: number, value: string) => {
        const updatedCriteria = [...newCriteria];
        updatedCriteria[index].question = value;
        setNewCriteria(updatedCriteria);
    };

    const handleScoreMaxChange = (index: number, value: number) => {
        const updatedCriteria = [...newCriteria];
        updatedCriteria[index].scoreMax = Math.max(0, value);
        setNewCriteria(updatedCriteria);
    };

    const handleHasScoreChange = (index: number, value: boolean) => {
        const updatedCriteria = [...newCriteria];
        updatedCriteria[index].hasScore = value;
        if (!value) {
            updatedCriteria[index].scoreMax = 0;
        }
        setNewCriteria(updatedCriteria);
    };

    const handleAddNewSection = () => setNewCriteria(prev => [...prev, { rubricID: 0, question: '', scoreMax: 0, hasScore: true } as Omit<Criterion, 'id'>]);

    const handleRemoveSection = (index: number) => setNewCriteria(prev => prev.filter((_, i) => i !== index));

    return (
        <div className="p-5 bg-[#f5f5f5] rounded-[8px] my-5">
            <h2 className="mb-5 text-[#333]">Create New Criteria</h2>

            <StatusMessage message={statusMessage} type={statusType} />

            <label className="block mb-5">
                Reviewer can comment:
                <input
                    type="checkbox"
                    checked={canComment}
                    onChange={() => setCanComment(prev => !prev)}
                />
            </label>

            {newCriteria.map((item, index) => (
                <div key={index} className="flex gap-2.5 items-center mb-[15px] p-2.5 bg-white rounded shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
                    <input
                        type="text"
                        value={item.question}
                        onChange={(e) => handleQuestionChange(index, e.target.value)}
                        placeholder="Enter question"
                        className="flex-1 p-2 border border-[#ddd] rounded"
                    />
                    <label>
                        Has score:
                        <input
                            type="checkbox"
                            checked={item.hasScore}
                            onChange={(e) => handleHasScoreChange(index, e.target.checked)}
                        />
                    </label>
                    {item.hasScore && (
                        <input
                            type="number"
                            min="0"
                            value={item.scoreMax}
                            onChange={(e) => handleScoreMaxChange(index, Number(e.target.value))}
                            placeholder="Enter score max"
                            className="w-[100px] p-2 border border-[#ddd] rounded"
                        />
                    )}
                    <Button onClick={() => handleRemoveSection(index)}>Remove Criterion</Button>
                </div>
            ))}

            <div className="flex gap-2.5 mt-5">
                <Button onClick={handleAddNewSection}>Add New Criterion</Button>
                <Button onClick={handleCreate}>Create</Button>
            </div>
        </div>
    );
}
