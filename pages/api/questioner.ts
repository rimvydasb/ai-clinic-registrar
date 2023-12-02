import {NextApiRequest} from 'next';
import {AgentRequest, ChatMessage} from "../../lib/rules/objectmodel";
import {createHandler, parseRequest} from "../../lib/server/server.lib";
import {storeData} from "../../lib/server/db.lib";
import {AGENT_APOLOGY, REGISTRATION_TABLE_NAME} from "../../lib/rules/configuration";
import {AgentLibrary} from "../../lib/rules/library";
import {logger} from "../../lib/logger.lib";

export async function agentDecisionService(nextApiRequest: NextApiRequest): Promise<AgentRequest> {

    // parsing request to the object model
    let request: AgentRequest = parseRequest(nextApiRequest);

    // initializing library with all business rules
    let library = new AgentLibrary(request);

    try {
        let agentResponse = await library.agentResponse();

        if (agentResponse.printVoucher) {
            request.voucherId = await storeRegistrationData(request);
        }

        request.symptomsData = await library.updatedSymptomsData();
        request.userData = await library.updatedUserData();
        request.nextMessage = new ChatMessage("assistant", agentResponse.message);
    } catch (error: any) {
        logger.error("caught in clause: " + error);
        request.nextMessage = new ChatMessage("assistant", AGENT_APOLOGY);
        request.errorMessage = error.message;
    }

    return request;
}

function storeRegistrationData(request: AgentRequest) {
    return storeData(REGISTRATION_TABLE_NAME, request);
}

export default createHandler(agentDecisionService, "Calling Agent Decision Service");
