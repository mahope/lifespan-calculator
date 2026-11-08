import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import { Calculator } from '../views/HomePage';

// Island on `/` (client:load). The error boundary used to wrap the whole SPA; now it wraps each island.
const HomeCalculator = () => (
  <ErrorBoundary>
    <Calculator />
  </ErrorBoundary>
);

export default HomeCalculator;
