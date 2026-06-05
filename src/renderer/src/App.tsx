import React from 'react'
import { AppLayout } from './components/Layout/AppLayout'
import { SettingsModal } from './components/Settings/SettingsModal'
import { WebContextMenu } from './components/ContextMenu/WebContextMenu'

class ErrorBoundary extends React.Component<any, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError)
      return (
        <div
          style={{
            color: 'red',
            padding: 20,
            background: 'black',
            height: '100vh',
            overflow: 'auto'
          }}
        >
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      )
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AppLayout />
      <SettingsModal />
      <WebContextMenu />
    </ErrorBoundary>
  )
}

export default App
