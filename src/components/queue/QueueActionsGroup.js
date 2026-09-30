import React from 'react';
import { Box, Button, Fab } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import DatePicker from '../inputs/datePicker';
import { ActionCreateFab } from '../actions';

// Datepickers (só em "Realizados"), imprimir, adicionar e Agenda numa única linha: o grupo não
// quebra por dentro, então os datepickers nunca ocupam uma linha inteira sozinhos.
export default function QueueActionsGroup({
  isDone,
  doneFrom,
  doneTo,
  onChangeFrom,
  onChangeTo,
  onPrint,
  isPrinting,
  onAdd,
  onAgenda,
  controlSx,
  fabControlSx,
}) {
  return (
    <Box
      data-testid="queue-actions-group"
      sx={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: 1, flex: '0 0 auto' }}
    >
      {isDone && (
        <>
          <DatePicker
            label="Baixa de"
            name="doneFrom"
            value={doneFrom}
            setValue={onChangeFrom}
            sx={{ width: 150, minWidth: 150, ...controlSx }}
          />
          <DatePicker
            label="Baixa até"
            name="doneTo"
            value={doneTo}
            setValue={onChangeTo}
            sx={{ width: 150, minWidth: 150, ...controlSx }}
          />
        </>
      )}

      <Fab
        onClick={onPrint}
        color="success"
        aria-label="imprimir"
        title="Imprimir listagem filtrada"
        disabled={isPrinting}
        sx={fabControlSx}
        className="queue-page__fab queue-page__fab--print"
      >
        <FeatherIcon icon={isPrinting ? 'loader' : 'printer'} />
      </Fab>

      <ActionCreateFab onClick={onAdd} title="inserir na fila" sx={fabControlSx} className="queue-page__fab queue-page__fab--add" />

      {!isDone && (
        <Button
          variant="outlined"
          size="small"
          onClick={onAgenda}
          sx={{ ml: 1, whiteSpace: 'nowrap' }}
          className="queue-page__agenda-link"
        >
          Agenda de Tratamentos
        </Button>
      )}
    </Box>
  );
}
