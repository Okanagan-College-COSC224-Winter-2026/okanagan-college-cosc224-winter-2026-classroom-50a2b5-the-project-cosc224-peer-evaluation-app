import './Criterion.css';
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
        <div className='criterionCard'>
            <div className='criterionQuestion'>{props.question}</div>
            {props.hasScore ? (
                <div className='criterionSliderContainer'>
                    <input
                        type='range'
                        min={0}
                        max={props.scoreMax}
                        value={sliderValue}
                        onChange={handleSliderChange}
                        className='criterionSlider'
                    />
                    <div className='criterionScoreLabel'>
                        <span>{sliderValue}</span> / <span>{props.scoreMax}</span>
                    </div>
                </div>
            ) : (
                <textarea className='criterionComment' placeholder='Write your comment here...' />
            )}
        </div>
    );
}
