import React from "react";

declare module "react-papaparse" {
  interface RemoveProps {
    color?: string;
    width?: number;
    height?: number;
  }

  interface CSVReaderChildrenProps {
    acceptedFile: File | null;
    getRemoveFileProps: () => { onClick: () => void };
    getRootProps: () => {
      onClick: (event: React.MouseEvent) => void;
      onDrop: (event: React.DragEvent) => void;
    };
    ProgressBar: React.FC;
    Remove: React.ComponentType<RemoveProps>;
  }

  export const CSVReader: React.FC<{
    children: (params: CSVReaderChildrenProps) => React.ReactNode;
  }>;
}
