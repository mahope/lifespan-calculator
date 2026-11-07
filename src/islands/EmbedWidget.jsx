import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import EmbedPage from '../views/EmbedPage';

// Island on /embed (client:load).
const EmbedWidget = () => (
  <ErrorBoundary>
    <EmbedPage />
  </ErrorBoundary>
);

export default EmbedWidget;
