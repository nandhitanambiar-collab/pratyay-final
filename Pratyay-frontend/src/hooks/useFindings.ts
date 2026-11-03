import { useContext } from 'react';
import { FindingContext } from '../context/FindingContextInstance';

export const useFindings = () => {
  const context = useContext(FindingContext);
  if (!context) {
    throw new Error('useFindings must be used within a FindingProvider');
  }
  return context;
};
