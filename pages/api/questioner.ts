import {NextApiRequest} from 'next';
import {AgentRequest, ChatMessage, DataItem} from "../../lib/rules/objectmodel";
import {createHandler, getNextOpenAI, parseRequest} from "../../lib/server/server.lib";
import {storeData} from "../../lib/server/db.lib";
import {REGISTRATION_TABLE_NAME} from "../../lib/rules/configuration";
import {AgentLibrary} from "../../lib/rules/library";
import {logger} from "../../lib/logger.lib";

export async function questionerRequest(nextApiRequest: NextApiRequest): Promise<AgentRequest> {

    // parsing request to the object model
    let request : AgentRequest = parseRequest(nextApiRequest);

    // initializing OpenAI API
    let nextOpenAi = getNextOpenAI(request);

    // initializing library with all business rules
    let library = new AgentLibrary(request);

    /**
     * Business logic:
     */

    let initialAgentResponse = AgentLibrary.decideInitialAgentResponse(request);

    if (initialAgentResponse !== false) {
        request.nextMessage = new ChatMessage("assistant", initialAgentResponse as string);
        return request;
    }

    if (library.dataToExtract().length > 0) {
        let lastMessages = (request.messages.length >= 2) ? request.messages.slice(-2) : request.messages;
        let extractedData = await nextOpenAi.extractDataFromChat(lastMessages, library.dataToExtract());
        if (extractedData instanceof Error) {
            request.nextMessage = new ChatMessage("assistant", "I'm sorry, I didn't understand you. Please repeat.");
            logger.warn("Terminating conversation");
            return request;
        }
    }

    let nextResponse = AgentLibrary.decideNextAgentResponse(request);

    if (nextResponse.printVoucher) {
        request.voucherId = await storeRegistrationData(request);
    }

    // the next agent message that will be displayed to the user
    if (nextResponse.message) {
        request.nextMessage = new ChatMessage("assistant", nextResponse.message);
        return request;
    }

    // if prompt is defined, it means that agent needs to ask a question
    else if (nextResponse.prompt) {

        // @Todo: it is not necessary to know messages to generate goodbye
        let nextMessage = await nextOpenAi.createChatCompletion(request.messages, [], nextResponse.prompt);

        if (nextMessage instanceof Error) {
            request.nextMessage = new ChatMessage("assistant", "I'm sorry, I didn't understand you. Please repeat.");
            request.errorMessage = nextMessage.message;
        } else {
            request.nextMessage = new ChatMessage(nextMessage.role, nextMessage.content);
        }

        return request;
    }
}

function storeRegistrationData(request: AgentRequest) {
    return storeData(REGISTRATION_TABLE_NAME, request);
}

export default createHandler(questionerRequest, "Calling Questioner");
