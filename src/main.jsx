import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './lib/AuthContext.jsx';

// Importy z Fluent UI
import { FluentProvider, webLightTheme } from '@fluentui/react-components';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme}> {/* <-- Opakowujemy wszystko */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </FluentProvider>
  </React.StrictMode>,
);