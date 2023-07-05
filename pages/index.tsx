import React, {ChangeEvent, useState} from 'react';
import {Button, List, ListItem, ListItemText, Paper, TextField, Typography} from '@mui/material';
import {green} from '@mui/material/colors';
import DataTable from "./components/registration";
import styles from "./index.module.css";
import HealingIcon from '@mui/icons-material/Healing';
import {AgentRequest, ChatMessage, DataItem} from "../lib/objectmodel";
import {APIEndpoint, callAgent} from "../lib/client.lib";
import {ChatCompletionResponseMessageRoleEnum} from "openai";
import {AGENT_GREETING, CLIENT_SYMPTOMS_DATA, REGISTRATION_CLIENT_DATA} from "../configuration/configuration";
import {isValidArray} from "../lib/server.lib";

const ChatApp: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        new ChatMessage(ChatCompletionResponseMessageRoleEnum.Assistant, AGENT_GREETING),
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [stateData, setStateData] = useState<DataItem[]>(REGISTRATION_CLIENT_DATA);
    const [symptoms, setSymptoms] = useState<DataItem[]>(CLIENT_SYMPTOMS_DATA);

    const handleNewMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
        setNewMessage(event.target.value);
    };

    const handleSendMessage = async () => {
        const updatedMessages = messages.concat(new ChatMessage(ChatCompletionResponseMessageRoleEnum.User, newMessage));
        setMessages(updatedMessages);
        setNewMessage('');

        const request = new AgentRequest(updatedMessages, stateData, symptoms);
        const response = await callAgent(APIEndpoint.Questioner, request);

        console.debug("Response error: " + JSON.stringify(response.error));
        console.debug("Response result: " + JSON.stringify(response.result));

        if (isValidArray(response.result.stateData, "state data")) {
            setStateData(response.result.stateData);
        }

        if (isValidArray(response.result.symptoms, "symptoms")) {
            setSymptoms(response.result.symptoms);
        }

        if (response.result.nextMessage) {
            setMessages(updatedMessages.concat(response.result.nextMessage));
        }
    };

    return (
        <div style={{maxWidth: '600px', margin: '0 auto', padding: '20px'}}>
            <Typography variant="h6" className={styles.title}><HealingIcon style={{color: '#4CAF50'}}/> My
                Clinic</Typography>
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
                <DataTable stateData={stateData}/>
            </Paper>
        </div>
    );
}

export default ChatApp;
