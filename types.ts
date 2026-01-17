
export enum TaskStatus {
  PENDING = 'PENDING',
  DOING = 'DOING',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED'
}

export enum Quadrant {
  Q1 = 'Q1', // Important & Urgent (Do Now)
  Q2 = 'Q2', // Important & Not Urgent (Schedule)
  Q3 = 'Q3', // Not Important & Urgent (Delegate)
  Q4 = 'Q4'  // Not Important & Not Urgent (Eliminate)
}

export interface Task {
  id: string;
  title: string;
  quadrant: Quadrant;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  startTime: string;
  endTime: string;
}

export interface TaskLogicResult {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTaskStatus: (id: string, newStatus: TaskStatus) => void;
  updateTaskTitle: (id: string, newTitle: string) => void;
  updateTaskQuadrant: (id: string, newQuadrant: Quadrant) => void;
  progress: {
    done: number;
    doing: number;
    pending: number;
    cancelled: number;
    backlog: number;
    total: number;
  };
}
