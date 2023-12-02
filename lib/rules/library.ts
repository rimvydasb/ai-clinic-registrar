import {AgentRequest, AgentResponse, DataItem} from "./objectmodel";
import {derivation, serviceCall} from "../server/server.lib";
import {AGENT_GREETING} from "./configuration";
import {ChatCompletionMessage} from "openai/resources";
import {logger} from "../logger.lib";

export class AgentLibrary {

    private inputData: AgentRequest;

    constructor(inputData: AgentRequest) {
        this.inputData = inputData;
    }

    // "I'm sorry, I didn't understand you. Please repeat."
    updatedAllDataItems = serviceCall(async (service) => {
        const userData = this.inputData.userData.map(value => {
            value.category = "userData";
            return value;
        });
        const symptomsData = this.inputData.symptomsData.map(value => {
            value.category = "symptomsData";
            return value;
        });
        let lastMessages = this.inputData.messages.slice(-4);
        return service.extractDataFromChat(lastMessages, userData.concat(symptomsData));
    });

    updatedSymptomsData = derivation(async () => {
        return (await this.updatedAllDataItems()).filter(value => value.category == "symptomsData");
    });

    updatedUserData = derivation(async () => {
        return (await this.updatedAllDataItems()).filter(value => value.category == "userData");
    });

    agentResponse = derivation(async (): Promise<AgentResponse> => {

        if (this.inputData.messages.length == 0) {
            return AgentResponse.message(AGENT_GREETING);
        }

        if (this.inputData.errorMessage) {
            return AgentResponse.message(`Apologies, but I have unexpected problems. Please reach human with this message: ${this.inputData.errorMessage}`);
        }

        if (this.inputData.voucherId) {
            return AgentResponse.message(`You already have a voucher with an id: ${this.inputData.voucherId}. Please reach human if you need to change it.`);
        }

        return this.updatedDataBasedResponse();
    });

    updatedDataBasedResponse = serviceCall(async (service): Promise<AgentResponse> => {

        let message: ChatCompletionMessage = null;

        // First goal is to identify any symptom before asking for name and telephone
        if ((await this.updatedSymptomsData()).every(item => item.value == null)) {
            logger.debug("Symptoms data is empty");
            const systemPrompt = this.generateQuestionerPrompt(this.inputData.symptomsData);
            message = (await service.createChatCompletion(this.inputData.messages, [], systemPrompt));
        }

        // Second goal is to identify all user data
        else if ((await this.updatedUserData()).some(item => item.value == null)) {
            logger.debug("User data is empty");
            const systemPrompt = this.generateQuestionerPrompt(this.inputData.userData);
            message = (await service.createChatCompletion(this.inputData.messages, [], systemPrompt));
        }

        if (message) {
            return AgentResponse.message(message.content);
        }

        // if all the data is collected, generate a voucher id
        const systemPrompt = this.generateGoodbyePrompt(this.inputData.userData);
        message = (await service.createChatCompletion(this.inputData.messages, [], systemPrompt));

        return AgentResponse.printVoucher(message.content);
    });

    generateQuestionerPrompt(stateData: DataItem[]) {

        let missingData = stateData
            .filter(value => value.value == null)
            .map(value => value.label)
            .join(', and ');

        let knownData = stateData
            .filter(value => value.value != null)
            .map(value => value.label + " is " + value.value)
            .join(', and ');

        return `You are an AI doctor's assistant with no medical knowledge. `
            + `The user is calling to schedule an appointment. `
            + `The only one goal is to get information: ${missingData}. `
            + ((knownData) ? `You already know that: ${knownData}. ` : "")
            + `Do not ask other questions. Do not answer any questions. Do not advise. `
            + `Do not tell user to call emergency services, because you're the emergency service. `
            + `Be polite and strictly follow the goal is to get information.`;
    }

    generateGoodbyePrompt(stateData: DataItem[]) {

        let labelsString = stateData
            .filter(value => value.value != null)
            .map(value => value.label + " is " + value.value)
            .join(', and ');

        return `You are an AI doctor's assistant with no medical knowledge. `
            + `The user is calling to schedule an appointment. `
            + `You have one goal: tell user that his doctor will reach him. Optionally tell user his information: ${labelsString}. `
            + `Do not ask other questions. Do not answer any questions. Do not advise. Say goodbye.`;
    }
}
