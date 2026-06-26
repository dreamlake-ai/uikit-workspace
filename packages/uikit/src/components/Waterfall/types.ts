import { type TreeDataItem } from "../TreeView/types";

/** A timeline row: an instant event (`time`) or a duration bar
 *  (`startTime` + `duration`). */
export type LogItemType = TreeDataItem & {
  etype: "task" | "attempt" | "info" | "step";
  icon?: "history" | "file-code" | "bot" | "check-circle" | "pause-circle";
  createTime?: number;
  startTime?: number;
  duration?: number;
  time?: number;
  color?: "blue" | "green" | "orange" | "gray-light" | "gray-medium" | "purple";
  isCollapsible?: boolean;
  hasStripes?: boolean;
  isHaltedStep?: boolean;
};

export interface LogItemWithMeta extends LogItemType {
  isLast: boolean;
  ancestors: LogItemType[];
}
