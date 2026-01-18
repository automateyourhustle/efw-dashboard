import React from 'react';
import { MapPin, Building2 } from 'lucide-react';

interface CitySelectorProps {
  onCitySelect: (city: 'dc' | 'atlanta' | 'houston') => void;
}

export function CitySelector({ onCitySelect }: CitySelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ebony Fit Weekend</h1>
          <p className="text-gray-600">Select your city to access the dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => onCitySelect('dc')}
            className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Washington DC</h2>
              <p className="text-sm text-gray-500 mb-1">2025</p>
              <p className="text-gray-600">Access DC event dashboard</p>
            </div>
          </button>

          <button
            onClick={() => onCitySelect('atlanta')}
            className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-200">
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Atlanta</h2>
              <p className="text-sm text-gray-500 mb-1">2025</p>
              <p className="text-gray-600">Access Atlanta event dashboard</p>
            </div>
          </button>

          <button
            onClick={() => onCitySelect('houston')}
            className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-orange-200 transition-colors duration-200">
                <Building2 className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Houston</h2>
              <p className="text-sm text-gray-500 mb-1">2026</p>
              <p className="text-gray-600">Access Houston event dashboard</p>
            </div>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Choose the city you want to manage and view analytics for
          </p>
        </div>
      </div>
    </div>
  );
}