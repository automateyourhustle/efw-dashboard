import React, { useEffect, useMemo, useState } from 'react';
import { Save, RotateCcw, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ParsedOrder } from '../utils/csvParser';
import type { CityOverride, CityOverrideInput } from '../types/overrides';
import {
  calculateRevenueMultiplier,
  getClassRevenueBreakdown,
  getTotalOrderRevenue
} from '../utils/revenue';

interface AdminPanelProps {
  cityLabel: string;
  data: ParsedOrder[];
  rawLastUpdated: string | null;
  overrides: CityOverride | null;
  onSave: (input: CityOverrideInput) => Promise<{ success: boolean; error?: string }>;
  onClear: () => Promise<{ success: boolean; error?: string }>;
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

export function AdminPanel({
  cityLabel,
  data,
  rawLastUpdated,
  overrides,
  onSave,
  onClear
}: AdminPanelProps) {
  const [revenueInput, setRevenueInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentRevenue = useMemo(() => getTotalOrderRevenue(data), [data]);
  const revenueBreakdown = useMemo(() => getClassRevenueBreakdown(data), [data]);

  useEffect(() => {
    setRevenueInput(
      overrides?.overrideTotalRevenue != null
        ? overrides.overrideTotalRevenue.toFixed(2)
        : ''
    );
    setDateInput(toDatetimeLocalValue(overrides?.overrideLastUpdated ?? null));
  }, [overrides, cityLabel]);

  const parsedRevenue = revenueInput.trim() === '' ? null : Number(revenueInput);
  const previewMultiplier = useMemo(() => {
    if (parsedRevenue == null || Number.isNaN(parsedRevenue) || data.length === 0) {
      return null;
    }
    return calculateRevenueMultiplier(data, parsedRevenue);
  }, [parsedRevenue, data]);

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    if (parsedRevenue != null && (Number.isNaN(parsedRevenue) || parsedRevenue < 0)) {
      setStatusMessage({ type: 'error', text: 'Enter a valid revenue amount or leave it blank.' });
      setIsSaving(false);
      return;
    }

    if (parsedRevenue != null && previewMultiplier === null) {
      setStatusMessage({
        type: 'error',
        text: 'Override revenue is too low. It must be at least the current bundle revenue total.'
      });
      setIsSaving(false);
      return;
    }

    const result = await onSave({
      overrideTotalRevenue: parsedRevenue,
      overrideLastUpdated: fromDatetimeLocalValue(dateInput)
    });

    if (result.success) {
      setStatusMessage({ type: 'success', text: 'Overrides saved. Everyone will now see these values.' });
    } else {
      setStatusMessage({ type: 'error', text: result.error ?? 'Failed to save overrides.' });
    }

    setIsSaving(false);
  };

  const handleClear = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    const result = await onClear();
    if (result.success) {
      setRevenueInput('');
      setDateInput('');
      setStatusMessage({ type: 'success', text: 'Overrides cleared. Dashboard is showing raw upload data again.' });
    } else {
      setStatusMessage({ type: 'error', text: result.error ?? 'Failed to clear overrides.' });
    }

    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Admin Overrides</h2>
            <p className="text-gray-600">
              Adjust financial totals and upload date for {cityLabel}. Saved changes apply to all users.
            </p>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            No CSV data uploaded yet for this city. You can still set an override upload date, but revenue overrides require uploaded data.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Current Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${currentRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Non-Bundle Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${revenueBreakdown.nonBundleRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Bundle Revenue (unchanged)</p>
              <p className="text-2xl font-bold text-gray-900">${revenueBreakdown.bundleRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label htmlFor="override-revenue" className="block text-sm font-medium text-gray-700 mb-2">
              Override Total Revenue
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input
                id="override-revenue"
                type="number"
                min="0"
                step="0.01"
                value={revenueInput}
                onChange={(e) => setRevenueInput(e.target.value)}
                placeholder={currentRevenue.toFixed(2)}
                disabled={data.length === 0}
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Non-bundle class revenue and ticket counts scale by the same multiplier. Class ticket bundles are not adjusted.
            </p>
            {previewMultiplier != null && previewMultiplier !== 1 && (
              <p className="text-xs text-purple-700 mt-2">
                Preview multiplier for non-bundle classes: {(previewMultiplier * 100).toFixed(2)}% (revenue and tickets)
              </p>
            )}
          </div>

          <div>
            <label htmlFor="override-date" className="block text-sm font-medium text-gray-700 mb-2">
              Override Last Uploaded Date
            </label>
            <input
              id="override-date"
              type="datetime-local"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              Raw upload date: {rawLastUpdated ? new Date(rawLastUpdated).toLocaleString() : 'Not uploaded yet'}
            </p>
          </div>
        </div>

        {statusMessage && (
          <div className={`mt-6 rounded-lg p-4 flex items-start space-x-3 ${
            statusMessage.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <p className={`text-sm ${statusMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {statusMessage.text}
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center space-x-2 px-5 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Overrides'}</span>
          </button>
          <button
            onClick={handleClear}
            disabled={isSaving || (!overrides && !revenueInput && !dateInput)}
            className="inline-flex items-center space-x-2 px-5 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Overrides</span>
          </button>
        </div>
      </div>
    </div>
  );
}
