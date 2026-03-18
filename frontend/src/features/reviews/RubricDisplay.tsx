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
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 md:px-8 py-8 flex flex-col items-center gap-2">
                    <span className="text-3xl">📋</span>
                    <p className="text-text-secondary text-sm m-0">No rubric available yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 md:px-8 py-4 border-b border-border">
                <h3 className="text-base font-semibold text-text-primary m-0">Rubric</h3>
            </div>
            <div className="px-5 md:px-8 py-5">
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
        </div>
    );
}
