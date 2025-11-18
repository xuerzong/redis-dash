import React from 'react'

interface State {
  hasError: boolean
  error: any
  errorInfo: any
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    fallback?: React.ReactNode
  }>,
  State
> {
  constructor(props: any) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  componentDidCatch(error: any, errorInfo: any) {
    this.setState({
      hasError: true,
      error,
      errorInfo,
    })
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || null
    }
    return this.props.children
  }
}
