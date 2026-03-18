import Criteria from './Criteria';
import { useRubric, useCriteria } from './useRubric';

interface RubricDisplayProps {
    rubricId: number | null;
    onCriterionSelect: (row: number, column: number) => void;
    onCommentChange?: (comment: string) => void;
    grades: number[];
}

export default function RubricDisplay({ rubricId, onCriterionSelect, onCommentChange, grades }: RubricDisplayProps) {
    const { data: criteria = [] } = useCriteria(rubricId);
    const { data: rubricInfo } = useRubric(rubricId);

    const questions: string[] = [];
    const scoreMaxes: number[] = [];
    const hasScores: boolean[] = [];

    criteria.forEach((crit: Criterion) => {
        questions.push(crit.question);
        scoreMaxes.push(crit.scoreMax);
        hasScores.push(crit.hasScore);
    });

    if (!rubricId || criteria.length === 0) {
        return (
            <div className="p-5 bg-white rounded-[8px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] my-5">
                <p>No rubric available yet</p>
            </div>
        );
    }

    return (
        <div className="p-5 bg-white rounded-[8px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] my-5">
            <h2 className="mb-5 text-[#333]">Rubric</h2>
            <Criteria
                questions={questions}
                scoreMaxes={scoreMaxes}
                canComment={rubricInfo?.canComment ?? false}
                hasScores={hasScores}
                onCriterionSelect={(row: number, value: number) => {
                    const criterionId = criteria[row]?.id;
                    if (criterionId !== undefined) {
                        onCriterionSelect(criterionId, value);
                    }
                }}
                onCommentChange={onCommentChange}
                grades={grades}
            />
        </div>
    );
}
