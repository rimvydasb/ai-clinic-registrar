import {CellValue, DataItem} from "./objectmodel";

let Yes = CellValue.Yes;
let No = CellValue.No;
let any = CellValue.Any;

export const REGISTRATION_TABLE_NAME: string = "ai-clinic-registrar-table";

export const AGENT_GREETING: string = "Hello, I'm the doctor's assistant. How can I help you?";
export const AGENT_APOLOGY: string = "I'm sorry, I didn't understand you. Please repeat.";

export const REGISTRATION_CLIENT_DATA: DataItem[] = [
    DataItem.empty("name", "user's name"),
    DataItem.empty("telephone", "user's telephone number"),
];

export const CLIENT_SYMPTOMS_DATA: DataItem[] = [
    DataItem.emptyBoolean("pain", "does user feel pain?"),
    DataItem.emptyBoolean("weakness", "does user feel dizziness, fainting or weakness?"),
    DataItem.emptyBoolean("nausea", "does user feel nausea or wants to vomit?"),
    DataItem.emptyBoolean("runningBlood", "does user see blood or have running blood?"),
];

export const PRIORITY_DECISION_TABLE = [
    ["symptomsCount", "pain", "weakness", "nausea", "runningBlood", "priority"],
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
