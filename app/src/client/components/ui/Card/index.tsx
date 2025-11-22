import './index.scss'

export const Card: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <div className="Card">{children}</div>
}
