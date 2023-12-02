import {NextApiRequest, NextApiResponse} from 'next';
import {AgentRequest} from "../rules/objectmodel";
import {logger} from "../logger.lib";
import {SimpleOpenAI} from "./openai.lib";
import {ClientOptions} from "openai";
import {isValidArray} from "../client/until";

let nextOpenAI: SimpleOpenAI | null = null;

function getNextOpenAI(): SimpleOpenAI {

    if (!nextOpenAI) {
        let configuration: ClientOptions = {
            apiKey: process.env.OPENAI_API_KEY,
        };

        if (!configuration.apiKey) {
            throw new Error("OpenAI API key not configured, please follow instructions in README.md");
        }

        return new SimpleOpenAI(configuration);
    } else {
        return nextOpenAI;
    }
}

/**
 *
 * @param nextApiRequest
 * @return {[object[],object[]]}
 */
export function parseRequest(nextApiRequest: NextApiRequest): AgentRequest {
    const request: AgentRequest = AgentRequest.fromJson(nextApiRequest.body);
    logger.debug("AgentRequest: " + JSON.stringify(request));
    if (isValidArray(request.messages, "messages") && isValidArray(request.userData, "stateData") && isValidArray(request.symptomsData, "symptoms")) {
        return request;
    } else {
        request.errorMessage = "Invalid request";
        return request;
    }
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

export function derivation<T>(initializer: () => T): () => T {
    let value: T;
    let hasValue = false;

    return () => {
        if (!hasValue) {
            value = initializer();
            hasValue = true;
        }
        return value;
    };
}

export function serviceCall<T>(initializer: (service: SimpleOpenAI) => Promise<T | Error>): () => Promise<T> {
    let value: Promise<T>;
    let hasValue = false;

    return () => {
        if (!hasValue) {
            const response = initializer(getNextOpenAI());
            if (response instanceof Error) {
                value = Promise.reject(response);
            } else {
                value = response as Promise<T>;
            }
            hasValue = true;
        }
        return value;
    };
}

