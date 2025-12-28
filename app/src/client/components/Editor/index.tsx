import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckIcon, CircleXIcon, FilesIcon, RefreshCcwIcon } from 'lucide-react'
import { toast } from 'sonner'
import copy from 'copy-to-clipboard'
import { basicSetup, EditorView } from 'codemirror'
import { json } from '@codemirror/lang-json'
import { EditorState, Compartment, Prec } from '@codemirror/state'
import { Box } from '@client/components/ui/Box'
import { IconButton } from '@client/components/ui/Button'
import { Select } from '@client/components/ui/Select'
import { Tooltip } from '@client/components/ui/Tooltip'
import { cn } from '@client/utils/cn'
import s from './index.module.scss'

interface EditorProps {
  value?: string
  height?: string
  onChange?: (value: string) => void
  onSave?: () => void
  onRefresh?: () => void
}

const languageExtension = new Compartment()

export const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  height,
  onSave,
  onRefresh,
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
        return value
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
        EditorView.lineWrapping,
      ],
    })
  }, [])

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
      border="1px solid var(--border-color)"
      borderRadius="var(--border-radius)"
      {...restProps}
      className={s.EditorRoot}
    >
      <Box className={s.EditorToolbar}>
        <Box width="10rem">
          <Select
            value={language}
            options={options}
            onChange={onChangeLanguage}
          />
        </Box>
        <Tooltip className={s.EditorToolbarTooltip} content="Copy value">
          <IconButton variant="ghost" onClick={onCopy}>
            <FilesIcon />
          </IconButton>
        </Tooltip>

        <Tooltip className={s.EditorToolbarTooltip} content="Refresh value">
          <IconButton
            variant="ghost"
            onClick={() => {
              onRefresh?.()
            }}
          >
            <RefreshCcwIcon />
          </IconButton>
        </Tooltip>

        <Box display="flex" alignItems="center" marginLeft="auto">
          {onSave && (
            <IconButton variant="ghost" onClick={onSave}>
              <CheckIcon />
            </IconButton>
          )}
          {editorError && (
            <Tooltip className={s.EditorErrorTooltip} content={editorError}>
              <IconButton variant="ghost">
                <CircleXIcon color="var(--danger-color)" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
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
    </Box>
  )
}
