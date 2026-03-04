import { useEffect, useState } from 'react';
import { getRubricByAssignment } from '../util/api';
import './RubricDisplay.css';

interface RubricDisplayProps {
    rubricId: number | null;  // actually the assignment ID
    onCriterionSelect: (row: number, column: number) => void;
    grades: number[];
}

export default function RubricDisplay({ rubricId }: RubricDisplayProps) {
    const [rubric, setRubric] = useState<RubricResponse | null>(null);

    useEffect(() => {
        if (!rubricId) return;
        getRubricByAssignment(rubricId)
            .then(setRubric)
            .catch(() => setRubric(null));
    }, [rubricId]);

    if (!rubric || rubric.criteria.length === 0) {
        return (
            <div className="RubricDisplay">
                <p className="RubricDisplay__empty">No rubric assigned yet.</p>
            </div>
        );
    }

    return (
        <div className="RubricDisplay">
            <h2>Rubric</h2>
            <div className="RubricDisplay__criteria">
                {rubric.criteria.map((c, i) => (
                    <div key={i} className="RubricDisplay__criterion">
                        <span className="RubricDisplay__question">{c.question}</span>
                        {c.has_score && (
                            <span className="RubricDisplay__score">out of {c.score_max}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
