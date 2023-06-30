import {ChatCompletionResponseMessage, ChatCompletionResponseMessageRoleEnum, Configuration, OpenAIApi} from "openai";
import {NextApiRequest, NextApiResponse} from 'next';
import {AgentRequest, ChatMessage, DataItem} from "./objectmodel";
import {ChatCompletionFunctions, ChatCompletionRequestMessage} from "openai/api";

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

    async createChatCompletion(messages: ChatMessage[], functions: Array<ChatCompletionFunctions> = null, systemPrompt: string = null): Promise<ChatCompletionResponseMessage> {

        const hasFunctions = functions && functions.length > 0;

        let requestMessages : ChatCompletionRequestMessage[] = messages
            .filter(value => value.ignored === false)
            .map(value => ChatMessage.asChatCompletionRequestMessage(value));

        if (systemPrompt && !hasFunctions) {
            requestMessages.unshift(ChatMessage.asChatCompletionRequestMessage(new ChatMessage("system", systemPrompt)));
        }

        if (systemPrompt && hasFunctions) {
            requestMessages.push(ChatMessage.asChatCompletionRequestMessage(new ChatMessage("system", systemPrompt)));
        }

        console.debug(JSON.stringify(requestMessages));

        const completion = await this.openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: requestMessages,
            functions: (hasFunctions) ? functions : undefined,
            temperature: (hasFunctions) ? 0.0 : 0.2,
            max_tokens: 250,
            top_p: 1,
            presence_penalty: 0,
            frequency_penalty: 0,
        });

        try {
            return completion.data.choices[0].message;
        } catch (e) {
            console.error("Error in createChatCompletion: " + JSON.stringify(e));
            return Promise.reject("Error in createChatCompletion: " + JSON.stringify(e));
        }
    }

    async extractDataFromChat(messages: ChatMessage[], existingData: DataItem[]): Promise<DataItem[]> {

        let properties = {};

        existingData
            .filter(value => value.value == null)
            .forEach(value => {
                properties[value.field] = {
                    "type": "string",
                    "description": value.label
                }
            });

        let functionCall = {
            "name": "extract_data",
            "description": "Extract user's data if found",
            "parameters": {
                "type": "object",
                "properties": properties
            }
        }

        let extractedData = await this.createChatCompletion(
            messages,
            [functionCall],
            "Extract data from the user. Only use the functions you have been provided with."
        );

        if (extractedData.function_call) {
            let data = JSON.parse(extractedData.function_call.arguments);
            for (let field in data) {
                let value = data[field];
                if (value) {
                    let toBeUpdated = existingData.find(item => item.field === field);
                    if (toBeUpdated) {
                        toBeUpdated.value = value;
                    } else {
                        console.error("Could not find field " + field + " in existing data: " + JSON.stringify(existingData));
                    }
                }
            }
        } else {
            console.error("No function_call found in response: " + JSON.stringify(extractedData));
        }

        return existingData;
    }
}

class SimpleOpenAIMock extends SimpleOpenAI {

    constructor() {
        super(null);
    }

    async createTextCompletion(prompts: string) {
        return "name: John\n\n";
    }

    async createChatCompletion(messages: ChatMessage[], functions: Array<ChatCompletionFunctions> = []): Promise<ChatCompletionResponseMessage> {
        if (functions.length > 0) {
            return Promise.resolve({
                "role": "assistant",
                "content": null,
                "function_call": {
                    "name": "extract_data",
                    "arguments": "{\n  \"name\": \"John\"\n}"
                }
            });
        } else {
            return Promise.resolve({
                "role": ChatCompletionResponseMessageRoleEnum.Assistant,
                "content": "I understood you. Goodbye."
            });
        }
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
