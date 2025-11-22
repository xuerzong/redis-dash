import { useEffect, useMemo, useRef, useState } from 'react'
import { FilesIcon } from 'lucide-react'
import { toast } from 'sonner'
import copy from 'copy-to-clipboard'
import { basicSetup, EditorView } from 'codemirror'
import { json } from '@codemirror/lang-json'
import { EditorState, Compartment, Prec } from '@codemirror/state'
import { Box } from '@/client/components/ui/Box'
import { IconButton } from '@/client/components/ui/Button'
import { Select } from '@/client/components/ui/Select'
import s from './index.module.scss'

interface EditorProps {
  value?: string
  onChange?: (value: string) => void
}

const languageExtension = new Compartment()

export const Editor: React.FC<EditorProps> = ({ value, onChange }) => {
  const editorViewerRef = useRef<EditorView>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const [language, setLanguage] = useState('plaintext')
  const [hasFocused, setHasFocused] = useState(false)
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

  const editorState = useMemo(() => {
    const updateListener = Prec.highest(
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChange) {
          const newValue = update.state.doc.toString()
          onChange(newValue)
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
        }),
        updateListener,
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

      if (value !== currentDoc) {
        editorViewer.dispatch({
          changes: {
            from: 0,
            to: editorViewer.state.doc.length,
            insert: value,
          },
        })
      }
    }
  }, [value])

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
      <Box className={s.Editor} ref={editorRef} data-focused={hasFocused} />
    </Box>
  )
}
