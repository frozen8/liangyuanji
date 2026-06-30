import type { Task } from '@/types/task';
import { mockTasksRef } from './_mockTasksRef';

export default function getTasks(data?: { status?: string; category?: string }): Promise<{ tasks: Task[] }> {
  let tasks = mockTasksRef;
  if (data?.status && data.status !== 'all') {
    tasks = tasks.filter((t) => t.status === data.status);
  }
  if (data?.category && data.category !== 'all') {
    tasks = tasks.filter((t) => t.category === data.category);
  }
  return Promise.resolve({ tasks });
}
