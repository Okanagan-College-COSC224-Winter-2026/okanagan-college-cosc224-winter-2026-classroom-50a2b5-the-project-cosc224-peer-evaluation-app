import { useState } from 'react';

//Component for a single row of the criteria table
interface props {
    question: string;
    scoreMax: number;
    hasScore: boolean;
    onCriterionSelect: (row: number, column: number) => void;
    questionIndex: number;
    grade: number;
}

export default function Criterion(props: props) {
    const [clickedCell, setClickedCell] = useState<number | null>(null);

    const handleCellClick = (columnIndex: number) => {
        const column = columnIndex + 1;

        if (clickedCell === column) {
            setClickedCell(null);
            props.onCriterionSelect(props.questionIndex, column);
        } else {
            setClickedCell(column);
            props.onCriterionSelect(props.questionIndex, column);
        }
    }

    return (
        <tr className="h-[100px] flex">
            <th className="bg-bg-tertiary text-center p-2 text-[15px] font-bold text-text-primary w-1/2 border border-black">
                {props.question}
            </th>
            {props.hasScore ? (
                Array.from({ length: props.scoreMax }, (_, i) => {
                    const cellValue = i + 1;
                    const isReviewed = cellValue === props.grade;
                    return (
                        <td
                            key={i}
                            onClick={() => handleCellClick(i)}
                            className={`flex-1 text-center p-2 border border-black cursor-pointer ${isReviewed ? 'bg-green-300' : (clickedCell === cellValue ? 'bg-yellow-300' : '')}`}
                        >
                            {cellValue}
                        </td>
                    );
                })
            ) : (
                <td className="flex-1 text-center p-2 border border-black">
                    <textarea
                        className="w-full h-full min-h-[80px] resize-y m-0 p-1 border border-[#ddd] rounded bg-bg-primary text-text-primary font-[inherit] text-[inherit]"
                        placeholder="Comment here"
                    />
                </td>
            )}
        </tr>
    )
}
