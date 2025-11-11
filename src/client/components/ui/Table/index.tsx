import React, { Fragment, useCallback, type JSX } from 'react'
import './index.scss'
export interface TableColumn<T = any> {
  key: string
  label: string
  render?: (value: any, record: T) => JSX.Element // T[keyof T] is too strict, use any for flexibility
  width?: string | number
  ellipsis?: boolean
  align?: 'left' | 'center' | 'right'
}

interface TableProps<T = any> {
  rowKey?: (record: T) => string
  columns: TableColumn<T>[]
  data: T[]
  rowRender?: (children: React.ReactNode, record: T) => React.ReactNode
}

export function Table<T extends Record<string, any> = {}>({
  rowKey,
  columns,
  data,
  rowRender,
}: TableProps<T>) {
  const defaultRowRender = useCallback(
    (record: T, recordIndex: number) => {
      return (
        <tr key={rowKey ? rowKey(record) : recordIndex}>
          {columns.map((col) => (
            <td
              key={col.key}
              style={{
                width: col.width,
                maxWidth: col.width,
                ...(col.ellipsis && {
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }),
                textAlign: col.align,
              }}
            >
              {col.render
                ? col.render(record[col.key], record)
                : record[col.key]}
            </td>
          ))}
        </tr>
      )
    },
    [rowKey, columns]
  )

  return (
    <div className="Table">
      <div className="Table_Wrapper">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  style={{
                    width: col.width,
                    textAlign: col.align,
                  }}
                  key={col.key}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((record, recordIndex) =>
              rowRender ? (
                <Fragment key={rowKey ? rowKey(record) : recordIndex}>
                  {rowRender(defaultRowRender(record, recordIndex), record)}
                </Fragment>
              ) : (
                <Fragment key={rowKey ? rowKey(record) : recordIndex}>
                  {defaultRowRender(record, recordIndex)}
                </Fragment>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
