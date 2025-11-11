import { useState } from 'react'
import { Select } from '@/client/components/ui/Select'
import { FilesIcon } from 'lucide-react'
import { toast } from 'sonner'
import copy from 'copy-to-clipboard'
import { Box } from '@/client/components/ui/Box'
import { IconButton } from '@/client/components/ui/Button'
import { Editor as MonacoEditor } from '@monaco-editor/react'
import { useDarkMode } from '@/client/hooks/useDarkMode'
import s from './index.module.scss'

interface EditorProps {
  value?: string
  onChange?: (value: string) => void
}

export const Editor: React.FC<EditorProps> = ({ value, onChange }) => {
  const [language, setLanguage] = useState('plaintext')
  const darkMode = useDarkMode()
  const options = [
    {
      label: 'PlainText',
      value: 'plaintext',
    },
    {
      label: 'JSON',
      value: 'json',
    },
  ]

  const onChangeLanguage = (lang: string) => {
    setLanguage(lang)
  }

  const onCopy = () => {
    const copyText = value
    if (copyText) {
      copy(copyText)
      toast.success('Copy success')
    }
  }

  return (
    <Box display="flex" flexDirection="column" gap="0.5rem">
      <Box display="flex" gap="0.5rem">
        <Box width="10rem">
          <Select
            value={language}
            options={options}
            onChange={onChangeLanguage}
          />
        </Box>
        <IconButton variant="ghost" onClick={onCopy}>
          <FilesIcon />
        </IconButton>
      </Box>
      <Box className={s.Editor}>
        <MonacoEditor
          value={value}
          onChange={(e) => {
            onChange?.(e || '')
          }}
          theme={darkMode ? 'vs-dark' : 'vs'}
          language={language}
          options={{
            lineNumbers: 'off',
            minimap: { enabled: false },
            renderLineHighlight: 'none',
            lineDecorationsWidth: 0,
            contextmenu: false,
            padding: {
              top: 8,
              bottom: 8,
            },
            fontSize: 16,
          }}
          loading={null}
        />
      </Box>
    </Box>
  )
}
