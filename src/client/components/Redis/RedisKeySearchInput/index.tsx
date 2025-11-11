import { SearchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { redisKeyTypes } from '@/constants/redisKeyTypes'
import { Select } from '@/client/components/ui/Select'
import {
  changeFilterType,
  changeSearchValue,
  useRedisStore,
} from '@/client/stores/redisStore'
import s from './index.module.scss'
import { useDebouncedCallback } from 'use-debounce'

export const RedisKeySearchInput = () => {
  const [searchValue, setSearchValue] = useState('')
  const options = [
    { label: 'ALL', value: 'all' },
    ...redisKeyTypes.map((type) => ({ label: type, value: type })),
  ]

  const debouncedChangeSearchValue = useDebouncedCallback((value: string) => {
    changeSearchValue(value)
  }, 500)

  useEffect(() => {
    debouncedChangeSearchValue(searchValue)
  }, [searchValue])

  const filterType = useRedisStore((state) => state.filterType)

  return (
    <div className={s.RedisKeySearch}>
      <Select
        value={filterType}
        className={s.RedisKeySearchTypeSelect}
        options={options}
        onChange={(e) => {
          changeFilterType(e)
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
            debouncedChangeSearchValue(e.target.value)
          }}
          className={s.RedisKeySearchInput}
          placeholder="Filter by Key Name and Pattern "
        />
      </div>
    </div>
  )
}
