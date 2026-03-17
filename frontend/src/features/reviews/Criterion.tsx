import { useState } from 'react';

// Component for a single criterion displayed as a card with a slider
interface props {
    question: string;
    scoreMax: number;
    hasScore: boolean;
    onCriterionSelect: (row: number, column: number) => void;
    questionIndex: number;
    grade: number;
}

export default function Criterion(props: props) {
    const [sliderValue, setSliderValue] = useState<number>(props.grade || 0);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        setSliderValue(value);
        props.onCriterionSelect(props.questionIndex, value);
    };

    return (
        <div className="bg-white border border-border rounded-xl px-5 py-4 shadow-sm">
            <p className="font-semibold text-text-primary text-sm mb-3 m-0">{props.question}</p>

            {props.hasScore ? (
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min={0}
                        max={props.scoreMax}
                        value={sliderValue}
                        onChange={handleSliderChange}
                        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-btn-primary"
                    />
                    <span className="text-sm font-semibold text-btn-primary whitespace-nowrap min-w-[3.5rem] text-right">
                        {sliderValue} / {props.scoreMax}
                    </span>
                </div>
            ) : (
                <textarea
                    className="w-full min-h-[80px] px-3 py-2 border border-border rounded-lg bg-bg-secondary text-text-primary text-sm font-[inherit] resize-y focus:outline-none focus:ring-2 focus:ring-btn-primary focus:border-btn-primary transition-colors"
                    placeholder="Write your comment here..."
                />
            )}
        </div>
    );
}
