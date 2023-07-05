import {AgentResponse, AgentRequest} from "./objectmodel";

export enum APIEndpoint {
    Questioner = "/api/questioner",
}

export async function callAgent(endpoint: APIEndpoint, request: AgentRequest): Promise<AgentResponse> {
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
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
