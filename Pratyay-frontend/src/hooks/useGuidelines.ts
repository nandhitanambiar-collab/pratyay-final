import { useContext } from 'react';
import { GuidelineContext } from '../context/GuidelineContextInstance';

export const useGuidelines = () => {
  const context = useContext(GuidelineContext);
  if (!context) {
    throw new Error('useGuidelines must be used within a GuidelineProvider');
  }
  return context;
};
