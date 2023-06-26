import {ChatCompletionResponseMessage, ChatCompletionResponseMessageRoleEnum, Configuration, OpenAIApi} from "openai";
import {NextApiRequest, NextApiResponse} from 'next';
import {AgentRequest} from "./objectmodel";

export function getNextOpenAI(req: NextApiRequest): SimpleOpenAI {

    if (req.body.mock) {
        return new SimpleOpenAIMock();
    } else {

        let configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });

        if (!configuration.apiKey) {
            throw new Error("OpenAI API key not configured, please follow instructions in README.md");
        }

        return new SimpleOpenAI(configuration);
    }
}

class SimpleOpenAI {

    openai: OpenAIApi;

    configuration: Configuration;

    // completion module
    textCompletionModel: string = "text-curie-001"; //text-babbage-001

    constructor(configuration: Configuration) {
        if (configuration) {
            this.configuration = configuration;
            this.openai = new OpenAIApi(this.configuration);
        } else {
            console.warn("Configuration is null, using mock");
        }
    }

    async createTextCompletion(prompts: string) {
        const completion = await this.openai.createCompletion({
            model: this.textCompletionModel,
            prompt: prompts,
            temperature: 0.0,
        });

        try {
            return completion.data.choices[0].text;
        } catch (e) {
            console.error("Error in createTextCompletion: " + JSON.stringify(e));
            return Promise.reject("Error in createTextCompletion: " + JSON.stringify(e));
        }
    }

    async createChatCompletion(messages: any[]): Promise<ChatCompletionResponseMessage> {
        const completion = await this.openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: 0.2,
        });

        try {
            return completion.data.choices[0].message;
        } catch (e) {
            console.error("Error in createChatCompletion: " + JSON.stringify(e));
            return Promise.reject("Error in createChatCompletion: " + JSON.stringify(e));
        }
    }
}

class SimpleOpenAIMock extends SimpleOpenAI {

    constructor() {
        super(null);
    }

    async createTextCompletion(prompts: string) {
        return "name: John\n\n";
    }

    async createChatCompletion(messages: ChatCompletionResponseMessage[]): Promise<ChatCompletionResponseMessage> {
        return Promise.resolve({
            "role": ChatCompletionResponseMessageRoleEnum.Assistant,
            "content": "I understood you. Goodbye."
        });
    }
}

/**
 *
 * @param req
 * @param res
 * @return {[object[],object[]]}
 */
export function parseRequest(req: NextApiRequest): AgentRequest {
    if (!req.body.messages || !Array.isArray(req.body.messages)) {
        console.error("Request body:" + JSON.stringify(req.body));
        throw new Error("Messages are not valid");
    }

    if (!req.body.stateData || !Array.isArray(req.body.stateData)) {
        console.error("Request body:" + JSON.stringify(req.body));
        throw new Error("State data are not valid");
    }

    return new AgentRequest(req.body.messages, req.body.stateData);
}

type HandlerRequestFunction = (req: NextApiRequest) => Promise<any>;

export function createHandler(requestFunction: HandlerRequestFunction, logMessage: string) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        console.info(logMessage);
        try {
            const result = await requestFunction(req);
            res.status(200).json({
                result: result
            });
        } catch (error: any) {
            if (error.response) {
                console.error(error.response.status, error.response.data);
                res.status(error.response.status).json(error.response.data);
            } else {
                let errorMessage = (error.message) ? `Server error: ${error.message}` : `Server error: ${error}`;
                console.error(errorMessage);
                res.status(500).json({
                    error: {
                        message: errorMessage,
                    }
                });
            }
        }
    };
};
