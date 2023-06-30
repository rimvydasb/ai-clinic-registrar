import {NextApiRequest} from 'next';
import {DataItem} from "../lib/objectmodel";
import {createHandler, getNextOpenAI, parseRequest} from "../lib/server.lib";

export async function questionerRequest(req: NextApiRequest) {

    let nextOpenAi = getNextOpenAI(req);
    let request = parseRequest(req);
    let systemPrompt = generateQuestionerPrompt(request.stateData);

    return await nextOpenAi.createChatCompletion(request.messages, [], systemPrompt);
}

function generateQuestionerPrompt(stateData: DataItem[]) {

    let labelsString = stateData
        .filter(value => value.value == null)
        .map(value => value.label)
        .join(', and ');

    if (labelsString === "") {

        let labelsString = stateData
            .map(value => `${value.label}: ${value.value}`)
            .join(', and ');

        return `You are an AI doctor's assistant with no medical knowledge. `
            + `The user is calling to schedule an appointment. `
            + `Tell user doctor will reach him. Tell user his information: ${labelsString}. `
            + `Do not ask other questions. Do not answer any questions. Do not advise. Say goodbye.`;

    } else {

        return `You are an AI doctor's assistant with no medical knowledge. `
            + `The user is calling to schedule an appointment. `
            + `The goal is to get information: ${labelsString}. `
            + `Do not ask other questions. Do not answer any questions. Do not advise.`;
    }
}

export default createHandler(questionerRequest, "Calling Questioner");
