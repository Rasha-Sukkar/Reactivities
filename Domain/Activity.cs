using System;
using System.Runtime.CompilerServices;

namespace Domain;

public class Activity
{
    public string Id { get; set; } = Guid.NewGuid().ToString(); //primary key since called Id
    public required string Title { get; set; }
    public DateTime Date { get; set; }
    public required string Description { get; set; }
    public required string Category { get; set; }
    public bool IsCancelled { get; set; }

    //location props
    public required string City { get; set; }
    public required string Venue { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}