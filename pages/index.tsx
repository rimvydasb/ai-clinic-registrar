import React, {ChangeEvent, useState} from 'react';
import {Button, List, ListItem, ListItemText, Paper, TextField, Typography} from '@mui/material';
import {green} from '@mui/material/colors';
import DataTable from "./components/registration";
import styles from "./index.module.css";
import HealingIcon from '@mui/icons-material/Healing';
import {AgentRequest, ChatMessage, DataItem} from "../lib/rules/objectmodel";
import {APIEndpoint, callAgent} from "../lib/client/client.lib";
import {AGENT_GREETING, CLIENT_SYMPTOMS_DATA, REGISTRATION_CLIENT_DATA} from "../lib/rules/configuration";

import {isValidArray} from "../lib/client/until";

const ChatApp: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        new ChatMessage('assistant', AGENT_GREETING),
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [voucherId, setVoucherId] = useState(null);
    const [stateData, setStateData] = useState<DataItem[]>(REGISTRATION_CLIENT_DATA);
    const [symptoms, setSymptoms] = useState<DataItem[]>(CLIENT_SYMPTOMS_DATA);

    const handleNewMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
        setNewMessage(event.target.value);
    };

    const handleSendMessage = async () => {
        const updatedMessages = messages.concat(new ChatMessage('user', newMessage));
        setMessages(updatedMessages);
        setNewMessage('');

        const request = new AgentRequest();
        request.messages = updatedMessages;
        request.symptomsData = symptoms;
        request.userData = stateData;
        request.voucherId = voucherId;
        const response = await callAgent(APIEndpoint.Questioner, request);

        console.debug("Response result: " + JSON.stringify(response));

        if (isValidArray(response.userData, "user data")) {
            setStateData(response.userData);
        }

        if (isValidArray(response.symptomsData, "symptoms")) {
            setSymptoms(response.symptomsData);
        }

        if (response.voucherId) {
            setVoucherId(response.voucherId);
        }

        if (response.nextMessage) {
            setMessages(updatedMessages.concat(response.nextMessage));
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
                <DataTable stateData={stateData} voucherId={voucherId}/>
            </Paper>
        </div>
    );
}

export default ChatApp;
