import { useRef } from 'react'
import { Box } from '../Box'
import { Button, IconButton } from '../Button'
import { Input } from '../Input'
import './index.scss'
import { XIcon } from 'lucide-react'
import { toast } from 'sonner'

interface FileInputPorps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

export const FileInput: React.FC<FileInputPorps> = ({
  value,
  onChange,
  placeholder = 'Please Upload File',
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const displayName = value ? value.split('/').pop() : ''

  const onUpload = async (file: File) => {
    if (file.size >= 2 * 1024 * 1024 /** 2M */) {
      toast.error('The File Size Exceeds 2MB.')
      return
    }

    const formData = new FormData()
    formData.set('file', file)

    toast.promise(
      fetch('/upload', {
        method: 'POST',
        body: formData,
      }).then((res) => res.json()),
      {
        loading: 'Loading...',
        success: ({ url }: { url: string }) => {
          onChange?.(url)
          return 'Upload File Successfully'
        },
        error: (e: any) => e.message || 'Upload File Failed',
      }
    )
  }

  return (
    <Box className="FileInput">
      <Input
        ref={inputRef}
        hidden
        type="file"
        onChange={(e) => {
          const [file] = e.target.files || []
          if (file) {
            onUpload(file)
          }
        }}
      />
      <Button
        data-placeholder={Boolean(placeholder && !displayName)}
        variant="outline"
        className="FileInputButton"
        onClick={() => inputRef.current?.click()}
      >
        {displayName || placeholder}
      </Button>
      {value && (
        <IconButton
          className="FileInputCloseIcon"
          variant="ghost"
          onClick={() => {
            onChange?.('')
            if (inputRef.current) {
              inputRef.current.value = ''
            }
          }}
        >
          <XIcon />
        </IconButton>
      )}
    </Box>
  )
}
