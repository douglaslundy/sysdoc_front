import React from 'react';
import { Button, Grid, Paper, Typography } from '@material-ui/core';
import { useRouter } from 'next/router';

const CustomerServiceScreen = () => {

    const route = useRouter();
    const backPage = () => {
        route.push('/');
    }
    
    return (
        <div style={{ padding: 0 }}>
            <Grid container spacing={3}>
                {/* Grid Central */}
                <Grid item xs={9}>
                    <Paper style={{ height: '60vh', backgroundColor: 'white', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Typography variant="h1" align="center" gutterBottom>
                            Senha Atual: 12345
                        </Typography>
                        {/* Conteúdo do atendimento ao cliente */}
                    </Paper>
                </Grid>

                {/* Grid à Direita */}
                <Grid item xs={3}>
                    <Paper style={{ height: '60vh', backgroundColor: 'blue', display: 'flex', justifyContent:'center', color: 'white', padding: 20 }}>
                        <Typography variant="h6" gutterBottom>
                            Chamadas Anteriores
                        </Typography>
                        {/* Informações do cliente */}
                    </Paper>
                </Grid>

                {/* Grid em Baixo */}
                <Grid item xs={12}>
                    <Paper style={{ height: '20vh', backgroundColor: 'red', color: 'white', padding: 20 }}>
                        <Typography variant="h6" gutterBottom>
                            Informações do Cliente
                        </Typography>
                        {/* Lista de chamadas anteriores */}
                    </Paper>
                </Grid>
            </Grid>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button style={{ padding: '20px' }} onClick={ backPage}>
                    Voltar
                </Button>
            </div>
        </div>
    );
};

export default CustomerServiceScreen;
