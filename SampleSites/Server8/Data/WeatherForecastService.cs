using SampleSite.Components.Services;

namespace SampleSite.Server8.Data;

public class WeatherForecastService : IWeatherForecastService
{
    private static readonly string[] Summaries = ["Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"];

    public Task<WeatherForecast[]?> GetForecastAsync()
    {
        var rng = new Random();
        return Task.FromResult<WeatherForecast[]?>(Enumerable.Range(1, 5).Select(index => new WeatherForecast
        {
            Date = DateTime.Today.AddDays(index),
            TemperatureC = rng.Next(-20, 55),
            Summary = Summaries[rng.Next(Summaries.Length)]
        }).ToArray());
    }
}
