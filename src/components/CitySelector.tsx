import React from 'react';
import { MapPin, Building2 } from 'lucide-react';
import type { City } from '../types/auth';

interface CitySelectorProps {
  onCitySelect: (city: City) => void;
}

export function CitySelector({ onCitySelect }: CitySelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ebony Fit Weekend</h1>
          <p className="text-gray-600">Select your city to access the dashboard</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <button
            onClick={() => onCitySelect('dc')}
            className="group h-full bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <div className="text-center min-h-[230px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Washington DC</h2>
              <p className="text-sm text-gray-500 mb-1">2025</p>
              <p className="text-gray-600">Open dashboard</p>
            </div>
          </button>

          <button
            onClick={() => onCitySelect('dc2026')}
            className="group h-full bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <div className="text-center min-h-[230px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-indigo-200 transition-colors duration-200">
                <Building2 className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Washington DC</h2>
              <p className="text-sm text-gray-500 mb-1">2026</p>
              <p className="text-gray-600">Open dashboard</p>
            </div>
          </button>

          <button
            onClick={() => onCitySelect('atlanta')}
            className="group h-full bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <div className="text-center min-h-[230px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-200">
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Atlanta</h2>
              <p className="text-sm text-gray-500 mb-1">2025</p>
              <p className="text-gray-600">Open dashboard</p>
            </div>
          </button>

          <button
            onClick={() => onCitySelect('houston')}
            className="group h-full bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <div className="text-center min-h-[230px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-orange-100 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-orange-200 transition-colors duration-200">
                <Building2 className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Houston</h2>
              <p className="text-sm text-gray-500 mb-1">2026</p>
              <p className="text-gray-600">Open dashboard</p>
            </div>
          </button>

          <button
            onClick={() => onCitySelect('charlotte')}
            className="group h-full bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <div className="text-center min-h-[230px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-emerald-200 transition-colors duration-200">
                <Building2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Charlotte</h2>
              <p className="text-sm text-gray-500 mb-1">2026</p>
              <p className="text-gray-600">Open dashboard</p>
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