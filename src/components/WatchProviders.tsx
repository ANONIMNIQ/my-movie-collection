import React, { useState, useEffect, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface Provider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

interface WatchData {
  link: string;
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
}

interface WatchProvidersProps {
  providers: {
    [countryCode: string]: WatchData;
  };
}

const WatchProviders: React.FC<WatchProvidersProps> = ({ providers }) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [availableCountries, setAvailableCountries] = useState<{ code: string; name: string }[]>([]);
  const [detectionAttempted, setDetectionAttempted] = useState(false);

  useEffect(() => {
    const countryCodes = Object.keys(providers);
    if (countryCodes.length === 0) return;

    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    
    const countries = countryCodes
      .map(code => ({ code, name: regionNames.of(code.toUpperCase()) || code }))
      .sort((a, b) => a.name.localeCompare(b.name));
      
    setAvailableCountries(countries);

    const detectCountry = async () => {
      // 1. Try a more reliable GeoIP API for accurate detection
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          const geoCountryCode = data.country_code?.toUpperCase();
          if (geoCountryCode && providers[geoCountryCode]) {
            setSelectedCountry(geoCountryCode);
            return; // Success!
          }
        }
      } catch (error) {
        console.warn("GeoIP detection failed, falling back to browser language.", error);
      }

      // 2. Fallback to browser language
      const userLang = navigator.language;
      const userCountryCode = userLang.split('-')[1]?.toUpperCase();
      if (userCountryCode && providers[userCountryCode]) {
        setSelectedCountry(userCountryCode);
        return;
      }

      // 3. Fallback to US if available
      if (providers['US']) {
        setSelectedCountry('US');
        return;
      }

      // 4. Fallback to the first available country
      if (countries.length > 0) {
        setSelectedCountry(countries[0].code);
      }
    };

    if (!detectionAttempted && countryCodes.length > 0) {
      detectCountry();
      setDetectionAttempted(true);
    }

  }, [providers, detectionAttempted]);

  const selectedProviderData = useMemo(() => {
    return providers[selectedCountry];
  }, [selectedCountry, providers]);

  if (Object.keys(providers).length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Where to Watch</h2>
        <p className="text-muted-foreground">Watch provider information is not available for this movie.</p>
      </div>
    );
  }

  const renderProviderList = (title: string, providerList?: Provider[]) => {
    if (!providerList || providerList.length === 0) return null;
    return (
      <div>
        <h3 className="text-lg font-medium text-muted-foreground mb-2">{title}</h3>
        <div className="flex flex-wrap gap-3">
          {providerList.map(provider => (
            <a
              key={provider.provider_id}
              href={selectedProviderData?.link}
              target="_blank"
              rel="noopener noreferrer"
              title={`Watch on ${provider.provider_name}`}
              className="transition-transform hover:scale-110"
            >
              <img
                src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                alt={provider.provider_name}
                className="w-10 h-10 rounded-md object-cover"
              />
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Where to Watch</h2>
        {availableCountries.length > 1 && (
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {availableCountries.map(country => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedProviderData ? (
        <Card className="bg-card/50">
          <CardContent className="p-4 space-y-4">
            {renderProviderList("Stream", selectedProviderData.flatrate)}
            {renderProviderList("Rent", selectedProviderData.rent)}
            {renderProviderList("Buy", selectedProviderData.buy)}
            
            {!selectedProviderData.flatrate && !selectedProviderData.rent && !selectedProviderData.buy && (
              <p className="text-muted-foreground">No streaming options found for this region.</p>
            )}

            {selectedProviderData.link && (
              <a href={selectedProviderData.link} target="_blank" rel="noopener noreferrer" className="block mt-4">
                <Button variant="outline" className="w-full">
                  View all options on JustWatch <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground">Select a country to see watch options.</p>
      )}
    </div>
  );
};

export default WatchProviders;