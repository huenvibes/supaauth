import { useState } from 'react';
import { useAuth } from '../AuthContext';

export const Offerwall = () => {
  const { user } = useAuth();
  const [selectedWall, setSelectedWall] = useState('');

  if (!user) return null;

  const revtooUrl =
    `https://revtoo.com/offerwall/tqn4bgj90i24acqrj36n39bp3l40g2/${user.id}`;

  return (
    <div className="p-6">

      {!selectedWall && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <button
            onClick={() => setSelectedWall('revtoo')}
            className="bg-black text-white p-6 rounded-2xl text-left"
          >
            <h2 className="text-2xl font-bold">Revtoo Offerwall</h2>
            <p className="opacity-70 mt-2">
              Complete offers and earn rewards
            </p>
          </button>

          <div className="bg-gray-100 p-6 rounded-2xl opacity-50">
            <h2 className="text-2xl font-bold">CPX Research</h2>
            <p className="mt-2">Coming Soon</p>
          </div>

          <div className="bg-gray-100 p-6 rounded-2xl opacity-50">
            <h2 className="text-2xl font-bold">AdGate</h2>
            <p className="mt-2">Coming Soon</p>
          </div>

        </div>
      )}

      {selectedWall === 'revtoo' && (
        <div className="w-full h-screen mt-4">

          <button
            onClick={() => setSelectedWall('')}
            className="mb-4 px-4 py-2 bg-black text-white rounded-xl"
          >
            Back
          </button>

          <iframe
            src={revtooUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            allow="clipboard-write"
          />

        </div>
      )}

    </div>
  );
};