using System;
using Application.Interfaces;
using Application.Profiles.DTOs;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace Infrastructure.Photos;

public class LocalPhotoService(IWebHostEnvironment env) : IPhotoService
{
    public async Task<PhotoUploadResult?> UploadPhoto(IFormFile file)
    {
        if (file.Length <= 0) return null;

        var photosPath = Path.Combine(env.WebRootPath, "images", "photos");
        Directory.CreateDirectory(photosPath);

        var publicId = Guid.NewGuid().ToString();
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (string.IsNullOrEmpty(extension)) extension = ".jpg";

        var fileName = publicId + extension;
        var filePath = Path.Combine(photosPath, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return new PhotoUploadResult
        {
            PublicId = publicId,
            Url = $"/images/photos/{fileName}"
        };
    }

    public Task<string> DeletePhoto(string publicId)
    {
        var photosPath = Path.Combine(env.WebRootPath, "images", "photos");

        var files = Directory.GetFiles(photosPath, publicId + ".*");

        foreach (var file in files)
        {
            File.Delete(file);
        }

        return Task.FromResult("ok");
    }
}
