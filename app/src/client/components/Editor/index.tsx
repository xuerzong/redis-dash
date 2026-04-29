import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckIcon, CircleXIcon, FilesIcon, RefreshCcwIcon } from 'lucide-react'
import { toast } from 'sonner'
import copy from 'copy-to-clipboard'
import { basicSetup, EditorView } from 'codemirror'
import { json } from '@codemirror/lang-json'
import { EditorState, Compartment, Prec } from '@codemirror/state'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { Box } from '@client/components/ui/Box'
import { IconButton } from '@client/components/ui/Button'
import { Select } from '@client/components/ui/Select'
import { Tooltip } from '@client/components/ui/Tooltip'
import { useThemeContext } from '@client/providers/ThemeProvider'
import type { Theme } from '@client/themes'
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
const themeExtension = new Compartment()

const toAlphaColor = (rgb: string, alpha: number) => {
  return `rgb(${rgb} / ${alpha})`
}

const createCodeTheme = (theme: Theme, displayTheme: 'dark' | 'light') => {
  const tokenPalette = theme.editorColors ?? {
    propertyName: theme.tagColors.hash,
    string: theme.tagColors.string,
    number: theme.tagColors.set,
    literal: theme.tagColors.stream,
    keyword: theme.tagColors.list,
    escape: theme.tagColors.zset,
    bracket: theme.baseColors.primary,
    punctuation: toAlphaColor(theme.baseColors.foreground, 0.72),
    invalid: theme.baseColors.danger,
  }

  const editorTheme = EditorView.theme(
    {
      '&': {
        color: `rgb(${theme.baseColors.foreground})`,
        backgroundColor: `rgb(${theme.baseColors.background})`,
      },
      '.cm-scroller': {
        fontFamily: 'var(--font-mono)',
      },
      '.cm-content, .cm-gutter': {
        caretColor: `rgb(${theme.baseColors.foreground})`,
      },
      '.cm-focused': {
        outline: 'none',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: `rgb(${theme.baseColors.foreground})`,
      },
      '.cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: toAlphaColor(theme.baseColors.primary, 0.18),
      },
      '.cm-panels': {
        backgroundColor: `rgb(${theme.baseColors.background})`,
        color: `rgb(${theme.baseColors.foreground})`,
      },
      '.cm-gutters': {
        backgroundColor: `rgb(${theme.baseColors.background})`,
        color: `rgb(${theme.baseColors.foreground} / 0.6)`,
        borderRight: `1px solid rgb(${theme.baseColors.secondary})`,
      },
      '.cm-activeLine': {
        backgroundColor: toAlphaColor(theme.baseColors.muted, 0.45),
      },
      '.cm-activeLineGutter': {
        backgroundColor: toAlphaColor(theme.baseColors.muted, 0.45),
      },
      '.cm-tooltip': {
        color: `rgb(${theme.baseColors.foreground})`,
        backgroundColor: `rgb(${theme.baseColors.background})`,
        border: `1px solid rgb(${theme.baseColors.secondary})`,
      },
      '.cm-tooltip-autocomplete ul li[aria-selected]': {
        backgroundColor: toAlphaColor(theme.baseColors.primary, 0.14),
        color: `rgb(${theme.baseColors.foreground})`,
      },
      '.cm-searchMatch': {
        backgroundColor: toAlphaColor(theme.baseColors.warning, 0.2),
        outline: `1px solid ${toAlphaColor(theme.baseColors.warning, 0.38)}`,
      },
      '.cm-searchMatch.cm-searchMatch-selected': {
        backgroundColor: toAlphaColor(theme.baseColors.warning, 0.32),
      },
      '.cm-matchingBracket, .cm-nonmatchingBracket': {
        color: `rgb(${theme.baseColors.primary})`,
        outline: `1px solid ${toAlphaColor(theme.baseColors.primary, 0.4)}`,
      },
    },
    { dark: displayTheme === 'dark' }
  )

  const highlightTheme = HighlightStyle.define([
    {
      tag: [tags.propertyName],
      color: `rgb(${tokenPalette.propertyName})`,
    },
    {
      tag: [tags.string],
      color: `rgb(${tokenPalette.string})`,
    },
    {
      tag: [tags.number, tags.integer, tags.float],
      color: `rgb(${tokenPalette.number})`,
    },
    {
      tag: [tags.bool, tags.null],
      color: `rgb(${tokenPalette.literal})`,
      fontWeight: '600',
    },
    {
      tag: [tags.keyword, tags.separator],
      color: `rgb(${tokenPalette.keyword})`,
    },
    {
      tag: [tags.brace, tags.squareBracket],
      color: `rgb(${tokenPalette.bracket})`,
    },
    {
      tag: [tags.punctuation],
      color: tokenPalette.punctuation,
    },
    {
      tag: [tags.escape],
      color: `rgb(${tokenPalette.escape})`,
      fontWeight: '600',
    },
    {
      tag: [tags.invalid],
      color: `rgb(${tokenPalette.invalid})`,
      textDecoration: 'underline wavy',
    },
  ])

  return [editorTheme, syntaxHighlighting(highlightTheme)]
}

export const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  height,
  onSave,
  onRefresh,
  ...restProps
}) => {
  const { theme, displayTheme } = useThemeContext()
  const onChangeRef = useRef(onChange)
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

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

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
        if (update.docChanged && onChangeRef.current) {
          const newValue = update.state.doc.toString()
          try {
            onChangeRef.current(JSON.stringify(JSON.parse(newValue)))
          } catch {
            onChangeRef.current(newValue)
          }
        }
      })
    )
    return EditorState.create({
      extensions: [
        basicSetup,
        languageExtension.of([]),
        themeExtension.of([]),
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

  useEffect(() => {
    editorViewerRef.current?.dispatch({
      effects: themeExtension.reconfigure(createCodeTheme(theme, displayTheme)),
    })
  }, [displayTheme, theme])

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
      className={cn('EditorRoot', s.EditorRoot)}
    >
      <Box className={cn('EditorToolbar', s.EditorToolbar)}>
        <Box width="10rem">
          <Select
            value={language}
            options={options}
            onChange={onChangeLanguage}
          />
        </Box>
        <Tooltip
          className={cn('EditorToolbarTooltip', s.EditorToolbarTooltip)}
          content="Copy value"
        >
          <IconButton variant="ghost" onClick={onCopy}>
            <FilesIcon />
          </IconButton>
        </Tooltip>

        <Tooltip
          className={cn('EditorToolbarTooltip', s.EditorToolbarTooltip)}
          content="Refresh value"
        >
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
