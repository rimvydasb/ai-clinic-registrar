import {AgentRequest} from "../rules/objectmodel";

export enum APIEndpoint {
    Questioner = "/api/questioner",
}

export async function callAgent(endpoint: APIEndpoint, request: AgentRequest): Promise<AgentRequest> {
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    console.debug("Response: " + JSON.stringify(response));

    const data: AgentRequest = await response.json();
    if (response.status !== 200) {
        console.error(data.errorMessage);
    }

    console.debug("Response data: " + JSON.stringify(data));

    return data;
}
