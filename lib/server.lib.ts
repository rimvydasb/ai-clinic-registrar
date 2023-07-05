import {ChatCompletionResponseMessage, ChatCompletionResponseMessageRoleEnum, Configuration, OpenAIApi} from "openai";
import {NextApiRequest, NextApiResponse} from 'next';
import {AgentRequest, ChatMessage, DataItem, DataItemType} from "./objectmodel";
import {ChatCompletionFunctions, ChatCompletionRequestMessage} from "openai/api";
import {logger} from "./logger.lib";

export function getNextOpenAI(request: AgentRequest): SimpleOpenAI {

    if (request.isMock) {
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
            logger.warn("Configuration is null, using mock");
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
            logger.error("Error in createTextCompletion: " + JSON.stringify(e));
            return Promise.reject("Error in createTextCompletion: " + JSON.stringify(e));
        }
    }

    async createChatCompletion(messages: ChatMessage[], functions: Array<ChatCompletionFunctions> = [], systemPrompt: string = null): Promise<ChatCompletionResponseMessage> {

        const hasFunctions = functions && functions.length > 0;

        let requestMessages: ChatCompletionRequestMessage[] = messages
            .filter(value => value.ignored === false)
            .map(value => ChatMessage.asChatCompletionRequestMessage(value));

        if (systemPrompt && !hasFunctions) {
            requestMessages.unshift(ChatMessage.asChatCompletionRequestMessage(new ChatMessage("system", systemPrompt)));
        }

        if (systemPrompt && hasFunctions) {
            requestMessages.push(ChatMessage.asChatCompletionRequestMessage(new ChatMessage("system", systemPrompt)));
        }

        logger.debug("createChatCompletion: " + JSON.stringify(requestMessages));

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
            logger.error("Error in createChatCompletion: " + JSON.stringify(e));
            return Promise.reject("Error in createChatCompletion: " + JSON.stringify(e));
        }
    }

    containsPartOfText(messages: ChatMessage[], text: string, chars: number): boolean {
        if (text == null || text.trim().length === 0) {
            return false;
        }
        const parOfText = text.substring(0, chars);
        if (parOfText == null || parOfText.trim().length === 0) {
            return false;
        }
        return messages.some(value => value.content.toLowerCase().includes(parOfText.trim().toLowerCase()));
    }

    async extractDataFromChat(messages: ChatMessage[], existingData: DataItem[]): Promise<DataItem[]> {

        let properties = {};

        existingData
            .filter(value => value.value == null)
            .forEach(value => {
                properties[value.field] = {
                    "type": value.type.toString(),
                    "description": value.label
                }

                if (value.enumeration) {
                    properties[value.field].enum = value.enumeration;
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

        logger.debug("extractedData: " + JSON.stringify(extractedData));

        if (extractedData.function_call) {
            let data = JSON.parse(extractedData.function_call.arguments);
            for (let field in data) {
                let newValue = data[field];
                let toBeUpdated = existingData.find(item => item.field === field);
                if (!toBeUpdated) {
                    logger.error("Could not find field " + field + " in existing data: " + JSON.stringify(existingData));
                } else {
                    if (toBeUpdated.type == DataItemType.Boolean) {
                        toBeUpdated.value = newValue;
                    } else {
                        // making sure extracted data exists somewhere in the chat to avoid delusional data
                        if (this.containsPartOfText(messages, newValue, 3)) {
                            toBeUpdated.value = newValue;
                        }
                    }
                }
            }
        } else {
            logger.error("No function_call found in response: " + JSON.stringify(extractedData));
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
 * @param res
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
};
