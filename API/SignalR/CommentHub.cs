using System;
using Application.Activities.Commands;
using Application.Activities.Queries;
using MediatR;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR;

public class CommentHub(IMediator mediator) : Hub
{
    public async Task SendComment(AddComment.Command command)
    {
        var comment= await mediator.Send(command);
        await Clients.Group(command.ActivityId).SendAsync("ReceiveComment",comment.Value);
    }


    //onconnectedAsync this function is what we want to do when client connects to signalR hub
    //we will group clients to the same signalR group based on their activity id
    //same activity id => same signalR hub group
    public override async Task OnConnectedAsync() 
    {
        //using httpContext because when they do make a connection to signalR it passes through http
        //however then rest of communication is handled over webSockets
        var httpContext = Context.GetHttpContext();
        var activityId = httpContext?.Request.Query["activityId"];

        if (string.IsNullOrEmpty(activityId)) throw new HubException("No activity with this id");

        await Groups.AddToGroupAsync(Context.ConnectionId,activityId!);

        var result = await mediator.Send(new GetComments.Query{ActivityId=activityId!});

        await Clients.Caller.SendAsync("LoadComments",result.Value);
    }
}
