using Microsoft.EntityFrameworkCore;
using Persistance;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(opt=>
{
    opt.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"));
});
builder.Services.AddCors();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseCors(x => x.AllowAnyHeader().AllowAnyMethod().WithOrigins("http://localhost:3000","https://localhost:3000"));

app.MapControllers();

using var scope = app.Services.CreateScope();// Create a temporary service container so I can safely use scoped services (like DbContext). (using so it gets disposed once it finished with it by the garbag collector)
var services = scope.ServiceProvider;

try
{
    var context = services.GetRequiredService<AppDbContext>(); //access to db + be able to query from it
    await context.Database.MigrateAsync(); //will create db if not exista and do any pending migrations
    await DbInitializer.SeedData(context); 
}
catch (Exception ex)
{
    var logger = services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "An error occured during migration.");
}

app.Run();
