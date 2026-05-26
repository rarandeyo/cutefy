import { Header } from "./Header";
import { WizardSteps } from "./WizardSteps";
import type { TrackWithAddedAt } from "@/shared/lib/spotify";

type MainContentProps = {
  initialTracks: readonly TrackWithAddedAt[];
};

export const MainContent: React.FC<MainContentProps> = ({ initialTracks }) => (
  <div className="mx-auto flex h-screen max-w-2xl flex-col overflow-hidden p-4 md:p-8">
    <Header />
    <WizardSteps initialTracks={initialTracks} />
  </div>
);
