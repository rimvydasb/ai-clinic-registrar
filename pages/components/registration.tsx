import React from 'react';
import {Table, TableBody, TableCell, TableContainer, TableRow, Paper, Typography} from '@mui/material';

const DataTable = ({ stateData }) => {

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const isAllValueFilled = stateData && !stateData.some(item => item.value === null || item.value.trim() === '');

    return (
        isAllValueFilled && (
            <TableContainer component={Paper} style={{ marginTop: '20px', backgroundColor: '#FFF347' }}>
                <Typography variant="h6" id="tableTitle" component="div" margin={1}>
                    Doctor's visit registration voucher ID 123456
                </Typography>
                <Table>
                    <TableBody>
                        {stateData.map((item, index) => (
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
