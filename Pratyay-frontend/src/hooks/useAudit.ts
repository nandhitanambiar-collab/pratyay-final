import { useContext } from 'react';
import { AuditContext } from '../context/AuditContextInstance';

export const useAudit = () => {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
};
