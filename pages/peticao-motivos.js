import { Box } from '@mui/material';
import BaseCard from '../src/components/baseCard/BaseCard';
import AlertModal from '../src/components/messagesModal';
import MotivosPeticao from '../src/components/peticoes/MotivosPeticao';
import { modalFormRootSx } from '../src/components/modal/_shared/modalFormStyles';

export default function PeticaoMotivosPage() {
    return (
        <Box sx={modalFormRootSx} className="queue-page">
            <AlertModal />
            <BaseCard title="Motivos de Petição">
                <MotivosPeticao />
            </BaseCard>
        </Box>
    );
}
