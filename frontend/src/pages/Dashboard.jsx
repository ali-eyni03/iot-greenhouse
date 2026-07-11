import { usePlants } from '../context/PlantsContext';
import { PlantCard } from '../components/PlantCard';
import { ConnectionBadge } from '../components/ConnectionBadge';
import { ThemeToggle } from '../components/ThemeToggle';

export function Dashboard() {
  const { plants, loading, error, connected } = usePlants();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink-soft dark:text-ink-soft-dark font-mono text-sm">
          در حال بارگذاری گیاهان...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-brick dark:text-brick-dark font-medium mb-2">
            اتصال به سرور برقرار نشد
          </p>
          <p className="text-ink-soft dark:text-ink-soft-dark text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-8 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink dark:text-ink-dark">گلخانه هوشمند</h1>
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark mt-1">۳ گیاه تحت پایش</p>
        </div>
        <div className="flex items-center gap-4">
          <ConnectionBadge connected={connected} />
          <ThemeToggle />
        </div>
      </header>

      {plants.length === 0 ? (
        <div className="text-center py-16 text-ink-soft dark:text-ink-soft-dark">
          هنوز گیاهی ثبت نشده است.
        </div>
      ) : (
        <div className="space-y-4">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      )}
    </div>
  );
}
