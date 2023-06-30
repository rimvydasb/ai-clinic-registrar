import {NextApiRequest} from 'next';
import {AgentRequest, DataItem} from "../lib/objectmodel";
import {createHandler, getNextOpenAI, parseRequest} from "../lib/server.lib";

export async function observerRequest1(req: NextApiRequest) {

    let nextOpenAi = getNextOpenAI(req);
    let request = parseRequest(req);

    request.stateData = await nextOpenAi.extractDataFromChat(request.messages, request.stateData);

    return request.stateData;
}

export default createHandler(observerRequest1, "Calling Updated Observer");
