import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { TabProvider } from './contexts/TabContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TabProvider>
      <App />
    </TabProvider>
  </React.StrictMode>
)
