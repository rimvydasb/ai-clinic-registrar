import {NextApiRequest} from 'next';
import {AgentRequest, AgentResponse, DataItem} from "../lib/objectmodel";
import {createHandler, getNextOpenAI, parseRequest} from "../lib/server.lib";

export async function questionerRequest(req: NextApiRequest): Promise<AgentResponse> {

    let nextOpenAi = getNextOpenAI(req);
    let request = parseRequest(req);

    if (getHasMissingData(request)) {
        // @Todo: better truncate messages that already used for a data extraction
        request.stateData = await nextOpenAi.extractDataFromChat(request.messages, request.stateData);
    }

    let nextMessage;

    if (getHasMissingData(request)) {
        let systemPrompt = generateQuestionerPrompt(request.stateData);
        nextMessage = await nextOpenAi.createChatCompletion(request.messages, [], systemPrompt);
    } else {
        let systemPrompt = generateGoodbyePrompt(request.stateData);
        // @Todo: better truncate messages, they're not necessary for a goodbye
        nextMessage = await nextOpenAi.createChatCompletion(request.messages, [], systemPrompt);
    }

    let response: AgentResponse = {
        result: {
            nextMessage: nextMessage,
            stateData: request.stateData,
        }
    }

    return response;
}

function getHasMissingData(request: AgentRequest) {
    return request.stateData.some(value => value.value == null);
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
