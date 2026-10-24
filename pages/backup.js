import Backup from '../src/components/backup';
import AuthGuard from '../src/components/authGuard';

const BackupPage = () => {
    return (
        <AuthGuard>
            <Backup />
        </AuthGuard>
    );
};

export default BackupPage;
