using System;
using Application.Core;
using Application.Profiles.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Profiles.Queries;

public class GetProfile
{
    public class Query : IRequest<Result<UserProfile>>
    {
        public required string Id { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Query, Result<UserProfile>>
    {
        public async Task<Result<UserProfile>> Handle(Query request, CancellationToken cancellationToken)
        {
            var user = await context.Users
                .SingleOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (user == null)
                return Result<UserProfile>.Failure("Profile not found", 404);

            var profile = new UserProfile
            {
                Id = user.Id,
                DisplayName = user.DisplayName ?? "",
                Bio = user.Bio,
                ImageUrl = user.ImageUrl
            };

            return Result<UserProfile>.Success(profile);
        }
    }
}
