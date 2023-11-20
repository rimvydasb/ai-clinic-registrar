import {
    ChatCompletionMessage,
    ChatCompletionSystemMessageParam,
    ChatCompletionUserMessageParam
} from "openai/resources";
import OpenAI from "openai";

export class ChatMessage{
    constructor(
        public role: string,
        public content: string,
        public ignored: boolean = false
    ) {
    }

    static from(value: ChatCompletionMessage | ChatCompletionSystemMessageParam | ChatCompletionUserMessageParam): ChatMessage {
        return new ChatMessage(value.role, value.content.toString());
    }

    static asChatCompletionRequestMessage(value: any): ChatCompletionMessage {
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

    public toProperty() {
        let property = {};

        if (this.type == DataItemType.Boolean) {
            property = {
                "type": "string",
                "enum": ["yes", "no", "unknown"],
                "description": this.label
            }
        } else {
            property = {
                "type": this.type.toString(),
                "description": this.label
            }

            if (this.enumeration) {
                property["enum"] = this.enumeration;
            }
        }

        return property;
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
