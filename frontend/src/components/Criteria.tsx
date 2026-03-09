import './Criteria.css';
import Criterion from '../components/Criterion';
import { useState } from 'react';

interface props {
    questions: Array<string>;
    scoreMaxes: Array<number>;
    canComment: boolean;
    hasScores: Array<boolean>;
    onCriterionSelect: (row: number, column: number) => void;
    grades: number[];
}

export default function Criteria(props: props) {
    // Track each criterion's current score for total calculation
    const [scores, setScores] = useState<number[]>(
        props.grades.length > 0 ? [...props.grades] : new Array(props.questions.length).fill(0)
    );

    const handleSelect = (row: number, value: number) => {
        setScores(prev => {
            const updated = [...prev];
            updated[row] = value;
            return updated;
        });
        props.onCriterionSelect(row, value);
    };

    // Sum only criteria that have scores (not comment-only)
    const currentTotal = scores.reduce((sum, score, i) => props.hasScores[i] ? sum + score : sum, 0);
    const maxTotal = props.scoreMaxes.reduce((sum, max, i) => props.hasScores[i] ? sum + max : sum, 0);

    return (
        <div className="Criteria">
            <div className='criteriaList'>
                {props.questions.map((question, i) => (
                    <Criterion 
                        key={i}
                        question={question} 
                        scoreMax={props.scoreMaxes[i]} 
                        hasScore={props.hasScores[i]}
                        onCriterionSelect={handleSelect}
                        questionIndex={i}
                        grade={props.grades[i]}
                    />
                ))}
            </div>
            {maxTotal > 0 && (
                <div className="criteriaTotal">
                    Total: <span className="criteriaTotalScore">{currentTotal}</span> / {maxTotal}
                </div>
            )}
            {props.canComment && 
            <textarea className="criteriaText" placeholder="Additional comments..." />}
        </div>
    )
}