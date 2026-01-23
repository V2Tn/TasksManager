// Fix: Import React to provide access to React.Dispatch and React.SetStateAction types
import React from 'react';

export enum TaskStatus {
  PENDING = 'PENDING',
  DOING = 'DOING',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED'
}

export enum Quadrant {
  Q1 = 'Q1', // Important & Urgent
  Q2 = 'Q2', // Important & Not Urgent
  Q3 = 'Q3', // Not Important & Urgent
  Q4 = 'Q4'  // Not Important & Not Urgent
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  INTERN = 'INTERN'
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  isManager?: boolean;
  departmentId?: string; // ID phòng ban của user
}

export interface StaffMember {
  id: number;
  fullName: string;
  username: string;
  password?: string;
  role: UserRole;
  email: string;
  phone: string;
  active: boolean;
  department?: string;
  joinDate?: string;
  isManager?: boolean;
}

export interface Department {
  id: number;
  name: string;
  code?: string;
  description: string;
  createdAt: string;
  managerId?: number;
}

export interface Task {
  id: number;
  title: string;
  initialQuadrant: Quadrant; // Original quadrant at creation
  quadrant: Quadrant;        // Current quadrant
  status: TaskStatus;
  createdAt: string;         // ISO timestamp
  createdAtDisplay: string;  // Formatted string (HH:mm DD/MM[/YYYY])
  updatedAt: string;         // ISO timestamp
  startTime: string;
  endTime: string;
  createdById: number;
  createdByLabel: string;
  assigneeId: number;
  assigneeLabel: string;
  logs: string[];            // History of changes
}

export interface TaskLogicResult {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'createdAtDisplay' | 'updatedAt' | 'logs' | 'initialQuadrant'>) => Task;
  updateTaskStatus: (id: number, newStatus: TaskStatus, userName: string) => void;
  updateTaskTitle: (id: number, newTitle: string, userName: string) => void;
  updateTaskQuadrant: (id: number, newQuadrant: Quadrant, userName: string) => void;
  deleteTask: (id: number) => Task | undefined;
  progress: {
    done: number;
    doing: number;
    pending: number;
    cancelled: number;
    backlog: number;
    total: number;
  };
}