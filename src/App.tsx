import { useState, CSSProperties } from "react";

import {
  formatFileSize,
  lightenDarkenColor,
  useCSVDownloader,
  useCSVReader,
} from "react-papaparse";

import "./App.css";

const GREY = "#CCC";
const GREY_LIGHT = "rgba(255, 255, 255, 0.4)";
const DEFAULT_REMOVE_HOVER_COLOR = "#A01919";
const REMOVE_HOVER_COLOR_LIGHT = lightenDarkenColor(
  DEFAULT_REMOVE_HOVER_COLOR,
  40
);
const GREY_DIM = "#686868";

const styles = {
  zone: {
    alignItems: "center",
    border: `2px dashed ${GREY}`,
    borderRadius: 20,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    justifyContent: "center",
    padding: 20,
  } as CSSProperties,
  file: {
    background: "linear-gradient(to bottom, #EEE, #DDD)",
    borderRadius: 20,
    display: "flex",
    height: 120,
    width: 120,
    position: "relative",
    zIndex: 10,
    flexDirection: "column",
    justifyContent: "center",
  } as CSSProperties,
  info: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    paddingLeft: 10,
    paddingRight: 10,
  } as CSSProperties,
  size: {
    backgroundColor: GREY_LIGHT,
    borderRadius: 3,
    marginBottom: "0.5em",
    justifyContent: "center",
    display: "flex",
  } as CSSProperties,
  name: {
    backgroundColor: GREY_LIGHT,
    borderRadius: 3,
    fontSize: 12,
    marginBottom: "0.5em",
  } as CSSProperties,
  progressBar: {
    bottom: 14,
    position: "absolute",
    width: "100%",
    paddingLeft: 10,
    paddingRight: 10,
  } as CSSProperties,
  zoneHover: {
    borderColor: GREY_DIM,
  } as CSSProperties,
  default: {
    borderColor: GREY,
  } as CSSProperties,
  remove: {
    height: 23,
    position: "absolute",
    right: 6,
    top: 6,
    width: 23,
  } as CSSProperties,
};

interface InputError {
  type: string;
  code: string;
  message: string;
  row: number;
}

interface InputMeta {
  delimiter: string;
  linebreak: string;
  aborted: string;
  fields: Array<string>;
  truncated: string;
}

interface InputRow {
  "Hours Per Week": string;
  "Team Member": string;
  "Department Code": string;
  "Vacation Scheduled Time Off": string;
  "Wage Rate": string;
  SSN: string;
}

interface PayrollRow {
  "Hours Per Week": string;
  "Team Member": string;
  "Department Code": string;
  "Vacation Scheduled Time Off": string;
  "Wage Rate": string;
  SSN: string;
  Completion: string;
  Collection: string;
}

interface InputInterface {
  data: InputRow[];
  errors: Array<InputError[]>;
  meta: InputMeta[];
}

interface RemoveProps {
  className?: string;
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

const censorSsn = (ssn: string): string => {
  if (ssn) {
    const regex = /^(\d{3})-(\d{2})-(\d{4})$/;

    const match = ssn.match(regex);
    if (match) {
      const lastFourDigits = match[3];
      return `XXX-XX-${lastFourDigits}`;
    }
  }

  return "";
};

const transformName = (name: string): string => {
  const newName = name.split(" ").reverse().join(", ");

  return newName;
};

function App() {
  const [payroll, setPayroll] = useState<PayrollRow[]>([]);

  const { CSVReader } = useCSVReader();
  const [zoneHover, setZoneHover] = useState(false);
  const [removeHoverColor, setRemoveHoverColor] = useState(
    DEFAULT_REMOVE_HOVER_COLOR
  );

  const reader = (
    <CSVReader
      onUploadAccepted={(results: InputInterface) => {
        if (results.errors.length > 0) {
          console.error(results.errors[0][0].message);
        }

        const filteredData = results.data.filter(
          (row: InputRow) => row.SSN || row["Hours Per Week"] !== ""
        );
        const newPayroll = filteredData.map((row: InputRow) => ({
          ...row,
          SSN: censorSsn(row?.SSN),
          "Team Member": transformName(row["Team Member"]),
        }));
        newPayroll.sort((a: InputRow, b: InputRow) =>
          a["Team Member"] < b["Team Member"] ? -1 : 1
        );
        setPayroll(
          newPayroll.map((row: InputRow) => ({
            ...row,
            Collection: "",
            Completion: "",
            "Hours Per Week": row["Team Member"]
              .toLowerCase()
              .includes("compton, k")
              ? "40.0"
              : row["Hours Per Week"],
          }))
        );
      }}
      onDragOver={(event: DragEvent) => {
        event.preventDefault();
        setZoneHover(true);
      }}
      onDragLeave={(event: DragEvent) => {
        event.preventDefault();
        setZoneHover(false);
      }}
      config={{ header: true }}
    >
      {({
        acceptedFile,
        getRemoveFileProps,
        getRootProps,
        ProgressBar,
        Remove,
      }: CSVReaderChildrenProps) => (
        <>
          <div
            {...getRootProps()}
            style={Object.assign(
              {},
              styles.zone,
              zoneHover && styles.zoneHover
            )}
          >
            {acceptedFile ? (
              <>
                <div style={styles.file}>
                  <div style={styles.info}>
                    <span style={styles.size}>
                      {formatFileSize(acceptedFile.size)}
                    </span>
                    <span style={styles.name}>{acceptedFile.name}</span>
                    <div style={styles.progressBar}>
                      <ProgressBar />
                    </div>
                    <div
                      {...getRemoveFileProps()}
                      style={styles.remove}
                      onMouseOver={(event) => {
                        event.preventDefault();
                        setRemoveHoverColor(REMOVE_HOVER_COLOR_LIGHT);
                      }}
                      onMouseOut={(event) => {
                        event.preventDefault();
                        setRemoveHoverColor(DEFAULT_REMOVE_HOVER_COLOR);
                      }}
                    >
                      <Remove color={removeHoverColor} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>Drop CSV file here, or click to upload</>
            )}
          </div>
        </>
      )}
    </CSVReader>
  );
  const { CSVDownloader, Type } = useCSVDownloader();
  const downloader = (
    <CSVDownloader
      type={Type.Button}
      filename={"payroll"}
      config={{
        delimiter: ",",
      }}
      data={[...payroll, { "Approved by": " ", "Approved on": " " }]}
      bom
    >
      Download
    </CSVDownloader>
  );

  return (
    <>
      <h1>CSV Transformer</h1>
      <div className="card">
        Upload your CSV file and have it transformed, ready to submit to
        payroll.
      </div>
      {reader}
      {payroll.length ? downloader : null}
    </>
  );
}

export default App;
