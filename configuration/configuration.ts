import {CellValue, DataItem, DataItemType} from "../lib/objectmodel";

let Yes = CellValue.Yes;
let No = CellValue.No;
let any = CellValue.Any;

export const REGISTRATION_TABLE_NAME: string = "ai-clinic-registrar-table";

export const AGENT_GREETING: string = "Hello, I'm the doctor's assistant. How can I help you?";

export const REGISTRATION_CLIENT_DATA: DataItem[] = [
    new DataItem("name", "user's name"),
    new DataItem("telephone", "user's telephone number"),
];

export const CLIENT_SYMPTOMS_DATA: DataItem[] = [
    new DataItem("pain", "does user feel pain?", null, DataItemType.Boolean),
    new DataItem("dizziness", "does user feel dizziness?", null, DataItemType.Boolean),
    new DataItem("nausea", "does user feel nausea?", null, DataItemType.Boolean),
    new DataItem("runningBlood", "does user see blood?", null, DataItemType.Boolean),
];

export const PRIORITY_DECISION_TABLE = [
    ["symptomsCount", "pain", "dizziness", "nausea", "runningBlood", "priority"],
    [4, Yes, Yes, Yes, Yes, "RED"],
    [3, any, Yes, Yes, Yes, "RED"],
    [3, Yes, any, Yes, Yes, "RED"],
    [2, any, any, Yes, Yes, "RED"],
    [2, any, any, any, any, "MEDIUM"],
    [1, any, any, any, any, "LOW"],
    [0, No, No, No, No, "LOW_REMOTE"]
];

export const WORKING_HOURS = {
    "Monday": {
        "start": "08:00",
        "end": "18:00",
        "note": "lunch break 12:00-13:00"
    },
    "Tuesday": {
        "start": "08:00",
        "end": "18:00",
        "note": "lunch break 12:00-13:00"

    },
    "Wednesday": {
        "start": "08:00",
        "end": "18:00",
        "note": "lunch break 12:00-13:00"
    },
    "Thursday": {
        "start": "08:00",
        "end": "18:00",
        "note": "lunch break 12:00-13:00"
    },
    "Friday": {
        "start": "08:00",
        "end": "18:00",
        "note": "lunch break 12:00-13:00"
    },
    "Saturday": {
        "start": "10:00",
        "end": "14:00",
        "note": "reduced working hours"
    },
    "Sunday": {
        "start": "10:00",
        "end": "12:00",
        "note": "reduced working hours, only extra patients"
    }
};
