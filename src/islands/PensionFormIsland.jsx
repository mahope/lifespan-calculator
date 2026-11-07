import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import { PensionForm } from '../views/PensionsalderPage';

// Island on /pensionsalder (client:load): only the form and its result hydrate.
const PensionFormIsland = () => (
  <ErrorBoundary>
    <PensionForm />
  </ErrorBoundary>
);

export default PensionFormIsland;
