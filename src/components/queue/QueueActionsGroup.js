import React from 'react';
import { Loader, Printer } from 'lucide-react';
import DatePicker from '../inputs/datePicker';
import { ActionCreateFab } from '../actions';
import { Button } from '../ui/button';

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
}) {
  return (
    <div data-testid="queue-actions-group" className="flex flex-none flex-nowrap items-center gap-2">
      {isDone && (
        <>
          <DatePicker label="Baixa de" name="doneFrom" value={doneFrom} setValue={onChangeFrom} className="w-[150px] min-w-[150px]" />
          <DatePicker label="Baixa até" name="doneTo" value={doneTo} setValue={onChangeTo} className="w-[150px] min-w-[150px]" />
        </>
      )}

      <Button
        variant="success"
        size="icon"
        onClick={onPrint}
        aria-label="imprimir"
        title="Imprimir listagem filtrada"
        disabled={isPrinting}
      >
        {isPrinting ? <Loader className="animate-spin" /> : <Printer />}
      </Button>

      <ActionCreateFab onClick={onAdd} title="inserir na fila" />

      {!isDone && (
        <Button variant="outline" size="sm" onClick={onAgenda} className="ml-2">
          Agenda de Tratamentos
        </Button>
      )}
    </div>
  );
}
