import React, { useState } from 'react';
import { api } from '../services/api';
import { X, Plus, Image as ImageIcon } from 'lucide-react';

interface CreateAuctionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateAuctionModal: React.FC<CreateAuctionModalProps> = ({ onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [make, setMake] = useState('Ducati');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('2024');
  const [mileage, setMileage] = useState('500');
  const [engineCc, setEngineCc] = useState('998');
  const [condition, setCondition] = useState('Mint');
  const [titleStatus, setTitleStatus] = useState('Clean');
  const [startingBid, setStartingBid] = useState('15000');
  const [reservePrice, setReservePrice] = useState('20000');
  const [minBidIncrement, setMinBidIncrement] = useState('250');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80');
  const [durationHours, setDurationHours] = useState('24');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + parseFloat(durationHours) * 60 * 60 * 1000);

      await api.createAuction({
        title,
        description,
        startingBid: parseFloat(startingBid),
        reservePrice: parseFloat(reservePrice),
        minBidIncrement: parseFloat(minBidIncrement),
        startTime: now.toISOString(),
        endTime: endTime.toISOString(),
        antiSnipeSeconds: 120,
        motorcycle: {
          make,
          model,
          year: parseInt(year, 10),
          mileage: parseInt(mileage, 10),
          engineCc: parseInt(engineCc, 10),
          condition,
          titleStatus,
          images: [imageUrl],
          specs: {
            horsepower: '200+ HP',
            brakes: 'Brembo Racing',
            exhaust: 'Performance Titanium'
          }
        }
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create auction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-8 p-6">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Publish New Motorcycle Auction</h2>
            <p className="text-xs text-slate-400">Set reserve prices, vehicle specs, and auction duration</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/40 p-3 rounded-xl text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 font-semibold uppercase block mb-1">Make</label>
              <select value={make} onChange={(e) => setMake(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white">
                <option value="Ducati">Ducati</option>
                <option value="BMW">BMW</option>
                <option value="Kawasaki">Kawasaki</option>
                <option value="Yamaha">Yamaha</option>
                <option value="Honda">Honda</option>
                <option value="Harley-Davidson">Harley-Davidson</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 font-semibold uppercase block mb-1">Model Name</label>
              <input type="text" required value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Panigale V4 S" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-semibold uppercase block mb-1">Listing Title</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 2024 Ducati Panigale V4 S - MINT" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
          </div>

          <div>
            <label className="text-slate-400 font-semibold uppercase block mb-1">Full Description</label>
            <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe vehicle history, upgrades, and condition..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 font-semibold uppercase block mb-1">Year</label>
              <input type="number" required value={year} onChange={(e) => setYear(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
            </div>
            <div>
              <label className="text-slate-400 font-semibold uppercase block mb-1">Engine (CC)</label>
              <input type="number" required value={engineCc} onChange={(e) => setEngineCc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
            </div>
            <div>
              <label className="text-slate-400 font-semibold uppercase block mb-1">Mileage (mi)</label>
              <input type="number" required value={mileage} onChange={(e) => setMileage(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 font-semibold uppercase block mb-1">Starting Bid ($)</label>
              <input type="number" required value={startingBid} onChange={(e) => setStartingBid(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono" />
            </div>
            <div>
              <label className="text-slate-400 font-semibold uppercase block mb-1">Reserve Price ($)</label>
              <input type="number" required value={reservePrice} onChange={(e) => setReservePrice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono" />
            </div>
            <div>
              <label className="text-slate-400 font-semibold uppercase block mb-1">Min Increment ($)</label>
              <input type="number" required value={minBidIncrement} onChange={(e) => setMinBidIncrement(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono" />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-semibold uppercase block mb-1">Cover Image URL</label>
            <input type="url" required value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono" />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold py-3 rounded-xl transition text-sm mt-4"
          >
            {isSubmitting ? 'Publishing Auction...' : 'Publish Live Auction'}
          </button>
        </form>

      </div>
    </div>
  );
};
