import { useEffect, useState } from 'react';
import Criteria from './Criteria';
import { getCriteria, getRubric } from '../util/api';
import './RubricDisplay.css';

interface RubricDisplayProps {
    rubricId: number | null;
    onCriterionSelect: (row: number, column: number) => void;
    grades: number[];
}

interface RubricInfo {
    id: number;
    assignmentID: number;
    canComment: boolean;
    grades: number[];
}

export default function RubricDisplay({ rubricId, onCriterionSelect, grades }: RubricDisplayProps) {
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [rubricInfo, setRubricInfo] = useState<RubricInfo | null>(null);
    const questions: string[] = [];
    const scoreMaxes: number[] = [];
    const hasScores: boolean[] = [];

interface RubricDisplayProps {
  rubricId: number;
}

    criteria.forEach((crit) => {
        questions.push(crit.question);
        scoreMaxes.push(crit.scoreMax);
        hasScores.push(crit.hasScore);
    });

<<<<<<< Updated upstream
    if (!rubricId || criteria.length === 0) {
        return (
            <div className="RubricDisplay">
                <p>No rubric available yet</p>
            </div>
        );
    }

=======
  useEffect(() => {
    if (!rubricId) return;
    getRubricByAssignment(rubricId)
      .then((data) => setRubric(data as RubricResponse))
      .catch(() => setRubric(null));
  }, [rubricId]);

  if (!rubric || rubric.criteria.length === 0) {
>>>>>>> Stashed changes
    return (
        <div className="RubricDisplay">
            <h2>Rubric</h2>
            <Criteria
                questions={questions}
                scoreMaxes={scoreMaxes}
                canComment={rubricInfo?.canComment ?? false}
                hasScores={hasScores}
                onCriterionSelect={onCriterionSelect}
                grades={grades}
            />
        </div>
    );
<<<<<<< Updated upstream
} 
=======
  }

  return (
    <div className="RubricDisplay">
      <h3 className="RubricDisplay__title">{rubric.title}</h3>
      <table className="RubricDisplay__table">
        <tbody>
          {rubric.criteria.map((criterion) => (
            <tr key={criterion.id}>
              <td className="RubricDisplay__criterion-title">
                {(criterion as any).title || (criterion as any).question}
              </td>
              {criterion.levels ? criterion.levels.map((level) => (
                <td key={level.id} className="RubricDisplay__level">
                  <div className="RubricDisplay__level-score">{level.score}</div>
                  <div className="RubricDisplay__level-desc">{level.description}</div>
                </td>
              )) : (
                <td className="RubricDisplay__level">
                  <div className="RubricDisplay__level-score">
                    {(criterion as any).score_max || (criterion as any).scoreMax}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
>>>>>>> Stashed changes
