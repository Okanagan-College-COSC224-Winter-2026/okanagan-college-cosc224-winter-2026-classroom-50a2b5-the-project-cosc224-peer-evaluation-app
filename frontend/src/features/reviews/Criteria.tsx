import Criterion from './Criterion';
import { useState } from 'react';

interface props {
    questions: Array<string>;
    scoreMaxes: Array<number>;
    canComment: boolean;
    hasScores: Array<boolean>;
    onCriterionSelect: (row: number, column: number) => void;
    onCommentChange?: (comment: string) => void;
    grades: number[];
}

export default function Criteria(props: props) {
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

    const currentTotal = scores.reduce((sum, score, i) => props.hasScores[i] ? sum + score : sum, 0);
    const maxTotal = props.scoreMaxes.reduce((sum, max, i) => props.hasScores[i] ? sum + max : sum, 0);

    return (
        <div className="flex flex-col items-center w-full">
            <div className="flex flex-col gap-3 w-full max-w-2xl">
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
                <div className="mt-4 text-right w-full max-w-2xl text-sm font-medium text-text-primary">
                    Total: <span className="text-btn-primary font-bold">{currentTotal}</span> / {maxTotal}
                </div>
            )}
            {props.canComment && (
                <textarea
                    className="mt-4 w-full max-w-2xl min-h-[80px] px-3 py-2 border border-border rounded-lg bg-bg-secondary text-text-primary text-sm font-[inherit] resize-y focus:outline-none focus:ring-2 focus:ring-btn-primary focus:border-btn-primary transition-colors"
                    placeholder="Additional comments..."
                    onChange={(e) => props.onCommentChange?.(e.target.value)}
                />
            )}
        </div>
    );
}
