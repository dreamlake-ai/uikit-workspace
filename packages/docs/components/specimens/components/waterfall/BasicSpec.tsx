import { Waterfall, type LogItemType } from "@dreamlake/uikit";
import {
  Bot,
  CheckCircle2,
  FileCode2,
  History,
  Info,
  PauseCircle,
} from "lucide-react";

// A small run trace: one root task, a couple of attempts, and the steps
// inside them. Rows with `startTime` + `duration` render as bars; rows with
// a bare `time` render as instant event dots.
const logData: LogItemType[] = [
  {
    id: "run",
    parentId: null,
    label: "agent run",
    etype: "task",
    startTime: 0,
    duration: 9.4,
    color: "purple",
  },
  {
    id: "plan",
    parentId: "run",
    label: "plan + tool select",
    etype: "step",
    startTime: 0.2,
    duration: 1.1,
    color: "blue",
  },
  {
    id: "attempt-1",
    parentId: "run",
    label: "attempt 1",
    etype: "attempt",
    startTime: 1.4,
    duration: 3.2,
    color: "orange",
  },
  {
    id: "fetch",
    parentId: "attempt-1",
    label: "fetch context",
    etype: "step",
    startTime: 1.5,
    duration: 1.3,
    color: "blue",
  },
  {
    id: "tool-call",
    parentId: "attempt-1",
    label: "run tool: search",
    etype: "step",
    startTime: 2.9,
    duration: 1.5,
    color: "green",
  },
  {
    id: "halt",
    parentId: "attempt-1",
    label: "rate limited — halted",
    etype: "info",
    time: 4.6,
    color: "orange",
    isHaltedStep: true,
  },
  {
    id: "attempt-2",
    parentId: "run",
    label: "attempt 2",
    etype: "attempt",
    startTime: 4.9,
    duration: 4.3,
    color: "green",
  },
  {
    id: "fetch-2",
    parentId: "attempt-2",
    label: "fetch context",
    etype: "step",
    startTime: 5.0,
    duration: 1.2,
    color: "blue",
  },
  {
    id: "generate",
    parentId: "attempt-2",
    label: "generate answer",
    etype: "step",
    startTime: 6.3,
    duration: 2.6,
    color: "purple",
  },
  {
    id: "checkpoint",
    parentId: "attempt-2",
    label: "checkpoint saved",
    etype: "info",
    time: 7.1,
    color: "gray-medium",
  },
  {
    id: "done",
    parentId: "run",
    label: "run complete",
    etype: "info",
    time: 9.3,
    color: "green",
  },
];

const getIcon = (item: LogItemType) => {
  if (item.isHaltedStep) return <PauseCircle size={14} />;
  switch (item.etype) {
    case "task":
      return <History size={14} />;
    case "attempt":
      return <Bot size={14} />;
    case "step":
      return <FileCode2 size={14} />;
    case "info":
      return item.id === "done" ? (
        <CheckCircle2 size={14} />
      ) : (
        <Info size={14} />
      );
    default:
      return <Info size={14} />;
  }
};

export const BasicSpec = () => (
  <div style={{ height: 360 }}>
    <Waterfall logData={logData} getIcon={getIcon} panelWidth={220} />
  </div>
);
