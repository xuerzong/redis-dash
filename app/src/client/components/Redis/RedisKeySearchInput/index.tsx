import { SearchIcon } from 'lucide-react'
import { redisKeyTypes } from '@/client/constants/redisKeyTypes'
import { Select } from '@client/components/ui/Select'
import { useRedisKeysContext } from '@client/providers/RedisKeysContext'
import s from './index.module.scss'

export const RedisKeySearchInput = () => {
  const { searchValue, setSearchValue, filterType, setFilterType } =
    useRedisKeysContext()
  const options = [
    { label: 'ALL', value: 'all' },
    ...redisKeyTypes.map((type) => ({ label: type, value: type })),
  ]

  return (
    <div className={s.RedisKeySearch}>
      <Select
        value={filterType}
        className={s.RedisKeySearchTypeSelect}
        options={options}
        onChange={(e) => {
          setFilterType(e)
        }}
      />
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
          placeholder="Filter by Key Name and Pattern "
        />
      </div>
    </div>
  )
}
