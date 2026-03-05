import { useEffect, useState } from 'react';
import { getRubricByAssignment } from '../util/api';
import './RubricDisplay.css';

interface RubricCriterion {
  id: number;
  title: string;
  description: string;
  levels: RubricLevel[];
}

interface RubricLevel {
  id: number;
  score: number;
  description: string;
}

interface RubricResponse {
  id: number;
  title: string;
  criteria: RubricCriterion[];
}

interface RubricDisplayProps {
  rubricId: number | null;
  onCriterionSelect: (row: number, column: number) => void;
  grades: number[];
}

export default function RubricDisplay({ rubricId }: RubricDisplayProps) {
  const [rubric, setRubric] = useState<RubricResponse | null>(null);

  useEffect(() => {
    if (!rubricId) return;

    getRubricByAssignment(rubricId)
    .then((data: any) => setRubric(data))
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
      <h3 className="RubricDisplay__title">{rubric.title}</h3>
      <table className="RubricDisplay__table">
        <tbody>
          {rubric.criteria.map((criterion) => (
            <tr key={criterion.id}>
              <td className="RubricDisplay__criterion-title">{criterion.title}</td>
              {criterion.levels.map((level) => (
                <td key={level.id} className="RubricDisplay__level">
                  <div className="RubricDisplay__level-score">{level.score}</div>
                  <div className="RubricDisplay__level-desc">{level.description}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
