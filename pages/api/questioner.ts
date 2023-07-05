import {NextApiRequest} from 'next';
import {AgentRequest, AgentResponse, ChatMessage, DataItem} from "../../lib/objectmodel";
import {createHandler, getNextOpenAI, parseRequest} from "../../lib/server.lib";
import {logger} from "../../lib/logger.lib";

export async function questionerRequest(req: NextApiRequest): Promise<AgentResponse> {

    // parsing request to the object model
    let request: AgentRequest = parseRequest(req);

    // initializing OpenAI API
    let nextOpenAi = getNextOpenAI(request);

    let lastMessages = (request.messages.length >= 2) ? request.messages.slice(-2) : request.messages;

    // did client provide all the data or some still missing?
    if (countMissing(request.stateData) > 0) {
        // @Todo: better truncate messages that already used for a data extraction
        // last two messages
        request.stateData = await nextOpenAi.extractDataFromChat(lastMessages, request.stateData);
    }

    if (countMissing(request.symptoms) > 0) {
        // @Todo: better truncate messages that already used for a data extraction
        request.symptoms = await nextOpenAi.extractDataFromChat(lastMessages, request.symptoms);
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
        voucherId = Math.random().toString(36).substring(7);
        storeRegistrationData(request);
    }

    // the next agent message that will be displayed to the user
    // @Todo: better truncate messages, they're not necessary for a goodbye
    let nextMessage = await nextOpenAi.createChatCompletion(request.messages, [], systemPrompt);

    // preparing response
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
