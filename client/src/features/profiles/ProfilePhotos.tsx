import { Box, Button, Divider, ImageList, ImageListItem, Typography } from "@mui/material";
import { useProfile } from "../../lib/hooks/useProfile";
import { useParams } from "react-router";
import { useState } from "react";
import PhotoUploadWidget from "../../app/shared/components/PhotoUploadWidget";
import StarButton from "../../app/shared/components/StarButton";
import DeleteButton from "../../app/shared/components/DeleteButton";
import { useAccount } from "../../lib/hooks/useAccount";

export default function ProfilePhotos() {
    const { id } = useParams();
    const { photos, loadingPhotos, isCurrentUser, uploadPhoto,
        setMainPhoto, deletePhoto } = useProfile(id);
    const { currentUser } = useAccount();
    const [editMode, setEditMode] = useState(false);

    const handlePhotoUpload = (file: Blob) => {
        uploadPhoto.mutate(file, {
            onSuccess: () => {
                setEditMode(false);
            }
        });
    }

    if (loadingPhotos) return <Typography>Loading photos...</Typography>

    if (!photos) return <Typography>No photos found for this user</Typography>

    return (
        <Box>
            <Box display='flex' justifyContent='space-between'>
                <Typography variant='h5'>Photos</Typography>

                {isCurrentUser && (
                    <Button onClick={() => setEditMode(!editMode)}>
                        {editMode ? 'Cancel' : 'Add photo'}
                    </Button>)}
            </Box>
            <Divider sx={{ my: 2 }} />

            {editMode ? (
                <PhotoUploadWidget
                    uploadPhoto={handlePhotoUpload}
                    loading={uploadPhoto.isPending}
                />
            ) : (
                <>
                    {photos.length === 0 ? (
                        <Typography>No photos added yet</Typography>
                    ) : (
                        <ImageList sx={{ height: 450 }} cols={6} rowHeight={164}>
                            {photos.map((item) => (
                                <ImageListItem key={item.id}>
                                    <img
                                        src={item.url}
                                        alt={'user profile image'}
                                        loading="lazy"
                                        style={{objectFit: 'cover', width: '100%', height: '100%'}}
                                    />
                                    {isCurrentUser && (
                                        <div>
                                            <Box
                                                sx={{ position: 'absolute', top: 0, left: 0 }}
                                                onClick={() => setMainPhoto.mutate(item)}
                                            >
                                                <StarButton selected={item.url === currentUser?.imageUrl} />
                                            </Box>
                                            {currentUser?.imageUrl !== item.url && (
                                                <Box
                                                    sx={{ position: 'absolute', top: 0, right: 0 }}
                                                    onClick={() => deletePhoto.mutate(item.id)}
                                                >
                                                    <DeleteButton />
                                                </Box>
                                            )}
                                        </div>
                                    )}
                                </ImageListItem>
                            ))}
                        </ImageList>
                    )}
                </>
            )}
        </Box>
    );
}
