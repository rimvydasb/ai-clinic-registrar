import {ChatCompletionResponseMessage, ChatCompletionResponseMessageRoleEnum, Configuration, OpenAIApi} from "openai";
import {logger} from "./logger.lib";
import {ChatMessage, DataItem, DataItemType} from "./objectmodel";
import {ChatCompletionFunctions, ChatCompletionRequestMessage} from "openai/api";

export class SimpleOpenAI {

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
                if (value.type == DataItemType.Boolean) {
                    properties[value.field] = {
                        "type": "string",
                        "enum": ["yes", "no", "unknown"],
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

export class SimpleOpenAIMock extends SimpleOpenAI {

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