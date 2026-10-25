import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/card';
import AlertModal from '../src/components/messagesModal';
import MotivosPeticao from '../src/components/peticoes/MotivosPeticao';

export default function PeticaoMotivosPage() {
    return (
        <div>
            <AlertModal />
            <Card>
                <CardHeader><CardTitle>Motivos de Petição</CardTitle></CardHeader>
                <CardContent>
                    <MotivosPeticao />
                </CardContent>
            </Card>
        </div>
    );
}
