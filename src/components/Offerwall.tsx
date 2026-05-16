import { useState } from 'react';
import { useAuth } from '../AuthContext';
import {
  Gift,
  PlayCircle,
  Coins,
  Rocket,
  ArrowLeft
} from 'lucide-react';

export const Offerwall = () => {
  const { user } = useAuth();
  const [selectedWall, setSelectedWall] = useState('');
  const [comingSoon, setComingSoon] = useState('');

  if (!user) return null;

  const revtooUrl =
    `https://revtoo.com/offerwall/tqn4bgj90i24acqrj36n39bp3l40g2/${user.id}`;

  const walls = [
    {
      id: 'revtoo',
      title: 'Revtoo',
      desc: 'High paying offerwall with surveys and apps',
      icon: <Rocket className="w-7 h-7" />
    },
    {
      id: 'cpx',
      title: 'CPX Research',
      desc: 'Complete surveys and earn instantly',
      icon: <Coins className="w-7 h-7" />
    },
    {
      id: 'adgate',
      title: 'AdGate Media',
      desc: 'Apps, games and advertiser offers',
      icon: <Gift className="w-7 h-7" />
    },
    {
      id: 'ayet',
      title: 'Ayet Studios',
      desc: 'Mobile game rewards and app installs',
      icon: <PlayCircle className="w-7 h-7" />
    },
    {
      id: 'lootably',
      title: 'Lootably',
      desc: 'Videos, surveys and bonus rewards',
      icon: <Coins className="w-7 h-7" />
    },
    {
      id: 'timewall',
      title: 'TimeWall',
      desc: 'Earn by completing micro tasks',
      icon: <Gift className="w-7 h-7" />
    }
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">

      {!selectedWall && (
        <>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#1a1a1a]">
              Offerwalls
            </h1>

            <p className="text-gray-500 mt-2">
              Complete offers, surveys and tasks to earn rewards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

            {walls.map((wall) => (
              <button
                key={wall.id}
                onClick={() => {
                  if (wall.id === 'revtoo') {
                    setSelectedWall('revtoo');
                  } else {
                    alert(`${wall.title} coming soon`);
                    setComingSoon(wall.title);
                  }
                }}
                className="bg-white rounded-3xl p-6 border border-gray-200 hover:border-black transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-xl text-left"
              >

                <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center mb-5">
                  {wall.icon}
                </div>

                <h2 className="text-2xl font-bold text-[#1a1a1a]">
                  {wall.title}
                </h2>

                <p className="text-gray-500 mt-3 leading-relaxed">
                  {wall.desc}
                </p>

                <div className="mt-6 flex items-center justify-between">

                  <span className="text-sm font-medium text-gray-400">
                    Start Earning
                  </span>

                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center">
                    →
                  </div>

                </div>

              </button>
            ))}

          </div>
        </>
      )}

      {selectedWall === 'revtoo' && (
        {comingSoon && (
  <div className="w-full h-screen">

    <div className="flex items-center justify-between mb-5">

      <button
        onClick={() => setComingSoon('')}
        className="flex items-center gap-2 px-5 py-3 bg-black text-white rounded-2xl"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div>
        <h2 className="text-2xl font-bold">
          {comingSoon}
        </h2>

        <p className="text-gray-500 text-sm">
          Offerwall integration coming soon
        </p>
      </div>

    </div>

    <div className="w-full h-[90vh] bg-white rounded-3xl border border-gray-200 shadow-lg flex items-center justify-center">

      <div className="text-center">

        <h1 className="text-5xl font-bold mb-4">
          Coming Soon
        </h1>

        <p className="text-gray-500 text-lg">
          This offerwall will be available soon.
        </p>

      </div>

    </div>

  </div>
)}
        <div className="w-full h-screen">

          <div className="flex items-center justify-between mb-5">

            <button
              onClick={() => setSelectedWall('')}
              className="flex items-center gap-2 px-5 py-3 bg-black text-white rounded-2xl hover:opacity-90"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>

            <div>
              <h2 className="text-2xl font-bold">
                Revtoo Offerwall
              </h2>

              <p className="text-gray-500 text-sm">
                Complete offers and earn rewards
              </p>
            </div>

          </div>

          <div className="w-full h-[90vh] bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-lg">

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

        </div>
      )}

    </div>
  );
};