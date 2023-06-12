import {configuration, getRequest, openai, validateConfiguration} from "./lib";
import {console} from "next/dist/compiled/@edge-runtime/primitives/console";

function getStateData(text) {
    let result = [];
    const lines = text.split("\n");
    for (let line of lines) {
        if (line == null || line.trim() === '') continue;
        const [field, value] = line.split(": ");
        if (field && value) {
            if (value.trim() === '' || field.trim() === '') continue;
            if (field.trim().toLowerCase() === value.trim().toLowerCase()) continue;
            result.push({field: field.trim(), value: value.trim()});
        }
    }
    return result;
}

function searchInDialog(newRow, dialog) {
    if (newRow.value.length < 3) return 0;
    const firstThree = newRow.value.substring(0, 3);
    const index = dialog.indexOf(firstThree);
    return index;
}

export default async function (req, res) {

    console.info("Calling Observer");

    if (!validateConfiguration(res, configuration)) return;

    try {
        let [messages, stateData] = getRequest(req, res);

        let prompts = generateObserverPrompt(messages, stateData);

        console.log("observer prompts:\n" + prompts + "\nend.");

        const completion = await openai.createCompletion({
            //model: "text-babbage-001",
            model: "text-curie-001",
            prompt: prompts,
            temperature: 0.0,
        });

        console.log("observer responseMessage:\n" + JSON.stringify(completion.data) + "\nend.");

        const responseMessage = completion.data.choices[0].text;

        //const responseMessage = `name: Steve Rogers\n\ntelephone: +3854215688\n`

        const newStateData = getStateData(responseMessage);

        const dialog = messages
            .map(value => `${value.role}: ${value.content}`)
            .join('\n');

        console.log("Before Update: " + JSON.stringify(stateData));
        newStateData.forEach(newRow => {
            const index = searchInDialog(newRow, dialog);
            if (index > -1) {
                for (let i = 0; i < stateData.length; i++) {
                    if (newRow.field === stateData[i]["field"]) {
                        stateData[i]["value"] = newRow.value;
                    }
                }
            }
        });
        console.log("After Update: " + JSON.stringify(stateData));

        res.status(200).json({
            result: stateData
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
 * @param labels {object[]} - The labels to use in the prompt.
 */
function generateObserverPrompt(messages, stateData) {
    let dialog = messages
        .map(value => `${value.role}: ${value.content}`)
        .join('\n');

    let missingLabels = stateData
        .filter(value => value.value == null)
        .map(value => `${value.label} as "${value.field}"`)
        .join(', ');

    console.log(dialog);

    let template = `Conversation:\n${dialog}\n\n`
        + `From the conversation, find the real data and print as a key value list: ${missingLabels}.\nDo not generate additional data. Data list:\n`;

    return template;
}
