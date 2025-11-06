import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Settings, ChevronDown, ChevronUp } from "lucide-react";

interface AdvancedSettingsProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  profitThresholds: {
    preMatch: number;
    live: number;
    crossMarket: number;
  };
  onProfitThresholdsChange: (thresholds: any) => void;
  regions: string[];
  onRegionsChange: (regions: string[]) => void;
  marketTypes: string[];
  onMarketTypesChange: (types: string[]) => void;
  maxEventsPerSport: number;
  onMaxEventsPerSportChange: (value: number) => void;
  maxSports: number;
  onMaxSportsChange: (value: number) => void;
}

const AdvancedSettings = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  profitThresholds,
  onProfitThresholdsChange,
  regions,
  onRegionsChange,
  marketTypes,
  onMarketTypesChange,
  maxEventsPerSport,
  onMaxEventsPerSportChange,
  maxSports,
  onMaxSportsChange,
}: AdvancedSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const setDatePreset = (days: number) => {
    const today = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);
    onDateFromChange(today.toISOString().split('T')[0]);
    onDateToChange(future.toISOString().split('T')[0]);
  };

  const isPastDate = new Date(dateFrom) < new Date(new Date().setHours(0, 0, 0, 0));

  const formatThreshold = (value: number) => {
    const profitPercent = ((1 / value) - 1) * 100;
    return `${profitPercent.toFixed(2)}%`;
  };

  const allRegions = ['uk', 'eu', 'us', 'au'];
  const allMarketTypes = ['h2h', 'spreads', 'totals'];

  const toggleRegion = (region: string) => {
    if (regions.includes(region)) {
      onRegionsChange(regions.filter(r => r !== region));
    } else {
      onRegionsChange([...regions, region]);
    }
  };

  const toggleMarketType = (type: string) => {
    if (marketTypes.includes(type)) {
      onMarketTypesChange(marketTypes.filter(t => t !== type));
    } else {
      onMarketTypesChange([...marketTypes, type]);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-slate-750 transition-colors">
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Settings
              </div>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Date Range Presets */}
            <div>
              <Label className="text-slate-300 mb-3 block">Quick Date Ranges</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setDatePreset(7)}
                  variant="outline"
                  size="sm"
                  className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                >
                  Next 7 Days
                </Button>
                <Button
                  onClick={() => setDatePreset(14)}
                  variant="outline"
                  size="sm"
                  className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                >
                  Next 14 Days
                </Button>
                <Button
                  onClick={() => setDatePreset(30)}
                  variant="outline"
                  size="sm"
                  className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                >
                  Next 30 Days
                </Button>
                <Button
                  onClick={() => setDatePreset(60)}
                  variant="outline"
                  size="sm"
                  className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                >
                  Next 60 Days
                </Button>
                <Button
                  onClick={() => setDatePreset(90)}
                  variant="outline"
                  size="sm"
                  className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                >
                  Next 90 Days
                </Button>
              </div>
              {isPastDate && (
                <div className="mt-2 text-yellow-400 text-sm">
                  ⚠️ Warning: Date range includes past dates
                </div>
              )}
            </div>

            {/* Profit Thresholds */}
            <div className="space-y-4">
              <Label className="text-slate-300">Profit Thresholds (Lower = More Opportunities)</Label>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-400">Pre-Match Minimum</span>
                    <span className="text-sm text-green-400 font-semibold">
                      {formatThreshold(profitThresholds.preMatch)} profit
                    </span>
                  </div>
                  <Slider
                    value={[profitThresholds.preMatch]}
                    onValueChange={(values) => onProfitThresholdsChange({ ...profitThresholds, preMatch: values[0] })}
                    min={0.95}
                    max={1.0}
                    step={0.001}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-400">Live Minimum</span>
                    <span className="text-sm text-green-400 font-semibold">
                      {formatThreshold(profitThresholds.live)} profit
                    </span>
                  </div>
                  <Slider
                    value={[profitThresholds.live]}
                    onValueChange={(values) => onProfitThresholdsChange({ ...profitThresholds, live: values[0] })}
                    min={0.95}
                    max={1.0}
                    step={0.001}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-400">Cross-Market Minimum</span>
                    <span className="text-sm text-green-400 font-semibold">
                      {formatThreshold(profitThresholds.crossMarket)} profit
                    </span>
                  </div>
                  <Slider
                    value={[profitThresholds.crossMarket]}
                    onValueChange={(values) => onProfitThresholdsChange({ ...profitThresholds, crossMarket: values[0] })}
                    min={0.95}
                    max={1.0}
                    step={0.001}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* API Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-slate-300 mb-3 block">Regions (Bookmakers)</Label>
                <div className="space-y-2">
                  {allRegions.map((region) => (
                    <div key={region} className="flex items-center space-x-2">
                      <Checkbox
                        id={`region-${region}`}
                        checked={regions.includes(region)}
                        onCheckedChange={() => toggleRegion(region)}
                        className="border-slate-600"
                      />
                      <label
                        htmlFor={`region-${region}`}
                        className="text-sm text-slate-300 cursor-pointer uppercase"
                      >
                        {region}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-slate-300 mb-3 block">Market Types</Label>
                <div className="space-y-2">
                  {allMarketTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`market-${type}`}
                        checked={marketTypes.includes(type)}
                        onCheckedChange={() => toggleMarketType(type)}
                        className="border-slate-600"
                      />
                      <label
                        htmlFor={`market-${type}`}
                        className="text-sm text-slate-300 cursor-pointer"
                      >
                        {type === 'h2h' ? 'Match Winner' : type === 'spreads' ? 'Spreads/Handicap' : 'Over/Under (Totals)'}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Scanning Limits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-slate-300 mb-2 block">
                  Max Events per Sport: <span className="text-white font-semibold">{maxEventsPerSport}</span>
                </Label>
                <Slider
                  value={[maxEventsPerSport]}
                  onValueChange={(values) => onMaxEventsPerSportChange(values[0])}
                  min={10}
                  max={50}
                  step={5}
                  className="w-full"
                />
              </div>

              <div>
                <Label className="text-slate-300 mb-2 block">
                  Max Sports to Scan: <span className="text-white font-semibold">{maxSports}</span>
                </Label>
                <Slider
                  value={[maxSports]}
                  onValueChange={(values) => onMaxSportsChange(values[0])}
                  min={5}
                  max={50}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default AdvancedSettings;
