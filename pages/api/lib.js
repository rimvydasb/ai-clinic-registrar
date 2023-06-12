import {Configuration, OpenAIApi} from "openai";

export const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

export const openai = new OpenAIApi(configuration);

/**
 *
 * @param req
 * @param res
 * @return {[object[],object[]]}
 */
export function getRequest(req, res) {
    if (!req.body.messages || !Array.isArray(req.body.messages)) {
        console.error("Request body:" + JSON.stringify(req.body));
        throw new Error("Messages are not valid");
    }

    if (!req.body.stateData || !Array.isArray(req.body.stateData)) {
        console.error("Request body:" + JSON.stringify(req.body));
        throw new Error("State data are not valid");
    }

    let messages = req.body.messages;

    let stateData = req.body.stateData;

    return [messages, stateData];
}

export function validateConfiguration(res, configuration) {
    if (!configuration.apiKey) {
        res.status(500).json({
            error: {
                message: "OpenAI API key not configured, please follow instructions in README.md",
            }
        });
        return false;
    }

    return true;
}
