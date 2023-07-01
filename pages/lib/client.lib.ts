import {ChatMessage, AgentResponse, DataItem} from "./objectmodel";

export enum APIEndpoint {
    Observer = "/api/observer",
    Questioner = "/api/questioner",
}

export async function callAgent(endpoint: APIEndpoint, messages: ChatMessage[], stateData: DataItem[]): Promise<AgentResponse> {
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({messages: messages, stateData: stateData}),
    });

    console.debug("Response: " + JSON.stringify(response));

    const data: AgentResponse = await response.json();
    if (response.status !== 200) {
        console.error(data.error?.message);
        alert(data.error?.message)
    }

    console.debug("Response data: " + JSON.stringify(data));

    return data;
}
