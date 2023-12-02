import OpenAI, {ClientOptions} from "openai";
import {logger} from "../logger.lib";
import {ChatMessage, DataItem, DataItemType} from "../rules/objectmodel";
import {
    ChatCompletionCreateParams,
    ChatCompletionMessage,
    ChatCompletionMessageParam,
} from "openai/resources";

export class SimpleOpenAI {

    openai: OpenAI;

    configuration: ClientOptions;

    constructor(configuration: ClientOptions) {
        if (configuration) {
            this.configuration = configuration;
            this.openai = new OpenAI(this.configuration);
        } else {
            logger.warn("Configuration is null, using mock");
        }
    }

    async createChatCompletion(messages: ChatMessage[], functions: Array<ChatCompletionCreateParams.Function> = [], systemPrompt: string = null): Promise<ChatCompletionMessage> {

        const hasFunctions = functions && functions.length > 0;

        let requestMessages: ChatCompletionMessageParam[] = messages
            .filter(value => value.ignored === false)
            .map(value => ({
                role: value.role,
                content: value.content
            } as ChatCompletionMessageParam));

        // add system prompt to the beginning or the end of the request depending on the presence of functions
        if (systemPrompt) {
            const systemMessage = {
                role: 'system',
                content: systemPrompt
            } as ChatCompletionMessageParam;
            if (!hasFunctions) {
                requestMessages.unshift(systemMessage);
            } else {
                requestMessages.push(systemMessage);
            }
        }

        if (hasFunctions) {
            logger.debug("Functions: " + JSON.stringify(functions, null, 2));
        }

        logger.debug("createChatCompletion: " + JSON.stringify(requestMessages, null, 2));

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: requestMessages,
                functions: (hasFunctions) ? functions : undefined,
                temperature: (hasFunctions) ? 0.0 : 0.2,
                max_tokens: 70,
                top_p: 1,
                presence_penalty: 0,
                frequency_penalty: 0,
            });

            return completion.choices[0].message;
        } catch (e) {
            const error = new Error(`Error in createChatCompletion: ${JSON.stringify(e)}`)
            logger.error(error.message);
            return Promise.reject(error);
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
                if (value.type == DataItemType.Boolean) {
                    properties[value.field] = {
                        "type": "string",
                        "enum": ["yes", "no"],
                        "description": value.label
                    }
                } else {
                    properties[value.field] = {
                        "type": value.type.toString(),
                        "description": value.label
                    }
                }

                if (value.enumeration) {
                    properties[value.field].enum = value.enumeration;
                }
            });

        if (Object.keys(properties).length === 0) {
            logger.warn("No data to extract");
            return existingData;
        }

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

        if (extractedData instanceof Error) {
            return Promise.reject(extractedData);
        }

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
                        let result = newValue.toString().toLowerCase();
                        if (result === "yes" || result === "no") {
                            toBeUpdated.value = result;
                        }
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
