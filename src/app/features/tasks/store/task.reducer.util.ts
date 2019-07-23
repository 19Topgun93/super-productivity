// HELPER
// ------
import {DEFAULT_TASK, Task, TaskWithSubTasks, TimeSpentOnDay} from '../task.model';
import {calcTotalTimeSpent} from '../util/calc-total-time-spent';
import {taskAdapter, TaskState} from './task.reducer';

export const getTaskById = (taskId: string, state: TaskState) => {
  if (!state.entities[taskId]) {
    throw new Error('Task not found');
  } else {
    return state.entities[taskId];
  }
};

export const filterOutId = (idToFilterOut) => (id) => id !== idToFilterOut;

export const mapTaskWithSubTasksToTask = (task: TaskWithSubTasks): Task => {
  const copy = {...DEFAULT_TASK, ...task};
  delete copy.subTasks;
  delete copy.issueData;
  return copy;
};

export const filterStartableTasks = (s: TaskState): string[] => {
  return s.ids.filter((id) => {
    const t = s.entities[id];
    return !t.isDone && (
      (t.parentId)
        ? (s.todaysTaskIds.includes(t.parentId))
        : (s.todaysTaskIds.includes(id) && (!t.subTaskIds || t.subTaskIds.length === 0))
    );
  });
};

// SHARED REDUCER ACTIONS
// ----------------------
export const reCalcTimesForParentIfParent = (parentId, state: TaskState): TaskState => {
  const stateWithTimeEstimate = reCalcTimeEstimateForParentIfParent(parentId, state);
  return reCalcTimeSpentForParentIfParent(parentId, stateWithTimeEstimate);
};

export const reCalcTimeSpentForParentIfParent = (parentId, state: TaskState): TaskState => {
  if (parentId) {
    const parentTask: Task = getTaskById(parentId, state);
    const subTasks = parentTask.subTaskIds.map((id) => state.entities[id]);
    const timeSpentOnDayParent = {};

    subTasks.forEach((subTask) => {
      Object.keys(subTask.timeSpentOnDay).forEach(strDate => {
        if (subTask.timeSpentOnDay[strDate]) {
          if (!timeSpentOnDayParent[strDate]) {
            timeSpentOnDayParent[strDate] = 0;
          }
          timeSpentOnDayParent[strDate] += subTask.timeSpentOnDay[strDate];
        }
      });
    });
    return taskAdapter.updateOne({
      id: parentId,
      changes: {
        timeSpentOnDay: timeSpentOnDayParent,
        timeSpent: calcTotalTimeSpent(timeSpentOnDayParent),
      }
    }, state);
  } else {
    return state;
  }
};

export const reCalcTimeEstimateForParentIfParent = (parentId, state: TaskState): TaskState => {
  if (parentId) {
    const parentTask: Task = state.entities[parentId];
    const subTasks = parentTask.subTaskIds.map((id) => state.entities[id]);

    return taskAdapter.updateOne({
      id: parentId,
      changes: {
        timeEstimate: subTasks.reduce((acc, task) => acc + task.timeEstimate, 0),
      }
    }, state);
  } else {
    return state;
  }
};

export const updateTimeSpentForTask = (
  id: string,
  newTimeSpentOnDay: TimeSpentOnDay,
  state: TaskState,
): TaskState => {
  if (!newTimeSpentOnDay) {
    return state;
  }

  const task = getTaskById(id, state);
  const timeSpent = calcTotalTimeSpent(newTimeSpentOnDay);

  const stateAfterUpdate = taskAdapter.updateOne({
    id: id,
    changes: {
      timeSpentOnDay: newTimeSpentOnDay,
      timeSpent: timeSpent,
    }
  }, state);

  return task.parentId
    ? reCalcTimeSpentForParentIfParent(task.parentId, stateAfterUpdate)
    : stateAfterUpdate;
};

export const updateTimeEstimateForTask = (
  taskId: string,
  newEstimate: number = null,
  state: TaskState,
): TaskState => {

  if (!newEstimate) {
    return state;
  }

  const task = getTaskById(taskId, state);
  const stateAfterUpdate = taskAdapter.updateOne({
    id: taskId,
    changes: {
      timeEstimate: newEstimate,
    }
  }, state);

  return task.parentId
    ? reCalcTimeEstimateForParentIfParent(task.parentId, stateAfterUpdate)
    : stateAfterUpdate;
};

export const deleteTask = (state: TaskState,
                           taskToDelete: TaskWithSubTasks | Task): TaskState => {
  let stateCopy: TaskState = taskAdapter.removeOne(taskToDelete.id, state);

  let currentTaskId = (state.currentTaskId === taskToDelete.id) ? null : state.currentTaskId;

  // PARENT TASK side effects
  // also delete from parent task if any
  if (taskToDelete.parentId) {
    const parentTask = state.entities[taskToDelete.parentId];
    const isWasLastSubTask = (parentTask.subTaskIds.length === 1);
    stateCopy = taskAdapter.updateOne({
      id: taskToDelete.parentId,
      changes: {
        subTaskIds: stateCopy.entities[taskToDelete.parentId].subTaskIds
          .filter(filterOutId(taskToDelete.id)),

        // copy over sub task time stuff if it was the last sub task
        ...(
          (isWasLastSubTask)
            ? {
              timeSpentOnDay: taskToDelete.timeSpentOnDay,
              timeEstimate: taskToDelete.timeEstimate,
            }
            : {}
        )
      }
    }, stateCopy);
    // also update time spent for parent if it was not copied over from sub task
    if (!isWasLastSubTask) {
      stateCopy = reCalcTimeSpentForParentIfParent(taskToDelete.parentId, stateCopy);
      stateCopy = reCalcTimeEstimateForParentIfParent(taskToDelete.parentId, stateCopy);
    }
  }

  // SUB TASK side effects
  // also delete all sub tasks if any
  if (taskToDelete.subTaskIds) {
    stateCopy = taskAdapter.removeMany(taskToDelete.subTaskIds, stateCopy);
    // unset current if one of them is the current task
    currentTaskId = taskToDelete.subTaskIds.includes(currentTaskId) ? null : currentTaskId;
  }

  return {
    ...stateCopy,
    // finally delete from backlog or todays tasks
    backlogTaskIds: state.backlogTaskIds.filter(filterOutId(taskToDelete.id)),
    todaysTaskIds: state.todaysTaskIds.filter(filterOutId(taskToDelete.id)),
    currentTaskId,
    stateBefore: {...state, stateBefore: null}
  };
};


export const moveItemInList = (itemId: string, completeList: string[], partialList: string[], emptyListVal = 0): string[] => {
  let newIndex;
  const curInUpdateListIndex = partialList.indexOf(itemId);
  const prevItemId = partialList[curInUpdateListIndex - 1];
  const nextItemId = partialList[curInUpdateListIndex + 1];
  const newCompleteList = completeList.filter((id) => id !== itemId);

  if (prevItemId) {
    newIndex = newCompleteList.indexOf(prevItemId) + 1;
  } else if (nextItemId) {
    newIndex = newCompleteList.indexOf(nextItemId);
  } else if (partialList.length === 1) {
    newIndex = emptyListVal;
  } else {
    throw new Error('Drop Model Error');
  }

  newCompleteList.splice(newIndex, 0, itemId);
  return newCompleteList;
};
