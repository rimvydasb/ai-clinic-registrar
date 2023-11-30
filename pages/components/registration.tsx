import React from 'react';
import {Table, TableBody, TableCell, TableContainer, TableRow, Paper, Typography} from '@mui/material';

const DataTable = ({stateData, symptoms, voucherId}) => {

    const capitalizeFirstLetter = (string) => {
        return (string) ? string.charAt(0).toUpperCase() + string.slice(1) : '';
    };

    return (
        voucherId !== null && stateData && (
            <TableContainer component={Paper} style={{marginTop: '20px', backgroundColor: '#FFF347'}}>
                <Typography variant="h6" id="tableTitle" component="div" margin={1}>
                    Doctor's visit registration voucher ID {voucherId}
                </Typography>
                <Table>
                    <TableBody>
                        {stateData.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{capitalizeFirstLetter(item.field)}</TableCell>
                                <TableCell>{item.value}</TableCell>
                            </TableRow>
                        ))}
                        {symptoms.filter((symptom) => symptom.value != null).map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{capitalizeFirstLetter(item.field)}</TableCell>
                                <TableCell>{item.value}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        )
    );
};

export default DataTable;
