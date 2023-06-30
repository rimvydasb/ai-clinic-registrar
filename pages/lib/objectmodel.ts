import {ChatCompletionResponseMessage, ChatCompletionResponseMessageRoleEnum} from "openai";
import {ChatCompletionRequestMessage} from "openai/api";

export class ChatMessage implements ChatCompletionResponseMessage {
    content: string;
    role: ChatCompletionResponseMessageRoleEnum;
    ignored: boolean;

    constructor(role: ChatCompletionResponseMessageRoleEnum, content: string) {
        this.role = role;
        this.content = content;
        this.ignored = false;
    }

    static asChatCompletionRequestMessage(value: any): ChatCompletionRequestMessage {
        return {
            "role": value.role,
            "content": value.content,
        }
    }
}

export class DataItem {
    constructor(public field: string, public label: string, public value: string | null) {
    }

    static validate(items: any): boolean {
        if (items === null || !Array.isArray(items)) {
            alert("Wrong state data: " + JSON.stringify(items));
            return false;
        }
        return true;
    }
}

export class AgentRequest {
    constructor(public messages: ChatMessage[], public stateData: DataItem[]) {
    }
}

export type ResponseData = {
    result: any;
    error?: { message: string };
}
