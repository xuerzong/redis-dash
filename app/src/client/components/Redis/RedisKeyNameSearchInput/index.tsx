import { SearchIcon } from 'lucide-react'
import { useRedisKeysContext } from '@client/providers/RedisKeysContext'
import { useIntlContext } from '@/client/providers/IntlProvider'
import s from './index.module.scss'

export const RedisKeyNameSearchInput = () => {
  const { searchValue, setSearchValue } = useRedisKeysContext()
  const { formatMessage } = useIntlContext()
  return (
    <div className={s.RedisKeySearch}>
      <div className={s.RedisKeySearchInputRoot}>
        <div className={s.RedisKeySearchInputIconWrapper}>
          <SearchIcon className={s.RedisKeySearchInputIcon} />
        </div>
        <input
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value)
          }}
          className={s.RedisKeySearchInput}
          placeholder={formatMessage('placeholder.filterByKeyNameAndPattern')}
        />
      </div>
    </div>
  )
}
