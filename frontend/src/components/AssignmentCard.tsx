interface Props {
  onClick?: () => void
  children?: React.ReactNode
  id: number | string
  className?: string
}

export default function AssignmentCard(props: Props) {
  return (
    <div
      onClick={() => {
        window.location.href = `/assignments/${props.id}`
      }}
      className={`flex flex-row justify-start items-center text-text-primary p-2 w-full h-auto rounded-lg font-semibold text-sm text-left hover:cursor-pointer hover:bg-bg-secondary transition-colors duration-150 gap-2 ${props.className ?? ''}`}
    >
      <img src="/icons/document.svg" alt="document" className="w-9 h-9 flex-shrink-0" />
      <span>{props.children}</span>
    </div>
  )
}
