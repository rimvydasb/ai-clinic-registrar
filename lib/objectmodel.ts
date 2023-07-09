import {ChatCompletionResponseMessage, ChatCompletionResponseMessageRoleEnum} from "openai";
import {ChatCompletionRequestMessage} from "openai/api";

export class ChatMessage implements ChatCompletionResponseMessage {
    constructor(
        public role: ChatCompletionResponseMessageRoleEnum,
        public content: string,
        public ignored: boolean = false
    ) {
    }

    static from(value: ChatCompletionResponseMessage): ChatMessage {
        return new ChatMessage(value.role, value.content);
    }

    static asChatCompletionRequestMessage(value: any): ChatCompletionRequestMessage {
        return {
            role: value.role,
            content: value.content,
        }
    }
}

export enum CellValue {
    Yes = 'Yes',
    No = 'No',
    Any = 'any'
}

export enum DataItemType {
    String = 'string',
    Number = 'number',
    Boolean = 'boolean',
}

export class DataItem {
    constructor(
        public field: string,
        public label: string,
        public enumeration: string[] = null,
        public type: DataItemType = DataItemType.String,
        public value: string | null = null
    ) {
    }

    static countValues(items: DataItem[], value: string): number {
        return items
            .filter(item => item.value !== null)
            .filter(item => item.value.toLowerCase() === value.toLowerCase())
            .length;
    }
}

export class AgentRequest {
    constructor(
        public messages: ChatMessage[],
        public stateData: DataItem[],
        public symptoms: DataItem[],
        public voucherId: string = null,
        public isMock: boolean = false,
    ) {
    }

    static fromJson(json: any): AgentRequest {
        return new AgentRequest(
            json.messages,
            json.stateData,
            json.symptoms,
            json.voucherId || null,
            json.isMock || false,
        );
    }
}

export class AgentResponse {
    constructor(
        public result?: {
            nextMessage: ChatMessage,
            stateData: DataItem[],
            symptoms: DataItem[],
            voucherId?: string,
        },
        public error?: { message: string }
    ) {
    }
}
