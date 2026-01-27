
import { useState, useCallback } from 'react';
import { Task, TaskStatus, Quadrant } from '../types';
import { safeJsonParse } from '../actions/authActions';
import { formatSmartDate } from '../actions/taskTimeUtils';

export const useTeamDashboard = () => {
  const [masterTasks, setMasterTasks] = useState<Task[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const resolveServerDate = (dateVal: any): string => {
    if (!dateVal) return new Date().toISOString();
    const num = Number(dateVal);
    if (!isNaN(num) && String(dateVal).length >= 10 && String(dateVal).length <= 13) {
      const timestamp = num < 10000000000 ? num * 1000 : num;
      return new Date(timestamp).toISOString();
    }
    return typeof dateVal === 'string' ? dateVal : new Date().toISOString();
  };

  const normalizeTask = (raw: any): Task => {
    let status = raw.status as TaskStatus;
    const rawStatus = String(raw.status || '').toUpperCase();
    
    if (rawStatus === 'IN_PROGRESS' || rawStatus === 'DOING') status = TaskStatus.DOING;
    else if (rawStatus === 'PENDING') status = TaskStatus.PENDING;
    else if (rawStatus === 'DONE') status = TaskStatus.DONE;
    else if (rawStatus === 'CANCELLED' || rawStatus === 'CANCEL') status = TaskStatus.CANCELLED;
    
    const quadrant = (raw.newQuadrant || raw.quadrant) as Quadrant;
    
    const dateSource = raw.createdAT || raw.createdAt;
    const createdAt = resolveServerDate(dateSource);
    const updatedAt = resolveServerDate(raw.updatedAt || dateSource);

    return {
      ...raw,
      id: Number(raw.id),
      assigneeId: Number(raw.assigneeId),
      createdById: Number(raw.createdById),
      status,
      quadrant,
      createdAt,
      updatedAt,
      createdAtDisplay: formatSmartDate(createdAt),
      logs: Array.isArray(raw.logs) ? raw.logs : (typeof raw.logs === 'string' ? raw.logs.split('\n') : [])
    } as Task;
  };

  const fetchMasterTasks = useCallback(async (url: string, username: string) => {
    if (!url || !url.startsWith('http')) return;
    
    setIsFetching(true);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_fetch_all_tasks',
          user: username,
          timestamp: Math.floor(Date.now() / 1000)
        }),
        mode: 'cors'
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const text = await response.text();
      const result = safeJsonParse(text);

      if (result && result.status === 'success' && result.data) {
        const dataArray = Array.isArray(result.data) ? result.data : [result.data];
        
        const extracted: Task[] = dataArray
          .map((item: any) => {
            // Đào sâu 3 tầng lồng nhau như trong mẫu data của user cung cấp
            const tData = item.data?.data?.data || item.data?.data || item.data?.task || item.task || (item.id ? item : null);
            return tData ? normalizeTask(tData) : null;
          })
          .filter((t: any): t is Task => t !== null);
          
        setMasterTasks(extracted);
      }
    } catch (error) {
      console.error("Team Dashboard Fetch Error:", error);
    } finally {
      setIsFetching(false);
    }
  }, []);

  return { masterTasks, fetchMasterTasks, isFetching };
};
