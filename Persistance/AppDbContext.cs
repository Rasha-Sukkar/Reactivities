using System;
using Domain;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Persistance;

public class AppDbContext(DbContextOptions options): IdentityDbContext<User>(options)
{
    public required DbSet<Activity> Activities { get; set; } //table named Activities

}