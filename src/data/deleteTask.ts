import { mockTasksRef } from './_mockTasksRef';

export interface DeleteTaskInput {
  taskId: string;
}

export default function deleteTask(data: DeleteTaskInput): Promise<{ ok: true }> {
  const task = mockTasksRef.find((t) => t.id === data.taskId);
  // v1.1 确认：禁止删除已完成任务，仅可归档
  if (task && task.status === 'done') {
    return Promise.reject(new Error('已降服的妖兽不可删除，仅可归档')) as any;
  }
  // mock 模式下从内存数组移除（实际云端会删除记录）
  const idx = mockTasksRef.findIndex((t) => t.id === data.taskId);
  if (idx >= 0) {
    mockTasksRef.splice(idx, 1);
  }
  console.log('[Mock] deleteTask:', data.taskId);
  return Promise.resolve({ ok: true });
}
