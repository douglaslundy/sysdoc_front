import React, { useEffect, useRef, useState } from 'react';
import { Button, Grid, Paper, Typography } from '@material-ui/core';
import { useRouter } from 'next/router';
import { getCalledCalls, getLastsCalls } from '../../store/fetchActions/calls';
import { useDispatch, useSelector } from 'react-redux';
import { useSpeechSynthesis } from 'react-speech-kit';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default () => {


    const route = useRouter();
    const backPage = () => {
        route.push('/');
    }

    const dispatch = useDispatch();
    const { call, calls } = useSelector(state => state.calls);
    const [actualCall, setActualCall] = useState({});

    const { speak } = useSpeechSynthesis();

    useEffect(() => {
        const intervalId = setInterval(() => {
            dispatch(getCalledCalls());
        }, 6000); // 3000 milissegundos = 3 segundos

        // Limpar o intervalo quando o componente for desmontado
        return () => clearInterval(intervalId);
    }, [dispatch]); // Certifique-se de incluir dispatch como uma dependência

    useEffect(() => {

        const fetchData = async () => {
            if (calls.length <= 0) {
                dispatch(getLastsCalls());
            }

            if (call && call.id && (call.id !== actualCall?.id || call.when_was_called !== actualCall?.when_was_called)) {
                setActualCall(call);
                await playSound();
                await speakText(`Senha numero ${call?.id},  por favor se dirija até a sala 2`);
                dispatch(getLastsCalls());
            }
        };

        fetchData();
    }, [call?.id]);


    const audioRef = useRef(null);

    const playSound = () => {
        return new Promise((resolve) => {
            audioRef.current.play();
            setTimeout(() => {
                resolve();
            }, 1000); // Substitua 1000 pelo tempo real de duração do seu som em milissegundos
        });
    };

    const speakText = say => {
        return new Promise((resolve) => {
            speak({ text: say });
            setTimeout(() => {
                resolve();
            }, 9000)
        })
    };

    const getCurrentDate = () => {
        const currentDate = new Date();
        const formattedDate = format(currentDate, "dd 'de' MMMM 'de' yyyy - HH:m", { locale: ptBR });
        return formattedDate;
    };

    return (
        <div style={{ padding: 0 }}>

            <audio ref={audioRef}>
                <source src="/file/tindon.mp3" type="audio/mpeg" />
                Seu navegador não suporta o elemento de áudio.
            </audio>


            <Grid container spacing={3}>
                {/* Grid Central */}
                <Grid item xs={9}>
                    <Paper style={{ height: '60vh', backgroundColor: 'white', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Typography variant="h1" align="center">
                            {actualCall && actualCall.id ? `senha: ${actualCall.id}` : "Fila zerada"}
                            <div style={{ fontSize: 50 }}>
                                sala: 02
                            </div>
                        </Typography>
                        {/* Conteúdo do atendimento ao cliente */}
                    </Paper>
                </Grid>

                {/* Grid à Direita */}
                <Grid item xs={3}>
                    <Paper style={{ height: '60vh', backgroundColor: 'blue', display: 'flex', justifyContent: 'center', color: 'white', padding: 20 }}>
                        <Typography variant="h6">
                            Últimas Chamadas

                            {
                                calls.map((call, index) => (
                                    <>
                                        <div key={call.id} style={{ fontSize: index == 0 ? 70 : index == 1 ? 50 : 40 }}>
                                            {call.id}
                                        </div>
                                        <div style={{ fontSize: 20 }}>
                                            sala: 02 - {call.when_was_called && format(parseISO(call.when_was_called), 'HH:mm:ss')}
                                            <div style={{ fontSize: 10 }}>
                                                _____________________________________________
                                            </div>
                                        </div>

                                    </>
                                ))

                            }



                        </Typography>
                        {/* Informações do cliente */}
                    </Paper>
                </Grid>

                {/* Grid em Baixo */}
                <Grid item xs={12}>
                    <Paper style={{ height: '20vh', backgroundColor: 'red', color: 'white', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Typography variant="h4">
                            {getCurrentDate()}
                        </Typography>
                        {/* Lista de chamadas anteriores */}
                    </Paper>
                </Grid>
            </Grid>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button style={{ padding: '20px' }} onClick={backPage}>
                    Voltar
                </Button>
                <Button style={{ padding: '20px' }} onClick={playSound}>
                    Habilitar Áudio
                </Button>
            </div>
        </div>
    );
};
