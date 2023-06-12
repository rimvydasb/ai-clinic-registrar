import {configuration, getRequest, openai, validateConfiguration} from "./lib";

export default async function (req, res) {

    console.info("Calling Questioner");

    if (!validateConfiguration(res, configuration)) return;

    try {
        let [messages, stateData] = getRequest(req, res);

        messages = messages.concat({"role": "system", "content": generateQuestionerPrompt(stateData)});

        console.log("Request messages:\n" + JSON.stringify(messages));

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: 0.2,
        });

        const responseMessage = completion.data.choices[0].message;

        // const responseMessage = {
        //     "role": "assistant",
        //     "content": "\n\nHello there, how may I assist you today?",
        // };

        console.log("responseMessage:\n" + JSON.stringify(responseMessage));

        res.status(200).json({
            result: {
                message: responseMessage
            }
        });
    } catch (error) {
        if (error.response) {
            console.error(error.response.status, error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            console.error(`Error with OpenAI API request: ${error.message}`);
            res.status(500).json({
                error: {
                    message: 'An error occurred during your request.',
                }
            });
        }
    }
}

/**
 * Generates a prompt for the questioner.
 *
 * @param stateData {object[]} - The labels to use in the prompt.
 */
function generateQuestionerPrompt(stateData) {

    console.log("stateData = " + JSON.stringify(stateData));

    let labelsString = stateData
        .filter(value => value.value == null)
        .map(value => value.label)
        .join(', and ');

    console.log("labelsString = " + labelsString);

    if (labelsString === "") {

        let labelsString = stateData
            .map(value => `${value.label}: ${value.value}`)
            .join(', and ');

        return `You are an AI doctor's assistant with no medical knowledge. `
            + `The user is calling to schedule an appointment. `
            + `Tell user doctor will reach him. Tell user his information: ${labelsString}. `
            + `Do not ask other questions. Do not answer any questions. Do not advise. Say goodbye.`;

    } else {

        return `You are an AI doctor's assistant with no medical knowledge. `
            + `The user is calling to schedule an appointment. `
            + `The goal is to get information: ${labelsString}. `
            + `Do not ask other questions. Do not answer any questions. Do not advise.`;
    }
}
