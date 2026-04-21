import { Button, Paper, Typography } from "@mui/material";
import { Check } from "@mui/icons-material";
import { useAccount } from "../../lib/hooks/useAccount";

type Props = {
    email?: string;
}

export default function RegisterSuccess({ email }: Props) {
    const { resendConfirmationEmail } = useAccount();

    if (!email) return null;

    return (
        <Paper
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                gap: 2,
                p: 6,
                maxWidth: 'sm',
                mx: 'auto',
                borderRadius: 3,
            }}
        >
            <Check sx={{ fontSize: 90 }} color="primary" />
            <Typography variant="h4" fontWeight={600}>
                You have successfully registered!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420 }}>
                Please check your email to confirm your account.
            </Typography>
            <Button
                variant="contained"
                size="large"
                sx={{ mt: 2, textTransform: 'none' }}
                disabled={resendConfirmationEmail.isPending}
                onClick={() => resendConfirmationEmail.mutate({ email })}
            >
                Re-send confirmation email
            </Button>
        </Paper>
    );
}
