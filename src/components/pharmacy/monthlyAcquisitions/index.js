import React, { useEffect, useState } from 'react';
import InputMask from 'react-input-mask';
import { useDispatch, useSelector } from 'react-redux';
import AlertModal from '../../messagesModal';
import MedicineMonthlyAcquisitionDialog from '../../modal/medicineMonthlyAcquisition';
import { getMedicinesSelect } from '../../../store/fetchActions/medicines';
import { getMonthlyAcquisitions } from '../../../store/fetchActions/medicineMonthlyAcquisitions';
import { clearMedicinesState } from '../../../store/ducks/medicines';
import { clearMonthlyAcquisitionsState } from '../../../store/ducks/medicineMonthlyAcquisitions';
import { clearAlertMessages, clearMessages } from '../../../store/ducks/Layout';
import { ActionCreateFab } from '../../actions';
import { Campo, Input } from '../../ui/campos';
import { PaginaDeLista } from '../../ui/pagina-de-lista';

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const formatUnit = (value) => {
  if (!value) return '-';
  const unit = String(value).trim().toLowerCase();
  if (unit === 'un' || unit === 'unit') return 'Unidade';
  return value;
};

export default function MonthlyAcquisitionsManager() {
  const dispatch = useDispatch();
  const { monthlyAcquisitions, pagination } = useSelector((state) => state.medicineMonthlyAcquisitions);
  const { isOpenLoading } = useSelector((state) => state.layout);
  const [dialogOpen, setDialogOpen] = useState(false);
  const now = new Date();
  const defaultMaskedMonth = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const [referenceMonth, setReferenceMonth] = useState(defaultMaskedMonth);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const totalCount = Number(pagination?.total || 0);
  const lastPageIndex = Math.max(0, Math.ceil(totalCount / perPage) - 1);

  const toApiMonth = (maskedMonth) => {
    const cleaned = String(maskedMonth || '').replace(/\D/g, '').slice(0, 6);
    if (cleaned.length !== 6) return null;
    const month = cleaned.slice(0, 2);
    const year = cleaned.slice(2, 6);
    const monthNum = Number(month);
    if (monthNum < 1 || monthNum > 12) return null;
    return `${year}-${month}`;
  };

  const buildParams = (overrides = {}) => {
    const apiMonth = toApiMonth(referenceMonth);

    return {
      reference_month: apiMonth || undefined,
      page: page + 1,
      per_page: perPage,
      ...overrides,
    };
  };

  useEffect(() => {
    dispatch(getMedicinesSelect({ active: 1, limit: 500 }));
    return () => {
      dispatch(clearMedicinesState());
      dispatch(clearMonthlyAcquisitionsState());
      dispatch(clearAlertMessages());
      dispatch(clearMessages());
    };
  }, [dispatch]);

  useEffect(() => {
    const apiMonth = toApiMonth(referenceMonth);
    if (!apiMonth) return;
    dispatch(getMonthlyAcquisitions(buildParams({ reference_month: apiMonth, page: 1 })));
  }, [referenceMonth, dispatch]);

  useEffect(() => {
    if (pagination?.current_page) {
      setPage(Math.max(0, pagination.current_page - 1));
    }
  }, [pagination?.current_page]);

  useEffect(() => {
    if (page > lastPageIndex) {
      setPage(lastPageIndex);
      dispatch(getMonthlyAcquisitions(buildParams({ page: lastPageIndex + 1 })));
    }
  }, [page, lastPageIndex, dispatch]);

  const handleReferenceMonth = (event) => {
    setReferenceMonth(event.target.value);
    setPage(0);
  };

  const handlePerPage = (value) => {
    setPerPage(value);
    setPage(0);
    dispatch(getMonthlyAcquisitions(buildParams({ per_page: value, page: 1 })));
  };

  const handlePage = (newPage) => {
    setPage(newPage);
    dispatch(getMonthlyAcquisitions(buildParams({ page: newPage + 1 })));
  };

  const onSuccess = () => {
    setDialogOpen(false);
    const apiMonth = toApiMonth(referenceMonth);
    if (!apiMonth) return;
    dispatch(getMonthlyAcquisitions(buildParams({ reference_month: apiMonth })));
  };

  const colunas = [
    { chave: 'medicamento', titulo: 'Medicamento', render: (s) => `${s.medicine_item?.active_ingredient ?? ''} ${s.medicine_item?.concentration ?? ''}`.trim() },
    { chave: 'quantidade', titulo: 'Qtd.', render: (s) => s.acquired_quantity },
    { chave: 'unidade', titulo: 'Unidade', render: (s) => formatUnit(s.unit_measure) },
    { chave: 'origem', titulo: 'Origem', render: (s) => s.source_document || '-' },
    { chave: 'obs', titulo: 'Observação', render: (s) => s.note || '-' },
  ];

  const barra = (
    <>
      <div className="min-w-[160px]">
        <Campo id="aquisicoes-mes" label="Mês de referência">
          {(p) => (
            <InputMask mask="99/9999" value={referenceMonth} onChange={handleReferenceMonth}>
              {(inputProps) => <Input {...p} {...inputProps} placeholder="MM/AAAA" inputMode="numeric" />}
            </InputMask>
          )}
        </Campo>
      </div>
      <ActionCreateFab title="Novo" className="ml-auto" onClick={() => setDialogOpen(true)} />
    </>
  );

  return (
    <PaginaDeLista
      titulo="Aquisições Mensais de Medicamentos"
      barra={barra}
      colunas={colunas}
      linhas={monthlyAcquisitions}
      chaveDaLinha={(s) => s.id}
      carregando={Boolean(isOpenLoading)}
      vazio="Nenhum registro encontrado!"
      rotuloDaTabela="aquisições mensais"
      paginacao={{ total: totalCount, pagina: page, porPagina: perPage, opcoes: PER_PAGE_OPTIONS, aoMudarPagina: handlePage, aoMudarPorPagina: handlePerPage }}
    >
      <AlertModal />
      <MedicineMonthlyAcquisitionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={onSuccess} />
    </PaginaDeLista>
  );
}
