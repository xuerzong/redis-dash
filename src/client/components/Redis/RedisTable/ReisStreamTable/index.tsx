import { RedisTableViewer } from '../RedisBaseTable'

interface RedisStreamTableProps {
  dataSource: any[]
  length: number
}

export const RedisStreamTable: React.FC<RedisStreamTableProps> = (props) => {
  return (
    <RedisTableViewer
      rowKey={(row) => row['id']}
      columns={[
        {
          key: 'id',
          label: 'Id',
          width: '40%',
        },
        {
          key: 'value',
          label: 'Value',
          width: '60%',
        },
      ]}
      fields={[
        {
          name: 'id',
          label: 'Id',
          type: 'input',
        },
        {
          name: 'value',
          label: 'Value',
          type: 'editor',
        },
      ]}
      {...props}
    />
  )
}
