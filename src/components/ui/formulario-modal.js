import { Banner } from './banner';
import { Button } from './button';
import { CampoSelecao, CampoTexto } from './campos';
import { Dialogo, DialogoCabecalho, DialogoRodape } from './dialogo';
import { Interruptor } from './interruptor';

// Classes escritas por extenso para o Tailwind enxergá-las.
const SPAN = {
  1: 'md:col-span-1', 2: 'md:col-span-2', 3: 'md:col-span-3', 4: 'md:col-span-4', 5: 'md:col-span-5', 6: 'md:col-span-6',
  7: 'md:col-span-7', 8: 'md:col-span-8', 9: 'md:col-span-9', 10: 'md:col-span-10', 11: 'md:col-span-11', 12: 'md:col-span-12',
};

// O <select> nativo devolve texto; devolve o valor original da opção (número, quando for o caso).
const valorOriginal = (campo, texto) => campo.options.find((o) => String(o.value) === texto)?.value ?? texto;

const restantes = (valor, max) => (max && String(valor ?? '').length > 0 ? `${max - String(valor).length} caracteres restantes` : undefined);

/**
 * Modal de cadastro/edição guiado por uma lista de campos.
 * campo: { name, label, disabled?, max?, type?, required?, upper?, span? (1-12 em telas >= md, padrão 12), rows?, options?: [{value,label}], interruptor?, dica? }
 * `valores` é o objeto do formulário; `aoMudar({ target: { name, value } })` atualiza (mesmo contrato do onChange nativo).
 */
export function FormularioModal({ aberto, titulo, aoFechar, aoGravar, campos, valores, aoMudar, aviso, tamanho = 'lg', rotuloGravar = 'Gravar', gravando = false, antes, depois }) {
  return (
    <Dialogo aberto={Boolean(aberto)} aoFechar={aoFechar} tamanho={tamanho}>
      <DialogoCabecalho>{titulo}</DialogoCabecalho>
      {aviso ? <div className="mb-4"><Banner tom="alerta">{aviso}</Banner></div> : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          aoGravar();
        }}
      >
        {antes}
        <div className="grid gap-4 md:grid-cols-12">
          {campos.map((campo) => {
            const id = `form-${campo.name}`;
            const valor = valores[campo.name];
            const span = SPAN[campo.span || 12];
            if (campo.interruptor) {
              return (
                <div key={campo.name} className={`${span} md:self-center`}>
                  <Interruptor id={id} marcado={Boolean(valor)} aoMudar={(v) => aoMudar({ target: { name: campo.name, value: v } })}>{campo.label}</Interruptor>
                </div>
              );
            }
            if (campo.options) {
              return (
                <div key={campo.name} className={span}>
                  <CampoSelecao id={id} label={campo.label} obrigatorio={campo.required} disabled={campo.disabled} name={campo.name} value={valor ?? ''} onChange={(e) => aoMudar({ target: { name: campo.name, value: valorOriginal(campo, e.target.value) } })} dica={campo.dica}>
                    <option value="">{campo.vazio || 'Selecione'}</option>
                    {campo.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </CampoSelecao>
                </div>
              );
            }
            return (
              <div key={campo.name} className={span}>
                <CampoTexto
                  id={id}
                  label={campo.label}
                  obrigatorio={campo.required}
                  name={campo.name}
                  type={campo.type || 'text'}
                  multiline={Boolean(campo.rows)}
                  rows={campo.rows}
                  maxLength={campo.max}
                  dica={campo.dica ?? restantes(valor, campo.max)}
                  required={campo.required}
                  disabled={campo.disabled}
                  autoComplete="off"
                  className={campo.upper ? 'uppercase' : undefined}
                  value={valor ?? ''}
                  onChange={aoMudar}
                />
              </div>
            );
          })}
        </div>
        {depois}
        <DialogoRodape>
          <Button type="button" variant="outline" onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" disabled={gravando}>{rotuloGravar}</Button>
        </DialogoRodape>
      </form>
    </Dialogo>
  );
}
