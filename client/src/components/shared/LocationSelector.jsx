import React, { useState, useEffect } from 'react';
import { Country, State, City } from 'country-state-city';
import { MapPin, Globe, CheckCircle2 } from 'lucide-react';

export default function LocationSelector({ value = '', onChange }) {
  const [isRemote, setIsRemote] = useState(value === 'Remote' || value === 'Remote / Anywhere');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const countries = Country.getAllCountries();
  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : [];
  const cities = (selectedCountry && selectedState) ? City.getCitiesOfState(selectedCountry, selectedState) : [];

  // Initialize or handle pre-existing value string (e.g. "San Francisco, California, United States")
  useEffect(() => {
    if (value === 'Remote' || value === 'Remote / Anywhere') {
      setIsRemote(true);
    }
  }, [value]);

  const updateLocation = (countryCode, stateCode, cityName, isRemoteMode) => {
    if (isRemoteMode) {
      onChange('Remote / Anywhere');
      return;
    }

    const countryObj = countries.find(c => c.isoCode === countryCode);
    const stateObj = states.find(s => s.isoCode === stateCode);

    const parts = [];
    if (cityName) parts.push(cityName);
    if (stateObj) parts.push(stateObj.name);
    if (countryObj) parts.push(countryObj.name);

    const formatted = parts.length > 0 ? parts.join(', ') : 'Not specified';
    onChange(formatted);
  };

  const handleModeToggle = (remote) => {
    setIsRemote(remote);
    if (remote) {
      setSelectedCountry('');
      setSelectedState('');
      setSelectedCity('');
      onChange('Remote / Anywhere');
    } else {
      updateLocation(selectedCountry, selectedState, selectedCity, false);
    }
  };

  const handleCountryChange = (e) => {
    const code = e.target.value;
    setSelectedCountry(code);
    setSelectedState('');
    setSelectedCity('');
    updateLocation(code, '', '', false);
  };

  const handleStateChange = (e) => {
    const code = e.target.value;
    setSelectedState(code);
    setSelectedCity('');
    updateLocation(selectedCountry, code, '', false);
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    setSelectedCity(city);
    updateLocation(selectedCountry, selectedState, city, false);
  };

  return (
    <div className="space-y-4 bg-surface-raised border border-border rounded-2xl p-5">
      {/* Mode Switcher Buttons */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-border">
        <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Verified Target Location
        </label>
        
        <div className="flex bg-surface p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => handleModeToggle(false)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              !isRemote 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Specific Location
          </button>
          
          <button
            type="button"
            onClick={() => handleModeToggle(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              isRemote 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Remote / Anywhere
          </button>
        </div>
      </div>

      {!isRemote ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. Country Selection */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              1. Select Country *
            </label>
            <select
              value={selectedCountry}
              onChange={handleCountryChange}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
            >
              <option value="">-- Choose Country --</option>
              {countries.map((c) => (
                <option key={c.isoCode} value={c.isoCode}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. State Selection */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              2. Select State / Region
            </label>
            <select
              value={selectedState}
              onChange={handleStateChange}
              disabled={!selectedCountry || states.length === 0}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {!selectedCountry 
                  ? 'Select country first' 
                  : states.length === 0 
                  ? 'No states found' 
                  : '-- Choose State / Region --'}
              </option>
              {states.map((s) => (
                <option key={s.isoCode} value={s.isoCode}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. City Selection */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              3. Select City
            </label>
            <select
              value={selectedCity}
              onChange={handleCityChange}
              disabled={!selectedState || cities.length === 0}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {!selectedState 
                  ? 'Select state first' 
                  : cities.length === 0 
                  ? 'No cities found' 
                  : '-- Choose City --'}
              </option>
              {cities.map((ct) => (
                <option key={`${ct.name}_${ct.stateCode}`} value={ct.name}>
                  {ct.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-xs font-medium flex items-center gap-2">
          <Globe className="w-4 h-4 shrink-0 text-primary" />
          <span>This campaign is configured for <strong>Remote / Global</strong> applicants worldwide.</span>
        </div>
      )}

      {/* Selected Result Banner */}
      {value && value !== 'Not specified' && (
        <div className="pt-2 flex items-center justify-between text-xs text-text-secondary border-t border-border/50">
          <span>Formatted Campaign Location:</span>
          <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {value}
          </span>
        </div>
      )}
    </div>
  );
}
