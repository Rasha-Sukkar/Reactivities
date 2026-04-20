# Reactivities — Complete Course Reference

A full reference for the Reactivities project (Neil Cummings, Udemy). Covers every concept, the why behind each decision, step-by-step flows, and glossary of terms. Open this in VSCode or paste into Word.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack (and Why)](#2-tech-stack-and-why)
3. [Solution Architecture — Clean Architecture](#3-solution-architecture--clean-architecture)
4. [Backend — Domain Layer](#4-backend--domain-layer)
5. [Backend — Persistance Layer](#5-backend--persistance-layer)
6. [Backend — Application Layer (CQRS + MediatR)](#6-backend--application-layer-cqrs--mediatr)
7. [Backend — API Layer](#7-backend--api-layer)
8. [Backend — Infrastructure Layer](#8-backend--infrastructure-layer)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Error Handling (Server + Client)](#10-error-handling-server--client)
11. [Real-time with SignalR](#11-real-time-with-signalr)
12. [Photo Uploads](#12-photo-uploads)
13. [Paging, Sorting, Filtering](#13-paging-sorting-filtering)
14. [Frontend — Overall Structure](#14-frontend--overall-structure)
15. [Frontend — Routing & Guards](#15-frontend--routing--guards)
16. [Frontend — State Management (TanStack Query + MobX)](#16-frontend--state-management-tanstack-query--mobx)
17. [Frontend — Forms (react-hook-form + Zod)](#17-frontend--forms-react-hook-form--zod)
18. [Frontend — Maps, Cropping, Infinite Scroll](#18-frontend--maps-cropping-infinite-scroll)
19. [Infrastructure (Docker, Vite, Configuration)](#19-infrastructure-docker-vite-configuration)
20. [Development & Publishing Workflow](#20-development--publishing-workflow)
21. [Glossary](#21-glossary)

---

## 1. Project Overview

**Reactivities** is a social activities app. Users register, log in, browse upcoming activities (filtered/paged), create/edit/delete activities, attend or host them, upload profile photos, follow other users, and chat via real-time comments on each activity.

The course builds it as a single full-stack solution:

- **Backend:** ASP.NET Core 8 Web API with Clean Architecture, CQRS (MediatR), Entity Framework Core, Identity (cookie auth), SignalR.
- **Frontend:** React 19 + TypeScript + Vite + Material UI, with TanStack React Query for server state, MobX for UI state, react-hook-form + Zod for forms.
- **Database:** SQL Server 2022 in a Docker container (started life as SQLite; switched later).

---

## 2. Tech Stack (and Why)

### Backend

| Technology | Why |
|---|---|
| **ASP.NET Core 8** | Modern, cross-platform web framework with built-in DI, middleware, Identity, SignalR, and minimal APIs. |
| **Entity Framework Core** | O/RM — work with DB as C# objects. Migrations version the schema. |
| **MediatR** | Implements CQRS — commands/queries become classes with handlers. Decouples API controllers from business logic. |
| **AutoMapper** | Maps entities → DTOs automatically so we don't return raw DB models (which would over-fetch or expose internals). |
| **FluentValidation** | Declarative validation on command/query inputs with fluent API. Integrated into MediatR pipeline. |
| **ASP.NET Core Identity** | User management + password hashing + cookies. Minimal API endpoints via `MapIdentityApi<User>()`. |
| **SignalR** | WebSocket-based real-time communication. Used for the comments feature. |
| **SQL Server (Docker)** | Production-grade DB. Dockerized so you don't have to install SQL Server locally. |

### Frontend

| Technology | Why |
|---|---|
| **React 19** | Component-based UI library — standard for modern SPAs. |
| **Vite** | Fast dev server with HMR, uses native ESM. Builds into `API/wwwroot` for production. |
| **TypeScript** | Static types prevent a massive class of runtime bugs. |
| **Material UI (MUI) v7** | Ready-made component library — consistent design without hand-rolling CSS. |
| **React Router v7** | Declarative client-side routing. |
| **TanStack React Query v5** | Manages **server state** — caching, background refetch, invalidation, mutations, infinite queries. |
| **MobX** | Manages **UI/client state** — reactive, observable stores with minimal boilerplate. |
| **react-hook-form** | Performant, uncontrolled-by-default form library. Integrates with resolvers for validation. |
| **Zod** | Schema validation. Single source of truth for both form validation and TypeScript types (via `z.infer`). |
| **Axios** | HTTP client with interceptors — used to attach credentials and centralize error handling. |
| **@microsoft/signalr** | Client SDK for the SignalR hub. |
| **react-cropper / cropperjs** | Image cropping before photo upload. |
| **react-dropzone** | Drag-and-drop file selection. |
| **leaflet / react-leaflet** | Interactive maps for activity locations. |
| **react-toastify** | Non-blocking toast notifications. |
| **react-intersection-observer** | Observes when a sentinel element enters the viewport — drives infinite scroll. |
| **date-fns** | Date formatting/parsing utilities. |

### Why two state libraries?

- **React Query** is for **data from the server** — it handles fetching, caching, and invalidation automatically. Treat it as the cache of "what the server says."
- **MobX** is for **client-only UI state** — filter selections, loading indicators, counters. This is state that never belongs to the server.

Mixing them is a good pattern: don't stuff server data into MobX stores, and don't stuff pure UI state into React Query.

---

## 3. Solution Architecture — Clean Architecture

Clean Architecture organizes code in concentric layers — **dependencies only point inward**. Outer layers know about inner layers; inner layers know nothing about outer layers.

```
    ┌─────────────────────────────────┐
    │       API (outermost)           │
    │  ┌───────────────────────────┐  │
    │  │   Infrastructure          │  │
    │  │  ┌─────────────────────┐  │  │
    │  │  │   Application       │  │  │
    │  │  │  ┌───────────────┐  │  │  │
    │  │  │  │  Persistance  │  │  │  │
    │  │  │  │  ┌─────────┐  │  │  │  │
    │  │  │  │  │ Domain  │  │  │  │  │ ← innermost
    │  │  │  │  └─────────┘  │  │  │  │
    │  │  │  └───────────────┘  │  │  │
    │  │  └─────────────────────┘  │  │
    │  └───────────────────────────┘  │
    └─────────────────────────────────┘
```

### The projects

| Project | Depends on | Contains |
|---|---|---|
| **Domain** | nothing | Entities (Activity, User, Photo, Comment, ActivityAttendee, UserFollowing). Pure C# classes — no EF, no ASP.NET. |
| **Persistance** | Domain | `AppDbContext`, migrations, `DbInitializer` (seed data). |
| **Application** | Domain, Persistance | Business logic: MediatR handlers (commands/queries), DTOs, validators, AutoMapper profiles, interfaces (IUserAccessor, IPhotoService), Core helpers (`Result<T>`, `PagedList<T>`, `AppException`). |
| **Infrastructure** | Application | Implementations of Application interfaces: `UserAccessor` (reads HttpContext), `LocalPhotoService` (file system), security handlers. Anything touching "outside world" tech. |
| **API** | Application, Infrastructure | Controllers, middleware, SignalR hubs, `Program.cs`. HTTP concerns only. |

### Why this layout?

1. **Domain stays pure.** You could swap EF for anything and the entities don't change.
2. **Application depends on interfaces** (`IPhotoService`, `IUserAccessor`) not implementations. Infrastructure provides the implementations. This is the **Dependency Inversion Principle**.
3. **Controllers are thin.** They only translate HTTP ↔ MediatR. All real logic lives in handlers.
4. **Testable.** Mock the interfaces and test handlers without HTTP or a real DB.

---

## 4. Backend — Domain Layer

Pure POCO entity classes. Navigation properties wire up relationships.

### Entities

**Activity** — the central entity.
```csharp
public class Activity {
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Title { get; set; }
    public DateTime Date { get; set; }
    public required string Description { get; set; }
    public required string Category { get; set; }
    public bool IsCancelled { get; set; }
    public required string City { get; set; }
    public required string Venue { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public ICollection<ActivityAttendee> Attendees { get; set; } = [];
    public ICollection<Comment> Comments { get; set; } = [];
}
```

**User** — extends `IdentityUser` so we inherit Id, Email, PasswordHash, etc.
```csharp
public class User : IdentityUser {
    public string? DisplayName { get; set; }
    public string? Bio { get; set; }
    public string? ImageUrl { get; set; }
    public ICollection<ActivityAttendee> Activities { get; set; } = [];
    public ICollection<Photo> Photos { get; set; } = [];
    public ICollection<UserFollowing> Followings { get; set; } = [];
    public ICollection<UserFollowing> Followers { get; set; } = [];
}
```

**ActivityAttendee** — join table (many-to-many between Activity and User) with extra fields.
```csharp
public class ActivityAttendee {
    public string UserId { get; set; }
    public User User { get; set; }
    public string ActivityId { get; set; }
    public Activity Activity { get; set; }
    public bool IsHost { get; set; }
    public DateTime DateJoined { get; set; } = DateTime.UtcNow;
}
```

**Why a join entity instead of `ICollection<User>`?** Because we need extra columns (`IsHost`, `DateJoined`). Pure many-to-many with only the two FKs can use EF's skip navigation, but we need the richer shape.

**Photo**, **Comment**, **UserFollowing** (follower/following join) follow the same pattern.

---

## 5. Backend — Persistance Layer

### AppDbContext

```csharp
public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<User>(options)
{
    public DbSet<Activity> Activities { get; set; }
    public DbSet<ActivityAttendee> ActivityAttendees { get; set; }
    public DbSet<Photo> Photos { get; set; }
    public DbSet<UserFollowing> UserFollowings { get; set; }
    public DbSet<Comment> Comment { get; set; }

    protected override void OnModelCreating(ModelBuilder builder) {
        base.OnModelCreating(builder); // Identity schema
        // composite keys + relationship configuration
    }
}
```

**Key things in `OnModelCreating`:**
- Composite key for `ActivityAttendee`: `{ UserId, ActivityId }`.
- `UserFollowing`: cascade delete on `Observer`, `NoAction` on `Target` (prevents cascade cycles that SQL Server rejects).
- A DateTime UTC converter on `Activity.Date` so Dates round-trip as UTC.
- An index on `Activity.Date` for fast ordering/filtering.

### Migrations

Migrations are EF's way of versioning schema. Each migration is a C# file with `Up()` (apply) and `Down()` (revert).

```bash
# create a migration
dotnet ef migrations add InitialSql -p Persistance -s API

# apply migrations (also done automatically in Program.cs at startup)
dotnet ef database update -p Persistance -s API
```

`Program.cs` calls `context.Database.MigrateAsync()` on startup — this applies any pending migrations, so you don't need to run the update manually in dev.

### DbInitializer (seed data)

Creates 3 test users (bob, tom, jane) with password `Pa$$w0rd` and ~10 activities with varied attendees. Runs once on startup if the DB is empty.

---

## 6. Backend — Application Layer (CQRS + MediatR)

### CQRS — Command Query Responsibility Segregation

**The idea:** separate *reads* (queries) from *writes* (commands). Each becomes its own class with its own handler.

- **Command** = changes state (CreateActivity, EditActivity, DeleteActivity).
- **Query** = reads state (GetActivityList, GetActivityDetails).

### MediatR — the in-process mediator

MediatR provides an `IMediator` you inject into controllers. You send a request object, MediatR finds and calls the matching handler.

```csharp
// In controller
return HandleResult(await Mediator.Send(new GetActivityList.Query { Params = p }));
```

**Why MediatR?**
- **Thin controllers** — one line.
- **One class per use case** — easy to find, easy to test.
- **Pipeline behaviors** — cross-cutting concerns (validation, logging) wrap every handler without touching handler code.

### Handler shape (typical)

```csharp
public class CreateActivity {
    public class Command : IRequest<Result<string>> {
        public required CreateActivityDto ActivityDto { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper, IUserAccessor userAccessor)
        : IRequestHandler<Command, Result<string>>
    {
        public async Task<Result<string>> Handle(Command request, CancellationToken ct) {
            var user = await userAccessor.GetUserAsync();
            var activity = mapper.Map<Activity>(request.ActivityDto);
            activity.Attendees.Add(new ActivityAttendee {
                UserId = user.Id, Activity = activity, IsHost = true
            });
            context.Activities.Add(activity);
            var result = await context.SaveChangesAsync(ct) > 0;
            return result
                ? Result<string>.Success(activity.Id)
                : Result<string>.Failure("Failed to create activity", 400);
        }
    }
}
```

### The Result<T> pattern

```csharp
public class Result<T> {
    public bool IsSuccess { get; set; }
    public T? Value { get; set; }
    public string? Error { get; set; }
    public int Code { get; set; }
    public static Result<T> Success(T value);
    public static Result<T> Failure(string error, int code);
}
```

**Why?** Instead of throwing exceptions for every "not found" or "forbidden" case, handlers return a `Result`. The controller translates it into the right HTTP status. Exceptions are reserved for actual errors (unexpected failures), not expected alternate flows.

### ValidationBehavior (MediatR pipeline)

```csharp
public class ValidationBehavior<TRequest, TResponse>(IValidator<TRequest>? validator = null)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : class
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct) {
        if (validator == null) return await next();
        var result = await validator.ValidateAsync(request, ct);
        if (!result.IsValid) throw new ValidationException(result.Errors);
        return await next();
    }
}
```

**Why this matters:** any `IRequest` that has a corresponding `IValidator` gets validated automatically — no manual calls in handlers.

### AutoMapper profiles

Centralize DTO mapping.

```csharp
public class MappingProfiles : Profile {
    public MappingProfiles() {
        string? currentUserId = null;
        CreateMap<Activity, ActivityDto>()
            .ForMember(d => d.HostDisplayName, o =>
                o.MapFrom(s => s.Attendees.FirstOrDefault(a => a.IsHost).User.DisplayName))
            .ForMember(d => d.HostId, o =>
                o.MapFrom(s => s.Attendees.FirstOrDefault(a => a.IsHost).User.Id));
        CreateMap<CreateActivityDto, Activity>();
        CreateMap<User, UserProfile>();
        // ...
    }
}
```

`ProjectTo<ActivityDto>(mapper.ConfigurationProvider)` generates an efficient SQL projection — EF only selects needed columns.

### List of handlers

**Activities**
- Queries: `GetActivityList`, `GetActivityDetails`, `GetComments`
- Commands: `CreateActivity`, `EditActivity`, `DeleteActivity`, `UpdateAttendance`, `AddComment`

**Profiles**
- Queries: `GetProfile`, `GetProfilePhotos`, `GetFollowings`, `GetUserActivities`
- Commands: `AddPhoto`, `SetMainPhoto`, `DeletePhoto`, `EditProfile`, `FollowToggle`

### AppException

A simple DTO for the error response:
```csharp
public record AppException(int StatusCode, string Message, string? Details);
```

---

## 7. Backend — API Layer

### Program.cs — service registration (DI)

```csharp
builder.Services.AddControllers(opt => {
    var policy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
    opt.Filters.Add(new AuthorizeFilter(policy)); // auth required everywhere by default
});
builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddCors();
builder.Services.AddSignalR();
builder.Services.AddMediatR(x => {
    x.RegisterServicesFromAssemblyContaining<GetActivityList.Handler>();
    x.AddOpenBehavior(typeof(ValidationBehavior<,>));
});
builder.Services.AddScoped<IUserAccessor, UserAccessor>();
builder.Services.AddScoped<IPhotoService, LocalPhotoService>();
builder.Services.AddAutoMapper(cfg => { }, typeof(MappingProfiles));
builder.Services.AddValidatorsFromAssemblyContaining<CreateActivityValidator>();
builder.Services.AddTransient<ExceptionMiddleware>();
builder.Services.AddIdentityApiEndpoints<User>(opt =>
    opt.User.RequireUniqueEmail = true)
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>();
builder.Services.AddAuthorization(opt =>
    opt.AddPolicy("IsActivityHost", p => p.Requirements.Add(new IsHostRequirement())));
builder.Services.AddTransient<IAuthorizationHandler, IsHostRequirementHandler>();
```

### Program.cs — pipeline (order matters!)

```csharp
app.UseMiddleware<ExceptionMiddleware>();   // catches all exceptions below
app.UseCors(x => x.AllowAnyHeader().AllowAnyMethod()
    .AllowCredentials()                     // required for cookies
    .WithOrigins("http://localhost:3000", "https://localhost:3000"));
app.UseAuthentication();                    // populates HttpContext.User
app.UseAuthorization();                     // enforces policies
app.UseDefaultFiles();                      // serves /index.html for /
app.UseStaticFiles();                       // serves wwwroot contents
app.MapControllers();
app.MapGroup("api").MapIdentityApi<User>(); // /api/login, /api/register, /api/logout
app.MapHub<CommentHub>("/comments");
```

### Controllers (thin)

`BaseApiController` exposes a lazy `Mediator` property and a `HandleResult<T>` helper that turns `Result<T>` into HTTP responses (200 / 400 / 404).

```csharp
public class ActivitiesController : BaseApiController {
    [HttpGet]
    public async Task<IActionResult> GetActivities([FromQuery] ActivityParams p) =>
        HandlePagedResult(await Mediator.Send(new GetActivityList.Query { Params = p }));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDetail(string id) =>
        HandleResult(await Mediator.Send(new GetActivityDetails.Query { Id = id }));

    [HttpPost]
    public async Task<IActionResult> CreateActivity(CreateActivityDto dto) =>
        HandleResult(await Mediator.Send(new CreateActivity.Command { ActivityDto = dto }));

    [Authorize(Policy = "IsActivityHost")]
    [HttpPut("{id}")]
    public async Task<IActionResult> EditActivity(EditActivityDto dto) =>
        HandleResult(await Mediator.Send(new EditActivity.Command { ActivityDto = dto }));

    [Authorize(Policy = "IsActivityHost")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteActivity(string id) =>
        HandleResult(await Mediator.Send(new DeleteActivity.Command { Id = id }));

    [HttpPost("{id}/attend")]
    public async Task<IActionResult> Attend(string id) =>
        HandleResult(await Mediator.Send(new UpdateAttendance.Command { Id = id }));
}
```

The `[Authorize(Policy = "IsActivityHost")]` decorator enforces the host check via a custom `IAuthorizationHandler` (see Infrastructure).

---

## 8. Backend — Infrastructure Layer

### UserAccessor

Reads the current user from `HttpContext`.

```csharp
public class UserAccessor(IHttpContextAccessor http, AppDbContext ctx) : IUserAccessor {
    public string GetUserId() =>
        http.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new Exception("No user");

    public async Task<User> GetUserAsync() =>
        await ctx.Users.FindAsync(GetUserId())
        ?? throw new UnauthorizedAccessException();

    public async Task<User> GetUserWithPhotosAsync() =>
        await ctx.Users.Include(u => u.Photos)
            .SingleOrDefaultAsync(u => u.Id == GetUserId())
        ?? throw new UnauthorizedAccessException();
}
```

### IsHostRequirement + Handler

Custom authorization policy: the user making the request must be the host of the activity being edited/deleted.

```csharp
public class IsHostRequirement : IAuthorizationRequirement { }

public class IsHostRequirementHandler(AppDbContext ctx, IHttpContextAccessor http)
    : AuthorizationHandler<IsHostRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context, IsHostRequirement requirement)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var activityId = http.HttpContext?.GetRouteValue("id")?.ToString();
        if (userId == null || activityId == null) return;
        var attendee = await ctx.ActivityAttendees
            .SingleOrDefaultAsync(x => x.UserId == userId && x.ActivityId == activityId);
        if (attendee?.IsHost == true) context.Succeed(requirement);
    }
}
```

Registered in Program.cs as `AddPolicy("IsActivityHost", ...)`.

### LocalPhotoService

Saves uploaded photos to `API/wwwroot/images/photos/{guid}.{ext}` and returns the public URL. (In a real deployment you'd use S3 or Cloudinary — the course uses local storage for simplicity.)

---

## 9. Authentication & Authorization

### The flow

1. **Register** — client POSTs `{ email, displayName, password }` to `/api/account/register`. `AccountController` creates the user via `UserManager<User>.CreateAsync`. Returns 200 on success.
2. **Login** — client POSTs `{ email, password }` to `/api/login?useCookies=true`. ASP.NET Identity validates credentials, writes the auth cookie.
3. **Subsequent requests** — browser sends the cookie automatically (because axios has `withCredentials: true`).
4. **Backend** — `UseAuthentication()` middleware reads the cookie, sets `HttpContext.User`. `AuthorizeFilter` (global) rejects unauthenticated requests with 401.
5. **Logout** — POST `/api/account/logout` → Identity clears the cookie.

### CORS + cookies (a common trap)

Browsers block cookies on cross-origin requests unless:
- Server sends `Access-Control-Allow-Credentials: true` **and** `Access-Control-Allow-Origin: <exact origin>` (not `*`).
- Client sends `withCredentials: true`.

That's why `AllowCredentials()` and `.WithOrigins("http://localhost:3000", "https://localhost:3000")` appear in CORS config.

### `[AllowAnonymous]`

Because the global filter requires auth on every endpoint, public endpoints (like `GetUserInfo` which should return 204 when logged out) must opt out with `[AllowAnonymous]`.

### Authorization policies

`AddPolicy("IsActivityHost", ...)` + `[Authorize(Policy = "IsActivityHost")]` — layered on top of authentication to enforce resource-level rules.

---

## 10. Error Handling (Server + Client)

### ExceptionMiddleware (server)

Wraps the entire pipeline. On any unhandled exception:
```csharp
public async Task InvokeAsync(HttpContext ctx, RequestDelegate next) {
    try { await next(ctx); }
    catch (ValidationException ex) {
        // 400 + flattened errors per field
    }
    catch (Exception ex) {
        // 500 + message; stack trace only in dev
    }
}
```

**Response shape (AppException):**
```json
{ "statusCode": 500, "message": "Something broke", "details": "...(dev only)" }
```

### Client interceptor (axios)

```ts
axios.interceptors.response.use(
  response => { store.uiStore.isIdle(); return response; },
  (error: AxiosError) => {
    const { status, data } = error.response as AxiosResponse;
    switch (status) {
      case 400:
        if (data.errors) {
          const modalErrors: string[] = [];
          for (const key in data.errors) modalErrors.push(data.errors[key]);
          throw modalErrors.flat();
        } else toast.error(data);
        break;
      case 401: toast.error("unauthorized"); break;
      case 404: router.navigate('/not-found'); break;
      case 500: router.navigate('/server-error', { state: { error: data } }); break;
    }
    store.uiStore.isIdle();
    return Promise.reject(error);
  }
);
```

### Error components

- `NotFound` — friendly 404 page.
- `ServerError` — reads error from router state and shows details.
- `TestErrors` — page with buttons that hit endpoints designed to return each error code. Useful for verifying interceptor behavior.

---

## 11. Real-time with SignalR

SignalR is a WebSocket-based library that abstracts transport fallbacks (SSE, long polling) and provides a hub/method RPC model.

### Server

```csharp
public class CommentHub(IMediator mediator, IMapper mapper) : Hub {
    public async Task SendComment(AddComment.Command command) {
        var comment = await mediator.Send(command);
        await Clients.Group(command.ActivityId).SendAsync("ReceiveComment", comment.Value);
    }

    public override async Task OnConnectedAsync() {
        var httpCtx = Context.GetHttpContext();
        var activityId = httpCtx?.Request.Query["activityId"].ToString();
        await Groups.AddToGroupAsync(Context.ConnectionId, activityId);
        var comments = await mediator.Send(new GetComments.Query { ActivityId = activityId });
        await Clients.Caller.SendAsync("LoadComments", comments.Value);
    }
}
```

Registered in Program.cs: `app.MapHub<CommentHub>("/comments")`.

**Groups** — SignalR lets you broadcast to a named subset of connections. Here each activity is its own group, so a comment on Activity A only reaches clients viewing Activity A.

### Client (`useComments` hook)

Uses `@microsoft/signalr` — builds a hub connection with `withCredentials`, listens for `LoadComments` (on connect) and `ReceiveComment` (on new comment), pushes into a MobX observable array. The connection is started on mount, stopped on unmount.

---

## 12. Photo Uploads

### Client flow (PhotoUploadWidget)

1. **Dropzone** — user drops or selects a file (`react-dropzone`).
2. **Cropper** — user crops to 1:1 with `react-cropper`.
3. **Submit** — the cropped `Blob` is sent as `FormData` to `POST /api/profiles/add-photo`.
4. **Cache sync** — on success, `useProfile` invalidates `['photos', userId]` and patches `['user']` / `['profile', userId]` imageUrl.

### Server flow (AddPhoto handler)

```csharp
// receives IFormFile, calls IPhotoService.UploadPhoto
// writes DB row, returns Photo object
```

### LocalPhotoService

Writes to `API/wwwroot/images/photos/{guid}{ext}`. Static files middleware serves `/images/photos/*` publicly.

### Vite proxy

Because dev server runs on `localhost:3000` and API on `localhost:5001`, Vite proxies `/images/photos` → API server so `<img src="/images/photos/..." />` works from the client.

---

## 13. Paging, Sorting, Filtering

### Cursor-based pagination

Instead of offset pagination (`?page=5&pageSize=10`), which breaks when items are inserted/deleted between requests, we use **cursor pagination**: "give me N items after this date".

**Server:**
```csharp
public class PaginationParams<TCursor> {
    public TCursor? Cursor { get; set; }
    public int PageSize { get; set; } = 3;
}

public class ActivityParams : PaginationParams<DateTime?> {
    public string? Filter { get; set; }
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
}

public class PagedList<T, TCursor> {
    public List<T> Items { get; set; } = [];
    public TCursor? NextCursor { get; set; }
}
```

**Handler logic (simplified):**
```csharp
var query = ctx.Activities
    .OrderBy(a => a.Date)
    .Where(a => a.Date >= (request.Params.Cursor ?? request.Params.StartDate))
    .AsQueryable();

if (request.Params.Filter == "isGoing")
    query = query.Where(a => a.Attendees.Any(x => x.UserId == currentUserId));
else if (request.Params.Filter == "isHost")
    query = query.Where(a => a.Attendees.Any(x => x.UserId == currentUserId && x.IsHost));

var items = await query.Take(request.Params.PageSize + 1)
    .ProjectTo<ActivityDto>(mapper.ConfigurationProvider).ToListAsync();

DateTime? nextCursor = null;
if (items.Count > request.Params.PageSize) {
    nextCursor = items.Last().Date;
    items.RemoveAt(items.Count - 1); // drop sentinel
}
return Result<PagedList<ActivityDto, DateTime?>>.Success(new() {
    Items = items, NextCursor = nextCursor
});
```

**Why `PageSize + 1`?** To know if there's a next page without a second query. If we got `PageSize + 1` items, there's more — the last one becomes the next cursor.

### Client — useInfiniteQuery

```ts
useInfiniteQuery({
  queryKey: ['activities', filter, startDate],
  queryFn: async ({ pageParam }) => {
    const response = await agent.get<PagedList<Activity, string>>('/activities', {
      params: { cursor: pageParam, pageSize: 3, filter, startDate: startDate.toISOString() }
    });
    return response.data;
  },
  initialPageParam: null as string | null,  // ← new in v5
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  enabled: !id && !!currentUser
});
```

**Infinite scroll** — a sentinel `<div ref={ref} />` below the list. `react-intersection-observer` fires when it enters the viewport, which calls `fetchNextPage()`.

**Filter as part of query key** — when the user changes filter, the query key changes, so React Query refetches fresh (and caches per combination).

---

## 14. Frontend — Overall Structure

```
client/src/
├── app/
│   ├── layout/        → App.tsx, NavBar, UserMenu, global styles
│   ├── router/        → Routes.tsx, RequireAuth.tsx
│   └── shared/        → reusable components (TextInput, LocationInput, MapComponent, …)
├── features/          → one folder per feature area (activities, account, profiles, home, errors)
├── lib/
│   ├── api/           → agent.ts (axios instance + interceptors)
│   ├── hooks/         → useActivities, useAccount, useProfile, useComments, useStore
│   ├── strores/       → MobX stores (root store + per-area stores)
│   ├── schemas/       → Zod schemas (one per form)
│   ├── types/         → TypeScript interfaces
│   └── util/          → date/image helpers
└── main.tsx           → entry: providers + RouterProvider
```

### Providers in main.tsx

```tsx
<StoreContext.Provider value={store}>
  <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools />
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ScopedCssBaseline>
        <RouterProvider router={router} />
      </ScopedCssBaseline>
    </LocalizationProvider>
  </QueryClientProvider>
</StoreContext.Provider>
```

---

## 15. Frontend — Routing & Guards

### Routes (React Router v7)

```ts
createBrowserRouter([{
  path: '/', element: <App />, children: [
    { element: <RequireAuth />, children: [
      { path: 'activities', element: <ActivityDashboard /> },
      { path: 'activities/:id', element: <ActivityDetailsPage /> },
      { path: 'createActivity', element: <ActivityForm key='create' /> },
      { path: 'manage/:id', element: <ActivityForm /> },
      { path: 'profiles/:id', element: <ProfilePage /> },
    ]},
    { path: 'login', element: <LoginForm /> },
    { path: 'register', element: <RegisterForm /> },
    { path: 'counter', element: <Counter /> },
    { path: 'errors', element: <TestErrors /> },
    { path: 'not-found', element: <NotFound /> },
    { path: 'server-error', element: <ServerError /> },
    { path: '*', element: <Navigate replace to='/not-found' /> }
  ]
}]);
```

### RequireAuth guard

```tsx
export default function RequireAuth() {
  const { currentUser, loadingUserInfo } = useAccount();
  const location = useLocation();
  if (loadingUserInfo) return <LoadingIndicator />;
  if (!currentUser) return <Navigate to='/login' state={{ from: location }} replace />;
  return <Outlet />;
}
```

**Why `key='create'` on ActivityForm?** Because React reuses component instances when the route changes only in params. Giving different keys forces a remount, which resets the form.

---

## 16. Frontend — State Management (TanStack Query + MobX)

### TanStack React Query

**Concepts you must know:**

- **Query** — read from server. Keyed by an array. Cached by key.
  ```ts
  useQuery({ queryKey: ['user'], queryFn: fetchUser });
  ```
- **Mutation** — write to server. Call `.mutate(input)` or `.mutateAsync(input)`.
- **Invalidation** — after a write, tell Query to refetch queries by key.
  ```ts
  queryClient.invalidateQueries({ queryKey: ['activities'] });
  ```
- **Optimistic update** — update the cache before the server responds; roll back on error.
  ```ts
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey });
    const previous = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, optimistic);
    return { previous };
  },
  onError: (_, __, context) => queryClient.setQueryData(queryKey, context.previous),
  onSettled: () => queryClient.invalidateQueries({ queryKey })
  ```
- **useInfiniteQuery** — paginated queries; returns `fetchNextPage`, `hasNextPage`, `data.pages[]`.

### useActivities (central hook)

- If called with `id`, returns a single-activity `useQuery`.
- Otherwise, returns `useInfiniteQuery` with filter/startDate from the MobX `activityStore`.
- Exposes mutations: `createActivity`, `updateActivity`, `deleteActivity`, `updateAttendance`.
- Every mutation invalidates `['activities']` so lists refresh.

### MobX stores

```ts
class ActivityStore {
  filter = 'all';
  startDate = new Date();
  constructor() { makeAutoObservable(this); }
  setFilter = (f: string) => { this.filter = f; };
  setStartDate = (d: Date) => { this.startDate = d; };
}
```

Any component that reads these must be wrapped in `observer(...)` so MobX re-renders it on change.

**Why MobX for filter but React Query for activities?** Filter is *client-only preference*; it doesn't belong to the server. The *list of activities derived from* the filter belongs to the server and is fetched/cached by React Query. When filter changes, the query key changes → Query refetches.

### UiStore + axios interceptor

Request interceptor → `store.uiStore.isBusy()`.
Response interceptor → `store.uiStore.isIdle()`.
Components observe `uiStore.isLoading` to show a global loading bar.

---

## 17. Frontend — Forms (react-hook-form + Zod)

### The single-source-of-truth pattern

```ts
// activitySchema.ts
export const activitySchema = z.object({
  title: z.string({ required_error: 'Required' }),
  description: z.string({ required_error: 'Required' }),
  category: z.string({ required_error: 'Required' }),
  date: z.coerce.date(),
  location: z.object({
    venue: z.string(),
    city: z.string().optional(),
    latitude: z.coerce.number(),
    longitude: z.coerce.number()
  })
});
export type ActivitySchema = z.infer<typeof activitySchema>;
```

Zod schema does double duty: it validates at runtime and provides the TypeScript type.

### Form setup

```tsx
const { control, handleSubmit, reset } = useForm<ActivitySchema>({
  mode: 'onTouched',
  resolver: zodResolver(activitySchema),
  defaultValues: { title: '', description: '', category: '', date: new Date(), location: {...} }
});
```

### Reusable input component

```tsx
function TextInput<T extends FieldValues>(props: Props<T>) {
  const { field, fieldState } = useController({ ...props });
  return (
    <TextField {...props} {...field}
      value={field.value ?? ''}
      fullWidth
      error={!!fieldState.error}
      helperText={fieldState.error?.message}
    />
  );
}
```

Generic over the form's field-values type so it's fully type-safe.

### Submit

```tsx
const onSubmit = async (data: ActivitySchema) => {
  const { location, ...rest } = data;
  const flattened = { ...rest, ...location };
  if (activity) await updateActivity.mutateAsync({ ...activity, ...flattened });
  else {
    const id = await createActivity.mutateAsync(flattened);
    navigate(`/activities/${id}`);
  }
};
```

---

## 18. Frontend — Maps, Cropping, Infinite Scroll

### Leaflet (react-leaflet)

Used on the Activity Details page to show the venue on a map. `Marker` + `Popup`. The `LocationInput` uses LocationIQ's autocomplete to produce `{ venue, city, latitude, longitude }` which is then rendered as a draggable marker.

### Cropper (react-cropper + cropperjs)

```tsx
<Cropper
  src={URL.createObjectURL(file)}
  aspectRatio={1}
  preview='.img-preview'
  onInitialized={(instance) => setCropper(instance)}
/>
```

`cropper.getCroppedCanvas().toBlob(blob => ...)` produces the blob you upload.

### Infinite scroll (react-intersection-observer)

```tsx
const { ref } = useInView({
  threshold: 0.5,
  onChange: (inView) => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }
});
// ...
<div ref={ref} style={{ height: 1 }} />
```

When the sentinel enters the viewport, fetch the next page.

---

## 19. Infrastructure (Docker, Vite, Configuration)

### docker-compose.yml

```yaml
services:
  sql:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      ACCEPT_EULA: "Y"
      MSSQL_SA_PASSWORD: "Password@1"
    ports:
      - "1434:1433"          # host:container — using 1434 to avoid local SQL Server on 1433
    volumes:
      - sql-data:/var/opt/mssql
volumes:
  sql-data:
```

Run:
```bash
docker compose up -d      # start in background
docker compose down       # stop
docker compose logs sql   # view logs
```

### Connection string (appsettings.Development.json)

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost,1434;Database=reactivities;User Id=SA;Password=Password@1;TrustServerCertificate=True"
}
```

**`TrustServerCertificate=True`** — because the container uses a self-signed cert.

### vite.config.ts

```ts
export default defineConfig({
  plugins: [react(), mkcert()],            // mkcert enables HTTPS in dev
  server: { port: 3000 },
  build: { outDir: '../API/wwwroot', emptyOutDir: true },
  // dev-time proxy so /images/photos resolves to the API
});
```

**Why build into `API/wwwroot`?** So a single `dotnet publish` produces a deployable API that also serves the compiled SPA — no separate frontend host needed in prod.

---

## 20. Development & Publishing Workflow

### Everyday commands

```bash
# 1. Start DB
docker compose up -d

# 2. Start API (from repo root or API folder)
dotnet watch --project API

# 3. Start client
cd client
npm run dev
```

### Adding a migration

```bash
# Stop `dotnet watch` first (it locks the bin folder)
dotnet ef migrations add <Name> -p Persistance -s API
# Start watch again — it'll apply the migration via context.Database.MigrateAsync()
```

### Building for deployment

```bash
cd client
npm run build                # outputs to ../API/wwwroot
cd ..
dotnet publish API -c Release -o <publish folder>
```

The published folder contains `API.dll`, wwwroot (SPA), appsettings.json, etc. Deploy anywhere that runs .NET 8 (IIS, Kestrel on Linux, Azure App Service, Docker).

---

## 21. Glossary

**API** — Application Programming Interface. Here: the backend web service.

**CQRS** — Command Query Responsibility Segregation. Separating reads from writes as distinct classes.

**Cursor pagination** — using a field value (like a date or id) to mark "start after this point" instead of a page number.

**DI (Dependency Injection)** — the container hands objects their dependencies instead of them constructing their own.

**DTO (Data Transfer Object)** — a shape returned over the wire. Keeps internal entities from leaking to clients.

**EF Core** — Entity Framework Core, Microsoft's O/RM.

**HMR** — Hot Module Replacement. Vite swaps in changed modules without a full reload.

**Hook (SignalR)** — a server class extending `Hub` that clients connect to and call methods on.

**Hook (React)** — a function starting with `use*` that uses React state/effects.

**IdentityDbContext** — EF's DbContext subclass that adds Identity's user/role tables.

**Invalidation (React Query)** — marking queries as stale so they refetch.

**MediatR** — in-process mediator library implementing the mediator pattern.

**Middleware** — a function in the HTTP pipeline that can inspect/modify request and response.

**O/RM** — Object-Relational Mapper.

**Optimistic update** — update the UI before the server responds, roll back on error.

**Policy (authorization)** — a named set of requirements (e.g., "IsActivityHost") applied via `[Authorize]`.

**PagedList<T>** — custom container with `Items` plus `NextCursor`.

**ProjectTo (AutoMapper)** — tells EF to shape the SQL query as the DTO — efficient, no over-fetching.

**SignalR** — Microsoft's real-time library.

**Store (MobX)** — a class with observable state and actions.

**Vite** — modern frontend build tool.

**WebSocket** — persistent two-way connection over TCP; SignalR's default transport.

**Zod** — TypeScript-first schema validation. `z.infer` gives the TS type for free.

---

## Final mental model

```
Browser ── HTTP + cookie ──► API (Program.cs pipeline)
                               │
                               ├─► ExceptionMiddleware
                               ├─► CORS
                               ├─► Authentication (reads cookie → HttpContext.User)
                               ├─► Authorization (policies)
                               └─► Controller
                                     │
                                     └─► Mediator.Send(Request)
                                           │
                                           ├─► ValidationBehavior (FluentValidation)
                                           └─► Handler
                                                 │
                                                 ├─► DbContext (EF → SQL Server in Docker)
                                                 ├─► IPhotoService (file system)
                                                 └─► IUserAccessor (HttpContext)

Browser ── WebSocket ──► SignalR Hub (/comments) ──► MediatR ──► DB
(real-time comments)

Browser SPA:
  main.tsx
    → StoreContext (MobX)
    → QueryClientProvider (TanStack Query)
    → RouterProvider
          → App → RequireAuth → ActivityDashboard
                                   ├─ useActivities (infinite query keyed by filter+startDate)
                                   ├─ ActivityFilters (observer, reads/writes activityStore)
                                   └─ ActivityList (observer, infinite scroll)
```

That's the whole picture. Keep this handy — every topic has its "what", its "why", and its "where to look" in the code.
