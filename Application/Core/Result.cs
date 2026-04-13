using System;

namespace Application.Core;

public class Result<T>
{
public bool isSuccess { get; set; }
public T? Value { get; set; }
public string? Error { get; set; }
public int Code { get; set; }

public static Result<T> Success(T value) => new () {isSuccess=true,Value=value};
public static Result<T> Failure(string error,int code) => new() {isSuccess=false,Error=error,Code=code};
   
}
