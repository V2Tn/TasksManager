
import { TaskStatus } from '../types';

export type ActionType = 'START' | 'DONE' | 'CANCEL' | 'REDO';

export const getAvailableActions = (status: TaskStatus): ActionType[] => {
  switch (status) {
    case TaskStatus.PENDING:
      return ['START', 'DONE', 'CANCEL'];
    case TaskStatus.DOING:
      return ['DONE', 'CANCEL'];
    case TaskStatus.DONE:
      return ['REDO'];
    case TaskStatus.CANCELLED:
      return ['DONE', 'START', 'REDO'];
    default:
      return [];
  }
};
