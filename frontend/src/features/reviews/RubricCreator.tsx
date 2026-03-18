import { useState } from 'react';
import Button from '../../ui/Button';
import StatusMessage from '../../ui/StatusMessage';
import { createCriteria, createRubric } from '../../util/api';

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
        <div className="p-4 md:p-5 bg-bg-secondary rounded-xl">
            <h2 className="mb-4 text-base font-semibold text-text-primary m-0">Create New Criteria</h2>

            <StatusMessage message={statusMessage} type={statusType} />

            <label className="flex items-center gap-2 mb-4 text-sm text-text-primary cursor-pointer">
                <input
                    type="checkbox"
                    checked={canComment}
                    onChange={() => setCanComment(prev => !prev)}
                    className="w-4 h-4"
                />
                Reviewer can comment
            </label>

            <div className="flex flex-col gap-3">
                {newCriteria.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 sm:items-center p-3 bg-white rounded-lg border border-border">
                        <input
                            type="text"
                            value={item.question}
                            onChange={(e) => handleQuestionChange(index, e.target.value)}
                            placeholder="Enter question"
                            className="flex-1 px-3 py-2 border border-border rounded-lg bg-bg-secondary text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-btn-primary focus:border-btn-primary transition-colors"
                        />
                        <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-1.5 text-sm text-text-primary cursor-pointer whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={item.hasScore}
                                    onChange={(e) => handleHasScoreChange(index, e.target.checked)}
                                    className="w-4 h-4"
                                />
                                Has score
                            </label>
                            {item.hasScore && (
                                <input
                                    type="number"
                                    min="0"
                                    value={item.scoreMax}
                                    onChange={(e) => handleScoreMaxChange(index, Number(e.target.value))}
                                    placeholder="Max"
                                    className="w-20 px-3 py-2 border border-border rounded-lg bg-bg-secondary text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-btn-primary focus:border-btn-primary transition-colors"
                                />
                            )}
                            <Button onClick={() => handleRemoveSection(index)}>Remove</Button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-2.5 mt-4 pt-4 border-t border-border">
                <Button onClick={handleAddNewSection}>Add New Criterion</Button>
                <Button onClick={handleCreate}>Create</Button>
            </div>
        </div>
    );
}
