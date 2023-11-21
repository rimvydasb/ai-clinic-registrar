import {NextApiRequest} from 'next';
import {AgentRequest, AgentResponse, ChatMessage, DataItem} from "../../lib/objectmodel";
import {createHandler, getNextOpenAI, parseRequest} from "../../lib/server.lib";
import {storeData} from "../../lib/db.lib";
import {REGISTRATION_TABLE_NAME} from "../../configuration/configuration";

export async function questionerRequest(req: NextApiRequest): Promise<AgentResponse> {

    // parsing request to the object model
    let request: AgentRequest = parseRequest(req);

    // initializing OpenAI API
    let nextOpenAi = getNextOpenAI(request);

    // // did client provide all the data or some still missing?
    // if (countMissing(request.stateData) > 0) {
    //     // @Todo: better truncate messages that already used for a data extraction
    //     // last two messages
    //     request.stateData = await nextOpenAi.extractDataFromChat(lastMessages, request.stateData);
    // }
    //
    // if (countMissing(request.symptoms) > 0) {
    //     // @Todo: better truncate messages that already used for a data extraction
    //     request.symptoms = await nextOpenAi.extractDataFromChat(lastMessages, request.symptoms);
    // }

    let dataToExtract = request.stateData
        .concat(request.symptoms)
        .filter(value => value.value == null);

    if (dataToExtract.length > 0) {
        let lastMessages = (request.messages.length >= 2) ? request.messages.slice(-2) : request.messages;
        let extractedData = await nextOpenAi.extractDataFromChat(lastMessages, dataToExtract);
        if (extractedData instanceof Error) {
            return {
                result: {
                    nextMessage: new ChatMessage("assistant", "I'm sorry, I didn't understand you. Please repeat."),
                    stateData: request.stateData,
                    symptoms: request.symptoms,
                    voucherId: null,
                }
            } as AgentResponse;
        }
        extractedData.forEach(value => {
            // update symptoms
            let symptom = request.symptoms.find(symptom => symptom.field == value.field);
            if (symptom) symptom.value = value.value;

            // update state data
            let stateData = request.stateData.find(stateData => stateData.field == value.field);
            if (stateData) stateData.value = value.value;
        });
    }

    let systemPrompt;
    let voucherId: string = null;

    // First goal is to identify any symptom before asking for name and telephone
    if (countFilled(request.symptoms) == 0) {
        systemPrompt = generateQuestionerPrompt(request.symptoms);
    } else if (countMissing(request.stateData) > 0) {
        systemPrompt = generateQuestionerPrompt(request.stateData);
    } else {
        // if all the data is collected, generate a voucher id
        systemPrompt = generateGoodbyePrompt(request.stateData);

        if (request.voucherId == null) {
            voucherId = await storeRegistrationData(request);
        }
    }

    // the next agent message that will be displayed to the user
    // @Todo: better truncate messages, they're not necessary for a goodbye
    let nextMessage = await nextOpenAi.createChatCompletion(request.messages, [], systemPrompt);

    if (nextMessage instanceof Error) {
        return {
            result: {
                nextMessage: new ChatMessage("assistant", "I'm sorry, I didn't understand you. Please repeat."),
                stateData: request.stateData,
                symptoms: request.symptoms,
                voucherId: null,
            }
        } as AgentResponse;
    }

    return {
        result: {
            nextMessage: ChatMessage.from(nextMessage),
            stateData: request.stateData,
            symptoms: request.symptoms,
            voucherId: voucherId,
        }
    } as AgentResponse;
}

function countMissing(stateData: DataItem[]): number {
    return stateData.filter(value => value.value == null).length;
}

function countFilled(stateData: DataItem[]): number {
    return stateData.filter(value => value.value != null).length;
}

function storeRegistrationData(request: AgentRequest) {
    return storeData(REGISTRATION_TABLE_NAME, request);
}

function generateQuestionerPrompt(stateData: DataItem[]) {

    let labelsString = stateData
        .filter(value => value.value == null)
        .map(value => value.label)
        .join(', and ');

    return `You are an AI doctor's assistant with no medical knowledge. `
        + `The user is calling to schedule an appointment. `
        + `The goal is to get information: ${labelsString}. `
        + `Do not ask other questions. Do not answer any questions. Do not advise.`;
}

function generateGoodbyePrompt(stateData: DataItem[]) {

    let labelsString = stateData
        .filter(value => value.value != null)
        .map(value => value.label + " is " + value.value)
        .join(', and ');

    return `You are an AI doctor's assistant with no medical knowledge. `
        + `The user is calling to schedule an appointment. `
        + `Tell user doctor will reach him. Tell user his information: ${labelsString}. `
        + `Do not ask other questions. Do not answer any questions. Do not advise. Say goodbye.`;
}

export default createHandler(questionerRequest, "Calling Questioner");
