import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ExternalLink } from 'lucide-react';

interface Provider {
  logo_path: string;
  provider_name: string;
  provider_id: number;
}

interface WatchData {
  link: string;
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
}

interface WatchProvidersProps {
  providers: {
    results: {
      [countryCode: string]: WatchData;
    };
  };
  countryCode: string;
}

const WatchProviders: React.FC<WatchProvidersProps> = ({ providers, countryCode }) => {
  const userRegionData = providers?.results?.[countryCode];
  const usRegionData = providers?.results?.US;

  const hasUserRegionProviders = userRegionData && (userRegionData.flatrate || userRegionData.rent || userRegionData.buy);
  const hasUsRegionProviders = usRegionData && (usRegionData.flatrate || usRegionData.rent || usRegionData.buy);

  let regionData: WatchData | undefined;
  let displayedCountryCode: string;
  let isFallback = false;

  if (hasUserRegionProviders) {
    regionData = userRegionData;
    displayedCountryCode = countryCode;
  } else if (hasUsRegionProviders) {
    regionData = usRegionData;
    displayedCountryCode = 'US';
    isFallback = true;
  }

  if (!regionData) {
    return null;
  }

  const renderProviderList = (title: string, providerList?: Provider[]) => {
    if (!providerList || providerList.length === 0) {
      return null;
    }

    return (
      <div>
        <h4 className="text-lg font-semibold mb-3">{title}</h4>
        <div className="flex flex-wrap gap-3">
          {providerList.map((provider) => (
            <TooltipProvider key={provider.provider_id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={regionData!.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-transform hover:scale-110"
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                      alt={provider.provider_name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{provider.provider_name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">Where to Watch</h2>
      <Card className="bg-card/50 border-muted-foreground/30">
        <CardContent className="pt-6 space-y-6">
          {renderProviderList('Stream', regionData.flatrate)}
          {renderProviderList('Rent', regionData.rent)}
          {renderProviderList('Buy', regionData.buy)}
          <div className="text-sm text-muted-foreground pt-4 border-t border-muted-foreground/20">
            {isFallback && (
              <p className="mb-2">
                Providers for your region ({countryCode}) were not available. Showing options for the US region as a fallback.
              </p>
            )}
            <p>
              Provider information for the {displayedCountryCode} region. Data provided by JustWatch.
              <a
                href={regionData.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline ml-2"
              >
                View all options <ExternalLink size={14} />
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WatchProviders;