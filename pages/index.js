import React, {useState} from 'react';
import {TextField, Button, List, ListItem, ListItemText, Typography, Paper} from '@mui/material';
import {green} from '@mui/material/colors';
import DataTable from "./components/registration";

const INIT_STATE_DATA = [
    {field: "name", label: "user's name", value: null},
    {field: "telephone", label: "user's telephone number", value: null},
]

async function extractAnswers(messages, stateData) {
    const response = await fetch("/api/observer", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({messages: messages, stateData: stateData}),
    });

    const data = await response.json();
    if (response.status !== 200) {
        console.error(data.error.message);
        alert(data.error.message)
    }

    console.log("Response:\n" + JSON.stringify(data));

    return data.result;
}

const ChatApp = () => {
    const [messages, setMessages] = useState([
        {"role": "assistant", "content": "Hello, I'm the doctor's assistant. How can I help you?"}
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [stateData, setStateData] = useState(INIT_STATE_DATA);

    const handleNewMessageChange = (event) => {
        setNewMessage(event.target.value);
    };

    const handleSendMessage = async () => {
        const updatedMessages = messages.concat({"role": "user", "content": newMessage});
        setMessages(updatedMessages);
        setNewMessage('');

        const newStateData = await extractAnswers(updatedMessages, stateData);

        if (newStateData === null || !Array.isArray(newStateData)) {
            alert("Wrong state data: " + JSON.stringify(newStateData));
            return;
        }

        setStateData(newStateData);

        const response = await fetch("/api/questioner", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({messages: updatedMessages, stateData: newStateData}),
        });

        const data = await response.json();
        if (response.status !== 200) {
            console.error(data.error.message);
            alert(data.error.message)
        }

        console.log("Response:\n" + JSON.stringify(data));

        // assuming the response contains a message from the assistant
        if (data && data.result) {
            setMessages(updatedMessages.concat({"role": "assistant", "content": data.result.message.content}));
        }
    };

    return (
        <div style={{maxWidth: '600px', margin: '0 auto', padding: '20px'}}>
            <Paper style={{padding: '20px', backgroundColor: 'white'}}>
                <List>
                    {messages.map((message, index) => (
                        <ListItem key={index}>
                            <ListItemText primary={<Typography variant="h6">{message.role}</Typography>}
                                          secondary={message.content}/>
                        </ListItem>
                    ))}
                </List>
                <div style={{display: 'flex', marginTop: '20px'}}>
                    <TextField
                        value={newMessage}
                        onChange={handleNewMessageChange}
                        variant="outlined"
                        fullWidth
                        style={{marginRight: '20px'}}
                    />
                    <Button onClick={handleSendMessage} variant="contained"
                            style={{backgroundColor: green[500]}}>Send</Button>
                </div>
                <DataTable stateData={stateData} />
            </Paper>
        </div>
    );
}

export default ChatApp;
