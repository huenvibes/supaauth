import { useAuth } from '../AuthContext';

export const Offerwall = () => {
  const { user } = useAuth();

  if (!user) return null;

  const offerwallUrl =
    `https://revtoo.com/offerwall/tqn4bgj90i24acqrj36n39bp3l40g2/${user.id}`;

  return (
    <div className="w-full h-screen">
      <iframe
        src={offerwallUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
        allow="clipboard-write"
      />
    </div>
  );
};