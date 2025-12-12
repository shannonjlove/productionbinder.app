import { useState } from "react";
import { Cloud, Sun, CloudRain, Snowflake, Wind, Thermometer, Sunrise, Sunset, RefreshCw, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface WeatherData {
  temperature: string;
  description: string;
  humidity: string;
  windSpeed: string;
  sunrise: string;
  sunset: string;
  icon: string;
}

interface WeatherWidgetProps {
  location?: string;
  date?: string;
  onWeatherFetched?: (data: {
    weather: string;
    temperature: string;
    sunrise: string;
    sunset: string;
  }) => void;
}

export const WeatherWidget = ({ location, date, onWeatherFetched }: WeatherWidgetProps) => {
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [searchLocation, setSearchLocation] = useState(location || "");
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    if (!searchLocation.trim()) {
      toast.error("Please enter a location");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("get-weather", {
        body: { location: searchLocation, date }
      });

      if (fnError) throw fnError;

      if (data.error) {
        setError(data.error);
        toast.error(data.error);
        return;
      }

      const weatherData: WeatherData = {
        temperature: `${Math.round(data.temperature)}°F`,
        description: data.description,
        humidity: `${data.humidity}%`,
        windSpeed: `${Math.round(data.windSpeed)} mph`,
        sunrise: data.sunrise,
        sunset: data.sunset,
        icon: data.icon
      };

      setWeather(weatherData);

      if (onWeatherFetched) {
        onWeatherFetched({
          weather: data.description,
          temperature: weatherData.temperature,
          sunrise: data.sunrise,
          sunset: data.sunset
        });
      }

      toast.success("Weather data fetched successfully");
    } catch (err: any) {
      console.error("Weather fetch error:", err);
      setError("Failed to fetch weather. Check API configuration.");
      toast.error("Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (iconCode: string) => {
    if (iconCode?.includes("01") || iconCode?.includes("02")) return <Sun className="h-8 w-8 text-yellow-500" />;
    if (iconCode?.includes("09") || iconCode?.includes("10")) return <CloudRain className="h-8 w-8 text-blue-500" />;
    if (iconCode?.includes("13")) return <Snowflake className="h-8 w-8 text-blue-300" />;
    return <Cloud className="h-8 w-8 text-gray-400" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Enter location (city, address)"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="h-9"
          />
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchWeather} 
          disabled={loading}
          className="h-9"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Cloud className="h-4 w-4 mr-1" />
              Fetch
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {weather && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getWeatherIcon(weather.icon)}
                <div>
                  <div className="text-2xl font-bold">{weather.temperature}</div>
                  <div className="text-sm text-muted-foreground capitalize">{weather.description}</div>
                </div>
              </div>
              <div className="text-right space-y-1 text-sm">
                <div className="flex items-center gap-1 justify-end text-muted-foreground">
                  <Wind className="h-3.5 w-3.5" />
                  {weather.windSpeed}
                </div>
                <div className="flex items-center gap-1 justify-end text-muted-foreground">
                  <Thermometer className="h-3.5 w-3.5" />
                  {weather.humidity} humidity
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-4 pt-3 border-t border-primary/20 text-sm">
              <div className="flex items-center gap-1.5">
                <Sunrise className="h-4 w-4 text-orange-400" />
                <span>Sunrise: {weather.sunrise}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sunset className="h-4 w-4 text-orange-500" />
                <span>Sunset: {weather.sunset}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
