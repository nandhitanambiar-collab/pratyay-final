import { useContext } from 'react';
import { ReviewContext } from '../context/ReviewContextInstance';

export const useReviews = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviews must be used within a ReviewProvider');
  }
  return context;
};
