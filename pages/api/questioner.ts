import {NextApiRequest} from 'next';
import {AgentRequest, ChatMessage, DataItem} from "../../lib/objectmodel";
import {createHandler, getNextOpenAI, parseRequest} from "../../lib/server.lib";
import {storeData} from "../../lib/db.lib";
import {REGISTRATION_TABLE_NAME} from "../../configuration/configuration";

export async function questionerRequest(nextApiRequest: NextApiRequest): Promise<AgentRequest> {

    // parsing request to the object model
    let request : AgentRequest = parseRequest(nextApiRequest);

    if (request.errorMessage) {
        request.errorMessage = request.errorMessage + "; call rejected";
        return request;
    }

    // initializing OpenAI API
    let nextOpenAi = getNextOpenAI(request);

    let dataToExtract = request.userData
        .concat(request.symptomsData)
        .filter(value => value.value == null);

    if (dataToExtract.length > 0) {
        let lastMessages = (request.messages.length >= 2) ? request.messages.slice(-2) : request.messages;
        let extractedData = await nextOpenAi.extractDataFromChat(lastMessages, dataToExtract);
        if (extractedData instanceof Error) {
            request.nextMessage = new ChatMessage("assistant", "I'm sorry, I didn't understand you. Please repeat.");
            return request;
        }
        extractedData.forEach(value => {
            // update symptomsData
            let symptom = request.symptomsData.find(symptom => symptom.field == value.field);
            if (symptom) symptom.value = value.value;

            // update state data
            let stateData = request.userData.find(stateData => stateData.field == value.field);
            if (stateData) stateData.value = value.value;
        });
    }

    let systemPrompt : string;
    let voucherId: string = null;

    // First goal is to identify any symptom before asking for name and telephone
    // @Todo: if voucher is generated, then conversation must end
    if (countFilled(request.symptomsData) == 0) {
        systemPrompt = generateQuestionerPrompt(request.symptomsData);
    } else if (countMissing(request.userData) > 0) {
        // Second goal is to identify name, telephone or other data
        systemPrompt = generateQuestionerPrompt(request.userData);
    } else {
        // if all the data is collected, generate a voucher id
        systemPrompt = generateGoodbyePrompt(request.userData);

        if (request.voucherId == null) {
            voucherId = await storeRegistrationData(request);
        }
    }

    // the next agent message that will be displayed to the user
    // @Todo: it is not necessary to know messages to generate goodbye
    let nextMessage = await nextOpenAi.createChatCompletion(request.messages, [], systemPrompt);

    if (nextMessage instanceof Error) {
        request.nextMessage = new ChatMessage("assistant", "I'm sorry, I didn't understand you. Please repeat.");
        request.errorMessage = nextMessage.message;
    } else {
        request.nextMessage = new ChatMessage(nextMessage.role, nextMessage.content);
        request.voucherId = voucherId;
    }

    return request;
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
        + `Tell user that his doctor will reach him. Tell user his information: ${labelsString}. `
        + `Do not ask other questions. Do not answer any questions. Do not advise. Say goodbye.`;
}

export default createHandler(questionerRequest, "Calling Questioner");
