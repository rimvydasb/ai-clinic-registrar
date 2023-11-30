import {AgentRequest, DataItem} from "./objectmodel";
import {lazy} from "../server/server.lib";
import {AGENT_GREETING} from "./configuration";


export class AgentLibrary {

    private inputData: AgentRequest;

    constructor(inputData: AgentRequest) {
        this.inputData = inputData;
    }

    public readonly dataToExtract = lazy(() => {
        return this.inputData.userData.concat(this.inputData.symptomsData)
            .filter(value => value.value == null);
    });

    static decideInitialAgentResponse(inputData: AgentRequest): string | boolean {

        if (inputData.messages.length == 0) {
            return AGENT_GREETING;
        }

        if (inputData.errorMessage) {
            return `Apologies, but I have unexpected problems. Please reach human with this message: ${inputData.errorMessage}`;
        }

        if (inputData.voucherId) {
            return `You already have a voucher with an id: ${inputData.voucherId}. Please reach human if you need to change it.`;
        }

        return false;
    }

    static decideNextAgentResponse(inputData: AgentRequest): { prompt: string, printVoucher: boolean, message: string } {
        let systemPrompt, message;
        let printVoucher = false;

        if (inputData.voucherId || inputData.errorMessage) {
            message = this.decideInitialAgentResponse(inputData);
        }

        // First goal is to identify any symptom before asking for name and telephone
        else if (this.countFilled(inputData.symptomsData) == 0) {
            systemPrompt = this.generateQuestionerPrompt(inputData.symptomsData);
        }

        // Second goal is to identify name, telephone or other data
        else if (this.countMissing(inputData.userData) > 0) {
            systemPrompt = this.generateQuestionerPrompt(inputData.userData);
        }

        // if all the data is collected, generate a voucher id
        else {
            systemPrompt = this.generateGoodbyePrompt(inputData.userData);
            printVoucher = true;
        }

        return {prompt: systemPrompt, printVoucher: printVoucher, message: message};
    }

    static generateQuestionerPrompt(stateData: DataItem[]) {

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
            + `The goal is to get information: ${missingData}. `
            + ((knownData)? `You already know that: ${knownData}. ` : "")
            + `Do not ask other questions. Do not answer any questions. Do not advise.`;
    }

    static generateGoodbyePrompt(stateData: DataItem[]) {

        let labelsString = stateData
            .filter(value => value.value != null)
            .map(value => value.label + " is " + value.value)
            .join(', and ');

        return `You are an AI doctor's assistant with no medical knowledge. `
            + `The user is calling to schedule an appointment. `
            + `Tell user that his doctor will reach him. Tell user his information: ${labelsString}. `
            + `Do not ask other questions. Do not answer any questions. Do not advise. Say goodbye.`;
    }

    static countMissing(stateData: DataItem[]): number {
        return stateData.filter(value => value.value == null).length;
    }

    static countFilled(stateData: DataItem[]): number {
        return stateData.filter(value => value.value != null).length;
    }
}
