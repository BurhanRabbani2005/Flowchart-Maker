import {
  FLOWCHART_FILE_VERSION,
  type FlowchartDocument,
} from "@/lib/flowchartFile";

/** Empty flowchart used when creating a new file. */
export function emptyDocument(): FlowchartDocument {
  return {
    version: FLOWCHART_FILE_VERSION,
    shapes: [],
    connections: [],
  };
}
