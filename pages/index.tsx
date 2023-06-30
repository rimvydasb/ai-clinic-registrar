import React, {ChangeEvent, useState} from 'react';
import {Button, List, ListItem, ListItemText, Paper, TextField, Typography} from '@mui/material';
import {green} from '@mui/material/colors';
import DataTable from "./components/registration";
import styles from "./index.module.css";
import HealingIcon from '@mui/icons-material/Healing';
import {ChatMessage, DataItem} from "./lib/objectmodel";
import {APIEndpoint, post} from "./lib/client.lib";
import {ChatCompletionResponseMessageRoleEnum} from "openai";

const INIT_STATE_DATA: DataItem[] = [
    {field: "name", label: "user's name", value: null},
    {field: "telephone", label: "user's telephone number", value: null},
]

const ChatApp: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        new ChatMessage(ChatCompletionResponseMessageRoleEnum.Assistant, "Hello, I'm the doctor's assistant. How can I help you?"),
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [stateData, setStateData] = useState<DataItem[]>(INIT_STATE_DATA);

    const handleNewMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
        setNewMessage(event.target.value);
    };

    const handleSendMessage = async () => {
        const updatedMessages = messages.concat(new ChatMessage(ChatCompletionResponseMessageRoleEnum.User, newMessage));
        setMessages(updatedMessages);
        setNewMessage('');

        const extractedAnswers = await post(APIEndpoint.Observer, updatedMessages, stateData);

        if (!DataItem.validate(extractedAnswers)) {
            return;
        }

        setStateData(extractedAnswers);

        const newAssistantReply = await post(APIEndpoint.Questioner, updatedMessages, extractedAnswers);

        console.log("Assistant reply: " + JSON.stringify(newAssistantReply));

        if (newAssistantReply) {
            setMessages(updatedMessages.concat(newAssistantReply));
        }
    };

    return (
        <div style={{maxWidth: '600px', margin: '0 auto', padding: '20px'}}>
            <Typography variant="h6" className={styles.title}><HealingIcon style={{ color: '#4CAF50' }} />  My Clinic</Typography>
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
