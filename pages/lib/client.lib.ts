import {ChatMessage, ResponseData, DataItem} from "./objectmodel";

export enum APIEndpoint {
    Observer = "/api/observer",
    Questioner = "/api/questioner",
}

export async function post(endpoint: APIEndpoint, messages: ChatMessage[], stateData: DataItem[]) {
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({messages: messages, stateData: stateData}),
    });

    const data: ResponseData = await response.json();
    if (response.status !== 200) {
        console.error(data.error?.message);
        alert(data.error?.message)
    }

    return data.result;
}
