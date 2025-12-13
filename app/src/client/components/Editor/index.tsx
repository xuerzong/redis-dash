import { useEffect, useMemo, useRef, useState } from 'react'
import { FilesIcon, XCircleIcon } from 'lucide-react'
import { toast } from 'sonner'
import copy from 'copy-to-clipboard'
import { basicSetup, EditorView } from 'codemirror'
import { json } from '@codemirror/lang-json'
import { EditorState, Compartment, Prec } from '@codemirror/state'
import { Box } from '@client/components/ui/Box'
import { IconButton } from '@client/components/ui/Button'
import { Select } from '@client/components/ui/Select'
import { cn } from '@client/utils/cn'
import s from './index.module.scss'

interface EditorProps {
  value?: string
  onChange?: (value: string) => void
  height?: string
}

const languageExtension = new Compartment()

export const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  height,
  ...restProps
}) => {
  const editorViewerRef = useRef<EditorView>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const [language, setLanguage] = useState('plaintext')
  const [hasFocused, setHasFocused] = useState(false)
  const [editorError, setEditorError] = useState('')
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

  const editorValue = useMemo(() => {
    if (!value) {
      return value
    }
    setEditorError('')
    if (language === 'json') {
      try {
        return JSON.stringify(JSON.parse(value), null, 2)
      } catch (e: any) {
        setEditorError(e.message)
      }
    }

    if (language === 'plaintext') {
      try {
        return JSON.stringify(JSON.parse(value))
      } catch (e: any) {
        return value
      }
    }
    return value
  }, [language, value])

  const editorState = useMemo(() => {
    const updateListener = Prec.highest(
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChange) {
          const newValue = update.state.doc.toString()
          try {
            onChange(JSON.stringify(JSON.parse(newValue)))
          } catch {
            onChange(newValue)
          }
        }
      })
    )
    return EditorState.create({
      extensions: [
        basicSetup,
        languageExtension.of([]),
        EditorView.domEventHandlers({
          focus: () => setHasFocused(true),
          blur: () => setHasFocused(false),
          select: (e) => {
            console.log(e)
          },
        }),
        updateListener,
      ],
    })
  }, [language])

  useEffect(() => {
    const view = new EditorView({
      doc: '',
      state: editorState,
      parent: editorRef.current!,
    })

    editorViewerRef.current = view

    return () => {
      view.destroy()
    }
  }, [editorState])

  useEffect(() => {
    const editorViewer = editorViewerRef.current
    if (editorViewer) {
      const currentDoc = editorViewer.state.doc.toString()

      if (editorValue !== currentDoc) {
        editorViewer.dispatch({
          changes: {
            from: 0,
            to: editorViewer.state.doc.length,
            insert: editorValue,
          },
        })
      }
    }
  }, [editorValue])

  useEffect(() => {
    editorViewerRef.current?.dispatch({
      effects: languageExtension.reconfigure([
        ...(language === 'json' ? [json()] : []),
      ]),
    })
  }, [language])

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
    <Box
      position="relative"
      display="flex"
      flexDirection="column"
      gap="0.5rem"
      {...restProps}
    >
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
      <Box
        style={
          {
            '--editor-height': height || '20rem',
          } as any
        }
        className={cn('Editor', s.Editor)}
        ref={editorRef}
        data-focused={hasFocused}
      />
      <Box
        position="absolute"
        display={editorError ? 'flex' : 'none'}
        alignItems="flex-start"
        gap="0.25rem"
        bottom={0}
        left={0}
        zIndex={1}
        colorPalette="danger"
        width="100%"
        padding="0.5rem"
        fontSize="0.75rem"
        lineHeight="1rem"
      >
        <XCircleIcon className={s.EditorErrorIcon} />
        {editorError}
      </Box>
    </Box>
  )
}
