import {
    Grid,
    Box,
    Avatar,
    Typography,
    Paper,
} from '@mui/material';
import { useProfile } from '../../lib/hooks/useProfile';
import { useParams } from 'react-router';
import { useAccount } from '../../lib/hooks/useAccount';

export default function ProfileHeader() {
    const { id } = useParams();
    const { isCurrentUser } = useProfile(id);
    const { currentUser } = useAccount();

    if (!currentUser) return null;

    return (
        <Paper elevation={3} sx={{ padding: 4, borderRadius: 3 }}>
            <Grid container spacing={2}>
                <Grid size={8}>
                    <Box display="row" gap={3} alignItems="center">
                        <Avatar
                            alt="User Image"
                            src={isCurrentUser ? currentUser.imageUrl : undefined}
                            sx={{ width: 150, height: 150 }}
                        />
                        <Typography variant="h4" sx={{ mt: 2 }}>
                            {currentUser.displayName}
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
}
