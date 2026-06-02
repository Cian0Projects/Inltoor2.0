import InteractiveDraggableBeam from "./components/InteractiveDraggableBeam";

export const metadata = {
  title: 'Beam Calculator | Inltoor',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <InteractiveDraggableBeam />
    </main>
  );
}
