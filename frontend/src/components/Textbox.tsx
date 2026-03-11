interface Props {
  onInput?: (value: string) => void
  className?: string
  placeholder?: string
  type?: string
  value?: string
}

export default function Textbox(props: Props) {
  return (
    <input
      type={props.type || 'text'}
      className={`appearance-none bg-bg-primary text-text-primary border border-border rounded-lg p-3 w-full text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-btn-primary focus:border-btn-primary placeholder:text-text-secondary ${props.className ?? ''}`}
      placeholder={props.placeholder}
      value={props.value}
      onInput={(e) => {
        e.preventDefault()
        if (!props?.onInput) {
          return
        }
        // @ts-expect-error womp womp
        props.onInput(e.target.value)
      }}
    />
  )
}
