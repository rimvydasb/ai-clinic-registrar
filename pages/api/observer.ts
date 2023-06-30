import {NextApiRequest} from 'next';
import {AgentRequest, DataItem} from "../lib/objectmodel";
import {createHandler, getNextOpenAI, parseRequest} from "../lib/server.lib";

function getStateData(text: string): DataItem[] {
    let result = [];
    const lines = text.split("\n");
    for (let line of lines) {
        if (line == null || line.trim() === '') continue;
        const [field, value] = line.split(": ");
        if (field && value) {
            if (value.trim() === '' || field.trim() === '') continue;
            if (field.trim().toLowerCase() === value.trim().toLowerCase()) continue;
            result.push({field: field.trim(), value: value.trim()});
        }
    }
    return result;
}

function searchInDialog(newRow: DataItem, dialog: string): number {
    if (newRow.value.length < 3) return 0;
    const firstThree = newRow.value.substring(0, 3);
    return dialog.indexOf(firstThree);
}

function generateObserverPrompt(request: AgentRequest): string {
    let dialog = request.messages
        .map(value => `${value.role}: ${value.content}`)
        .join('\n');

    let missingLabels = request.stateData
        .filter(value => value.value == null)
        .map(value => `${value.label} as "${value.field}"`)
        .join(', ');

    console.log(dialog);

    return `Conversation:\n${dialog}\n\n`
        + `From the conversation, find the real data and print as a key value list: ${missingLabels}.\nDo not generate additional data. Data list:\n`;
}

export async function observerRequest(req: NextApiRequest) {

    let nextOpenAi = getNextOpenAI(req);
    let request = parseRequest(req);

    const prompts = generateObserverPrompt(request);

    const completion = await nextOpenAi.createTextCompletion(prompts);

    const newStateDataUpdate = getStateData(completion);

    const dialog = request.messages
        .map(value => `${value.role}: ${value.content}`)
        .join('\n');

    console.log("Before Update: " + JSON.stringify(request.stateData));

    newStateDataUpdate.forEach(newRow => {
        const index = searchInDialog(newRow, dialog);
        if (index > -1) {
            for (let i = 0; i < request.stateData.length; i++) {
                if (newRow.field === request.stateData[i]["field"]) {
                    request.stateData[i]["value"] = newRow.value;
                }
            }
        }
    });

    console.log("After Update: " + JSON.stringify(request.stateData));

    return request.stateData;
}

export async function observerRequest2(req: NextApiRequest) {

    let nextOpenAi = getNextOpenAI(req);
    let request = parseRequest(req);

    request.stateData = await nextOpenAi.extractDataFromChat(request.messages, request.stateData);

    return request.stateData;
}

export default createHandler(observerRequest2, "Calling Updated Observer");
