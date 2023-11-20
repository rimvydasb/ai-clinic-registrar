import {NextApiRequest, NextApiResponse} from 'next';
import {AgentRequest} from "./objectmodel";
import {logger} from "./logger.lib";
import {SimpleOpenAI, SimpleOpenAIMock} from "./openai.lib";
import {ClientOptions} from "openai";

export function getNextOpenAI(request: AgentRequest): SimpleOpenAI {

    if (request.isMock) {
        return new SimpleOpenAIMock();
    } else {

        let configuration: ClientOptions = {
            apiKey: process.env.OPENAI_API_KEY,
        };

        if (!configuration.apiKey) {
            throw new Error("OpenAI API key not configured, please follow instructions in README.md");
        }

        return new SimpleOpenAI(configuration);
    }
}

export function isValidArray(object: any, label: string = null) {

    if (object === null || !Array.isArray(object)) {
        if (alert)
            alert("Wrong " + label + ": " + JSON.stringify(object));
        if (logger)
            logger.error("Wrong " + label + ": " + JSON.stringify(object));
        else
            console.error("ERROR: Wrong " + label + ": " + JSON.stringify(object));

        return false;
    }
    return true;
}

/**
 *
 * @param req
 * @return {[object[],object[]]}
 */
export function parseRequest(req: NextApiRequest): AgentRequest {
    if (isValidArray(req.body.messages, "messages") && isValidArray(req.body.stateData, "stateData") && isValidArray(req.body.symptoms, "symptoms")) {
        return AgentRequest.fromJson(req.body);
    }
    let request: AgentRequest = AgentRequest.fromJson(req.body);
    logger.debug("AgentRequest: " + JSON.stringify(request));
    return request;
}

type HandlerRequestFunction = (req: NextApiRequest) => Promise<any>;

export function createHandler(requestFunction: HandlerRequestFunction, logMessage: string) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        logger.info(logMessage);
        try {
            const result = await requestFunction(req);
            logger.debug("Response 200 body: " + JSON.stringify(result));
            res.status(200).json(result);
        } catch (error: any) {
            if (error.response) {
                logger.error(error.response.status, error.response.data);
                res.status(error.response.status).json(error.response.data);
            } else {
                let errorMessage = (error.message) ? `Server error: ${error.message}` : `Server error: ${error}`;
                logger.error(errorMessage);
                res.status(500).json({
                    error: {
                        message: errorMessage,
                    }
                });
            }
        }
    };
}
